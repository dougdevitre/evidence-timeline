/**
 * @module parsers/pdf-parser
 *
 * Extracts text content and metadata from PDF documents.
 * Handles scanned PDFs via OCR fallback, multi-page documents,
 * and preserves structural information (headers, tables, lists).
 */

import type { EvidenceItem } from '../types';

export async function parsePdf(_filePath: string): Promise<EvidenceItem> {
  // TODO: Implement PDF text extraction with OCR fallback
  throw new Error('Not yet implemented');
}
