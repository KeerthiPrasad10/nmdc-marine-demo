# Resolve API Documentation

The Resolve API enables external applications to leverage AI-powered diagnostics, document analysis, and dynamic UI generation against your knowledge base (P&IDs, manuals, technical documents).

## Base URL

```
https://mecgxrlfinjcwhsdjoce.supabase.co/functions/v1/troubleshoot-agent
```

## Quick Start

```bash
curl -X POST https://mecgxrlfinjcwhsdjoce.supabase.co/functions/v1/troubleshoot-agent \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "query",
    "api_key": "sk_live_...",
    "message": "What is the isolation procedure for pump P-101?"
  }'
```

---

## Authentication

All API requests require an API key in the request body:

```json
{
  "api_key": "sk_live_..."
}
```

### Generating an API Key

API keys are generated via the Supabase database:

```sql
SELECT * FROM generate_api_key(
  'your-user-id'::uuid,
  'My App Production',
  NULL,  -- NULL = access all your knowledge bases
  ARRAY['query']  -- scopes: 'query', 'read_sources', 'write'
);
```

**Response:**
```json
{
  "id": "key-uuid",
  "api_key": "sk_live_abc123..."  // Save this! Only shown once
}
```

### Rate Limits

| Limit | Default |
|-------|---------|
| Per minute | 60 requests |
| Per day | 10,000 requests |

---

## Core Endpoints

### 1. Query (Main Endpoint)

The primary endpoint for all AI-powered interactions. Supports text queries, image analysis, and dynamic UI generation.

**Endpoint:** `POST /troubleshoot-agent`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | `"query"` |
| `api_key` | string | Yes | Your API key |
| `message` | string | No* | Natural language query or problem description |
| `image_base64` | string | No* | Base64-encoded image data |
| `image_url` | string | No* | URL to an image (will be fetched and analyzed) |
| `knowledge_base_id` | string | No | Specific knowledge base to search |
| `response_format` | string | No | `"json"` (default) or `"text"` |

*At least one of `message`, `image_base64`, or `image_url` is required.

#### Example: Text Query

```bash
curl -X POST $BASE_URL -H 'Content-Type: application/json' -d '{
  "action": "query",
  "api_key": "sk_live_...",
  "message": "What causes high vibration in centrifugal pumps?"
}'
```

#### Example: Image Analysis via URL

```bash
curl -X POST $BASE_URL -H 'Content-Type: application/json' -d '{
  "action": "query",
  "api_key": "sk_live_...",
  "image_url": "https://example.com/equipment-photo.jpg",
  "message": "What is wrong with this pump?"
}'
```

#### Example: Image Analysis via Base64

```bash
curl -X POST $BASE_URL -H 'Content-Type: application/json' -d '{
  "action": "query",
  "api_key": "sk_live_...",
  "image_base64": "/9j/4AAQSkZJRgABAQAA...",
  "message": "Identify the equipment and any visible issues"
}'
```

#### Example: Query Specific Knowledge Base

```bash
curl -X POST $BASE_URL -H 'Content-Type: application/json' -d '{
  "action": "query",
  "api_key": "sk_live_...",
  "knowledge_base_id": "kb-uuid-here",
  "message": "Calculate total project cost for bathroom renovation"
}'
```

---

## Dynamic UI Response Types

The API returns structured UI components that your application can render. The `response.type` field indicates which component to display.

### Response Structure

```json
{
  "success": true,
  "response": {
    "type": "info_message",
    "data": { ... },
    "sources": {
      "pnids": [...],
      "manuals": [...],
      "images": [...],
      "searchedPnidCount": 5,
      "searchedManualCount": 3
    }
  },
  "latency_ms": 2340
}
```

### UI Component Types

#### `info_message`
General information, answers, or root cause analysis.

```json
{
  "type": "info_message",
  "data": {
    "title": "Pump Cavitation Analysis",
    "message": "Based on the symptoms described, this appears to be cavitation...",
    "details": ["NPSH margin is insufficient", "Suction strainer may be clogged"],
    "suggestions": ["Check suction pressure", "Inspect strainer"]
  }
}
```

#### `selection`
Multiple choice options for user interaction.

```json
{
  "type": "selection",
  "data": {
    "question": "Which symptom best describes the issue?",
    "options": [
      {"id": "1", "title": "High vibration", "subtitle": "Mechanical issue"},
      {"id": "2", "title": "Low flow", "subtitle": "Process issue"},
      {"id": "3", "title": "Overheating", "subtitle": "Thermal issue"}
    ],
    "allow_free_text": true
  }
}
```

#### `checklist`
Step-by-step procedures or inspection lists.

```json
{
  "type": "checklist",
  "data": {
    "title": "Pump Pre-Start Checklist",
    "description": "Complete before starting P-101",
    "items": [
      {"id": "1", "text": "Verify suction valve is open", "priority": "critical"},
      {"id": "2", "text": "Check seal flush supply", "priority": "high"},
      {"id": "3", "text": "Verify coupling guard installed", "priority": "critical"}
    ]
  }
}
```

#### `equipment_card`
Detailed equipment information display.

```json
{
  "type": "equipment_card",
  "data": {
    "tag": "P-101",
    "name": "Feed Water Pump",
    "type": "Centrifugal Pump",
    "manufacturer": "Flowserve",
    "model": "HPX 6x4-13",
    "specifications": {
      "Flow": "500 GPM",
      "Head": "150 ft",
      "Power": "50 HP"
    },
    "connections": [
      {"direction": "inlet", "tag": "V-101", "type": "Suction Valve"},
      {"direction": "outlet", "tag": "CV-102", "type": "Discharge Control"}
    ]
  }
}
```

#### `loto_procedure`
Lock Out Tag Out safety procedures.

```json
{
  "type": "loto_procedure",
  "data": {
    "equipment_tag": "P-101",
    "equipment_name": "Feed Water Pump",
    "hazard_summary": "Electrical, mechanical rotation, pressurized fluid",
    "isolation_points": [
      {
        "sequence": 1,
        "tag": "MCC-P101",
        "type": "Electrical Breaker",
        "location": "MCC Room 1",
        "action": "Open and lock",
        "verification": "Check motor leads dead"
      },
      {
        "sequence": 2,
        "tag": "V-101A",
        "type": "Suction Isolation Valve",
        "location": "Pump Suction",
        "action": "Close and lock",
        "verification": "Verify zero pressure on PI-101"
      }
    ],
    "ppe_required": ["Hard Hat", "Safety Glasses", "Gloves"],
    "special_precautions": ["Allow motor to cool before work"]
  }
}
```

#### `work_order`
Maintenance work order generation.

```json
{
  "type": "work_order",
  "data": {
    "work_order_number": "WO-2026-001234",
    "equipment_tag": "P-101",
    "equipment_name": "Feed Water Pump",
    "work_type": "Corrective Maintenance",
    "priority": "High",
    "description": "Replace mechanical seal due to leak",
    "symptoms": ["Visible leak at seal area", "Increased vibration"],
    "required_parts": [
      {"part_number": "SEAL-101-A", "description": "Mechanical Seal Kit", "quantity": 1}
    ],
    "required_tools": ["Seal puller", "Torque wrench"],
    "safety_requirements": ["LOTO required", "Confined space permit if entering tank"],
    "estimated_duration": "4 hours"
  }
}
```

#### `research_result`
Research answers with citations (for non-troubleshooting queries).

```json
{
  "type": "research_result",
  "data": {
    "question": "What are the tile specifications for CT-1?",
    "answer": "CT-1 refers to ceramic wall tiles with dimensions 12\"x24\"...",
    "summary": "12x24 ceramic tiles, running bond pattern",
    "citations": [
      {
        "source": "Building Schedule of Rates 2024",
        "page": 5,
        "section": "Wall Tiling",
        "excerpt": "CT-1: Ceramic tile 12\"x24\", glazed finish...",
        "confidence": 0.95
      }
    ],
    "related_topics": ["Tile installation", "Grout specifications"]
  }
}
```

#### `data_table`
Tabular data display (for calculations, estimates).

```json
{
  "type": "data_table",
  "data": {
    "title": "Project Cost Estimate",
    "description": "Bathroom renovation costs from BSR 2024",
    "columns": [
      {"key": "item", "label": "Item", "type": "string"},
      {"key": "unit", "label": "Unit", "type": "string"},
      {"key": "rate", "label": "Rate (LKR)", "type": "currency"},
      {"key": "qty", "label": "Quantity", "type": "number"},
      {"key": "total", "label": "Total", "type": "currency"}
    ],
    "rows": [
      {"id": "1", "cells": {"item": "Wall Tiling", "unit": "sq.m", "rate": 2500, "qty": 12, "total": 30000}},
      {"id": "2", "cells": {"item": "Floor Tiling", "unit": "sq.m", "rate": 2200, "qty": 6, "total": 13200}}
    ],
    "summary": {
      "subtotal": 43200,
      "tax": 5184,
      "total": 48384
    }
  }
}
```

#### `dynamic_form`
Editable forms (invoices, quotes, RFPs).

```json
{
  "type": "dynamic_form",
  "data": {
    "form_type": "invoice",
    "title": "Invoice #INV-2026-001",
    "description": "Bathroom renovation work",
    "sections": [
      {
        "id": "client",
        "title": "Client Information",
        "fields": [
          {"id": "name", "label": "Client Name", "type": "text", "value": ""},
          {"id": "address", "label": "Address", "type": "textarea", "value": ""}
        ]
      }
    ],
    "line_items": [
      {"id": "1", "description": "Wall Tiling", "quantity": 12, "unit_price": 2500, "total": 30000}
    ],
    "totals": {
      "subtotal": 30000,
      "tax_rate": 0.12,
      "tax": 3600,
      "total": 33600
    }
  }
}
```

#### `document_output`
Formatted document display (reports, procedures).

```json
{
  "type": "document_output",
  "data": {
    "title": "Equipment Inspection Report",
    "document_type": "report",
    "date": "2026-01-10",
    "sections": [
      {"type": "heading", "level": 1, "content": "Executive Summary"},
      {"type": "paragraph", "content": "This report details the inspection findings..."},
      {"type": "list", "items": ["Finding 1", "Finding 2", "Finding 3"]},
      {"type": "table", "table_data": {
        "headers": ["Component", "Condition", "Action"],
        "rows": [["Seal", "Poor", "Replace"], ["Bearing", "Good", "Monitor"]]
      }}
    ],
    "footer": "Generated by Resolve AI"
  }
}
```

#### `image_card`
Image display with context.

```json
{
  "type": "image_card",
  "data": {
    "title": "P&ID Section - Pump P-101",
    "description": "Pump and associated instrumentation",
    "source_document": "PFD-001",
    "source_page": 3,
    "image_url": "https://...",
    "detected_equipment": ["P-101", "V-101A", "FIC-101"]
  }
}
```

#### `multi_response`
Multiple UI components in a single response.

```json
{
  "type": "multi_response",
  "data": {
    "responses": [
      {"type": "info_message", "data": {...}},
      {"type": "checklist", "data": {...}},
      {"type": "selection", "data": {...}}
    ]
  }
}
```

#### `error_message`
Error display.

```json
{
  "type": "error_message",
  "data": {
    "title": "Equipment Not Found",
    "message": "Could not find equipment with tag XYZ-999",
    "suggestion": "Check the tag format or search for similar equipment"
  }
}
```

---

## Knowledge Base Management

### List Documents

Get all P&IDs and manuals available to your account.

```bash
curl -X POST $BASE_URL -H 'Content-Type: application/json' -d '{
  "action": "list_documents",
  "api_key": "sk_live_..."
}'
```

**Response:**
```json
{
  "success": true,
  "documents": {
    "pnid_analyses": [
      {"id": "uuid", "name": "Process Flow Diagram", "drawing_number": "PFD-001"}
    ],
    "pnid_projects": [
      {"id": "uuid", "name": "Plant Upgrade", "total_drawings": 15}
    ],
    "manuals": [
      {"id": "uuid", "title": "Equipment Manual", "total_pages": 450}
    ]
  }
}
```

### List Knowledge Bases

```bash
curl -X POST $BASE_URL -H 'Content-Type: application/json' -d '{
  "action": "list_knowledge_bases",
  "api_key": "sk_live_..."
}'
```

### Create Knowledge Base

Create a reusable collection of documents.

```bash
curl -X POST $BASE_URL -H 'Content-Type: application/json' -d '{
  "action": "create_knowledge_base",
  "api_key": "sk_live_...",
  "name": "Plant Operations",
  "description": "All P&IDs and operating manuals",
  "manual_ids": ["uuid-1", "uuid-2"],
  "project_ids": ["uuid-3"]
}'
```

### Update Knowledge Base

```bash
curl -X POST $BASE_URL -H 'Content-Type: application/json' -d '{
  "action": "update_knowledge_base",
  "api_key": "sk_live_...",
  "knowledge_base_id": "kb-uuid",
  "name": "Updated Name",
  "manual_ids": ["uuid-1", "uuid-2", "uuid-4"]
}'
```

### Delete Knowledge Base

```bash
curl -X POST $BASE_URL -H 'Content-Type: application/json' -d '{
  "action": "delete_knowledge_base",
  "api_key": "sk_live_...",
  "knowledge_base_id": "kb-uuid"
}'
```

---

## Session-Based Conversations

For multi-turn conversations with context retention.

### Start Session

```bash
curl -X POST $BASE_URL -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SUPABASE_JWT' \
  -d '{
    "action": "start_session",
    "knowledge_base_id": "kb-uuid",
    "title": "Pump Troubleshooting"
  }'
```

**Response:**
```json
{
  "session": {
    "id": "session-uuid",
    "title": "Pump Troubleshooting",
    "knowledge_base": {"project_ids": [...], "manual_ids": [...]}
  }
}
```

### Send Message (Session)

```bash
curl -X POST $BASE_URL -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SUPABASE_JWT' \
  -d '{
    "action": "send_message",
    "session_id": "session-uuid",
    "message": "The pump is making a grinding noise",
    "image_url": "https://example.com/pump-photo.jpg"
  }'
```

### Get Session History

```bash
curl -X POST $BASE_URL -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SUPABASE_JWT' \
  -d '{
    "action": "get_session",
    "session_id": "session-uuid"
  }'
```

### List Sessions

```bash
curl -X POST $BASE_URL -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SUPABASE_JWT' \
  -d '{
    "action": "list_sessions"
  }'
```

---

## Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `message, image_base64, or image_url is required` | No input provided |
| 400 | `Failed to fetch image from URL` | Could not download image from URL |
| 401 | `api_key is required for external queries` | Missing API key |
| 401 | `Invalid or expired API key` | API key validation failed |
| 404 | `Knowledge base not found` | Invalid knowledge_base_id |
| 500 | `Query failed` | Internal processing error |

---

## Code Examples

### Python

```python
import requests
import base64
from typing import Optional

RESOLVE_API_URL = "https://mecgxrlfinjcwhsdjoce.supabase.co/functions/v1/troubleshoot-agent"
API_KEY = "sk_live_..."

def query(
    message: str = None,
    image_path: str = None,
    image_url: str = None,
    knowledge_base_id: str = None,
    response_format: str = "json"
) -> dict:
    """Query the Resolve API with text and/or image."""
    payload = {
        "action": "query",
        "api_key": API_KEY,
        "response_format": response_format
    }
    
    if message:
        payload["message"] = message
    
    if image_path:
        with open(image_path, "rb") as f:
            payload["image_base64"] = base64.b64encode(f.read()).decode()
    elif image_url:
        payload["image_url"] = image_url
    
    if knowledge_base_id:
        payload["knowledge_base_id"] = knowledge_base_id
    
    response = requests.post(RESOLVE_API_URL, json=payload)
    return response.json()

# Example: Text query
result = query(message="What is the LOTO procedure for pump P-101?")
print(result["response"]["type"])  # e.g., "loto_procedure"
print(result["response"]["data"])

# Example: Image analysis
result = query(
    image_url="https://example.com/equipment.jpg",
    message="What equipment is this and are there any visible issues?"
)

# Example: Cost calculation with specific KB
result = query(
    message="Calculate total project cost for bathroom tiling",
    knowledge_base_id="kb-building-codes",
    response_format="json"
)
```

### JavaScript/TypeScript

```typescript
const RESOLVE_API_URL = 'https://mecgxrlfinjcwhsdjoce.supabase.co/functions/v1/troubleshoot-agent';
const API_KEY = 'sk_live_...';

interface ResolveResponse {
  success: boolean;
  response?: {
    type: string;
    data: Record<string, unknown>;
    sources?: {
      pnids: Array<{tag: string; type: string; drawing: string}>;
      manuals: Array<{title: string; page: number}>;
    };
  };
  answer?: string;  // When response_format is 'text'
  latency_ms: number;
  error?: string;
}

async function query(options: {
  message?: string;
  imageBase64?: string;
  imageUrl?: string;
  knowledgeBaseId?: string;
  responseFormat?: 'json' | 'text';
}): Promise<ResolveResponse> {
  const response = await fetch(RESOLVE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'query',
      api_key: API_KEY,
      message: options.message,
      image_base64: options.imageBase64,
      image_url: options.imageUrl,
      knowledge_base_id: options.knowledgeBaseId,
      response_format: options.responseFormat || 'json'
    })
  });
  
  return response.json();
}

// Example: Render dynamic UI based on response type
async function handleQuery(message: string) {
  const result = await query({ message });
  
  if (!result.success) {
    console.error('Error:', result.error);
    return;
  }
  
  const { type, data } = result.response!;
  
  switch (type) {
    case 'info_message':
      renderInfoMessage(data);
      break;
    case 'selection':
      renderSelectionOptions(data);
      break;
    case 'checklist':
      renderChecklist(data);
      break;
    case 'loto_procedure':
      renderLotoProcedure(data);
      break;
    case 'data_table':
      renderDataTable(data);
      break;
    case 'dynamic_form':
      renderEditableForm(data);
      break;
    // ... handle other types
  }
}
```

### cURL Examples

```bash
# Simple text query
curl -X POST $BASE_URL -H 'Content-Type: application/json' -d '{
  "action": "query",
  "api_key": "sk_live_...",
  "message": "What causes pump cavitation?"
}'

# Image analysis from URL
curl -X POST $BASE_URL -H 'Content-Type: application/json' -d '{
  "action": "query",
  "api_key": "sk_live_...",
  "image_url": "https://example.com/photo.jpg",
  "message": "Identify equipment and issues"
}'

# Generate cost estimate
curl -X POST $BASE_URL -H 'Content-Type: application/json' -d '{
  "action": "query",
  "api_key": "sk_live_...",
  "knowledge_base_id": "kb-uuid",
  "message": "Generate a detailed cost estimate for the bathroom renovation project"
}'

# Get LOTO procedure
curl -X POST $BASE_URL -H 'Content-Type: application/json' -d '{
  "action": "query",
  "api_key": "sk_live_...",
  "message": "Generate LOTO procedure for pump P-101"
}'
```

---

## Future Capabilities (Roadmap)

### Video Analysis (Coming Soon)

```json
{
  "action": "query",
  "api_key": "sk_live_...",
  "video_url": "https://example.com/equipment-video.mp4",
  "message": "Analyze this equipment operation video for anomalies"
}
```

**Planned features:**
- Frame-by-frame analysis for equipment diagnostics
- Motion detection for vibration analysis
- Audio analysis for abnormal sounds
- Time-stamped issue identification

### Real-time Streaming (Coming Soon)

```json
{
  "action": "query_stream",
  "api_key": "sk_live_...",
  "message": "Explain the complete startup procedure for this unit"
}
```

**Planned features:**
- Server-Sent Events (SSE) for streaming responses
- Progressive UI rendering
- Real-time tool execution updates

### Batch Processing (Coming Soon)

```json
{
  "action": "batch_query",
  "api_key": "sk_live_...",
  "queries": [
    {"message": "LOTO for P-101"},
    {"message": "LOTO for P-102"},
    {"message": "LOTO for P-103"}
  ]
}
```

---

## Best Practices

1. **Store API keys securely** - Never expose in client-side code; use environment variables
2. **Use specific knowledge bases** - Faster and more accurate than searching all documents
3. **Include context in queries** - Equipment tags, symptoms, and relevant details improve accuracy
4. **Handle all UI types** - Implement renderers for each response type for full functionality
5. **Implement retry logic** - Use exponential backoff for transient errors
6. **Cache responses** - Similar queries return similar results; cache where appropriate
7. **Include images when relevant** - Visual analysis significantly improves diagnostic accuracy

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.2.0 | 2026-01-10 | Added `image_url` support, image passed directly to Claude vision |
| v1.1.0 | 2026-01-08 | Added dynamic UI types: `research_result`, `data_table`, `dynamic_form`, `document_output` |
| v1.0.0 | 2026-01-04 | Initial API release with `query` action |
