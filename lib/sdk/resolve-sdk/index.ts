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

    const data = await response.json();
    
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
   * @param options - Optional parameters
   * @returns Query response with answer and sources
   */
  async query(
    message: string,
    options: {
      imageBase64?: string;
      knowledgeBaseId?: string;
      responseFormat?: 'json' | 'text';
    } = {}
  ): Promise<QueryResponse> {
    return this.request<QueryResponse>('query', {
      message,
      image_base64: options.imageBase64,
      knowledge_base_id: options.knowledgeBaseId,
      response_format: options.responseFormat || 'json'
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
   */
  async analyzeImage(
    imageBase64: string,
    message?: string,
    knowledgeBaseId?: string
  ): Promise<QueryResponse> {
    return this.query(message || 'Please analyze this image and help me troubleshoot.', {
      imageBase64,
      knowledgeBaseId,
      responseFormat: 'json'
    });
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

