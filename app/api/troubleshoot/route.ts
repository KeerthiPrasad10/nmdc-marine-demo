/**
 * API Route for Resolve SDK Troubleshooting
 * 
 * This endpoint proxies requests to the Resolve API, keeping the API key server-side.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ResolveClient, QueryResponse, DocumentList, KnowledgeBase } from '@/lib/sdk/resolve-sdk';

// Extend function timeout for Pro plans (default is 10s for Hobby, 60s for Pro)
export const maxDuration = 60;

// Initialize client with API key from environment
const getClient = () => {
  const apiKey = process.env.RESOLVE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'RESOLVE_API_KEY not configured. Add RESOLVE_API_KEY=sk_live_xxx to your .env.local file. ' +
      'Get your API key from the Resolve app.'
    );
  }
  
  // Optional: Use custom base URL if configured
  const baseUrl = process.env.RESOLVE_API_URL;
  
  return new ResolveClient({ apiKey, baseUrl });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    const client = getClient();

    switch (action) {
      case 'query': {
        const { message, imageUrl, imageBase64, knowledgeBaseId, responseFormat } = params;
        const response: QueryResponse = await client.query(message, {
          imageUrl,      // Preferred: more efficient
          imageBase64,   // Fallback for backward compatibility
          knowledgeBaseId,
          responseFormat: responseFormat || 'json',
        });
        return NextResponse.json(response);
      }

      case 'ask': {
        const { message, knowledgeBaseId } = params;
        const answer = await client.ask(message, knowledgeBaseId);
        return NextResponse.json({ success: true, answer });
      }

      case 'analyze_image': {
        const { imageUrl, imageBase64, message, knowledgeBaseId } = params;
        // Prefer imageUrl over imageBase64 for efficiency
        const image = imageUrl || imageBase64;
        const response = await client.analyzeImage(image, message, knowledgeBaseId);
        return NextResponse.json(response);
      }

      case 'list_documents': {
        const documents: DocumentList = await client.listDocuments();
        return NextResponse.json({ success: true, documents });
      }

      case 'list_knowledge_bases': {
        const knowledgeBases: KnowledgeBase[] = await client.listKnowledgeBases();
        return NextResponse.json({ success: true, knowledgeBases });
      }

      case 'create_knowledge_base': {
        const { name, description, manual_ids, project_ids } = params;
        const knowledgeBase = await client.createKnowledgeBase({
          name,
          description,
          manual_ids,
          project_ids,
        });
        return NextResponse.json({ success: true, knowledgeBase });
      }

      case 'update_knowledge_base': {
        const { knowledgeBaseId, name, description, manual_ids, project_ids } = params;
        const knowledgeBase = await client.updateKnowledgeBase(knowledgeBaseId, {
          name,
          description,
          manual_ids,
          project_ids,
        });
        return NextResponse.json({ success: true, knowledgeBase });
      }

      case 'delete_knowledge_base': {
        const { knowledgeBaseId } = params;
        await client.deleteKnowledgeBase(knowledgeBaseId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Troubleshoot API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check and listing available actions
export async function GET() {
  return NextResponse.json({
    success: true,
    service: 'Resolve Troubleshooting API',
    actions: [
      'query',
      'ask', 
      'analyze_image',
      'list_documents',
      'list_knowledge_bases',
      'create_knowledge_base',
      'update_knowledge_base',
      'delete_knowledge_base',
    ],
    configured: !!process.env.RESOLVE_API_KEY,
  });
}

