import { Info, Lightbulb, AlertCircle, CheckCircle, XCircle, Camera, Search, FileText, BookOpen, Target, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InfoMessageData, ErrorMessageData } from "../types";
import ReactMarkdown from 'react-markdown';

// Helper to parse RCA sections from the message
function parseRCASections(message: string): { type: 'kb' | 'rca' | 'recommendation' | 'text'; content: string }[] {
  const sections: { type: 'kb' | 'rca' | 'recommendation' | 'text'; content: string }[] = [];
  
  // Check if this looks like an RCA message
  if (message.includes('KNOWLEDGE BASE') || message.includes('ROOT CAUSE') || message.includes('RECOMMENDATION')) {
    const kbMatch = message.match(/📚\s*KNOWLEDGE BASE[^:]*:\s*([\s\S]*?)(?=🔍|💡|$)/i);
    const rcaMatch = message.match(/🔍\s*ROOT CAUSE ANALYSIS:\s*([\s\S]*?)(?=💡|$)/i);
    const recMatch = message.match(/💡\s*RECOMMENDATION:\s*([\s\S]*?)$/i);
    
    if (kbMatch) sections.push({ type: 'kb', content: kbMatch[1].trim() });
    if (rcaMatch) sections.push({ type: 'rca', content: rcaMatch[1].trim() });
    if (recMatch) sections.push({ type: 'recommendation', content: recMatch[1].trim() });
    
    if (sections.length > 0) return sections;
  }
  
  // Not an RCA message, return as plain text
  return [{ type: 'text', content: message }];
}

// ============================================
// Info Message Component - NexusBlack Style
// ============================================

interface InfoMessageProps {
  data: InfoMessageData;
  variant?: 'info' | 'success' | 'warning';
  onSuggestionClick?: (suggestion: string) => void;
}

export function InfoMessage({ data, variant = 'info', onSuggestionClick }: InfoMessageProps) {
  // Check if this is an RCA-style message
  const sections = parseRCASections(data.message);
  const isRCAMessage = sections.length > 1 || sections[0]?.type !== 'text';

  if (isRCAMessage) {
    // Render structured RCA format
    return (
      <div className="space-y-4 font-['Suisse_Intl',sans-serif]">
        {data.title && (
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-[var(--nxb-brand-purple)]" />
            <h3 className="text-base font-semibold text-[var(--nxb-text-primary)]">{data.title}</h3>
          </div>
        )}
        
        {sections.map((section, index) => {
          if (section.type === 'kb') {
            return (
              <div key={index} className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">Knowledge Base Search</span>
                </div>
                <div className="text-sm text-[var(--nxb-text-secondary)] leading-relaxed prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              </div>
            );
          }
          
          if (section.type === 'rca') {
            return (
              <div key={index} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">Root Cause Analysis</span>
                </div>
                <div className="text-sm text-[var(--nxb-text-secondary)] leading-relaxed prose prose-invert prose-sm max-w-none
                  [&_strong]:text-[var(--nxb-text-primary)] [&_strong]:font-semibold
                  [&_p]:mb-2 [&_ul]:mt-1 [&_li]:text-[var(--nxb-text-secondary)]">
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              </div>
            );
          }
          
          if (section.type === 'recommendation') {
            return (
              <div key={index} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Recommendation</span>
                </div>
                <div className="text-sm text-[var(--nxb-text-secondary)] leading-relaxed">
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              </div>
            );
          }
          
          return (
            <div key={index} className="text-sm text-[var(--nxb-text-secondary)] leading-relaxed">
              <ReactMarkdown>{section.content}</ReactMarkdown>
            </div>
          );
        })}
      </div>
    );
  }

  // Standard info message format
  const variants = {
    info: {
      bg: 'bg-[var(--nxb-surface-5)]',
      border: 'border-white/[0.08]',
      icon: Info,
      iconColor: 'text-[var(--nxb-brand-purple)]',
      titleColor: 'text-[var(--nxb-text-primary)]',
    },
    success: {
      bg: 'bg-[var(--nxb-status-new-bg)]',
      border: 'border-[var(--nxb-status-new)]/30',
      icon: CheckCircle,
      iconColor: 'text-[var(--nxb-status-new)]',
      titleColor: 'text-[var(--nxb-status-new)]',
    },
    warning: {
      bg: 'bg-[var(--nxb-priority-2-bg)]',
      border: 'border-[var(--nxb-priority-2)]/30',
      icon: AlertCircle,
      iconColor: 'text-[var(--nxb-priority-2)]',
      titleColor: 'text-[var(--nxb-priority-2)]',
    },
  };

  const v = variants[variant];
  const Icon = v.icon;

  return (
    <div className={cn(
      "rounded-lg border p-4 font-['Suisse_Intl',sans-serif]",
      v.bg,
      v.border
    )}>
      <div className="flex gap-3">
        {/* Icon */}
        <div className={cn("shrink-0 mt-0.5", v.iconColor)}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {data.title && (
            <h4 className={cn("font-medium text-sm mb-1", v.titleColor)}>
              {data.title}
            </h4>
          )}
          
          <div className="text-sm text-[var(--nxb-text-secondary)] leading-relaxed prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{data.message}</ReactMarkdown>
          </div>

          {/* Details list */}
          {data.details && Array.isArray(data.details) && data.details.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {data.details.map((detail, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2 text-xs text-[var(--nxb-text-muted)]"
                >
                  <span className="shrink-0 w-1 h-1 rounded-full bg-[var(--nxb-text-muted)] mt-1.5" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}
          {/* Handle details as string */}
          {data.details && typeof data.details === 'string' && (
            <p className="mt-3 text-xs text-[var(--nxb-text-muted)]">{data.details}</p>
          )}

          {/* Suggestions */}
          {data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.08]">
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--nxb-text-muted)] mb-2 font-['PP_Supply_Mono',monospace] tracking-wide">
                <Lightbulb className="w-3 h-3" />
                <span>SUGGESTIONS</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestionClick?.(suggestion)}
                    className="text-xs px-2.5 py-1 rounded-md bg-[var(--nxb-surface-10)] text-[var(--nxb-text-secondary)] hover:bg-[var(--nxb-brand-purple-10)] hover:text-[var(--nxb-brand-purple)] transition-colors cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Error Message Component - NexusBlack Style
// ============================================

interface ErrorMessageProps {
  data: ErrorMessageData;
}

export function ErrorMessage({ data }: ErrorMessageProps) {
  return (
    <div className="rounded-lg border bg-[var(--nxb-priority-1-bg)] border-[var(--nxb-priority-1)]/30 p-4 font-['Suisse_Intl',sans-serif]">
      <div className="flex gap-3">
        {/* Icon */}
        <div className="shrink-0 mt-0.5 text-[var(--nxb-priority-1)]">
          <XCircle className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {data.title && (
              <h4 className="font-medium text-sm text-[var(--nxb-priority-1)]">
                {data.title}
              </h4>
            )}
            {data.code && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--nxb-priority-1)]/20 text-[var(--nxb-priority-1)] font-['PP_Supply_Mono',monospace]">
                {data.code}
              </span>
            )}
          </div>
          
          <p className="text-sm text-[var(--nxb-text-secondary)] leading-relaxed">
            {data.message}
          </p>

          {data.suggestion && (
            <div className="mt-2.5 flex items-start gap-2 text-xs text-[var(--nxb-text-muted)]">
              <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--nxb-priority-2)]" />
              <span>{data.suggestion}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Welcome Message Component - NexusBlack Style
// ============================================

interface WelcomeMessageProps {
  onSuggestionClick?: (suggestion: string) => void;
}

export function WelcomeMessage({ onSuggestionClick }: WelcomeMessageProps) {
  const suggestions = [
    { icon: Camera, text: "Upload a photo", action: "Upload a photo of the issue" },
    { icon: Search, text: "Find equipment", action: "Find pump P-201" },
    { icon: FileText, text: "Generate LOTO", action: "Generate LOTO procedure" },
  ];

  return (
    <div className="py-16 px-6 font-['Suisse_Intl',sans-serif]">
      <div className="max-w-md mx-auto text-center">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-[var(--nxb-brand-purple)] flex items-center justify-center mx-auto mb-5">
          <Lightbulb className="w-6 h-6 text-white" />
        </div>
        
        {/* Title */}
        <h2 className="text-lg font-semibold text-[var(--nxb-text-primary)] mb-2">
          What can I help you resolve?
        </h2>
        
        {/* Description */}
        <p className="text-sm text-[var(--nxb-text-secondary)] mb-8 leading-relaxed">
          Upload a photo or describe your equipment issue. I'll search your P&IDs and manuals to help diagnose and fix the problem.
        </p>

        {/* Suggestion Cards */}
        <div className="grid grid-cols-3 gap-3">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <button
                key={suggestion.text}
                onClick={() => onSuggestionClick?.(suggestion.action)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-[var(--nxb-surface-5)] border border-white/[0.08] hover:bg-[var(--nxb-surface-10)] hover:border-[var(--nxb-brand-purple)]/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--nxb-surface-10)] flex items-center justify-center group-hover:bg-[var(--nxb-brand-purple-10)]">
                  <Icon className="w-4 h-4 text-[var(--nxb-text-muted)] group-hover:text-[var(--nxb-brand-purple)]" />
                </div>
                <span className="text-xs text-[var(--nxb-text-muted)] group-hover:text-[var(--nxb-text-primary)]">
                  {suggestion.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default InfoMessage;
