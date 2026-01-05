'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Zap, 
  CloudRain, 
  AlertTriangle, 
  Anchor,
  Shield,
  Wrench,
  Clock,
  DollarSign,
  RefreshCw,
  Loader2,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  XCircle,
  Ship,
  Sparkles,
  Link2,
} from 'lucide-react';

interface ExternalFactor {
  id: string;
  type: 'weather' | 'geopolitical' | 'port' | 'maintenance' | 'regulatory' | 'insight';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  source?: string;
  sources?: string[];
  affectedRegions: string[];
  affectedVesselTypes?: string[];
  dateRange?: { start: string; end: string };
  recommendation: string;
  reasoning?: string;
  relatedFactors?: string[];
  // Actionable fields
  timeframe?: 'immediate' | 'near-term' | 'medium-term' | 'long-term';
  impact?: string;
  actions?: string[];
}

interface OptimizationSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  type: 'reschedule' | 'reroute' | 'reassign' | 'delay' | 'accelerate';
  title: string;
  description: string;
  affectedVessels: string[];
  affectedProjects: string[];
  estimatedImpact: {
    costDelta: number;
    timeDelta: number;
  };
  relatedFactors: string[];
}

interface ScheduleOptimizerProps {
  vessels: Array<{ id: string; name: string; type: string; project?: string; healthScore?: number }>;
  onOptimizationApplied?: (suggestion: OptimizationSuggestion) => void;
  onSuggestionHover?: (suggestion: OptimizationSuggestion | null) => void;
  selectedSuggestionId?: string | null;
}

const factorIcons: Record<string, typeof CloudRain> = {
  weather: CloudRain,
  geopolitical: Shield,
  port: Anchor,
  maintenance: Wrench,
  regulatory: AlertTriangle,
  insight: Sparkles,
};

const factorColors: Record<string, string> = {
  weather: 'text-sky-400',
  geopolitical: 'text-rose-400',
  port: 'text-amber-400',
  maintenance: 'text-orange-400',
  regulatory: 'text-violet-400',
  insight: 'text-emerald-400',
};

const severityColors: Record<string, string> = {
  critical: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  info: 'bg-white/10 text-white/60 border-white/10',
};

const priorityColors: Record<string, string> = {
  high: 'bg-rose-500/10 border-rose-500/30',
  medium: 'bg-amber-500/10 border-amber-500/30',
  low: 'bg-white/5 border-white/10',
};

const timeframeColors: Record<string, { bg: string; text: string; label: string }> = {
  immediate: { bg: 'bg-rose-500/20', text: 'text-rose-300', label: 'Act Now' },
  'near-term': { bg: 'bg-amber-500/20', text: 'text-amber-300', label: '1-2 Weeks' },
  'medium-term': { bg: 'bg-blue-500/20', text: 'text-blue-300', label: '1-3 Months' },
  'long-term': { bg: 'bg-white/10', text: 'text-white/50', label: '3+ Months' },
};

export function ScheduleOptimizer({ vessels, onOptimizationApplied, onSuggestionHover, selectedSuggestionId }: ScheduleOptimizerProps) {
  const [factors, setFactors] = useState<ExternalFactor[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const fetchOptimizations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/schedule-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vessels }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFactors(data.factors || []);
        setSuggestions(data.suggestions || []);
        setLastUpdated(new Date(data.generatedAt));
      }
    } catch (error) {
      console.error('Failed to fetch optimizations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [vessels]);

  useEffect(() => {
    fetchOptimizations();
  }, [fetchOptimizations]);

  const handleApplySuggestion = (suggestion: OptimizationSuggestion) => {
    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
    onOptimizationApplied?.(suggestion);
  };

  const criticalCount = factors.filter(f => f.severity === 'critical').length;
  const warningCount = factors.filter(f => f.severity === 'warning').length;

  return (
    <div className="h-full flex flex-col bg-black rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-white/50" />
            <h3 className="text-sm font-medium text-white">Schedule Optimizer</h3>
          </div>
          <button
            onClick={fetchOptimizations}
            disabled={isLoading}
            className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Status bar */}
        <div className="flex items-center gap-3 mt-2 text-[10px]">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 text-rose-400">
              <XCircle className="w-3 h-3" />
              {criticalCount} critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              {warningCount} warning
            </span>
          )}
          {lastUpdated && (
            <span className="text-white/30 ml-auto">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/40">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs">Analyzing external factors...</span>
          </div>
        ) : (
          <div className="p-3 space-y-4">
            {/* AI Insights - Cross-analyzed from multiple sources */}
            {factors.filter(f => f.type === 'insight').length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <h4 className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">
                    AI Insights
                  </h4>
                </div>
                <div className="space-y-2">
                  {factors.filter(f => f.type === 'insight').map(factor => {
                    const Icon = factorIcons[factor.type] || AlertTriangle;
                    const isExpanded = expandedFactor === factor.id;
                    
                    return (
                      <div
                        key={factor.id}
                        className="rounded-lg border bg-emerald-500/5 border-emerald-500/20"
                      >
                        <button
                          onClick={() => setExpandedFactor(isExpanded ? null : factor.id)}
                          className="w-full p-2.5 text-left"
                        >
                          <div className="flex items-start gap-2">
                            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-white">
                                  {factor.title}
                                </span>
                              </div>
                              {!isExpanded && (
                                <p className="text-[10px] text-white/40 mt-0.5 line-clamp-2">
                                  {factor.reasoning || factor.description}
                                </p>
                              )}
                            </div>
                            <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`} />
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="px-2.5 pb-2.5 pt-0 space-y-2">
                            {/* Timeframe Badge */}
                            {factor.timeframe && (
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${timeframeColors[factor.timeframe]?.bg} ${timeframeColors[factor.timeframe]?.text}`}>
                                  {timeframeColors[factor.timeframe]?.label}
                                </span>
                                {factor.affectedRegions.length > 0 && (
                                  <span className="text-[9px] text-white/30">
                                    {factor.affectedRegions.join(', ')}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Impact */}
                            {factor.impact && (
                              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                                <div className="text-[9px] text-emerald-400 uppercase tracking-wide mb-1">Impact</div>
                                <p className="text-[11px] text-white/80 font-medium leading-relaxed">
                                  {factor.impact}
                                </p>
                              </div>
                            )}
                            
                            {/* Actions */}
                            {factor.actions && factor.actions.length > 0 && (
                              <div className="p-2 rounded bg-white/5 border border-white/10">
                                <div className="text-[9px] text-white/40 uppercase tracking-wide mb-1.5">Actions Required</div>
                                <ul className="space-y-1.5">
                                  {factor.actions.map((action, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[10px] text-white/70">
                                      <span className="w-4 h-4 flex-shrink-0 rounded bg-emerald-500/20 flex items-center justify-center text-[8px] text-emerald-400 mt-0.5">
                                        {i + 1}
                                      </span>
                                      {action}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {factor.reasoning && (
                              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Link2 className="w-3 h-3 text-emerald-400" />
                                  <span className="text-[9px] font-medium text-emerald-400 uppercase tracking-wide">Cross-Analysis</span>
                                </div>
                                <p className="text-[10px] text-emerald-300/80 leading-relaxed">
                                  {factor.reasoning}
                                </p>
                              </div>
                            )}
                            
                            {factor.sources && factor.sources.length > 0 && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] text-white/30">Sources ({factor.sources.length}):</span>
                                {factor.sources.map((src, i) => {
                                  try {
                                    return (
                                      <a
                                        key={i}
                                        href={src}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60 transition-colors truncate"
                                      >
                                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                        {new URL(src).hostname}
                                      </a>
                                    );
                                  } catch {
                                    return null;
                                  }
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* External Factors */}
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-white/40 mb-2">
                Intelligence Feed ({factors.filter(f => f.type !== 'insight').length})
              </h4>
              <div className="space-y-2">
                {factors.filter(f => f.type !== 'insight').length === 0 ? (
                  <div className="text-center py-4 text-white/30 text-xs">
                    <CheckCircle className="w-5 h-5 mx-auto mb-1 text-white/20" />
                    No significant factors detected
                  </div>
                ) : (
                  factors.filter(f => f.type !== 'insight').map(factor => {
                    const Icon = factorIcons[factor.type] || AlertTriangle;
                    const isExpanded = expandedFactor === factor.id;
                    
                    return (
                      <div
                        key={factor.id}
                        className={`rounded-lg border transition-all ${severityColors[factor.severity]}`}
                      >
                        <button
                          onClick={() => setExpandedFactor(isExpanded ? null : factor.id)}
                          className="w-full p-2.5 text-left"
                        >
                          <div className="flex items-start gap-2">
                            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${factorColors[factor.type]}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-white truncate">
                                  {factor.title}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase ${
                                  factor.severity === 'critical' ? 'bg-rose-500/30 text-rose-300' :
                                  factor.severity === 'warning' ? 'bg-amber-500/30 text-amber-300' :
                                  'bg-white/10 text-white/50'
                                }`}>
                                  {factor.type}
                                </span>
                              </div>
                              {!isExpanded && (
                                <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">
                                  {factor.description}
                                </p>
                              )}
                            </div>
                            <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`} />
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="px-2.5 pb-2.5 pt-0 space-y-2">
                            {/* Timeframe Badge */}
                            {factor.timeframe && (
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${timeframeColors[factor.timeframe]?.bg} ${timeframeColors[factor.timeframe]?.text}`}>
                                  {timeframeColors[factor.timeframe]?.label}
                                </span>
                                {factor.affectedRegions.length > 0 && (
                                  <span className="text-[9px] text-white/30">
                                    {factor.affectedRegions.join(', ')}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Impact - Most Important */}
                            {factor.impact && (
                              <div className="p-2 rounded bg-white/5 border border-white/10">
                                <div className="text-[9px] text-white/40 uppercase tracking-wide mb-1">Impact</div>
                                <p className="text-[11px] text-white/80 font-medium leading-relaxed">
                                  {factor.impact}
                                </p>
                              </div>
                            )}
                            
                            {/* Actions - Concrete Steps */}
                            {factor.actions && factor.actions.length > 0 && (
                              <div className="p-2 rounded bg-white/5 border border-white/10">
                                <div className="text-[9px] text-white/40 uppercase tracking-wide mb-1.5">Actions Required</div>
                                <ul className="space-y-1.5">
                                  {factor.actions.map((action, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[10px] text-white/70">
                                      <span className="w-4 h-4 flex-shrink-0 rounded bg-white/10 flex items-center justify-center text-[8px] text-white/50 mt-0.5">
                                        {i + 1}
                                      </span>
                                      {action}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Reasoning chain for insights */}
                            {factor.reasoning && (
                              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Link2 className="w-3 h-3 text-emerald-400" />
                                  <span className="text-[9px] font-medium text-emerald-400 uppercase tracking-wide">Cross-Analysis</span>
                                </div>
                                <p className="text-[10px] text-emerald-300/80 leading-relaxed">
                                  {factor.reasoning}
                                </p>
                              </div>
                            )}
                            
                            {/* Multiple sources for insights */}
                            {factor.sources && factor.sources.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] text-white/30">Sources ({factor.sources.length}):</span>
                                {factor.sources.map((src, i) => {
                                  try {
                                    return (
                                      <a
                                        key={i}
                                        href={src}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60 transition-colors truncate"
                                      >
                                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                        {new URL(src).hostname}
                                      </a>
                                    );
                                  } catch {
                                    return null;
                                  }
                                })}
                              </div>
                            ) : factor.source && (
                              <a
                                href={factor.source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View source
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Optimization Suggestions */}
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-white/40 mb-2">
                Optimization Suggestions ({suggestions.length})
              </h4>
              <div className="space-y-2">
                {suggestions.length === 0 ? (
                  <div className="text-center py-4 text-white/30 text-xs">
                    <CheckCircle className="w-5 h-5 mx-auto mb-1 text-white/20" />
                    Schedule is optimized
                  </div>
                ) : (
                  suggestions.map(suggestion => {
                    const isApplied = appliedSuggestions.has(suggestion.id);
                    const isSelected = selectedSuggestionId === suggestion.id;
                    
                    return (
                      <div
                        key={suggestion.id}
                        className={`rounded-lg border p-3 transition-all ${
                          isApplied ? 'bg-white/5 border-white/10 opacity-60' : 
                          isSelected ? 'bg-white/10 border-white/30 ring-1 ring-white/20' :
                          priorityColors[suggestion.priority]
                        }`}
                        onMouseEnter={() => onSuggestionHover?.(suggestion)}
                        onMouseLeave={() => onSuggestionHover?.(null)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-medium ${
                                suggestion.priority === 'high' ? 'bg-rose-500/30 text-rose-300' :
                                suggestion.priority === 'medium' ? 'bg-amber-500/30 text-amber-300' :
                                'bg-white/10 text-white/50'
                              }`}>
                                {suggestion.priority}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 capitalize">
                                {suggestion.type}
                              </span>
                            </div>
                            <h5 className="text-xs font-medium text-white mt-1.5">
                              {suggestion.title}
                            </h5>
                          </div>
                        </div>
                        
                        <p className="text-[10px] text-white/50 mb-3">
                          {suggestion.description}
                        </p>
                        
                        {/* Impact metrics */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`flex items-center gap-1 text-[10px] ${
                            suggestion.estimatedImpact.costDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            <DollarSign className="w-3 h-3" />
                            {suggestion.estimatedImpact.costDelta >= 0 ? '+' : ''}
                            {(suggestion.estimatedImpact.costDelta / 1000).toFixed(0)}k
                          </div>
                          <div className={`flex items-center gap-1 text-[10px] ${
                            suggestion.estimatedImpact.timeDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {suggestion.estimatedImpact.timeDelta >= 0 ? '+' : ''}
                            {suggestion.estimatedImpact.timeDelta} days
                          </div>
                          {suggestion.affectedVessels.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-white/40">
                              <Ship className="w-3 h-3" />
                              {suggestion.affectedVessels.length} vessel(s)
                            </div>
                          )}
                        </div>
                        
                        {/* Action button */}
                        <button
                          onClick={() => handleApplySuggestion(suggestion)}
                          disabled={isApplied}
                          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            isApplied
                              ? 'bg-white/5 text-white/30 cursor-not-allowed'
                              : 'bg-white/10 hover:bg-white/15 text-white/80'
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              Applied
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5" />
                              Apply Optimization
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

