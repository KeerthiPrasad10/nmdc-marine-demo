/**
 * Troubleshoot UI Component Types
 * 
 * These types define the structure of UI responses from the troubleshoot agent.
 * The agent returns JSON matching these interfaces, and the DynamicRenderer
 * routes to the appropriate component.
 */

// ============================================
// Base Response Type
// ============================================

export type UIType = 
  | 'selection'
  | 'equipment_card'
  | 'equipment_grid'
  | 'checklist'
  | 'loto_procedure'
  | 'work_order'
  | 'manual_citation'
  | 'info_message'
  | 'error_message'
  | 'image_card'
  | 'multi_response' // Multiple UI responses in sequence (e.g., RCA + options)
  | 'diagnostic_questions' // Multi-question diagnostic form
  // New generic UI types for non-troubleshooting use cases
  | 'research_result'  // Q&A answer with source citations
  | 'data_table'       // Tabular data display (sortable, exportable)
  | 'dynamic_form'     // Editable forms (invoices, reports, quotes)
  | 'document_output'  // Formatted document preview with export
  | 'rca'              // Root Cause Analysis display
  | 'decision_matrix'; // Decision matrix for comparing options

export interface KnowledgeBaseImage {
  id: string;
  description: string;
  source_document: string;
  source_page?: number;
  image_url?: string;
  image_base64?: string;
  image_type?: string;
}

export interface KnowledgeBaseSources {
  pnids: Array<{ tag: string; type: string; drawing: string }>;
  manuals: Array<{ title: string; page: number }>;
  images: KnowledgeBaseImage[];
  searchedPnidCount: number;
  searchedManualCount: number;
}

export interface UIResponse {
  type: UIType;
  data: unknown;
  actions?: Action[];
  exportable?: boolean;
  sources?: KnowledgeBaseSources;
}

export interface Action {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  action: string; // Action identifier for handler
  params?: Record<string, unknown>;
}

// ============================================
// Selection Component
// ============================================

export interface SelectionOption {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  metadata?: Record<string, string>;
  drawingNumber?: string;
  projectId?: string;
}

export interface SelectionData {
  question: string;
  options: SelectionOption[];
  allowFreeText?: boolean;
  multiSelect?: boolean;
}

export interface SelectionResponse extends UIResponse {
  type: 'selection';
  data: SelectionData;
}

// ============================================
// Equipment Card Component
// ============================================

export interface EquipmentConnection {
  direction: 'upstream' | 'downstream';
  tag: string;
  type: string;
  via?: string; // Line ID
}

export interface EquipmentInstrument {
  tag: string;
  type: string;
  measuredVariable?: string;
}

export interface EquipmentData {
  tag: string;
  name?: string;
  type: string;
  subtype?: string;
  description?: string;
  drawingNumber?: string;
  drawingId?: string;
  connections?: EquipmentConnection[];
  instruments?: EquipmentInstrument[];
  specifications?: Record<string, string>;
  manualReferences?: ManualReference[];
}

export interface EquipmentCardResponse extends UIResponse {
  type: 'equipment_card';
  data: EquipmentData;
}

// ============================================
// Equipment Grid Component
// ============================================

export interface EquipmentGridData {
  title?: string;
  equipment: EquipmentData[];
  groupBy?: 'type' | 'drawing' | 'none';
}

export interface EquipmentGridResponse extends UIResponse {
  type: 'equipment_grid';
  data: EquipmentGridData;
}

// ============================================
// Checklist Component
// ============================================

export interface ChecklistItem {
  id: string;
  text: string;
  checked?: boolean;
  priority?: 'high' | 'medium' | 'low';
  reference?: string; // Manual page or drawing reference
  subItems?: ChecklistItem[];
}

export interface ChecklistData {
  title: string;
  description?: string;
  items: ChecklistItem[];
  references?: ManualReference[];
}

export interface ChecklistResponse extends UIResponse {
  type: 'checklist';
  data: ChecklistData;
}

// ============================================
// LOTO Procedure Component
// ============================================

export interface LOTOStep {
  step: number;
  point: string;
  action: string;
  verification: string;
  lockLocation?: string;
  energySource?: string;
}

export interface LOTOData {
  equipmentTag: string;
  equipmentName: string;
  procedureNumber?: string;
  revisionDate?: string;
  scope?: string;
  hazards: string[];
  ppe: string[];
  preIsolationChecks?: string[];
  isolationSteps: LOTOStep[];
  drainSteps?: LOTOStep[];
  ventSteps?: LOTOStep[];
  verificationSteps?: string[];
  reinstateSteps?: string[];
  authorizedPersonnel?: string[];
  drawingReference?: string;
}

export interface LOTOResponse extends UIResponse {
  type: 'loto_procedure';
  data: LOTOData;
  exportable: true;
}

// ============================================
// Work Order Component
// ============================================

export interface WorkOrderData {
  workOrderNumber?: string;
  equipmentTag: string;
  equipmentName?: string;
  priority: 'critical' | 'emergency' | 'high' | 'urgent' | 'medium' | 'normal' | 'low' | string;
  workType: 'corrective' | 'preventive' | 'inspection' | 'modification' | string;
  description: string;
  symptoms?: string;
  requestedBy?: string;
  requestedDate?: string;
  targetDate?: string;
  estimatedHours?: number;
  requiredParts?: string[];
  requiredTools?: string[];
  safetyRequirements?: string[];
  lotoRequired?: boolean;
  drawingReference?: string;
  notes?: string;
  // Flexible extra fields from API (snake_case variants)
  work_order_number?: string;
  equipment_tag?: string;
  equipment_name?: string;
  work_type?: string;
  estimated_hours?: number;
  required_parts?: string[];
  required_tools?: string[];
  safety_requirements?: string[];
  loto_required?: boolean;
  drawing_reference?: string;
}

export interface WorkOrderResponse extends UIResponse {
  type: 'work_order';
  data: WorkOrderData;
  exportable: true;
}

// ============================================
// Manual Citation Component
// ============================================

export interface ManualReference {
  manualId: string;
  manualName: string;
  pageNumber: number;
  section?: string;
  snippet?: string;
  relevance?: number;
}

export interface ManualCitationData {
  title: string;
  summary: string;
  references: ManualReference[];
  fullContent?: string;
}

export interface ManualCitationResponse extends UIResponse {
  type: 'manual_citation';
  data: ManualCitationData;
}

// ============================================
// Info/Error Message Components
// ============================================

export interface InfoMessageData {
  title?: string;
  message: string;
  details?: string[];
  suggestions?: string[];
}

export interface InfoMessageResponse extends UIResponse {
  type: 'info_message';
  data: InfoMessageData;
}

export interface ErrorMessageData {
  title?: string;
  message: string;
  code?: string;
  suggestion?: string;
}

export interface ErrorMessageResponse extends UIResponse {
  type: 'error_message';
  data: ErrorMessageData;
}

// ============================================
// Image Card Component
// ============================================

export interface ImageCardData {
  title: string;
  description: string;
  source_document?: string;
  source_page?: number;
  image_url?: string;
  image_base64?: string;
  detected_equipment?: string[];
}

export interface ImageCardResponse extends UIResponse {
  type: 'image_card';
  data: ImageCardData;
}

// ============================================
// Research Result Component (Q&A with Citations)
// ============================================

export interface ResearchCitation {
  source: string;          // Document name
  page?: number;           // Page number if applicable
  section?: string;        // Section title
  excerpt: string;         // Relevant excerpt
  confidence?: number;     // Match confidence (0-1)
}

export interface ResearchResultData {
  question: string;        // The user's question
  answer: string;          // The comprehensive answer
  summary?: string;        // Brief summary for quick reading
  citations: ResearchCitation[];
  relatedTopics?: string[]; // Suggested follow-up topics
  confidence?: number;      // Overall confidence in answer
}

export interface ResearchResultResponse extends UIResponse {
  type: 'research_result';
  data: ResearchResultData;
}

// ============================================
// Data Table Component (Tabular Data Display)
// ============================================

export interface DataTableColumn {
  key: string;             // Column identifier
  label: string;           // Display header
  type?: 'text' | 'number' | 'currency' | 'date' | 'boolean';
  sortable?: boolean;
  width?: string;          // CSS width
}

export interface DataTableRow {
  id: string;
  cells: Record<string, unknown>;  // Key-value pairs matching columns
  metadata?: Record<string, unknown>;
}

export interface DataTableData {
  title: string;
  description?: string;
  columns: DataTableColumn[];
  rows: DataTableRow[];
  summary?: {              // Optional summary row (totals, etc.)
    label: string;
    values: Record<string, unknown>;
  };
  exportFormats?: ('csv' | 'json' | 'pdf')[];
}

export interface DataTableResponse extends UIResponse {
  type: 'data_table';
  data: DataTableData;
  exportable: true;
}

// ============================================
// Dynamic Form Component (Invoices, Reports, Quotes)
// ============================================

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'select' | 'textarea' | 'checkbox' | 'email' | 'phone';
  value?: unknown;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;  // For select fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  colspan?: number;        // Grid column span (1-4)
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  collapsible?: boolean;
}

export interface DynamicFormData {
  formType: 'invoice' | 'quote' | 'report' | 'rfp' | 'custom';
  title: string;
  description?: string;
  sections: FormSection[];
  lineItems?: {            // For invoices/quotes with line items
    columns: DataTableColumn[];
    rows: DataTableRow[];
    allowAdd?: boolean;
    allowRemove?: boolean;
  };
  totals?: Array<{
    label: string;
    value: number;
    type?: 'subtotal' | 'tax' | 'discount' | 'total';
  }>;
  metadata?: {
    documentNumber?: string;
    date?: string;
    dueDate?: string;
    status?: string;
  };
}

export interface DynamicFormResponse extends UIResponse {
  type: 'dynamic_form';
  data: DynamicFormData;
  exportable: true;
}

// ============================================
// Document Output Component (Formatted Preview)
// ============================================

export interface DocumentSection {
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'divider' | 'quote';
  level?: 1 | 2 | 3;       // For headings
  content?: string;
  items?: string[];        // For lists
  tableData?: {            // For inline tables
    headers: string[];
    rows: string[][];
  };
}

export interface DocumentOutputData {
  title: string;
  documentType?: string;   // e.g., "Building Code Summary", "Project Cost Estimate"
  date?: string;
  author?: string;
  sections: DocumentSection[];
  footer?: string;
  watermark?: string;
}

export interface DocumentOutputResponse extends UIResponse {
  type: 'document_output';
  data: DocumentOutputData;
  exportable: true;
}

// ============================================
// Multi Response Component (RCA + Options)
// ============================================

export interface MultiResponseData {
  responses: UIResponse[];
}

export interface MultiResponse extends UIResponse {
  type: 'multi_response';
  responses: UIResponse[];
}

// ============================================
// Root Cause Analysis Component
// ============================================

export interface RCAData {
  title?: string;
  equipment?: string;
  issue?: string;
  analysis?: string;
  message?: string;
  content?: string;
  rootCause?: string;
  factors?: string[];
  causes?: string[];
  recommendations?: string[];
  steps?: string[];
  severity?: 'low' | 'medium' | 'high' | 'critical' | string;
  confidence?: number;
}

export interface RCAResponse extends UIResponse {
  type: 'rca';
  data: RCAData;
}

// ============================================
// Decision Matrix Component
// ============================================

export interface DecisionOption {
  id: string;
  name: string;
  description?: string;
  scores: Record<string, number>;
  totalScore?: number;
  recommended?: boolean;
}

export interface DecisionCriterion {
  id: string;
  name: string;
  weight?: number;
  description?: string;
}

export interface DecisionMatrixData {
  title?: string;
  description?: string;
  criteria: DecisionCriterion[];
  options: DecisionOption[];
  recommendation?: string;
  notes?: string;
}

export interface DecisionMatrixResponse extends UIResponse {
  type: 'decision_matrix';
  data: DecisionMatrixData;
}

// ============================================
// Message Types for Chat
// ============================================

export interface UserMessage {
  id: string;
  role: 'user';
  content: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface AssistantMessage {
  id: string;
  role: 'assistant';
  uiType: UIType;
  uiData: unknown;
  citations?: ManualReference[];
  createdAt: Date;
}

export type TroubleshootMessage = UserMessage | AssistantMessage;

// ============================================
// Session Types
// ============================================

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  projectIds: string[];
  manualIds: string[];
  isDefault: boolean;
  createdAt: Date;
}

export interface TroubleshootSession {
  id: string;
  title?: string;
  knowledgeBaseId?: string;
  messages: TroubleshootMessage[];
  createdAt: Date;
}

