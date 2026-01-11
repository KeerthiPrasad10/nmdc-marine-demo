/**
 * A2UI Types - Agent-to-UI Protocol
 * Based on Google's A2UI open project for agent-driven interfaces
 * https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/
 * 
 * This is a declarative format that allows agents to generate rich UIs
 * that the client renders using its own component catalog.
 */

// Base component interface
export interface A2UIComponent {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  children?: A2UIComponent[];
}

// Layout types
export interface A2UILayout extends A2UIComponent {
  type: 'row' | 'column' | 'grid' | 'card' | 'section';
  props?: {
    gap?: number;
    columns?: number;
    title?: string;
    collapsible?: boolean;
    variant?: 'default' | 'warning' | 'danger' | 'success';
  };
}

// Form field types
export interface A2UIField extends A2UIComponent {
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'time' | 'signature';
  props: {
    name: string;
    label: string;
    value?: string | number | boolean;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    options?: Array<{ value: string; label: string }>;
    helperText?: string;
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      message?: string;
    };
  };
}

// Display types
export interface A2UIText extends A2UIComponent {
  type: 'heading' | 'paragraph' | 'label' | 'badge';
  props: {
    content: string;
    level?: 1 | 2 | 3 | 4;
    variant?: 'default' | 'muted' | 'warning' | 'danger' | 'success';
  };
}

// Table type
export interface A2UITable extends A2UIComponent {
  type: 'table';
  props: {
    columns: Array<{ key: string; label: string; editable?: boolean; type?: 'text' | 'number' }>;
    rows: Array<Record<string, unknown>>;
    addRowEnabled?: boolean;
    deleteRowEnabled?: boolean;
  };
}

// Checklist type
export interface A2UIChecklist extends A2UIComponent {
  type: 'checklist';
  props: {
    items: Array<{
      id: string;
      label: string;
      checked?: boolean;
      required?: boolean;
      critical?: boolean;
      notes?: string;
    }>;
  };
}

// Button type
export interface A2UIButton extends A2UIComponent {
  type: 'button';
  props: {
    label: string;
    action: string;
    variant?: 'primary' | 'secondary' | 'danger';
    icon?: string;
  };
}

// Work Order specific schema (high-level structure that agents generate)
export interface WorkOrderSchema {
  workOrderNumber: string;
  priority: string; // API may return various values: critical, urgent, high, medium, low, normal
  status?: string; // draft, pending, approved, in_progress, completed
  
  // Equipment info - optional as API may use different field names
  equipment?: {
    tag?: string;
    name?: string;
    location?: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    type?: string;
  };
  
  // API may also use these flat fields
  equipmentTag?: string;
  equipmentName?: string;
  
  // Work details
  workType?: string;
  description?: string;
  symptoms?: string | string[];
  estimatedDuration?: string;
  estimatedHours?: number;
  targetCompletion?: string;
  targetDate?: string;
  requestedDate?: string;
  
  // Safety & compliance - optional, may not be included
  safety?: {
    atexRequired?: boolean;
    atexZone?: string;
    lotoRequired?: boolean;
    confinedSpace?: boolean;
    hotWorkPermit?: boolean;
    ppeRequired?: string[];
    specialPrecautions?: string[];
  };
  
  // API may use flat fields for safety
  lotoRequired?: boolean;
  safetyRequirements?: string[];
  
  // LOTO points if required
  lotoPoints?: Array<{
    sequence?: number;
    tag?: string;
    type?: string;
    location?: string;
    action?: string;
    verification?: string;
    isolated?: boolean;
    verifiedBy?: string;
  }>;
  
  // Procedure - optional
  procedure?: {
    steps?: Array<{ step?: number; description?: string; notes?: string }>;
    acceptanceCriteria?: string[];
  };
  
  // Procedure steps - can be array of strings or objects
  procedureSteps?: Array<{
    step?: number;
    description?: string;
    notes?: string;
    critical?: boolean;
    completed?: boolean;
    completedBy?: string;
    completedAt?: string;
  }>;
  
  // Quality checkpoints
  qualityCheckpoints?: Array<{
    id?: string;
    checkpoint?: string;
    criteria?: string;
    passed?: boolean;
    verifiedBy?: string;
    notes?: string;
  }>;
  
  // Parts & tools - can be array of strings or objects
  requiredParts?: Array<{
    partNumber?: string;
    description?: string;
    quantity?: number;
    unitCost?: number;
    inStock?: boolean;
  } | string>;
  
  parts?: Array<{ partNumber?: string; description?: string; quantity?: number } | string>;
  
  requiredTools?: string[];
  
  // Personnel - optional
  personnel?: {
    requestedBy?: string;
    assignedTo?: string;
    safetyObserver?: string;
    supervisor?: string;
  };
  
  // Approvals - optional
  approvals?: Array<{
    role?: string;
    name?: string;
    signature?: string;
    date?: string;
    approved?: boolean;
  }>;
  
  // Metadata - optional
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  notes?: string;
  
  // Additional fields that API might return
  [key: string]: unknown;
}

// LOTO Procedure Schema
export interface LOTOSchema {
  procedureNumber: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  
  // Equipment info
  equipment: {
    tag: string;
    name: string;
    location: string;
    system?: string;
  };
  
  // Work reference
  workOrderNumber?: string;
  workDescription: string;
  estimatedDuration: string;
  
  // Energy sources & hazards
  energySources: Array<{
    type: 'electrical' | 'mechanical' | 'hydraulic' | 'pneumatic' | 'thermal' | 'chemical' | 'gravitational' | 'stored_energy';
    description: string;
    voltage?: string;
    pressure?: string;
  }>;
  
  hazards: string[];
  
  // Isolation points
  isolationPoints: Array<{
    sequence: number;
    tag: string;
    type: string;
    location: string;
    normalState: string;
    isolatedState: string;
    action: string;
    verification: string;
    lockId?: string;
    isolated?: boolean;
    isolatedBy?: string;
    isolatedAt?: string;
    verified?: boolean;
    verifiedBy?: string;
    verifiedAt?: string;
  }>;
  
  // Verification
  zeroEnergyVerification: Array<{
    id: string;
    point: string;
    method: string;
    verified?: boolean;
    verifiedBy?: string;
    verifiedAt?: string;
  }>;
  
  // Reinstatement
  reinstatementSteps: Array<{
    step: number;
    description: string;
    completed?: boolean;
    completedBy?: string;
    completedAt?: string;
  }>;
  
  // Personnel
  personnel: {
    authorizedPerson: string;
    affectedPersons: string[];
    safetyObserver?: string;
  };
  
  // Safety
  ppeRequired: string[];
  specialPrecautions: string[];
  emergencyContacts: Array<{
    role: string;
    name: string;
    phone: string;
  }>;
  
  // Approvals
  approvals: Array<{
    role: string;
    name?: string;
    signature?: string;
    date?: string;
    time?: string;
    approved?: boolean;
  }>;
  
  // Metadata
  createdAt: string;
  createdBy: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

// Checklist Schema
export interface ChecklistSchema {
  checklistId: string;
  title: string;
  type: 'inspection' | 'pre_job' | 'post_job' | 'safety' | 'quality' | 'maintenance';
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  
  // Reference
  equipment?: {
    tag: string;
    name: string;
    location: string;
  };
  workOrderNumber?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'per_job';
  
  // Items grouped by category
  categories: Array<{
    id: string;
    name: string;
    items: Array<{
      id: string;
      text: string;
      type: 'check' | 'value' | 'select' | 'text';
      required?: boolean;
      critical?: boolean;
      checked?: boolean;
      value?: string | number;
      unit?: string;
      min?: number;
      max?: number;
      options?: string[];
      selectedOption?: string;
      notes?: string;
      photo?: string;
      failureAction?: string;
    }>;
  }>;
  
  // Summary
  summary?: {
    passed: number;
    failed: number;
    notApplicable: number;
    total: number;
  };
  
  // Findings & actions
  findings?: Array<{
    id: string;
    itemId: string;
    severity: 'critical' | 'major' | 'minor' | 'observation';
    description: string;
    correctiveAction?: string;
    dueDate?: string;
    assignedTo?: string;
    status?: 'open' | 'in_progress' | 'closed';
  }>;
  
  // Personnel
  inspector: string;
  reviewer?: string;
  
  // Approvals
  approvals: Array<{
    role: string;
    name?: string;
    signature?: string;
    date?: string;
    approved?: boolean;
  }>;
  
  // Metadata
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

// Equipment Card Schema
export interface EquipmentCardSchema {
  // Identification
  tag: string;
  name: string;
  type: string;
  
  // Classification
  criticality: 'critical' | 'high' | 'medium' | 'low';
  status: 'operational' | 'degraded' | 'failed' | 'maintenance' | 'decommissioned';
  
  // Location
  location: {
    vessel?: string;
    platform?: string;
    deck?: string;
    area?: string;
    zone?: string;
    coordinates?: string;
  };
  
  // Technical details
  manufacturer: string;
  model: string;
  serialNumber: string;
  installDate?: string;
  commissionDate?: string;
  
  // Specifications
  specifications: Record<string, string | number>;
  
  // Operating parameters
  operatingLimits?: Array<{
    parameter: string;
    unit: string;
    min?: number;
    max?: number;
    normal?: number;
    current?: number;
    status?: 'normal' | 'warning' | 'alarm';
  }>;
  
  // Current readings (if available)
  currentReadings?: Array<{
    parameter: string;
    value: number;
    unit: string;
    timestamp: string;
    status: 'normal' | 'warning' | 'alarm';
  }>;
  
  // Maintenance info
  maintenance: {
    lastPM?: string;
    nextPM?: string;
    pmFrequency?: string;
    runningHours?: number;
    warrantyExpiry?: string;
  };
  
  // Recent history
  recentHistory?: Array<{
    date: string;
    type: 'maintenance' | 'repair' | 'inspection' | 'incident';
    description: string;
    workOrder?: string;
  }>;
  
  // Documents
  documents?: Array<{
    type: 'manual' | 'datasheet' | 'drawing' | 'certificate' | 'procedure';
    title: string;
    documentId?: string;
    url?: string;
  }>;
  
  // Related equipment
  relatedEquipment?: Array<{
    tag: string;
    name: string;
    relationship: 'parent' | 'child' | 'connected' | 'backup';
  }>;
  
  // Safety
  safetyInfo?: {
    atexZone?: string;
    hazards?: string[];
    ppeRequired?: string[];
    specialProcedures?: string[];
  };
  
  // Notes
  notes?: string;
}

// A2UI Response from agent
export interface A2UIResponse {
  type: 'work_order' | 'checklist' | 'loto_procedure' | 'equipment_card' | 'form' | 'info';
  version: string;
  schema: WorkOrderSchema | LOTOSchema | ChecklistSchema | EquipmentCardSchema | Record<string, unknown>;
  layout?: A2UIComponent[];
}

