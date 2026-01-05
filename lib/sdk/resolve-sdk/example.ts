/**
 * Example usage of the Resolve SDK
 * 
 * Run with: npx ts-node example.ts
 */

import { ResolveClient } from './index';

const API_KEY = 'sk_live_YOUR_API_KEY_HERE';

async function main() {
  const client = new ResolveClient({ apiKey: API_KEY });

  console.log('=== Resolve SDK Example ===\n');

  // 1. List available documents
  console.log('1. Listing available documents...');
  const docs = await client.listDocuments();
  console.log(`   Found ${docs.manuals.length} manuals, ${docs.pnid_projects.length} P&ID projects\n`);

  // 2. Create a knowledge base (if we have documents)
  if (docs.manuals.length > 0) {
    console.log('2. Creating knowledge base...');
    const kb = await client.createKnowledgeBase({
      name: 'Demo KB',
      description: 'Created via SDK',
      manual_ids: docs.manuals.slice(0, 2).map(m => m.id)
    });
    console.log(`   Created KB: ${kb.name} (${kb.id})\n`);

    // 3. Query with the knowledge base
    console.log('3. Querying the knowledge base...');
    const result = await client.query('What maintenance procedures are documented?', {
      knowledgeBaseId: kb.id,
      responseFormat: 'text'
    });
    console.log(`   Answer: ${result.answer?.slice(0, 200)}...`);
    console.log(`   Latency: ${result.latency_ms}ms\n`);

    // 4. Clean up
    console.log('4. Cleaning up...');
    await client.deleteKnowledgeBase(kb.id);
    console.log('   KB deleted\n');
  } else {
    // Query without specific KB
    console.log('2. Querying (all documents)...');
    const answer = await client.ask('What is a pitot tube?');
    console.log(`   Answer: ${answer.slice(0, 200)}...\n`);
  }

  console.log('=== Done ===');
}

main().catch(console.error);

