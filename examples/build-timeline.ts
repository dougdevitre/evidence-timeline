/**
 * Example: Build a timeline from evidence files
 *
 * Demonstrates how to parse evidence, extract entities,
 * and build an interactive timeline for court preparation.
 */

import { TextParser } from '../src/parsers/text-parser';
import { TimelineEngine } from '../src/timeline/engine';
import type { EvidenceItem, TimelineEvent, ExportConfig } from '../src/types';

// --- Step 1: Parse raw evidence ---

const parser = new TextParser();

const chatExport = `
[2024-01-15 09:32] Alice: Can we discuss the custody schedule?
[2024-01-15 09:45] Bob: I think every other weekend works.
[2024-02-01 14:20] Alice: You missed the pickup again on Saturday.
[2024-02-01 14:35] Bob: I was stuck at work, I texted you.
[2024-03-10 11:00] Alice: The school called -- they need both signatures.
`;

async function main() {
  // Parse the chat export into structured evidence
  const evidence: EvidenceItem = await parser.parse(chatExport, {
    source: 'text-messages',
    format: 'bracketed-timestamp',
  });

  console.log(`Parsed evidence: ${evidence.id}`);
  console.log(`  Type: ${evidence.type}`);
  console.log(`  Source: ${evidence.source}`);

  // --- Step 2: Extract dates and parties ---

  const dates = parser.extractDates(chatExport);
  console.log(`\nExtracted ${dates.length} dates:`);
  for (const d of dates) {
    console.log(`  ${d.toISOString()}`);
  }

  const parties = parser.extractParties(chatExport);
  console.log(`\nIdentified ${parties.length} parties:`);
  for (const p of parties) {
    console.log(`  ${p}`);
  }

  // --- Step 3: Build the timeline ---

  const engine = new TimelineEngine();

  // Add events extracted from the parsed evidence
  engine.addEvent({
    id: 'evt-001',
    evidenceId: evidence.id,
    date: new Date('2024-01-15'),
    parties: ['Alice', 'Bob'],
    category: 'communication',
    summary: 'Initial custody schedule discussion',
    tags: ['custody', 'schedule'],
  });

  engine.addEvent({
    id: 'evt-002',
    evidenceId: evidence.id,
    date: new Date('2024-02-01'),
    parties: ['Alice', 'Bob'],
    category: 'incident',
    summary: 'Missed custody pickup',
    tags: ['custody', 'missed-pickup'],
  });

  engine.addEvent({
    id: 'evt-003',
    evidenceId: evidence.id,
    date: new Date('2024-03-10'),
    parties: ['Alice', 'Bob'],
    category: 'communication',
    summary: 'School signature request requiring both parents',
    tags: ['school', 'co-parenting'],
  });

  // --- Step 4: Sort and filter ---

  const sorted = engine.sort();
  console.log(`\nTimeline (${sorted.length} events, chronological):`);
  for (const evt of sorted) {
    console.log(`  ${evt.date.toLocaleDateString()} - ${evt.summary}`);
  }

  const incidents = engine.filter({ categories: ['incident'] });
  console.log(`\nFiltered incidents: ${incidents.length}`);

  // --- Step 5: Render or export ---

  const exportConfig: ExportConfig = {
    format: 'pdf',
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31'),
    },
    includeParties: ['Alice', 'Bob'],
  };

  const rendered = engine.render(exportConfig);
  console.log(`\nRendered timeline for export: ${rendered.format}`);
  console.log(`  Events included: ${rendered.eventCount}`);
  console.log(`  Gaps detected: ${rendered.gaps.length}`);
}

main().catch(console.error);
