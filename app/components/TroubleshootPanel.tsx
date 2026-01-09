'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { Vessel, Weather } from '@/lib/supabase';
import type { QueryResponse, Source, KnowledgeBase } from '@/lib/sdk/resolve-sdk';

// Flexible alert type that works with both Supabase Alert and NMDCAlert
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

// Context that can be injected into troubleshooting queries
interface AppContext {
  vessel?: {
    name: string;
    type: string;
    status?: string;
    fuelLevel?: number;
    engineStatus?: string;
    location?: { lat: number; lng: number };
    speed?: number;
    heading?: number;
  } | null;
  activeAlerts?: Array<{
    severity: string;
    message: string;
    component?: string;
  }>;
  weather?: {
    condition?: string;
    windSpeed?: number;
    waveHeight?: number;
    temperature?: number;
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
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source;
  imagePreview?: string;
  latency?: number;
  responseType?: string;
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

// Quick troubleshooting prompts based on vessel type
const TROUBLESHOOT_PROMPTS = [
  { icon: Thermometer, text: "High temperature", prompt: "Equipment is showing high temperature readings. What could be the cause and how do I fix it?" },
  { icon: Zap, text: "Power issues", prompt: "Electrical power fluctuations or failures. How do I diagnose and resolve?" },
  { icon: Settings, text: "Mechanical vibration", prompt: "Excessive vibration detected in rotating equipment. What are the possible causes?" },
  { icon: AlertTriangle, text: "Pressure drop", prompt: "Unexpected pressure drop in the hydraulic system. What should I check?" },
  { icon: Cpu, text: "Sensor fault", prompt: "Sensor readings are erratic or not updating. How do I troubleshoot?" },
  { icon: FileText, text: "Maintenance procedure", prompt: "What is the standard maintenance procedure for this equipment?" },
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

  // Knowledge base state
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string | null>(null);
  const [isLoadingKBs, setIsLoadingKBs] = useState(false);
  const [showKBDropdown, setShowKBDropdown] = useState(false);

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

  // Handle initial symptom if provided
  useEffect(() => {
    if (initialSymptom && !hasInteracted) {
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

  // Build structured context for the AI
  const buildAppContext = useCallback((): AppContext => {
    const context: AppContext = {};

    // Vessel context
    if (selectedVessel) {
      // Use type assertion for properties that may exist in runtime but not in strict type
      const v = selectedVessel as Record<string, unknown>;
      
      // Support both position_lat/lng (from NMDC) and current_lat/lng (legacy)
      const lat = typeof v.position_lat === 'number' ? v.position_lat : 
                  typeof v.current_lat === 'number' ? v.current_lat : undefined;
      const lng = typeof v.position_lng === 'number' ? v.position_lng : 
                  typeof v.current_lng === 'number' ? v.current_lng : undefined;
      
      context.vessel = {
        name: selectedVessel.name,
        type: selectedVessel.type,
        status: typeof v.status === 'string' ? v.status : undefined,
        fuelLevel: typeof v.fuel_level === 'number' ? v.fuel_level : undefined,
        engineStatus: typeof v.engine_status === 'string' ? v.engine_status : undefined,
        location: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
        speed: typeof v.speed === 'number' ? v.speed : undefined,
        heading: typeof v.heading === 'number' ? v.heading : undefined,
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

    // Weather context
    if (weather) {
      context.weather = {
        condition: weather.condition || undefined,
        windSpeed: typeof weather.wind_speed === 'number' ? weather.wind_speed : undefined,
        waveHeight: typeof weather.wave_height === 'number' ? weather.wave_height : undefined,
        temperature: typeof weather.temperature === 'number' ? weather.temperature : undefined,
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

  const sendMessage = async (content: string) => {
    if ((!content.trim() && !selectedImageFile) || isLoading) return;

    setHasInteracted(true);
    
    // Build rich context-aware query
    const appContext = buildAppContext();
    const hasContext = Object.keys(appContext).length > 0;
    
    // Debug: Log context being sent
    console.log('[TroubleshootPanel] Context being sent:', {
      hasVessel: !!appContext.vessel,
      vesselName: appContext.vessel?.name,
      hasAlerts: !!appContext.activeAlerts?.length,
      hasWeather: !!appContext.weather,
      hasFleetStatus: !!appContext.fleetStatus,
      equipment: appContext.equipment,
    });
    
    let contextualContent = content.trim();
    
    // Build system instructions for action-oriented troubleshooting
    const systemInstructions = `<system_instructions>
You are a marine equipment troubleshooting assistant. Your goal is to QUICKLY DIAGNOSE the issue and provide ACTIONABLE RESOLUTION.

## CRITICAL: USE THE APP_CONTEXT
The <app_context> block contains REAL-TIME DATA about the vessel you are troubleshooting:
- **vessel.name**: The specific vessel (e.g., "NMDC Atlas") - ALWAYS reference by name
- **vessel.type**: Vessel type (dredger, tugboat, etc.) - tailor advice accordingly
- **vessel.fuelLevel**: Current fuel percentage
- **vessel.speed/heading**: Current navigation status
- **vessel.location**: GPS coordinates
- **activeAlerts**: Current warnings/faults on this vessel
- **equipment**: The specific system selected (if any)
- **weather**: Current conditions affecting operations

**You MUST acknowledge the vessel context in your response.** For example:
- "For the NMDC Atlas (dredger currently at 85% fuel)..."
- "Given the active engine temperature warning on this vessel..."
- "Based on the current weather conditions (12 knot winds)..."

## TROUBLESHOOTING FLOW (Follow strictly):

### PHASE 1: QUICK TRIAGE (1-2 questions max)
- Review app_context for vessel/equipment info - MENTION THE VESSEL NAME
- Ask ONE selection question to narrow down the symptom category
- Example: "For the [vessel.name], select the primary symptom: [Noise/Vibration] [Overheating] [Pressure Loss] [No Output] [Intermittent Operation]"

### PHASE 2: PINPOINT FAULT (1 question max)  
- Based on selection, identify the MOST LIKELY fault
- If needed, ask ONE more specific question
- Then COMMIT to a diagnosis - don't keep asking

### PHASE 3: RESOLUTION (Always reach this)
After 2-3 exchanges, you MUST provide a resolution with:

1. **FAULT IDENTIFIED**: State the specific component/issue
   - Example: "Bearing failure in pump impeller shaft"

2. **SEVERITY & SAFETY**:
   - CRITICAL: Immediate shutdown required
   - HIGH: Complete within 24 hours  
   - MEDIUM: Schedule for next maintenance window
   - LOW: Monitor and address when convenient

3. **LOTO REQUIREMENTS** (if applicable):
   - Isolation points to lock out
   - Energy sources to verify zero-energy state
   - Required PPE

4. **WORK ORDER DETAILS**:
   - Task description
   - Estimated time
   - Parts/materials needed
   - Skills required (mechanical, electrical, hydraulic)

5. **STEP-BY-STEP REPAIR PROCEDURE**:
   - Numbered checklist of actions
   - Verification steps after repair

## RULES:
- NEVER ask more than 3 total questions before providing resolution
- If user provides symptom + equipment, go directly to diagnosis
- Don't ask for information already in app_context
- Be decisive - pick the most probable cause, don't hedge
- Always end with actionable next steps, never leave user hanging

## RESPONSE FORMAT:
Use 'checklist' type for repair procedures
Use 'selection' type ONLY for initial triage (max 2 times)
Use 'info_message' for diagnosis and work order details
</system_instructions>

`;
    
    // Check if image is being sent
    const hasImage = !!selectedImageFile;
    
    if (hasContext || hasImage) {
      // Format context as a structured block the AI can understand
      let contextBlock = systemInstructions;
      
      if (hasContext) {
        contextBlock += `<app_context>
${JSON.stringify(appContext, null, 2)}
</app_context>

`;
      }
      
      if (hasImage) {
        contextBlock += `<image_attached>
An image has been uploaded with this query. You MUST:
1. DESCRIBE what you see in the image (equipment type, visible components, condition)
2. IDENTIFY any visible issues (wear, damage, misalignment, corrosion, leaks)
3. CORRELATE the image with the user's reported symptom ("${content.trim()}")
4. If you cannot see the image or it's unclear, say so explicitly

DO NOT ignore the image. Your analysis must reference specific visual details.
</image_attached>

`;
      }
      
      contextBlock += `User Query: ${content.trim() || 'Please analyze this image'}`;
      contextualContent = contextBlock;
    } else {
      contextualContent = `${systemInstructions}User Query: ${content.trim()}`;
    }

    // Capture file before clearing
    const capturedImageFile = selectedImageFile;
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
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: content.trim() || 'Please analyze this image',
        imagePreview: imageUrl || undefined,  // Use uploaded URL, not blob
      };

      setMessages((prev) => [...prev, userMessage]);

      const response = await fetch('/api/troubleshoot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: imageUrl ? 'analyze_image' : 'query',
          message: contextualContent,
          imageUrl,  // Send URL instead of base64
          knowledgeBaseId: selectedKnowledgeBase,
          responseFormat: 'json',
        }),
      });

      if (!response.ok) {
        // Handle both JSON and text error responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get response');
        } else {
          const errorText = await response.text();
          // Check for common error patterns
          if (errorText.includes('Request Entity Too Large') || response.status === 413) {
            throw new Error('Image is too large. Please use an image smaller than 10MB.');
          }
          throw new Error(errorText || `Server error: ${response.status}`);
        }
      }

      const data: QueryResponse = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formatResponse(data),
        sources: data.sources,
        latency: data.latency_ms,
        responseType: data.response?.type,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Troubleshoot error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Please try again.'}`,
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
  };

  return (
    <div className="flex flex-col h-full bg-black">
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
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {!hasInteracted && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <Wrench className="h-6 w-6 text-white/60" />
            </div>
            <h3 className="text-lg font-medium text-white/90 mb-2">
              AI Troubleshooting
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
                  
                  <div
                    className={`inline-block px-3.5 py-2.5 rounded-xl text-sm ${
                      message.role === 'user'
                        ? 'bg-white/10 text-white/90 rounded-tr-sm'
                        : 'bg-white/[0.03] text-white/70 rounded-tl-sm border border-white/5'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div 
                        className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-p:leading-relaxed prose-ul:my-1.5 prose-li:my-0 prose-strong:text-white prose-headings:text-white prose-headings:font-medium"
                        dangerouslySetInnerHTML={{ __html: message.content }}
                        onClick={(e) => {
                          // Handle clicks on selection options via event delegation
                          const target = e.target as HTMLElement;
                          const optionEl = target.closest('[data-option-value]') as HTMLElement;
                          if (optionEl) {
                            const optionValue = optionEl.getAttribute('data-option-value');
                            if (optionValue) {
                              sendMessage(optionValue);
                            }
                          }
                        }}
                      />
                    ) : (
                      <p className="leading-relaxed">{message.content}</p>
                    )}
                  </div>

                  {/* Sources & Metadata */}
                  {message.sources && (
                    <SourcesDisplay sources={message.sources} latency={message.latency} />
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

// Format API response to HTML
function formatResponse(data: QueryResponse): string {
  if (!data.success) {
    return `<p class="text-rose-400">Error: ${data.error || 'Unknown error'}</p>`;
  }

  // Handle text format
  if (data.answer) {
    return formatMarkdown(data.answer);
  }

  // Handle JSON format
  if (data.response) {
    const { type, data: responseData } = data.response;
    
    switch (type) {
      case 'info_message':
        return formatInfoMessage(responseData as { title?: string; message: string });
      
      case 'checklist':
        return formatChecklist(responseData as { title?: string; items: Array<{ step: string; details?: string }> });
      
      case 'selection':
        return formatSelection(responseData as { title?: string; question?: string; options: Array<{ id?: string; title?: string; label?: string; subtitle?: string; description?: string }> });
      
      case 'multi_response': {
        // For multi_response, the responses array might be in responseData or directly in data.response
        const multiData = responseData as { responses?: Array<{ type: string; data: unknown }> } | undefined;
        // Check if responses is at the response level (data.response.responses)
        const responses = multiData?.responses || (data.response as unknown as { responses?: Array<{ type: string; data: unknown }> })?.responses;
        return formatMultiResponse({ responses });
      }
      
      default:
        // Fallback to stringified response
        if (typeof responseData === 'object' && responseData !== null) {
          const rd = responseData as Record<string, unknown>;
          if ('message' in rd) {
            return formatMarkdown(String(rd.message));
          }
          // Check for responses array (multi_response without explicit type)
          if ('responses' in rd && Array.isArray(rd.responses)) {
            return formatMultiResponse(rd as { responses: Array<{ type: string; data: unknown }> });
          }
        }
        return formatMarkdown(JSON.stringify(responseData, null, 2));
    }
  }

  return '<p class="text-white/50">No response available</p>';
}

// Format multi_response type (array of responses)
function formatMultiResponse(data: { responses?: Array<{ type: string; data: unknown }> } | null | undefined): string {
  if (!data || !data.responses || data.responses.length === 0) {
    return '<p class="text-white/50">No response available</p>';
  }

  let html = '<div class="space-y-4">';
  
  for (const response of data.responses) {
    switch (response.type) {
      case 'info_message':
        html += formatInfoMessage(response.data as { title?: string; message: string; details?: string[] });
        break;
      case 'checklist':
        html += formatChecklist(response.data as { title?: string; items: Array<{ step: string; details?: string }> });
        break;
      case 'selection':
        html += formatSelectionEnhanced(response.data as { question?: string; options: Array<{ id?: string; title?: string; subtitle?: string }> });
        break;
      default:
        if (typeof response.data === 'object' && response.data !== null) {
          const rd = response.data as Record<string, unknown>;
          if ('message' in rd) {
            html += formatMarkdown(String(rd.message));
          }
        }
    }
  }
  
  html += '</div>';
  return html;
}

// Enhanced selection format for multi_response
function formatSelectionEnhanced(data: { question?: string; options: Array<{ id?: string; title?: string; subtitle?: string }> }): string {
  let html = '<div class="mt-4 pt-4 border-t border-white/10">';
  if (data.question) {
    html += `<p class="text-white/60 text-sm mb-3">${data.question}</p>`;
  }
  html += '<div class="grid grid-cols-2 gap-2">';
  data.options.forEach((option) => {
    const optionTitle = option.title || option.id || 'Option';
    const optionValue = `${optionTitle}${option.subtitle ? ': ' + option.subtitle : ''}`;
    html += `
      <div 
        data-option-value="${escapeHtml(optionValue)}"
        class="p-2 rounded bg-white/[0.03] border border-white/8 hover:border-white/20 hover:bg-white/[0.05] cursor-pointer transition-colors active:scale-[0.98]"
      >
        <p class="text-white/80 text-xs font-medium">${optionTitle}</p>
        ${option.subtitle ? `<p class="text-white/40 text-[10px] mt-0.5">${option.subtitle}</p>` : ''}
      </div>
    `;
  });
  html += '</div></div>';
  return html;
}

function formatInfoMessage(data: { title?: string; message: string; details?: string[] }): string {
  let html = '';
  if (data.title) {
    html += `<h3 class="font-semibold text-white mb-2">${data.title}</h3>`;
  }
  html += formatMarkdown(data.message);
  
  // Handle details array if present
  if (data.details && data.details.length > 0) {
    html += '<div class="mt-3 pt-3 border-t border-white/10 space-y-1">';
    data.details.forEach((detail) => {
      html += `<p class="text-[10px] text-white/40">${detail}</p>`;
    });
    html += '</div>';
  }
  
  return html;
}

function formatChecklist(data: { title?: string; items: Array<{ step: string; details?: string }> }): string {
  let html = '';
  if (data.title) {
    html += `<h3 class="font-semibold text-white mb-3">${data.title}</h3>`;
  }
  html += '<div class="space-y-2">';
  data.items.forEach((item, i) => {
    html += `
      <div class="flex gap-2 p-2 rounded bg-white/[0.03] border border-white/8">
        <span class="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 text-white/60 flex items-center justify-center text-xs font-medium">${i + 1}</span>
        <div>
          <p class="text-white/80 text-sm">${item.step}</p>
          ${item.details ? `<p class="text-white/40 text-xs mt-1">${item.details}</p>` : ''}
        </div>
      </div>
    `;
  });
  html += '</div>';
  return html;
}

function formatSelection(data: { title?: string; question?: string; options: Array<{ id?: string; title?: string; label?: string; subtitle?: string; description?: string }> }): string {
  let html = '';
  if (data.title) {
    html += `<h3 class="font-semibold text-white mb-3">${data.title}</h3>`;
  }
  if (data.question) {
    html += `<p class="text-white/60 text-sm mb-3">${data.question}</p>`;
  }
  html += '<div class="space-y-2">';
  data.options.forEach((option) => {
    const displayTitle = option.title || option.label || option.id || 'Option';
    const displayDesc = option.subtitle || option.description;
    const optionValue = `${displayTitle}${displayDesc ? ': ' + displayDesc : ''}`;
    html += `
      <div 
        data-option-value="${escapeHtml(optionValue)}"
        class="p-2 rounded bg-white/[0.03] border border-white/8 hover:border-white/20 hover:bg-white/[0.05] cursor-pointer transition-colors active:scale-[0.98]"
      >
        <p class="text-white/80 text-sm font-medium">${displayTitle}</p>
        ${displayDesc ? `<p class="text-white/40 text-xs mt-1">${displayDesc}</p>` : ''}
      </div>
    `;
  });
  html += '</div>';
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

function formatMarkdown(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white/90">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-white/70 text-xs">$1</code>')
    .replace(/^### (.*$)/gm, '<h3 class="text-white/90 font-medium mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-white/90 font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-white font-bold mt-4 mb-2 text-base">$1</h1>')
    .replace(/^- (.*$)/gm, '<div class="flex gap-2 my-1"><span class="text-white/40">•</span><span>$1</span></div>')
    .replace(/^\d+\.\s+(.*$)/gm, '<div class="flex gap-2 my-1"><span class="text-white/40 font-medium">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '</p><p class="my-2">')
    .replace(/\n/g, '<br/>')
    .replace(/^([\s\S]*)$/, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p><br\/><\/p>/g, '');
}

export default TroubleshootPanel;

