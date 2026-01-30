/**
 * API Route for Resolve SDK Troubleshooting
 * 
 * This endpoint proxies requests to the Resolve API, keeping the API key server-side.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ResolveClient, QueryResponse, DocumentList, KnowledgeBase, Session, SessionWithMessages } from '@/lib/sdk/resolve-sdk';

// Extend function timeout for Pro plans (max 300s for Pro, 900s for Enterprise)
export const maxDuration = 300;

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
        
        // Debug: Log the full message being sent (includes context)
        console.log('[Troubleshoot API] Query message preview:', {
          hasAppContext: message?.includes('<app_context>'),
          hasSystemInstructions: message?.includes('<system_instructions>'),
          messageLength: message?.length,
          knowledgeBaseId,
          hasImageUrl: !!imageUrl,
        });
        
        const response: QueryResponse = await client.query(message, {
          imageUrl,      // Preferred: more efficient
          imageBase64,   // Fallback for backward compatibility
          knowledgeBaseId,
          responseFormat: responseFormat || 'ui',
        });
        
        // DEBUG: Log FULL response structure for A2UI detection
        console.log('[Troubleshoot API] === FULL RESPONSE ===');
        console.log(JSON.stringify(response, null, 2).substring(0, 3000));
        console.log('[Troubleshoot API] === END RESPONSE ===');
        
        return NextResponse.json(response);
      }

      case 'ask': {
        const { message, knowledgeBaseId } = params;
        const answer = await client.ask(message, knowledgeBaseId);
        return NextResponse.json({ success: true, answer });
      }

      case 'analyze_image': {
        const { imageUrl, imageBase64, message, knowledgeBaseId, responseFormat } = params;
        // Prefer imageUrl over imageBase64 for efficiency
        const image = imageUrl || imageBase64;
        
        // Debug: Log analyze_image request
        console.log('[Troubleshoot API] analyze_image:', {
          hasImage: !!image,
          imageUrlPreview: imageUrl?.substring(0, 50),
          hasMessage: !!message,
          messagePreview: message?.substring(0, 100),
          hasAppContext: message?.includes('<app_context>'),
          knowledgeBaseId,
          responseFormat,
        });
        
        const response = await client.analyzeImage(image, message, knowledgeBaseId, responseFormat || 'ui');
        
        // DEBUG: Log FULL response structure for A2UI detection  
        console.log('[Troubleshoot API analyze_image] === FULL RESPONSE ===');
        console.log(JSON.stringify(response, null, 2).substring(0, 3000));
        console.log('[Troubleshoot API analyze_image] === END RESPONSE ===');
        
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

      // ============================================
      // Session Management
      // ============================================

      case 'create_session': {
        const { title, knowledgeBaseId } = params;
        const session: Session = await client.createSession({
          title,
          knowledgeBaseId,
        });
        return NextResponse.json({ success: true, session });
      }

      case 'send_message': {
        const { sessionId, message, imageUrl, imageBase64, responseFormat } = params;
        
        console.log('[Troubleshoot API] send_message:', {
          sessionId,
          messagePreview: message?.substring(0, 100),
          hasImageUrl: !!imageUrl,
          responseFormat: responseFormat || 'ui',
        });
        
        // KB is inherited from session, context should be embedded in message
        const response: QueryResponse = await client.sendMessage(sessionId, message, {
          imageUrl,
          imageBase64,
          responseFormat: responseFormat || 'ui',
        });
        return NextResponse.json(response);
      }

      case 'get_session': {
        const { sessionId } = params;
        const sessionData: SessionWithMessages = await client.getSession(sessionId);
        return NextResponse.json({ success: true, ...sessionData });
      }

      case 'list_sessions': {
        const sessions: Session[] = await client.listSessions();
        return NextResponse.json({ success: true, sessions });
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

