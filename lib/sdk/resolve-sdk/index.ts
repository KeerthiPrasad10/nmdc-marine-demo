/**
 * Resolve SDK - AI-Powered Troubleshooting API Client
 * 
 * Copy this file to your application to integrate with the Resolve API.
 * 
 * Usage:
 *   import { ResolveClient } from './resolve-sdk';
 *   const client = new ResolveClient({ apiKey: 'sk_live_...' });
 *   const result = await client.query('pitot tube replacement');
 */

// ============================================
// Types
// ============================================

export interface ResolveConfig {
  apiKey?: string;
  accessToken?: string;  // Supabase user JWT token for authenticated access
  baseUrl?: string;
}

export interface Document {
  id: string;
  name?: string;
  title?: string;
  drawing_number?: string;
  total_pages?: number;
  total_drawings?: number;
  created_at?: string;
}

export interface DocumentList {
  pnid_analyses: Document[];
  pnid_projects: Document[];
  manuals: Document[];
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  manual_ids: string[];
  project_ids: string[];
  created_at: string;
}

export interface Source {
  pnids: Array<{ tag: string; type: string; drawing: string }>;
  manuals: Array<{ title: string; page: number }>;
  searchedPnidCount: number;
  searchedManualCount: number;
}

export interface QueryResponse {
  success: boolean;
  answer?: string;  // For text format
  response?: {      // For JSON format
    type: string;
    data: unknown;
    sources?: Source;
  };
  sources?: Source;
  latency_ms: number;
  error?: string;
}

export interface APIResponse<T> {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

// ============================================
// Session Types
// ============================================

export interface Session {
  id: string;
  title?: string;
  knowledge_base_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface SessionMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  ui_type?: string;
  ui_data?: unknown;
  created_at: string;
}

export interface SessionWithMessages {
  session: Session;
  messages: SessionMessage[];
}

// ============================================
// Client
// ============================================

export class ResolveClient {
  private apiKey?: string;
  private accessToken?: string;
  private baseUrl: string;

  constructor(config: ResolveConfig) {
    this.apiKey = config.apiKey;
    this.accessToken = config.accessToken;
    this.baseUrl = config.baseUrl || 'https://mecgxrlfinjcwhsdjoce.supabase.co/functions/v1/troubleshoot-agent';
    
    if (!this.apiKey && !this.accessToken) {
      throw new Error('Either apiKey or accessToken must be provided');
    }
  }

  private async request<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Use Authorization header if accessToken is provided
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    
    const body: Record<string, unknown> = {
      action,
      ...params,
    };
    
    // Include api_key in body if provided
    if (this.apiKey) {
      body.api_key = this.apiKey;
    }
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    // Handle empty or malformed responses (can happen on timeout)
    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error(`Empty response from API (status: ${response.status}). The request may have timed out.`);
    }
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('[ResolveSDK] Failed to parse response:', text.substring(0, 500));
      throw new Error(`Invalid JSON response from API: ${text.substring(0, 100)}...`);
    }
    
    if (!response.ok) {
      throw new Error(data.error || `API error: ${response.status}`);
    }
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  }

  // ============================================
  // Document Management
  // ============================================

  /**
   * List all available documents (P&IDs and manuals)
   */
  async listDocuments(): Promise<DocumentList> {
    const response = await this.request<{ documents: DocumentList }>('list_documents');
    return response.documents;
  }

  // ============================================
  // Knowledge Base Management
  // ============================================

  /**
   * List all knowledge bases
   */
  async listKnowledgeBases(): Promise<KnowledgeBase[]> {
    const response = await this.request<{ knowledge_bases: KnowledgeBase[] }>('list_knowledge_bases');
    return response.knowledge_bases;
  }

  /**
   * Create a new knowledge base
   */
  async createKnowledgeBase(params: {
    name: string;
    description?: string;
    manual_ids?: string[];
    project_ids?: string[];
  }): Promise<KnowledgeBase> {
    const response = await this.request<{ knowledge_base: KnowledgeBase }>('create_knowledge_base', params);
    return response.knowledge_base;
  }

  /**
   * Update an existing knowledge base
   */
  async updateKnowledgeBase(
    knowledgeBaseId: string,
    params: {
      name?: string;
      description?: string;
      manual_ids?: string[];
      project_ids?: string[];
    }
  ): Promise<KnowledgeBase> {
    const response = await this.request<{ knowledge_base: KnowledgeBase }>('update_knowledge_base', {
      knowledge_base_id: knowledgeBaseId,
      ...params
    });
    return response.knowledge_base;
  }

  /**
   * Delete a knowledge base
   */
  async deleteKnowledgeBase(knowledgeBaseId: string): Promise<void> {
    await this.request('delete_knowledge_base', { knowledge_base_id: knowledgeBaseId });
  }

  // ============================================
  // Query / Troubleshooting
  // ============================================

  /**
   * Query the knowledge base for troubleshooting help
   * 
   * @param message - The problem description or question
   * @param options - Optional parameters (prefer imageUrl over imageBase64 for efficiency)
   * @returns Query response with answer and sources
   */
  async query(
    message: string,
    options: {
      imageUrl?: string;      // Preferred: URL to image (more efficient)
      imageBase64?: string;   // Fallback: base64 encoded image
      knowledgeBaseId?: string;
      responseFormat?: 'json' | 'text' | 'ui' | 'html';  // 'ui' recommended for apps
      context?: Record<string, string>;  // App context injection (vessel_name, equipment_type, etc.)
    } = {}
  ): Promise<QueryResponse> {
    return this.request<QueryResponse>('query', {
      message,
      image_url: options.imageUrl,
      image_base64: options.imageBase64,
      knowledge_base_id: options.knowledgeBaseId,
      response_format: options.responseFormat || 'ui',
      context: options.context,
    });
  }

  /**
   * Convenience method for text-only responses
   */
  async ask(message: string, knowledgeBaseId?: string): Promise<string> {
    const response = await this.query(message, {
      knowledgeBaseId,
      responseFormat: 'text'
    });
    return response.answer || '';
  }

  /**
   * Analyze an image for troubleshooting
   * @param image - Either a URL string or base64 encoded image data
   * @param message - Optional message/question about the image
   * @param knowledgeBaseId - Optional knowledge base to search
   * @param responseFormat - Response format (default: 'ui')
   * @param context - Optional app context (vessel_name, equipment_type, etc.)
   */
  async analyzeImage(
    image: string,
    message?: string,
    knowledgeBaseId?: string,
    responseFormat: 'json' | 'text' | 'ui' | 'html' = 'ui',
    context?: Record<string, string>
  ): Promise<QueryResponse> {
    // Detect if it's a URL or base64
    const isUrl = image.startsWith('http://') || image.startsWith('https://');
    
    return this.query(message || 'Please analyze this image and help me troubleshoot.', {
      imageUrl: isUrl ? image : undefined,
      imageBase64: isUrl ? undefined : image,
      knowledgeBaseId,
      responseFormat,
      context,
    });
  }

  // ============================================
  // Session Management (Recommended for multi-turn)
  // ============================================

  /**
   * Create a new troubleshooting session
   * Sessions maintain conversation history in the database
   * 
   * @param options - Session options
   * @returns The created session
   */
  async createSession(options: {
    title?: string;
    knowledgeBaseId?: string;
  } = {}): Promise<Session> {
    const response = await this.request<{ session: Session }>('start_session', {
      title: options.title,
      knowledge_base_id: options.knowledgeBaseId
    });
    return response.session;
  }

  /**
   * Send a message within a session
   * The agent loads all previous messages and responds with full context
   * 
   * @param sessionId - The session ID
   * @param message - The user's message
   * @param options - Optional parameters
   * @returns Query response with answer and sources
   */
  async sendMessage(
    sessionId: string,
    message: string,
    options: {
      imageUrl?: string;
      imageBase64?: string;
      responseFormat?: 'json' | 'text' | 'ui' | 'html';
    } = {}
  ): Promise<QueryResponse> {
    // Note: KB is inherited from session creation, context is embedded in message
    // Only pass parameters documented for send_message action
    return this.request<QueryResponse>('send_message', {
      session_id: sessionId,
      message,
      image_url: options.imageUrl,
      image_base64: options.imageBase64,
      response_format: options.responseFormat || 'ui',
    });
  }

  /**
   * Get a session with all its messages
   * 
   * @param sessionId - The session ID
   * @returns Session with full message history
   */
  async getSession(sessionId: string): Promise<SessionWithMessages> {
    return this.request<SessionWithMessages>('get_session', {
      session_id: sessionId
    });
  }

  /**
   * List all sessions for the current API key
   * 
   * @returns Array of sessions
   */
  async listSessions(): Promise<Session[]> {
    const response = await this.request<{ sessions: Session[] }>('list_sessions');
    return response.sessions;
  }
}

// ============================================
// Factory function
// ============================================

export function createResolveClient(apiKey: string, baseUrl?: string): ResolveClient {
  return new ResolveClient({ apiKey, baseUrl });
}

// Default export
export default ResolveClient;

