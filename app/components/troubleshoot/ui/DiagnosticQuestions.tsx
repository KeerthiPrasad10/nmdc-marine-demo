'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, HelpCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiagnosticOption {
  id: string;
  label: string;
}

interface DiagnosticQuestion {
  id: string;
  question: string;
  options: DiagnosticOption[];
}

export interface DiagnosticQuestionsData {
  title: string;
  description?: string;
  questions: DiagnosticQuestion[];
}

interface DiagnosticQuestionsProps {
  data: DiagnosticQuestionsData;
  onSubmit?: (messageForAI: string, displayMessage: string) => void;
}

export function DiagnosticQuestions({ data, onSubmit }: DiagnosticQuestionsProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});

  const toggleOption = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => {
      const current = prev[questionId] || [];
      const isSelected = current.includes(optionId);
      
      return {
        ...prev,
        [questionId]: isSelected
          ? current.filter(id => id !== optionId)
          : [...current, optionId]
      };
    });
  };

  const handleSubmit = () => {
    if (onSubmit) {
      // Format answers for display (clean, readable)
      const displayLines: string[] = [];
      // Format answers for AI (with full context)
      const aiLines: string[] = [];
      
      data.questions.forEach(question => {
        const selectedOptionIds = selectedAnswers[question.id] || [];
        if (selectedOptionIds.length > 0) {
          const selectedLabels = selectedOptionIds
            .map(optId => question.options.find(o => o.id === optId)?.label)
            .filter(Boolean);
          
          // For display: clean bullet points
          displayLines.push(`• ${selectedLabels.join(', ')}`);
          
          // For AI: include question context
          const questionSummary = question.question.split('?')[0].split('-')[0].trim();
          aiLines.push(`${questionSummary}: ${selectedLabels.join(', ')}`);
        }
      });
      
      // What the user sees - simple bullet list
      const displayMessage = `Diagnostic observations:\n${displayLines.join('\n')}`;
      
      // What gets sent to the AI (includes full instructions)
      const messageForAI = `DIAGNOSTIC INSPECTION COMPLETE - GENERATE WORK ORDER

Observed Symptoms:
${aiLines.join('\n')}

ACTION REQUIRED: Generate a corrective maintenance WORK ORDER (type: work_order) including:
- Equipment tag and description
- Root cause analysis based on the symptoms above
- Step-by-step repair procedure
- Required replacement parts with part numbers if available
- Tools needed
- Safety requirements and LOTO if applicable
- Estimated repair time

Output format: work_order`;
      
      onSubmit(messageForAI, displayMessage);
    }
  };

  const hasAnySelection = Object.values(selectedAnswers).some(arr => arr.length > 0);

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{data.title}</h3>
            {data.description && (
              <p className="text-sm text-white/60 mt-1 leading-relaxed">
                {data.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="p-4 space-y-6">
        {data.questions.map((question, qIndex) => (
          <div key={question.id} className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white/70 shrink-0">
                {qIndex + 1}
              </span>
              <p className="text-sm font-medium text-white leading-relaxed">
                {question.question}
              </p>
            </div>
            
            <div className="ml-8 space-y-2">
              {question.options.map(option => {
                const isSelected = (selectedAnswers[question.id] || []).includes(option.id);
                
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleOption(question.id, option.id)}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg text-left text-sm transition-all duration-200",
                      "flex items-center gap-3 group",
                      isSelected
                        ? "bg-blue-500/20 border border-blue-500/40 text-white"
                        : "bg-white/[0.03] border border-white/10 text-white/70 hover:bg-white/[0.06] hover:border-white/20"
                    )}
                  >
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-white/30 group-hover:text-white/50 shrink-0" />
                    )}
                    <span className={isSelected ? "text-white" : ""}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="p-4 border-t border-white/10 bg-white/[0.02]">
        <button
          onClick={handleSubmit}
          disabled={!hasAnySelection}
          className={cn(
            "w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200",
            "flex items-center justify-center gap-2",
            hasAnySelection
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-white/10 text-white/40 cursor-not-allowed"
          )}
        >
          <Send className="w-4 h-4" />
          Submit Answers
        </button>
        <p className="text-xs text-white/40 text-center mt-2">
          Select all that apply for each question
        </p>
      </div>
    </div>
  );
}

export default DiagnosticQuestions;

