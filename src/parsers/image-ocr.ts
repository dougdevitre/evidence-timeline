/**
 * @module parsers/image-ocr
 *
 * Performs OCR (optical character recognition) on image evidence
 * such as screenshots, photographs of documents, and handwritten
 * notes. Extracts text, dates, and identifiable content.
 */

import type { EvidenceItem } from '../types';

export async function extractTextFromImage(_imagePath: string): Promise<EvidenceItem> {
  // TODO: Implement OCR with Tesseract or cloud vision API
  throw new Error('Not yet implemented');
}
