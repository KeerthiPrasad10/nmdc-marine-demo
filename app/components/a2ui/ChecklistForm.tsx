'use client';

/**
 * ChecklistForm - Inspection/Safety Checklist Form
 * A2UI Component for rendering and completing checklists
 */

import { useState, useRef, useMemo } from 'react';
import { 
  Printer, Save, CheckCircle2, AlertTriangle, Clock, User,
  ChevronDown, ChevronRight, Camera, MessageSquare, ClipboardCheck
} from 'lucide-react';
import type { ChecklistSchema } from './types';

interface ChecklistFormProps {
  initialData: ChecklistSchema;
  onSave?: (data: ChecklistSchema) => void;
  onSubmit?: (data: ChecklistSchema) => void;
  onPrint?: () => void;
}

const typeLabels: Record<string, string> = {
  inspection: 'Inspection Checklist',
  pre_job: 'Pre-Job Checklist',
  post_job: 'Post-Job Checklist',
  safety: 'Safety Checklist',
  quality: 'Quality Checklist',
  maintenance: 'Maintenance Checklist',
};

const severityConfig = {
  critical: { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-400' },
  major: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400' },
  minor: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400' },
  observation: { bg: 'bg-gray-500/20', border: 'border-gray-500/40', text: 'text-gray-400' },
};

export function ChecklistForm({ initialData, onSave, onSubmit, onPrint }: ChecklistFormProps) {
  const [data, setData] = useState<ChecklistSchema>(initialData);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(data.categories.map(c => c.id))
  );
  const printRef = useRef<HTMLDivElement>(null);

  // Calculate progress
  const progress = useMemo(() => {
    let passed = 0, failed = 0, total = 0;
    data.categories.forEach(cat => {
      cat.items.forEach(item => {
        total++;
        if (item.type === 'check') {
          if (item.checked) passed++;
        } else if (item.value !== undefined && item.value !== '') {
          // Check if value is within limits
          const numVal = typeof item.value === 'number' ? item.value : parseFloat(String(item.value));
          if (!isNaN(numVal)) {
            const inRange = (item.min === undefined || numVal >= item.min) && 
                           (item.max === undefined || numVal <= item.max);
            if (inRange) passed++;
            else failed++;
          } else {
            passed++; // Text value provided
          }
        }
      });
    });
    return { passed, failed, notCompleted: total - passed - failed, total };
  }, [data]);

  const progressPercent = progress.total > 0 ? (progress.passed / progress.total) * 100 : 0;

  const updateItem = (categoryId: string, itemId: string, field: string, value: unknown) => {
    setData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const cat = newData.categories.find((c: { id: string }) => c.id === categoryId);
      if (cat) {
        const item = cat.items.find((i: { id: string }) => i.id === itemId);
        if (item) {
          item[field] = value;
        }
      }
      return newData;
    });
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handlePrint = () => onPrint ? onPrint() : window.print();
  const handleSave = () => onSave?.(data);
  const handleSubmit = () => onSubmit?.(data);

  const allComplete = progress.notCompleted === 0;

  return (
    <div className="bg-black text-white rounded-xl border border-white/10 overflow-hidden">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .checklist-form { background: white !important; color: black !important; }
          .checklist-form * { color: black !important; border-color: #ccc !important; }
        }
      `}</style>

      {/* Header */}
      <div className="no-print sticky top-0 z-50 bg-black/95 backdrop-blur border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="font-semibold">{data.title || typeLabels[data.type]}</h1>
              <p className="text-xs text-white/50">{data.checklistId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm">
              <Save className="w-4 h-4" /> Save
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm">
              <Printer className="w-4 h-4" /> Print
            </button>
            {onSubmit && (
              <button 
                onClick={handleSubmit} 
                disabled={!allComplete}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
                  allComplete 
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400' 
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Submit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div ref={printRef} className="checklist-form p-4 space-y-4">
        
        {/* Progress Bar */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Progress</span>
            <span className="text-sm font-medium">
              {progress.passed} / {progress.total} items
              {progress.failed > 0 && <span className="text-rose-400 ml-2">({progress.failed} failed)</span>}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${progress.failed > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Equipment Info (if available) */}
        {data.equipment && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-[10px] uppercase text-blue-400">Equipment Tag</div>
                <div className="font-mono">{data.equipment.tag}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-blue-400">Name</div>
                <div>{data.equipment.name}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-blue-400">Location</div>
                <div>{data.equipment.location}</div>
              </div>
            </div>
          </div>
        )}

        {/* Categories & Items */}
        {data.categories.map(category => {
          const catProgress = category.items.filter(i => 
            i.type === 'check' ? i.checked : (i.value !== undefined && i.value !== '')
          ).length;
          
          return (
            <div key={category.id} className="rounded-xl border border-white/10 overflow-hidden">
              <button 
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{category.name}</span>
                  <span className="text-xs text-white/40">
                    {catProgress}/{category.items.length}
                  </span>
                </div>
                {expandedCategories.has(category.id) 
                  ? <ChevronDown className="w-4 h-4 text-white/40" /> 
                  : <ChevronRight className="w-4 h-4 text-white/40" />
                }
              </button>
              
              {expandedCategories.has(category.id) && (
                <div className="divide-y divide-white/5">
                  {category.items.map(item => {
                    const hasError = item.type === 'value' && item.value !== undefined && (
                      (item.min !== undefined && Number(item.value) < item.min) ||
                      (item.max !== undefined && Number(item.value) > item.max)
                    );
                    
                    return (
                      <div 
                        key={item.id}
                        className={`p-4 ${
                          hasError ? 'bg-rose-500/10' : 
                          (item.type === 'check' && item.checked) || 
                          (item.type !== 'check' && item.value) ? 'bg-emerald-500/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Checkbox for check type */}
                          {item.type === 'check' && (
                            <button
                              onClick={() => updateItem(category.id, item.id, 'checked', !item.checked)}
                              className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                item.checked 
                                  ? 'bg-emerald-500 border-emerald-500' 
                                  : 'border-white/30 hover:border-white/50'
                              }`}
                            >
                              {item.checked && <CheckCircle2 className="w-4 h-4 text-white" />}
                            </button>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm ${item.checked ? 'text-white/50 line-through' : 'text-white/90'}`}>
                                {item.text}
                              </span>
                              {item.required && <span className="text-rose-400 text-xs">*</span>}
                              {item.critical && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  CRITICAL
                                </span>
                              )}
                            </div>
                            
                            {/* Value input */}
                            {item.type === 'value' && (
                              <div className="flex items-center gap-2 mt-2">
                                <input
                                  type="number"
                                  value={item.value ?? ''}
                                  onChange={(e) => updateItem(category.id, item.id, 'value', e.target.value)}
                                  placeholder="Value"
                                  className={`w-24 px-2 py-1 rounded bg-white/5 border text-sm focus:outline-none ${
                                    hasError ? 'border-rose-500' : 'border-white/10 focus:border-white/30'
                                  }`}
                                />
                                {item.unit && <span className="text-xs text-white/50">{item.unit}</span>}
                                {(item.min !== undefined || item.max !== undefined) && (
                                  <span className="text-xs text-white/30">
                                    (Range: {item.min ?? '—'} - {item.max ?? '—'})
                                  </span>
                                )}
                                {hasError && (
                                  <span className="text-xs text-rose-400">Out of range!</span>
                                )}
                              </div>
                            )}
                            
                            {/* Select input */}
                            {item.type === 'select' && item.options && (
                              <select
                                value={item.selectedOption ?? ''}
                                onChange={(e) => updateItem(category.id, item.id, 'selectedOption', e.target.value)}
                                className="mt-2 px-2 py-1 rounded bg-white/5 border border-white/10 text-sm focus:outline-none"
                              >
                                <option value="">Select...</option>
                                {item.options.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}
                            
                            {/* Text input */}
                            {item.type === 'text' && (
                              <input
                                type="text"
                                value={item.value ?? ''}
                                onChange={(e) => updateItem(category.id, item.id, 'value', e.target.value)}
                                placeholder="Enter value..."
                                className="mt-2 w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-sm focus:outline-none"
                              />
                            )}
                            
                            {/* Notes */}
                            {(item.notes !== undefined || item.type === 'check') && (
                              <div className="mt-2 flex items-center gap-2">
                                <MessageSquare className="w-3 h-3 text-white/30" />
                                <input
                                  type="text"
                                  value={item.notes ?? ''}
                                  onChange={(e) => updateItem(category.id, item.id, 'notes', e.target.value)}
                                  placeholder="Add notes..."
                                  className="flex-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Findings */}
        {data.findings && data.findings.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 overflow-hidden">
            <div className="px-4 py-3 bg-amber-500/10 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="font-medium">Findings ({data.findings.length})</span>
            </div>
            <div className="divide-y divide-white/5">
              {data.findings.map(finding => {
                const sev = severityConfig[finding.severity];
                return (
                  <div key={finding.id} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${sev.bg} ${sev.text} border ${sev.border}`}>
                        {finding.severity}
                      </span>
                      <span className="text-sm">{finding.description}</span>
                    </div>
                    {finding.correctiveAction && (
                      <p className="text-xs text-white/50 ml-14">
                        Action: {finding.correctiveAction}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Approvals */}
        {data.approvals && data.approvals.length > 0 && (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 bg-white/5 flex items-center gap-2">
              <User className="w-4 h-4 text-white/60" />
              <span className="font-medium">Approvals</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              {data.approvals.map((approval, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/[0.02] border border-white/10">
                  <div className="text-xs text-white/40 uppercase mb-2">{approval.role}</div>
                  <div className="h-12 border border-dashed border-white/20 rounded flex items-center justify-center text-white/20 text-xs mb-2">
                    Signature
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-white/40">Name:</span>
                    <span className="flex-1 border-b border-white/20">{approval.name || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> Inspector: {data.inspector}
            </span>
            {data.startedAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Started: {new Date(data.startedAt).toLocaleString()}
              </span>
            )}
          </div>
          <div>{data.checklistId}</div>
        </div>
      </div>
    </div>
  );
}

export default ChecklistForm;

