// @ts-nocheck - Legacy A2UI form, not used in main rendering path (DynamicRenderer is used instead)
'use client';

import { useState, useRef, useMemo } from 'react';
import { 
  Printer, 
  Save, 
  AlertTriangle, 
  Shield, 
  Lock, 
  Wrench,
  CheckCircle2,
  Clock,
  User,
  Package,
  ClipboardList,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';
import type { WorkOrderSchema } from './types';

interface WorkOrderFormProps {
  initialData: WorkOrderSchema;
  onSave?: (data: WorkOrderSchema) => void;
  onSubmit?: (data: WorkOrderSchema) => void;
  onPrint?: () => void;
}

// Priority colors - handle various formats from API
const priorityConfig: Record<string, { bg: string; border: string; text: string; label: string }> = {
  // Standard priorities
  critical: { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-400', label: 'CRITICAL' },
  urgent: { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-400', label: 'URGENT' },
  high: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', label: 'HIGH' },
  medium: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', label: 'MEDIUM' },
  normal: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', label: 'NORMAL' },
  low: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', label: 'LOW' },
};

// Default priority for unknown values
const defaultPriority = { bg: 'bg-white/10', border: 'border-white/20', text: 'text-white/60', label: 'PENDING' };

// Default safety object to prevent undefined errors
const defaultSafety = {
  lotoRequired: false,
  atexRequired: false,
  atexZone: '',
  confinedSpace: false,
  hotWorkPermit: false,
  ppeRequired: [] as string[],
  specialPrecautions: [] as string[],
};

export function WorkOrderForm({ initialData, onSave, onSubmit, onPrint }: WorkOrderFormProps) {
  // Normalize data from API - handle both nested and flat field structures
  const normalizedData = useMemo(() => {
    const d = initialData as Record<string, unknown>;
    
    // Build equipment from nested or flat fields
    const equipment = {
      tag: (d.equipment as Record<string, string>)?.tag || d.equipmentTag as string || '',
      name: (d.equipment as Record<string, string>)?.name || d.equipmentName as string || '',
      type: (d.equipment as Record<string, string>)?.type || d.workType as string || '',
      location: (d.equipment as Record<string, string>)?.location || '',
      manufacturer: (d.equipment as Record<string, string>)?.manufacturer || '',
      model: (d.equipment as Record<string, string>)?.model || '',
    };
    
    // Build safety from nested or flat fields
    const safety = {
      ...defaultSafety,
      ...(d.safety as Record<string, unknown> || {}),
      lotoRequired: (d.safety as Record<string, boolean>)?.lotoRequired || d.lotoRequired as boolean || false,
      ppeRequired: (d.safety as Record<string, string[]>)?.ppeRequired || [],
      specialPrecautions: (d.safety as Record<string, string[]>)?.specialPrecautions || 
        (Array.isArray(d.safetyRequirements) ? d.safetyRequirements as string[] : []),
    };
    
    // Normalize parts - can be array of strings or objects
    const parts = Array.isArray(d.requiredParts) 
      ? (d.requiredParts as Array<string | Record<string, unknown>>).map((p, i) => 
          typeof p === 'string' ? { partNumber: '', description: p, quantity: 1 } : p
        )
      : [];
    
    return {
      ...initialData,
      equipment,
      safety,
      parts,
      requiredTools: Array.isArray(d.requiredTools) ? d.requiredTools as string[] : [],
      procedure: d.procedure || { steps: [], acceptanceCriteria: [] },
      approvals: d.approvals || [],
      lotoPoints: d.lotoPoints || [],
      // Handle various duration/date formats
      estimatedDuration: d.estimatedDuration || (d.estimatedHours ? `${d.estimatedHours} hours` : ''),
      targetCompletion: d.targetCompletion || d.targetDate as string || '',
      symptoms: Array.isArray(d.symptoms) ? d.symptoms : (d.symptoms ? [d.symptoms as string] : []),
    } as WorkOrderSchema;
  }, [initialData]);
  
  const [data, setData] = useState<WorkOrderSchema>(normalizedData);
  const [submitted, setSubmitted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['equipment', 'safety', 'procedure', 'parts', 'approvals'])
  );
  const printRef = useRef<HTMLDivElement>(null);

  // Update a field in the data
  const updateField = (path: string, value: unknown) => {
    setData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: Record<string, unknown> = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (Array.isArray(current[keys[i]])) {
          current = [...current[keys[i]] as unknown[]] as unknown as Record<string, unknown>;
          (newData as Record<string, unknown>)[keys[i]] = current;
        } else {
          current[keys[i]] = { ...(current[keys[i]] as Record<string, unknown>) };
          current = current[keys[i]] as Record<string, unknown>;
        }
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  // Update array item
  const updateArrayItem = (arrayPath: string, index: number, field: string, value: unknown) => {
    setData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = arrayPath.split('.');
      let arr = newData;
      for (const key of keys) {
        arr = arr[key];
      }
      if (Array.isArray(arr) && arr[index]) {
        arr[index][field] = value;
      }
      return newData;
    });
  };

  // Toggle section
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Print handler
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  // Save handler
  const handleSave = () => {
    if (onSave) {
      onSave(data);
    }
  };

  const priority = priorityConfig[data.priority?.toLowerCase()] || defaultPriority;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          .work-order-form { 
            background: white !important; 
            color: black !important;
            padding: 20px !important;
          }
          .work-order-form * { 
            color: black !important; 
            border-color: #ccc !important;
            background: white !important;
          }
          .work-order-form input,
          .work-order-form textarea,
          .work-order-form select {
            border: 1px solid #ccc !important;
            background: #f9f9f9 !important;
          }
          .priority-badge { 
            border: 2px solid currentColor !important;
            padding: 4px 12px !important;
          }
        }
      `}</style>

      {/* Header Actions - No Print */}
      <div className="no-print sticky top-0 z-50 bg-black/95 backdrop-blur border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Emergency Work Order</h1>
              <p className="text-sm text-white/50">{data.workOrderNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
            {onSubmit && (
              <button
                onClick={() => {
                  setSubmitted(true);
                  onSubmit(data);
                }}
                disabled={submitted}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  submitted 
                    ? 'bg-emerald-500/40 text-emerald-300 cursor-default'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitted ? 'Submitted ✓' : 'Submit'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div ref={printRef} className="work-order-form max-w-5xl mx-auto p-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex items-start justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className={`priority-badge px-3 py-1 rounded-full text-xs font-bold ${priority.bg} ${priority.border} ${priority.text} border`}>
                {priority.label} PRIORITY
              </span>
              {data.safety?.atexRequired && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  <Zap className="w-3 h-3" />
                  ATEX ZONE {data.safety?.atexZone || '1'}
                </span>
              )}
              {data.safety?.lotoRequired && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 border border-rose-500/40 text-rose-400">
                  <Lock className="w-3 h-3" />
                  LOTO REQUIRED
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Work Order Number</label>
                <input
                  type="text"
                  value={data.workOrderNumber}
                  onChange={(e) => updateField('workOrderNumber', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Work Type</label>
                <select
                  value={data.workType}
                  onChange={(e) => updateField('workType', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-sm"
                >
                  <option value="Emergency Repair">Emergency Repair</option>
                  <option value="Corrective Maintenance">Corrective Maintenance</option>
                  <option value="Preventive Maintenance">Preventive Maintenance</option>
                  <option value="Inspection">Inspection</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Target Completion</label>
                <input
                  type="datetime-local"
                  value={data.targetCompletion}
                  onChange={(e) => updateField('targetCompletion', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Estimated Duration</label>
                <input
                  type="text"
                  value={data.estimatedDuration}
                  onChange={(e) => updateField('estimatedDuration', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-2">Work Description</label>
          <textarea
            value={data.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-sm resize-none"
          />
        </div>

        {/* Equipment Section */}
        <Section
          title="Equipment Information"
          icon={<Wrench className="w-4 h-4" />}
          expanded={expandedSections.has('equipment')}
          onToggle={() => toggleSection('equipment')}
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Equipment Tag</label>
              <input
                type="text"
                value={data.equipment?.tag}
                onChange={(e) => updateField('equipment.tag', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-sm font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Equipment Name</label>
              <input
                type="text"
                value={data.equipment?.name}
                onChange={(e) => updateField('equipment.name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Location</label>
              <input
                type="text"
                value={data.equipment?.location}
                onChange={(e) => updateField('equipment.location', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Manufacturer</label>
              <input
                type="text"
                value={data.equipment?.manufacturer || ''}
                onChange={(e) => updateField('equipment.manufacturer', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Model</label>
              <input
                type="text"
                value={data.equipment?.model || ''}
                onChange={(e) => updateField('equipment.model', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Serial Number</label>
              <input
                type="text"
                value={data.equipment?.serialNumber || ''}
                onChange={(e) => updateField('equipment.serialNumber', e.target.value)}
                placeholder="Enter serial number"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-sm font-mono placeholder:text-white/20"
              />
            </div>
          </div>
        </Section>

        {/* Safety Requirements Section */}
        <Section
          title="Safety Requirements"
          icon={<Shield className="w-4 h-4" />}
          expanded={expandedSections.has('safety')}
          onToggle={() => toggleSection('safety')}
          variant="danger"
        >
          <div className="space-y-4">
            {/* Compliance checkboxes */}
            <div className="grid grid-cols-4 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.safety?.atexRequired}
                  onChange={(e) => updateField('safety.atexRequired', e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5"
                />
                <span className="text-sm">ATEX Compliance</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.safety?.lotoRequired}
                  onChange={(e) => updateField('safety.lotoRequired', e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5"
                />
                <span className="text-sm">LOTO Required</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.safety?.confinedSpace}
                  onChange={(e) => updateField('safety.confinedSpace', e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5"
                />
                <span className="text-sm">Confined Space</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.safety?.hotWorkPermit}
                  onChange={(e) => updateField('safety.hotWorkPermit', e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5"
                />
                <span className="text-sm">Hot Work Permit</span>
              </label>
            </div>

            {data.safety?.atexRequired && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <label className="block text-[10px] uppercase tracking-wider text-amber-400 mb-2">ATEX Zone Classification</label>
                <select
                  value={data.safety?.atexZone || ''}
                  onChange={(e) => updateField('safety.atexZone', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-amber-500/30 focus:border-amber-500/50 focus:outline-none text-sm"
                >
                  <option value="">Select Zone</option>
                  <option value="0">Zone 0 - Continuous explosive atmosphere</option>
                  <option value="1">Zone 1 - Likely explosive atmosphere</option>
                  <option value="2">Zone 2 - Unlikely explosive atmosphere</option>
                  <option value="20">Zone 20 - Combustible dust (continuous)</option>
                  <option value="21">Zone 21 - Combustible dust (likely)</option>
                  <option value="22">Zone 22 - Combustible dust (unlikely)</option>
                </select>
              </div>
            )}

            {/* PPE Required */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-2">Required PPE</label>
              <div className="flex flex-wrap gap-2">
                {(data.safety?.ppeRequired || []).map((ppe, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
                    {ppe}
                    <button
                      onClick={() => {
                        const newPpe = (data.safety?.ppeRequired || []).filter((_, idx) => idx !== i);
                        updateField('safety.ppeRequired', newPpe);
                      }}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Add PPE..."
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm w-32 focus:outline-none focus:border-white/30"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      updateField('safety.ppeRequired', [...(data.safety?.ppeRequired || []), e.currentTarget.value]);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>

            {/* Special Precautions */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-2">Special Precautions</label>
              <div className="space-y-2">
                {(data.safety?.specialPrecautions || []).map((precaution, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">⚠️</span>
                    <input
                      type="text"
                      value={precaution}
                      onChange={(e) => {
                        const newPrecautions = [...(data.safety?.specialPrecautions || [])];
                        newPrecautions[i] = e.target.value;
                        updateField('safety.specialPrecautions', newPrecautions);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30"
                    />
                    <button
                      onClick={() => {
                        const newPrecautions = (data.safety?.specialPrecautions || []).filter((_, idx) => idx !== i);
                        updateField('safety.specialPrecautions', newPrecautions);
                      }}
                      className="p-2 text-white/40 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateField('safety.specialPrecautions', [...(data.safety?.specialPrecautions || []), ''])}
                  className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70"
                >
                  <Plus className="w-4 h-4" />
                  Add Precaution
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* LOTO Points Section */}
        {data.safety?.lotoRequired && data.lotoPoints && (
          <Section
            title="Lock Out / Tag Out Points"
            icon={<Lock className="w-4 h-4" />}
            expanded={expandedSections.has('loto')}
            onToggle={() => toggleSection('loto')}
            variant="danger"
          >
            <div className="space-y-3">
              {data.lotoPoints?.map((point, i) => (
                <div key={i} className="p-4 rounded-lg bg-white/[0.02] border border-white/10">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                      {point.sequence}
                    </span>
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={point.tag}
                        onChange={(e) => updateArrayItem('lotoPoints', i, 'tag', e.target.value)}
                        placeholder="Tag"
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-mono focus:outline-none focus:border-white/30"
                      />
                      <input
                        type="text"
                        value={point.type}
                        onChange={(e) => updateArrayItem('lotoPoints', i, 'type', e.target.value)}
                        placeholder="Type"
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30"
                      />
                      <input
                        type="text"
                        value={point.location}
                        onChange={(e) => updateArrayItem('lotoPoints', i, 'location', e.target.value)}
                        placeholder="Location"
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30"
                      />
                    </div>
                  </div>
                  <div className="ml-12 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-amber-400 mb-1">Action</label>
                      <input
                        type="text"
                        value={point.action}
                        onChange={(e) => updateArrayItem('lotoPoints', i, 'action', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-emerald-400 mb-1">Verification</label>
                      <input
                        type="text"
                        value={point.verification}
                        onChange={(e) => updateArrayItem('lotoPoints', i, 'verification', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30"
                      />
                    </div>
                  </div>
                  <div className="ml-12 mt-3 flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={point.isolated || false}
                        onChange={(e) => updateArrayItem('lotoPoints', i, 'isolated', e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-white/60">Isolated</span>
                    </label>
                    <input
                      type="text"
                      value={point.verifiedBy || ''}
                      onChange={(e) => updateArrayItem('lotoPoints', i, 'verifiedBy', e.target.value)}
                      placeholder="Verified by..."
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Procedure Steps Section */}
        <Section
          title="Procedure Steps"
          icon={<ClipboardList className="w-4 h-4" />}
          expanded={expandedSections.has('procedure')}
          onToggle={() => toggleSection('procedure')}
        >
          <div className="space-y-3">
            {(data.procedureSteps || []).map((step, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-lg border ${
                  step.critical 
                    ? 'bg-amber-500/10 border-amber-500/30' 
                    : 'bg-white/[0.02] border-white/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    step.critical ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/60'
                  }`}>
                    {step.step}
                  </span>
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={step.description}
                      onChange={(e) => updateArrayItem('procedureSteps', i, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30 resize-none"
                    />
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={step.critical || false}
                          onChange={(e) => updateArrayItem('procedureSteps', i, 'critical', e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-xs text-amber-400">Critical Step</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={step.completed || false}
                          onChange={(e) => updateArrayItem('procedureSteps', i, 'completed', e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-xs text-emerald-400">Completed</span>
                      </label>
                      <input
                        type="text"
                        value={step.notes || ''}
                        onChange={(e) => updateArrayItem('procedureSteps', i, 'notes', e.target.value)}
                        placeholder="Notes..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs focus:outline-none focus:border-white/30"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                const newStep = {
                  step: (data.procedureSteps || []).length + 1,
                  description: '',
                  critical: false,
                  completed: false,
                };
                updateField('procedureSteps', [...(data.procedureSteps || []), newStep]);
              }}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 px-4 py-2"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </div>
        </Section>

        {/* Quality Checkpoints */}
        {data.qualityCheckpoints && data.qualityCheckpoints.length > 0 && (
          <Section
            title="Quality Checkpoints"
            icon={<CheckCircle2 className="w-4 h-4" />}
            expanded={expandedSections.has('quality')}
            onToggle={() => toggleSection('quality')}
            variant="success"
          >
            <div className="space-y-3">
              {data.qualityCheckpoints.map((qc, i) => (
                <div key={i} className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={qc.passed || false}
                      onChange={(e) => updateArrayItem('qualityCheckpoints', i, 'passed', e.target.checked)}
                      className="w-5 h-5 rounded mt-0.5"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={qc.checkpoint}
                        onChange={(e) => updateArrayItem('qualityCheckpoints', i, 'checkpoint', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium focus:outline-none focus:border-white/30"
                      />
                      <input
                        type="text"
                        value={qc.criteria}
                        onChange={(e) => updateArrayItem('qualityCheckpoints', i, 'criteria', e.target.value)}
                        placeholder="Acceptance criteria..."
                        className="w-full mt-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 focus:outline-none focus:border-white/30"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Required Parts */}
        <Section
          title="Required Parts"
          icon={<Package className="w-4 h-4" />}
          expanded={expandedSections.has('parts')}
          onToggle={() => toggleSection('parts')}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-white/40">Part Number</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-white/40">Description</th>
                  <th className="px-3 py-2 text-center text-[10px] uppercase tracking-wider text-white/40">Qty</th>
                  <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-white/40">Unit Cost</th>
                  <th className="px-3 py-2 text-center text-[10px] uppercase tracking-wider text-white/40">In Stock</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(data.requiredParts || []).map((partItem, i) => {
                  const part = typeof partItem === 'string' 
                    ? { partNumber: '', description: partItem, quantity: 1 } 
                    : partItem;
                  return (
                  <tr key={i}>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={part.partNumber || ''}
                        onChange={(e) => updateArrayItem('requiredParts', i, 'partNumber', e.target.value)}
                        className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono focus:outline-none focus:border-white/30"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={part.description || ''}
                        onChange={(e) => updateArrayItem('requiredParts', i, 'description', e.target.value)}
                        className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-xs focus:outline-none focus:border-white/30"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={part.quantity || 1}
                        onChange={(e) => updateArrayItem('requiredParts', i, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-center focus:outline-none focus:border-white/30"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={part.unitCost || ''}
                        onChange={(e) => updateArrayItem('requiredParts', i, 'unitCost', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-24 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-right focus:outline-none focus:border-white/30"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={part.inStock || false}
                        onChange={(e) => updateArrayItem('requiredParts', i, 'inStock', e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => {
                          const newParts = (data.requiredParts || []).filter((_, idx) => idx !== i);
                          updateField('requiredParts', newParts);
                        }}
                        className="p-1 text-white/30 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
            <button
              onClick={() => {
                const newPart = { partNumber: '', description: '', quantity: 1, unitCost: 0, inStock: false };
                updateField('requiredParts', [...(data.requiredParts || []), newPart]);
              }}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 px-4 py-2 mt-2"
            >
              <Plus className="w-4 h-4" />
              Add Part
            </button>
          </div>
        </Section>

        {/* Required Tools */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-2">Required Tools</label>
          <div className="flex flex-wrap gap-2">
            {data.requiredTools?.map((tool, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm">
                <Wrench className="w-3 h-3 text-white/40" />
                {tool}
                <button
                  onClick={() => {
                    const newTools = data.requiredTools?.filter((_, idx) => idx !== i);
                    updateField('requiredTools', newTools);
                  }}
                  className="text-white/40 hover:text-rose-400 ml-1"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder="Add tool..."
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm w-32 focus:outline-none focus:border-white/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  updateField('requiredTools', [...(data.requiredTools || []), e.currentTarget.value]);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </div>

        {/* Personnel */}
        <Section
          title="Personnel"
          icon={<User className="w-4 h-4" />}
          expanded={expandedSections.has('personnel')}
          onToggle={() => toggleSection('personnel')}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Requested By</label>
              <input
                type="text"
                value={data.personnel.requestedBy}
                onChange={(e) => updateField('personnel.requestedBy', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Assigned To</label>
              <input
                type="text"
                value={data.personnel.assignedTo}
                onChange={(e) => updateField('personnel.assignedTo', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Safety Observer</label>
              <input
                type="text"
                value={data.personnel.safetyObserver || ''}
                onChange={(e) => updateField('personnel.safetyObserver', e.target.value)}
                placeholder="Required for LOTO/Confined Space"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30 placeholder:text-white/20"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Supervisor</label>
              <input
                type="text"
                value={data.personnel.supervisor || ''}
                onChange={(e) => updateField('personnel.supervisor', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
          </div>
        </Section>

        {/* Approvals */}
        <Section
          title="Approvals"
          icon={<CheckCircle2 className="w-4 h-4" />}
          expanded={expandedSections.has('approvals')}
          onToggle={() => toggleSection('approvals')}
        >
          <div className="grid grid-cols-3 gap-4">
            {data.approvals?.map((approval, i) => (
              <div key={i} className="p-4 rounded-lg bg-white/[0.02] border border-white/10">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-2">{approval.role}</div>
                <input
                  type="text"
                  value={approval.name || ''}
                  onChange={(e) => updateArrayItem('approvals', i, 'name', e.target.value)}
                  placeholder="Name"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30 mb-2"
                />
                <div className="h-16 border border-dashed border-white/20 rounded-lg flex items-center justify-center text-white/30 text-xs mb-2">
                  Signature
                </div>
                <input
                  type="date"
                  value={approval.date || ''}
                  onChange={(e) => updateArrayItem('approvals', i, 'date', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs focus:outline-none focus:border-white/30"
                />
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approval.approved || false}
                    onChange={(e) => updateArrayItem('approvals', i, 'approved', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-xs text-emerald-400">Approved</span>
                </label>
              </div>
            ))}
          </div>
        </Section>

        {/* Notes */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-2">Additional Notes</label>
          <textarea
            value={data.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={4}
            placeholder="Enter any additional notes, observations, or follow-up actions..."
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-sm resize-none placeholder:text-white/20"
          />
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Created: {new Date(data.createdAt).toLocaleString()}</span>
          </div>
          <div>
            Document ID: {data.workOrderNumber}
          </div>
        </div>
      </div>
    </div>
  );
}

// Collapsible section component
function Section({ 
  title, 
  icon, 
  children, 
  expanded, 
  onToggle,
  variant = 'default'
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  variant?: 'default' | 'danger' | 'success';
}) {
  const variantStyles = {
    default: 'border-white/10',
    danger: 'border-rose-500/30 bg-rose-500/5',
    success: 'border-emerald-500/30 bg-emerald-500/5',
  };

  return (
    <div className={`rounded-xl border ${variantStyles[variant]} overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={variant === 'danger' ? 'text-rose-400' : variant === 'success' ? 'text-emerald-400' : 'text-white/60'}>
            {icon}
          </span>
          <span className="font-medium">{title}</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default WorkOrderForm;

