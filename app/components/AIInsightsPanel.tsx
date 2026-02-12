'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Activity,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle,
  Clock,
  Target,
  Shield,
} from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'forecast' | 'alert' | 'recommendation' | 'anomaly';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affectedAssets: string[];
  suggestedActions: string[];
  confidence: number;
  timeframe?: string;
  createdAt: string;
}

const typeConfig = {
  forecast: { icon: TrendingUp, label: 'Forecast' },
  alert: { icon: AlertTriangle, label: 'Alert' },
  recommendation: { icon: Lightbulb, label: 'Recommendation' },
  anomaly: { icon: Activity, label: 'Anomaly' },
};

function InsightCard({ insight }: { insight: AIInsight }) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = typeConfig[insight.type];
  const TypeIcon = typeInfo.icon;
  
  // Muted styling - only critical gets color
  const isCritical = insight.severity === 'critical';
  const isWarning = insight.severity === 'warning';

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div
      className={`rounded-lg border overflow-hidden transition-all duration-300 ${
        isCritical ? 'border-rose-500/30 bg-rose-500/5' : 
        isWarning ? 'border-amber-500/20 bg-amber-500/5' : 
        'border-white/8 bg-white/[0.02]'
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-start gap-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className={`p-1.5 rounded ${isCritical ? 'bg-rose-500/20' : 'bg-white/5'}`}>
          <TypeIcon className={`h-4 w-4 ${isCritical ? 'text-rose-400' : 'text-white/50'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-medium uppercase tracking-wide ${
              isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-white/40'
            }`}>
              {typeInfo.label}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
              isCritical ? 'bg-rose-500/20 text-rose-400' : 
              isWarning ? 'bg-amber-500/20 text-amber-400' : 
              'bg-white/10 text-white/50'
            }`}>
              {insight.severity}
            </span>
            <span className="text-[10px] text-white/30 ml-auto flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {timeAgo(insight.createdAt)}
            </span>
          </div>
          <h4 className="font-medium text-white/90 text-sm leading-tight">
            {insight.title}
          </h4>
          <p className="text-xs text-white/40 mt-1 line-clamp-2">
            {insight.description}
          </p>
        </div>
        <div className="flex-shrink-0">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-white/30" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/30" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-white/5">
          {/* Affected Assets */}
          {insight.affectedAssets.length > 0 && (
            <div className="pt-3">
              <div className="flex items-center gap-2 text-[10px] text-white/40 mb-2 uppercase tracking-wide">
                <Target className="h-3 w-3" />
                Affected Assets
              </div>
              <div className="flex flex-wrap gap-1">
                {insight.affectedAssets.map((asset, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-white/5 text-xs text-white/60 border border-white/5"
                  >
                    {asset}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Actions */}
          {insight.suggestedActions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-[10px] text-white/40 mb-2 uppercase tracking-wide">
                <Shield className="h-3 w-3" />
                Mitigation
              </div>
              <ul className="space-y-1">
                {insight.suggestedActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                    <span className="text-white/30 mt-0.5">→</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confidence */}
          <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-[10px] text-white/30">
            <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
            {insight.timeframe && <span>{insight.timeframe}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/simulation?action=insights');
      const data = await response.json();
      if (data.success && data.insights) {
        setInsights(data.insights);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 15000);
    return () => clearInterval(interval);
  }, [fetchInsights]);

  const criticalCount = insights.filter(i => i.severity === 'critical').length;
  const warningCount = insights.filter(i => i.severity === 'warning').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-white/40" />
            <div>
              <h2 className="text-sm font-medium text-white/80">Grid Insights</h2>
              <p className="text-[10px] text-white/40">
                {insights.length} active • {criticalCount} critical
              </p>
            </div>
          </div>
          <button
            onClick={fetchInsights}
            disabled={isLoading}
            className="p-1.5 rounded text-white/30 hover:text-white/60 hover:bg-white/5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Quick Stats - only show if there are issues */}
        {(criticalCount > 0 || warningCount > 0) && (
          <div className="flex gap-2 mt-2">
            {criticalCount > 0 && (
              <span className="text-[10px] text-rose-400">
                {criticalCount} Critical
              </span>
            )}
            {criticalCount > 0 && warningCount > 0 && (
              <span className="text-white/20">•</span>
            )}
            {warningCount > 0 && (
              <span className="text-[10px] text-amber-400">
                {warningCount} Warning
              </span>
            )}
          </div>
        )}
      </div>

      {/* Insights List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {insights.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <CheckCircle className="h-8 w-8 text-white/20 mb-3" />
            <h3 className="text-sm font-medium text-white/60 mb-1">All Clear</h3>
            <p className="text-xs text-white/30 max-w-[180px]">
              No issues detected. Monitoring grid.
            </p>
            {lastUpdate && (
              <p className="text-[10px] text-white/20 mt-3">
                Last checked: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        ) : (
          insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))
        )}
      </div>
    </div>
  );
}
