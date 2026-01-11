import { useState } from "react";
import { 
  CheckSquare, 
  Square, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  Download,
  BookOpen,
  Circle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ChecklistData, ChecklistItem } from "../types";

interface ChecklistCardProps {
  data: ChecklistData;
  onItemToggle?: (itemId: string, checked: boolean) => void;
  exportable?: boolean;
  onExport?: () => void;
}

export function ChecklistCard({ 
  data, 
  onItemToggle,
  exportable,
  onExport 
}: ChecklistCardProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    const isChecked = !newChecked.has(itemId);
    
    if (isChecked) {
      newChecked.add(itemId);
    } else {
      newChecked.delete(itemId);
    }
    
    setCheckedItems(newChecked);
    onItemToggle?.(itemId, isChecked);
  };

  const toggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const progress = data.items.length > 0 
    ? Math.round((checkedItems.size / data.items.length) * 100)
    : 0;

  return (
    <div className="rounded-lg bg-[var(--nxb-surface-5)] border border-white/[0.08] overflow-hidden font-['Suisse_Intl',sans-serif]">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[var(--nxb-brand-purple)]" />
              <h3 className="text-sm font-semibold text-[var(--nxb-text-primary)]">
                {data.title}
              </h3>
            </div>
            {data.description && (
              <p className="text-xs text-[var(--nxb-text-muted)] mt-1">{data.description}</p>
            )}
          </div>
          
          {/* Progress */}
          <div className="text-right shrink-0">
            <span className="text-lg font-bold text-[var(--nxb-text-primary)] font-['PP_Supply_Mono',monospace]">{progress}%</span>
            <p className="text-[10px] text-[var(--nxb-text-muted)] font-['PP_Supply_Mono',monospace]">
              {checkedItems.size}/{data.items.length}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-white/[0.08] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--nxb-brand-purple)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="p-3">
        <div className="space-y-0.5">
          {data.items.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              checked={checkedItems.has(item.id)}
              expanded={expandedItems.has(item.id)}
              onToggle={() => toggleItem(item.id)}
              onExpand={() => toggleExpand(item.id)}
              checkedItems={checkedItems}
              onItemToggle={toggleItem}
            />
          ))}
        </div>
      </div>

      {/* References */}
      {data.references && data.references.length > 0 && (
        <div className="px-4 py-2.5 border-t border-white/[0.08]">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--nxb-text-muted)] mb-1.5 font-['PP_Supply_Mono',monospace] tracking-wide">
            <BookOpen className="w-3 h-3" />
            <span>REFERENCES</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.references.map((ref, idx) => (
              <span 
                key={idx}
                className="text-[10px] px-2 py-1 rounded bg-[var(--nxb-surface-10)] text-[var(--nxb-text-muted)] font-['PP_Supply_Mono',monospace]"
              >
                {ref.manualName} p.{ref.pageNumber}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Export */}
      {exportable && (
        <div className="px-4 py-2.5 border-t border-white/[0.08] flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-[var(--nxb-text-muted)] hover:text-[var(--nxb-text-primary)] hover:bg-[var(--nxb-surface-10)]"
            onClick={onExport}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      )}
    </div>
  );
}

// Single checklist item
interface ChecklistItemRowProps {
  item: ChecklistItem;
  checked: boolean;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  checkedItems: Set<string>;
  onItemToggle: (id: string) => void;
  depth?: number;
}

function ChecklistItemRow({
  item,
  checked,
  expanded,
  onToggle,
  onExpand,
  checkedItems,
  onItemToggle,
  depth = 0
}: ChecklistItemRowProps) {
  const hasSubItems = item.subItems && item.subItems.length > 0;
  
  const priorityColors = {
    high: 'text-[var(--nxb-priority-1)]',
    medium: 'text-[var(--nxb-priority-2)]',
    low: 'text-[var(--nxb-text-muted)]'
  };
  
  return (
    <div className={cn(depth > 0 && "ml-5")}>
      <div 
        className={cn(
          "flex items-start gap-2.5 p-2 rounded-md transition-colors",
          checked ? "bg-[var(--nxb-status-new-bg)]" : "hover:bg-[var(--nxb-surface-10)]"
        )}
      >
        {/* Expand button or spacer */}
        {hasSubItems ? (
          <button 
            onClick={onExpand}
            className="shrink-0 p-0.5 text-[var(--nxb-text-muted)] hover:text-[var(--nxb-text-primary)]"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Checkbox */}
        <button 
          onClick={onToggle}
          className="shrink-0 mt-0.5"
        >
          {checked ? (
            <CheckSquare className="w-4 h-4 text-[var(--nxb-status-new)]" />
          ) : (
            <Square className="w-4 h-4 text-[var(--nxb-text-muted)]" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-xs leading-relaxed transition-colors",
            checked ? "text-[var(--nxb-text-muted)] line-through" : "text-[var(--nxb-text-primary)]"
          )}>
            {item.text}
          </p>
          
          {item.reference && (
            <span className="text-[10px] text-[var(--nxb-text-muted)] mt-0.5 font-['PP_Supply_Mono',monospace]">
              {item.reference}
            </span>
          )}
        </div>

        {/* Priority indicator */}
        {item.priority && (
          <div className={cn("shrink-0", priorityColors[item.priority])}>
            {item.priority === 'high' ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <Circle className="w-2 h-2 fill-current" />
            )}
          </div>
        )}
      </div>

      {/* Sub-items */}
      {hasSubItems && expanded && (
        <div className="mt-0.5">
          {item.subItems!.map((subItem) => (
            <ChecklistItemRow
              key={subItem.id}
              item={subItem}
              checked={checkedItems.has(subItem.id)}
              expanded={false}
              onToggle={() => onItemToggle(subItem.id)}
              onExpand={() => {}}
              checkedItems={checkedItems}
              onItemToggle={onItemToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ChecklistCard;
