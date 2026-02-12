'use client';

import { Grid3X3, CheckCircle2, Star, ChevronRight, Info } from 'lucide-react';
import type { DecisionMatrixData, DecisionOption } from '../types';

interface DecisionMatrixProps {
  data: DecisionMatrixData;
  onOptionSelect?: (option: DecisionOption) => void;
}

export function DecisionMatrix({ data, onOptionSelect }: DecisionMatrixProps) {
  const title = data.title || 'Decision Analysis';

  const calculateTotalScore = (option: DecisionOption): number => {
    if (option.totalScore !== undefined) return option.totalScore;
    
    let total = 0;
    data.criteria.forEach(criterion => {
      const score = option.scores[criterion.id] || 0;
      const weight = criterion.weight || 1;
      total += score * weight;
    });
    return total;
  };

  const getScoreColor = (score: number, maxScore: number = 10): string => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-emerald-400 bg-emerald-500/20';
    if (percentage >= 60) return 'text-amber-400 bg-amber-500/20';
    if (percentage >= 40) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-rose-400 bg-rose-500/20';
  };

  const sortedOptions = [...data.options].sort((a, b) => 
    calculateTotalScore(b) - calculateTotalScore(a)
  );

  const recommendedOption = sortedOptions.find(o => o.recommended) || sortedOptions[0];

  return (
    <div className="decision-matrix rounded-xl bg-violet-500/10 border border-violet-500/30 overflow-hidden">
      <div className="p-4 border-b border-violet-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/20">
            <Grid3X3 className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-violet-400 font-semibold">{title}</h3>
            {data.description && (
              <p className="text-xs text-white/50 mt-0.5">{data.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5">
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                Option
              </th>
              {data.criteria.map(criterion => (
                <th 
                  key={criterion.id}
                  className="px-3 py-3 text-center text-xs font-medium text-white/50 uppercase tracking-wider"
                  title={criterion.description}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{criterion.name}</span>
                    {criterion.weight && criterion.weight !== 1 && (
                      <span className="text-[10px] text-white/30">×{criterion.weight}</span>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium text-violet-400 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedOptions.map((option, idx) => {
              const totalScore = calculateTotalScore(option);
              const isRecommended = option === recommendedOption;
              
              return (
                <tr 
                  key={option.id}
                  className={`
                    ${isRecommended ? 'bg-violet-500/10' : 'hover:bg-white/5'} 
                    cursor-pointer transition-colors
                  `}
                  onClick={() => onOptionSelect?.(option)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isRecommended && (
                        <Star className="w-4 h-4 text-violet-400 fill-violet-400" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${isRecommended ? 'text-white' : 'text-white/80'}`}>
                          {option.name}
                        </p>
                        {option.description && (
                          <p className="text-xs text-white/40 mt-0.5">{option.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  {data.criteria.map(criterion => {
                    const score = option.scores[criterion.id] || 0;
                    return (
                      <td key={criterion.id} className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium ${getScoreColor(score)}`}>
                          {score}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    <span className={`
                      inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-bold
                      ${isRecommended ? 'bg-violet-500/30 text-violet-300' : 'bg-white/10 text-white/70'}
                    `}>
                      {totalScore.toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(data.recommendation || recommendedOption) && (
        <div className="p-4 bg-violet-500/10 border-t border-violet-500/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs uppercase tracking-wider text-emerald-400/70 font-medium mb-1">
                Recommendation
              </h4>
              <p className="text-sm text-white/80">
                {data.recommendation || `Based on the analysis, **${recommendedOption.name}** is the recommended option with the highest score of ${calculateTotalScore(recommendedOption).toFixed(1)}.`}
              </p>
            </div>
            <button 
              onClick={() => onOptionSelect?.(recommendedOption)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
            >
              Apply <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {data.notes && (
        <div className="px-4 py-3 bg-white/5 border-t border-white/10">
          <div className="flex items-start gap-2 text-xs text-white/50">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>{data.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DecisionMatrix;




