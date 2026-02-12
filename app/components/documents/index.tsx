// @ts-nocheck - Legacy document renderer with dynamic types
'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  FileText, Download, Check, Copy, Printer, 
  AlertTriangle, Wrench, Shield, Package, Clock,
  ChevronDown, ChevronUp, Plus, Trash2, Edit3,
  MapPin, Calendar, User, Tag, Gauge, Building,
  Thermometer, Zap, Anchor, Settings, Info,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface AssetDetails {
  tag?: string;
  name?: string;
  type?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  vessel?: string;
  deck?: string;
  zone?: string;
  installDate?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  criticality?: 'Critical' | 'High' | 'Medium' | 'Low';
  status?: 'Operational' | 'Degraded' | 'Failed' | 'Maintenance';
  specifications?: Record<string, string | number>;
  [key: string]: unknown; // Allow dynamic fields
}

interface WorkOrderData {
  workOrderNumber?: string;
  asset?: AssetDetails;
  equipmentTag?: string;
  equipmentName?: string;
  workType?: string;
  priority?: string;
  status?: 'Draft' | 'Pending Approval' | 'Approved' | 'In Progress' | 'Completed' | 'Closed';
  description?: string;
  symptoms?: string | string[];
  rootCause?: string;
  requiredParts?: Array<{ partNumber?: string; description: string; quantity: number; available?: boolean }>;
  requiredTools?: string[];
  safetyRequirements?: string[];
  procedureSteps?: Array<{ step: number; description: string; notes?: string; critical?: boolean; estimatedTime?: string }> | string[];
  estimatedDuration?: string;
  actualDuration?: string;
  references?: Array<{ title: string; page?: number; documentId?: string }>;
  lockoutTagoutRequired?: boolean;
  atexCompliance?: boolean;
  confinedSpaceEntry?: boolean;
  hotWorkPermit?: boolean;
  createdBy?: string;
  createdDate?: string;
  assignedTo?: string;
  approvals?: Array<{ role: string; name?: string; date?: string; status?: 'Pending' | 'Approved' | 'Rejected' }>;
  notes?: string;
  attachments?: Array<{ name: string; type: string; url?: string }>;
  [key: string]: unknown; // Allow dynamic fields
}

interface LOTOData {
  procedureNumber?: string;
  asset?: AssetDetails;
  equipmentTag?: string;
  equipmentName?: string;
  location?: string;
  estimatedDuration?: string;
  hazards?: string[];
  energySources?: Array<{ type: string; location: string; isolationMethod: string }>;
  requiredPpe?: string[];
  isolationSteps?: Array<{
    step: number;
    point: string;
    pointType: string;
    action: string;
    verification: string;
    lockId?: string;
  }>;
  verificationSteps?: string[];
  reinstateSteps?: string[];
  warnings?: string[];
  approvals?: Array<{ role: string; name?: string; date?: string; status?: 'Pending' | 'Approved' | 'Rejected' }>;
  [key: string]: unknown;
}

interface ChecklistData {
  title?: string;
  description?: string;
  checklistType?: string;
  frequency?: string;
  asset?: AssetDetails;
  items: Array<{
    id?: string;
    category?: string;
    text: string;
    priority?: string;
    reference?: string;
    checked?: boolean;
    value?: string | number;
    unit?: string;
    min?: number;
    max?: number;
    notes?: string;
  }>;
  approvals?: Array<{ role: string; name?: string; date?: string; status?: 'Pending' | 'Approved' | 'Rejected' }>;
  [key: string]: unknown;
}

interface DocumentProps {
  onSubmit?: (data: unknown) => void;
  onExport?: (data: unknown) => void;
}

// ============================================
// Smart Field Detection & Rendering
// ============================================

const FIELD_ICONS: Record<string, React.ElementType> = {
  location: MapPin,
  vessel: Anchor,
  deck: Building,
  zone: MapPin,
  manufacturer: Building,
  model: Settings,
  serial: Tag,
  temperature: Thermometer,
  pressure: Gauge,
  power: Zap,
  voltage: Zap,
  current: Zap,
  date: Calendar,
  user: User,
  assigned: User,
  created: User,
};

function getFieldIcon(fieldName: string): React.ElementType {
  const lowerField = fieldName.toLowerCase();
  for (const [key, icon] of Object.entries(FIELD_ICONS)) {
    if (lowerField.includes(key)) return icon;
  }
  return Info;
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

function isDisplayableValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === 'object' && Object.keys(value as object).length === 0) return false;
  return true;
}

// Render any unknown/dynamic fields intelligently
function DynamicFieldRenderer({ data, excludeKeys = [] }: { data: Record<string, unknown>; excludeKeys?: string[] }) {
  const dynamicFields = useMemo(() => {
    const knownKeys = new Set([
      'workOrderNumber', 'asset', 'equipmentTag', 'equipmentName', 'workType', 'priority',
      'status', 'description', 'symptoms', 'rootCause', 'requiredParts', 'requiredTools',
      'safetyRequirements', 'procedureSteps', 'estimatedDuration', 'actualDuration',
      'references', 'lockoutTagoutRequired', 'atexCompliance', 'confinedSpaceEntry',
      'hotWorkPermit', 'createdBy', 'createdDate', 'assignedTo', 'approvals', 'notes',
      'attachments', 'items', 'title', 'checklistType', 'frequency', 'procedureNumber',
      'hazards', 'energySources', 'requiredPpe', 'isolationSteps', 'verificationSteps',
      'reinstateSteps', 'warnings', ...excludeKeys
    ]);
    
    return Object.entries(data)
      .filter(([key, value]) => !knownKeys.has(key) && isDisplayableValue(value))
      .map(([key, value]) => ({ key, value, label: formatFieldLabel(key) }));
  }, [data, excludeKeys]);

  if (dynamicFields.length === 0) return null;

  return (
    <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
      <h4 className="text-[10px] uppercase tracking-wider text-blue-400/60 mb-2 flex items-center gap-1">
        <Info className="w-3 h-3" /> Additional Information
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {dynamicFields.map(({ key, value, label }) => {
          const Icon = getFieldIcon(key);
          return (
            <div key={key} className="flex items-start gap-2 text-xs">
              <Icon className="w-3 h-3 text-blue-400/50 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-white/40">{label}:</span>
                <span className="text-white/70 ml-1">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Utility Components
// ============================================

function EditableField({ 
  value, 
  onChange, 
  placeholder = 'Click to edit',
  className = '',
  multiline = false,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  disabled?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleBlur = () => {
    setIsEditing(false);
    onChange(editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (disabled) {
    return <span className={className}>{value || placeholder}</span>;
  }

  if (isEditing) {
    const Component = multiline ? 'textarea' : 'input';
    return (
      <Component
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className={`bg-white/10 border border-white/30 rounded px-2 py-1 text-white outline-none focus:border-blue-400 ${className}`}
        placeholder={placeholder}
        rows={multiline ? 3 : undefined}
      />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-white/10 rounded px-1 -mx-1 transition-colors group ${!value ? 'text-white/40 italic' : ''} ${className}`}
    >
      {value || placeholder}
      <Edit3 className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-50" />
    </span>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  
  const colors: Record<string, string> = {
    'Draft': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    'Pending Approval': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Approved': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'In Progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Completed': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Closed': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    'Operational': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Degraded': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Failed': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    'Maintenance': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${colors[status] || colors['Draft']}`}>
      {status.toUpperCase()}
    </span>
  );
}

function PriorityBadge({ priority, onChange }: { priority: string; onChange?: (p: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const priorities = ['Critical', 'High', 'Medium', 'Low'];
  const colors: Record<string, string> = {
    'Critical': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    'High': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Medium': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Low': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  
  const normalized = priorities.find(p => p.toLowerCase() === priority?.toLowerCase()) || 'Medium';
  
  if (!onChange) {
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${colors[normalized]}`}>
        {normalized.toUpperCase()}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2 py-0.5 rounded text-[10px] font-medium border ${colors[normalized]} cursor-pointer hover:opacity-80 transition-opacity`}
      >
        {normalized.toUpperCase()} ▾
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-white/20 rounded-lg shadow-xl z-10 overflow-hidden">
          {priorities.map(p => (
            <button
              key={p}
              onClick={() => { onChange(p); setIsOpen(false); }}
              className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-white/10 ${colors[p]}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, color = 'white' }: { icon?: React.ElementType; title: string; color?: string }) {
  const colorClasses: Record<string, string> = {
    'white': 'text-white/40',
    'rose': 'text-rose-400',
    'amber': 'text-amber-400',
    'emerald': 'text-emerald-400',
    'blue': 'text-blue-400',
  };
  
  return (
    <h4 className={`text-[10px] uppercase tracking-wider ${colorClasses[color]} mb-2 flex items-center gap-1.5`}>
      {Icon && <Icon className="w-3 h-3" />}
      {title}
    </h4>
  );
}

// ============================================
// Asset Details Card
// ============================================

function AssetDetailsCard({ asset, editable = true }: { asset?: AssetDetails; editable?: boolean }) {
  if (!asset) return null;

  const statusColors: Record<string, string> = {
    'Operational': 'text-emerald-400',
    'Degraded': 'text-amber-400',
    'Failed': 'text-rose-400',
    'Maintenance': 'text-blue-400',
  };

  const criticalityColors: Record<string, string> = {
    'Critical': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    'High': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Medium': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Low': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  // Get all displayable fields
  const standardFields = ['tag', 'name', 'type', 'manufacturer', 'model', 'serialNumber', 
    'location', 'vessel', 'deck', 'zone', 'installDate', 'lastMaintenance', 'nextMaintenance',
    'criticality', 'status', 'specifications'];
  
  const extraFields = Object.entries(asset)
    .filter(([key, value]) => !standardFields.includes(key) && isDisplayableValue(value));

  return (
    <div className="p-3 rounded-lg bg-gradient-to-r from-slate-500/10 to-transparent border border-slate-500/20">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <span className="text-white font-mono font-semibold">{asset.tag || 'N/A'}</span>
            {asset.status && (
              <span className={`text-xs ${statusColors[asset.status] || 'text-white/50'}`}>
                ● {asset.status}
              </span>
            )}
          </div>
          <h4 className="text-white/90 font-medium mt-1">{asset.name || 'Unknown Equipment'}</h4>
          {asset.type && <p className="text-white/50 text-xs">{asset.type}</p>}
        </div>
        {asset.criticality && (
          <span className={`px-2 py-0.5 rounded text-[9px] font-medium border ${criticalityColors[asset.criticality]}`}>
            {asset.criticality.toUpperCase()} CRITICALITY
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-xs">
        {asset.manufacturer && (
          <div className="flex items-center gap-1.5">
            <Building className="w-3 h-3 text-white/30" />
            <span className="text-white/40">Mfg:</span>
            <span className="text-white/70">{asset.manufacturer}</span>
          </div>
        )}
        {asset.model && (
          <div className="flex items-center gap-1.5">
            <Settings className="w-3 h-3 text-white/30" />
            <span className="text-white/40">Model:</span>
            <span className="text-white/70">{asset.model}</span>
          </div>
        )}
        {asset.serialNumber && (
          <div className="flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-white/30" />
            <span className="text-white/40">S/N:</span>
            <span className="text-white/70 font-mono">{asset.serialNumber}</span>
          </div>
        )}
        {asset.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-white/30" />
            <span className="text-white/40">Location:</span>
            <span className="text-white/70">{asset.location}</span>
          </div>
        )}
        {asset.vessel && (
          <div className="flex items-center gap-1.5">
            <Anchor className="w-3 h-3 text-white/30" />
            <span className="text-white/40">Vessel:</span>
            <span className="text-white/70">{asset.vessel}</span>
          </div>
        )}
        {(asset.deck || asset.zone) && (
          <div className="flex items-center gap-1.5">
            <Building className="w-3 h-3 text-white/30" />
            <span className="text-white/40">Deck/Zone:</span>
            <span className="text-white/70">{[asset.deck, asset.zone].filter(Boolean).join(' / ')}</span>
          </div>
        )}
        {asset.lastMaintenance && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-white/30" />
            <span className="text-white/40">Last PM:</span>
            <span className="text-white/70">{asset.lastMaintenance}</span>
          </div>
        )}
        {asset.nextMaintenance && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-white/30" />
            <span className="text-white/40">Next PM:</span>
            <span className="text-white/70">{asset.nextMaintenance}</span>
          </div>
        )}
        
        {/* Dynamic extra fields */}
        {extraFields.map(([key, value]) => {
          const Icon = getFieldIcon(key);
          return (
            <div key={key} className="flex items-center gap-1.5">
              <Icon className="w-3 h-3 text-white/30" />
              <span className="text-white/40">{formatFieldLabel(key)}:</span>
              <span className="text-white/70">{String(value)}</span>
            </div>
          );
        })}
      </div>

      {/* Specifications */}
      {asset.specifications && Object.keys(asset.specifications).length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <h5 className="text-[9px] uppercase tracking-wider text-white/30 mb-2">Specifications</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(asset.specifications).map(([key, value]) => (
              <div key={key} className="px-2 py-1 rounded bg-white/5 text-xs">
                <span className="text-white/40">{formatFieldLabel(key)}:</span>
                <span className="text-white/70 ml-1 font-mono">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Approval Signatures Block (for PDF)
// ============================================

function ApprovalSignatures({ 
  approvals = [],
  documentType = 'Work Order',
}: { 
  approvals?: Array<{ role: string; name?: string; date?: string; status?: 'Pending' | 'Approved' | 'Rejected' }>;
  documentType?: string;
}) {
  // Default approval workflow if none provided
  const defaultApprovals = [
    { role: 'Prepared By', name: '', date: '', status: 'Pending' as const },
    { role: 'Reviewed By', name: '', date: '', status: 'Pending' as const },
    { role: 'Approved By', name: '', date: '', status: 'Pending' as const },
  ];

  const displayApprovals = approvals.length > 0 ? approvals : defaultApprovals;

  const statusIcons: Record<string, React.ReactNode> = {
    'Approved': <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    'Rejected': <XCircle className="w-4 h-4 text-rose-400" />,
    'Pending': <AlertCircle className="w-4 h-4 text-amber-400" />,
  };

  return (
    <div className="approval-signatures mt-6 pt-4 border-t border-white/10">
      <h4 className="text-[10px] uppercase tracking-wider text-white/40 mb-3">
        Approval Signatures
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {displayApprovals.map((approval, i) => (
          <div 
            key={i}
            className={`p-3 rounded-lg border ${
              approval.status === 'Approved' ? 'bg-emerald-500/5 border-emerald-500/20' :
              approval.status === 'Rejected' ? 'bg-rose-500/5 border-rose-500/20' :
              'bg-white/[0.02] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50">{approval.role}</span>
              {approval.status && statusIcons[approval.status]}
            </div>
            <div className="h-10 border-b border-dashed border-white/20 mb-2 flex items-end justify-center">
              {approval.name ? (
                <span className="text-white/70 text-sm font-medium pb-1">{approval.name}</span>
              ) : (
                <span className="text-white/20 text-xs pb-1 italic">Signature</span>
              )}
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-white/30">Name: {approval.name || '_____________'}</span>
              <span className="text-white/30">Date: {approval.date || '___/___/___'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Smart PDF Generator
// ============================================

function generateSmartPDF(
  documentRef: React.RefObject<HTMLDivElement>,
  options: {
    title: string;
    documentNumber?: string;
    documentType: string;
    asset?: AssetDetails;
    approvals?: Array<{ role: string; name?: string; date?: string; status?: string }>;
    includeSignatures?: boolean;
    companyName?: string;
    companyLogo?: string;
  }
) {
  if (!documentRef.current) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const { title, documentNumber, documentType, asset, approvals = [], includeSignatures = true, companyName = 'Exelon GridIQ' } = options;

  // Generate approval signature HTML
  const signatureHTML = includeSignatures ? `
    <div class="signatures">
      <h3>Authorization & Approval</h3>
      <table class="signature-table">
        <thead>
          <tr>
            <th>Role</th>
            <th>Name</th>
            <th>Signature</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${(approvals.length > 0 ? approvals : [
            { role: 'Prepared By' },
            { role: 'Reviewed By' },
            { role: 'Approved By' },
            { role: 'Authorized By' },
          ]).map(a => `
            <tr>
              <td>${a.role}</td>
              <td class="signature-cell">${a.name || ''}</td>
              <td class="signature-cell"></td>
              <td class="signature-cell">${a.date || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm 15mm 20mm 15mm;
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 10pt;
          line-height: 1.5;
          color: #1a1a1a;
          background: white;
        }
        
        .document-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #1e3a5f;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-name {
          font-size: 18pt;
          font-weight: 700;
          color: #1e3a5f;
          letter-spacing: -0.5px;
        }
        
        .document-type {
          font-size: 14pt;
          font-weight: 600;
          color: #333;
          margin-top: 4px;
        }
        
        .document-meta {
          text-align: right;
          font-size: 9pt;
        }
        
        .document-number {
          font-size: 12pt;
          font-weight: 700;
          color: #1e3a5f;
          font-family: 'Courier New', monospace;
        }
        
        .meta-row {
          color: #666;
          margin-top: 2px;
        }
        
        .asset-info {
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-left: 4px solid #1e3a5f;
          padding: 12px 15px;
          margin-bottom: 20px;
          border-radius: 0 4px 4px 0;
        }
        
        .asset-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .asset-tag {
          font-family: 'Courier New', monospace;
          font-size: 12pt;
          font-weight: 700;
          color: #1e3a5f;
        }
        
        .asset-name {
          font-size: 11pt;
          font-weight: 600;
          color: #333;
        }
        
        .asset-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          font-size: 9pt;
        }
        
        .asset-detail {
          display: flex;
          gap: 4px;
        }
        
        .asset-label {
          color: #666;
        }
        
        .asset-value {
          color: #333;
          font-weight: 500;
        }
        
        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 8pt;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .status-critical { background: #fee2e2; color: #dc2626; }
        .status-high { background: #fef3c7; color: #d97706; }
        .status-medium { background: #dbeafe; color: #2563eb; }
        .status-low { background: #d1fae5; color: #059669; }
        
        h2 {
          font-size: 11pt;
          color: #1e3a5f;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 5px;
          margin: 15px 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        h3 {
          font-size: 10pt;
          color: #333;
          margin: 12px 0 8px 0;
        }
        
        .content-section {
          margin-bottom: 15px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 9pt;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 8px 10px;
          text-align: left;
          vertical-align: top;
        }
        
        th {
          background: #f0f0f0;
          font-weight: 600;
          color: #333;
        }
        
        tr:nth-child(even) {
          background: #fafafa;
        }
        
        .procedure-step {
          display: flex;
          gap: 12px;
          padding: 10px;
          margin: 5px 0;
          background: #f8f9fa;
          border-radius: 4px;
          border-left: 3px solid #1e3a5f;
        }
        
        .step-number {
          width: 24px;
          height: 24px;
          background: #1e3a5f;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 10pt;
          flex-shrink: 0;
        }
        
        .step-content {
          flex: 1;
        }
        
        .step-critical {
          border-left-color: #dc2626;
          background: #fef2f2;
        }
        
        .step-critical .step-number {
          background: #dc2626;
        }
        
        .safety-box {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-left: 4px solid #f59e0b;
          padding: 12px 15px;
          margin: 10px 0;
          border-radius: 0 4px 4px 0;
        }
        
        .safety-title {
          font-weight: 700;
          color: #92400e;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .warning-icon::before {
          content: "⚠️";
        }
        
        ul, ol {
          margin: 8px 0;
          padding-left: 20px;
        }
        
        li {
          margin: 4px 0;
        }
        
        .checkbox-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 5px 0;
        }
        
        .checkbox {
          width: 14px;
          height: 14px;
          border: 2px solid #666;
          border-radius: 2px;
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        .signatures {
          margin-top: 30px;
          page-break-inside: avoid;
        }
        
        .signature-table {
          width: 100%;
        }
        
        .signature-table th {
          background: #1e3a5f;
          color: white;
          text-align: center;
        }
        
        .signature-cell {
          height: 50px;
          text-align: center;
          border-bottom: 1px solid #333;
        }
        
        .document-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 10px 15mm;
          border-top: 1px solid #ddd;
          font-size: 8pt;
          color: #666;
          display: flex;
          justify-content: space-between;
          background: white;
        }
        
        .page-number::after {
          content: counter(page);
        }
        
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .no-print {
            display: none !important;
          }
        }
        
        /* Hide interactive elements */
        button, [data-action], .cursor-pointer {
          display: none !important;
        }
      </style>
    </head>
    <body>
      <!-- Document Header -->
      <div class="document-header">
        <div class="company-info">
          <div class="company-name">${companyName}</div>
          <div class="document-type">${documentType}</div>
        </div>
        <div class="document-meta">
          <div class="document-number">${documentNumber || 'DRAFT'}</div>
          <div class="meta-row">Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div class="meta-row">Time: ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
      
      <!-- Asset Information -->
      ${asset ? `
        <div class="asset-info">
          <div class="asset-header">
            <div>
              <span class="asset-tag">${asset.tag || 'N/A'}</span>
              <span class="asset-name"> — ${asset.name || 'Unknown Equipment'}</span>
            </div>
            ${asset.criticality ? `<span class="status-badge status-${asset.criticality.toLowerCase()}">${asset.criticality} Criticality</span>` : ''}
          </div>
          <div class="asset-details">
            ${asset.location ? `<div class="asset-detail"><span class="asset-label">Location:</span><span class="asset-value">${asset.location}</span></div>` : ''}
            ${asset.vessel ? `<div class="asset-detail"><span class="asset-label">Vessel:</span><span class="asset-value">${asset.vessel}</span></div>` : ''}
            ${asset.manufacturer ? `<div class="asset-detail"><span class="asset-label">Manufacturer:</span><span class="asset-value">${asset.manufacturer}</span></div>` : ''}
            ${asset.model ? `<div class="asset-detail"><span class="asset-label">Model:</span><span class="asset-value">${asset.model}</span></div>` : ''}
            ${asset.serialNumber ? `<div class="asset-detail"><span class="asset-label">Serial No:</span><span class="asset-value">${asset.serialNumber}</span></div>` : ''}
          </div>
        </div>
      ` : ''}
      
      <!-- Main Content -->
      <div class="content-body">
        ${documentRef.current.innerHTML}
      </div>
      
      <!-- Approval Signatures -->
      ${signatureHTML}
      
      <!-- Footer -->
      <div class="document-footer">
        <span>CONFIDENTIAL - ${companyName}</span>
        <span>Document: ${documentNumber || 'DRAFT'}</span>
        <span>Page <span class="page-number"></span></span>
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}

// ============================================
// Document Actions
// ============================================

function DocumentActions({ 
  onCopy, 
  onExport, 
  onSubmit,
  submitted = false,
  documentRef,
  title,
  documentNumber,
  documentType = 'Document',
  asset,
  approvals,
}: { 
  onCopy?: () => void;
  onExport?: () => void;
  onSubmit?: () => void;
  submitted?: boolean;
  documentRef?: React.RefObject<HTMLDivElement>;
  title?: string;
  documentNumber?: string;
  documentType?: string;
  asset?: AssetDetails;
  approvals?: Array<{ role: string; name?: string; date?: string; status?: 'Pending' | 'Approved' | 'Rejected' }>;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (documentRef?.current) {
      const text = documentRef.current.innerText;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    onCopy?.();
  };

  const handleExport = () => {
    if (documentRef) {
      generateSmartPDF(documentRef, {
        title: title || documentType,
        documentNumber,
        documentType,
        asset,
        approvals,
        includeSignatures: true,
      });
    }
    onExport?.();
  };

  return (
    <div className="flex gap-2 pt-4 mt-4 border-t border-white/10 no-print">
      <button
        onClick={handleCopy}
        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-xs font-medium transition-all"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
      
      <button
        onClick={handleExport}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-sm font-medium transition-all"
      >
        <Printer className="w-4 h-4" />
        Export PDF
      </button>
      
      {onSubmit && (
        <button
          onClick={onSubmit}
          disabled={submitted}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            submitted 
              ? 'bg-emerald-500/40 border-emerald-500/50 text-emerald-300 cursor-default'
              : 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300'
          }`}
        >
          <Check className="w-4 h-4" />
          {submitted ? 'Submitted ✓' : 'Submit'}
        </button>
      )}
    </div>
  );
}

// ============================================
// Work Order Component
// ============================================

export function WorkOrderDocument({ 
  data: initialData, 
  onSubmit,
  onExport,
}: { data: WorkOrderData } & DocumentProps) {
  const [data, setData] = useState(initialData);
  const [submitted, setSubmitted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    asset: true,
    description: true,
    symptoms: true,
    safety: true,
    procedure: true,
    parts: true,
    tools: true,
    approvals: true,
  });
  const documentRef = useRef<HTMLDivElement>(null);

  const updateField = useCallback((field: keyof WorkOrderData, value: unknown) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit?.(data);
  };

  // Normalize arrays
  const symptoms = Array.isArray(data.symptoms) ? data.symptoms : (data.symptoms ? [data.symptoms] : []);
  const safetyReqs = data.safetyRequirements || [];
  const tools = data.requiredTools || [];
  const parts = data.requiredParts || [];
  const steps = data.procedureSteps || [];
  const refs = data.references || [];

  // Build asset from flat fields if not provided
  const asset: AssetDetails = data.asset || {
    tag: data.equipmentTag,
    name: data.equipmentName,
  };

  const priorityColors: Record<string, string> = {
    'Critical': 'border-rose-500/30',
    'High': 'border-amber-500/30',
    'Medium': 'border-blue-500/30',
    'Low': 'border-emerald-500/30',
  };
  const priority = data.priority || 'Medium';
  const borderColor = priorityColors[priority] || priorityColors['Medium'];

  // Permit badges
  const permits = [];
  if (data.lockoutTagoutRequired) permits.push({ label: '🔒 LOTO', color: 'amber' });
  if (data.atexCompliance) permits.push({ label: '⚡ ATEX', color: 'amber' });
  if (data.confinedSpaceEntry) permits.push({ label: '🚧 CSE', color: 'rose' });
  if (data.hotWorkPermit) permits.push({ label: '🔥 Hot Work', color: 'rose' });

  return (
    <div 
      ref={documentRef}
      className={`work-order-document bg-gradient-to-br from-white/[0.03] to-transparent rounded-xl border ${borderColor} overflow-hidden`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-white/40">
                <EditableField 
                  value={data.workOrderNumber || 'WO-DRAFT'} 
                  onChange={(v) => updateField('workOrderNumber', v)}
                  placeholder="WO-DRAFT"
                />
              </span>
              <PriorityBadge 
                priority={priority} 
                onChange={(p) => updateField('priority', p)} 
              />
              <StatusBadge status={data.status} />
              {permits.map((p, i) => (
                <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-medium bg-${p.color}-500/20 text-${p.color}-300 border border-${p.color}-500/30`}>
                  {p.label}
                </span>
              ))}
            </div>
            <h3 className="text-white font-semibold text-lg">
              <EditableField 
                value={data.workType || 'Maintenance Work Order'} 
                onChange={(v) => updateField('workType', v)}
                placeholder="Work Type"
              />
            </h3>
            {(data.createdBy || data.assignedTo) && (
              <p className="text-white/40 text-xs mt-1 flex items-center gap-3">
                {data.createdBy && <span><User className="w-3 h-3 inline mr-1" />Created: {data.createdBy}</span>}
                {data.assignedTo && <span><User className="w-3 h-3 inline mr-1" />Assigned: {data.assignedTo}</span>}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Wrench className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Asset Details Section */}
        {(asset.tag || asset.name) && (
          <div>
            <button 
              onClick={() => toggleSection('asset')}
              className="w-full flex items-center justify-between text-left mb-2"
            >
              <SectionHeader icon={Tag} title="Equipment / Asset" color="blue" />
              {expandedSections.asset ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
            </button>
            {expandedSections.asset && <AssetDetailsCard asset={asset} />}
          </div>
        )}

        {/* Description Section */}
        <div>
          <button 
            onClick={() => toggleSection('description')}
            className="w-full flex items-center justify-between text-left"
          >
            <SectionHeader icon={FileText} title="Description" />
            {expandedSections.description ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
          </button>
          {expandedSections.description && (
            <div className="mt-2 text-white/70 text-sm whitespace-pre-wrap">
              <EditableField 
                value={data.description || ''} 
                onChange={(v) => updateField('description', v)}
                placeholder="Enter description..."
                multiline
                className="w-full min-h-[100px]"
              />
            </div>
          )}
        </div>

        {/* Symptoms Section */}
        {symptoms.length > 0 && (
          <div>
            <button 
              onClick={() => toggleSection('symptoms')}
              className="w-full flex items-center justify-between text-left"
            >
              <SectionHeader icon={AlertTriangle} title="Symptoms / Observations" color="amber" />
              {expandedSections.symptoms ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
            </button>
            {expandedSections.symptoms && (
              <div className="mt-2 space-y-1.5">
                {symptoms.map((symptom, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-amber-400/60 mt-0.5">▸</span>
                    <EditableField 
                      value={symptom} 
                      onChange={(v) => {
                        const newSymptoms = [...symptoms];
                        newSymptoms[i] = v;
                        updateField('symptoms', newSymptoms);
                      }}
                      className="text-white/70"
                    />
                  </div>
                ))}
                <button 
                  onClick={() => updateField('symptoms', [...symptoms, ''])}
                  className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 mt-2 no-print"
                >
                  <Plus className="w-3 h-3" /> Add symptom
                </button>
              </div>
            )}
          </div>
        )}

        {/* Root Cause */}
        {data.rootCause && (
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <SectionHeader title="Root Cause Analysis" color="white" />
            <p className="text-white/70 text-sm mt-1">{data.rootCause}</p>
          </div>
        )}

        {/* Safety Requirements */}
        {safetyReqs.length > 0 && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <button 
              onClick={() => toggleSection('safety')}
              className="w-full flex items-center justify-between text-left"
            >
              <SectionHeader icon={Shield} title="Safety Requirements" color="rose" />
              {expandedSections.safety ? <ChevronUp className="w-4 h-4 text-rose-400/60" /> : <ChevronDown className="w-4 h-4 text-rose-400/60" />}
            </button>
            {expandedSections.safety && (
              <div className="mt-2 space-y-1.5">
                {safetyReqs.map((req, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-rose-400">✓</span>
                    <EditableField 
                      value={req} 
                      onChange={(v) => {
                        const newReqs = [...safetyReqs];
                        newReqs[i] = v;
                        updateField('safetyRequirements', newReqs);
                      }}
                      className="text-rose-300/80"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Procedure Steps */}
        {steps.length > 0 && (
          <div>
            <button 
              onClick={() => toggleSection('procedure')}
              className="w-full flex items-center justify-between text-left"
            >
              <SectionHeader title="Procedure Steps" />
              {expandedSections.procedure ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
            </button>
            {expandedSections.procedure && (
              <div className="mt-2 space-y-2">
                {steps.map((step, i) => {
                  const stepData = typeof step === 'string' ? { step: i + 1, description: step } : step;
                  return (
                    <div 
                      key={i} 
                      className={`flex gap-3 p-2.5 rounded-lg ${stepData.critical ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/[0.03] border border-white/5'}`}
                    >
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full ${stepData.critical ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/60'} flex items-center justify-center text-xs font-medium`}>
                        {stepData.step || i + 1}
                      </span>
                      <div className="flex-1">
                        <EditableField 
                          value={stepData.description} 
                          onChange={(v) => {
                            const newSteps = [...steps];
                            if (typeof newSteps[i] === 'string') {
                              newSteps[i] = v;
                            } else {
                              (newSteps[i] as { description: string }).description = v;
                            }
                            updateField('procedureSteps', newSteps);
                          }}
                          className="text-white/80 text-sm"
                        />
                        {stepData.notes && (
                          <p className="text-white/40 text-xs mt-1">{stepData.notes}</p>
                        )}
                        {stepData.estimatedTime && (
                          <p className="text-white/30 text-[10px] mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {stepData.estimatedTime}
                          </p>
                        )}
                      </div>
                      {stepData.critical && (
                        <span className="text-[9px] text-amber-400 uppercase tracking-wider self-start">Critical</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Required Parts */}
        {parts.length > 0 && (
          <div>
            <button 
              onClick={() => toggleSection('parts')}
              className="w-full flex items-center justify-between text-left"
            >
              <SectionHeader icon={Package} title="Required Parts" />
              {expandedSections.parts ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
            </button>
            {expandedSections.parts && (
              <div className="mt-2 rounded border border-white/10 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-3 py-2 text-left text-white/50 font-medium">Part #</th>
                      <th className="px-3 py-2 text-left text-white/50 font-medium">Description</th>
                      <th className="px-3 py-2 text-right text-white/50 font-medium w-16">Qty</th>
                      <th className="px-3 py-2 text-center text-white/50 font-medium w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {parts.map((part, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="px-3 py-2 text-white/60 font-mono">
                          <EditableField 
                            value={part.partNumber || '-'} 
                            onChange={(v) => {
                              const newParts = [...parts];
                              newParts[i] = { ...newParts[i], partNumber: v };
                              updateField('requiredParts', newParts);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 text-white/70">
                          <EditableField 
                            value={part.description} 
                            onChange={(v) => {
                              const newParts = [...parts];
                              newParts[i] = { ...newParts[i], description: v };
                              updateField('requiredParts', newParts);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-white/60">
                          <EditableField 
                            value={String(part.quantity)} 
                            onChange={(v) => {
                              const newParts = [...parts];
                              newParts[i] = { ...newParts[i], quantity: parseInt(v) || 1 };
                              updateField('requiredParts', newParts);
                            }}
                            className="text-right w-12"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          {part.available !== undefined && (
                            <span className={`text-[10px] ${part.available ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {part.available ? '✓ In Stock' : '✗ Order'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Required Tools */}
        {tools.length > 0 && (
          <div>
            <button 
              onClick={() => toggleSection('tools')}
              className="w-full flex items-center justify-between text-left"
            >
              <SectionHeader icon={Wrench} title="Required Tools" />
              {expandedSections.tools ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
            </button>
            {expandedSections.tools && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tools.map((tool, i) => (
                  <span 
                    key={i} 
                    className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/60 group flex items-center gap-1"
                  >
                    <EditableField 
                      value={tool} 
                      onChange={(v) => {
                        const newTools = [...tools];
                        newTools[i] = v;
                        updateField('requiredTools', newTools);
                      }}
                    />
                    <button 
                      onClick={() => updateField('requiredTools', tools.filter((_, idx) => idx !== i))}
                      className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-rose-400 no-print"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button 
                  onClick={() => updateField('requiredTools', [...tools, 'New Tool'])}
                  className="px-2 py-1 rounded border border-dashed border-white/20 text-xs text-white/40 hover:text-white/60 hover:border-white/40 flex items-center gap-1 no-print"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            )}
          </div>
        )}

        {/* References */}
        {refs.length > 0 && (
          <div>
            <SectionHeader title="References" />
            <div className="flex flex-wrap gap-1.5">
              {refs.map((ref, i) => (
                <span key={i} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/50">
                  📄 {ref.title}{ref.page ? ` p.${ref.page}` : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Fields */}
        <DynamicFieldRenderer data={data as Record<string, unknown>} />

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[10px] text-white/40">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Est. Duration: 
            <EditableField 
              value={data.estimatedDuration || 'TBD'} 
              onChange={(v) => updateField('estimatedDuration', v)}
              className="text-white/40"
            />
          </span>
          {data.actualDuration && (
            <span className="flex items-center gap-1">
              Actual: {data.actualDuration}
            </span>
          )}
        </div>

        {/* Approval Signatures (for screen view) */}
        <ApprovalSignatures approvals={data.approvals} documentType="Work Order" />

        {/* Actions */}
        <DocumentActions 
          documentRef={documentRef}
          title={`Work Order - ${asset.tag || 'Draft'}`}
          documentNumber={data.workOrderNumber}
          documentType="Work Order"
          asset={asset}
          approvals={data.approvals}
          onSubmit={handleSubmit}
          submitted={submitted}
        />
      </div>
    </div>
  );
}

// ============================================
// Checklist Component
// ============================================

export function ChecklistDocument({ 
  data: initialData,
  onSubmit,
}: { data: ChecklistData } & DocumentProps) {
  const [data, setData] = useState(initialData);
  const [submitted, setSubmitted] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  const toggleItem = (index: number) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], checked: !newItems[index].checked };
    setData({ ...data, items: newItems });
  };

  const updateItemValue = (index: number, value: string) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], value };
    setData({ ...data, items: newItems });
  };

  const completedCount = data.items.filter(i => i.checked).length;
  const progress = data.items.length > 0 ? (completedCount / data.items.length) * 100 : 0;

  // Group items by category if they have categories
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof data.items> = {};
    data.items.forEach(item => {
      const category = item.category || 'General';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });
    return groups;
  }, [data.items]);

  return (
    <div 
      ref={documentRef}
      className="checklist-document bg-gradient-to-br from-white/[0.03] to-transparent rounded-xl border border-white/10 overflow-hidden"
    >
      <div className="p-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-semibold">{data.title || 'Checklist'}</h3>
            {data.description && <p className="text-white/50 text-sm mt-1">{data.description}</p>}
            <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
              {data.checklistType && <span>Type: {data.checklistType}</span>}
              {data.frequency && <span>Frequency: {data.frequency}</span>}
            </div>
          </div>
          <StatusBadge status={progress === 100 ? 'Completed' : 'In Progress'} />
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-white/50 mb-1">
            <span>{completedCount} of {data.items.length} completed</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Asset Details if available */}
      {data.asset && (
        <div className="p-4 border-b border-white/10">
          <AssetDetailsCard asset={data.asset} editable={false} />
        </div>
      )}

      <div className="p-4 space-y-4">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category}>
            {Object.keys(groupedItems).length > 1 && (
              <h4 className="text-xs text-white/50 uppercase tracking-wider mb-2">{category}</h4>
            )}
            <div className="space-y-2">
              {items.map((item, i) => {
                const globalIndex = data.items.findIndex(it => it === item);
                const isHigh = item.priority?.toLowerCase() === 'high';
                const hasValue = item.unit !== undefined || item.min !== undefined || item.max !== undefined;
                
                return (
                  <div 
                    key={item.id || i}
                    className={`p-3 rounded-xl transition-all ${
                      item.checked 
                        ? 'bg-emerald-500/10 border border-emerald-500/20 opacity-70' 
                        : isHigh 
                          ? 'bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40'
                          : 'bg-white/[0.03] border border-white/8 hover:border-white/20'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div 
                        onClick={() => toggleItem(globalIndex)}
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                          item.checked 
                            ? 'bg-emerald-500 border-emerald-500' 
                            : 'border-white/30 hover:border-white/50'
                        }`}
                      >
                        {item.checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${item.checked ? 'line-through text-white/50' : 'text-white/90'}`}>
                          {item.text}
                        </p>
                        
                        {/* Value input for measurements */}
                        {hasValue && (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              value={item.value || ''}
                              onChange={(e) => updateItemValue(globalIndex, e.target.value)}
                              placeholder={`Enter value${item.unit ? ` (${item.unit})` : ''}`}
                              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white/80 w-24 outline-none focus:border-blue-400"
                            />
                            {item.unit && <span className="text-white/40 text-xs">{item.unit}</span>}
                            {(item.min !== undefined || item.max !== undefined) && (
                              <span className="text-white/30 text-xs">
                                (Range: {item.min ?? '—'} - {item.max ?? '—'})
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Notes */}
                        {item.notes && (
                          <p className="text-white/40 text-xs mt-1">{item.notes}</p>
                        )}
                        
                        {item.reference && (
                          <p className="text-white/40 text-xs mt-1">Ref: {item.reference}</p>
                        )}
                      </div>
                      {isHigh && !item.checked && (
                        <span className="text-[9px] text-rose-400 uppercase tracking-wider">High Priority</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Dynamic Fields */}
        <DynamicFieldRenderer data={data as Record<string, unknown>} />

        {/* Approval Signatures */}
        <ApprovalSignatures approvals={data.approvals} documentType="Checklist" />

        <DocumentActions 
          documentRef={documentRef}
          title={data.title || 'Checklist'}
          documentType="Inspection Checklist"
          asset={data.asset}
          approvals={data.approvals}
          onSubmit={() => { setSubmitted(true); onSubmit?.(data); }}
          submitted={submitted}
        />
      </div>
    </div>
  );
}

// ============================================
// Export all components
// ============================================

export { 
  EditableField, 
  PriorityBadge, 
  StatusBadge,
  SectionHeader, 
  DocumentActions,
  AssetDetailsCard,
  ApprovalSignatures,
  DynamicFieldRenderer,
  generateSmartPDF,
};

export type { WorkOrderData, LOTOData, ChecklistData, AssetDetails };
