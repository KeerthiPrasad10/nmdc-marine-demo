import { Table, ArrowUpDown, ArrowUp, ArrowDown, Download, Copy, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { DataTableData, DataTableColumn, DataTableRow } from "../types";

// ============================================
// Cell Renderer
// ============================================

function renderCell(value: unknown, type?: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-[var(--nxb-text-muted)]">—</span>;
  }

  switch (type) {
    case 'currency':
      const num = typeof value === 'number' ? value : parseFloat(String(value));
      return isNaN(num) ? String(value) : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    case 'number':
      const numVal = typeof value === 'number' ? value : parseFloat(String(value));
      return isNaN(numVal) ? String(value) : numVal.toLocaleString();
    
    case 'date':
      try {
        const date = new Date(String(value));
        return date.toLocaleDateString();
      } catch {
        return String(value);
      }
    
    case 'boolean':
      return value ? (
        <span className="inline-flex items-center gap-1 text-emerald-400">
          <Check className="w-3 h-3" /> Yes
        </span>
      ) : (
        <span className="text-[var(--nxb-text-muted)]">No</span>
      );
    
    default:
      return String(value);
  }
}

// ============================================
// Data Table Component
// ============================================

interface DataTableProps {
  data: DataTableData;
  onExport?: (format: 'csv' | 'json' | 'pdf') => void;
}

export function DataTable({ data, onExport }: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [copied, setCopied] = useState(false);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sortColumn) return data.rows;
    
    return [...data.rows].sort((a, b) => {
      const aVal = a.cells[sortColumn];
      const bVal = b.cells[sortColumn];
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data.rows, sortColumn, sortDirection]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleCopyTable = async () => {
    const headers = data.columns.map(c => c.label).join('\t');
    const rows = sortedRows.map(row => 
      data.columns.map(col => String(row.cells[col.key] ?? '')).join('\t')
    ).join('\n');
    const tableText = `${headers}\n${rows}`;
    
    await navigator.clipboard.writeText(tableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    const headers = data.columns.map(c => `"${c.label}"`).join(',');
    const rows = sortedRows.map(row => 
      data.columns.map(col => {
        const val = row.cells[col.key];
        return val === null || val === undefined ? '' : `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="font-['Suisse_Intl',sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-[var(--nxb-brand-purple)]" />
          <h3 className="text-sm font-semibold text-[var(--nxb-text-primary)]">{data.title}</h3>
          <span className="text-[10px] text-[var(--nxb-text-muted)] font-['PP_Supply_Mono',monospace]">
            ({sortedRows.length} rows)
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyTable}
            className="p-1.5 rounded hover:bg-[var(--nxb-surface-10)] transition-colors text-[var(--nxb-text-muted)] hover:text-[var(--nxb-text-primary)]"
            title="Copy table"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleExportCSV}
            className="p-1.5 rounded hover:bg-[var(--nxb-surface-10)] transition-colors text-[var(--nxb-text-muted)] hover:text-[var(--nxb-text-primary)]"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {data.description && (
        <p className="text-xs text-[var(--nxb-text-secondary)] mb-3">
          {data.description}
        </p>
      )}

      {/* Table */}
      <div className="rounded-lg border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--nxb-surface-5)]">
                {data.columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-3 py-2 text-left text-[10px] font-medium text-[var(--nxb-text-muted)] uppercase tracking-wide font-['PP_Supply_Mono',monospace]",
                      column.sortable !== false && "cursor-pointer hover:bg-[var(--nxb-surface-10)] transition-colors"
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      <span>{column.label}</span>
                      {column.sortable !== false && (
                        <span className="text-[var(--nxb-text-muted)]">
                          {sortColumn === column.key ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {sortedRows.map((row) => (
                <tr 
                  key={row.id}
                  className="hover:bg-[var(--nxb-surface-5)] transition-colors"
                >
                  {data.columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-3 py-2 text-sm text-[var(--nxb-text-secondary)]",
                        column.type === 'number' || column.type === 'currency' ? 'text-right font-["PP_Supply_Mono",monospace]' : ''
                      )}
                    >
                      {renderCell(row.cells[column.key], column.type)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            
            {/* Summary row */}
            {data.summary && (
              <tfoot>
                <tr className="bg-[var(--nxb-surface-10)] border-t border-white/[0.08]">
                  <td className="px-3 py-2 text-sm font-semibold text-[var(--nxb-text-primary)]">
                    {data.summary.label}
                  </td>
                  {data.columns.slice(1).map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-3 py-2 text-sm font-semibold text-[var(--nxb-text-primary)]",
                        column.type === 'number' || column.type === 'currency' ? 'text-right font-["PP_Supply_Mono",monospace]' : ''
                      )}
                    >
                      {data.summary?.values[column.key] !== undefined 
                        ? renderCell(data.summary.values[column.key], column.type)
                        : ''
                      }
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

export default DataTable;



