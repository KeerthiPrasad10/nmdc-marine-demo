# Resolve SDK

AI-powered troubleshooting API client for querying P&IDs and maintenance manuals.

## Installation

Copy the `index.ts` file to your project, or install from npm:

```bash
npm install @ifs/resolve-sdk
```

## Quick Start

```typescript
import { ResolveClient } from './resolve-sdk';

// Initialize with your API key
const client = new ResolveClient({ 
  apiKey: 'sk_live_...' 
});

// Simple query
const answer = await client.ask('How do I replace a pitot tube?');
console.log(answer);
```

## API Key

Get your API key from the Resolve app or generate via SQL:

```sql
SELECT * FROM generate_api_key('your-user-id'::uuid, 'My App');
```

## Methods

### Document Management

```typescript
// List all available documents
const docs = await client.listDocuments();
console.log(docs.manuals);      // [{id, title, total_pages}]
console.log(docs.pnid_projects); // [{id, name, total_drawings}]
```

### Knowledge Base Management

```typescript
// List knowledge bases
const kbs = await client.listKnowledgeBases();

// Create a knowledge base
const kb = await client.createKnowledgeBase({
  name: 'Aircraft Maintenance',
  description: 'Boeing 737 documentation',
  manual_ids: ['uuid-1', 'uuid-2'],
  project_ids: ['uuid-3']
});

// Update a knowledge base
await client.updateKnowledgeBase(kb.id, {
  manual_ids: ['uuid-1', 'uuid-2', 'uuid-4']
});

// Delete a knowledge base
await client.deleteKnowledgeBase(kb.id);
```

### Querying

```typescript
// Full query with options
const result = await client.query('altitude readings inconsistent', {
  knowledgeBaseId: 'kb-uuid',  // Optional: specific KB
  responseFormat: 'json'        // 'json' or 'text'
});

console.log(result.response);   // Structured response
console.log(result.sources);    // What was searched
console.log(result.latency_ms); // Response time

// Simple text answer
const answer = await client.ask('pitot tube replacement procedure');

// Image analysis
const result = await client.analyzeImage(base64Image, 'What is wrong with this?');
```

## Response Types

### JSON Format (default)

```typescript
{
  success: true,
  response: {
    type: 'info_message',  // or 'checklist', 'selection', etc.
    data: {
      title: 'Root Cause Analysis',
      message: 'Based on your Boeing 737 AMM...'
    }
  },
  sources: {
    pnids: [{tag: 'PITOT-CAPT', type: 'Instrument', drawing: '34-11'}],
    manuals: [{title: 'B737 AMM', page: 13}]
  },
  latency_ms: 2340
}
```

### Text Format

```typescript
{
  success: true,
  answer: 'Based on your Boeing 737 AMM Chapter 34...',
  sources: {...},
  latency_ms: 2340
}
```

## Error Handling

```typescript
try {
  const result = await client.query('...');
} catch (error) {
  console.error('API Error:', error.message);
  // "Invalid API key" | "Knowledge base not found" | etc.
}
```

## TypeScript Types

All types are exported:

```typescript
import type { 
  ResolveConfig,
  Document,
  DocumentList,
  KnowledgeBase,
  QueryResponse,
  Source 
} from './resolve-sdk';
```

