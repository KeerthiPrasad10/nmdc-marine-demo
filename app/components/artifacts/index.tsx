// @ts-nocheck - Legacy artifact renderer with dynamic types
'use client';

import { useState, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  Edit3,
  Check,
  X,
  AlertTriangle,
  Wrench,
  Shield,
  ClipboardList,
  Settings,
  ChevronDown,
  ChevronUp,
  Lock,
  Zap,
} from 'lucide-react';

// ============================================
// Shared Types
// ============================================

export interface WorkOrderData {
  work_order_number?: string;
  equipment_tag?: string;
  equipment_name?: string;
  work_type?: string;
  priority?: 'Critical' | 'High' | 'Medium' | 'Low' | 'emergency' | 'urgent' | 'high' | 'medium' | 'low' | string;
  description?: string;
  symptoms?: string[];
  required_parts?: Array<{ part_number: string; description: string; quantity: number }>;
  required_tools?: string[];
  safety_requirements?: string[];
  estimated_duration?: string;
  estimatedHours?: number;
  procedure_steps?: Array<{ step: number; description: string; notes?: string; critical?: boolean }>;
  procedureSteps?: string[];
  quality_checkpoints?: Array<{ checkpoint: string; criteria: string }>;
  atex_compliance?: boolean;
  lockout_tagout_required?: boolean;
  references?: Array<{ title: string; page?: number }>;
  safetyNotes?: string[];
}

export interface LOTOData {
  equipment_tag?: string;
  equipmentTag?: string;
  equipment_name?: string;
  equipmentName?: string;
  location?: string;
  generatedAt?: string;
  generated_at?: string;
  estimatedDuration?: string;
  estimated_duration?: string;
  requiredPpe?: string[];
  required_ppe?: string[];
  hazards?: string[];
  hazard_summary?: string;
  isolationSteps?: Array<{
    step: number;
    point: string;
    pointType: string;
    action: string;
    verification: string;
  }>;
  isolation_points?: Array<{
    sequence: number;
    tag: string;
    type: string;
    location: string;
    action: string;
    verification: string;
  }>;
  verificationSteps?: string[];
  reinstateSteps?: string[];
  warnings?: string[];
  special_precautions?: string[];
  ppe_required?: string[];
}

export interface ChecklistData {
  title: string;
  description?: string;
  items: Array<{
    id?: string;
    text?: string;
    step?: string;
    description?: string;
    action?: string;
    priority?: 'high' | 'medium' | 'low';
    reference?: string;
    checked?: boolean;
    details?: string;
    notes?: string;
    critical?: boolean;
  }>;
}

export interface EquipmentCardData {
  tag: string;
  name: string;
  type: string;
  status?: 'running' | 'stopped' | 'faulted' | 'maintenance';
  location?: string;
  manufacturer?: string;
  model?: string;
  specifications?: Record<string, string>;
  connectedEquipment?: Array<{ tag: string; type: string }>;
  connections?: Array<{ direction: string; tag: string; type: string }>;
  actions?: Array<{ id: string; label: string; icon?: string }>;
}

// Helper to safely convert value to array
function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value as unknown as T];
  return [value];
}

// ============================================
// Artifact Wrapper - Shared container with export/edit
// ============================================

interface ArtifactWrapperProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  priority?: string;
  children: React.ReactNode;
  onExport?: () => void;
  className?: string;
}

function ArtifactWrapper({ title, subtitle, icon, priority, children, className, exportData }: ArtifactWrapperProps & { exportData?: Record<string, unknown> }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleExportPDF = () => {
    // Generate a clean, professional PDF-ready document
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Build the document from the actual data, not innerHTML
    const data = exportData || {};
    const priorityLabel = priority?.toUpperCase() || '';
    const priorityColor = priority?.toLowerCase().includes('critical') || priority?.toLowerCase().includes('emergency') 
      ? '#dc2626' 
      : priority?.toLowerCase().includes('high') || priority?.toLowerCase().includes('urgent')
      ? '#ea580c'
      : '#2563eb';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            * { box-sizing: border-box; margin: 0; padding: 0; }
            
            body { 
              font-family: 'Inter', system-ui, -apple-system, sans-serif; 
              padding: 48px; 
              max-width: 800px; 
              margin: 0 auto;
              color: #1a1a1a;
              line-height: 1.5;
              background: white;
            }
            
            .header {
              border-bottom: 2px solid #e5e5e5;
              padding-bottom: 24px;
              margin-bottom: 32px;
            }
            
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 8px;
            }
            
            .document-title {
              font-size: 28px;
              font-weight: 700;
              color: #111;
              letter-spacing: -0.5px;
            }
            
            .priority-badge {
              display: inline-block;
              padding: 6px 14px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.5px;
              background: ${priorityColor}15;
              color: ${priorityColor};
              border: 1px solid ${priorityColor}40;
            }
            
            .subtitle {
              font-size: 14px;
              color: #666;
              margin-top: 4px;
            }
            
            .meta-row {
              display: flex;
              gap: 24px;
              margin-top: 16px;
              padding-top: 16px;
              border-top: 1px solid #f0f0f0;
            }
            
            .meta-item {
              font-size: 12px;
            }
            
            .meta-label {
              color: #888;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-size: 10px;
              margin-bottom: 2px;
            }
            
            .meta-value {
              color: #333;
              font-weight: 500;
            }
            
            .section {
              margin-bottom: 28px;
            }
            
            .section-title {
              font-size: 11px;
              font-weight: 600;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #eee;
            }
            
            .field-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 24px;
            }
            
            .field {
              padding: 12px 16px;
              background: #fafafa;
              border-radius: 8px;
              border: 1px solid #eee;
            }
            
            .field-label {
              font-size: 10px;
              color: #888;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            
            .field-value {
              font-size: 14px;
              color: #222;
              font-weight: 500;
            }
            
            .description-box {
              padding: 16px 20px;
              background: #f8f9fa;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
              margin-bottom: 24px;
            }
            
            .description-box p {
              font-size: 14px;
              color: #333;
              line-height: 1.7;
            }
            
            .warning-box {
              padding: 16px 20px;
              background: #fef2f2;
              border-radius: 8px;
              border-left: 4px solid #dc2626;
              margin-bottom: 24px;
            }
            
            .warning-box .section-title {
              color: #dc2626;
              border: none;
              padding: 0;
              margin-bottom: 8px;
            }
            
            .warning-box ul {
              list-style: none;
              padding: 0;
            }
            
            .warning-box li {
              font-size: 13px;
              color: #7f1d1d;
              padding: 4px 0;
              padding-left: 20px;
              position: relative;
            }
            
            .warning-box li:before {
              content: "⚠";
              position: absolute;
              left: 0;
            }
            
            .step {
              display: flex;
              gap: 16px;
              padding: 16px;
              margin-bottom: 12px;
              background: #fafafa;
              border-radius: 10px;
              border: 1px solid #eee;
            }
            
            .step.critical {
              background: #fffbeb;
              border-color: #fcd34d;
              border-left: 4px solid #f59e0b;
            }
            
            .step-number {
              width: 32px;
              height: 32px;
              background: #e5e5e5;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 14px;
              color: #666;
              flex-shrink: 0;
            }
            
            .step.critical .step-number {
              background: #fcd34d;
              color: #92400e;
            }
            
            .step-content {
              flex: 1;
            }
            
            .step-text {
              font-size: 14px;
              color: #333;
              line-height: 1.6;
            }
            
            .step-notes {
              font-size: 12px;
              color: #666;
              margin-top: 6px;
              font-style: italic;
            }
            
            .step-critical-label {
              font-size: 10px;
              color: #d97706;
              font-weight: 600;
              letter-spacing: 0.5px;
              margin-top: 8px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              font-size: 13px;
            }
            
            th {
              background: #f5f5f5;
              font-weight: 600;
              text-align: left;
              padding: 12px 16px;
              border-bottom: 2px solid #e0e0e0;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #555;
            }
            
            td {
              padding: 12px 16px;
              border-bottom: 1px solid #eee;
              color: #444;
            }
            
            tr:last-child td {
              border-bottom: none;
            }
            
            .tag-list {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            
            .tag {
              display: inline-block;
              padding: 6px 12px;
              background: #f0f0f0;
              border-radius: 6px;
              font-size: 12px;
              color: #444;
              border: 1px solid #e0e0e0;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e5e5;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #888;
            }
            
            .signature-line {
              margin-top: 48px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 48px;
            }
            
            .signature-box {
              border-top: 1px solid #ccc;
              padding-top: 8px;
            }
            
            .signature-label {
              font-size: 11px;
              color: #666;
            }
            
            .checklist-item {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              padding: 12px 16px;
              background: #fafafa;
              border-radius: 8px;
              margin-bottom: 8px;
              border: 1px solid #eee;
            }
            
            .checkbox {
              width: 18px;
              height: 18px;
              border: 2px solid #ccc;
              border-radius: 4px;
              flex-shrink: 0;
              margin-top: 2px;
            }
            
            .checklist-text {
              font-size: 13px;
              color: #333;
            }
            
            @media print {
              body { padding: 24px; }
              .step, .field, .checklist-item { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-top">
              <h1 class="document-title">${title}</h1>
              ${priorityLabel ? `<span class="priority-badge">${priorityLabel}</span>` : ''}
            </div>
            ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
            <div class="meta-row">
              <div class="meta-item">
                <div class="meta-label">Generated</div>
                <div class="meta-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              ${data.equipment_tag ? `
              <div class="meta-item">
                <div class="meta-label">Equipment Tag</div>
                <div class="meta-value">${data.equipment_tag}</div>
              </div>
              ` : ''}
              ${data.work_order_number ? `
              <div class="meta-item">
                <div class="meta-label">Work Order #</div>
                <div class="meta-value">${data.work_order_number}</div>
              </div>
              ` : ''}
            </div>
          </div>
          
          <div id="content"></div>
          
          <div class="signature-line">
            <div class="signature-box">
              <div class="signature-label">Prepared By / Date</div>
            </div>
            <div class="signature-box">
              <div class="signature-label">Approved By / Date</div>
            </div>
          </div>
          
          <div class="footer">
            <span>Generated by Resolve AI</span>
            <span>Document ID: ${data.work_order_number || `DOC-${Date.now().toString(36).toUpperCase()}`}</span>
          </div>
        </body>
      </html>
    `);

    // Now populate content based on the actual data
    const contentEl = printWindow.document.getElementById('content');
    if (contentEl && exportData) {
      let html = '';
      
      // Helper to get string value
      const str = (v: unknown): string => {
        if (!v) return '';
        if (typeof v === 'string') return v;
        if (typeof v === 'number') return String(v);
        return JSON.stringify(v);
      };
      
      // Equipment info grid
      const equipTag = str(exportData.equipment_tag || exportData.equipmentTag);
      const equipName = str(exportData.equipment_name || exportData.equipmentName);
      const workType = str(exportData.work_type || exportData.workType);
      const estDuration = str(exportData.estimated_duration || exportData.estimatedDuration || 
        (exportData.estimatedHours ? `${exportData.estimatedHours} hours` : ''));
      const location = str(exportData.location);
      
      if (equipTag || equipName || workType || location) {
        html += `
          <div class="field-grid">
            ${equipTag ? `<div class="field"><div class="field-label">Equipment Tag</div><div class="field-value">${equipTag}</div></div>` : ''}
            ${equipName ? `<div class="field"><div class="field-label">Equipment Name</div><div class="field-value">${equipName}</div></div>` : ''}
            ${workType ? `<div class="field"><div class="field-label">Work Type</div><div class="field-value">${workType}</div></div>` : ''}
            ${estDuration ? `<div class="field"><div class="field-label">Est. Duration</div><div class="field-value">${estDuration}</div></div>` : ''}
            ${location ? `<div class="field"><div class="field-label">Location</div><div class="field-value">${location}</div></div>` : ''}
          </div>
        `;
      }
      
      // Description
      const description = str(exportData.description);
      if (description) {
        html += `
          <div class="description-box">
            <p>${description}</p>
          </div>
        `;
      }
      
      // Safety requirements / warnings
      const safetyReqs = toArray(exportData.safety_requirements || exportData.safetyNotes || exportData.safety_notes);
      if (safetyReqs.length > 0) {
        html += `
          <div class="warning-box">
            <div class="section-title">⚠ Safety Requirements</div>
            <ul>
              ${safetyReqs.map((r) => `<li>${str(r)}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      // Hazards (for LOTO)
      const hazards = toArray(exportData.hazards || exportData.hazard_summary);
      if (hazards.length > 0) {
        html += `
          <div class="warning-box">
            <div class="section-title">⚠ Hazards</div>
            <ul>
              ${hazards.map((h) => `<li>${str(h)}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      // PPE Required
      const ppe = toArray(exportData.requiredPpe || exportData.required_ppe || exportData.ppe_required);
      if (ppe.length > 0) {
        html += `
          <div class="section">
            <div class="section-title">Required PPE</div>
            <div class="tag-list">
              ${ppe.map((p) => `<span class="tag">${str(p)}</span>`).join('')}
            </div>
          </div>
        `;
      }
      
      // Symptoms
      const symptoms = toArray(exportData.symptoms);
      if (symptoms.length > 0) {
        html += `
          <div class="section">
            <div class="section-title">Symptoms Reported</div>
            <ul style="list-style: disc; padding-left: 20px;">
              ${symptoms.map((s) => `<li style="padding: 4px 0; color: #444;">${str(s)}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      // Procedure steps - handle multiple formats
      const rawSteps = toArray(
        exportData.procedure_steps || 
        exportData.procedureSteps || 
        exportData.isolationSteps || 
        exportData.isolation_points ||
        exportData.steps
      );
      if (rawSteps.length > 0) {
        const stepTitle = (exportData.isolation_points || exportData.isolationSteps) ? 'Isolation Sequence' : 'Procedure Steps';
        html += `
          <div class="section">
            <div class="section-title">${stepTitle}</div>
            ${rawSteps.map((s, i) => {
              // Handle different step formats
              let step: Record<string, unknown>;
              if (typeof s === 'string') {
                step = { step: i + 1, description: s };
              } else if (typeof s === 'object' && s !== null) {
                step = s as Record<string, unknown>;
              } else {
                step = { step: i + 1, description: str(s) };
              }
              
              const stepNum = step.step || step.sequence || step.number || i + 1;
              const desc = str(step.description || step.action || step.point || step.text || step.instruction || '');
              const notes = str(step.notes || step.verification || step.note || '');
              const isCritical = step.critical === true;
              
              return `
                <div class="step${isCritical ? ' critical' : ''}">
                  <div class="step-number">${stepNum}</div>
                  <div class="step-content">
                    <div class="step-text">${desc}</div>
                    ${notes && notes.length < 300 ? `<div class="step-notes">${notes}</div>` : ''}
                    ${isCritical ? '<div class="step-critical-label">⚠ CRITICAL STEP</div>' : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
      
      // Required parts
      const parts = toArray(exportData.required_parts || exportData.requiredParts || exportData.parts);
      if (parts.length > 0) {
        html += `
          <div class="section">
            <div class="section-title">Required Parts</div>
            <table>
              <thead>
                <tr>
                  <th>Part Number</th>
                  <th>Description</th>
                  <th style="text-align: right;">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${parts.map((p) => {
                  let part: Record<string, unknown>;
                  if (typeof p === 'string') {
                    part = { part_number: '-', description: p, quantity: 1 };
                  } else if (typeof p === 'object' && p !== null) {
                    part = p as Record<string, unknown>;
                  } else {
                    part = { part_number: '-', description: str(p), quantity: 1 };
                  }
                  return `
                    <tr>
                      <td style="font-family: monospace;">${str(part.part_number || part.partNumber || part.sku || '-')}</td>
                      <td>${str(part.description || part.name || '')}</td>
                      <td style="text-align: right;">${part.quantity || part.qty || 1}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
      
      // Required tools
      const tools = toArray(exportData.required_tools || exportData.requiredTools || exportData.tools);
      if (tools.length > 0) {
        html += `
          <div class="section">
            <div class="section-title">Required Tools</div>
            <div class="tag-list">
              ${tools.map((t) => `<span class="tag">${str(t)}</span>`).join('')}
            </div>
          </div>
        `;
      }
      
      // References
      const refs = toArray(exportData.references);
      if (refs.length > 0) {
        html += `
          <div class="section">
            <div class="section-title">References</div>
            <ul style="list-style: none; padding: 0;">
              ${refs.map((r) => {
                const ref = typeof r === 'object' && r !== null ? r as Record<string, unknown> : { title: str(r) };
                const refTitle = str(ref.title || ref.name || r);
                const page = ref.page ? ` (Page ${ref.page})` : '';
                return `<li style="padding: 6px 0; border-bottom: 1px solid #eee;">📄 ${refTitle}${page}</li>`;
              }).join('')}
            </ul>
          </div>
        `;
      }
      
      // Checklist items
      const items = toArray(exportData.items);
      if (items.length > 0) {
        html += `
          <div class="section">
            <div class="section-title">Checklist</div>
            ${items.map((item) => {
              const i = typeof item === 'object' && item !== null ? item as Record<string, unknown> : { text: str(item) };
              const text = str(i.text || i.step || i.description || i.action || item);
              return `
                <div class="checklist-item">
                  <div class="checkbox"></div>
                  <div class="checklist-text">${text}</div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
      
      // Quality checkpoints
      const checkpoints = toArray(exportData.quality_checkpoints || exportData.qualityCheckpoints);
      if (checkpoints.length > 0) {
        html += `
          <div class="section">
            <div class="section-title">Quality Checkpoints</div>
            ${checkpoints.map((c) => {
              const cp = typeof c === 'object' && c !== null ? c as Record<string, unknown> : { checkpoint: str(c) };
              return `
                <div class="checklist-item">
                  <div class="checkbox"></div>
                  <div class="checklist-text">
                    <strong>${str(cp.checkpoint || cp.name || c)}</strong>
                    ${cp.criteria ? `<br><span style="color: #666; font-size: 12px;">Criteria: ${str(cp.criteria)}</span>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
      
      // LOTO specific: Verification and Reinstate steps
      const verifySteps = toArray(exportData.verificationSteps || exportData.verification_steps);
      if (verifySteps.length > 0) {
        html += `
          <div class="section">
            <div class="section-title">Verification Steps</div>
            ${verifySteps.map((v, i) => `
              <div class="checklist-item">
                <div class="checkbox"></div>
                <div class="checklist-text">${str(v)}</div>
              </div>
            `).join('')}
          </div>
        `;
      }
      
      const reinstateSteps = toArray(exportData.reinstateSteps || exportData.reinstate_steps);
      if (reinstateSteps.length > 0) {
        html += `
          <div class="section">
            <div class="section-title">Reinstatement Steps</div>
            ${reinstateSteps.map((r, i) => `
              <div class="step">
                <div class="step-number">${i + 1}</div>
                <div class="step-content">
                  <div class="step-text">${str(r)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
      
      contentEl.innerHTML = html;
    }

    printWindow.document.close();
    
    // Small delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const priorityColors: Record<string, string> = {
    'Critical': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    'critical': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    'emergency': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    'High': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'high': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'urgent': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Medium': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'medium': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Low': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'low': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  return (
    <div className={`rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              {priority && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${priorityColors[priority] || priorityColors['medium']}`}>
                  {priority.toUpperCase()}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-white/50">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleExportPDF}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Export PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (!exportData) return;
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${title.replace(/\s+/g, '_')}_${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Export JSON"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Print"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div ref={contentRef} className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================
// Editable Field Component
// ============================================

interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'textarea' | 'number';
  className?: string;
}

function EditableField({ label, value, onChange, type = 'text', className }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleSave = () => {
    onChange(localValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`space-y-1 ${className || ''}`}>
        <label className="text-[10px] uppercase tracking-wider text-white/40">{label}</label>
        <div className="flex gap-2">
          {type === 'textarea' ? (
            <textarea
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40 resize-none"
              rows={3}
              autoFocus
            />
          ) : (
            <input
              type={type}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40"
              autoFocus
            />
          )}
          <button onClick={handleSave} className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={handleCancel} className="p-2 rounded-lg bg-white/10 text-white/50 hover:bg-white/20">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-1 group ${className || ''}`}>
      <label className="text-[10px] uppercase tracking-wider text-white/40">{label}</label>
      <div
        onClick={() => setIsEditing(true)}
        className="px-3 py-2 rounded-lg bg-white/5 border border-transparent hover:border-white/20 cursor-pointer transition-colors flex items-center justify-between"
      >
        <span className="text-sm text-white/80">{value || '—'}</span>
        <Edit3 className="w-3.5 h-3.5 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

// ============================================
// Work Order Card
// ============================================

export function WorkOrderCard({ data: initialData }: { data: WorkOrderData }) {
  const [data, setData] = useState(initialData);

  const updateField = (field: keyof WorkOrderData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // Normalize array fields
  const symptoms = toArray(data.symptoms);
  const safetyRequirements = toArray(data.safety_requirements || data.safetyNotes);
  const requiredTools = toArray(data.required_tools);
  const requiredParts = toArray(data.required_parts);
  const rawSteps = toArray(data.procedure_steps) || toArray(data.procedureSteps);
  const steps = rawSteps.map((s, i) => typeof s === 'string' ? { step: i + 1, description: s } : s);

  return (
    <ArtifactWrapper
      title={data.equipment_name || 'Work Order'}
      subtitle={`${data.work_order_number || 'WO-DRAFT'} • ${data.work_type || 'Maintenance'}`}
      icon={<Wrench className="w-4 h-4 text-amber-400" />}
      priority={data.priority}
      exportData={data as unknown as Record<string, unknown>}
    >
      <div className="space-y-6">
        {/* Header Fields */}
        <div className="grid grid-cols-2 gap-4">
          <EditableField
            label="Equipment Tag"
            value={data.equipment_tag || ''}
            onChange={(v) => updateField('equipment_tag', v)}
          />
          <EditableField
            label="Equipment Name"
            value={data.equipment_name || ''}
            onChange={(v) => updateField('equipment_name', v)}
          />
        </div>

        {/* Description */}
        <EditableField
          label="Description"
          value={data.description || ''}
          onChange={(v) => updateField('description', v)}
          type="textarea"
        />

        {/* Symptoms */}
        {symptoms.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-white/40">Symptoms Reported</h4>
            <div className="space-y-1">
              {symptoms.map((symptom, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span>{typeof symptom === 'string' ? symptom : JSON.stringify(symptom)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety Requirements */}
        {safetyRequirements.length > 0 && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <h4 className="text-[10px] uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Safety Requirements
            </h4>
            <div className="space-y-1">
              {safetyRequirements.map((req, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-rose-300/80">
                  <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{typeof req === 'string' ? req : JSON.stringify(req)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Procedure Steps */}
        {steps && steps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-white/40">Procedure Steps</h4>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`flex gap-3 p-3 rounded-lg ${
                    step.critical ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/[0.03] border border-white/5'
                  }`}
                >
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.critical ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/60'
                  }`}>
                    {step.step || i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-white/80">{step.description}</p>
                    {step.notes && <p className="text-xs text-white/40 mt-1">{step.notes}</p>}
                  </div>
                  {step.critical && (
                    <span className="text-[9px] text-amber-400 uppercase tracking-wider self-start">Critical</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required Parts */}
        {requiredParts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-white/40">Required Parts</h4>
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-3 py-2 text-left text-white/50 font-medium">Part Number</th>
                    <th className="px-3 py-2 text-left text-white/50 font-medium">Description</th>
                    <th className="px-3 py-2 text-right text-white/50 font-medium">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requiredParts.map((part, i) => {
                    const partObj = typeof part === 'string' ? { part_number: '', description: part, quantity: 1 } : part;
                    return (
                      <tr key={i}>
                        <td className="px-3 py-2 text-white/60 font-mono text-[10px]">{partObj.part_number || '-'}</td>
                        <td className="px-3 py-2 text-white/70">{partObj.description}</td>
                        <td className="px-3 py-2 text-right text-white/60">{partObj.quantity || 1}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Required Tools */}
        {requiredTools.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-white/40">Required Tools</h4>
            <div className="flex flex-wrap gap-2">
              {requiredTools.map((tool, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60">
                  {typeof tool === 'string' ? tool : JSON.stringify(tool)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>Est. Duration: {data.estimated_duration || data.estimatedHours ? `${data.estimatedHours}h` : 'TBD'}</span>
            {data.lockout_tagout_required && (
              <span className="flex items-center gap-1 text-amber-400">
                <Lock className="w-3.5 h-3.5" />
                LOTO Required
              </span>
            )}
            {data.atex_compliance && (
              <span className="flex items-center gap-1 text-amber-400">
                <Zap className="w-3.5 h-3.5" />
                ATEX
              </span>
            )}
          </div>
        </div>
      </div>
    </ArtifactWrapper>
  );
}

// ============================================
// LOTO Procedure Card
// ============================================

export function LOTOCard({ data: initialData }: { data: LOTOData }) {
  const [data] = useState(initialData);

  const equipmentTag = data.equipment_tag || data.equipmentTag;
  const equipmentName = data.equipment_name || data.equipmentName;
  const ppeRequired = data.requiredPpe || data.required_ppe || data.ppe_required || [];
  const hazards = data.hazards || (data.hazard_summary ? [data.hazard_summary] : []);
  const isolationSteps = data.isolationSteps || data.isolation_points?.map(p => ({
    step: p.sequence,
    point: p.tag,
    pointType: p.type,
    action: p.action,
    verification: p.verification,
  })) || [];
  const warnings = data.warnings || data.special_precautions || [];

  return (
    <ArtifactWrapper
      title="Lock Out / Tag Out Procedure"
      subtitle={`${equipmentTag} - ${equipmentName}`}
      icon={<Lock className="w-4 h-4 text-rose-400" />}
      priority="Critical"
      exportData={data as unknown as Record<string, unknown>}
    >
      <div className="space-y-6">
        {/* Hazards Warning */}
        {hazards.length > 0 && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
            <h4 className="text-[10px] uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Hazards
            </h4>
            <div className="space-y-1">
              {hazards.map((hazard, i) => (
                <p key={i} className="text-sm text-rose-300/80">{hazard}</p>
              ))}
            </div>
          </div>
        )}

        {/* PPE Required */}
        {ppeRequired.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-white/40">Required PPE</h4>
            <div className="flex flex-wrap gap-2">
              {ppeRequired.map((ppe, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                  {ppe}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Isolation Steps */}
        {isolationSteps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-white/40">Isolation Sequence</h4>
            <div className="space-y-3">
              {isolationSteps.map((step, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-bold">
                      {step.step || i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white/90">{step.point}</p>
                      <p className="text-xs text-white/50">{step.pointType}</p>
                    </div>
                  </div>
                  <div className="ml-11 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 text-xs font-medium">ACTION:</span>
                      <span className="text-white/70 text-xs">{step.action}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 text-xs font-medium">VERIFY:</span>
                      <span className="text-white/70 text-xs">{step.verification}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <h4 className="text-[10px] uppercase tracking-wider text-amber-400 mb-2">⚠️ Special Precautions</h4>
            <div className="space-y-1">
              {warnings.map((warning, i) => (
                <p key={i} className="text-xs text-amber-300/80">• {warning}</p>
              ))}
            </div>
          </div>
        )}

        {/* Verification & Reinstate */}
        {data.verificationSteps && data.verificationSteps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-white/40">Verification Steps</h4>
            <div className="space-y-1">
              {data.verificationSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-white/70">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ArtifactWrapper>
  );
}

// ============================================
// Checklist Card
// ============================================

export function ChecklistCard({ data: initialData }: { data: ChecklistData }) {
  const [items, setItems] = useState(
    initialData.items.map((item, i) => ({
      ...item,
      id: item.id || `item-${i}`,
      checked: item.checked || false,
    }))
  );

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const completedCount = items.filter(i => i.checked).length;

  return (
    <ArtifactWrapper
      title={initialData.title}
      subtitle={`${completedCount}/${items.length} completed`}
      icon={<ClipboardList className="w-4 h-4 text-blue-400" />}
      exportData={initialData as unknown as Record<string, unknown>}
    >
      <div className="space-y-4">
        {initialData.description && (
          <p className="text-sm text-white/60">{initialData.description}</p>
        )}

        <div className="space-y-2">
          {items.map((item) => {
            const text = item.text || item.step || item.description || item.action || '';
            const isCritical = item.critical || item.priority === 'high';
            
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id!)}
                className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  item.checked 
                    ? 'bg-emerald-500/10 border border-emerald-500/20' 
                    : isCritical
                    ? 'bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40'
                    : 'bg-white/[0.03] border border-white/8 hover:border-white/20'
                }`}
              >
                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  item.checked 
                    ? 'bg-emerald-500 border-emerald-500' 
                    : 'border-white/30 hover:border-white/50'
                }`}>
                  {item.checked && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${item.checked ? 'text-white/50 line-through' : 'text-white/80'}`}>
                    {text}
                  </p>
                  {(item.details || item.notes) && (
                    <p className="text-xs text-white/40 mt-1">{item.details || item.notes}</p>
                  )}
                  {item.reference && (
                    <p className="text-xs text-white/30 mt-1">Ref: {item.reference}</p>
                  )}
                </div>
                {isCritical && !item.checked && (
                  <span className="text-[9px] text-amber-400 uppercase tracking-wider self-start">Critical</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-white/40 mb-2">
            <span>Progress</span>
            <span>{Math.round((completedCount / items.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / items.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </ArtifactWrapper>
  );
}

// ============================================
// Equipment Card
// ============================================

export function EquipmentInfoCard({ data }: { data: EquipmentCardData }) {
  const statusColors: Record<string, string> = {
    running: 'bg-emerald-500/20 text-emerald-400',
    stopped: 'bg-white/20 text-white/60',
    faulted: 'bg-rose-500/20 text-rose-400',
    maintenance: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <ArtifactWrapper
      title={data.name}
      subtitle={`${data.tag} • ${data.type}`}
      icon={<Settings className="w-4 h-4 text-blue-400" />}
      exportData={data as unknown as Record<string, unknown>}
    >
      <div className="space-y-4">
        {/* Status & Location */}
        <div className="flex items-center gap-4">
          {data.status && (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[data.status] || statusColors.stopped}`}>
              {data.status.toUpperCase()}
            </span>
          )}
          {data.location && (
            <span className="text-xs text-white/50">{data.location}</span>
          )}
        </div>

        {/* Manufacturer & Model */}
        {(data.manufacturer || data.model) && (
          <div className="grid grid-cols-2 gap-4">
            {data.manufacturer && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40">Manufacturer</p>
                <p className="text-sm text-white/70">{data.manufacturer}</p>
              </div>
            )}
            {data.model && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40">Model</p>
                <p className="text-sm text-white/70">{data.model}</p>
              </div>
            )}
          </div>
        )}

        {/* Specifications */}
        {data.specifications && Object.keys(data.specifications).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-white/40">Specifications</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(data.specifications).map(([key, value]) => (
                <div key={key} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <p className="text-[10px] text-white/40">{key}</p>
                  <p className="text-xs text-white/80 font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connections */}
        {(data.connectedEquipment || data.connections) && (
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-white/40">Connections</h4>
            <div className="space-y-1">
              {(data.connections || data.connectedEquipment?.map(c => ({ ...c, direction: 'connected' }))).map((conn, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-white/40">{conn.direction === 'inlet' ? '→' : conn.direction === 'outlet' ? '←' : '↔'}</span>
                  <span className="text-white/60 font-mono">{conn.tag}</span>
                  <span className="text-white/30">•</span>
                  <span className="text-white/50">{conn.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ArtifactWrapper>
  );
}

// ============================================
// Dynamic Renderer - Renders the right component based on type
// ============================================

interface UIResponse {
  type: string;
  data: unknown;
}

export function ArtifactRenderer({ response }: { response: UIResponse }) {
  // Use type from response, or detect from data structure
  const effectiveType = response.type || detectArtifactType(response.data);
  
  console.log('[ArtifactRenderer] Rendering:', { 
    originalType: response.type, 
    effectiveType,
    dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data as object).slice(0, 5) : []
  });
  
  switch (effectiveType) {
    case 'work_order':
      return <WorkOrderCard data={response.data as WorkOrderData} />;
    case 'loto_procedure':
      return <LOTOCard data={response.data as LOTOData} />;
    case 'checklist':
      return <ChecklistCard data={response.data as ChecklistData} />;
    case 'equipment_card':
      return <EquipmentInfoCard data={response.data as EquipmentCardData} />;
    case 'dynamic_form': {
      // Dynamic form might be a work order
      const formData = response.data as { formType?: string };
      if (formData.formType === 'work_order') {
        return <WorkOrderCard data={response.data as WorkOrderData} />;
      }
      // Check if it looks like a work order by structure
      const detected = detectArtifactType(response.data);
      if (detected === 'work_order') {
        return <WorkOrderCard data={response.data as WorkOrderData} />;
      }
      return null;
    }
    case 'multi_response': {
      // Render all artifacts from multi_response
      const multiData = response.data as { responses?: Array<{ type: string; data: unknown }> };
      const allResponses = multiData.responses || [];
      // Filter to only artifact types, or detect from structure
      const artifacts = allResponses.filter(r => hasArtifacts(r.type, r.data));
      if (artifacts.length === 0) return null;
      return (
        <div className="space-y-4">
          {artifacts.map((r, i) => (
            <ArtifactRenderer key={i} response={r} />
          ))}
        </div>
      );
    }
    default:
      // Last resort: try to detect from data structure
      if (response.data) {
        const detected = detectArtifactType(response.data);
        if (detected) {
          return <ArtifactRenderer response={{ type: detected, data: response.data }} />;
        }
      }
      return null;
  }
}

// Check if a response type should be rendered as an artifact
export function isArtifactType(type: string): boolean {
  return ['work_order', 'loto_procedure', 'checklist', 'equipment_card', 'dynamic_form', 'multi_response'].includes(type);
}

// Check if a response contains renderable artifacts
export function hasArtifacts(type: string | undefined, data: unknown): boolean {
  // Check by type first
  if (type) {
    // Direct artifact types
    if (['work_order', 'loto_procedure', 'checklist', 'equipment_card'].includes(type)) {
      return true;
    }
    
    // Check dynamic_form
    if (type === 'dynamic_form') {
      const formData = data as { formType?: string };
      return formData?.formType === 'work_order';
    }
    
    // Check multi_response for nested artifacts
    if (type === 'multi_response') {
      const multiData = data as { responses?: Array<{ type: string; data: unknown }> };
      return (multiData.responses || []).some(r => hasArtifacts(r.type, r.data));
    }
  }
  
  // Fallback: Check data structure directly (for when type is missing or wrong)
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    
    // Work order signature: has equipment fields and work-related fields
    if (d.work_order_number || d.workOrderNumber || 
        (d.equipment_tag && d.priority) || 
        (d.equipmentTag && d.priority) ||
        (d.equipment_name && (d.procedure_steps || d.procedureSteps))) {
      return true;
    }
    
    // LOTO signature: has isolation steps or points
    if (d.isolation_points || d.isolationSteps || 
        (d.equipment_tag && d.hazards) ||
        (d.equipmentTag && d.requiredPpe)) {
      return true;
    }
    
    // Checklist signature: has items array with text/step fields
    if (d.items && Array.isArray(d.items) && d.items.length > 0) {
      const firstItem = d.items[0] as Record<string, unknown>;
      if (firstItem && (firstItem.text || firstItem.step || firstItem.description || firstItem.checked !== undefined)) {
        return true;
      }
    }
  }
  
  return false;
}

// Detect artifact type from data structure
export function detectArtifactType(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  
  const d = data as Record<string, unknown>;
  
  // Work order detection
  if (d.work_order_number || d.workOrderNumber || 
      (d.equipment_tag && d.priority) || 
      (d.equipmentTag && d.priority) ||
      (d.equipment_name && (d.procedure_steps || d.procedureSteps)) ||
      (d.work_type || d.workType)) {
    return 'work_order';
  }
  
  // LOTO detection
  if (d.isolation_points || d.isolationSteps || 
      (d.hazards && (d.requiredPpe || d.required_ppe || d.ppe_required))) {
    return 'loto_procedure';
  }
  
  // Checklist detection
  if (d.items && Array.isArray(d.items) && d.title) {
    return 'checklist';
  }
  
  // Equipment card detection
  if (d.tag && d.name && d.type && (d.specifications || d.connectedEquipment)) {
    return 'equipment_card';
  }
  
  return null;
}

