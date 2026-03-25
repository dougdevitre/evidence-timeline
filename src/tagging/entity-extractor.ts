/**
 * @module tagging/entity-extractor
 *
 * Uses NLP to extract named entities from parsed evidence.
 * Identifies people, organizations, locations, and legal terms.
 * Links entities across multiple evidence items to build
 * a unified party graph.
 */

export async function extractEntities(_text: string): Promise<string[]> {
  // TODO: Implement NLP entity extraction
  throw new Error('Not yet implemented');
}
