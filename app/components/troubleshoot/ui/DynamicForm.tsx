'use client';

import { FileText, Plus, Trash2, Download, Send, Calendar, DollarSign, Hash, Mail, Phone, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { DynamicFormData, FormSection, FormField, DataTableColumn, DataTableRow } from "../types";

// ============================================
// Form Field Component
// ============================================

interface FormFieldInputProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FormFieldInput({ field, value, onChange }: FormFieldInputProps) {
  const baseInputClass = "w-full px-3 py-2 text-sm bg-[var(--nxb-surface-5)] border border-white/[0.08] rounded-lg text-[var(--nxb-text-primary)] placeholder-[var(--nxb-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--nxb-brand-purple)] focus:border-[var(--nxb-brand-purple)]";

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={cn(baseInputClass, "min-h-[80px] resize-y")}
          required={field.required}
        />
      );

    case 'select':
      return (
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
          required={field.required}
        >
          <option value="">{field.placeholder || 'Select...'}</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );

    case 'checkbox':
      const checkboxLabel = field.label || field.placeholder || field.id || 'Option';
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-[var(--nxb-surface-5)] text-[var(--nxb-brand-purple)] focus:ring-[var(--nxb-brand-purple)]"
          />
          <span className="text-sm text-[var(--nxb-text-primary)]">
            {checkboxLabel}
          </span>
        </label>
      );

    case 'currency':
      return (
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nxb-text-muted)]" />
          <input
            type="number"
            value={String(value ?? '')}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            className={cn(baseInputClass, "pl-8 font-['PP_Supply_Mono',monospace]")}
            step="0.01"
            min="0"
            required={field.required}
          />
        </div>
      );

    case 'number':
      return (
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nxb-text-muted)]" />
          <input
            type="number"
            value={String(value ?? '')}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            className={cn(baseInputClass, "pl-8 font-['PP_Supply_Mono',monospace]")}
            min={field.validation?.min}
            max={field.validation?.max}
            required={field.required}
          />
        </div>
      );

    case 'date':
      return (
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nxb-text-muted)]" />
          <input
            type="date"
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className={cn(baseInputClass, "pl-8")}
            required={field.required}
          />
        </div>
      );

    case 'email':
      return (
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nxb-text-muted)]" />
          <input
            type="email"
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(baseInputClass, "pl-8")}
            required={field.required}
          />
        </div>
      );

    case 'phone':
      return (
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nxb-text-muted)]" />
          <input
            type="tel"
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(baseInputClass, "pl-8")}
            required={field.required}
          />
        </div>
      );

    default:
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseInputClass}
          required={field.required}
        />
      );
  }
}

// ============================================
// Form Section Component
// ============================================

interface FormSectionRendererProps {
  section: FormSection;
  values: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
}

function FormSectionRenderer({ section, values, onChange }: FormSectionRendererProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-lg border border-white/[0.08] overflow-hidden">
      <button
        type="button"
        onClick={() => section.collapsible && setCollapsed(!collapsed)}
        className={cn(
          "w-full px-4 py-3 flex items-center justify-between bg-[var(--nxb-surface-5)]",
          section.collapsible && "cursor-pointer hover:bg-[var(--nxb-surface-10)]"
        )}
      >
        <div>
          <h4 className="text-sm font-semibold text-[var(--nxb-text-primary)]">{section.title}</h4>
          {section.description && (
            <p className="text-xs text-[var(--nxb-text-muted)] mt-0.5">{section.description}</p>
          )}
        </div>
      </button>
      
      {!collapsed && (
        <div className="p-4 grid grid-cols-4 gap-4">
          {section.fields.map((field) => (
            <div 
              key={field.id} 
              className={cn(
                field.type === 'textarea' ? 'col-span-4' : '',
                field.colspan === 2 ? 'col-span-2' : '',
                field.colspan === 3 ? 'col-span-3' : '',
                field.colspan === 4 ? 'col-span-4' : '',
                !field.colspan && field.type !== 'textarea' ? 'col-span-2' : ''
              )}
            >
              {field.type !== 'checkbox' && (
                <label className="block text-xs text-[var(--nxb-text-muted)] mb-1.5">
                  {field.label}
                  {field.required && <span className="text-[var(--nxb-priority-1)] ml-0.5">*</span>}
                </label>
              )}
              <FormFieldInput
                field={field}
                value={values[field.id]}
                onChange={(val) => onChange(field.id, val)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Line Items Table Component
// ============================================

interface LineItemsProps {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  allowAdd?: boolean;
  allowRemove?: boolean;
  onRowsChange?: (rows: DataTableRow[]) => void;
}

function LineItemsTable({ columns, rows, allowAdd, allowRemove, onRowsChange }: LineItemsProps) {
  const handleCellChange = (rowIndex: number, columnKey: string, value: unknown) => {
    const newRows = [...rows];
    newRows[rowIndex] = {
      ...newRows[rowIndex],
      cells: { ...newRows[rowIndex].cells, [columnKey]: value }
    };
    onRowsChange?.(newRows);
  };

  const handleAddRow = () => {
    const newRow: DataTableRow = {
      id: `row-${Date.now()}`,
      cells: columns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {})
    };
    onRowsChange?.([...rows, newRow]);
  };

  const handleRemoveRow = (rowIndex: number) => {
    onRowsChange?.(rows.filter((_, i) => i !== rowIndex));
  };

  return (
    <div className="rounded-lg border border-white/[0.08] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--nxb-surface-5)]">
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-2 text-left text-[10px] font-medium text-[var(--nxb-text-muted)] uppercase tracking-wide font-['PP_Supply_Mono',monospace]">
                  {col.label}
                </th>
              ))}
              {allowRemove && <th className="w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((row, rowIndex) => (
              <tr key={row.id} className="hover:bg-[var(--nxb-surface-5)]">
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2">
                    <input
                      type={col.type === 'number' || col.type === 'currency' ? 'number' : 'text'}
                      value={String(row.cells[col.key] ?? '')}
                      onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                      className="w-full px-2 py-1 text-sm bg-transparent border border-transparent hover:border-white/[0.08] focus:border-[var(--nxb-brand-purple)] rounded text-[var(--nxb-text-primary)] focus:outline-none"
                    />
                  </td>
                ))}
                {allowRemove && (
                  <td className="px-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(rowIndex)}
                      className="p-1 rounded hover:bg-[var(--nxb-priority-1-bg)] text-[var(--nxb-text-muted)] hover:text-[var(--nxb-priority-1)]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {allowAdd && (
        <button
          type="button"
          onClick={handleAddRow}
          className="w-full px-4 py-2 text-xs text-[var(--nxb-text-muted)] hover:text-[var(--nxb-brand-purple)] hover:bg-[var(--nxb-surface-5)] transition-colors flex items-center justify-center gap-1 border-t border-white/[0.08]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Line Item
        </button>
      )}
    </div>
  );
}

// ============================================
// Dynamic Form Component
// ============================================

interface DynamicFormProps {
  data: DynamicFormData;
  onSubmit?: (values: Record<string, unknown>) => void;
  onExport?: () => void;
}

export function DynamicForm({ data, onSubmit, onExport }: DynamicFormProps) {
  // Early return for invalid data
  if (!data || typeof data !== 'object') {
    return (
      <div className="text-sm text-[var(--nxb-text-muted)] p-4">
        Invalid form data provided.
      </div>
    );
  }
  
  // Safely handle missing or malformed sections
  const sections = Array.isArray(data.sections) ? data.sections : [];
  
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    // Initialize with pre-filled values
    const initial: Record<string, unknown> = {};
    sections.forEach(section => {
      if (section?.fields && Array.isArray(section.fields)) {
        section.fields.forEach(field => {
          if (field?.value !== undefined) {
            initial[field.id] = field.value;
          }
        });
      }
    });
    return initial;
  });

  const [lineItems, setLineItems] = useState<DataTableRow[]>(data?.lineItems?.rows || []);

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ ...values, lineItems });
  };

  const formTypeLabels: Record<string, string> = {
    invoice: 'Invoice',
    quote: 'Quote',
    report: 'Report',
    rfp: 'RFP',
    custom: 'Form'
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-['Suisse_Intl',sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--nxb-brand-purple-10)] flex items-center justify-center">
            <FileText className="w-5 h-5 text-[var(--nxb-brand-purple)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-[var(--nxb-text-primary)]">{data.title}</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--nxb-brand-purple-10)] text-[var(--nxb-brand-purple)] font-['PP_Supply_Mono',monospace] uppercase">
                {formTypeLabels[data.formType] || data.formType}
              </span>
            </div>
            {data.description && (
              <p className="text-xs text-[var(--nxb-text-muted)]">{data.description}</p>
            )}
          </div>
        </div>

        {/* Metadata */}
        {data.metadata && (
          <div className="text-right space-y-0.5">
            {data.metadata.documentNumber && (
              <div className="text-xs font-['PP_Supply_Mono',monospace] text-[var(--nxb-text-muted)]">
                #{data.metadata.documentNumber}
              </div>
            )}
            {data.metadata.date && (
              <div className="text-xs text-[var(--nxb-text-muted)]">{data.metadata.date}</div>
            )}
            {data.metadata.status && (
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-[var(--nxb-surface-10)] text-[var(--nxb-text-secondary)]">
                {data.metadata.status}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Form Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <FormSectionRenderer
            key={section.id}
            section={section}
            values={values}
            onChange={handleFieldChange}
          />
        ))}
      </div>

      {/* Line Items */}
      {data.lineItems && (
        <div>
          <h4 className="text-xs text-[var(--nxb-text-muted)] font-['PP_Supply_Mono',monospace] uppercase tracking-wide mb-2">
            Line Items
          </h4>
          <LineItemsTable
            columns={data.lineItems.columns}
            rows={lineItems}
            allowAdd={data.lineItems.allowAdd}
            allowRemove={data.lineItems.allowRemove}
            onRowsChange={setLineItems}
          />
        </div>
      )}

      {/* Totals */}
      {data.totals && data.totals.length > 0 && (
        <div className="flex justify-end">
          <div className="w-64 space-y-1 border-t border-white/[0.08] pt-3">
            {data.totals.map((total, index) => (
              <div 
                key={index}
                className={cn(
                  "flex justify-between items-center px-3 py-1.5 rounded",
                  total.type === 'total' ? 'bg-[var(--nxb-surface-10)] font-semibold' : ''
                )}
              >
                <span className="text-sm text-[var(--nxb-text-secondary)]">{total.label}</span>
                <span className={cn(
                  "text-sm font-['PP_Supply_Mono',monospace]",
                  total.type === 'total' ? 'text-[var(--nxb-text-primary)]' : 'text-[var(--nxb-text-secondary)]',
                  total.type === 'discount' ? 'text-emerald-400' : ''
                )}>
                  {total.type === 'discount' && '-'}
                  ${total.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={() => {
            console.log('Export clicked, handler:', !!onExport);
            if (onExport) {
              onExport();
            } else {
              alert('Export functionality not available');
            }
          }}
          className="px-3 py-2 text-sm text-[var(--nxb-text-secondary)] hover:text-[var(--nxb-text-primary)] hover:bg-[var(--nxb-surface-5)] rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
        <button
          type="submit"
          onClick={() => console.log('Submit clicked, current values:', values)}
          className="px-4 py-2 text-sm font-medium bg-[var(--nxb-brand-purple)] hover:bg-[var(--nxb-brand-purple-dark)] text-white rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          Submit
        </button>
      </div>
    </form>
  );
}

export default DynamicForm;



