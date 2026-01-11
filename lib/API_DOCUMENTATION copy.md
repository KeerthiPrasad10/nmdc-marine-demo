# Resolve API Documentation

## Overview

The Resolve API provides AI-powered troubleshooting and diagnostic capabilities for industrial equipment. External applications can query the API and receive structured UI responses that can be rendered natively.

## Base URL

```
POST https://[project-ref].supabase.co/functions/v1/troubleshoot-agent
```

## Authentication

All API calls require an API key passed in the request body:

```json
{
  "action": "query",
  "api_key": "your-api-key-here",
  "message": "..."
}
```

## Response Formats

The `response_format` parameter controls how responses are structured:

| Format | Description | Use Case |
|--------|-------------|----------|
| `json` (default) | Full wrapped response with metadata | Debugging, full control |
| `ui` | Clean `{type, data}` for direct UI rendering | **Recommended for apps** |
| `text` | Plain text answer only | Simple integrations |
| `html` | Styled HTML ready to embed | Web embeds, iframes |

---

## UI Response Types

When using `response_format: "ui"`, you receive structured data for rendering. Each response has:

```typescript
{
  type: UIType,      // The component type to render
  data: UIData,      // Component-specific data
}
```

### 1. `info_message` - General Information/RCA

Displays root cause analysis, recommendations, and structured information.

```typescript
{
  type: "info_message",
  data: {
    message: string,      // Formatted message with sections
    severity?: "info" | "warning" | "error" | "success",
    suggestions?: string[]  // Follow-up suggestions
  }
}
```

**Message Format (parse these sections):**
- `📚 KNOWLEDGE BASE SEARCH:` - What was found in documents
- `🔍 ROOT CAUSE ANALYSIS:` - Diagnostic reasoning
- `💡 RECOMMENDATION:` - Suggested actions

**Rendering:**
```jsx
// Parse message by emoji headers
const sections = parseMessageSections(data.message);
// Render each section with distinct styling
```

---

### 2. `selection` - Multiple Choice Options

Presents clickable options for user to select.

```typescript
{
  type: "selection",
  data: {
    question: string,           // Question/prompt text
    options: Array<{
      id: string,               // Unique identifier
      title: string,            // Main text
      subtitle?: string,        // Secondary description
      icon?: string,            // Icon name or emoji
      metadata?: object         // Additional data
    }>,
    allow_free_text?: boolean   // Allow typed response
  }
}
```

**Rendering:**
```jsx
<div className="selection-card">
  <h3>{data.question}</h3>
  {data.options.map(opt => (
    <button key={opt.id} onClick={() => sendMessage(opt.title)}>
      <span>{opt.title}</span>
      {opt.subtitle && <small>{opt.subtitle}</small>}
    </button>
  ))}
</div>
```

---

### 3. `checklist` - Troubleshooting Steps

Interactive checklist with priority and references.

```typescript
{
  type: "checklist",
  data: {
    title: string,
    description?: string,
    items: Array<{
      id: string,
      text: string,
      priority: "high" | "medium" | "low",
      reference?: string,    // Manual/page reference
      checked?: boolean
    }>
  }
}
```

**Rendering:**
```jsx
<div className="checklist">
  <h2>{data.title}</h2>
  {data.items.map(item => (
    <div key={item.id} className={`priority-${item.priority}`}>
      <input type="checkbox" />
      <span>{item.text}</span>
      {item.reference && <cite>{item.reference}</cite>}
    </div>
  ))}
</div>
```

---

### 4. `dynamic_form` - Work Orders, Invoices, Reports

Structured form with sections, fields, and optional line items.

```typescript
{
  type: "dynamic_form",
  data: {
    formType: "invoice" | "quote" | "report" | "work_order" | "custom",
    title: string,
    description?: string,
    metadata?: {
      documentNumber?: string,
      date?: string,
      dueDate?: string,
      status?: string
    },
    sections: Array<{
      id: string,
      title: string,
      description?: string,
      fields: Array<{
        id: string,
        label: string,
        type: "text" | "number" | "currency" | "date" | "select" | "textarea" | "checkbox" | "email" | "phone",
        value?: any,
        placeholder?: string,
        required?: boolean,
        options?: Array<{value: string, label: string}>,  // For select
        colspan?: number  // 1-4 for grid layout
      }>
    }>,
    lineItems?: {
      columns: Array<{key: string, label: string}>,
      rows: Array<{id: string, cells: Record<string, any>}>
    },
    totals?: Array<{
      label: string,
      value: number,
      type?: "subtotal" | "tax" | "discount" | "total"
    }>
  }
}
```

**Rendering:**
```jsx
<form onSubmit={handleSubmit}>
  <h1>{data.title}</h1>
  {data.sections.map(section => (
    <fieldset key={section.id}>
      <legend>{section.title}</legend>
      {section.fields.map(field => renderField(field))}
    </fieldset>
  ))}
  <button type="submit">Submit</button>
  <button type="button" onClick={exportPDF}>Export PDF</button>
</form>
```

---

### 5. `loto_procedure` - Lock Out Tag Out

Safety-critical isolation procedure with steps and verification.

```typescript
{
  type: "loto_procedure",
  data: {
    equipmentTag: string,
    equipmentName: string,
    location?: string,
    generatedAt: string,
    estimatedDuration: string,
    requiredPpe: string[],
    hazards: string[],
    isolationSteps: Array<{
      step: number,
      point: string,        // Equipment/valve tag
      pointType: string,    // "valve" | "breaker" | "disconnect"
      action: string,
      verification: string
    }>,
    verificationSteps: string[],
    reinstateSteps: string[],
    warnings?: string[]
  }
}
```

---

### 6. `work_order` - Maintenance Work Order

```typescript
{
  type: "work_order",
  data: {
    workOrderNumber?: string,
    equipmentTag: string,
    equipmentName: string,
    priority: "emergency" | "urgent" | "high" | "medium" | "low",
    workType: "corrective" | "preventive" | "inspection" | "modification",
    description: string,
    estimatedHours?: number,
    requiredParts?: Array<{partNumber: string, description: string, quantity: number}>,
    requiredTools?: string[],
    safetyNotes?: string[],
    procedureSteps?: string[],
    references?: Array<{title: string, page?: number}>
  }
}
```

---

### 7. `equipment_card` - Equipment Information

```typescript
{
  type: "equipment_card",
  data: {
    tag: string,
    name: string,
    type: string,
    status?: "running" | "stopped" | "faulted" | "maintenance",
    location?: string,
    specifications?: Record<string, string>,
    connectedEquipment?: Array<{tag: string, type: string}>,
    actions?: Array<{id: string, label: string, icon?: string}>
  }
}
```

---

### 8. `image_card` - Display Image

```typescript
{
  type: "image_card",
  data: {
    title: string,
    description?: string,
    image_url: string,
    source_document?: string,
    source_page?: number
  }
}
```

---

### 9. `research_result` - Research/Learning Content

```typescript
{
  type: "research_result",
  data: {
    question: string,
    answer: string,
    summary?: string,
    citations: Array<{
      source: string,
      page?: number,
      excerpt?: string
    }>,
    related_topics?: string[],
    confidence?: number  // 0-1
  }
}
```

---

### 10. `data_table` - Tabular Data

```typescript
{
  type: "data_table",
  data: {
    title: string,
    description?: string,
    columns: Array<{
      key: string,
      label: string,
      type?: "text" | "number" | "currency" | "date" | "boolean",
      sortable?: boolean
    }>,
    rows: Array<{
      id: string,
      cells: Record<string, any>
    }>,
    summary?: {
      label: string,
      values: Record<string, any>
    }
  }
}
```

---

### 11. `multi_response` - Multiple UI Components

When the agent returns multiple components (e.g., RCA + Options):

```typescript
{
  type: "multi_response",
  data: {
    responses: Array<UIResponse>  // Array of any above types
  }
}
```

**Rendering:**
```jsx
{data.responses.map((response, i) => (
  <DynamicRenderer key={i} response={response} />
))}
```

---

## Example API Calls

### Basic Query

```bash
curl -X POST https://[ref].supabase.co/functions/v1/troubleshoot-agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "query",
    "api_key": "sk-...",
    "message": "My pump is making a grinding noise",
    "response_format": "ui"
  }'
```

### Query with Image URL

```bash
curl -X POST https://[ref].supabase.co/functions/v1/troubleshoot-agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "query",
    "api_key": "sk-...",
    "message": "What is wrong with this pump?",
    "image_url": "https://example.com/pump-photo.jpg",
    "knowledge_base_id": "uuid-here",
    "response_format": "ui"
  }'
```

### List Knowledge Bases

```bash
curl -X POST https://[ref].supabase.co/functions/v1/troubleshoot-agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "list_knowledge_bases",
    "api_key": "sk-..."
  }'
```

---

## Rendering in Your App

### React Example

```tsx
import React from 'react';

interface UIResponse {
  type: string;
  data: any;
}

function ResolveRenderer({ response }: { response: UIResponse }) {
  switch (response.type) {
    case 'info_message':
      return <InfoMessage data={response.data} />;
    case 'selection':
      return <SelectionCard data={response.data} onSelect={handleSelect} />;
    case 'checklist':
      return <Checklist data={response.data} />;
    case 'dynamic_form':
      return <DynamicForm data={response.data} onSubmit={handleSubmit} />;
    case 'loto_procedure':
      return <LOTODocument data={response.data} />;
    case 'work_order':
      return <WorkOrderForm data={response.data} />;
    case 'multi_response':
      return (
        <>
          {response.data.responses.map((r, i) => (
            <ResolveRenderer key={i} response={r} />
          ))}
        </>
      );
    default:
      return <pre>{JSON.stringify(response.data, null, 2)}</pre>;
  }
}
```

---

## Conversation History & Sessions

The API supports two modes for handling conversation context:

### Stateless Mode (`action: "query"`)

Each request is independent with **no conversation memory**:

```javascript
// Request 1
POST { action: "query", api_key: "...", message: "Pump making noise" }
→ RCA + diagnostic questions

// Request 2 - NO CONTEXT from Request 1!
POST { action: "query", api_key: "...", message: "It happens at startup" }
→ Agent starts fresh, doesn't know about the pump
```

⚠️ **Use `query` only for single-turn Q&A, not multi-step troubleshooting.**

---

### Stateful Mode (Sessions) - Recommended

Sessions maintain full conversation history in the database:

```
┌─────────────────────────────────────────────────────────────┐
│  1. CREATE SESSION                                          │
│     POST { action: "create_session", knowledge_base_id }    │
│     → Returns session_id                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. USER DESCRIBES ISSUE                                    │
│     POST { action: "send_message", session_id, message }    │
│     → Agent searches KB, provides RCA + diagnostic question │
│     → Message stored in troubleshoot_messages table         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. USER ANSWERS DIAGNOSTIC QUESTION                        │
│     POST { action: "send_message", session_id, message }    │
│     → Agent LOADS previous messages from DB                 │
│     → Continues diagnosis with full context                 │
│     → Narrows down to solution                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. SOLUTION / WORK ORDER / LOTO                            │
│     Agent provides checklist, work order, or LOTO           │
│     User can request additional outputs                     │
└─────────────────────────────────────────────────────────────┘
```

### Complete Session Example

```javascript
const RESOLVE_API = 'https://[ref].supabase.co/functions/v1/troubleshoot-agent';

// Helper function
async function resolveAPI(body) {
  const res = await fetch(RESOLVE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

// ═══════════════════════════════════════════════════════════
// STEP 1: Create a session (do this once per troubleshooting flow)
// ═══════════════════════════════════════════════════════════
const { session } = await resolveAPI({
  action: 'create_session',
  api_key: 'sk-your-api-key',
  title: 'Pump Troubleshooting',
  knowledge_base_id: 'kb-uuid-here'  // Optional but recommended
});

const sessionId = session.id;
console.log('Session created:', sessionId);

// ═══════════════════════════════════════════════════════════
// STEP 2: User describes the problem
// ═══════════════════════════════════════════════════════════
const response1 = await resolveAPI({
  action: 'send_message',
  session_id: sessionId,
  message: 'Pump is making a grinding noise and there is a leak near the seal'
});

// Response: multi_response with:
// - info_message: RCA explaining possible causes (bearing failure, seal damage)
// - selection: Diagnostic questions to narrow down

renderUI(response1);  // Show to user

// ═══════════════════════════════════════════════════════════
// STEP 3: User answers diagnostic question (clicks an option)
// ═══════════════════════════════════════════════════════════
// User clicked: "Noise started suddenly after maintenance"
const response2 = await resolveAPI({
  action: 'send_message',
  session_id: sessionId,  // SAME session - history maintained!
  message: 'Noise started suddenly after maintenance'
});

// Agent now knows:
// - Grinding noise + leak (from step 2)
// - Started after maintenance (from step 3)
// → Diagnoses: Possible misalignment or improper reassembly

renderUI(response2);

// ═══════════════════════════════════════════════════════════
// STEP 4: User requests specific output
// ═══════════════════════════════════════════════════════════
const response3 = await resolveAPI({
  action: 'send_message',
  session_id: sessionId,
  message: 'Generate a work order for this'
});

// Agent generates work order with FULL CONTEXT:
// - Equipment: Pump with grinding noise
// - Issue: Post-maintenance misalignment
// - Recommended action: Realign coupling, check bearing

if (response3.type === 'dynamic_form') {
  renderWorkOrderForm(response3.data);
}

// ═══════════════════════════════════════════════════════════
// STEP 5: User can continue asking for more outputs
// ═══════════════════════════════════════════════════════════
const response4 = await resolveAPI({
  action: 'send_message',
  session_id: sessionId,
  message: 'Also generate LOTO procedure'
});

// Agent generates LOTO for the same pump
if (response4.type === 'loto_procedure') {
  renderLOTODocument(response4.data);
}
```

### How History is Stored

Each message is saved to the `troubleshoot_messages` table:

| Column | Description |
|--------|-------------|
| `session_id` | Links to the session |
| `role` | `user` or `assistant` |
| `content` | Message text |
| `ui_type` | Type of UI response |
| `ui_data` | Full structured response |
| `created_at` | Timestamp |

When you call `send_message`, the agent:
1. Loads ALL previous messages for that session
2. Includes them in the AI context
3. Generates a response aware of the full conversation
4. Saves the new messages to the database

### Retrieving Session History

```javascript
// Get full session with all messages
const { session, messages } = await resolveAPI({
  action: 'get_session',
  session_id: sessionId
});

// messages is an array of all exchanges
messages.forEach(msg => {
  console.log(`${msg.role}: ${msg.content}`);
  if (msg.ui_data) {
    renderUI(msg.ui_data);
  }
});
```

### Listing User Sessions

```javascript
// List all sessions for the API key owner
const { sessions } = await resolveAPI({
  action: 'list_sessions',
  api_key: 'sk-your-api-key'
});

// sessions = [{ id, title, created_at, knowledge_base_id }, ...]
```

---

## Error Handling

All errors return:

```typescript
{
  success: false,
  error: string
}
```

Common error codes:
- `401` - Invalid or missing API key
- `400` - Invalid request parameters
- `404` - Resource not found (session, knowledge base)
- `500` - Server error

---

## Rate Limits

- 100 requests per minute per API key
- 10 concurrent requests per API key
- Image analysis: 20 per minute

---

## Best Practices

1. **Use `response_format: "ui"`** for native app rendering
2. **Cache knowledge base IDs** - don't fetch list on every query
3. **Use sessions** for multi-turn conversations
4. **Handle `multi_response`** - agent often returns RCA + options together
5. **Parse `info_message` sections** by emoji headers for structured display
6. **Implement all UI types** - don't fall back to raw JSON for unknown types

---

## Implementing Dynamic UI Rendering

### Universal Renderer Pattern

Create a single renderer component that handles all UI types:

```typescript
// types.ts
interface UIResponse {
  type: string;
  data: any;
}

// ResolveRenderer.tsx
function ResolveRenderer({ response, onAction }: { 
  response: UIResponse; 
  onAction: (action: string, params?: any) => void;
}) {
  const { type, data } = response;
  
  // Handle multi_response by rendering each child
  if (type === 'multi_response' && data.responses) {
    return (
      <div className="space-y-4">
        {data.responses.map((r: UIResponse, i: number) => (
          <ResolveRenderer key={i} response={r} onAction={onAction} />
        ))}
      </div>
    );
  }
  
  switch (type) {
    case 'info_message':
      return <InfoMessage data={data} />;
    case 'selection':
      return <SelectionCard data={data} onSelect={(opt) => onAction('send_message', opt.title)} />;
    case 'checklist':
      return <Checklist data={data} />;
    case 'dynamic_form':
      return <DynamicForm data={data} onSubmit={(values) => onAction('form_submit', values)} />;
    case 'work_order':
      return <WorkOrderForm data={data} />;
    case 'loto_procedure':
      return <LOTODocument data={data} />;
    case 'equipment_card':
      return <EquipmentCard data={data} />;
    case 'image_card':
      return <ImageCard data={data} />;
    case 'data_table':
      return <DataTable data={data} />;
    case 'research_result':
      return <ResearchResult data={data} />;
    case 'error_message':
      return <ErrorMessage data={data} />;
    default:
      console.warn('Unknown UI type:', type);
      return <pre>{JSON.stringify(data, null, 2)}</pre>;
  }
}
```

### Parsing `info_message` Sections

The agent formats `info_message` with specific emoji headers. Parse these for structured display:

```typescript
interface ParsedSection {
  type: 'knowledge' | 'rca' | 'recommendation' | 'text';
  title: string;
  content: string;
}

function parseInfoMessage(message: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  
  // Split by emoji headers
  const patterns = [
    { emoji: '📚', type: 'knowledge' as const, title: 'Knowledge Base Search' },
    { emoji: '🔍', type: 'rca' as const, title: 'Root Cause Analysis' },
    { emoji: '💡', type: 'recommendation' as const, title: 'Recommendation' },
  ];
  
  let remaining = message;
  
  for (const { emoji, type, title } of patterns) {
    const headerPattern = new RegExp(`${emoji}\\s*[^:]*:?\\s*`, 'i');
    const match = remaining.match(headerPattern);
    
    if (match) {
      const startIndex = remaining.indexOf(match[0]);
      const nextEmojiIndex = findNextEmoji(remaining, startIndex + match[0].length);
      
      const content = remaining
        .slice(startIndex + match[0].length, nextEmojiIndex)
        .trim();
      
      if (content) {
        sections.push({ type, title, content });
      }
      
      remaining = remaining.slice(0, startIndex) + remaining.slice(nextEmojiIndex);
    }
  }
  
  // Any remaining text goes to a generic section
  if (remaining.trim()) {
    sections.push({ type: 'text', title: 'Details', content: remaining.trim() });
  }
  
  return sections;
}

// Render with distinct styling
function InfoMessage({ data }: { data: { message: string; severity?: string } }) {
  const sections = parseInfoMessage(data.message);
  
  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        <div key={i} className={`p-4 rounded-lg ${getSectionStyle(section.type)}`}>
          <h3 className="font-semibold mb-2">{section.title}</h3>
          <div className="prose">{section.content}</div>
        </div>
      ))}
    </div>
  );
}

function getSectionStyle(type: string): string {
  switch (type) {
    case 'knowledge': return 'bg-blue-500/10 border-l-4 border-blue-500';
    case 'rca': return 'bg-amber-500/10 border-l-4 border-amber-500';
    case 'recommendation': return 'bg-green-500/10 border-l-4 border-green-500';
    default: return 'bg-gray-500/10';
  }
}
```

### Handling Data Type Variations

The agent may return fields in different formats. Always normalize:

```typescript
// Normalize array fields - handle string, array, or undefined
function normalizeArray(value: unknown): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value ? [value] : [];
  return [];
}

// Normalize string fields - handle string, array, or undefined  
function normalizeString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(', ');
  return '';
}

// Example usage in WorkOrder component
function WorkOrderForm({ data }: { data: WorkOrderData }) {
  const symptoms = normalizeString(data.symptoms);
  const requiredParts = normalizeArray(data.requiredParts);
  const requiredTools = normalizeArray(data.requiredTools);
  const safetyNotes = normalizeArray(data.safetyNotes);
  
  // Now all fields are guaranteed correct type
}
```

---

## Implementing PDF Export

### PDF Export Strategy

For each UI type, generate HTML and use the browser's print functionality:

```typescript
interface ExportOptions {
  title: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
}

function exportToPDF(htmlContent: string, options: ExportOptions) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${options.title}</title>
      <style>
        @page { 
          size: ${options.orientation || 'portrait'}; 
          margin: 1in; 
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #1a1a1a;
        }
        h1 { font-size: 24pt; margin-bottom: 8pt; }
        h2 { font-size: 16pt; margin-top: 16pt; border-bottom: 1px solid #ccc; }
        table { width: 100%; border-collapse: collapse; margin: 16pt 0; }
        th, td { border: 1px solid #ccc; padding: 8pt; text-align: left; }
        th { background: #f5f5f5; }
        .priority-high { color: #dc2626; font-weight: bold; }
        .priority-medium { color: #d97706; }
        .priority-low { color: #059669; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12pt; }
        .checklist-item { display: flex; gap: 8pt; margin: 8pt 0; }
        .checkbox { width: 16pt; height: 16pt; border: 1px solid #666; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
```

### Work Order PDF Template

```typescript
function generateWorkOrderPDF(data: WorkOrderData): string {
  const symptoms = normalizeString(data.symptoms);
  const parts = normalizeArray(data.requiredParts);
  const tools = normalizeArray(data.requiredTools);
  const safety = normalizeArray(data.safetyNotes);
  const steps = normalizeArray(data.procedureSteps);
  
  return `
    <h1>Work Order ${data.workOrderNumber || 'DRAFT'}</h1>
    
    <table>
      <tr>
        <td><strong>Equipment Tag:</strong></td>
        <td>${data.equipmentTag}</td>
        <td><strong>Priority:</strong></td>
        <td class="priority-${data.priority}">${data.priority.toUpperCase()}</td>
      </tr>
      <tr>
        <td><strong>Work Type:</strong></td>
        <td>${data.workType}</td>
        <td><strong>Est. Hours:</strong></td>
        <td>${data.estimatedHours || 'TBD'}</td>
      </tr>
    </table>
    
    <h2>Description</h2>
    <p>${data.description}</p>
    
    ${symptoms ? `
      <h2>Reported Symptoms</h2>
      <p>${symptoms}</p>
    ` : ''}
    
    ${parts.length > 0 ? `
      <h2>Required Parts</h2>
      <ul>${parts.map(p => `<li>${p}</li>`).join('')}</ul>
    ` : ''}
    
    ${tools.length > 0 ? `
      <h2>Required Tools</h2>
      <ul>${tools.map(t => `<li>${t}</li>`).join('')}</ul>
    ` : ''}
    
    ${safety.length > 0 ? `
      <h2>Safety Requirements</h2>
      <div class="warning">
        <ul>${safety.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
    ` : ''}
    
    ${steps.length > 0 ? `
      <h2>Procedure Steps</h2>
      <ol>${steps.map(s => `<li>${s}</li>`).join('')}</ol>
    ` : ''}
    
    <div style="margin-top: 48pt; border-top: 1px solid #ccc; padding-top: 16pt;">
      <table style="border: none;">
        <tr style="border: none;">
          <td style="border: none; width: 50%;">
            <strong>Performed By:</strong><br>
            <div style="border-bottom: 1px solid #666; height: 24pt; margin-top: 8pt;"></div>
          </td>
          <td style="border: none; width: 50%;">
            <strong>Date:</strong><br>
            <div style="border-bottom: 1px solid #666; height: 24pt; margin-top: 8pt;"></div>
          </td>
        </tr>
      </table>
    </div>
    
    <p style="font-size: 9pt; color: #666; margin-top: 24pt;">
      Generated on ${new Date().toLocaleString()}
    </p>
  `;
}
```

### LOTO Procedure PDF Template

```typescript
function generateLOTOPDF(data: LOTOData): string {
  return `
    <div class="warning" style="margin-bottom: 24pt;">
      <strong>⚠️ LOCK OUT / TAG OUT PROCEDURE</strong><br>
      This is a safety-critical document. Verify all isolation points before work.
    </div>
    
    <h1>LOTO: ${data.equipmentTag}</h1>
    <p><strong>Equipment:</strong> ${data.equipmentName}</p>
    <p><strong>Location:</strong> ${data.location || 'See P&ID'}</p>
    <p><strong>Estimated Duration:</strong> ${data.estimatedDuration}</p>
    
    <h2>Identified Hazards</h2>
    <ul class="warning">
      ${data.hazards.map(h => `<li>${h}</li>`).join('')}
    </ul>
    
    <h2>Required PPE</h2>
    <ul>${data.requiredPpe.map(p => `<li>${p}</li>`).join('')}</ul>
    
    <h2>Isolation Steps</h2>
    <table>
      <thead>
        <tr>
          <th>Step</th>
          <th>Isolation Point</th>
          <th>Type</th>
          <th>Action</th>
          <th>Verification</th>
          <th>Initials</th>
        </tr>
      </thead>
      <tbody>
        ${data.isolationSteps.map(step => `
          <tr>
            <td>${step.step}</td>
            <td><strong>${step.point}</strong></td>
            <td>${step.pointType}</td>
            <td>${step.action}</td>
            <td>${step.verification}</td>
            <td style="width: 60pt;"></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <h2>Verification Steps</h2>
    <ol>${data.verificationSteps.map(v => `<li>${v}</li>`).join('')}</ol>
    
    <h2>Reinstatement Steps</h2>
    <ol>${data.reinstateSteps.map(r => `<li>${r}</li>`).join('')}</ol>
    
    ${data.warnings?.length ? `
      <div class="warning">
        <strong>Additional Warnings:</strong>
        <ul>${data.warnings.map(w => `<li>${w}</li>`).join('')}</ul>
      </div>
    ` : ''}
    
    <div style="margin-top: 48pt;">
      <table style="border: none;">
        <tr style="border: none;">
          <td style="border: none;"><strong>Isolated By:</strong></td>
          <td style="border: none; border-bottom: 1px solid #666; width: 150pt;"></td>
          <td style="border: none;"><strong>Date/Time:</strong></td>
          <td style="border: none; border-bottom: 1px solid #666; width: 150pt;"></td>
        </tr>
        <tr style="border: none;"><td style="border: none;" colspan="4">&nbsp;</td></tr>
        <tr style="border: none;">
          <td style="border: none;"><strong>Reinstated By:</strong></td>
          <td style="border: none; border-bottom: 1px solid #666;"></td>
          <td style="border: none;"><strong>Date/Time:</strong></td>
          <td style="border: none; border-bottom: 1px solid #666;"></td>
        </tr>
      </table>
    </div>
  `;
}
```

### Checklist PDF Template

```typescript
function generateChecklistPDF(data: ChecklistData): string {
  return `
    <h1>${data.title}</h1>
    ${data.description ? `<p>${data.description}</p>` : ''}
    
    <table>
      <thead>
        <tr>
          <th style="width: 30pt;">✓</th>
          <th>Step</th>
          <th style="width: 80pt;">Priority</th>
          <th>Reference</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map((item, i) => `
          <tr>
            <td><div class="checkbox"></div></td>
            <td>${i + 1}. ${item.text}</td>
            <td class="priority-${item.priority}">${item.priority}</td>
            <td>${item.reference || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div style="margin-top: 48pt;">
      <p><strong>Completed By:</strong> _________________________ <strong>Date:</strong> _____________</p>
    </div>
  `;
}
```

### Dynamic Form PDF Template

```typescript
function generateDynamicFormPDF(data: DynamicFormData): string {
  const sectionsHtml = data.sections.map(section => `
    <h2>${section.title}</h2>
    ${section.description ? `<p style="color: #666;">${section.description}</p>` : ''}
    <table>
      ${section.fields.map(field => `
        <tr>
          <td style="width: 40%; font-weight: 600;">${field.label}</td>
          <td>${formatFieldValue(field)}</td>
        </tr>
      `).join('')}
    </table>
  `).join('');
  
  const lineItemsHtml = data.lineItems ? `
    <h2>Line Items</h2>
    <table>
      <thead>
        <tr>${data.lineItems.columns.map(c => `<th>${c.label}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${data.lineItems.rows.map(row => `
          <tr>${data.lineItems!.columns.map(c => `<td>${row.cells[c.key] ?? ''}</td>`).join('')}</tr>
        `).join('')}
      </tbody>
    </table>
  ` : '';
  
  const totalsHtml = data.totals ? `
    <div style="text-align: right; margin-top: 16pt;">
      ${data.totals.map(t => `
        <div style="${t.type === 'total' ? 'font-weight: bold; font-size: 14pt; border-top: 2px solid #333; padding-top: 8pt;' : ''}">
          ${t.label}: $${t.value.toFixed(2)}
        </div>
      `).join('')}
    </div>
  ` : '';
  
  return `
    <h1>${data.title}</h1>
    ${data.description ? `<p>${data.description}</p>` : ''}
    
    ${data.metadata ? `
      <table style="margin-bottom: 24pt; background: #f9f9f9;">
        ${data.metadata.documentNumber ? `<tr><td><strong>Document #:</strong></td><td>${data.metadata.documentNumber}</td></tr>` : ''}
        ${data.metadata.date ? `<tr><td><strong>Date:</strong></td><td>${data.metadata.date}</td></tr>` : ''}
        ${data.metadata.status ? `<tr><td><strong>Status:</strong></td><td>${data.metadata.status}</td></tr>` : ''}
      </table>
    ` : ''}
    
    ${sectionsHtml}
    ${lineItemsHtml}
    ${totalsHtml}
    
    <p style="font-size: 9pt; color: #666; margin-top: 48pt;">
      Generated on ${new Date().toLocaleString()}
    </p>
  `;
}

function formatFieldValue(field: FormField): string {
  if (field.value === undefined || field.value === null) return '—';
  if (field.type === 'checkbox') return field.value ? '☑ Yes' : '☐ No';
  if (field.type === 'currency') return `$${Number(field.value).toFixed(2)}`;
  if (field.type === 'date') return new Date(field.value as string).toLocaleDateString();
  return String(field.value);
}
```

### Export Button Component

```typescript
function ExportButton({ type, data }: { type: string; data: any }) {
  const handleExport = () => {
    let html = '';
    let title = 'Document';
    
    switch (type) {
      case 'work_order':
        html = generateWorkOrderPDF(data);
        title = `Work Order - ${data.equipmentTag}`;
        break;
      case 'loto_procedure':
        html = generateLOTOPDF(data);
        title = `LOTO - ${data.equipmentTag}`;
        break;
      case 'checklist':
        html = generateChecklistPDF(data);
        title = data.title;
        break;
      case 'dynamic_form':
        html = generateDynamicFormPDF(data);
        title = data.title;
        break;
      default:
        console.warn('No PDF template for type:', type);
        return;
    }
    
    exportToPDF(html, { title });
  };
  
  return (
    <button onClick={handleExport} className="export-btn">
      <DownloadIcon /> Export PDF
    </button>
  );
}
```

### Using the API HTML Format

Alternatively, request `response_format: "html"` to get pre-formatted HTML:

```javascript
const response = await resolveAPI({
  action: 'query',
  api_key: API_KEY,
  message: 'Generate work order for pump P-101',
  response_format: 'html'  // Returns styled HTML
});

// response is HTML string ready to embed or print
document.getElementById('preview').innerHTML = response;
window.print();  // Or save as PDF
```
