// @ts-nocheck - Legacy smart document with dynamic types
'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  FileText, Check, Copy, Printer, ChevronDown, ChevronUp, 
  Plus, Edit3, AlertTriangle, LucideIcon
} from 'lucide-react';

// ============================================
// TRULY DYNAMIC - No hardcoded mappings
// Infers everything from the data itself
// ============================================

// Infer icon from VALUE and KEY patterns (not a lookup table!)
function inferIcon(key: string, value: unknown): string {
  const k = key.toLowerCase();
  const v = String(value).toLowerCase();
  
  // Infer from VALUE patterns first (smarter)
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value) || /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(value)) return '📅'; // Date pattern
    if (/^\d+h$|hour|minute|duration/i.test(value)) return '⏱️'; // Time duration
    if (/^[A-Z]{2,4}-\d+/.test(value)) return '🏷️'; // Tag/ID pattern like "WO-123" or "P-101"
    if (/^[\w.-]+@[\w.-]+\.\w+$/.test(value)) return '📧'; // Email
    if (/^\+?\d{10,}$/.test(value.replace(/[\s-]/g, ''))) return '📞'; // Phone
    if (/^https?:\/\//.test(value)) return '🔗'; // URL
    if (/deck|floor|level|room|area|zone/i.test(v)) return '📍'; // Location-like value
    if (/pump|motor|valve|compressor|generator|engine/i.test(v)) return '⚙️'; // Equipment
    if (/warning|danger|caution|critical|hazard/i.test(v)) return '⚠️'; // Warning
    if (/complete|done|finish|success/i.test(v)) return '✅'; // Success
    if (/fail|error|issue|problem/i.test(v)) return '❌'; // Failure
  }
  
  // Infer from KEY patterns (fallback)
  if (/date|time|schedule|when/i.test(k)) return '📅';
  if (/duration|hour|minute|eta|estimate/i.test(k)) return '⏱️';
  if (/location|place|where|site|area|zone|deck|room/i.test(k)) return '📍';
  if (/user|person|name|assign|author|by|who|tech|operator|super/i.test(k)) return '👤';
  if (/equip|asset|machine|device|tag|serial/i.test(k)) return '🏷️';
  if (/manufact|vendor|supplier|brand|make/i.test(k)) return '🏭';
  if (/model|type|version|spec/i.test(k)) return '📋';
  if (/priority|urgent|critical|importance/i.test(k)) return '🔥';
  if (/status|state|condition/i.test(k)) return '📊';
  if (/safe|hazard|warn|danger|risk|ppe/i.test(k)) return '🛡️';
  if (/lock|loto|isolat/i.test(k)) return '🔒';
  if (/temp|heat|thermal/i.test(k)) return '🌡️';
  if (/pressure|psi|bar/i.test(k)) return '📈';
  if (/power|volt|current|electric|energy/i.test(k)) return '⚡';
  if (/flow|rate|speed/i.test(k)) return '💨';
  if (/cost|price|amount|\$/i.test(k)) return '💰';
  if (/part|material|component|item/i.test(k)) return '📦';
  if (/tool|instrument/i.test(k)) return '🔧';
  if (/step|procedure|instruction|action/i.test(k)) return '📝';
  if (/note|comment|remark|description/i.test(k)) return '💬';
  if (/photo|image|picture|attach/i.test(k)) return '📷';
  if (/document|file|report/i.test(k)) return '📄';
  if (/vessel|ship|boat|marine/i.test(k)) return '🚢';
  if (/id|number|code|ref/i.test(k)) return '#️⃣';
  
  // Infer from value TYPE
  if (typeof value === 'boolean') return value ? '✅' : '❌';
  if (typeof value === 'number') return '🔢';
  
  return '•'; // Minimal fallback
}

// Infer display label from key (smart camelCase/snake_case parsing)
function inferLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

// Infer priority level from ANY value (not just known strings)
function inferPriority(value: unknown): { level: number; color: string; bg: string; border: string } | null {
  const v = String(value).toLowerCase();
  
  // Score-based priority detection
  const criticalPatterns = /critical|emergency|p1|urgent|immediate|severe|catastrophic/;
  const highPatterns = /high|important|p2|major|significant/;
  const mediumPatterns = /medium|moderate|normal|p3|standard|routine/;
  const lowPatterns = /low|minor|p4|p5|trivial|cosmetic/;
  
  if (criticalPatterns.test(v)) return { level: 4, color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' };
  if (highPatterns.test(v)) return { level: 3, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' };
  if (mediumPatterns.test(v)) return { level: 2, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' };
  if (lowPatterns.test(v)) return { level: 1, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' };
  
  return null;
}

// Infer if a value looks like a status/state
function inferStatus(value: unknown): { icon: string; color: string } | null {
  const v = String(value).toLowerCase();
  
  if (/complete|done|finish|closed|resolved|success|pass/i.test(v)) 
    return { icon: '✓', color: 'text-emerald-400' };
  if (/progress|ongoing|active|running|open|pending|wait/i.test(v)) 
    return { icon: '◐', color: 'text-blue-400' };
  if (/fail|error|reject|block|stop|cancel/i.test(v)) 
    return { icon: '✗', color: 'text-rose-400' };
  if (/hold|pause|suspend|defer/i.test(v)) 
    return { icon: '◯', color: 'text-amber-400' };
  if (/draft|new|initial|start/i.test(v)) 
    return { icon: '○', color: 'text-white/50' };
  
  return null;
}

// Infer what TYPE of content this is based on structure
function inferContentType(key: string, value: unknown): 
  'priority' | 'status' | 'boolean' | 'date' | 'duration' | 'tag' | 'person' | 
  'location' | 'measurement' | 'money' | 'longtext' | 'simple' | 'array' | 'table' | 'object' {
  
  const k = key.toLowerCase();
  
  // Check value type first
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object' && Object.keys(value[0] as object).length > 2) {
      return 'table';
    }
    return 'array';
  }
  
  if (typeof value === 'object' && value !== null) return 'object';
  if (typeof value === 'boolean') return 'boolean';
  
  const v = String(value);
  
  // Check value patterns
  if (/priority|urgency|importance/i.test(k) || inferPriority(value)) return 'priority';
  if (/status|state|condition/i.test(k) || inferStatus(value)) return 'status';
  if (/^\d{4}-\d{2}-\d{2}/.test(v) || /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(v)) return 'date';
  if (/^\d+\s*(h|hr|hour|m|min|minute|d|day)/i.test(v)) return 'duration';
  if (/^[A-Z]{1,5}-\d+/.test(v)) return 'tag';
  if (/assign|author|by|tech|operator|super|person|name/i.test(k) && !v.includes(' ')) return 'person';
  if (/location|place|site|area|zone|deck|room/i.test(k)) return 'location';
  if (/^\$[\d,]+|^\d+\.\d{2}$|cost|price|amount/i.test(k) || /^\$/.test(v)) return 'money';
  if (v.length > 150 || v.includes('\n')) return 'longtext';
  
  return 'simple';
}

// Infer document type from data structure and content
function inferDocumentType(data: Record<string, unknown>): {
  type: string;
  label: string;
  signatures: Array<{ role: string; required: boolean }>;
} {
  const keys = Object.keys(data).map(k => k.toLowerCase());
  const values = Object.values(data).map(v => String(v).toLowerCase()).join(' ');
  
  // LOTO detection
  if (keys.some(k => /loto|lockout|tagout|isolation/i.test(k)) || 
      values.includes('lockout') || values.includes('tagout') || values.includes('isolation point')) {
    return {
      type: 'loto',
      label: 'Lockout/Tagout Procedure',
      signatures: [
        { role: 'Authorized Person (Isolation)', required: true },
        { role: 'Affected Person', required: true },
        { role: 'Supervisor Verification', required: true },
        { role: 'Reinstatement Authorization', required: true },
      ]
    };
  }
  
  // Permit detection
  if (keys.some(k => /permit|authorization|clearance/i.test(k)) ||
      values.includes('hot work') || values.includes('confined space') || values.includes('excavation')) {
    return {
      type: 'permit',
      label: 'Work Permit',
      signatures: [
        { role: 'Permit Applicant', required: true },
        { role: 'Issuing Authority', required: true },
        { role: 'Area Authority', required: true },
        { role: 'Safety Officer', required: true },
        { role: 'Permit Surrender', required: false },
      ]
    };
  }
  
  // Checklist/Inspection detection
  if ((keys.some(k => /checklist|inspection|audit|check/i.test(k)) || 
       (data.items && Array.isArray(data.items)))) {
    return {
      type: 'checklist',
      label: 'Inspection Checklist',
      signatures: [
        { role: 'Inspector', required: true },
        { role: 'Verified By', required: false },
      ]
    };
  }
  
  // Work Order detection (most common)
  if (keys.some(k => /work.*order|wo|maintenance|repair|procedure|step/i.test(k)) ||
      keys.some(k => /equipment|asset/i.test(k))) {
    return {
      type: 'work_order',
      label: 'Maintenance Work Order',
      signatures: [
        { role: 'Technician', required: true },
        { role: 'Supervisor', required: true },
        { role: 'Quality Check', required: false },
      ]
    };
  }
  
  // Report detection
  if (keys.some(k => /report|analysis|finding|summary|conclusion/i.test(k))) {
    return {
      type: 'report',
      label: 'Technical Report',
      signatures: [
        { role: 'Report Author', required: true },
        { role: 'Reviewed By', required: true },
        { role: 'Approved By', required: false },
      ]
    };
  }
  
  // Generic fallback - but still with signatures!
  return {
    type: 'document',
    label: 'Document',
    signatures: [
      { role: 'Prepared By', required: true },
      { role: 'Approved By', required: false },
    ]
  };
}

// ============================================
// Editable Field Component
// ============================================

function EditableField({ 
  value, 
  onChange, 
  placeholder = 'Click to edit',
  className = '',
  multiline = false,
}: {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  if (!onChange) {
    return <span className={className}>{value || placeholder}</span>;
  }

  const handleBlur = () => {
    setIsEditing(false);
    onChange(editValue);
  };

  if (isEditing) {
    const Component = multiline ? 'textarea' : 'input';
    return (
      <Component
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !multiline) handleBlur();
          if (e.key === 'Escape') { setEditValue(value); setIsEditing(false); }
        }}
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

// ============================================
// Smart Field Renderer - Infers how to display each field
// ============================================

function SmartField({ 
  fieldKey, 
  value, 
  onChange 
}: { 
  fieldKey: string; 
  value: unknown; 
  onChange?: (v: unknown) => void;
}) {
  const contentType = inferContentType(fieldKey, value);
  const icon = inferIcon(fieldKey, value);
  const label = inferLabel(fieldKey);
  
  // Priority badge
  if (contentType === 'priority') {
    const priority = inferPriority(value);
    return (
      <div className="flex items-center gap-2 text-sm">
        <span>{icon}</span>
        <span className="text-white/50">{label}:</span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${priority?.bg} ${priority?.color} ${priority?.border} border`}>
          {String(value).toUpperCase()}
        </span>
      </div>
    );
  }
  
  // Status with icon
  if (contentType === 'status') {
    const status = inferStatus(value);
    return (
      <div className="flex items-center gap-2 text-sm">
        <span>{icon}</span>
        <span className="text-white/50">{label}:</span>
        <span className={`flex items-center gap-1 ${status?.color}`}>
          <span>{status?.icon}</span>
          {String(value)}
        </span>
      </div>
    );
  }
  
  // Boolean toggle
  if (contentType === 'boolean') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span>{icon}</span>
        <span className="text-white/50">{label}:</span>
        <span className={value ? 'text-emerald-400' : 'text-white/40'}>
          {value ? '✓ Yes' : '✗ No'}
        </span>
      </div>
    );
  }
  
  // Tag/ID - monospace styling
  if (contentType === 'tag') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span>{icon}</span>
        <span className="text-white/50">{label}:</span>
        <code className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-mono text-xs">
          {String(value)}
        </code>
      </div>
    );
  }
  
  // Default field rendering
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="flex-shrink-0">{icon}</span>
      <span className="text-white/50">{label}:</span>
      {onChange ? (
        <EditableField 
          value={String(value)} 
          onChange={(v) => onChange(v)}
          className="text-white/80"
        />
      ) : (
        <span className="text-white/80">{String(value)}</span>
      )}
    </div>
  );
}

// ============================================
// Smart Array Renderer - Auto-detects checklist vs steps
// ============================================

function SmartArray({ 
  fieldKey, 
  items, 
  onChange 
}: { 
  fieldKey: string; 
  items: unknown[]; 
  onChange?: (items: unknown[]) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  
  const label = inferLabel(fieldKey);
  const k = fieldKey.toLowerCase();
  
  // Infer if this should be a checklist (checkable items)
  const isChecklist = /check|verify|confirm|require|safe|ppe|hazard|item/i.test(k);
  
  // Infer if these are numbered steps
  const isSteps = /step|procedure|instruction|action|process|phase/i.test(k);
  
  // Infer if this is safety-related (special styling)
  const isSafety = /safe|hazard|warn|danger|ppe|risk/i.test(k);

  const toggleCheck = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) newChecked.delete(index);
    else newChecked.add(index);
    setCheckedItems(newChecked);
  };

  if (!items || items.length === 0) return null;

  return (
    <div className={`space-y-2 ${isSafety ? 'p-3 rounded-lg bg-amber-500/10 border border-amber-500/20' : ''}`}>
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left group"
      >
        <h4 className={`text-[10px] uppercase tracking-wider flex items-center gap-1.5 ${isSafety ? 'text-amber-400' : 'text-white/40'}`}>
          {isSafety ? '⚠️' : isSteps ? '📋' : isChecklist ? '☑️' : '•'} {label}
          <span className="text-white/30">({items.length})</span>
        </h4>
        {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
      </button>

      {expanded && (
        <div className="space-y-1.5">
          {items.map((item, i) => {
            // Handle object items (rich steps)
            if (typeof item === 'object' && item !== null) {
              const obj = item as Record<string, unknown>;
              
              // Find the main text field (could be named anything!)
              const textKey = Object.keys(obj).find(k => 
                /desc|text|action|content|title|name|instruction|task/i.test(k)
              ) || Object.keys(obj).find(k => typeof obj[k] === 'string' && String(obj[k]).length > 10);
              
              const desc = textKey ? obj[textKey] : JSON.stringify(obj);
              const stepNum = obj.step || obj.number || obj.order || i + 1;
              const notes = obj.notes || obj.note || obj.comment || obj.remark;
              const verification = obj.verification || obj.verify || obj.check;
              const isCritical = obj.critical || obj.important || obj.warning;
              const estTime = obj.time || obj.duration || obj.estimate;
              
              return (
                <div 
                  key={i}
                  className={`flex gap-3 p-3 rounded-lg transition-all ${
                    isChecklist && checkedItems.has(i)
                      ? 'bg-emerald-500/10 border border-emerald-500/20 opacity-60'
                      : isCritical 
                        ? 'bg-rose-500/10 border border-rose-500/20' 
                        : 'bg-white/[0.03] border border-white/8 hover:border-white/15'
                  }`}
                  onClick={isChecklist ? () => toggleCheck(i) : undefined}
                  style={{ cursor: isChecklist ? 'pointer' : 'default' }}
                >
                  {isChecklist ? (
                    <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      checkedItems.has(i) ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'
                    }`}>
                      {checkedItems.has(i) && <Check className="w-3 h-3 text-white" />}
                    </div>
                  ) : isSteps ? (
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isCritical ? 'bg-rose-500/30 text-rose-400' : 'bg-white/10 text-white/60'
                    }`}>
                      {stepNum}
                    </span>
                  ) : (
                    <span className="text-white/40">▸</span>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${checkedItems.has(i) ? 'line-through text-white/50' : 'text-white/80'}`}>
                      {String(desc)}
                    </p>
                    {notes && <p className="text-white/40 text-xs mt-1">📝 {String(notes)}</p>}
                    {verification && <p className="text-emerald-400/70 text-xs mt-1">✓ Verify: {String(verification)}</p>}
                    {estTime && <p className="text-white/30 text-xs mt-1">⏱️ {String(estTime)}</p>}
                  </div>
                  
                  {isCritical && (
                    <span className="text-[9px] text-rose-400 uppercase tracking-wider self-start">⚠ Critical</span>
                  )}
                </div>
              );
            }
            
            // Handle simple string items
            return (
              <div 
                key={i}
                className={`flex items-start gap-2 p-2 rounded-lg transition-all ${
                  isChecklist && checkedItems.has(i)
                    ? 'bg-emerald-500/10 opacity-60'
                    : 'bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
                onClick={isChecklist ? () => toggleCheck(i) : undefined}
                style={{ cursor: isChecklist ? 'pointer' : 'default' }}
              >
                {isChecklist ? (
                  <div className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 ${
                    checkedItems.has(i) ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'
                  }`}>
                    {checkedItems.has(i) && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                ) : isSteps ? (
                  <span className="text-white/40 text-xs w-5 text-right">{i + 1}.</span>
                ) : (
                  <span className={isSafety ? 'text-amber-400' : 'text-white/40'}>
                    {isSafety ? '⚠' : '▸'}
                  </span>
                )}
                <span className={`text-sm ${checkedItems.has(i) ? 'line-through text-white/50' : isSafety ? 'text-amber-200/80' : 'text-white/70'}`}>
                  {String(item)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// Smart Table Renderer - For array of objects
// ============================================

function SmartTable({ 
  fieldKey, 
  items, 
}: { 
  fieldKey: string; 
  items: Record<string, unknown>[]; 
}) {
  if (!items || items.length === 0) return null;
  
  const label = inferLabel(fieldKey);
  
  // Extract columns from all items (union of all keys)
  const allKeys = new Set<string>();
  items.forEach(item => Object.keys(item).forEach(k => {
    if (!k.startsWith('_') && k !== 'id') allKeys.add(k);
  }));
  const columns = Array.from(allKeys);

  return (
    <div className="space-y-2">
      <h4 className="text-[10px] uppercase tracking-wider text-white/40 flex items-center gap-1.5">
        📦 {label}
      </h4>
      <div className="rounded-lg border border-white/10 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-white/5">
            <tr>
              {columns.map(col => (
                <th key={col} className="px-3 py-2 text-left text-white/50 font-medium">
                  {inferLabel(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-white/[0.02]">
                {columns.map(col => {
                  const val = item[col];
                  const isBoolean = typeof val === 'boolean';
                  return (
                    <td key={col} className="px-3 py-2 text-white/70">
                      {isBoolean ? (val ? '✓' : '—') : String(val ?? '—')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// PDF Generator - Smart signatures based on inferred type
// ============================================

function generatePDF(
  data: Record<string, unknown>,
  docInfo: ReturnType<typeof inferDocumentType>,
  title: string
): void {
  const now = new Date();
  
  // Build fields HTML dynamically
  const simpleFields = Object.entries(data)
    .filter(([, v]) => !Array.isArray(v) && typeof v !== 'object' && v !== null)
    .map(([k, v]) => {
      const icon = inferIcon(k, v);
      const label = inferLabel(k);
      let displayVal = String(v);
      if (typeof v === 'boolean') displayVal = v ? '☑ Yes' : '☐ No';
      return `<div class="field">${icon} <span class="label">${label}:</span> <span class="value">${displayVal}</span></div>`;
    })
    .join('');
  
  // Build arrays HTML
  const arrayFields = Object.entries(data)
    .filter(([, v]) => Array.isArray(v))
    .map(([k, v]) => {
      const label = inferLabel(k);
      const items = v as unknown[];
      const isSafety = /safe|hazard|warn|ppe/i.test(k);
      const isSteps = /step|procedure|instruction/i.test(k);
      
      const itemsHtml = items.map((item, i) => {
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>;
          const textKey = Object.keys(obj).find(key => /desc|text|action|content/i.test(key)) || Object.keys(obj)[0];
          const desc = textKey ? obj[textKey] : JSON.stringify(obj);
          const verification = obj.verification || obj.verify;
          
          return `
            <div class="step">
              <span class="step-num">${obj.step || i + 1}</span>
              <div class="step-content">
                <p>${String(desc)}</p>
                ${verification ? `<p class="verify">☐ Verify: ${verification}</p>` : ''}
              </div>
            </div>
          `;
        }
        return `<li>${String(item)}</li>`;
      }).join('');
      
      const isList = items.length > 0 && typeof items[0] !== 'object';
      
      return `
        <div class="section ${isSafety ? 'safety' : ''}">
          <h3>${isSafety ? '⚠️ ' : ''}${label}</h3>
          ${isList ? `<ul>${itemsHtml}</ul>` : `<div class="steps">${itemsHtml}</div>`}
        </div>
      `;
    })
    .join('');
  
  // Build signature blocks based on inferred document type
  const signatureHtml = docInfo.signatures.map(sig => `
    <div class="sig-block ${sig.required ? 'required' : ''}">
      <div class="sig-title">${sig.role}${sig.required ? ' *' : ''}</div>
      <div class="sig-line"></div>
      <div class="sig-fields">
        <span>Name: _________________</span>
        <span>Date: ____/____/____</span>
        <span>Time: ____:____</span>
      </div>
    </div>
  `).join('');
  
  // Find document number from data
  const docNum = data.workOrderNumber || data.work_order_number || 
                 data.documentNumber || data.document_number ||
                 data.procedureNumber || data.permitNumber || 'DRAFT';
  
  // Find priority
  const priority = data.priority || data.Priority;
  const priorityClass = priority ? `priority-${String(priority).toLowerCase()}` : '';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        * { box-sizing: border-box; }
        body { font-family: -apple-system, system-ui, sans-serif; font-size: 10pt; line-height: 1.5; color: #1a1a1a; margin: 0; padding: 0; }
        
        .header { display: flex; justify-content: space-between; border-bottom: 2pt solid #1e3a5f; padding-bottom: 10pt; margin-bottom: 15pt; }
        .header h1 { font-size: 16pt; margin: 0; color: #1e3a5f; }
        .header .subtitle { font-size: 9pt; color: #666; }
        .header .meta { text-align: right; font-size: 9pt; }
        .header .doc-num { font-size: 12pt; font-weight: bold; font-family: monospace; }
        
        .priority-badge { display: inline-block; padding: 2pt 8pt; border-radius: 3pt; font-size: 8pt; font-weight: 600; margin-top: 4pt; }
        .priority-critical, .priority-emergency { background: #fee2e2; color: #dc2626; }
        .priority-high, .priority-urgent { background: #fef3c7; color: #d97706; }
        .priority-medium, .priority-normal { background: #dbeafe; color: #2563eb; }
        .priority-low { background: #d1fae5; color: #059669; }
        
        .fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5pt 15pt; padding: 10pt; background: #f8f9fa; border-radius: 4pt; margin-bottom: 15pt; }
        .field { font-size: 9pt; }
        .field .label { color: #666; }
        .field .value { color: #111; font-weight: 500; }
        
        .section { margin-bottom: 15pt; }
        .section h3 { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.5pt; color: #444; border-bottom: 1pt solid #ddd; padding-bottom: 4pt; margin: 0 0 8pt 0; }
        .section.safety { background: #fef3c7; border-left: 3pt solid #f59e0b; padding: 10pt; border-radius: 0 4pt 4pt 0; }
        .section.safety h3 { border-bottom-color: #f59e0b; color: #92400e; }
        
        .steps { margin: 0; }
        .step { display: flex; gap: 10pt; padding: 8pt; margin-bottom: 5pt; background: #f9f9f9; border: 1pt solid #eee; border-radius: 3pt; page-break-inside: avoid; }
        .step-num { width: 20pt; height: 20pt; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 9pt; flex-shrink: 0; }
        .step-content { flex: 1; }
        .step-content p { margin: 0; }
        .verify { color: #059669; font-size: 8pt; margin-top: 3pt !important; }
        
        ul { margin: 0; padding-left: 15pt; }
        li { margin: 2pt 0; font-size: 9pt; }
        
        .signatures { margin-top: 25pt; border-top: 1pt solid #ccc; padding-top: 15pt; page-break-inside: avoid; }
        .signatures h3 { font-size: 10pt; text-transform: uppercase; margin: 0 0 12pt 0; color: #333; }
        .sig-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12pt; }
        .sig-block { padding: 10pt; border: 1pt solid #ddd; border-radius: 4pt; }
        .sig-block.required { border-color: #333; border-width: 1.5pt; }
        .sig-title { font-size: 9pt; font-weight: 600; color: #333; margin-bottom: 6pt; }
        .sig-line { height: 35pt; border-bottom: 1pt solid #666; margin-bottom: 6pt; }
        .sig-fields { display: flex; justify-content: space-between; font-size: 8pt; color: #666; }
        
        .footer { margin-top: 20pt; padding-top: 8pt; border-top: 1pt solid #ddd; font-size: 8pt; color: #888; display: flex; justify-content: space-between; }
        
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>${title}</h1>
          <div class="subtitle">${docInfo.label}</div>
        </div>
        <div class="meta">
          <div class="doc-num">${docNum}</div>
          ${priority ? `<div class="priority-badge ${priorityClass}">${String(priority).toUpperCase()}</div>` : ''}
          <div style="margin-top:5pt">Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}</div>
        </div>
      </div>
      
      <div class="fields">${simpleFields}</div>
      
      ${arrayFields}
      
      <div class="signatures">
        <h3>Authorization & Sign-off</h3>
        <div class="sig-grid">${signatureHtml}</div>
        <div style="font-size:8pt;color:#666;margin-top:8pt">* Required signatures</div>
      </div>
      
      <div class="footer">
        <span>Document: ${docNum}</span>
        <span>Page 1</span>
      </div>
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  }
}

// ============================================
// Main Smart Document Component
// ============================================

export interface SmartDocumentProps {
  data: Record<string, unknown>;
  title?: string;
  onSubmit?: (data: Record<string, unknown>) => void;
  onExport?: (data: Record<string, unknown>) => void;
  readOnly?: boolean;
}

export function SmartDocument({ 
  data: initialData, 
  title,
  onSubmit,
  onExport,
  readOnly = false,
}: SmartDocumentProps) {
  const [data, setData] = useState(initialData);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);
  
  // INFER everything from data
  const docInfo = useMemo(() => inferDocumentType(data), [data]);
  
  // Infer title from data if not provided
  const docTitle = useMemo(() => {
    if (title) return title;
    // Try to find a title-like field
    const titleKeys = ['title', 'name', 'equipmentName', 'equipment_name', 'subject', 'workType', 'work_type'];
    for (const key of titleKeys) {
      if (data[key] && typeof data[key] === 'string') return data[key] as string;
    }
    return docInfo.label;
  }, [title, data, docInfo]);

  // Categorize fields based on their inferred types
  const categorizedFields = useMemo(() => {
    const simple: Array<[string, unknown]> = [];
    const arrays: Array<[string, unknown[]]> = [];
    const tables: Array<[string, Record<string, unknown>[]]> = [];
    const longText: Array<[string, string]> = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith('_') || key === 'id' || key === 'responseType') return;
      
      const contentType = inferContentType(key, value);
      
      if (contentType === 'table') {
        tables.push([key, value as Record<string, unknown>[]]);
      } else if (contentType === 'array') {
        arrays.push([key, value as unknown[]]);
      } else if (contentType === 'longtext') {
        longText.push([key, value as string]);
      } else if (contentType !== 'object') {
        simple.push([key, value]);
      }
    });
    
    return { simple, arrays, tables, longText };
  }, [data]);

  const updateField = useCallback((key: string, value: unknown) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCopy = () => {
    if (documentRef.current) {
      navigator.clipboard.writeText(documentRef.current.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = () => {
    generatePDF(data, docInfo, docTitle);
    onExport?.(data);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit?.(data);
  };

  // Infer border color from priority
  const priority = inferPriority(data.priority || data.Priority);
  const borderClass = priority?.border || 'border-white/10';

  return (
    <div 
      ref={documentRef}
      className={`smart-document bg-gradient-to-br from-white/[0.03] to-transparent rounded-xl border ${borderClass} overflow-hidden`}
    >
      {/* Header - Built from inferred data */}
      <div className="p-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {/* Document number - find it dynamically */}
              {Object.entries(data).find(([k]) => /number|id|code|ref/i.test(k) && !/phone/i.test(k)) && (
                <code className="text-[10px] font-mono text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                  {String(Object.entries(data).find(([k]) => /number|id|code|ref/i.test(k) && !/phone/i.test(k))?.[1] || 'DRAFT')}
                </code>
              )}
              
              {/* Priority badge */}
              {priority && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${priority.bg} ${priority.color} border ${priority.border}`}>
                  {String(data.priority || data.Priority).toUpperCase()}
                </span>
              )}
              
              {/* Auto-detect special flags */}
              {Object.entries(data).map(([k, v]) => {
                if (typeof v === 'boolean' && v && /loto|lockout|atex|confine|permit|hot.*work/i.test(k)) {
                  return (
                    <span key={k} className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {/loto|lockout/i.test(k) ? '🔒 LOTO' : 
                       /atex/i.test(k) ? '⚡ ATEX' : 
                       /confine/i.test(k) ? '🚧 CSE' : 
                       '🔥 Permit'}
                    </span>
                  );
                }
                return null;
              })}
            </div>
            
            <h3 className="text-white font-semibold text-lg">{docTitle}</h3>
            <p className="text-white/40 text-xs mt-0.5">{docInfo.label}</p>
          </div>
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white/60" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Simple Fields Grid */}
        {categorizedFields.simple.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {categorizedFields.simple.map(([key, value]) => (
              <SmartField 
                key={key}
                fieldKey={key}
                value={value}
                onChange={readOnly ? undefined : (v) => updateField(key, v)}
              />
            ))}
          </div>
        )}

        {/* Long Text Fields */}
        {categorizedFields.longText.map(([key, value]) => (
          <div key={key} className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-white/40">
              {inferIcon(key, value)} {inferLabel(key)}
            </h4>
            <div className="text-white/70 text-sm whitespace-pre-wrap bg-white/[0.02] p-3 rounded-lg border border-white/5">
              {readOnly ? value : (
                <EditableField 
                  value={value} 
                  onChange={(v) => updateField(key, v)}
                  multiline
                  className="w-full min-h-[80px]"
                />
              )}
            </div>
          </div>
        ))}

        {/* Array Sections */}
        {categorizedFields.arrays.map(([key, items]) => (
          <SmartArray 
            key={key}
            fieldKey={key}
            items={items}
            onChange={readOnly ? undefined : (newItems) => updateField(key, newItems)}
          />
        ))}

        {/* Table Sections */}
        {categorizedFields.tables.map(([key, items]) => (
          <SmartTable 
            key={key}
            fieldKey={key}
            items={items}
          />
        ))}

        {/* Actions */}
        <div className="flex gap-2 pt-4 mt-4 border-t border-white/10">
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
              onClick={handleSubmit}
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
      </div>
    </div>
  );
}

export default SmartDocument;
