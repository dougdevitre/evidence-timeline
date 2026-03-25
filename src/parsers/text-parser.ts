/**
 * @module parsers/text-parser
 *
 * Parses plain text evidence including text message exports,
 * chat logs, and transcripts. Detects message boundaries,
 * timestamps, and speaker attribution automatically.
 */

import type { EvidenceItem } from '../types';

/** Options for configuring the text parser behavior. */
export interface TextParseOptions {
  /** Label for the evidence source (e.g. 'text-messages', 'chat-log') */
  source?: string;
  /** Timestamp format hint: 'bracketed-timestamp' | 'iso' | 'natural' | 'auto' */
  format?: 'bracketed-timestamp' | 'iso' | 'natural' | 'auto';
  /** Timezone to assume when timestamps lack offset info */
  timezone?: string;
}

/** A single message extracted from a chat/text export. */
export interface ParsedMessage {
  timestamp: Date | null;
  speaker: string | null;
  content: string;
  lineNumber: number;
}

/**
 * TextParser handles plain-text evidence such as exported text messages,
 * chat logs, and transcribed conversations. It detects timestamps, speaker
 * names, and message boundaries to produce structured EvidenceItem records.
 */
export class TextParser {
  /** Common timestamp patterns used in chat exports */
  private static readonly PATTERNS = {
    bracketed: /\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?)\]/,
    iso: /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)/,
    usDate: /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    natural: /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4})/i,
  };

  /** Speaker pattern: "Name:" at start of line or after timestamp */
  private static readonly SPEAKER_PATTERN = /^([A-Z][a-zA-Z\s.'-]{1,40}):\s/;

  /**
   * Parse raw text content into a structured EvidenceItem.
   *
   * @param content - Raw text content (chat export, transcript, etc.)
   * @param options - Parser configuration options
   * @returns Parsed evidence item with metadata
   */
  async parse(content: string, options: TextParseOptions = {}): Promise<EvidenceItem> {
    const source = options.source ?? 'text-import';
    const messages = this.splitMessages(content, options.format ?? 'auto');

    const parties = this.extractParties(content);
    const dates = this.extractDates(content);

    return {
      id: this.generateId(),
      type: 'text',
      source,
      uploadedAt: new Date(),
      rawContent: content,
      metadata: {
        messageCount: messages.length,
        parties,
        dateRange: dates.length > 0
          ? { earliest: dates[0], latest: dates[dates.length - 1] }
          : null,
        format: options.format ?? 'auto',
        parsedMessages: messages,
      },
    };
  }

  /**
   * Extract all date/timestamp references from text content.
   *
   * @param content - Raw text to scan for dates
   * @returns Array of Date objects found, sorted chronologically
   */
  extractDates(content: string): Date[] {
    const dates: Date[] = [];

    for (const pattern of Object.values(TextParser.PATTERNS)) {
      const regex = new RegExp(pattern.source, pattern.flags + 'g');
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        const parsed = new Date(match[1]);
        if (!isNaN(parsed.getTime())) {
          dates.push(parsed);
        }
      }
    }

    return dates.sort((a, b) => a.getTime() - b.getTime());
  }

  /**
   * Extract unique party/speaker names from text content.
   *
   * @param content - Raw text to scan for speaker names
   * @returns Array of unique party names found
   */
  extractParties(content: string): string[] {
    const parties = new Set<string>();

    for (const line of content.split('\n')) {
      // Strip leading timestamp if present
      const stripped = line
        .replace(TextParser.PATTERNS.bracketed, '')
        .replace(TextParser.PATTERNS.iso, '')
        .trim();

      const speakerMatch = stripped.match(TextParser.SPEAKER_PATTERN);
      if (speakerMatch) {
        parties.add(speakerMatch[1].trim());
      }
    }

    return Array.from(parties);
  }

  /**
   * Split raw content into individual messages based on format.
   */
  private splitMessages(
    content: string,
    format: TextParseOptions['format'],
  ): ParsedMessage[] {
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    const messages: ParsedMessage[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const timestamp = this.detectTimestamp(line, format);
      const stripped = line
        .replace(TextParser.PATTERNS.bracketed, '')
        .replace(TextParser.PATTERNS.iso, '')
        .trim();
      const speakerMatch = stripped.match(TextParser.SPEAKER_PATTERN);

      messages.push({
        timestamp,
        speaker: speakerMatch ? speakerMatch[1].trim() : null,
        content: speakerMatch ? stripped.slice(speakerMatch[0].length) : stripped,
        lineNumber: i + 1,
      });
    }

    return messages;
  }

  /**
   * Detect a timestamp in a single line of text.
   */
  private detectTimestamp(
    line: string,
    format: TextParseOptions['format'],
  ): Date | null {
    const patterns =
      format === 'bracketed-timestamp'
        ? [TextParser.PATTERNS.bracketed]
        : format === 'iso'
          ? [TextParser.PATTERNS.iso]
          : Object.values(TextParser.PATTERNS);

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) return date;
      }
    }

    return null;
  }

  /** Generate a unique evidence item ID. */
  private generateId(): string {
    return `ev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

/** Backwards-compatible function export */
export async function parseText(content: string): Promise<EvidenceItem> {
  const parser = new TextParser();
  return parser.parse(content);
}
