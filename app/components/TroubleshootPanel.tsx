// @ts-nocheck - Complex dynamic types in troubleshoot response handling
'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { Vessel, Weather } from '@/lib/supabase';
import type { QueryResponse, Source, KnowledgeBase } from '@/lib/sdk/resolve-sdk';
import { NMDC_FLEET as LEGACY_FLEET, getNMDCVesselByMMSI as getLegacyVesselByMMSI, getNMDCVesselTypeName as getLegacyVesselTypeName, getNMDCCompanyName as getLegacyCompanyName, type NMDCVessel as LegacyVessel } from '@/lib/nmdc/fleet';
import { DynamicRenderer, type UIResponse, type MultiResponse, type DynamicRendererHandlers } from './troubleshoot';

// Flexible alert type that works with both Supabase Alert and legacy alerts
interface FlexibleAlert {
  id: string;
  severity: string;
  title?: string;
  message?: string;
  description?: string | null;
  vessel_id?: string | null;
  vesselId?: string;
  resolved?: boolean | null;
  status?: string;
}

// Comprehensive context for troubleshooting queries
interface AppContext {
  vessel?: {
    // Identity
    name: string;
    mmsi?: string;
    imo?: string;
    type: string;
    subType?: string;
    company?: string;
    
    // Current state
    status?: string;
    fuelLevel?: number;
    engineStatus?: string;
    healthScore?: number;
    location?: { lat: number; lng: number };
    speed?: number;
    heading?: number;
    
    // Assignment
    project?: string;
    captain?: string;
    crewCount?: number;
    
    // Specifications
    specs?: {
      length?: number;
      breadth?: number;
      depth?: number;
      dredgingDepth?: number;
      pumpPower?: string;
      craneCapacity?: number;
      accommodation?: number;
      deckArea?: number;
      yearBuilt?: number;
      age?: number;
    };
    
    // Documentation
    datasheetUrl?: string;
  } | null;
  
  activeAlerts?: Array<{
    severity: string;
    message: string;
    component?: string;
    timestamp?: string;
  }>;
  
  weather?: {
    condition?: string;
    windSpeed?: number;
    windDirection?: number;
    waveHeight?: number;
    visibility?: number;
    temperature?: number;
    severity?: string;
  } | null;
  
  equipment?: string;
  
  fleetStatus?: {
    totalVessels: number;
    operationalCount: number;
    maintenanceCount: number;
  };
}
import {
  Send,
  Wrench,
  User,
  Loader2,
  RotateCcw,
  Camera,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Upload,
  X,
  ExternalLink,
  BookOpen,
  Cpu,
  Zap,
  Settings,
  Thermometer,
  Database,
  ChevronDown,
  Download,
  Copy,
  Check,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source;
  imagePreview?: string;
  latency?: number;
  responseType?: string;
  responseData?: unknown;  // Raw structured data for artifact rendering
  uiResponse?: UIResponse;  // Resolve-style UI response for DynamicRenderer
}

// Work Order response type
interface WorkOrderData {
  // Support both camelCase (API) and snake_case field names
  work_order_number?: string;
  workOrderNumber?: string;
  equipment_tag?: string;
  equipmentTag?: string;
  equipment_name?: string;
  equipmentName?: string;
  work_type?: string;
  workType?: string;
  priority?: 'Critical' | 'High' | 'Medium' | 'Low' | 'emergency' | 'urgent' | 'high' | 'medium' | 'low' | string;
  description?: string;
  symptoms?: string | string[];
  required_parts?: Array<{ part_number?: string; partNumber?: string; description: string; quantity: number }>;
  requiredParts?: Array<{ part_number?: string; partNumber?: string; description: string; quantity: number }>;
  required_tools?: string[];
  requiredTools?: string[];
  safety_requirements?: string[];
  safetyNotes?: string[];
  estimated_duration?: string;
  estimatedHours?: number;
  procedure_steps?: Array<{ step: number; description: string; notes?: string; critical?: boolean }>;
  procedureSteps?: string[];
  quality_checkpoints?: Array<{ checkpoint: string; criteria: string }>;
  atex_compliance?: boolean;
  lockout_tagout_required?: boolean;
  references?: Array<{ title: string; page?: number }>;
}

// LOTO Procedure response type
interface LotoProcedureData {
  // Support both camelCase (API) and snake_case
  equipment_tag?: string;
  equipmentTag?: string;
  equipment_name?: string;
  equipmentName?: string;
  location?: string;
  generatedAt?: string;
  estimatedDuration?: string;
  hazard_summary?: string;
  hazards?: string[];
  isolation_points?: Array<{
    sequence: number;
    tag: string;
    type: string;
    location: string;
    action: string;
    verification: string;
  }>;
  isolationSteps?: Array<{
    step: number;
    point: string;
    pointType: string;
    action: string;
    verification: string;
  }>;
  ppe_required?: string[];
  requiredPpe?: string[];
  special_precautions?: string[];
  verificationSteps?: string[];
  reinstateSteps?: string[];
  warnings?: string[];
}

// Equipment Card response type
interface EquipmentCardData {
  tag?: string;
  name?: string;
  type?: string;
  manufacturer?: string;
  model?: string;
  specifications?: Record<string, string>;
  connections?: Array<{ direction: string; tag: string; type: string }>;
}

interface TroubleshootPanelProps {
  selectedVessel?: Vessel | null;
  equipmentType?: string;
  initialSymptom?: string;
  alerts?: FlexibleAlert[];
  weather?: Weather | null;
  fleetMetrics?: {
    totalVessels: number;
    operationalVessels: number;
    maintenanceVessels: number;
  };
}

// Quick troubleshooting prompts for grid assets and transformers
const TROUBLESHOOT_PROMPTS = [
  { icon: Thermometer, text: "DGA exceedance", prompt: "Dissolved gas analysis shows elevated hydrogen and acetylene. What are the possible fault types and recommended actions per IEEE C57.104?" },
  { icon: Zap, text: "Overload / hot-spot", prompt: "Transformer winding hot-spot temperature is exceeding the alarm threshold. How do I assess the risk and manage the load?" },
  { icon: Settings, text: "Tap changer issue", prompt: "The on-load tap changer is showing increased transition time and inconsistent voltage regulation. What should I check?" },
  { icon: AlertTriangle, text: "Bushing failure risk", prompt: "Bushing power factor test results are trending upward. What could be the cause and what are the next steps?" },
  { icon: Cpu, text: "Cooling failure", prompt: "Cooling fans are not activating during high-load periods. How do I diagnose the cooling system?" },
  { icon: FileText, text: "Oil leak / low level", prompt: "Oil level in the conservator is dropping and there is a visible stain under the transformer. What is the procedure?" },
];

export function TroubleshootPanel({ 
  selectedVessel, 
  equipmentType,
  initialSymptom,
  alerts,
  weather,
  fleetMetrics,
}: TroubleshootPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialSymptom || '');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevSymptomRef = useRef(initialSymptom);
  const initialMessageSentRef = useRef(false);

  useEffect(() => {
    if (initialSymptom && initialSymptom !== prevSymptomRef.current) {
      setInput(initialSymptom);
      prevSymptomRef.current = initialSymptom;
      inputRef.current?.focus();
    }
  }, [initialSymptom]);

  // Knowledge base state
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string | null>(null);
  const [isLoadingKBs, setIsLoadingKBs] = useState(false);
  const [showKBDropdown, setShowKBDropdown] = useState(false);

  // Session state - maintains conversation history on the server
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionsSupported, setSessionsSupported] = useState(true);  // Disable if API doesn't support

  // Fetch knowledge bases on mount
  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      setIsLoadingKBs(true);
      try {
        const response = await fetch('/api/troubleshoot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'list_knowledge_bases' }),
        });
        const data = await response.json();
        if (data.success && data.knowledgeBases) {
          setKnowledgeBases(data.knowledgeBases);
          // Auto-select first KB if available
          if (data.knowledgeBases.length > 0) {
            setSelectedKnowledgeBase(data.knowledgeBases[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch knowledge bases:', error);
      } finally {
        setIsLoadingKBs(false);
      }
    };
    fetchKnowledgeBases();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle initial symptom if provided - use ref to prevent double-execution in React Strict Mode
  useEffect(() => {
    if (initialSymptom && !hasInteracted && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true;
      sendMessage(initialSymptom);
    }
  }, [initialSymptom]);

  // Get selected KB name for display
  const selectedKBName = knowledgeBases.find(kb => kb.id === selectedKnowledgeBase)?.name || 'All Documents';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showKBDropdown) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-kb-dropdown]')) {
          setShowKBDropdown(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showKBDropdown]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }

    // Store the file for later upload
    setSelectedImageFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }, []);

  const removeImage = useCallback(() => {
    // Revoke object URL to free memory
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [imagePreview]);

  // No compression - Resolve app accepts larger images now

  // Upload image to storage and get URL
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload image');
    }
    
    const data = await response.json();
    return data.url;
  };

  // Build comprehensive context for the AI
  const buildAppContext = useCallback((): AppContext => {
    const context: AppContext = {};

    // Vessel context - combine runtime data with fleet config
    if (selectedVessel) {
      const v = selectedVessel as Record<string, unknown>;
      
      // Get MMSI from vessel data
      const mmsi = typeof v.mmsi === 'string' ? v.mmsi : 
                   typeof v.id === 'string' && v.id.match(/^\d{9}$/) ? v.id : undefined;
      
      // Look up full vessel config for rich data
      const legacyVessel: LegacyVessel | undefined = mmsi ? getLegacyVesselByMMSI(mmsi) : undefined;
      
      // Support both position_lat/lng and current_lat/lng (legacy)
      const lat = typeof v.position_lat === 'number' ? v.position_lat : 
                  typeof v.current_lat === 'number' ? v.current_lat : undefined;
      const lng = typeof v.position_lng === 'number' ? v.position_lng : 
                  typeof v.current_lng === 'number' ? v.current_lng : undefined;
      
      // Calculate vessel age
      const yearBuilt = legacyVessel?.specs?.yearBuilt;
      const currentYear = new Date().getFullYear();
      const age = yearBuilt ? currentYear - yearBuilt : undefined;
      
      context.vessel = {
        // Identity
        name: selectedVessel.name,
        mmsi: mmsi,
        imo: legacyVessel?.imo || (typeof v.imo === 'string' ? v.imo : undefined),
        type: legacyVessel ? getLegacyVesselTypeName(legacyVessel.type) : selectedVessel.type,
        subType: legacyVessel?.subType,
        company: legacyVessel ? getLegacyCompanyName(legacyVessel.company) : undefined,
        
        // Current state
        status: typeof v.status === 'string' ? v.status : undefined,
        fuelLevel: typeof v.fuel_level === 'number' ? v.fuel_level : undefined,
        engineStatus: typeof v.engine_status === 'string' ? v.engine_status : undefined,
        healthScore: typeof v.health_score === 'number' ? v.health_score : undefined,
        location: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
        speed: typeof v.speed === 'number' ? v.speed : undefined,
        heading: typeof v.heading === 'number' ? v.heading : undefined,
        
        // Assignment
        project: legacyVessel?.project || (typeof v.project === 'string' ? v.project : undefined),
        captain: legacyVessel?.captain,
        crewCount: legacyVessel?.crewCount || (typeof v.crew_count === 'number' ? v.crew_count : undefined),
        
        // Specifications
        specs: legacyVessel?.specs ? {
          length: legacyVessel.specs.length,
          breadth: legacyVessel.specs.breadth,
          depth: legacyVessel.specs.depth,
          dredgingDepth: legacyVessel.specs.dredgingDepth,
          pumpPower: legacyVessel.specs.pumpPower,
          craneCapacity: legacyVessel.specs.craneCapacity,
          accommodation: legacyVessel.specs.accommodation,
          deckArea: legacyVessel.specs.deckArea,
          yearBuilt: legacyVessel.specs.yearBuilt,
          age: age,
        } : undefined,
        
        // Documentation
        datasheetUrl: legacyVessel?.datasheetUrl,
      };
    }

    // Active alerts for this vessel
    if (alerts && selectedVessel) {
      const vesselId = selectedVessel.id;
      const vesselAlerts = alerts
        .filter(a => {
          const alertVesselId = a.vessel_id || a.vesselId;
          const isResolved = a.resolved || a.status === 'resolved';
          return alertVesselId === vesselId && !isResolved;
        })
        .slice(0, 5); // Limit to 5 most relevant
      if (vesselAlerts.length > 0) {
        context.activeAlerts = vesselAlerts.map(a => ({
          severity: a.severity,
          message: a.message || a.title || a.description || 'Alert',
          component: undefined,
        }));
      }
    }

    // Weather context - include all available data
    if (weather) {
      const w = weather as Record<string, unknown>;
      context.weather = {
        condition: typeof w.condition === 'string' ? w.condition : undefined,
        windSpeed: typeof w.wind_speed === 'number' ? w.wind_speed : undefined,
        windDirection: typeof w.wind_direction === 'number' ? w.wind_direction : undefined,
        waveHeight: typeof w.wave_height === 'number' ? w.wave_height : undefined,
        visibility: typeof w.visibility === 'number' ? w.visibility : undefined,
        temperature: typeof w.temperature === 'number' ? w.temperature : undefined,
        severity: typeof w.severity === 'string' ? w.severity : undefined,
      };
    }

    // Equipment context
    if (equipmentType) {
      context.equipment = equipmentType;
    }

    // Fleet status context
    if (fleetMetrics) {
      context.fleetStatus = {
        totalVessels: fleetMetrics.totalVessels,
        operationalCount: fleetMetrics.operationalVessels,
        maintenanceCount: fleetMetrics.maintenanceVessels,
      };
    }

    return context;
  }, [selectedVessel, alerts, weather, equipmentType, fleetMetrics]);

  const sendMessage = async (content: string, imageFile?: File | null, skipUserMessage?: boolean) => {
    const capturedImageFile = imageFile !== undefined ? imageFile : selectedImageFile;
    if ((!content.trim() && !capturedImageFile) || isLoading) return;

    setHasInteracted(true);
    
    // Build rich context-aware query
    const appContext = buildAppContext();
    const hasContext = Object.keys(appContext).length > 0;
    
    // Debug: Log context being sent
    console.log('[TroubleshootPanel] Context - assetName:', appContext.vessel?.name || 'NO ASSET');
    console.log('[TroubleshootPanel] Context - hasImage:', !!capturedImageFile);
    console.log('[TroubleshootPanel] Context - knowledgeBase:', selectedKnowledgeBase);
    console.log('[TroubleshootPanel] Context - conversationLength:', messages.length);
    
    // Check if image is being sent
    const hasImage = !!capturedImageFile;
    
    // Build the user's actual message
    const userQuery = content.trim() || (hasImage ? 'Please analyze this image and help troubleshoot' : '');
    
    // Build context object for API (per Resolve API docs - context parameter)
    // This is passed separately from the message for cleaner processing
    const apiContext: Record<string, string> = {};
    
    if (hasContext && appContext) {
      // Extract relevant context fields
      if (appContext.vessel?.name) apiContext.vessel_name = appContext.vessel.name;
      if (appContext.vessel?.type) apiContext.vessel_type = appContext.vessel.type;
      if (appContext.weather?.condition) apiContext.weather = appContext.weather.condition;
      if (appContext.location?.description) apiContext.location = appContext.location.description;
      // Add any other relevant context
      apiContext.app_context = JSON.stringify(appContext);
    }
    
    // Track exchange count for context
    const exchangeCount = Math.floor(messages.length / 2);
    if (exchangeCount >= 2) {
      apiContext.exchange_count = String(exchangeCount + 1);
      apiContext.instruction = 'User has answered multiple questions. Generate actionable output (work_order or loto_procedure).';
    }

    // Capture blob preview before clearing (image file already captured at function start)
    const capturedBlobPreview = imagePreview;
    
    // Clear input immediately for better UX
    setInput('');
    removeImage();
    setIsLoading(true);

    try {
      // Upload image first if present (more efficient than base64)
      let imageUrl: string | undefined;
      if (capturedImageFile) {
        setIsUploading(true);
        try {
          imageUrl = await uploadImage(capturedImageFile);
          console.log('[TroubleshootPanel] Image uploaded:', {
            url: imageUrl,
            fileName: capturedImageFile.name,
            fileSize: capturedImageFile.size,
            fileType: capturedImageFile.type,
          });
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          throw new Error('Failed to upload image. Please try again.');
        } finally {
          setIsUploading(false);
        }
      }
      
      // Clean up blob preview URL
      if (capturedBlobPreview && capturedBlobPreview.startsWith('blob:')) {
        URL.revokeObjectURL(capturedBlobPreview);
      }

      // Create user message with the permanent uploaded URL (not the blob)
      // Skip if message was already added (e.g., from diagnostic form submission)
      if (!skipUserMessage) {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: content.trim() || 'Please analyze this image',
          imagePreview: imageUrl || undefined,  // Use uploaded URL, not blob
        };

        setMessages((prev) => [...prev, userMessage]);
      }

      // Create session if this is the first message (for conversation history)
      // Only try if sessions are supported (not previously failed)
      let currentSessionId = sessionId;
      if (!currentSessionId && sessionsSupported) {
        setIsCreatingSession(true);
        try {
          const sessionResponse = await fetch('/api/troubleshoot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create_session',
              title: `Troubleshooting: ${content.substring(0, 50)}...`,
              knowledgeBaseId: selectedKnowledgeBase,
            }),
          });
          const sessionData = await sessionResponse.json();
          if (sessionData.success && sessionData.session?.id) {
            currentSessionId = sessionData.session.id;
            setSessionId(currentSessionId);
            console.log('[TroubleshootPanel] Session created:', currentSessionId);
          } else {
            // API returned error - sessions not supported
            console.warn('[TroubleshootPanel] Sessions not supported, using stateless mode');
            setSessionsSupported(false);
          }
        } catch (sessionError) {
          console.error('Failed to create session, disabling sessions:', sessionError);
          setSessionsSupported(false);
        } finally {
          setIsCreatingSession(false);
        }
      }

      // Use sessions for ALL queries to maintain conversation context
      // Per Resolve API docs: stateless 'query' doesn't retain context for follow-ups
      let response: Response | undefined;
      let usedSession = false;
      
      // Try session-based messaging first (maintains context for follow-ups)
      if (currentSessionId && sessionsSupported) {
        try {
          // Build context-enriched message for sessions
          // This ensures the AI has asset/equipment context even in follow-ups
          let enrichedMessage = userQuery;
          if (hasContext && appContext.vessel) {
            const contextPrefix = `[Context: Asset "${appContext.vessel.name}" (${appContext.vessel.type})${appContext.vessel.project ? `, Program: ${appContext.vessel.project}` : ''}${appContext.vessel.healthScore ? `, Health: ${appContext.vessel.healthScore}%` : ''}${appContext.equipment ? `, Equipment focus: ${appContext.equipment}` : ''}]\n\n`;
            enrichedMessage = contextPrefix + userQuery;
          }
          
          console.log('[TroubleshootPanel] Using session for query:', { 
            sessionId: currentSessionId, 
            hasImage: !!imageUrl,
            assetName: appContext.vessel?.name || 'none',
            hasContext,
          });
          response = await fetch('/api/troubleshoot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'send_message',
              sessionId: currentSessionId,
              message: enrichedMessage,
              imageUrl, // Sessions support images per API docs
              responseFormat: 'ui',
              // Note: KB is inherited from session creation
              // Context is now embedded in message for AI awareness
            }),
          });
          
          if (response.ok) {
            usedSession = true;
          } else {
            // Session API failed, disable sessions and fall back
            console.warn('[TroubleshootPanel] Session API failed, disabling sessions');
            setSessionId(null);
            setSessionsSupported(false);
            currentSessionId = null;
          }
        } catch (sessionErr) {
          console.warn('[TroubleshootPanel] Session error, disabling sessions:', sessionErr);
          setSessionId(null);
          setSessionsSupported(false);
          currentSessionId = null;
        }
      }
      
      // Fallback to stateless query if no session or session failed
      if (!usedSession) {
        // Build context-enriched message for stateless queries
        let enrichedMessage = userQuery;
        if (hasContext && appContext.vessel) {
          const contextPrefix = `[Context: Asset "${appContext.vessel.name}" (${appContext.vessel.type})${appContext.vessel.project ? `, Program: ${appContext.vessel.project}` : ''}${appContext.vessel.healthScore ? `, Health: ${appContext.vessel.healthScore}%` : ''}${appContext.equipment ? `, Equipment focus: ${appContext.equipment}` : ''}]\n\n`;
          enrichedMessage = contextPrefix + userQuery;
        }
        
        console.log('[TroubleshootPanel] Using stateless query:', {
          assetName: appContext.vessel?.name || 'none',
          hasContext,
        });
        response = await fetch('/api/troubleshoot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: imageUrl ? 'analyze_image' : 'query',
            message: enrichedMessage,
            imageUrl,
            knowledgeBaseId: selectedKnowledgeBase,
            responseFormat: 'ui',
            context: Object.keys(apiContext).length > 0 ? apiContext : undefined,
          }),
        });
      }

      if (!response!.ok) {
        // Handle both JSON and text error responses
        const contentType = response!.headers.get('content-type');
        let errorMessage = 'Failed to get response';
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response!.json();
          errorMessage = errorData.error || 'Failed to get response';
        } else {
          const errorText = await response!.text();
          // Check for common error patterns
          if (errorText.includes('Request Entity Too Large') || response!.status === 413) {
            errorMessage = 'Image is too large. Please use an image smaller than 10MB.';
          } else {
            errorMessage = errorText || `Server error: ${response!.status}`;
          }
        }
        
        // Handle specific backend errors with user-friendly messages
        if (errorMessage.includes('Invalid regular expression') || errorMessage.includes('Unterminated group')) {
          throw new Error('The AI encountered a processing error. Please try rephrasing your question or starting a new conversation.');
        }
        if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          throw new Error('The request timed out. The AI may be processing a complex query. Please try again.');
        }
        
        throw new Error(errorMessage);
      }

      const data: QueryResponse = await response!.json();
      
      // Check for API-level errors (success: false with error message)
      const dataAny = data as unknown as Record<string, unknown>;
      if (dataAny.success === false && dataAny.error) {
        throw new Error(dataAny.error as string);
      }

      // Debug: Log the full response structure
      console.log('[TroubleshootPanel] === RAW API RESPONSE ===');
      console.log('[TroubleshootPanel] FULL DATA:', JSON.stringify(data, null, 2).substring(0, 2000));
      console.log('[TroubleshootPanel] type:', dataAny.type);
      console.log('[TroubleshootPanel] has data:', !!dataAny.data);
      console.log('[TroubleshootPanel] has response:', !!dataAny.response);
      console.log('[TroubleshootPanel] has answer:', !!dataAny.answer);
      console.log('[TroubleshootPanel] has data.responses:', !!(dataAny.data && (dataAny.data as Record<string, unknown>).responses));
      if (dataAny.data && (dataAny.data as Record<string, unknown>).responses) {
        const responses = (dataAny.data as Record<string, unknown>).responses as unknown[];
        console.log('[TroubleshootPanel] responses types:', responses.map((r: unknown) => (r as Record<string, unknown>).type));
      }
      console.log('[TroubleshootPanel] keys:', Object.keys(data));

      // Extract response type and data - handle multiple formats
      // The API can return in several formats:
      // 1. { type: 'multi_response', data: { responses: [...] } } - top-level
      // 2. { response: { type: 'multi_response', responses: [...] } } - nested (session API)
      // 3. { type: 'work_order', data: {...} } - direct type
      // 4. { response: { type: 'work_order', data: {...} } } - nested direct type
      const uiData = data as unknown as { type?: string; data?: unknown; responses?: unknown[] };
      const nestedResponse = data.response as { type?: string; data?: unknown; responses?: unknown[] } | undefined;
      const responseType = uiData.type || nestedResponse?.type;
      const responseData = uiData.data || nestedResponse?.data;
      
      // Build UIResponse for DynamicRenderer - this is the ONLY rendering path now
      let uiResponse: UIResponse | undefined;
      
      // Handle multi_response format at top level: { type: 'multi_response', data: { responses: [...] } }
      if (uiData.type === 'multi_response') {
        const multiData = uiData.data as { responses?: unknown[]; _meta?: { sources?: { manuals?: Array<{ title: string; page: number }> } } } | undefined;
        let responses = multiData?.responses || uiData.responses || [];
        
        // If responses is empty but we have sources in _meta, create a manual_citation
        if (responses.length === 0 && multiData?._meta?.sources?.manuals?.length) {
          console.log('[TroubleshootPanel] Empty responses but has sources, creating manual_citation');
          const manuals = multiData._meta.sources.manuals;
          responses = [{
            type: 'manual_citation',
            data: {
              title: 'Documentation Found',
              summary: `Found ${manuals.length} relevant sections in your indexed manuals.`,
              references: manuals.map((m: { title: string; page: number }) => ({
                manualId: '',
                manualName: m.title,
                pageNumber: m.page,
                section: '',
                snippet: '',
                relevance: 0.8,
              })),
            },
          }];
        }
        
        uiResponse = {
          type: 'multi_response',
          data: uiData.data,
          responses: responses as UIResponse[],
          sources: data.sources as UIResponse['sources'],
        } as MultiResponse;
        console.log('[TroubleshootPanel] ✅ multi_response (top-level) with', responses.length, 'children');
      }
      // Handle multi_response nested in response: { response: { type: 'multi_response', responses: [...] } }
      else if (nestedResponse?.type === 'multi_response') {
        const responses = nestedResponse.responses || (nestedResponse.data as { responses?: unknown[] })?.responses || [];
        uiResponse = {
          type: 'multi_response',
          data: nestedResponse.data || { responses },
          responses: responses as UIResponse[],
          sources: data.sources as UIResponse['sources'],
        } as MultiResponse;
        console.log('[TroubleshootPanel] ✅ multi_response (nested) with', responses.length, 'children');
      }
      // Handle direct type at top level: { type: 'work_order', data: {...} }
      else if (uiData.type && responseData) {
        uiResponse = {
          type: uiData.type as UIResponse['type'],
          data: responseData,
          sources: data.sources as UIResponse['sources'],
          exportable: ['work_order', 'loto_procedure', 'checklist', 'document_output', 'dynamic_form'].includes(uiData.type),
        };
        console.log('[TroubleshootPanel] ✅ Direct response:', uiData.type);
      }
      // Handle nested in response field: { response: { type: '...', data: {...} } }
      else if (nestedResponse?.type && nestedResponse?.data) {
        uiResponse = {
          type: nestedResponse.type as UIResponse['type'],
          data: nestedResponse.data,
          sources: data.sources as UIResponse['sources'],
          exportable: ['work_order', 'loto_procedure', 'checklist', 'document_output', 'dynamic_form'].includes(nestedResponse.type),
        };
        console.log('[TroubleshootPanel] ✅ Nested response:', nestedResponse.type);
      }
      // Fallback: Try to detect type from data structure
      else {
        const dataAny = data as unknown as Record<string, unknown>;
        // Check for work order indicators
        if (dataAny.workOrderNumber || dataAny.work_order_number || dataAny.equipmentTag || dataAny.equipment_tag) {
          uiResponse = {
            type: 'work_order',
            data: data,
            sources: data.sources as UIResponse['sources'],
            exportable: true,
          };
          console.log('[TroubleshootPanel] ✅ Inferred work_order from structure');
        }
        // Check for LOTO indicators
        else if (dataAny.isolationSteps || dataAny.isolation_steps || dataAny.hazards) {
          uiResponse = {
            type: 'loto_procedure',
            data: data,
            sources: data.sources as UIResponse['sources'],
            exportable: true,
          };
          console.log('[TroubleshootPanel] ✅ Inferred loto_procedure from structure');
        }
        // Check for info message (has message field)
        else if (dataAny.message && typeof dataAny.message === 'string') {
          uiResponse = {
            type: 'info_message',
            data: { title: dataAny.title as string || '', message: dataAny.message as string },
            sources: data.sources as UIResponse['sources'],
          };
          console.log('[TroubleshootPanel] ✅ Inferred info_message from structure');
        }
        // Check for selection options
        else if (dataAny.options && Array.isArray(dataAny.options)) {
          uiResponse = {
            type: 'selection',
            data: { question: dataAny.question as string || '', options: dataAny.options },
            sources: data.sources as UIResponse['sources'],
          };
          console.log('[TroubleshootPanel] ✅ Inferred selection from structure');
        }
        // IMPORTANT: If we have an answer but no type, render as info_message
        else if (data.answer && typeof data.answer === 'string' && data.answer.trim()) {
          // Check if the answer contains RCA markers (to display nicely)
          const hasRCA = data.answer.includes('ROOT CAUSE') || 
                         data.answer.includes('KNOWLEDGE BASE') ||
                         data.answer.includes('RECOMMENDATION');
          
          uiResponse = {
            type: 'info_message',
            data: { 
              title: hasRCA ? 'Analysis Complete' : '', 
              message: data.answer,
              // Add suggestions for next steps if this looks like a final diagnosis
              suggestions: hasRCA ? ['Generate Work Order', 'Generate LOTO Procedure', 'View Checklist'] : undefined,
            },
            sources: data.sources as UIResponse['sources'],
          };
          console.log('[TroubleshootPanel] ✅ Created info_message from answer field');
        }
        else {
          console.log('[TroubleshootPanel] ⚠️ Could not detect UI type, will render as text');
          // Still try to show something if there's any answer
          if (data.answer && data.answer.trim()) {
            uiResponse = {
              type: 'info_message',
              data: { title: '', message: data.answer },
              sources: data.sources as UIResponse['sources'],
            };
            console.log('[TroubleshootPanel] ✅ Fallback to info_message with answer');
          }
        }
      }
      
      console.log('[TroubleshootPanel] Final uiResponse type:', uiResponse?.type || 'none');
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || '', // Fallback content for non-UI responses
        sources: data.sources as UIResponse['sources'],
        latency: data.latency_ms,
        responseType: uiResponse?.type,
        responseData: uiResponse?.data,
        uiResponse,    // Primary: for DynamicRenderer
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Troubleshoot error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      
      // Check for timeout errors
      const isTimeout = errorMessage.includes('FUNCTION_INVOCATION_TIMEOUT') || 
                        errorMessage.includes('timeout') ||
                        errorMessage.includes('504');
      
      const userMessage = isTimeout
        ? 'The request timed out. This can happen with complex queries or image analysis. Please try:\n\n• Using a simpler text query first\n• Asking about a specific topic\n• Trying again in a moment'
        : `Sorry, I encountered an error: ${errorMessage}`;
      
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: userMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const resetChat = () => {
    setMessages([]);
    setHasInteracted(false);
    setInput('');
    removeImage();
    setSessionId(null);  // Clear session so a new one is created for next conversation
    setSessionsSupported(true);  // Re-enable sessions to retry on next conversation
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-black">
      {/* Header with Knowledge Base Selector */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
                  <Wrench className="h-3.5 w-3.5 text-white/70" />
                </div>
                <span className="text-sm font-medium text-white/90">Resolve</span>
              </div>
              <span className="text-[10px] text-white/40 hidden sm:block">AI-powered troubleshooting</span>
            </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={resetChat}
                className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                title="New session"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Knowledge Base Selector */}
        <div className="mt-2 relative" data-kb-dropdown>
          <button
            onClick={() => setShowKBDropdown(!showKBDropdown)}
            disabled={isLoadingKBs}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Database className="h-3.5 w-3.5 text-white/50 flex-shrink-0" />
              <span className="text-xs text-white/70 truncate">
                {isLoadingKBs ? 'Loading...' : selectedKBName}
              </span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-white/40 flex-shrink-0 transition-transform ${showKBDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {showKBDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#111111] border border-white/10 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedKnowledgeBase(null);
                  setShowKBDropdown(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors ${
                  !selectedKnowledgeBase ? 'bg-white/10 text-white' : 'text-white/70'
                }`}
              >
                <Database className="h-3.5 w-3.5" />
                <div className="min-w-0">
                  <span className="text-xs font-medium block">All Documents</span>
                  <span className="text-[10px] text-white/40">Search all P&IDs and manuals</span>
                </div>
              </button>
              {knowledgeBases.map((kb) => (
                <button
                  key={kb.id}
                  onClick={() => {
                    setSelectedKnowledgeBase(kb.id);
                    setShowKBDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors ${
                    selectedKnowledgeBase === kb.id ? 'bg-white/10 text-white' : 'text-white/70'
                  }`}
                >
                  <Database className="h-3.5 w-3.5" />
                  <div className="min-w-0">
                    <span className="text-xs font-medium block truncate">{kb.name}</span>
                    {kb.description && (
                      <span className="text-[10px] text-white/40 block truncate">{kb.description}</span>
                    )}
                  </div>
                </button>
              ))}
              {knowledgeBases.length === 0 && !isLoadingKBs && (
                <div className="px-3 py-2 text-xs text-white/40 text-center">
                  No knowledge bases found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        {!hasInteracted && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <Wrench className="h-6 w-6 text-white/60" />
            </div>
            <h3 className="text-lg font-medium text-white/90 mb-2">
              Resolve
            </h3>
            <p className="text-sm text-white/40 mb-6 text-center max-w-sm">
              Describe your issue or upload a photo. I&apos;ll analyze P&IDs and maintenance manuals to help diagnose and fix problems.
            </p>
            
            {/* Quick Prompts Grid */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {TROUBLESHOOT_PROMPTS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(item.prompt)}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/15 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-4 w-4 text-white/50" />
                  </div>
                  <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                    {item.text}
                  </span>
                </button>
              ))}
            </div>

            {/* Upload Photo CTA */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80 transition-all"
            >
              <Camera className="h-4 w-4" />
              <span className="text-sm">Upload Photo for Analysis</span>
            </button>
            
            <p className="text-xs text-white/30 mt-4 max-w-sm text-center">
              Powered by maintenance manuals & P&ID diagrams
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-white/15' 
                    : 'bg-white/5 border border-white/10'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-3.5 w-3.5 text-white/70" />
                  ) : (
                    <Wrench className="h-3.5 w-3.5 text-white/50" />
                  )}
                </div>

                <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  {/* User image preview */}
                  {message.imagePreview && (
                    <div className="mb-2 inline-block">
                      <img 
                        src={message.imagePreview} 
                        alt="Uploaded" 
                        className="max-w-[200px] rounded-lg border border-white/10"
                      />
                    </div>
                  )}
                  
                  {/* Render using DynamicRenderer for ALL structured UI responses */}
                  {message.role === 'assistant' && message.uiResponse ? (
                    <div className="w-full max-w-2xl">
                      <DynamicRenderer 
                        response={message.uiResponse}
                        handlers={{
                          onSelectionSelect: (option) => {
                            console.log('[DynamicRenderer] Selection:', option);
                            sendMessage(option.title);
                          },
                          onWorkOrderSubmit: (data) => {
                            console.log('[DynamicRenderer] Work order submitted:', data);
                          },
                          onSuggestionClick: (suggestion) => {
                            console.log('[DynamicRenderer] Suggestion clicked:', suggestion);
                            sendMessage(suggestion);
                          },
                          onDiagnosticSubmit: (messageForAI, displayMessage) => {
                            console.log('[DynamicRenderer] Diagnostic submitted');
                            console.log('  Display (user sees):', displayMessage.substring(0, 50) + '...');
                            console.log('  AI message length:', messageForAI.length);
                            // Add user message with clean display text, send AI message to API
                            const userMessage: Message = {
                              id: Date.now().toString(),
                              role: 'user',
                              content: displayMessage,
                            };
                            setMessages((prev) => [...prev, userMessage]);
                            // Send the AI-specific message (with instructions) but user doesn't see it
                            sendMessage(messageForAI, undefined, true);
                          },
                          onExport: (type, data) => {
                            console.log('[DynamicRenderer] Export:', type, data);
                          },
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className={`inline-block rounded-xl text-sm ${
                        message.role === 'user'
                          ? 'px-3.5 py-2.5 bg-white/10 text-white/90 rounded-tr-sm'
                          : 'px-4 py-3 bg-gradient-to-br from-white/[0.04] to-white/[0.02] text-white/80 rounded-tl-sm border border-white/[0.08] shadow-lg'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div 
                          className="troubleshoot-response max-w-none [&>p]:my-2 [&>p]:leading-relaxed [&>p]:text-white/70 [&_strong]:text-white [&_strong]:font-semibold [&>h1]:text-white [&>h2]:text-white [&>h3]:text-white/90 [&>h4]:text-white/80"
                          dangerouslySetInnerHTML={{ __html: ensureHtmlRenderable(message.content) }}
                          onClick={(e) => {
                            const target = e.target as HTMLElement;
                            
                            // Handle selection option clicks
                            const optionEl = target.closest('[data-option-value]') as HTMLElement;
                            if (optionEl) {
                              const optionValue = optionEl.getAttribute('data-option-value');
                              if (optionValue) {
                                sendMessage(optionValue);
                              }
                              return;
                            }
                            
                            // Handle Export PDF clicks
                            const exportBtn = target.closest('[data-action="export-pdf"]') as HTMLElement;
                            if (exportBtn) {
                              const exportType = exportBtn.getAttribute('data-export-type') || 'document';
                              const exportTitle = exportBtn.getAttribute('data-export-title') || 'Document';
                              
                              // Find the parent card content to export
                              const cardEl = exportBtn.closest('.work-order-card, .loto-procedure, .checklist-card, .dynamic-form') as HTMLElement;
                              if (cardEl) {
                                // Clone and clean for printing
                                const clone = cardEl.cloneNode(true) as HTMLElement;
                                // Remove the action buttons from the clone
                                const buttons = clone.querySelectorAll('[data-action]');
                                buttons.forEach(btn => btn.parentElement?.remove());
                                
                                const printWindow = window.open('', '_blank');
                                if (printWindow) {
                                  printWindow.document.write(`
                                    <!DOCTYPE html>
                                    <html>
                                    <head>
                                      <title>${exportTitle}</title>
                                      <style>
                                        @page { size: portrait; margin: 0.75in; }
                                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 20px; }
                                        h1 { font-size: 20pt; margin-bottom: 8pt; color: #111; border-bottom: 2px solid #333; padding-bottom: 8pt; }
                                        h2, h3 { font-size: 14pt; margin-top: 16pt; color: #333; }
                                        h4 { font-size: 11pt; margin-top: 12pt; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
                                        p { margin: 6pt 0; }
                                        .space-y-2 > * + * { margin-top: 8pt; }
                                        .space-y-3 > * + * { margin-top: 12pt; }
                                        .space-y-4 > * + * { margin-top: 16pt; }
                                        .flex { display: flex; }
                                        .gap-2 { gap: 8pt; }
                                        .gap-3 { gap: 12pt; }
                                        .items-center { align-items: center; }
                                        .items-start { align-items: flex-start; }
                                        .rounded-lg, .rounded-xl { border: 1px solid #ddd; border-radius: 6pt; padding: 12pt; margin: 8pt 0; }
                                        .bg-rose-500\\/10, .bg-amber-500\\/10 { background: #fef3c7; border-color: #f59e0b; }
                                        .bg-emerald-500\\/10 { background: #d1fae5; border-color: #10b981; }
                                        .bg-blue-500\\/10 { background: #dbeafe; border-color: #3b82f6; }
                                        .text-rose-300, .text-rose-400 { color: #dc2626; }
                                        .text-amber-300, .text-amber-400 { color: #d97706; }
                                        .text-emerald-300, .text-emerald-400 { color: #059669; }
                                        .text-blue-300, .text-blue-400 { color: #2563eb; }
                                        .text-white { color: #1a1a1a; }
                                        .text-white\\/90, .text-white\\/80, .text-white\\/70 { color: #333; }
                                        .text-white\\/60, .text-white\\/50, .text-white\\/40 { color: #666; }
                                        .font-semibold, .font-bold, .font-medium { font-weight: 600; }
                                        .text-xs, .text-\\[10px\\] { font-size: 9pt; }
                                        .text-sm { font-size: 10pt; }
                                        .text-xl { font-size: 16pt; }
                                        .uppercase { text-transform: uppercase; }
                                        .tracking-wider { letter-spacing: 0.5px; }
                                        table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
                                        th, td { border: 1px solid #ccc; padding: 8pt; text-align: left; font-size: 10pt; }
                                        th { background: #f5f5f5; font-weight: 600; }
                                        .border-t { border-top: 1px solid #ddd; padding-top: 12pt; margin-top: 12pt; }
                                        .border-b { border-bottom: 1px solid #ddd; padding-bottom: 12pt; margin-bottom: 12pt; }
                                        .px-2, .px-4, .py-1, .py-2 { padding: 4pt 8pt; }
                                        .rounded { border-radius: 4pt; }
                                        .w-6, .w-7, .h-6, .h-7 { width: 20pt; height: 20pt; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #f0f0f0; font-size: 10pt; margin-right: 8pt; }
                                        .bg-amber-500\\/20 { background: #fef3c7; }
                                        .bg-rose-500\\/20 { background: #fee2e2; }
                                        .bg-emerald-500\\/20 { background: #d1fae5; }
                                        .ml-10 { margin-left: 28pt; }
                                        svg { display: none; }
                                        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
                                      </style>
                                    </head>
                                    <body>
                                      <h1>${exportTitle}</h1>
                                      ${clone.innerHTML}
                                      <p style="margin-top: 32pt; font-size: 9pt; color: #999; border-top: 1px solid #ddd; padding-top: 12pt;">
                                        Generated on ${new Date().toLocaleString()}
                                      </p>
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
                              }
                              return;
                            }
                            
                            // Handle Submit clicks
                            const submitBtn = target.closest('[data-action="submit-form"]') as HTMLElement;
                            if (submitBtn) {
                              const submitText = submitBtn.querySelector('.submit-text') as HTMLElement;
                              if (submitText && submitText.textContent !== 'Submitted ✓') {
                                submitText.textContent = 'Submitted ✓';
                                submitBtn.classList.remove('bg-emerald-500/20', 'hover:bg-emerald-500/30', 'border-emerald-500/30', 'hover:border-emerald-500/50');
                                submitBtn.classList.add('bg-emerald-500/40', 'border-emerald-500/50', 'cursor-default');
                                submitBtn.setAttribute('disabled', 'true');
                              }
                              return;
                            }
                            
                            // Handle Copy clicks
                            const copyBtn = target.closest('[data-action="copy-content"]') as HTMLElement;
                            if (copyBtn) {
                              const cardEl = copyBtn.closest('.smart-document, .work-order-card, .loto-procedure, .checklist-card, .dynamic-form, .equipment-card') as HTMLElement;
                              if (cardEl) {
                                // Get text content, removing action buttons
                                const clone = cardEl.cloneNode(true) as HTMLElement;
                                const buttons = clone.querySelectorAll('[data-action]');
                                buttons.forEach(btn => btn.parentElement?.remove());
                                const text = clone.textContent || '';
                                navigator.clipboard.writeText(text.trim()).then(() => {
                                  const copyText = copyBtn.querySelector('.copy-text') as HTMLElement;
                                  if (copyText) {
                                    copyText.textContent = 'Copied!';
                                    setTimeout(() => {
                                      copyText.textContent = 'Copy';
                                    }, 2000);
                                  }
                                });
                              }
                              return;
                            }
                          }}
                        />
                      ) : (
                        <p className="leading-relaxed">{message.content}</p>
                      )}
                    </div>
                  )}

                  {/* Sources & Metadata */}
                  {message.sources && (
                    <SourcesDisplay sources={message.sources} latency={message.latency} />
                  )}
                  
                  {/* Export Actions for assistant messages */}
                  {message.role === 'assistant' && (
                    <MessageActions 
                      content={message.content} 
                      responseType={message.responseType}
                      responseData={message.responseData}
                    />
                  )}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Wrench className="h-3.5 w-3.5 text-white/50" />
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl rounded-tl-sm bg-white/[0.03] border border-white/5">
                  <Loader2 className="h-3.5 w-3.5 text-white/40 animate-spin" />
                  <span className="text-sm text-white/40">Analyzing documentation...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="flex-shrink-0 px-4 pb-2">
          <div className="relative inline-block">
            <img 
              src={imagePreview} 
              alt="Selected" 
              className="h-20 rounded-lg border border-white/20"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-white/5">
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/8 text-white/40 hover:text-white/70 hover:border-white/15 transition-all"
            title="Upload image"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the issue..."
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/8 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={(!input.trim() && !selectedImageFile) || isLoading || isUploading}
            className="px-3 py-2.5 rounded-lg bg-white/15 text-white/80 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {isLoading || isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// Sources display component
function SourcesDisplay({ sources, latency }: { sources: Source; latency?: number }) {
  const hasPnids = sources.pnids && sources.pnids.length > 0;
  const hasManuals = sources.manuals && sources.manuals.length > 0;

  if (!hasPnids && !hasManuals) return null;

  return (
    <div className="mt-2 space-y-1">
      {/* P&ID Sources */}
      {hasPnids && (
        <div className="flex flex-wrap gap-1">
          {sources.pnids.slice(0, 3).map((pnid, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/50 border border-white/10"
            >
              <FileText className="h-2.5 w-2.5" />
              {pnid.tag} • {pnid.drawing}
            </span>
          ))}
          {sources.pnids.length > 3 && (
            <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/40">
              +{sources.pnids.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Manual Sources */}
      {hasManuals && (
        <div className="flex flex-wrap gap-1">
          {sources.manuals.slice(0, 2).map((manual, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/50 border border-white/10"
            >
              <BookOpen className="h-2.5 w-2.5" />
              {manual.title} p.{manual.page}
            </span>
          ))}
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-3 text-[10px] text-white/30 pt-1">
        <span>Searched {sources.searchedPnidCount} P&IDs, {sources.searchedManualCount} manuals</span>
        {latency && <span>• {latency}ms</span>}
      </div>
    </div>
  );
}

// Message actions component (copy, download)
function MessageActions({ 
  content, 
  responseType, 
  responseData 
}: { 
  content: string; 
  responseType?: string;
  responseData?: unknown;
}) {
  const [copied, setCopied] = useState(false);
  
  // Convert HTML content to plain text for copying/downloading
  const getPlainText = useCallback(() => {
    // Create a temporary element to extract text from HTML
    const temp = document.createElement('div');
    temp.innerHTML = content;
    return temp.textContent || temp.innerText || '';
  }, [content]);
  
  const handleCopy = async () => {
    try {
      const text = getPlainText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const handleDownload = () => {
    const text = getPlainText();
    const filename = responseType === 'work_order' 
      ? `work-order-${Date.now()}.txt`
      : responseType === 'loto_procedure'
      ? `loto-procedure-${Date.now()}.txt`
      : `resolve-response-${Date.now()}.txt`;
    
    // Create blob and download
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleDownloadJSON = () => {
    if (!responseData) return;
    
    const filename = responseType === 'work_order' 
      ? `work-order-${Date.now()}.json`
      : responseType === 'loto_procedure'
      ? `loto-procedure-${Date.now()}.json`
      : `resolve-response-${Date.now()}.json`;
    
    const blob = new Blob([JSON.stringify(responseData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/5">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
        title="Copy to clipboard"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 text-emerald-400" />
            <span className="text-emerald-400">Copied</span>
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" />
            <span>Copy</span>
          </>
        )}
      </button>
      
      <button
        onClick={handleDownload}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
        title="Download as text"
      >
        <Download className="h-3 w-3" />
        <span>Export</span>
      </button>
      
      {!!responseData && (responseType === 'work_order' || responseType === 'loto_procedure') && (
        <button
          onClick={handleDownloadJSON}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          title="Download as JSON"
        >
          <FileText className="h-3 w-3" />
          <span>JSON</span>
        </button>
      )}
    </div>
  );
}

// Format UI response (direct {type, data} format)
function formatUIResponse(type: string, data: unknown): string {
  switch (type) {
    case 'info_message':
      return formatInfoMessage(data as { title?: string; message: string; details?: string[] });
    case 'checklist':
      return formatChecklist(data as { title?: string; items: Array<Record<string, unknown>> });
    case 'selection':
      return formatSelection(data as { title?: string; question?: string; options: Array<{ id?: string; title?: string; label?: string; subtitle?: string; description?: string }> });
    case 'work_order':
      return formatWorkOrder(data as WorkOrderData);
    case 'loto_procedure':
      return formatLotoProcedure(data as LotoProcedureData);
    case 'equipment_card':
      return formatEquipmentCard(data as EquipmentCardData);
    case 'dynamic_form':
      return formatDynamicForm(data as DynamicFormData);
    case 'image_card':
      return formatImageCard(data as ImageCardData);
    case 'research_result':
      return formatResearchResult(data as ResearchResultData);
    case 'data_table':
      return formatDataTable(data as DataTableData);
    case 'multi_response': {
      const multiData = data as { responses?: Array<{ type: string; data: unknown }>; _meta?: unknown };
      return formatMultiResponse(multiData);
    }
      default:
        // Fallback - try to extract message or stringify
        if (typeof data === 'object' && data !== null) {
          const obj = data as Record<string, unknown>;
          
          // Check for message field
          if ('message' in obj && typeof obj.message === 'string') {
            const content = formatMarkdown(obj.message);
            // If it looks like a document, wrap with actions
            if (isDocumentType(type) || looksLikeDocument(data)) {
              const title = (obj.title as string) || (obj.name as string) || type;
              return wrapWithDocumentActions(content, { title, type, showSubmit: true });
            }
            return content;
          }
          
          // Check for responses array (multi_response without explicit type)
          if ('responses' in obj && Array.isArray(obj.responses)) {
            return formatMultiResponse(obj as { responses: Array<{ type: string; data: unknown }> });
          }
          
          // For unknown document-like types, try to render intelligently
          if (looksLikeDocument(data)) {
            const title = (obj.title as string) || (obj.name as string) || (obj.equipment_name as string) || type;
            let content = '<div class="space-y-3">';
            
            // Try to extract and format common fields
            if (obj.title || obj.name) {
              content += `<h3 class="font-semibold text-white text-sm">${obj.title || obj.name}</h3>`;
            }
            if (obj.description) {
              content += `<div class="text-white/70 text-sm">${parseSmartContent(String(obj.description))}</div>`;
            }
            
            // Render arrays as lists
            for (const [key, value] of Object.entries(obj)) {
              if (Array.isArray(value) && value.length > 0 && !['responses'].includes(key)) {
                content += `<div class="mt-3">
                  <h4 class="text-[10px] uppercase tracking-wider text-white/40 mb-2">${key.replace(/_/g, ' ')}</h4>
                  <div class="space-y-1">
                    ${value.map((item, i) => {
                      const text = typeof item === 'string' ? item : (item.text || item.description || item.name || JSON.stringify(item));
                      return `<div class="flex gap-2 items-start text-sm">
                        <span class="w-5 h-5 rounded bg-white/10 text-white/60 flex items-center justify-center text-[10px]">${i + 1}</span>
                        <span class="text-white/70">${text}</span>
                      </div>`;
                    }).join('')}
                  </div>
                </div>`;
              }
            }
            
            content += '</div>';
            return wrapWithDocumentActions(content, { title, type, showSubmit: true });
          }
        }
        
        // Last resort - format as JSON
        return formatMarkdown(JSON.stringify(data, null, 2));
  }
}

// Format API response to HTML
function formatResponse(data: QueryResponse): string {
  // Check for explicit error
  if (data.success === false) {
    return `<p class="text-rose-400">Error: ${data.error || 'Unknown error'}</p>`;
  }

  // PRIORITY 1: Handle 'ui' format - direct {type, data} response
  // Check this FIRST before checking for answer field
  const uiData = data as unknown as { type?: string; data?: unknown };
  if (uiData.type && uiData.data) {
    return formatUIResponse(uiData.type, uiData.data);
  }
  
  // PRIORITY 2: Handle 'json' format - wrapped {response: {type, data}}
  if (data.response && typeof data.response === 'object') {
    const responseObj = data.response as { type?: string; data?: unknown };
    if (responseObj.type && responseObj.data) {
      return formatUIResponse(responseObj.type, responseObj.data);
    }
  }

  // PRIORITY 3: Handle text/html format (answer field)
  if (data.answer) {
    let answer = data.answer;
    
    // Aggressively unescape HTML entities if they exist
    if (answer.includes('&lt;') || answer.includes('&gt;') || answer.includes('&amp;') || answer.includes('&quot;')) {
      answer = unescapeHtml(answer);
      // Unescape again in case of double-escaping
      if (answer.includes('&lt;') || answer.includes('&gt;')) {
        answer = unescapeHtml(answer);
      }
    }
    
    // Check if the content is already HTML (has actual tags)
    if (answer.includes('<div') || answer.includes('<p ') || answer.includes('<p>') || 
        answer.includes('<h1') || answer.includes('<h2') || answer.includes('<h3') ||
        answer.includes('<span') || answer.includes('<ul') || answer.includes('<ol') ||
        answer.includes('<table') || answer.includes('<section')) {
      // Content is already HTML - return as-is with wrapper
      return `<div class="troubleshoot-html-response">${answer}</div>`;
    }
    
    // Plain text/markdown - format it
    return formatMarkdown(answer);
  }

  // Fallback - no recognized format
  return '<p class="text-white/50">No response available</p>';
}

// Format multi_response type (array of responses)
function formatMultiResponse(data: { responses?: Array<{ type: string; data: unknown }>; _meta?: unknown } | null | undefined): string {
  // Check if we have actual responses
  if (!data || !data.responses || data.responses.length === 0) {
    // Check if we at least have metadata with sources
    const meta = data?._meta as { sources?: { manuals?: Array<{ title: string; page: number }> } } | undefined;
    if (meta?.sources?.manuals && meta.sources.manuals.length > 0) {
      let html = '<div class="space-y-2">';
      html += '<p class="text-white/60">Found relevant documentation but no specific diagnosis was generated. Sources found:</p>';
      html += '<div class="flex flex-wrap gap-1 mt-2">';
      meta.sources.manuals.slice(0, 5).forEach(m => {
        html += `<span class="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/50">${m.title} p.${m.page}</span>`;
      });
      if (meta.sources.manuals.length > 5) {
        html += `<span class="px-2 py-1 text-xs text-white/40">+${meta.sources.manuals.length - 5} more</span>`;
      }
      html += '</div>';
      html += '<p class="text-white/40 text-xs mt-2">Try being more specific about the symptoms or equipment.</p>';
      html += '</div>';
      return html;
    }
    return '<p class="text-white/50">No response available. Please try rephrasing your question.</p>';
  }

  let html = '<div class="space-y-4">';
  
  for (const response of data.responses) {
    switch (response.type) {
      case 'info_message':
        html += formatInfoMessage(response.data as { title?: string; message: string; details?: string[] });
        break;
      case 'checklist':
        console.log('[TroubleshootPanel] Checklist data:', JSON.stringify(response.data, null, 2));
        html += formatChecklist(response.data as { title?: string; items: Array<Record<string, unknown>> });
        break;
      case 'selection':
        html += formatSelectionEnhanced(response.data as { question?: string; options: Array<{ id?: string; title?: string; subtitle?: string }> });
        break;
      case 'work_order':
        html += formatWorkOrder(response.data as WorkOrderData);
        break;
      case 'loto_procedure':
        html += formatLotoProcedure(response.data as LotoProcedureData);
        break;
      case 'equipment_card':
        html += formatEquipmentCard(response.data as EquipmentCardData);
        break;
      case 'dynamic_form':
        html += formatDynamicForm(response.data as DynamicFormData);
        break;
      case 'image_card':
        html += formatImageCard(response.data as ImageCardData);
        break;
      case 'research_result':
        html += formatResearchResult(response.data as ResearchResultData);
        break;
      case 'data_table':
        html += formatDataTable(response.data as DataTableData);
        break;
      case 'rca':
        html += formatRCA(response.data as RCAData);
        break;
      default:
        // Handle any unknown response types gracefully
        if (typeof response.data === 'object' && response.data !== null) {
          const rd = response.data as Record<string, unknown>;
          if ('message' in rd) {
            html += formatMarkdown(String(rd.message));
          } else if ('content' in rd) {
            html += formatMarkdown(String(rd.content));
          } else if ('analysis' in rd) {
            html += formatMarkdown(String(rd.analysis));
          } else if ('text' in rd) {
            html += formatMarkdown(String(rd.text));
          } else {
            // Last resort: show the data as formatted JSON
            html += `<div class="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <h4 class="text-xs uppercase tracking-wider text-white/40 mb-2">Response</h4>
              <pre class="text-xs text-white/70 whitespace-pre-wrap">${escapeHtml(JSON.stringify(rd, null, 2))}</pre>
            </div>`;
          }
        }
    }
  }
  
  html += '</div>';
  return html;
}

// Enhanced selection format for multi_response
function formatSelectionEnhanced(data: { question?: string; options: Array<{ id?: string; title?: string; subtitle?: string }> }): string {
  let html = '<div class="mt-5 pt-4 border-t border-white/10">';
  if (data.question) {
    html += `<p class="text-white/70 text-sm mb-4 font-medium">${data.question}</p>`;
  }
  html += '<div class="grid gap-2">';
  data.options.forEach((option) => {
    const optionTitle = option.title || option.id || 'Option';
    const optionValue = `${optionTitle}${option.subtitle ? ': ' + option.subtitle : ''}`;
    html += `
      <div 
        data-option-value="${escapeHtml(optionValue)}"
        class="group p-3 rounded-xl bg-gradient-to-r from-white/[0.04] to-white/[0.02] border border-white/10 hover:border-blue-500/40 hover:from-blue-500/10 hover:to-blue-500/5 cursor-pointer transition-all duration-200 active:scale-[0.98]"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-7 h-7 rounded-lg bg-white/10 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
            <svg class="w-3.5 h-3.5 text-white/40 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white/90 text-sm font-medium group-hover:text-white transition-colors">${optionTitle}</p>
            ${option.subtitle ? `<p class="text-white/40 text-xs mt-0.5 leading-relaxed group-hover:text-white/50 transition-colors">${option.subtitle}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  });
  html += '</div></div>';
  return html;
}

function formatInfoMessage(data: { title?: string; message: string; details?: string[]; severity?: string; suggestions?: string[] }): string {
  // Check if message looks like a document/procedure (has numbered steps, sections, etc.)
  const hasStructuredContent = data.message && (
    /\d+\.\s+[A-Z]/.test(data.message) ||  // Numbered sections
    /^[A-Z][A-Z\s]+:/m.test(data.message) || // ALL CAPS headers
    data.message.split('\n').length > 5      // Multi-line content
  );
  
  let html = '<div class="info-message space-y-3">';
  
  // Severity indicator
  if (data.severity && data.severity !== 'info') {
    const severityStyles: Record<string, string> = {
      'warning': 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      'error': 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      'success': 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    };
    const style = severityStyles[data.severity] || '';
    if (style) {
      html += `<div class="px-3 py-1.5 rounded-lg border ${style} text-xs font-medium uppercase tracking-wide inline-block">${data.severity}</div>`;
    }
  }
  
  if (data.title) {
    // Check for emoji prefix to apply appropriate styling
    const hasEmoji = /^[\u{1F300}-\u{1F9FF}]/u.test(data.title);
    if (hasEmoji) {
      html += `<h3 class="font-semibold text-white text-sm flex items-center gap-2">${data.title}</h3>`;
    } else {
      html += `<h3 class="font-semibold text-white text-sm">${data.title}</h3>`;
    }
  }
  
  // Use smart content parser for structured content, otherwise use markdown
  if (hasStructuredContent) {
    html += '<div class="text-white/70">' + parseSmartContent(data.message) + '</div>';
  } else {
    html += '<div class="text-white/70">' + formatMarkdown(data.message) + '</div>';
  }
  
  // Handle details array if present
  if (data.details) {
    const detailsArray = Array.isArray(data.details) ? data.details : [data.details];
    if (detailsArray.length > 0) {
      html += '<div class="mt-4 pt-3 border-t border-white/10">';
      html += '<div class="space-y-2">';
      detailsArray.forEach((detail) => {
        const detailText = typeof detail === 'string' ? detail : JSON.stringify(detail);
        html += `<div class="flex gap-2 items-start">
          <span class="text-white/30 mt-0.5">•</span>
          <p class="text-xs text-white/50 leading-relaxed">${detailText}</p>
        </div>`;
      });
      html += '</div></div>';
    }
  }
  
  // Handle suggestions array if present
  if (data.suggestions && data.suggestions.length > 0) {
    html += '<div class="mt-4 pt-3 border-t border-white/10">';
    html += '<h4 class="text-[10px] uppercase tracking-wider text-white/40 mb-2">Suggested Actions</h4>';
    html += '<div class="space-y-1.5">';
    data.suggestions.forEach((suggestion) => {
      html += `<div class="flex gap-2 items-start text-sm">
        <span class="text-emerald-400">→</span>
        <span class="text-white/70">${suggestion}</span>
      </div>`;
    });
    html += '</div></div>';
  }
  
  html += '</div>';
  return html;
}

function formatChecklist(data: { title?: string; description?: string; items: Array<Record<string, unknown>> }): string {
  let html = '<div class="checklist-card space-y-3">';
  if (data.title) {
    html += `<h3 class="font-semibold text-white text-sm mb-2">${data.title}</h3>`;
  }
  if (data.description) {
    html += `<p class="text-white/60 text-xs mb-3">${data.description}</p>`;
  }
  html += '<div class="space-y-2">';
  
  if (!data.items || data.items.length === 0) {
    html += '<p class="text-white/50 text-sm">No checklist items</p>';
  } else {
    data.items.forEach((item, i) => {
      // Handle different property names from Resolve API
      // API uses: id, text, priority, reference, checked
      const stepText = String(item.text || item.step || item.description || item.action || item.instruction || item.content || 'Step');
      const details = item.details || item.notes || item.note || item.reference;
      const priority = String(item.priority || 'medium').toLowerCase();
      const isHighPriority = priority === 'high' || item.critical === true || item.important === true;
      const isChecked = item.checked === true;
      
      // Priority color classes
      const priorityColors: Record<string, string> = {
        'high': 'bg-rose-500/10 border-rose-500/25',
        'medium': 'bg-white/[0.03] border-white/8',
        'low': 'bg-emerald-500/5 border-emerald-500/15',
      };
      const bgClass = priorityColors[priority] || priorityColors['medium'];
      
      html += `
        <div class="flex gap-3 p-3 rounded-xl ${bgClass} hover:border-white/15 transition-colors ${isChecked ? 'opacity-60' : ''}">
          <span class="flex-shrink-0 w-6 h-6 rounded-lg ${isHighPriority ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-white/60'} flex items-center justify-center text-xs font-bold">${i + 1}</span>
          <div class="flex-1 min-w-0">
            <p class="text-white/90 text-sm leading-relaxed ${isChecked ? 'line-through' : ''}">${stepText}</p>
            ${details ? `<p class="text-white/40 text-xs mt-1.5 leading-relaxed">${details}</p>` : ''}
            <div class="flex gap-2 mt-1.5">
              ${isHighPriority ? '<span class="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/20 text-rose-400 uppercase tracking-wide">High Priority</span>' : ''}
              ${isChecked ? '<span class="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 uppercase tracking-wide">✓ Complete</span>' : ''}
            </div>
          </div>
        </div>
      `;
    });
  }
  
  // Action Buttons
  html += `
    <div class="flex gap-2 pt-3 mt-3 border-t border-white/10">
      <button 
        data-action="export-pdf" 
        data-export-type="checklist"
        data-export-title="Checklist - ${data.title || 'Troubleshooting'}"
        class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-sm font-medium transition-all"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        Export PDF
      </button>
      <button 
        data-action="submit-form"
        data-form-type="checklist"
        class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-all"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        <span class="submit-text">Submit</span>
      </button>
    </div>
  `;
  
  html += '</div></div>';
  return html;
}

function formatSelection(data: { title?: string; question?: string; options: Array<{ id?: string; title?: string; label?: string; subtitle?: string; description?: string }> }): string {
  let html = '<div class="mt-4 pt-4 border-t border-white/10">';
  if (data.title) {
    html += `<h3 class="font-semibold text-white mb-3 text-sm">${data.title}</h3>`;
  }
  if (data.question) {
    html += `<p class="text-white/60 text-sm mb-4">${data.question}</p>`;
  }
  html += '<div class="grid gap-2">';
  data.options.forEach((option) => {
    const displayTitle = option.title || option.label || option.id || 'Option';
    const displayDesc = option.subtitle || option.description;
    const optionValue = `${displayTitle}${displayDesc ? ': ' + displayDesc : ''}`;
    html += `
      <div 
        data-option-value="${escapeHtml(optionValue)}"
        class="group p-3 rounded-xl bg-gradient-to-r from-white/[0.04] to-white/[0.02] border border-white/10 hover:border-white/25 hover:from-white/[0.08] hover:to-white/[0.04] cursor-pointer transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 group-hover:bg-white/15 flex items-center justify-center transition-colors">
            <svg class="w-4 h-4 text-white/50 group-hover:text-white/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white/90 text-sm font-medium group-hover:text-white transition-colors">${displayTitle}</p>
            ${displayDesc ? `<p class="text-white/40 text-xs mt-1 leading-relaxed group-hover:text-white/50 transition-colors">${displayDesc}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  });
  html += '</div></div>';
  return html;
}

// Escape HTML special characters for safe attribute values
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Smart content parser - intelligently formats any text into structured sections
function parseSmartContent(text: string): string {
  if (!text) return '';
  
  // Split into lines for processing
  const lines = text.split('\n');
  let html = '';
  let inList = false;
  let listType: 'numbered' | 'bullet' | null = null;
  let currentSection: string | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      // Empty line - close any open list
      if (inList) {
        html += listType === 'numbered' ? '</ol>' : '</ul>';
        inList = false;
        listType = null;
      }
      continue;
    }
    
    // Detect section headers (ALL CAPS with colon, or numbered section like "1. HEADER:")
    const sectionMatch = line.match(/^(\d+\.\s*)?([A-Z][A-Z\s\-&]+):?\s*$/);
    if (sectionMatch && line.length < 60) {
      if (inList) {
        html += listType === 'numbered' ? '</ol>' : '</ul>';
        inList = false;
      }
      currentSection = sectionMatch[2] || line;
      html += `<div class="mt-4 mb-2"><h4 class="text-xs font-semibold text-white/90 uppercase tracking-wide flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
        ${line.replace(/:$/, '')}
      </h4></div>`;
      continue;
    }
    
    // Detect sub-section headers (Title Case with colon)
    const subSectionMatch = line.match(/^([A-Z][a-zA-Z\s]+):\s*$/);
    if (subSectionMatch && line.length < 40) {
      if (inList) {
        html += listType === 'numbered' ? '</ol>' : '</ul>';
        inList = false;
      }
      html += `<p class="mt-3 mb-1 text-white/70 text-sm font-medium">${line}</p>`;
      continue;
    }
    
    // Detect numbered items (1. or 1) at start)
    const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (numberedMatch) {
      if (!inList || listType !== 'numbered') {
        if (inList) html += listType === 'numbered' ? '</ol>' : '</ul>';
        html += '<ol class="space-y-2 my-2">';
        inList = true;
        listType = 'numbered';
      }
      const content = numberedMatch[2];
      // Check if it's a section header within the list
      const isHeader = /^[A-Z][A-Z\s\-&]+:/.test(content);
      if (isHeader) {
        html += `<li class="flex gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/8">
          <span class="flex-shrink-0 w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">${numberedMatch[1]}</span>
          <div class="flex-1"><p class="text-white/90 text-sm font-medium">${content}</p></div>
        </li>`;
      } else {
        html += `<li class="flex gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
          <span class="flex-shrink-0 w-5 h-5 rounded bg-white/10 text-white/60 flex items-center justify-center text-[10px] font-medium">${numberedMatch[1]}</span>
          <span class="text-white/70 text-sm">${content}</span>
        </li>`;
      }
      continue;
    }
    
    // Detect bullet points (-, *, •)
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      if (!inList || listType !== 'bullet') {
        if (inList) html += listType === 'numbered' ? '</ol>' : '</ul>';
        html += '<ul class="space-y-1.5 my-2 ml-2">';
        inList = true;
        listType = 'bullet';
      }
      html += `<li class="flex gap-2 items-start text-sm">
        <span class="text-white/30 mt-0.5">▸</span>
        <span class="text-white/70">${bulletMatch[1]}</span>
      </li>`;
      continue;
    }
    
    // Detect key-value pairs (Key: Value)
    const kvMatch = line.match(/^([A-Za-z][A-Za-z\s]+):\s+(.+)$/);
    if (kvMatch && kvMatch[1].length < 30) {
      if (inList) {
        html += listType === 'numbered' ? '</ol>' : '</ul>';
        inList = false;
      }
      html += `<div class="flex gap-2 my-1 text-sm">
        <span class="text-white/50 min-w-[100px]">${kvMatch[1]}:</span>
        <span class="text-white/80">${kvMatch[2]}</span>
      </div>`;
      continue;
    }
    
    // Regular paragraph
    if (inList) {
      html += listType === 'numbered' ? '</ol>' : '</ul>';
      inList = false;
    }
    html += `<p class="text-white/70 text-sm my-1.5 leading-relaxed">${line}</p>`;
  }
  
  // Close any open list
  if (inList) {
    html += listType === 'numbered' ? '</ol>' : '</ul>';
  }
  
  return html;
}

// Wrap any document content with smart action buttons
function wrapWithDocumentActions(content: string, options: {
  title?: string;
  type?: string;
  showSubmit?: boolean;
  showExport?: boolean;
  showCopy?: boolean;
}): string {
  const { title = 'Document', type = 'document', showSubmit = true, showExport = true, showCopy = true } = options;
  
  let actions = '<div class="flex gap-2 pt-3 mt-3 border-t border-white/10">';
  
  if (showCopy) {
    actions += `
      <button 
        data-action="copy-content"
        class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-xs font-medium transition-all"
        title="Copy to clipboard"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        <span class="copy-text">Copy</span>
      </button>
    `;
  }
  
  if (showExport) {
    actions += `
      <button 
        data-action="export-pdf" 
        data-export-type="${type}"
        data-export-title="${escapeHtml(title)}"
        class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-sm font-medium transition-all"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        Export PDF
      </button>
    `;
  }
  
  if (showSubmit) {
    actions += `
      <button 
        data-action="submit-form"
        data-form-type="${type}"
        class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-all"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        <span class="submit-text">Submit</span>
      </button>
    `;
  }
  
  actions += '</div>';
  
  return `<div class="smart-document" data-doc-type="${type}">${content}${actions}</div>`;
}

// Detect if content is a document that needs actions
function isDocumentType(type: string): boolean {
  const documentTypes = [
    'work_order', 'loto_procedure', 'checklist', 'dynamic_form',
    'equipment_card', 'invoice', 'quote', 'report', 'procedure',
    'inspection', 'maintenance', 'safety', 'form'
  ];
  return documentTypes.some(t => type.toLowerCase().includes(t));
}

// Detect if content looks like a document based on its structure
function looksLikeDocument(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  
  // Has document-like fields
  const docFields = ['steps', 'items', 'procedure', 'sections', 'fields', 'requirements', 
                     'instructions', 'checklist', 'parts', 'tools', 'safety'];
  const hasDocFields = docFields.some(f => f in obj);
  
  // Has identifier fields
  const idFields = ['equipment_tag', 'equipmentTag', 'work_order_number', 'workOrderNumber', 
                    'document_number', 'id', 'tag', 'reference'];
  const hasIdFields = idFields.some(f => f in obj);
  
  return hasDocFields || hasIdFields;
}

// Unescape HTML entities (in case the API returns escaped HTML)
function unescapeHtml(str: string): string {
  // First pass - basic HTML entities
  let result = str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#47;/g, '/')
    .replace(/&amp;/g, '&'); // Must be last!
  
  return result;
}

// Ensure content is properly renderable as HTML
// This handles cases where the content might have been double-escaped or stringified
function ensureHtmlRenderable(content: string): string {
  if (!content) return '';
  
  let result = content;
  
  // Check for and handle double-escaped content
  let iterations = 0;
  while ((result.includes('&lt;') || result.includes('&gt;')) && iterations < 3) {
    result = unescapeHtml(result);
    iterations++;
  }
  
  // If content still looks like it has escaped tags, try parsing as JSON
  // This handles cases where the API returns: "{\"html\": \"<div>...</div>\"}"
  if (result.startsWith('"') && result.endsWith('"')) {
    try {
      result = JSON.parse(result);
    } catch {
      // Not valid JSON, continue with original
    }
  }
  
  return result;
}

function formatMarkdown(content: string): string {
  // First, handle special section headers with emojis (like 🚨 CRITICAL, 📚 KNOWLEDGE, etc.)
  let html = content
    // Alert/Critical sections - red styling
    .replace(/^(🚨\s*.+?)$/gm, '<div class="mt-4 mb-3 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30"><h3 class="text-rose-400 font-semibold text-sm flex items-center gap-2">$1</h3></div>')
    // Knowledge/Documentation sections - blue styling
    .replace(/^(📚\s*(?:KNOWLEDGE BASE|DOCUMENTATION).+?)$/gim, '<div class="mt-3 mb-2"><h4 class="text-blue-400 font-medium text-xs uppercase tracking-wide flex items-center gap-2">$1</h4></div>')
    // Analysis/Diagnostic sections - amber styling
    .replace(/^(🔍\s*(?:ROOT CAUSE|ANALYSIS|DIAGNOSTIC).+?)$/gim, '<div class="mt-4 mb-2 pt-3 border-t border-white/10"><h4 class="text-amber-400 font-semibold text-sm flex items-center gap-2">$1</h4></div>')
    // Recommendation/Action sections - emerald styling  
    .replace(/^(💡\s*(?:RECOMMENDATION|ACTION|SOLUTION).+?)$/gim, '<div class="mt-4 mb-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25"><h4 class="text-emerald-400 font-semibold text-sm flex items-center gap-2">$1</h4></div>')
    // Image analysis section - purple styling
    .replace(/^((?:IMAGE ANALYSIS|🖼️|📷).+?)$/gim, '<div class="mt-3 mb-2 pt-3 border-t border-white/10"><h4 class="text-purple-400 font-medium text-xs uppercase tracking-wide">$1</h4></div>')
    // Warning sections
    .replace(/^(⚠️\s*.+?)$/gm, '<div class="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25"><p class="text-amber-300 text-sm">$1</p></div>')
    // Reference sections - muted styling
    .replace(/^(Reference:.+?)$/gim, '<p class="mt-3 text-xs text-white/40 italic border-l-2 border-white/20 pl-3">$1</p>');

  // Handle bullet points with percentages (like "Mechanical seal failure (60%)")
  html = html.replace(/^[•\-]\s*(.+?)\s*\((\d+)%\)\s*[-–—]\s*(.+)$/gm, 
    '<div class="flex gap-3 my-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/8 hover:border-white/15 transition-colors">' +
    '<div class="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">' +
    '<span class="text-xs font-bold text-white/80">$2%</span></div>' +
    '<div class="flex-1 min-w-0"><p class="text-white/90 text-sm font-medium">$1</p>' +
    '<p class="text-white/50 text-xs mt-0.5 leading-relaxed">$3</p></div></div>');

  // Handle simple bullet points with dash
  html = html.replace(/^[•\-]\s+(.+)$/gm, 
    '<div class="flex gap-2.5 my-1.5 ml-1"><span class="text-white/30 mt-1.5">▸</span><span class="text-white/70 text-sm leading-relaxed">$1</span></div>');

  // Standard markdown formatting
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-white/80">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-emerald-300/90 text-xs font-mono">$1</code>')
    // Regular headers (without emoji)
    .replace(/^### (.+)$/gm, '<h3 class="text-white/90 font-medium mt-4 mb-2 text-sm">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-white font-semibold mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-white font-bold mt-5 mb-3 text-base">$1</h1>')
    // Numbered lists
    .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="flex gap-2.5 my-1.5"><span class="text-white/40 font-medium text-sm w-5 text-right">$1.</span><span class="text-white/70 text-sm">$2</span></div>');

  // Handle paragraphs - convert double newlines to paragraph breaks
  html = html
    .replace(/\n\n+/g, '</p><p class="my-3 text-sm leading-relaxed">')
    .replace(/\n/g, '<br/>');

  // Wrap in paragraph if not already wrapped in a block element
  if (!html.startsWith('<div') && !html.startsWith('<h') && !html.startsWith('<p')) {
    html = '<p class="text-sm leading-relaxed">' + html + '</p>';
  }

  // Clean up empty tags
  html = html
    .replace(/<p[^>]*><\/p>/g, '')
    .replace(/<p[^>]*><br\/?><\/p>/g, '')
    .replace(/<p[^>]*>\s*<\/p>/g, '');

  return html;
}

// Helper to safely convert value to array
function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value as unknown as T];
  return [value];
}

// Format Work Order response type
function formatWorkOrder(data: WorkOrderData): string {
  // Normalize fields - support both camelCase and snake_case from API
  const workOrderNumber = data.work_order_number || data.workOrderNumber || 'WO-DRAFT';
  const equipmentTag = data.equipment_tag || data.equipmentTag || '';
  const equipmentName = data.equipment_name || data.equipmentName || 'Equipment';
  const workType = data.work_type || data.workType || 'Maintenance';
  const estimatedDuration = data.estimated_duration || (data.estimatedHours ? `${data.estimatedHours} hours` : 'TBD');
  
  // Normalize array fields that might come as strings
  const symptoms = toArray(data.symptoms);
  const safetyRequirements = toArray(data.safety_requirements || data.safetyNotes);
  const requiredTools = toArray(data.required_tools || data.requiredTools);
  const requiredParts = toArray(data.required_parts || data.requiredParts);
  const procedureSteps = toArray(data.procedure_steps || data.procedureSteps);
  const qualityCheckpoints = toArray(data.quality_checkpoints);
  const references = toArray(data.references);
  
  // Normalize priority - handle both formats
  const rawPriority = data.priority || 'Medium';
  const priorityMap: Record<string, string> = {
    'emergency': 'Critical',
    'urgent': 'High',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low',
    'Critical': 'Critical',
    'High': 'High',
    'Medium': 'Medium',
    'Low': 'Low',
  };
  const priority = priorityMap[rawPriority] || 'Medium';
  
  const priorityColors: Record<string, string> = {
    'Critical': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    'High': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Medium': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Low': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  
  const priorityClass = priorityColors[priority] || priorityColors['Medium'];
  
  let html = `
    <div class="work-order-card space-y-4">
      <!-- Header -->
      <div class="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-mono text-white/40">${workOrderNumber}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-medium border ${priorityClass}">${priority}</span>
            ${data.atex_compliance ? '<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">⚡ ATEX</span>' : ''}
          </div>
          <h3 class="text-white font-semibold">${equipmentName}</h3>
          <p class="text-white/50 text-xs">${equipmentTag} • ${workType}</p>
        </div>
      </div>

      <!-- Description -->
      ${data.description ? `
        <div>
          <h4 class="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">Description</h4>
          <div class="text-white/70 text-sm">${parseSmartContent(data.description)}</div>
        </div>
      ` : ''}

      <!-- Symptoms -->
      ${symptoms.length > 0 ? `
        <div>
          <h4 class="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">Symptoms Reported</h4>
          <div class="space-y-1">
            ${symptoms.map(s => `<div class="flex items-start gap-2 text-sm text-white/60"><span class="text-amber-400/60">▸</span>${typeof s === 'string' ? s : JSON.stringify(s)}</div>`).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Safety Requirements -->
      ${safetyRequirements.length > 0 ? `
        <div class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <h4 class="text-[10px] uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Safety Requirements
          </h4>
          <div class="space-y-1.5">
            ${safetyRequirements.map(s => `<div class="flex items-start gap-2 text-xs text-rose-300/80"><span class="text-rose-400">✓</span>${typeof s === 'string' ? s : JSON.stringify(s)}</div>`).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Procedure Steps -->
      ${procedureSteps.length > 0 ? `
        <div>
          <h4 class="text-[10px] uppercase tracking-wider text-white/40 mb-2">Procedure Steps</h4>
          <div class="space-y-2">
            ${procedureSteps.map((step, idx) => {
              const stepObj = typeof step === 'string' ? { step: idx + 1, description: step } : step;
              return `
              <div class="flex gap-3 p-2 rounded ${stepObj.critical ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/[0.03] border border-white/5'}">
                <span class="flex-shrink-0 w-6 h-6 rounded-full ${stepObj.critical ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/60'} flex items-center justify-center text-xs font-medium">${stepObj.step || idx + 1}</span>
                <div class="flex-1">
                  <p class="text-white/80 text-sm">${stepObj.description || step}</p>
                  ${stepObj.notes ? `<p class="text-white/40 text-xs mt-1">${stepObj.notes}</p>` : ''}
                </div>
                ${stepObj.critical ? '<span class="text-[9px] text-amber-400 uppercase tracking-wider">Critical</span>' : ''}
              </div>
            `}).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Quality Checkpoints -->
      ${qualityCheckpoints.length > 0 ? `
        <div>
          <h4 class="text-[10px] uppercase tracking-wider text-white/40 mb-2">Quality Checkpoints</h4>
          <div class="space-y-1.5">
            ${qualityCheckpoints.map(qc => {
              const qcObj = typeof qc === 'string' ? { checkpoint: qc, criteria: '' } : qc;
              return `
              <div class="flex items-start gap-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                <svg class="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <p class="text-emerald-300/90 text-xs font-medium">${qcObj.checkpoint}</p>
                  ${qcObj.criteria ? `<p class="text-emerald-300/60 text-[10px]">${qcObj.criteria}</p>` : ''}
                </div>
              </div>
            `}).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Required Parts -->
      ${requiredParts.length > 0 ? `
        <div>
          <h4 class="text-[10px] uppercase tracking-wider text-white/40 mb-2">Required Parts</h4>
          <div class="rounded border border-white/10 overflow-hidden">
            <table class="w-full text-xs">
              <thead class="bg-white/5">
                <tr>
                  <th class="px-2 py-1.5 text-left text-white/50 font-medium">Part Number</th>
                  <th class="px-2 py-1.5 text-left text-white/50 font-medium">Description</th>
                  <th class="px-2 py-1.5 text-right text-white/50 font-medium">Qty</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                ${requiredParts.map(part => {
                  const partObj = typeof part === 'string' ? { part_number: '', description: part, quantity: 1 } : part;
                  return `
                  <tr>
                    <td class="px-2 py-1.5 text-white/60 font-mono text-[10px]">${partObj.part_number || '-'}</td>
                    <td class="px-2 py-1.5 text-white/70">${partObj.description || part}</td>
                    <td class="px-2 py-1.5 text-right text-white/60">${partObj.quantity || 1}</td>
                  </tr>
                `}).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- Required Tools -->
      ${requiredTools.length > 0 ? `
        <div>
          <h4 class="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">Required Tools</h4>
          <div class="flex flex-wrap gap-1.5">
            ${requiredTools.map(tool => `<span class="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/60">${typeof tool === 'string' ? tool : JSON.stringify(tool)}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      <!-- References -->
      ${references.length > 0 ? `
        <div>
          <h4 class="text-[10px] uppercase tracking-wider text-white/40 mb-2">References</h4>
          <div class="flex flex-wrap gap-1.5">
            ${references.map(ref => {
              const refObj = typeof ref === 'string' ? { title: ref } : ref;
              return `<span class="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/60">${refObj.title}${refObj.page ? ` p.${refObj.page}` : ''}</span>`;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div class="flex items-center justify-between pt-3 border-t border-white/10 text-[10px] text-white/40">
        <span>Est. Duration: ${estimatedDuration}</span>
        ${data.lockout_tagout_required ? '<span class="text-amber-400">🔒 LOTO Required</span>' : ''}
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 pt-3 border-t border-white/10">
        <button 
          data-action="export-pdf" 
          data-export-type="work_order"
          data-export-title="Work Order - ${equipmentTag}"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-sm font-medium transition-all"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export PDF
        </button>
        <button 
          data-action="submit-form"
          data-form-type="work_order"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-all"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          <span class="submit-text">Submit</span>
        </button>
      </div>
    </div>
  `;
  
  return html;
}

// Format LOTO Procedure response type
function formatLotoProcedure(data: LotoProcedureData): string {
  // Normalize fields - support both camelCase and snake_case
  const equipmentTag = data.equipment_tag || data.equipmentTag || '';
  const equipmentName = data.equipment_name || data.equipmentName || 'Equipment';
  const location = data.location || '';
  const estimatedDuration = data.estimatedDuration || '';
  
  // Normalize arrays
  const ppeRequired = toArray(data.ppe_required || data.requiredPpe);
  const hazards = toArray(data.hazards) || (data.hazard_summary ? [data.hazard_summary] : []);
  const specialPrecautions = toArray(data.special_precautions);
  const warnings = toArray(data.warnings);
  const verificationSteps = toArray(data.verificationSteps);
  const reinstateSteps = toArray(data.reinstateSteps);
  
  // Normalize isolation points - handle both formats
  let isolationPoints: Array<{ sequence: number; tag: string; type: string; location: string; action: string; verification: string }> = [];
  if (data.isolation_points && data.isolation_points.length > 0) {
    isolationPoints = data.isolation_points;
  } else if (data.isolationSteps && data.isolationSteps.length > 0) {
    isolationPoints = data.isolationSteps.map(step => ({
      sequence: step.step,
      tag: step.point,
      type: step.pointType,
      location: '',
      action: step.action,
      verification: step.verification,
    }));
  }
  
  let html = `
    <div class="loto-procedure space-y-4">
      <!-- Header -->
      <div class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">🔒</span>
          <div>
            <h3 class="text-rose-300 font-semibold">Lock Out / Tag Out Procedure</h3>
            <p class="text-rose-300/60 text-xs">${equipmentTag} - ${equipmentName}${location ? ` • ${location}` : ''}</p>
          </div>
        </div>
        ${hazards.length > 0 ? `
          <div class="mt-2">
            <p class="text-rose-300/80 text-sm"><strong>Hazards:</strong></p>
            <ul class="mt-1 space-y-1">
              ${hazards.map(h => `<li class="text-rose-300/70 text-xs flex items-start gap-2"><span class="text-rose-400">⚠</span>${h}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        ${estimatedDuration ? `<p class="text-rose-300/60 text-xs mt-2">Estimated Duration: ${estimatedDuration}</p>` : ''}
      </div>

      <!-- PPE Required -->
      ${ppeRequired.length > 0 ? `
        <div>
          <h4 class="text-[10px] uppercase tracking-wider text-white/40 mb-2">Required PPE</h4>
          <div class="flex flex-wrap gap-2">
            ${ppeRequired.map(ppe => `<span class="px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">${ppe}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Isolation Points -->
      ${isolationPoints.length > 0 ? `
        <div>
          <h4 class="text-[10px] uppercase tracking-wider text-white/40 mb-2">Isolation Sequence</h4>
          <div class="space-y-2">
            ${isolationPoints.map(point => `
              <div class="p-3 rounded-lg bg-white/[0.03] border border-white/10">
                <div class="flex items-center gap-3 mb-2">
                  <span class="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-bold">${point.sequence}</span>
                  <div>
                    <p class="text-white/90 font-medium text-sm">${point.tag}</p>
                    <p class="text-white/50 text-xs">${point.type}${point.location ? ` • ${point.location}` : ''}</p>
                  </div>
                </div>
                <div class="ml-10 space-y-1.5">
                  <div class="flex items-start gap-2">
                    <span class="text-amber-400 text-xs">ACTION:</span>
                    <span class="text-white/70 text-xs">${point.action}</span>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="text-emerald-400 text-xs">VERIFY:</span>
                    <span class="text-white/70 text-xs">${point.verification}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Verification Steps -->
      ${verificationSteps.length > 0 ? `
        <div>
          <h4 class="text-[10px] uppercase tracking-wider text-white/40 mb-2">Verification Steps</h4>
          <div class="space-y-1.5">
            ${verificationSteps.map((step, i) => `
              <div class="flex items-start gap-2 text-xs">
                <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">${i + 1}</span>
                <span class="text-white/70">${step}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Reinstatement Steps -->
      ${reinstateSteps.length > 0 ? `
        <div>
          <h4 class="text-[10px] uppercase tracking-wider text-white/40 mb-2">Reinstatement Steps</h4>
          <div class="space-y-1.5">
            ${reinstateSteps.map((step, i) => `
              <div class="flex items-start gap-2 text-xs">
                <span class="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">${i + 1}</span>
                <span class="text-white/70">${step}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Special Precautions / Warnings -->
      ${specialPrecautions.length > 0 || warnings.length > 0 ? `
        <div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <h4 class="text-[10px] uppercase tracking-wider text-amber-400 mb-2">⚠️ Special Precautions</h4>
          <div class="space-y-1">
            ${[...specialPrecautions, ...warnings].map(p => `<p class="text-amber-300/80 text-xs">• ${p}</p>`).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Action Buttons -->
      <div class="flex gap-2 pt-3 border-t border-white/10">
        <button 
          data-action="export-pdf" 
          data-export-type="loto_procedure"
          data-export-title="LOTO - ${equipmentTag}"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-sm font-medium transition-all"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export PDF
        </button>
        <button 
          data-action="submit-form"
          data-form-type="loto_procedure"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-all"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          <span class="submit-text">Submit</span>
        </button>
      </div>
    </div>
  `;
  
  return html;
}

// Format Equipment Card response type
function formatEquipmentCard(data: EquipmentCardData): string {
  let html = `
    <div class="equipment-card space-y-3">
      <div class="flex items-start gap-3 pb-3 border-b border-white/10">
        <div class="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
          <svg class="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <div>
          <p class="text-[10px] text-white/40 font-mono">${data.tag || ''}</p>
          <h3 class="text-white font-semibold">${data.name || 'Equipment'}</h3>
          <p class="text-white/50 text-xs">${data.type || ''}</p>
        </div>
      </div>

      ${data.manufacturer || data.model ? `
        <div class="grid grid-cols-2 gap-2">
          ${data.manufacturer ? `<div><p class="text-[10px] text-white/40">Manufacturer</p><p class="text-white/70 text-xs">${data.manufacturer}</p></div>` : ''}
          ${data.model ? `<div><p class="text-[10px] text-white/40">Model</p><p class="text-white/70 text-xs">${data.model}</p></div>` : ''}
        </div>
      ` : ''}

      ${data.specifications ? `
        <div>
          <h4 class="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">Specifications</h4>
          <div class="grid grid-cols-2 gap-2">
            ${Object.entries(data.specifications).map(([key, value]) => `
              <div class="p-2 rounded bg-white/[0.03] border border-white/5">
                <p class="text-[10px] text-white/40">${key}</p>
                <p class="text-white/80 text-xs font-medium">${value}</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${data.connections && data.connections.length > 0 ? `
        <div>
          <h4 class="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">Connections</h4>
          <div class="space-y-1">
            ${data.connections.map(conn => `
              <div class="flex items-center gap-2 text-xs">
                <span class="text-white/40">${conn.direction === 'inlet' ? '→' : '←'}</span>
                <span class="text-white/60">${conn.tag}</span>
                <span class="text-white/30">•</span>
                <span class="text-white/50">${conn.type}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Action Button -->
      <div class="pt-3 border-t border-white/10">
        <button 
          data-action="export-pdf" 
          data-export-type="equipment_card"
          data-export-title="Equipment - ${data.tag || data.name || 'Unknown'}"
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-sm font-medium transition-all"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export PDF
        </button>
      </div>
    </div>
  `;
  
  return html;
}

// Format Dynamic Form response type
interface DynamicFormData {
  formType?: string;
  title: string;
  description?: string;
  metadata?: Record<string, string>;
  sections?: Array<{
    id: string;
    title: string;
    description?: string;
    fields: Array<{
      id: string;
      label: string;
      type: string;
      value?: unknown;
      placeholder?: string;
    }>;
  }>;
  lineItems?: {
    columns: Array<{ key: string; label: string }>;
    rows: Array<{ id: string; cells: Record<string, unknown> }>;
  };
  totals?: Array<{ label: string; value: number; type?: string }>;
}

function formatDynamicForm(data: DynamicFormData): string {
  let html = `
    <div class="dynamic-form space-y-4">
      <div class="pb-3 border-b border-white/10">
        <h3 class="text-white font-semibold">${data.title}</h3>
        ${data.description ? `<p class="text-white/50 text-sm mt-1">${data.description}</p>` : ''}
      </div>
  `;

  if (data.sections) {
    data.sections.forEach(section => {
      html += `
        <div class="space-y-2">
          <h4 class="text-white/70 font-medium text-sm">${section.title}</h4>
          <div class="grid grid-cols-2 gap-2">
            ${section.fields.map(field => `
              <div class="p-2 rounded bg-white/[0.03] border border-white/5">
                <p class="text-[10px] text-white/40">${field.label}</p>
                <p class="text-white/80 text-sm">${field.value || field.placeholder || '-'}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
  }

  if (data.lineItems && data.lineItems.rows.length > 0) {
    html += `
      <div class="rounded border border-white/10 overflow-hidden">
        <table class="w-full text-xs">
          <thead class="bg-white/5">
            <tr>
              ${data.lineItems.columns.map(col => `<th class="px-2 py-1.5 text-left text-white/50 font-medium">${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            ${data.lineItems.rows.map(row => `
              <tr>
                ${data.lineItems!.columns.map(col => `<td class="px-2 py-1.5 text-white/70">${row.cells[col.key] || ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (data.totals && data.totals.length > 0) {
    html += `
      <div class="border-t border-white/10 pt-2 space-y-1">
        ${data.totals.map(total => `
          <div class="flex justify-between text-sm ${total.type === 'total' ? 'font-semibold text-white' : 'text-white/60'}">
            <span>${total.label}</span>
            <span>$${total.value.toLocaleString()}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Action Buttons
  html += `
    <div class="flex gap-2 pt-3 mt-3 border-t border-white/10">
      <button 
        data-action="export-pdf" 
        data-export-type="dynamic_form"
        data-export-title="${data.title || 'Document'}"
        class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-sm font-medium transition-all"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        Export PDF
      </button>
      <button 
        data-action="submit-form"
        data-form-type="dynamic_form"
        class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-all"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        <span class="submit-text">Submit</span>
      </button>
    </div>
  `;

  html += '</div>';
  return html;
}

// Format Image Card response type
interface ImageCardData {
  title: string;
  description?: string;
  image_url: string;
  source_document?: string;
  source_page?: number;
}

function formatImageCard(data: ImageCardData): string {
  return `
    <div class="image-card space-y-2">
      <h3 class="text-white font-semibold">${data.title}</h3>
      ${data.description ? `<p class="text-white/50 text-sm">${data.description}</p>` : ''}
      <img src="${data.image_url}" alt="${data.title}" class="w-full rounded-lg border border-white/10" />
      ${data.source_document ? `
        <p class="text-[10px] text-white/40">
          Source: ${data.source_document}${data.source_page ? ` (p.${data.source_page})` : ''}
        </p>
      ` : ''}
    </div>
  `;
}

// Format Research Result response type
interface ResearchResultData {
  question: string;
  answer: string;
  summary?: string;
  citations?: Array<{ source: string; page?: number; excerpt?: string }>;
  related_topics?: string[];
  confidence?: number;
}

function formatResearchResult(data: ResearchResultData): string {
  let html = `
    <div class="research-result space-y-3">
      <div class="pb-2 border-b border-white/10">
        <p class="text-white/50 text-xs">Question</p>
        <h3 class="text-white font-medium">${data.question}</h3>
      </div>
      <div>
        <p class="text-white/80 text-sm">${formatMarkdown(data.answer)}</p>
      </div>
  `;

  if (data.citations && data.citations.length > 0) {
    html += `
      <div class="pt-2 border-t border-white/10">
        <p class="text-[10px] text-white/40 mb-1">Citations</p>
        <div class="space-y-1">
          ${data.citations.map(c => `
            <div class="text-xs text-white/60">
              📄 ${c.source}${c.page ? ` (p.${c.page})` : ''}
              ${c.excerpt ? `<p class="text-white/40 text-[10px] mt-0.5">"${c.excerpt}"</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (data.confidence !== undefined) {
    html += `<p class="text-[10px] text-white/30">Confidence: ${Math.round(data.confidence * 100)}%</p>`;
  }

  html += '</div>';
  return html;
}

// Format Data Table response type
interface DataTableData {
  title: string;
  description?: string;
  columns: Array<{ key: string; label: string; type?: string }>;
  rows: Array<{ id: string; cells: Record<string, unknown> }>;
  summary?: { label: string; values: Record<string, unknown> };
}

function formatDataTable(data: DataTableData): string {
  let html = `
    <div class="data-table space-y-2">
      <h3 class="text-white font-semibold">${data.title}</h3>
      ${data.description ? `<p class="text-white/50 text-sm">${data.description}</p>` : ''}
      <div class="rounded border border-white/10 overflow-hidden overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-white/5">
            <tr>
              ${data.columns.map(col => `<th class="px-2 py-1.5 text-left text-white/50 font-medium whitespace-nowrap">${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            ${data.rows.map(row => `
              <tr>
                ${data.columns.map(col => `<td class="px-2 py-1.5 text-white/70 whitespace-nowrap">${row.cells[col.key] ?? ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
  `;

  if (data.summary) {
    html += `
      <div class="text-xs text-white/50">
        ${data.summary.label}: ${Object.entries(data.summary.values).map(([k, v]) => `${k}: ${v}`).join(', ')}
      </div>
    `;
  }

  html += '</div>';
  return html;
}

// Format RCA (Root Cause Analysis) response type
interface RCAData {
  title?: string;
  equipment?: string;
  issue?: string;
  rootCause?: string;
  analysis?: string;
  message?: string;
  content?: string;
  factors?: string[];
  causes?: string[];
  recommendations?: string[];
  steps?: string[];
  severity?: string;
  confidence?: number;
}

function formatRCA(data: RCAData): string {
  const title = data.title || 'Root Cause Analysis';
  const content = data.analysis || data.message || data.content || data.rootCause || '';
  
  let html = `
    <div class="rca-analysis p-4 rounded-xl bg-amber-500/10 border-l-4 border-amber-500 space-y-3">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 class="text-amber-400 font-semibold">${escapeHtml(title)}</h3>
        ${data.severity ? `<span class="ml-auto text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase">${data.severity}</span>` : ''}
      </div>
  `;

  if (data.equipment) {
    html += `<p class="text-xs text-white/50">Equipment: <span class="text-white/70">${escapeHtml(data.equipment)}</span></p>`;
  }

  if (data.issue) {
    html += `<p class="text-xs text-white/50">Issue: <span class="text-white/70">${escapeHtml(data.issue)}</span></p>`;
  }

  if (content) {
    html += `<div class="text-sm text-white/80 leading-relaxed">${formatMarkdown(content)}</div>`;
  }

  const factors = data.factors || data.causes || [];
  if (factors.length > 0) {
    html += `
      <div class="mt-2">
        <h4 class="text-xs uppercase tracking-wider text-amber-400/70 mb-1.5">Contributing Factors</h4>
        <ul class="space-y-1">
          ${factors.map(f => `<li class="text-sm text-white/70 flex items-start gap-2">
            <span class="text-amber-400 mt-1">•</span>
            <span>${escapeHtml(String(f))}</span>
          </li>`).join('')}
        </ul>
      </div>
    `;
  }

  const recommendations = data.recommendations || data.steps || [];
  if (recommendations.length > 0) {
    html += `
      <div class="mt-2 pt-2 border-t border-amber-500/20">
        <h4 class="text-xs uppercase tracking-wider text-emerald-400/70 mb-1.5">Recommendations</h4>
        <ol class="space-y-1">
          ${recommendations.map((r, i) => `<li class="text-sm text-white/70 flex items-start gap-2">
            <span class="text-emerald-400 font-medium">${i + 1}.</span>
            <span>${escapeHtml(String(r))}</span>
          </li>`).join('')}
        </ol>
      </div>
    `;
  }

  if (data.confidence) {
    html += `<p class="text-xs text-white/40 mt-2">Confidence: ${data.confidence}%</p>`;
  }

  html += '</div>';
  return html;
}

export default TroubleshootPanel;

