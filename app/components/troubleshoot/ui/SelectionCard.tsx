'use client';

import { useState } from "react";
import { Check, ChevronRight, FileText, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SelectionData, SelectionOption } from "../types";

interface SelectionCardProps {
  data: SelectionData;
  onSelect: (option: SelectionOption) => void;
  onFreeText?: (text: string) => void;
}

export function SelectionCard({ data, onSelect, onFreeText }: SelectionCardProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [freeText, setFreeText] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleOptionClick = (option: SelectionOption) => {
    if (data.multiSelect) {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(option.id)) {
        newSelected.delete(option.id);
      } else {
        newSelected.add(option.id);
      }
      setSelectedIds(newSelected);
    } else {
      onSelect(option);
    }
  };

  const handleFreeTextSubmit = () => {
    if (freeText.trim() && onFreeText) {
      onFreeText(freeText.trim());
    }
  };

  return (
    <div className="w-full font-['Suisse_Intl',sans-serif]">
      {/* Question Header - NexusBlack style */}
      <div className="mb-5">
        <h3 className="text-base font-medium text-[var(--nxb-text-primary)] leading-relaxed">
          {data.question}
        </h3>
        {data.options.length > 2 && (
          <p className="text-xs text-[var(--nxb-text-muted)] mt-1.5 font-['PP_Supply_Mono',monospace]">
            {data.options.length} OPTIONS AVAILABLE
          </p>
        )}
      </div>

      {/* Options - NexusBlack card style */}
      <div className="space-y-2">
        {data.options.map((option, index) => {
          const isSelected = selectedIds.has(option.id);
          const isHovered = hoveredId === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => setHoveredId(option.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                "relative group w-full text-left transition-all duration-200",
                "rounded-lg border",
                "p-3",
                isSelected
                  ? "bg-[var(--nxb-brand-purple-10)] border-[var(--nxb-brand-purple)]"
                  : isHovered
                    ? "bg-[var(--nxb-surface-10)] border-[var(--nxb-brand-purple)]/50"
                    : "bg-[var(--nxb-surface-5)] border-white/10 hover:border-white/20"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Index number - monospace style */}
                <div className={cn(
                  "w-6 h-6 rounded flex items-center justify-center shrink-0",
                  "font-['PP_Supply_Mono',monospace] text-xs font-medium",
                  "transition-colors",
                  isSelected || isHovered
                    ? "bg-[var(--nxb-brand-purple)] text-white"
                    : "bg-[var(--nxb-surface-10)] text-[var(--nxb-text-muted)]"
                )}>
                  {data.multiSelect && isSelected ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="font-medium text-sm text-[var(--nxb-text-primary)]">
                    {option.title}
                  </div>
                  
                  {option.subtitle && (
                    <p className="text-xs text-[var(--nxb-text-secondary)] mt-0.5 leading-relaxed">
                      {option.subtitle}
                    </p>
                  )}

                  {option.drawingNumber && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <FileText className="w-3 h-3 text-[var(--nxb-text-muted)]" />
                      <span className="text-[10px] text-[var(--nxb-text-muted)] font-['PP_Supply_Mono',monospace]">
                        {option.drawingNumber}
                      </span>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                {!data.multiSelect && (
                  <ChevronRight className={cn(
                    "w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 transition-all",
                    isHovered 
                      ? "text-[var(--nxb-brand-purple)] translate-x-0.5" 
                      : "text-[var(--nxb-text-muted)]"
                  )} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Multi-select confirm */}
      {data.multiSelect && selectedIds.size > 0 && (
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => {
              const selected = data.options.filter(o => selectedIds.has(o.id));
              selected.forEach(onSelect);
            }}
            size="sm"
            className="bg-[var(--nxb-brand-purple)] hover:bg-[var(--nxb-brand-purple-light)] text-white font-medium"
          >
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Confirm ({selectedIds.size})
          </Button>
        </div>
      )}

      {/* Free text input */}
      {data.allowFreeText && (
        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-xs text-[var(--nxb-text-muted)] mb-2 font-['PP_Supply_Mono',monospace]">
            OR DESCRIBE YOUR ISSUE
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--nxb-text-muted)]" />
              <Input
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFreeTextSubmit()}
                placeholder="Describe the problem..."
                className="pl-9 h-9 text-sm bg-[var(--nxb-surface-5)] border-white/10 text-[var(--nxb-text-primary)] placeholder:text-[var(--nxb-text-muted)] rounded-lg focus:border-[var(--nxb-brand-purple)] focus:ring-1 focus:ring-[var(--nxb-brand-purple)]/20"
              />
            </div>
            <Button
              onClick={handleFreeTextSubmit}
              disabled={!freeText.trim()}
              size="sm"
              className="h-9 px-3 bg-[var(--nxb-brand-purple)] hover:bg-[var(--nxb-brand-purple-light)] disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectionCard;
