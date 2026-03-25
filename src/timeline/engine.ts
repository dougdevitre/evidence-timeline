/**
 * @module timeline/engine
 *
 * Core timeline engine that organizes tagged events into
 * a chronological, filterable data structure. Supports
 * clustering of related events, gap detection, and
 * multi-party narrative threading.
 */

import type { TimelineEvent, ExportConfig } from '../types';

/** Filter criteria for narrowing timeline events. */
export interface TimelineFilter {
  /** Include only events in this date range */
  dateRange?: { start: Date; end: Date };
  /** Include only events involving these parties */
  parties?: string[];
  /** Include only events in these categories */
  categories?: string[];
  /** Include only events with any of these tags */
  tags?: string[];
}

/** A cluster of related events grouped by proximity or topic. */
export interface EventCluster {
  id: string;
  label: string;
  events: TimelineEvent[];
  startDate: Date;
  endDate: Date;
}

/** A detected gap in the evidence timeline. */
export interface TimelineGap {
  after: TimelineEvent;
  before: TimelineEvent;
  durationDays: number;
}

/** Result from the render method, ready for export. */
export interface RenderResult {
  format: ExportConfig['format'];
  eventCount: number;
  events: TimelineEvent[];
  gaps: TimelineGap[];
  clusters: EventCluster[];
}

/**
 * TimelineEngine manages a collection of timeline events, providing
 * chronological sorting, filtering, clustering, and gap detection.
 */
export class TimelineEngine {
  private events: Map<string, TimelineEvent> = new Map();

  /**
   * Add a single event to the timeline.
   *
   * @param event - The timeline event to add
   * @throws If an event with the same ID already exists
   */
  addEvent(event: TimelineEvent): void {
    if (this.events.has(event.id)) {
      throw new Error(`Duplicate event ID: ${event.id}`);
    }
    this.events.set(event.id, event);
  }

  /**
   * Add multiple events at once.
   *
   * @param events - Array of timeline events to add
   */
  addEvents(events: TimelineEvent[]): void {
    for (const event of events) {
      this.addEvent(event);
    }
  }

  /**
   * Remove an event by ID.
   *
   * @param eventId - The ID of the event to remove
   * @returns true if the event was found and removed
   */
  removeEvent(eventId: string): boolean {
    return this.events.delete(eventId);
  }

  /**
   * Sort all events chronologically.
   *
   * @param direction - 'asc' (oldest first) or 'desc' (newest first)
   * @returns Sorted array of timeline events
   */
  sort(direction: 'asc' | 'desc' = 'asc'): TimelineEvent[] {
    const sorted = Array.from(this.events.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
    return direction === 'desc' ? sorted.reverse() : sorted;
  }

  /**
   * Filter events by the given criteria.
   *
   * @param filter - Filter criteria to apply
   * @returns Filtered array of timeline events
   */
  filter(filter: TimelineFilter): TimelineEvent[] {
    let results = Array.from(this.events.values());

    if (filter.dateRange) {
      const { start, end } = filter.dateRange;
      results = results.filter(
        (e) => e.date >= start && e.date <= end,
      );
    }

    if (filter.parties?.length) {
      const partySet = new Set(filter.parties.map((p) => p.toLowerCase()));
      results = results.filter((e) =>
        e.parties.some((p) => partySet.has(p.toLowerCase())),
      );
    }

    if (filter.categories?.length) {
      const catSet = new Set(filter.categories.map((c) => c.toLowerCase()));
      results = results.filter((e) => catSet.has(e.category.toLowerCase()));
    }

    if (filter.tags?.length) {
      const tagSet = new Set(filter.tags.map((t) => t.toLowerCase()));
      results = results.filter((e) =>
        e.tags.some((t) => tagSet.has(t.toLowerCase())),
      );
    }

    return results.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Detect gaps in the timeline exceeding a threshold.
   *
   * @param thresholdDays - Minimum gap in days to report (default: 14)
   * @returns Array of detected gaps
   */
  detectGaps(thresholdDays: number = 14): TimelineGap[] {
    const sorted = this.sort();
    const gaps: TimelineGap[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      const diffMs = next.date.getTime() - current.date.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays >= thresholdDays) {
        gaps.push({
          after: current,
          before: next,
          durationDays: Math.round(diffDays),
        });
      }
    }

    return gaps;
  }

  /**
   * Cluster related events by date proximity.
   *
   * @param windowDays - Events within this many days are clustered together
   * @returns Array of event clusters
   */
  cluster(windowDays: number = 7): EventCluster[] {
    const sorted = this.sort();
    if (sorted.length === 0) return [];

    const clusters: EventCluster[] = [];
    let current: TimelineEvent[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const evt = sorted[i];
      const diffDays =
        (evt.date.getTime() - prev.date.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays <= windowDays) {
        current.push(evt);
      } else {
        clusters.push(this.buildCluster(current, clusters.length));
        current = [evt];
      }
    }

    if (current.length > 0) {
      clusters.push(this.buildCluster(current, clusters.length));
    }

    return clusters;
  }

  /**
   * Prepare the timeline for rendering/export.
   *
   * @param config - Export configuration (format, date range, filters)
   * @returns Structured render result with events, gaps, and clusters
   */
  render(config: ExportConfig): RenderResult {
    const filter: TimelineFilter = {
      dateRange: config.dateRange,
      parties: config.includeParties,
      categories: config.includeCategories,
    };

    const events = this.filter(filter);
    const gaps = this.detectGaps();
    const clusters = this.cluster();

    return {
      format: config.format,
      eventCount: events.length,
      events,
      gaps,
      clusters,
    };
  }

  /** Get the total number of events in the timeline. */
  get size(): number {
    return this.events.size;
  }

  /** Build a cluster object from a group of events. */
  private buildCluster(events: TimelineEvent[], index: number): EventCluster {
    return {
      id: `cluster-${index}`,
      label: `Event group ${index + 1} (${events.length} events)`,
      events,
      startDate: events[0].date,
      endDate: events[events.length - 1].date,
    };
  }
}

/** Backwards-compatible function export. */
export function buildTimeline(events: TimelineEvent[]): TimelineEvent[] {
  const engine = new TimelineEngine();
  engine.addEvents(events);
  return engine.sort();
}
