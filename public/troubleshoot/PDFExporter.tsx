import { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Loader2 } from 'lucide-react';
import type { UIType, LOTOData, WorkOrderData, ChecklistData } from './types';

/**
 * PDF Export Utility
 * 
 * Uses browser print functionality with custom print stylesheets
 * for generating PDF exports of LOTO procedures, work orders, etc.
 */

interface PDFExportOptions {
  title: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  addHeader?: boolean;
  addFooter?: boolean;
}

// Export function using window.print()
export function exportToPDF(
  element: HTMLElement,
  options: PDFExportOptions
): void {
  const { title, filename = 'document', orientation = 'portrait' } = options;
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }
  
  // Clone the element
  const content = element.cloneNode(true) as HTMLElement;
  
  // Remove any non-printable elements
  content.querySelectorAll('[data-no-print]').forEach(el => el.remove());
  
  // Build print document
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page {
          size: ${orientation === 'landscape' ? 'landscape' : 'portrait'};
          margin: 1in;
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #1a1a1a;
          background: white;
        }
        
        .print-container {
          max-width: 100%;
          padding: 0;
        }
        
        /* Typography */
        h1, h2, h3, h4 {
          color: #1a1a1a;
          margin-bottom: 0.5em;
        }
        
        h1 { font-size: 18pt; }
        h2 { font-size: 14pt; }
        h3 { font-size: 12pt; }
        h4 { font-size: 11pt; }
        
        p, li { margin-bottom: 0.3em; }
        
        /* Tables */
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 1em 0;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        th {
          background: #f5f5f5;
          font-weight: 600;
        }
        
        /* Lists */
        ul, ol {
          margin-left: 1.5em;
          margin-bottom: 1em;
        }
        
        /* Sections */
        .section {
          margin-bottom: 1.5em;
          padding-bottom: 1em;
          border-bottom: 1px solid #eee;
        }
        
        .section:last-child {
          border-bottom: none;
        }
        
        /* Signature blocks */
        .signature-block {
          margin-top: 2em;
          page-break-inside: avoid;
        }
        
        .signature-line {
          border-bottom: 1px solid #333;
          height: 30px;
          margin-top: 10px;
        }
        
        /* Badges and labels */
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 9pt;
          font-weight: 600;
          border: 1px solid #ddd;
        }
        
        .badge-danger { background: #fee; color: #c00; border-color: #fcc; }
        .badge-warning { background: #ffe; color: #a50; border-color: #fda; }
        .badge-info { background: #eef; color: #06a; border-color: #ccf; }
        .badge-success { background: #efe; color: #060; border-color: #cfc; }
        
        /* Header */
        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #333;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        
        .print-header h1 {
          margin: 0;
        }
        
        .print-meta {
          text-align: right;
          font-size: 9pt;
          color: #666;
        }
        
        /* Footer */
        .print-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 8pt;
          color: #999;
          padding: 10px;
          border-top: 1px solid #eee;
        }
        
        /* Checkboxes */
        .checkbox {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 1px solid #333;
          margin-right: 8px;
          vertical-align: middle;
        }
        
        /* Hide non-printable elements */
        button, [data-no-print] {
          display: none !important;
        }
        
        /* Colors to black and white */
        .text-purple, .text-primary { color: #333 !important; }
        .bg-purple, .bg-primary { background: #f5f5f5 !important; }
        
        /* Specific component styles */
        .loto-step {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
          padding: 8px;
          border: 1px solid #ddd;
        }
        
        .step-number {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          border-radius: 50%;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        ${content.innerHTML}
      </div>
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
}

// ============================================
// LOTO PDF Generator
// ============================================

export function generateLOTOPrintHTML(data: LOTOData): string {
  return `
    <div class="print-header">
      <div>
        <h1>LOCK OUT / TAG OUT PROCEDURE</h1>
        <h2>${data.equipmentTag} - ${data.equipmentName}</h2>
      </div>
      <div class="print-meta">
        ${data.procedureNumber ? `<div>Procedure: ${data.procedureNumber}</div>` : ''}
        ${data.revisionDate ? `<div>Date: ${data.revisionDate}</div>` : ''}
        ${data.drawingReference ? `<div>Drawing: ${data.drawingReference}</div>` : ''}
      </div>
    </div>
    
    ${data.scope ? `<p><strong>Scope:</strong> ${data.scope}</p>` : ''}
    
    <div class="section">
      <h3>⚠️ HAZARDS</h3>
      <ul>
        ${data.hazards.map(h => `<li>${h}</li>`).join('')}
      </ul>
    </div>
    
    <div class="section">
      <h3>🦺 REQUIRED PPE</h3>
      <ul>
        ${data.ppe.map(p => `<li><span class="checkbox"></span>${p}</li>`).join('')}
      </ul>
    </div>
    
    ${data.preIsolationChecks && data.preIsolationChecks.length > 0 ? `
    <div class="section">
      <h3>PRE-ISOLATION CHECKS</h3>
      <ol>
        ${data.preIsolationChecks.map(c => `<li><span class="checkbox"></span>${c}</li>`).join('')}
      </ol>
    </div>
    ` : ''}
    
    <div class="section">
      <h3>🔒 ISOLATION STEPS</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 50px">Step</th>
            <th>Isolation Point</th>
            <th>Action</th>
            <th>Verification</th>
          </tr>
        </thead>
        <tbody>
          ${data.isolationSteps.map(s => `
            <tr>
              <td>${s.step}</td>
              <td><strong>${s.point}</strong></td>
              <td>${s.action}</td>
              <td>${s.verification}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    ${data.verificationSteps && data.verificationSteps.length > 0 ? `
    <div class="section">
      <h3>✓ ZERO ENERGY VERIFICATION</h3>
      <ol>
        ${data.verificationSteps.map(s => `<li><span class="checkbox"></span>${s}</li>`).join('')}
      </ol>
    </div>
    ` : ''}
    
    ${data.reinstateSteps && data.reinstateSteps.length > 0 ? `
    <div class="section">
      <h3>🔓 REINSTATEMENT SEQUENCE</h3>
      <ol>
        ${data.reinstateSteps.map(s => `<li><span class="checkbox"></span>${s}</li>`).join('')}
      </ol>
    </div>
    ` : ''}
    
    <div class="signature-block">
      <h3>AUTHORIZATION</h3>
      <table style="border: none;">
        <tr>
          <td style="border: none; width: 50%;">
            <p><strong>Authorized by (Operations):</strong></p>
            <div class="signature-line"></div>
            <p style="font-size: 9pt; color: #666;">Name / Signature / Date</p>
          </td>
          <td style="border: none; width: 50%;">
            <p><strong>Acknowledged by (Maintenance):</strong></p>
            <div class="signature-line"></div>
            <p style="font-size: 9pt; color: #666;">Name / Signature / Date</p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

// ============================================
// Work Order PDF Generator
// ============================================

export function generateWorkOrderPrintHTML(data: WorkOrderData): string {
  const priorityLabels: Record<string, string> = {
    emergency: 'EMERGENCY',
    urgent: 'URGENT',
    normal: 'NORMAL',
    low: 'LOW'
  };
  
  const workTypeLabels: Record<string, string> = {
    corrective: 'Corrective Maintenance',
    preventive: 'Preventive Maintenance',
    inspection: 'Inspection',
    modification: 'Modification'
  };
  
  return `
    <div class="print-header">
      <div>
        <h1>WORK ORDER</h1>
        <h2>${data.equipmentTag}${data.equipmentName ? ` - ${data.equipmentName}` : ''}</h2>
      </div>
      <div class="print-meta">
        ${data.workOrderNumber ? `<div>WO#: ${data.workOrderNumber}</div>` : ''}
        <div>Date: ${data.requestedDate || new Date().toISOString().split('T')[0]}</div>
        <div class="badge badge-${data.priority === 'emergency' ? 'danger' : data.priority === 'urgent' ? 'warning' : 'info'}">
          ${priorityLabels[data.priority] || data.priority}
        </div>
      </div>
    </div>
    
    <div class="section">
      <table style="border: none;">
        <tr>
          <td style="border: none; width: 50%;"><strong>Work Type:</strong> ${workTypeLabels[data.workType] || data.workType}</td>
          <td style="border: none; width: 50%;"><strong>Priority:</strong> ${priorityLabels[data.priority] || data.priority}</td>
        </tr>
        <tr>
          <td style="border: none;"><strong>Target Date:</strong> ${data.targetDate || 'TBD'}</td>
          <td style="border: none;"><strong>Est. Hours:</strong> ${data.estimatedHours || 'TBD'}</td>
        </tr>
      </table>
    </div>
    
    <div class="section">
      <h3>Description</h3>
      <p>${data.description}</p>
    </div>
    
    ${data.symptoms ? `
    <div class="section">
      <h3>Symptoms / Problem</h3>
      <p>${data.symptoms}</p>
    </div>
    ` : ''}
    
    <div class="section">
      <table style="border: none;">
        <tr>
          <td style="border: none; vertical-align: top; width: 50%;">
            <h4>Required Parts</h4>
            ${data.requiredParts && data.requiredParts.length > 0 
              ? `<ul>${data.requiredParts.map(p => `<li>${p}</li>`).join('')}</ul>`
              : '<p style="color: #666;">None specified</p>'
            }
          </td>
          <td style="border: none; vertical-align: top; width: 50%;">
            <h4>Required Tools</h4>
            ${data.requiredTools && data.requiredTools.length > 0 
              ? `<ul>${data.requiredTools.map(t => `<li>${t}</li>`).join('')}</ul>`
              : '<p style="color: #666;">None specified</p>'
            }
          </td>
        </tr>
      </table>
    </div>
    
    <div class="section">
      <h3>Safety Requirements</h3>
      <p><strong>LOTO Required:</strong> ${data.lotoRequired ? 'YES' : 'NO'}</p>
      ${data.safetyRequirements && data.safetyRequirements.length > 0 
        ? `<ul>${data.safetyRequirements.map(s => `<li>${s}</li>`).join('')}</ul>`
        : ''
      }
    </div>
    
    ${data.notes ? `
    <div class="section">
      <h3>Notes</h3>
      <p>${data.notes}</p>
    </div>
    ` : ''}
    
    <div class="signature-block">
      <table style="border: none;">
        <tr>
          <td style="border: none; width: 33%;">
            <p><strong>Requested by:</strong></p>
            <div class="signature-line"></div>
          </td>
          <td style="border: none; width: 33%;">
            <p><strong>Approved by:</strong></p>
            <div class="signature-line"></div>
          </td>
          <td style="border: none; width: 33%;">
            <p><strong>Completed by:</strong></p>
            <div class="signature-line"></div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

// ============================================
// Checklist PDF Generator
// ============================================

export function generateChecklistPrintHTML(data: ChecklistData): string {
  const renderItems = (items: typeof data.items, depth = 0): string => {
    return items.map(item => `
      <div style="margin-left: ${depth * 20}px; margin-bottom: 8px;">
        <div style="display: flex; align-items: flex-start; gap: 8px;">
          <span class="checkbox"></span>
          <span>${item.text}</span>
          ${item.priority === 'high' ? '<span class="badge badge-warning">HIGH</span>' : ''}
        </div>
        ${item.reference ? `<div style="margin-left: 22px; font-size: 9pt; color: #666;">Ref: ${item.reference}</div>` : ''}
        ${item.subItems ? renderItems(item.subItems, depth + 1) : ''}
      </div>
    `).join('');
  };
  
  return `
    <div class="print-header">
      <div>
        <h1>${data.title}</h1>
        ${data.description ? `<p>${data.description}</p>` : ''}
      </div>
      <div class="print-meta">
        <div>Date: ${new Date().toISOString().split('T')[0]}</div>
        <div>${data.items.length} items</div>
      </div>
    </div>
    
    <div class="section">
      ${renderItems(data.items)}
    </div>
    
    ${data.references && data.references.length > 0 ? `
    <div class="section">
      <h3>References</h3>
      <ul>
        ${data.references.map(r => `<li>${r.manualName} - Page ${r.pageNumber}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    <div class="signature-block">
      <p><strong>Completed by:</strong></p>
      <div class="signature-line" style="width: 300px;"></div>
      <p style="font-size: 9pt; color: #666;">Name / Signature / Date</p>
    </div>
  `;
}

// ============================================
// Export Button Component
// ============================================

interface ExportButtonProps {
  type: UIType;
  data: unknown;
  variant?: 'icon' | 'button';
}

export function ExportButton({ type, data, variant = 'button' }: ExportButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleExport = useCallback(() => {
    let html = '';
    let title = 'Document';
    
    switch (type) {
      case 'loto_procedure':
        html = generateLOTOPrintHTML(data as LOTOData);
        title = `LOTO - ${(data as LOTOData).equipmentTag}`;
        break;
      case 'work_order':
        html = generateWorkOrderPrintHTML(data as WorkOrderData);
        title = `Work Order - ${(data as WorkOrderData).equipmentTag}`;
        break;
      case 'checklist':
        html = generateChecklistPrintHTML(data as ChecklistData);
        title = `Checklist - ${(data as ChecklistData).title}`;
        break;
      default:
        console.warn('Export not supported for type:', type);
        return;
    }
    
    // Create temporary element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    exportToPDF(tempDiv, { title, filename: title.replace(/\s+/g, '_') });
  }, [type, data]);
  
  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExport}
        className="text-white/50 hover:text-white"
      >
        <Download className="w-4 h-4" />
      </Button>
    );
  }
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="border-white/20 text-white/70 hover:bg-white/10"
    >
      <Download className="w-4 h-4 mr-1" />
      Export PDF
    </Button>
  );
}

export default ExportButton;

