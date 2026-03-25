/**
 * @module parsers/email-parser
 *
 * Parses email files (.eml, .msg) and email exports.
 * Extracts sender, recipients, dates, subject lines, body text,
 * and attachment references for timeline event creation.
 */

import type { EvidenceItem } from '../types';

export async function parseEmail(_emailSource: string): Promise<EvidenceItem> {
  // TODO: Implement email parsing with header extraction
  throw new Error('Not yet implemented');
}
