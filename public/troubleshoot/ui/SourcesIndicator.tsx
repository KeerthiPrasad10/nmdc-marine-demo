import { useState } from "react";
import { Database, FileText, ChevronDown, ChevronUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KnowledgeBaseSources } from "../types";

interface SourcesIndicatorProps {
  sources: KnowledgeBaseSources;
  className?: string;
}

export function SourcesIndicator({ sources, className }: SourcesIndicatorProps) {
  const [expanded, setExpanded] = useState(false);
  
  const hasPnidResults = sources.pnids.length > 0;
  const hasManualResults = sources.manuals.length > 0;
  const hasResults = hasPnidResults || hasManualResults;
  
  if (sources.searchedPnidCount === 0 && sources.searchedManualCount === 0) {
    return null; // No knowledge base configured
  }

  return (
    <div className={cn(
      "mb-3 font-['Suisse_Intl',sans-serif]",
      className
    )}>
      {/* Compact indicator bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all",
          "bg-[var(--nxb-surface-5)] border border-white/[0.08]",
          "hover:bg-[var(--nxb-surface-10)]",
          hasResults && "border-[var(--nxb-brand-purple)]/30"
        )}
      >
        <Search className="w-3.5 h-3.5 text-[var(--nxb-brand-purple)]" />
        
        <div className="flex-1 flex items-center gap-3">
          {/* Searched indicator */}
          <span className="text-[10px] text-[var(--nxb-text-muted)] font-['PP_Supply_Mono',monospace] tracking-wide">
            KNOWLEDGE BASE
          </span>
          
          {/* P&ID count */}
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-[var(--nxb-text-muted)]" />
            <span className={cn(
              "text-xs",
              hasPnidResults ? "text-[var(--nxb-brand-purple)]" : "text-[var(--nxb-text-muted)]"
            )}>
              {sources.searchedPnidCount} P&ID{sources.searchedPnidCount !== 1 ? 's' : ''}
              {hasPnidResults && (
                <span className="text-[var(--nxb-brand-purple)]"> ({sources.pnids.length} match{sources.pnids.length !== 1 ? 'es' : ''})</span>
              )}
            </span>
          </div>
          
          {/* Manual count */}
          <div className="flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-[var(--nxb-text-muted)]" />
            <span className={cn(
              "text-xs",
              hasManualResults ? "text-[var(--nxb-brand-purple)]" : "text-[var(--nxb-text-muted)]"
            )}>
              {sources.searchedManualCount} manual{sources.searchedManualCount !== 1 ? 's' : ''}
              {hasManualResults && (
                <span className="text-[var(--nxb-brand-purple)]"> ({sources.manuals.length} page{sources.manuals.length !== 1 ? 's' : ''})</span>
              )}
            </span>
          </div>
        </div>
        
        {hasResults && (
          expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-[var(--nxb-text-muted)]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[var(--nxb-text-muted)]" />
          )
        )}
      </button>
      
      {/* Expanded details */}
      {expanded && hasResults && (
        <div className="mt-2 p-3 rounded-lg bg-[var(--nxb-surface-5)] border border-white/[0.08] space-y-3">
          {/* P&ID matches */}
          {hasPnidResults && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Database className="w-3 h-3 text-[var(--nxb-brand-purple)]" />
                <span className="text-[10px] text-[var(--nxb-text-muted)] font-['PP_Supply_Mono',monospace] tracking-wide">
                  EQUIPMENT FOUND
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sources.pnids.slice(0, 6).map((item, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-1 rounded bg-[var(--nxb-brand-purple-10)] text-[var(--nxb-brand-purple)] font-['PP_Supply_Mono',monospace]"
                  >
                    {item.tag}
                  </span>
                ))}
                {sources.pnids.length > 6 && (
                  <span className="text-[10px] px-2 py-1 text-[var(--nxb-text-muted)]">
                    +{sources.pnids.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Manual matches */}
          {hasManualResults && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="w-3 h-3 text-[var(--nxb-brand-purple)]" />
                <span className="text-[10px] text-[var(--nxb-text-muted)] font-['PP_Supply_Mono',monospace] tracking-wide">
                  MANUAL REFERENCES
                </span>
              </div>
              <div className="space-y-1">
                {sources.manuals.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-[var(--nxb-text-secondary)] flex items-center gap-2"
                  >
                    <span className="text-[var(--nxb-text-muted)] font-['PP_Supply_Mono',monospace]">
                      p.{item.page}
                    </span>
                    <span className="truncate">{item.title}</span>
                  </div>
                ))}
                {sources.manuals.length > 3 && (
                  <span className="text-[10px] text-[var(--nxb-text-muted)]">
                    +{sources.manuals.length - 3} more pages
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SourcesIndicator;

