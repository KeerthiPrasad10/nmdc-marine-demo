'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Newspaper, 
  RefreshCw, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Clock,
  CloudRain,
  Anchor,
  Fuel,
  Shield,
  AlertTriangle,
  FileText,
  Leaf,
  Ship,
  Wrench,
  Globe,
  ChevronDown,
  ChevronRight,
  Zap,
  CheckCircle,
  Route,
  Timer,
  Bell,
  Eye,
} from 'lucide-react';
import type { NewsArticle, FleetImpact, RecommendedAction } from '@/app/api/news/route';

interface NewsPanelProps {
  maxArticles?: number;
  compact?: boolean;
}

// Impact categories with icons and colors
const IMPACT_CONFIG: Record<FleetImpact, { 
  icon: typeof Ship; 
  label: string; 
  color: string;
  bgColor: string;
}> = {
  weather_alert: { 
    icon: CloudRain, 
    label: 'Weather', 
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  port_disruption: { 
    icon: Anchor, 
    label: 'Ports', 
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
  },
  fuel_prices: { 
    icon: Fuel, 
    label: 'Fuel', 
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
  },
  regulatory: { 
    icon: FileText, 
    label: 'Regulatory', 
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  security: { 
    icon: Shield, 
    label: 'Security', 
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
  },
  environmental: { 
    icon: Leaf, 
    label: 'Environmental', 
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  incident: { 
    icon: AlertTriangle, 
    label: 'Incident', 
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
  },
  infrastructure: { 
    icon: Wrench, 
    label: 'Infrastructure', 
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
  },
  market: { 
    icon: TrendingUp, 
    label: 'Market', 
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
  },
  general: { 
    icon: Globe, 
    label: 'Industry', 
    color: 'text-white/50',
    bgColor: 'bg-white/10',
  },
};

const IMPACT_LEVEL_STYLES = {
  critical: { 
    bg: 'bg-red-500/20', 
    text: 'text-red-400', 
    border: 'border-red-500/50',
    pulse: true,
  },
  high: { 
    bg: 'bg-amber-500/20', 
    text: 'text-amber-400', 
    border: 'border-amber-500/30',
    pulse: false,
  },
  medium: { 
    bg: 'bg-blue-500/20', 
    text: 'text-blue-400', 
    border: 'border-blue-500/20',
    pulse: false,
  },
  low: { 
    bg: 'bg-white/5', 
    text: 'text-white/40', 
    border: 'border-white/10',
    pulse: false,
  },
};

const SENTIMENT_ICONS = {
  positive: { icon: TrendingUp, color: 'text-green-400' },
  negative: { icon: TrendingDown, color: 'text-red-400' },
  neutral: { icon: Minus, color: 'text-white/30' },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Action type icons and styles
const ACTION_CONFIG: Record<RecommendedAction['type'], {
  icon: typeof Ship;
  color: string;
  bgColor: string;
}> = {
  reroute: { icon: Route, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  delay: { icon: Timer, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  accelerate: { icon: Zap, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  standby: { icon: Anchor, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  fuel_adjust: { icon: Fuel, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  review: { icon: Eye, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  monitor: { icon: Eye, color: 'text-white/50', bgColor: 'bg-white/10' },
  alert_crew: { icon: Bell, color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

const PRIORITY_STYLES: Record<RecommendedAction['priority'], {
  label: string;
  color: string;
}> = {
  immediate: { label: 'Now', color: 'text-red-400' },
  today: { label: 'Today', color: 'text-amber-400' },
  this_week: { label: 'This Week', color: 'text-white/40' },
};

// Action card component
function ActionCard({ 
  action, 
  onApply 
}: { 
  action: RecommendedAction; 
  onApply: () => void;
}) {
  const config = ACTION_CONFIG[action.type];
  const priorityStyle = PRIORITY_STYLES[action.priority];
  const Icon = config.icon;
  
  return (
    <div className={`p-2 rounded border ${config.bgColor} border-white/10`}>
      <div className="flex items-start gap-2">
        <div className={`p-1 rounded ${config.bgColor}`}>
          <Icon className={`h-3 w-3 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-white font-medium leading-snug">
            {action.description}
          </p>
          {action.estimatedImpact && (
            <p className="text-[10px] text-white/50 mt-0.5">
              Impact: {action.estimatedImpact}
            </p>
          )}
          {action.affectedVessels && action.affectedVessels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {action.affectedVessels.slice(0, 3).map((v) => (
                <span key={v} className="text-[9px] text-blue-300 bg-blue-500/10 px-1 rounded">
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[9px] font-medium ${priorityStyle.color}`}>
            {priorityStyle.label}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApply();
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-medium ${config.bgColor} ${config.color} hover:brightness-125 transition-all`}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export function NewsPanel({ maxArticles = 20, compact = false }: NewsPanelProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImpact, setSelectedImpact] = useState<FleetImpact | 'all'>('all');
  const [meta, setMeta] = useState<{ cached?: boolean; fetchedAt?: string; stale?: boolean } | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [impactSummary, setImpactSummary] = useState<Record<string, { count: number; criticalCount: number }>>({});

  const fetchNews = useCallback(async (refresh = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        limit: maxArticles.toString(),
      });
      
      if (refresh) {
        params.append('refresh', 'true');
      }
      
      if (selectedImpact !== 'all') {
        params.append('impact', selectedImpact);
      }
      
      const response = await fetch(`/api/news?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setArticles(data.articles);
        setMeta({ cached: data.cached, fetchedAt: data.fetchedAt, stale: data.stale });
        if (data.impactSummary) {
          setImpactSummary(data.impactSummary);
        }
      } else {
        setError(data.error || 'Failed to fetch news');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
    } finally {
      setIsLoading(false);
    }
  }, [maxArticles, selectedImpact]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Count critical/high impact articles
  const criticalCount = articles.filter(a => a.impactLevel === 'critical').length;
  const highCount = articles.filter(a => a.impactLevel === 'high').length;

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className={`h-4 w-4 ${criticalCount > 0 ? 'text-red-400' : 'text-violet-400'}`} />
            <span className="text-sm font-medium text-white">Grid Intel</span>
            {criticalCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded animate-pulse">
                {criticalCount} critical
              </span>
            )}
          </div>
          <button
            onClick={() => fetchNews(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-white/40 hover:text-white/60 hover:bg-white/5 rounded transition-colors"
            title="Refresh news"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Status bar */}
        <div className="flex items-center gap-2 mt-1.5 text-[10px]">
          <span className={`px-1.5 py-0.5 rounded ${
            meta?.stale 
              ? 'bg-amber-500/20 text-amber-400'
              : meta?.cached 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-green-500/20 text-green-400'
          }`}>
            {meta?.stale ? 'Stale' : meta?.cached ? 'Cached' : 'Live'}
          </span>
          {meta?.fetchedAt && (
            <span className="text-white/30 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(meta.fetchedAt).toLocaleTimeString()}
            </span>
          )}
          {highCount > 0 && (
            <span className="text-amber-400">{highCount} high impact</span>
          )}
        </div>
      </div>

      {/* Impact Filter Pills */}
      {!compact && (
        <div className="flex-shrink-0 p-2 border-b border-white/5 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            <button
              onClick={() => setSelectedImpact('all')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                selectedImpact === 'all'
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              All ({articles.length})
            </button>
            {Object.entries(IMPACT_CONFIG)
              .filter(([key]) => impactSummary[key]?.count > 0)
              .map(([key, config]) => {
                const Icon = config.icon;
                const count = impactSummary[key]?.count || 0;
                const critCount = impactSummary[key]?.criticalCount || 0;
                
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedImpact(key as FleetImpact)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                      selectedImpact === key
                        ? `${config.bgColor} ${config.color}`
                        : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                    <span className="text-white/30">{count}</span>
                    {critCount > 0 && (
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Articles List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && articles.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <RefreshCw className="h-5 w-5 text-white/30 animate-spin mx-auto mb-2" />
              <p className="text-xs text-white/30">Fetching grid intelligence...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => fetchNews(true)}
              className="mt-2 text-xs text-white/40 hover:text-white/60"
            >
              Try again
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-4 text-center">
            <Ship className="h-8 w-8 text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">No grid-relevant news found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {articles.map((article) => {
              const impactConfig = IMPACT_CONFIG[article.fleetImpact];
              const levelStyle = IMPACT_LEVEL_STYLES[article.impactLevel];
              const ImpactIcon = impactConfig.icon;
              const SentimentIcon = SENTIMENT_ICONS[article.sentiment].icon;
              const sentimentColor = SENTIMENT_ICONS[article.sentiment].color;
              const isExpanded = expandedArticle === article.id;
              
              return (
                <article
                  key={article.id}
                  className={`p-3 hover:bg-white/5 transition-colors cursor-pointer border-l-2 ${levelStyle.border} ${
                    isExpanded ? 'bg-white/5' : ''
                  } ${levelStyle.pulse ? 'animate-pulse-subtle' : ''}`}
                  onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                >
                  <div className="flex gap-3">
                    {/* Impact Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${impactConfig.bgColor}`}>
                      <ImpactIcon className={`h-4 w-4 ${impactConfig.color}`} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <h3 className={`font-medium text-white leading-snug ${
                        compact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-2'
                      }`}>
                        {article.title}
                      </h3>
                      
                      {/* Meta row */}
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded font-medium ${levelStyle.bg} ${levelStyle.text}`}>
                          {article.impactLevel}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${impactConfig.bgColor} ${impactConfig.color}`}>
                          {impactConfig.label}
                        </span>
                        <span className="text-white/30">{article.source}</span>
                        <span className="text-white/20">•</span>
                        <span className="text-white/30">{formatTimeAgo(article.publishedAt)}</span>
                        <SentimentIcon className={`h-3 w-3 ${sentimentColor}`} />
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 text-white/30 ml-auto" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-white/30 ml-auto" />
                        )}
                      </div>
                      
                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          {/* Impact description */}
                          <div className={`p-2 rounded ${levelStyle.bg}`}>
                            <p className={`text-xs font-medium ${levelStyle.text}`}>
                              ⚡ {article.impactDescription}
                            </p>
                          </div>
                          
                          {/* Affected Assets (if any) */}
                          {article.affectedVessels && article.affectedVessels.length > 0 && (
                            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Ship className="h-3 w-3 text-blue-400" />
                                <p className="text-[10px] font-medium text-blue-400">
                                  Potentially Affected Assets ({article.affectedVessels.length})
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {article.affectedVessels.slice(0, 6).map((vessel) => (
                                  <span
                                    key={vessel}
                                    className="px-1.5 py-0.5 bg-blue-500/20 rounded text-[10px] text-blue-300 font-medium"
                                  >
                                    {vessel}
                                  </span>
                                ))}
                                {article.affectedVessels.length > 6 && (
                                  <span className="px-1.5 py-0.5 text-[10px] text-blue-400">
                                    +{article.affectedVessels.length - 6} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Recommended Actions */}
                          {article.recommendedActions && article.recommendedActions.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5">
                                <Zap className="h-3 w-3 text-amber-400" />
                                <p className="text-[10px] font-medium text-amber-400">
                                  Recommended Actions
                                </p>
                              </div>
                              {article.recommendedActions.map((action) => (
                                <ActionCard 
                                  key={action.id} 
                                  action={action} 
                                  onApply={() => {
                                    // TODO: Implement action application
                                    console.log('Apply action:', action);
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          
                          {/* Summary */}
                          <p className="text-xs text-white/60 leading-relaxed">
                            {article.summary}
                          </p>
                          
                          {/* Affected Operations */}
                          {article.affectedOperations.length > 0 && (
                            <div>
                              <p className="text-[10px] text-white/40 mb-1">Affects:</p>
                              <div className="flex flex-wrap gap-1">
                                {article.affectedOperations.map((op) => (
                                  <span
                                    key={op}
                                    className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-white/50"
                                  >
                                    {op}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Read more link */}
                          <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                            >
                              Read full article
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            {article.isActionable && (
                              <span className="flex items-center gap-1 text-[10px] text-green-400">
                                <CheckCircle className="h-3 w-3" />
                                Actionable
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-white/5 bg-black/50">
        <div className="flex items-center justify-between text-[10px] text-white/30">
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <a
              href="https://perigon.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300"
            >
              Perigon
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Critical
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Medium
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default NewsPanel;
