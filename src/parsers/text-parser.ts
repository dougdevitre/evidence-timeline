/**
 * @module parsers/text-parser
 *
 * Parses plain text evidence including text message exports,
 * chat logs, and transcripts. Detects message boundaries,
 * timestamps, and speaker attribution automatically.
 */

import type { EvidenceItem } from '../types';

export async function parseText(_content: string): Promise<EvidenceItem> {
  // TODO: Implement text/chat message parsing with timestamp detection
  throw new Error('Not yet implemented');
}
