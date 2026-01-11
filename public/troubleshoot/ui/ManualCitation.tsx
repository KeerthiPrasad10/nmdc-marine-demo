import { useState } from "react";
import { 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  FileText,
  Quote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ManualCitationData, ManualReference } from "../types";

interface ManualCitationProps {
  data: ManualCitationData;
  onPageClick?: (manualId: string, pageNumber: number) => void;
}

export function ManualCitation({ data, onPageClick }: ManualCitationProps) {
  const [expandedRef, setExpandedRef] = useState<number | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{data.title}</h3>
            <p className="text-sm text-white/60 mt-1 leading-relaxed">
              {data.summary}
            </p>
          </div>
        </div>
      </div>

      {/* References */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-white/50 mb-3 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Sources ({data.references.length})
        </h4>

        <div className="space-y-2">
          {data.references.map((ref, idx) => (
            <ReferenceCard
              key={idx}
              reference={ref}
              isExpanded={expandedRef === idx}
              onToggle={() => setExpandedRef(expandedRef === idx ? null : idx)}
              onPageClick={() => onPageClick?.(ref.manualId, ref.pageNumber)}
            />
          ))}
        </div>
      </div>

      {/* Full Content (if available) */}
      {data.fullContent && (
        <div className="border-t border-white/10">
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="w-full px-5 py-3 flex items-center justify-between text-sm text-white/60 hover:bg-white/5"
          >
            <span>Show full extracted content</span>
            {showFullContent ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {showFullContent && (
            <div className="px-5 pb-5">
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white/70 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                {data.fullContent}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Single reference card
interface ReferenceCardProps {
  reference: ManualReference;
  isExpanded: boolean;
  onToggle: () => void;
  onPageClick: () => void;
}

function ReferenceCard({ reference, isExpanded, onToggle, onPageClick }: ReferenceCardProps) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/10 overflow-hidden">
      {/* Reference header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-8 h-8 rounded bg-[#71717A]/20 flex items-center justify-center text-[#71717A] font-mono text-sm font-bold">
            {reference.pageNumber}
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {reference.manualName}
            </p>
            {reference.section && (
              <p className="text-xs text-white/40">{reference.section}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {reference.relevance && (
            <RelevanceBadge score={reference.relevance} />
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/40" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/10 pt-3">
          {reference.snippet && (
            <div className="mb-3">
              <div className="flex items-center gap-1.5 text-xs text-white/40 mb-1.5">
                <Quote className="w-3 h-3" />
                <span>Excerpt</span>
              </div>
              <p className="text-sm text-white/70 italic leading-relaxed bg-white/5 p-3 rounded-lg border-l-2 border-[#71717A]">
                "{reference.snippet}"
              </p>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white/70 hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              onPageClick();
            }}
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            View Page {reference.pageNumber}
          </Button>
        </div>
      )}
    </div>
  );
}

// Relevance score badge
function RelevanceBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  
  return (
    <div className={cn(
      "px-2 py-0.5 rounded text-xs font-medium",
      percentage >= 80 ? "bg-emerald-500/20 text-emerald-400" :
      percentage >= 60 ? "bg-amber-500/20 text-amber-400" :
      "bg-white/10 text-white/50"
    )}>
      {percentage}% match
    </div>
  );
}

export default ManualCitation;

