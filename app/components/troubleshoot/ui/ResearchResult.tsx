'use client';

import { BookOpen, FileText, ExternalLink, ChevronDown, ChevronUp, Sparkles, ArrowRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ResearchResultData, ResearchCitation } from "../types";
import ReactMarkdown from 'react-markdown';

// ============================================
// Citation Card Component
// ============================================

interface CitationCardProps {
  citation: ResearchCitation;
  index: number;
}

function CitationCard({ citation, index }: CitationCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[var(--nxb-surface-5)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--nxb-surface-10)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-[var(--nxb-brand-purple)] bg-[var(--nxb-brand-purple-10)] px-1.5 py-0.5 rounded font-['PP_Supply_Mono',monospace]">
            [{index + 1}]
          </span>
          <span className="text-xs text-[var(--nxb-text-secondary)]">{citation.source}</span>
          {citation.page && (
            <span className="text-[10px] text-[var(--nxb-text-muted)] font-['PP_Supply_Mono',monospace]">
              p.{citation.page}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-3 h-3 text-[var(--nxb-text-muted)]" />
        ) : (
          <ChevronDown className="w-3 h-3 text-[var(--nxb-text-muted)]" />
        )}
      </button>
      
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-white/[0.08]">
          {citation.section && (
            <div className="text-[10px] text-[var(--nxb-brand-purple)] mb-1 font-medium">
              {citation.section}
            </div>
          )}
          <blockquote className="text-xs text-[var(--nxb-text-secondary)] italic border-l-2 border-[var(--nxb-brand-purple)]/30 pl-2">
            "{citation.excerpt}"
          </blockquote>
          {citation.confidence && (
            <div className="mt-2 flex items-center gap-1">
              <div className="h-1 flex-1 bg-[var(--nxb-surface-10)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--nxb-brand-purple)]" 
                  style={{ width: `${citation.confidence * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-[var(--nxb-text-muted)] font-['PP_Supply_Mono',monospace]">
                {Math.round(citation.confidence * 100)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Research Result Component
// ============================================

interface ResearchResultProps {
  data: ResearchResultData;
  onRelatedTopicClick?: (topic: string) => void;
}

export function ResearchResult({ data, onRelatedTopicClick }: ResearchResultProps) {
  const [showAllCitations, setShowAllCitations] = useState(false);
  
  const visibleCitations = showAllCitations ? data.citations : data.citations.slice(0, 3);
  const hasMoreCitations = data.citations.length > 3;

  return (
    <div className="space-y-4 font-['Suisse_Intl',sans-serif]">
      {/* Question header */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-[var(--nxb-brand-purple-10)] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[var(--nxb-brand-purple)]" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-[var(--nxb-text-muted)] font-['PP_Supply_Mono',monospace] mb-0.5 uppercase tracking-wide">
            Question
          </div>
          <div className="text-sm font-medium text-[var(--nxb-text-primary)]">
            {data.question}
          </div>
        </div>
        {data.confidence && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--nxb-surface-5)] border border-white/[0.08]">
            <span className="text-[10px] text-[var(--nxb-text-muted)] font-['PP_Supply_Mono',monospace]">
              {Math.round(data.confidence * 100)}% confident
            </span>
          </div>
        )}
      </div>

      {/* Summary (if present) */}
      {data.summary && (
        <div className="px-4 py-3 rounded-lg bg-[var(--nxb-brand-purple-10)] border border-[var(--nxb-brand-purple)]/20">
          <div className="text-[10px] text-[var(--nxb-brand-purple)] font-['PP_Supply_Mono',monospace] mb-1 uppercase tracking-wide">
            Summary
          </div>
          <p className="text-sm text-[var(--nxb-text-primary)] leading-relaxed">
            {data.summary}
          </p>
        </div>
      )}

      {/* Main answer */}
      <div className="rounded-lg border border-white/[0.08] bg-[var(--nxb-surface-5)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-[var(--nxb-text-muted)]" />
          <span className="text-[10px] text-[var(--nxb-text-muted)] font-['PP_Supply_Mono',monospace] uppercase tracking-wide">
            Answer
          </span>
        </div>
        <div className="prose prose-invert prose-sm max-w-none text-[var(--nxb-text-secondary)] leading-relaxed
          [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-[var(--nxb-text-primary)] [&_h1]:mt-4 [&_h1]:mb-2
          [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-[var(--nxb-text-primary)] [&_h2]:mt-3 [&_h2]:mb-2
          [&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-[var(--nxb-text-primary)] [&_h3]:mt-2 [&_h3]:mb-1
          [&_p]:mb-2 [&_ul]:my-2 [&_ol]:my-2
          [&_li]:text-[var(--nxb-text-secondary)]
          [&_strong]:text-[var(--nxb-text-primary)] [&_strong]:font-semibold
          [&_code]:text-[var(--nxb-brand-purple)] [&_code]:bg-[var(--nxb-brand-purple-10)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
        ">
          <ReactMarkdown>{data.answer}</ReactMarkdown>
        </div>
      </div>

      {/* Citations */}
      {data.citations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--nxb-text-muted)]" />
              <span className="text-[10px] text-[var(--nxb-text-muted)] font-['PP_Supply_Mono',monospace] uppercase tracking-wide">
                Sources ({data.citations.length})
              </span>
            </div>
            {hasMoreCitations && (
              <button
                onClick={() => setShowAllCitations(!showAllCitations)}
                className="text-[10px] text-[var(--nxb-brand-purple)] hover:underline font-['PP_Supply_Mono',monospace]"
              >
                {showAllCitations ? 'Show less' : `Show all ${data.citations.length}`}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {visibleCitations.map((citation, index) => (
              <CitationCard key={index} citation={citation} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Related topics */}
      {data.relatedTopics && data.relatedTopics.length > 0 && (
        <div className="pt-3 border-t border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="w-3 h-3 text-[var(--nxb-text-muted)]" />
            <span className="text-[10px] text-[var(--nxb-text-muted)] font-['PP_Supply_Mono',monospace] uppercase tracking-wide">
              Related Topics
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.relatedTopics.map((topic, index) => (
              <button
                key={index}
                onClick={() => onRelatedTopicClick?.(topic)}
                className="text-xs px-2.5 py-1 rounded-md bg-[var(--nxb-surface-10)] text-[var(--nxb-text-secondary)] hover:bg-[var(--nxb-brand-purple-10)] hover:text-[var(--nxb-brand-purple)] transition-colors cursor-pointer"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResearchResult;



