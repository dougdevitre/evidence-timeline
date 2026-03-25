/**
 * @module types
 *
 * Core type definitions for the Evidence Timeline Builder.
 * Includes interfaces for evidence items, timeline events,
 * parties, tags, and export configurations.
 */

export interface EvidenceItem {
  id: string;
  type: 'text' | 'email' | 'pdf' | 'image';
  source: string;
  uploadedAt: Date;
  rawContent: string;
  metadata: Record<string, unknown>;
}

export interface TimelineEvent {
  id: string;
  evidenceId: string;
  date: Date;
  parties: string[];
  category: string;
  summary: string;
  tags: string[];
}

export interface ExportConfig {
  format: 'pdf' | 'csv' | 'print';
  dateRange?: { start: Date; end: Date };
  includeParties?: string[];
  includeCategories?: string[];
}
