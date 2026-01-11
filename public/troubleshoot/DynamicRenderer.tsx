import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import type { 
  UIResponse, 
  UIType,
  SelectionData, 
  SelectionOption,
  EquipmentData,
  EquipmentGridData,
  ChecklistData,
  LOTOData,
  WorkOrderData,
  ManualCitationData,
  InfoMessageData,
  ErrorMessageData,
  ImageCardData,
  MultiResponse,
  ResearchResultData,
  DataTableData,
  DynamicFormData,
  DocumentOutputData,
} from "./types";
import { SourcesIndicator } from "./ui/SourcesIndicator";

// Lazy load components for code splitting
const SelectionCard = lazy(() => import("./ui/SelectionCard"));
const InfoMessage = lazy(() => import("./ui/InfoMessage").then(m => ({ default: m.InfoMessage })));
const ErrorMessage = lazy(() => import("./ui/InfoMessage").then(m => ({ default: m.ErrorMessage })));
const EquipmentCard = lazy(() => import("./ui/EquipmentCard"));
const EquipmentGrid = lazy(() => import("./ui/EquipmentGrid"));
const ChecklistCard = lazy(() => import("./ui/ChecklistCard"));
const LOTODocument = lazy(() => import("./ui/LOTODocument"));
const WorkOrderForm = lazy(() => import("./ui/WorkOrderForm"));
const ManualCitation = lazy(() => import("./ui/ManualCitation"));
const ImageCard = lazy(() => import("./ui/ImageCard"));
// New generic UI components for research, generate, calculate modes
const ResearchResult = lazy(() => import("./ui/ResearchResult"));
const DataTable = lazy(() => import("./ui/DataTable"));
const DynamicForm = lazy(() => import("./ui/DynamicForm"));
const DocumentOutput = lazy(() => import("./ui/DocumentOutput"));

// ============================================
// Event Handlers
// ============================================

export interface DynamicRendererHandlers {
  onSelectionSelect?: (option: SelectionOption) => void;
  onSelectionFreeText?: (text: string) => void;
  onEquipmentClick?: (equipment: EquipmentData) => void;
  onChecklistItemToggle?: (itemId: string, checked: boolean) => void;
  onWorkOrderSubmit?: (data: WorkOrderData) => void;
  onManualPageClick?: (manualId: string, pageNumber: number) => void;
  onActionClick?: (actionId: string, params?: Record<string, unknown>) => void;
  onExport?: (type: UIType, data: unknown) => void;
  onSuggestionClick?: (suggestion: string) => void;
}

// ============================================
// Loading Fallback
// ============================================

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-6">
      <Loader2 className="w-5 h-5 text-[var(--nxb-brand-purple)] animate-spin" />
    </div>
  );
}

// ============================================
// Dynamic Renderer
// ============================================

interface DynamicRendererProps {
  response: UIResponse;
  handlers?: DynamicRendererHandlers;
  className?: string;
  hideSourcesIndicator?: boolean; // For nested responses, don't show sources twice
}

export function DynamicRenderer({ 
  response, 
  handlers = {},
  className = "",
  hideSourcesIndicator = false
}: DynamicRendererProps) {
  const { type, data, actions, exportable } = response;

  // Render based on UI type
  const renderComponent = () => {
    switch (type) {
      case 'selection':
        return (
          <SelectionCard
            data={data as SelectionData}
            onSelect={(option) => handlers.onSelectionSelect?.(option)}
            onFreeText={(text) => handlers.onSelectionFreeText?.(text)}
          />
        );

      case 'equipment_card':
        return (
          <EquipmentCard
            data={data as EquipmentData}
            onEquipmentClick={handlers.onEquipmentClick}
            onActionClick={handlers.onActionClick}
            exportable={exportable}
            onExport={() => handlers.onExport?.(type, data)}
          />
        );

      case 'equipment_grid':
        return (
          <EquipmentGrid
            data={data as EquipmentGridData}
            onEquipmentClick={handlers.onEquipmentClick}
          />
        );

      case 'checklist':
        return (
          <ChecklistCard
            data={data as ChecklistData}
            onItemToggle={handlers.onChecklistItemToggle}
            exportable={exportable}
            onExport={() => handlers.onExport?.(type, data)}
          />
        );

      case 'loto_procedure':
        return (
          <LOTODocument
            data={data as LOTOData}
            exportable={exportable !== false}
            onExport={() => handlers.onExport?.(type, data)}
          />
        );

      case 'work_order':
        return (
          <WorkOrderForm
            data={data as WorkOrderData}
            onSubmit={handlers.onWorkOrderSubmit}
            exportable={exportable !== false}
            onExport={() => handlers.onExport?.(type, data)}
          />
        );

      case 'manual_citation':
        return (
          <ManualCitation
            data={data as ManualCitationData}
            onPageClick={handlers.onManualPageClick}
          />
        );

      case 'info_message':
        return (
          <InfoMessage
            data={data as InfoMessageData}
            variant="info"
            onSuggestionClick={handlers.onSuggestionClick}
          />
        );

      case 'error_message':
        return (
          <ErrorMessage
            data={data as ErrorMessageData}
          />
        );

      case 'image_card':
        return (
          <ImageCard
            data={data as ImageCardData}
          />
        );

      // New generic UI components for research, generate, calculate modes
      case 'research_result':
        return (
          <ResearchResult
            data={data as ResearchResultData}
            onRelatedTopicClick={(topic) => handlers.onSuggestionClick?.(topic)}
          />
        );

      case 'data_table':
        return (
          <DataTable
            data={data as DataTableData}
            onExport={() => handlers.onExport?.(type, data)}
          />
        );

      case 'dynamic_form':
        return (
          <DynamicForm
            data={data as DynamicFormData}
            onSubmit={(values) => handlers.onActionClick?.('form_submit', values)}
            onExport={() => handlers.onExport?.(type, data)}
          />
        );

      case 'document_output':
        return (
          <DocumentOutput
            data={data as DocumentOutputData}
            onExport={() => handlers.onExport?.(type, data)}
          />
        );

      case 'multi_response':
        // Render multiple UI responses in sequence (e.g., RCA first, then options)
        const multiResponse = response as MultiResponse;
        console.log('🎯 Multi-response received:', multiResponse);
        
        // Safety check for responses array
        const responses = multiResponse.responses || (response as any).data?.responses || [];
        if (!responses || responses.length === 0) {
          console.warn('multi_response has no responses array:', response);
          return (
            <InfoMessage
              data={{
                title: "Response Processing",
                message: "Multiple responses received but could not be rendered.",
              }}
              variant="warning"
            />
          );
        }
        
        return (
          <div className="space-y-4">
            {responses.map((resp: UIResponse, index: number) => (
              <DynamicRenderer 
                key={index} 
                response={resp} 
                handlers={handlers}
                hideSourcesIndicator={true} // Don't show sources again for child responses
              />
            ))}
          </div>
        );

      default:
        console.warn(`Unknown UI type: ${type}`);
        return (
          <InfoMessage
            data={{
              title: "Unknown Response Type",
              message: `Received unknown UI type: ${type}`,
            }}
            variant="warning"
          />
        );
    }
  };

  return (
    <div className={className}>
      {/* Show knowledge base sources if available (only at top level) */}
      {!hideSourcesIndicator && response.sources && (
        <SourcesIndicator sources={response.sources} />
      )}
      
      <Suspense fallback={<LoadingFallback />}>
        {renderComponent()}
      </Suspense>

      {/* Render action buttons if present */}
      {actions && actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handlers.onActionClick?.(action.action, action.params)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${action.variant === 'primary' 
                  ? 'bg-[#71717A] text-white hover:bg-[#52525B]' 
                  : action.variant === 'secondary'
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'border border-white/20 text-white/70 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Message Wrapper (for chat context)
// ============================================

interface MessageWrapperProps {
  children: React.ReactNode;
  role: 'user' | 'assistant';
  timestamp?: Date;
}

export function MessageWrapper({ children, role, timestamp }: MessageWrapperProps) {
  return (
    <div className={`
      w-full py-4 font-['Suisse_Intl',sans-serif]
      ${role === 'user' ? 'bg-transparent' : 'bg-[var(--nxb-surface-5)]/50'}
    `}>
      <div className="max-w-4xl mx-auto px-6">
        {role === 'user' ? (
          <div className="flex justify-end">
            <div className="max-w-[80%] bg-[var(--nxb-brand-purple-10)] border border-[var(--nxb-brand-purple)]/30 rounded-lg rounded-tr-sm px-4 py-3">
              <div className="text-[var(--nxb-text-primary)] text-sm leading-relaxed">
                {children}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full animate-in fade-in slide-in-from-bottom-1 duration-200">
            {children}
          </div>
        )}
        
        {timestamp && (
          <div className={`text-[10px] text-[var(--nxb-text-muted)] mt-1.5 font-['PP_Supply_Mono',monospace] ${role === 'user' ? 'text-right pr-1' : 'pl-1'}`}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}

export default DynamicRenderer;

