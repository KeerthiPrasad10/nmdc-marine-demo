'use client';

import { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Leaf,
  Ship,
  Calendar,
  Users,
  Settings,
  ShieldAlert,
  FileText,
  ChevronDown,
  ChevronRight,
  Zap,
  Target,
  BarChart3,
  ArrowLeftRight,
  Layers,
  Info,
} from 'lucide-react';
import {
  ImpactAnalysisResult,
  ImpactItem,
  ImpactSeverity,
  ImpactCategory,
  ProposedChange,
  ImpactChainNode,
} from '@/lib/impact-analysis/types';

interface ImpactAnalysisPanelProps {
  result: ImpactAnalysisResult;
  onApplyChange?: () => void;
  onDismiss?: () => void;
  onSelectAlternative?: (alternativeId: string) => void;
  compact?: boolean;
}

const SEVERITY_CONFIG: Record<ImpactSeverity, { color: string; bg: string; icon: typeof AlertTriangle }> = {
  critical: { color: 'text-rose-400', bg: 'bg-rose-500/20', icon: XCircle },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/20', icon: AlertTriangle },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/20', icon: AlertTriangle },
  low: { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Info },
  positive: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: CheckCircle },
};

const CATEGORY_CONFIG: Record<ImpactCategory, { icon: typeof Ship; label: string }> = {
  operations: { icon: Ship, label: 'Operations' },
  finance: { icon: DollarSign, label: 'Finance' },
  esg: { icon: Leaf, label: 'ESG' },
  compliance: { icon: ShieldAlert, label: 'Compliance' },
  safety: { icon: AlertTriangle, label: 'Safety' },
  crew: { icon: Users, label: 'Crew' },
  maintenance: { icon: Settings, label: 'Maintenance' },
  supply_chain: { icon: Layers, label: 'Supply Chain' },
  client_relations: { icon: FileText, label: 'Client Relations' },
  regulatory: { icon: Target, label: 'Regulatory' },
};

export function ImpactAnalysisPanel({
  result,
  onApplyChange,
  onDismiss,
  onSelectAlternative,
  compact = false,
}: ImpactAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'upstream' | 'downstream' | 'chain' | 'recommendations'>('overview');
  const [expandedImpacts, setExpandedImpacts] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedImpacts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatCurrency = (amount: number) => {
    if (Math.abs(amount) >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (Math.abs(amount) >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  return (
    <div className={`bg-black rounded-xl border border-white/10 overflow-hidden ${compact ? '' : 'min-h-[600px]'}`}>
      <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/20">
              <Zap className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Impact Analysis</h2>
              <p className="text-xs text-white/50">{result.change.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${SEVERITY_CONFIG[result.overallRisk].bg} ${SEVERITY_CONFIG[result.overallRisk].color}`}>
              {result.overallRisk.toUpperCase()} RISK
            </span>
            <span className="text-xs text-white/40">
              {Math.round(result.overallConfidence * 100)}% confidence
            </span>
          </div>
        </div>
      </div>

      <div className="flex border-b border-white/10 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'upstream', label: 'Upstream', icon: ArrowUpRight, count: result.upstreamImpacts.length },
          { id: 'downstream', label: 'Downstream', icon: ArrowDownRight, count: result.downstreamImpacts.length },
          { id: 'chain', label: 'Impact Chain', icon: ArrowLeftRight },
          { id: 'recommendations', label: 'Actions', icon: Target, count: result.recommendations.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-violet-500 bg-white/5'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                activeTab === tab.id ? 'bg-violet-500/30 text-violet-300' : 'bg-white/10 text-white/40'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={`p-4 overflow-y-auto ${compact ? 'max-h-[400px]' : 'max-h-[500px]'}`}>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-3">
              <SummaryCard
                label="Critical"
                value={result.summary.criticalCount}
                icon={XCircle}
                color="rose"
              />
              <SummaryCard
                label="High"
                value={result.summary.highCount}
                icon={AlertTriangle}
                color="orange"
              />
              <SummaryCard
                label="Medium"
                value={result.summary.mediumCount}
                icon={AlertTriangle}
                color="amber"
              />
              <SummaryCard
                label="Positive"
                value={result.summary.positiveCount}
                icon={CheckCircle}
                color="emerald"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Financial Impact
                </h3>
                <div className="space-y-2">
                  <FinancialRow
                    label="Cost Impact"
                    value={result.financialSummary.estimatedCostImpact}
                    isNegative
                  />
                  <FinancialRow
                    label="Revenue Impact"
                    value={result.financialSummary.revenueImpact}
                    isNegative={result.financialSummary.revenueImpact < 0}
                  />
                  <FinancialRow
                    label="Carbon Credits"
                    value={result.financialSummary.carbonCreditImpact}
                    isNegative={result.financialSummary.carbonCreditImpact > 0}
                  />
                  <div className="pt-2 border-t border-white/10">
                    <FinancialRow
                      label="Total Impact"
                      value={result.financialSummary.totalFinancialImpact}
                      isNegative
                      isBold
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-400" />
                  ESG & Operations
                </h3>
                <div className="space-y-3">
                  <MetricRow
                    label="CO₂ Change"
                    value={result.esgImpact.co2Change}
                    unit="%"
                    isPositiveGood={result.esgImpact.co2Change < 0}
                  />
                  <MetricRow
                    label="ESG Score"
                    value={result.esgImpact.esgScoreChange}
                    unit="pts"
                    isPositiveGood={result.esgImpact.esgScoreChange > 0}
                  />
                  <MetricRow
                    label="Schedule Delay"
                    value={result.operationalImpact.scheduleDelayDays}
                    unit="days"
                    isPositiveGood={false}
                  />
                  <MetricRow
                    label="Utilization"
                    value={result.operationalImpact.utilizationChange}
                    unit="%"
                    isPositiveGood={result.operationalImpact.utilizationChange > 0}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4">
              <h3 className="text-sm font-medium text-white mb-3">Impact Flow</h3>
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <ArrowUpRight className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-400 font-medium">
                      {result.upstreamImpacts.length} Upstream
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 mt-1">Supply, Crew, Parts</p>
                </div>
                <ArrowRight className="w-6 h-6 text-white/20" />
                <div className="flex-1 text-center">
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${SEVERITY_CONFIG[result.overallRisk].bg} border border-white/10`}>
                    <Zap className={`w-4 h-4 ${SEVERITY_CONFIG[result.overallRisk].color}`} />
                    <span className={`text-sm font-medium ${SEVERITY_CONFIG[result.overallRisk].color}`}>
                      Change
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 mt-1">{result.change.type.replace(/_/g, ' ')}</p>
                </div>
                <ArrowRight className="w-6 h-6 text-white/20" />
                <div className="flex-1 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/30">
                    <ArrowDownRight className="w-4 h-4 text-violet-400" />
                    <span className="text-sm text-violet-400 font-medium">
                      {result.downstreamImpacts.length} Downstream
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 mt-1">Revenue, Clients, ESG</p>
                </div>
              </div>
            </div>

            {result.alternativeScenarios && result.alternativeScenarios.length > 0 && (
              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4">
                <h3 className="text-sm font-medium text-white mb-3">Alternative Scenarios</h3>
                <div className="grid grid-cols-3 gap-3">
                  {result.alternativeScenarios.map(alt => (
                    <button
                      key={alt.id}
                      onClick={() => onSelectAlternative?.(alt.id)}
                      className="p-3 rounded-lg bg-white/[0.02] border border-white/10 hover:border-violet-500/50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-white">{alt.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${SEVERITY_CONFIG[alt.overallRisk].bg} ${SEVERITY_CONFIG[alt.overallRisk].color}`}>
                          {alt.overallRisk}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 line-clamp-2">{alt.description}</p>
                      <div className="mt-2 text-xs">
                        <span className={alt.financialImpact < 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {alt.financialImpact > 0 ? '+' : ''}{alt.financialImpact}% cost
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'upstream' && (
          <ImpactList
            impacts={result.upstreamImpacts}
            direction="upstream"
            expandedImpacts={expandedImpacts}
            onToggleExpand={toggleExpand}
          />
        )}

        {activeTab === 'downstream' && (
          <ImpactList
            impacts={result.downstreamImpacts}
            direction="downstream"
            expandedImpacts={expandedImpacts}
            onToggleExpand={toggleExpand}
          />
        )}

        {activeTab === 'chain' && (
          <ImpactChainView chain={result.impactChain} />
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-3">
            {result.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  rec.priority === 'critical' ? 'bg-rose-500/10 border-rose-500/30' :
                  rec.priority === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                  rec.priority === 'medium' ? 'bg-amber-500/10 border-amber-500/30' :
                  'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg ${
                    rec.priority === 'critical' ? 'bg-rose-500/20' :
                    rec.priority === 'high' ? 'bg-orange-500/20' :
                    rec.priority === 'medium' ? 'bg-amber-500/20' :
                    'bg-blue-500/20'
                  }`}>
                    <Target className={`w-4 h-4 ${
                      rec.priority === 'critical' ? 'text-rose-400' :
                      rec.priority === 'high' ? 'text-orange-400' :
                      rec.priority === 'medium' ? 'text-amber-400' :
                      'text-blue-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium uppercase ${
                        rec.priority === 'critical' ? 'text-rose-400' :
                        rec.priority === 'high' ? 'text-orange-400' :
                        rec.priority === 'medium' ? 'text-amber-400' :
                        'text-blue-400'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-white font-medium">{rec.action}</p>
                    <p className="text-xs text-white/50 mt-1">{rec.rationale}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {rec.expectedBenefit}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(onApplyChange || onDismiss) && (
        <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <p className="text-xs text-white/40">
            Analysis generated {result.timestamp.toLocaleTimeString()}
          </p>
          <div className="flex items-center gap-2">
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
              >
                Dismiss
              </button>
            )}
            {onApplyChange && (
              <button
                onClick={onApplyChange}
                className="px-4 py-1.5 rounded-lg bg-violet-500/80 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
              >
                Proceed with Change
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof AlertTriangle;
  color: 'rose' | 'orange' | 'amber' | 'emerald';
}) {
  const colorClasses = {
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  };

  return (
    <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <Icon className={`w-4 h-4 ${colorClasses[color].split(' ')[0]}`} />
        <span className={`text-xl font-bold ${colorClasses[color].split(' ')[0]}`}>{value}</span>
      </div>
      <span className="text-xs text-white/50">{label}</span>
    </div>
  );
}

function FinancialRow({
  label,
  value,
  isNegative,
  isBold = false,
}: {
  label: string;
  value: number;
  isNegative?: boolean;
  isBold?: boolean;
}) {
  const formatValue = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1000000) return `$${(abs / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `$${(abs / 1000).toFixed(0)}K`;
    return `$${abs.toFixed(0)}`;
  };

  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${isBold ? 'text-white font-medium' : 'text-white/50'}`}>{label}</span>
      <span className={`text-sm ${isBold ? 'font-bold' : 'font-medium'} ${
        value === 0 ? 'text-white/40' :
        isNegative ? 'text-rose-400' : 'text-emerald-400'
      }`}>
        {value !== 0 && (isNegative ? '-' : '+')}{formatValue(value)}
      </span>
    </div>
  );
}

function MetricRow({
  label,
  value,
  unit,
  isPositiveGood,
}: {
  label: string;
  value: number;
  unit: string;
  isPositiveGood: boolean;
}) {
  const isGood = isPositiveGood ? value > 0 : value < 0;
  const isBad = isPositiveGood ? value < 0 : value > 0;

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/50">{label}</span>
      <div className="flex items-center gap-1">
        {value !== 0 && (
          isGood ? (
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3 h-3 text-rose-400" />
          )
        )}
        <span className={`text-sm font-medium ${
          value === 0 ? 'text-white/40' :
          isGood ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          {value > 0 ? '+' : ''}{value}{unit}
        </span>
      </div>
    </div>
  );
}

function ImpactList({
  impacts,
  direction,
  expandedImpacts,
  onToggleExpand,
}: {
  impacts: ImpactItem[];
  direction: 'upstream' | 'downstream';
  expandedImpacts: Set<string>;
  onToggleExpand: (id: string) => void;
}) {
  if (impacts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-50" />
        <p className="text-white/40">No {direction} impacts identified</p>
      </div>
    );
  }

  const groupedByCategory = impacts.reduce((acc, impact) => {
    if (!acc[impact.category]) acc[impact.category] = [];
    acc[impact.category].push(impact);
    return acc;
  }, {} as Record<ImpactCategory, ImpactItem[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedByCategory).map(([category, categoryImpacts]) => {
        const config = CATEGORY_CONFIG[category as ImpactCategory];
        const Icon = config.icon;
        
        return (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Icon className="w-3.5 h-3.5" />
              <span className="font-medium">{config.label}</span>
              <span className="px-1.5 py-0.5 rounded bg-white/10">{categoryImpacts.length}</span>
            </div>
            
            {categoryImpacts.map(impact => {
              const severityConfig = SEVERITY_CONFIG[impact.severity];
              const isExpanded = expandedImpacts.has(impact.id);
              
              return (
                <div
                  key={impact.id}
                  className={`rounded-xl border transition-all ${severityConfig.bg} border-white/10`}
                >
                  <button
                    onClick={() => onToggleExpand(impact.id)}
                    className="w-full p-3 flex items-start gap-3 text-left"
                  >
                    <div className={`p-1.5 rounded-lg ${severityConfig.bg}`}>
                      <severityConfig.icon className={`w-4 h-4 ${severityConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{impact.title}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${severityConfig.bg} ${severityConfig.color}`}>
                          {impact.severity}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{impact.description}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-white/40" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/40" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3">
                      {impact.quantitativeImpact && (
                        <div className="p-2 rounded-lg bg-white/5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/50">{impact.quantitativeImpact.metric}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-white/40">
                                {impact.quantitativeImpact.currentValue.toLocaleString()} →
                              </span>
                              <span className={impact.quantitativeImpact.percentChange < 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {impact.quantitativeImpact.projectedValue.toLocaleString()} {impact.quantitativeImpact.unit}
                              </span>
                              <span className={`text-[10px] ${impact.quantitativeImpact.percentChange < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                ({impact.quantitativeImpact.percentChange > 0 ? '+' : ''}{impact.quantitativeImpact.percentChange.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-[10px] text-white/40">
                        <span>Timeframe: {impact.timeframe.replace('_', ' ')}</span>
                        <span>Confidence: {Math.round(impact.confidence * 100)}%</span>
                      </div>
                      
                      {impact.mitigations && impact.mitigations.length > 0 && (
                        <div>
                          <span className="text-[10px] text-white/40 uppercase">Mitigations</span>
                          <div className="mt-1 space-y-1">
                            {impact.mitigations.map((m, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-white/70">
                                <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <span>{m}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {impact.affectedEntities && (
                        <div className="flex flex-wrap gap-2">
                          {impact.affectedEntities.vessels?.map(v => (
                            <span key={v} className="px-2 py-0.5 rounded bg-blue-500/10 text-[10px] text-blue-400">
                              🚢 {v}
                            </span>
                          ))}
                          {impact.affectedEntities.projects?.map(p => (
                            <span key={p} className="px-2 py-0.5 rounded bg-violet-500/10 text-[10px] text-violet-400">
                              📋 {p}
                            </span>
                          ))}
                          {impact.affectedEntities.clients?.map(c => (
                            <span key={c} className="px-2 py-0.5 rounded bg-amber-500/10 text-[10px] text-amber-400">
                              👤 {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function ImpactChainView({ chain }: { chain: ImpactChainNode[] }) {
  const renderNode = (node: ImpactChainNode, depth: number = 0) => {
    const severityConfig = SEVERITY_CONFIG[node.impact.severity];
    
    return (
      <div key={node.id} className="relative">
        <div className="flex items-start gap-2" style={{ marginLeft: depth * 24 }}>
          {depth > 0 && (
            <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10" style={{ left: (depth - 1) * 24 + 8 }} />
          )}
          {depth > 0 && (
            <div className="absolute top-3 w-4 h-px bg-white/10" style={{ left: (depth - 1) * 24 + 8 }} />
          )}
          <div className={`p-1 rounded ${severityConfig.bg}`}>
            <severityConfig.icon className={`w-3 h-3 ${severityConfig.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-white">{node.impact.title}</span>
            <p className="text-[10px] text-white/40 truncate">{node.impact.description}</p>
          </div>
        </div>
        {node.children.length > 0 && (
          <div className="mt-2 space-y-2">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (chain.length === 0) {
    return (
      <div className="text-center py-8">
        <Layers className="w-12 h-12 text-white/20 mx-auto mb-2" />
        <p className="text-white/40">No impact chain to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-white/50 mb-2">
        Impact cascade visualization showing how changes ripple through operations
      </div>
      {chain.map(node => renderNode(node, 0))}
    </div>
  );
}

export function WhatIfSimulator({
  onScenarioSelect,
}: {
  onScenarioSelect: (scenario: { type: string; parameters: Record<string, unknown> }) => void;
}) {
  const scenarios = [
    {
      id: 'vessel_breakdown',
      name: 'Vessel Breakdown',
      description: 'What if a vessel experiences critical equipment failure?',
      icon: Ship,
      type: 'equipment_failure',
      defaultParams: { severity: 'critical', estimatedDowntime: 14 },
    },
    {
      id: 'weather_delay',
      name: 'Weather Event',
      description: 'What if severe weather delays operations for 7 days?',
      icon: AlertTriangle,
      type: 'weather_event',
      defaultParams: { delayDays: 7 },
    },
    {
      id: 'fuel_switch',
      name: 'Fuel Transition',
      description: 'What if we switch to LNG fuel?',
      icon: Leaf,
      type: 'fuel_switch',
      defaultParams: { newFuelType: 'LNG' },
    },
    {
      id: 'new_project',
      name: 'New Project',
      description: 'What if we take on a new high-priority project?',
      icon: Calendar,
      type: 'new_project',
      defaultParams: { priority: 'high', estimatedCost: 5000000 },
    },
  ];

  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4">
      <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-400" />
        What-If Scenarios
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {scenarios.map(scenario => (
          <button
            key={scenario.id}
            onClick={() => onScenarioSelect({
              type: scenario.type,
              parameters: scenario.defaultParams,
            })}
            className="p-3 rounded-lg bg-white/[0.02] border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <scenario.icon className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-white">{scenario.name}</span>
            </div>
            <p className="text-[10px] text-white/40 line-clamp-2">{scenario.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}






