'use client';

import { Search, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import type { RCAData } from '../types';

interface RCACardProps {
  data: RCAData;
  onActionClick?: (action: string) => void;
}

export function RCACard({ data, onActionClick }: RCACardProps) {
  const title = data.title || 'Root Cause Analysis';
  const content = data.analysis || data.message || data.content || data.rootCause || '';
  const factors = data.factors || data.causes || [];
  const recommendations = data.recommendations || data.steps || [];

  const getSeverityStyle = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="rca-card rounded-xl bg-amber-500/10 border-l-4 border-amber-500 overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Search className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-amber-400 font-semibold">{title}</h3>
            {data.equipment && (
              <p className="text-xs text-white/50">Equipment: {data.equipment}</p>
            )}
          </div>
          {data.severity && (
            <span className={`text-xs px-2 py-1 rounded-full border uppercase font-medium ${getSeverityStyle(data.severity)}`}>
              {data.severity}
            </span>
          )}
        </div>

        {data.issue && (
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/40 mb-1">Reported Issue</p>
            <p className="text-sm text-white/80">{data.issue}</p>
          </div>
        )}

        {content && (
          <div className="prose prose-sm prose-invert max-w-none">
            <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          </div>
        )}

        {factors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-amber-400/70 font-medium flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              Contributing Factors
            </h4>
            <ul className="space-y-1.5">
              {factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>{String(factor)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="pt-3 border-t border-amber-500/20 space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-emerald-400/70 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Recommendations
            </h4>
            <ol className="space-y-2">
              {recommendations.map((rec, idx) => (
                <li 
                  key={idx} 
                  className="flex items-start gap-3 text-sm text-white/70 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                  onClick={() => onActionClick?.(`recommendation_${idx}`)}
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-medium">
                    {idx + 1}
                  </span>
                  <span className="flex-1">{String(rec)}</span>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-emerald-400 transition-colors" />
                </li>
              ))}
            </ol>
          </div>
        )}

        {data.confidence && (
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40">Analysis Confidence</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${data.confidence}%` }}
                  />
                </div>
                <span className="text-white/60 font-medium">{data.confidence}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RCACard;




