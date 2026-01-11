'use client';

import { useState } from 'react';
import {
  FleetOptimizationResult,
  OptimizationChange,
  formatDistance,
  formatDuration,
  formatCurrency,
  formatFuel,
} from '@/lib/orchestration/fleet-optimizer';
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Fuel,
  Clock,
  Route,
  DollarSign,
  Ship,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Anchor,
  Shuffle,
  RefreshCw,
  Merge,
  X,
} from 'lucide-react';

interface OptimizationResultsProps {
  result: FleetOptimizationResult;
  onApply?: () => void;
  onDismiss?: () => void;
}

const changeTypeIcons: Record<OptimizationChange['type'], typeof Shuffle> = {
  reassign: RefreshCw,
  resequence: Shuffle,
  swap: ArrowRight,
  consolidate: Merge,
};

const changeTypeLabels: Record<OptimizationChange['type'], string> = {
  reassign: 'Reassignment',
  resequence: 'Route Resequencing',
  swap: 'Vessel Swap',
  consolidate: 'Consolidation',
};

export function OptimizationResults({ result, onApply, onDismiss }: OptimizationResultsProps) {
  const [expandedChanges, setExpandedChanges] = useState<Set<number>>(new Set([0]));
  const [showDetails, setShowDetails] = useState(true);

  const toggleChange = (index: number) => {
    const newExpanded = new Set(expandedChanges);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChanges(newExpanded);
  };

  const { summary, originalMetrics, optimizedMetrics, changes, confidence, warnings } = result;

  // Calculate improvement percentages
  const distanceImprovement = originalMetrics.totalFleetDistanceNm > 0
    ? ((summary.totalDistanceSavedNm / originalMetrics.totalFleetDistanceNm) * 100)
    : 0;
  const fuelImprovement = originalMetrics.totalFleetFuelLiters > 0
    ? ((summary.totalFuelSavedLiters / originalMetrics.totalFleetFuelLiters) * 100)
    : 0;
  const timeImprovement = originalMetrics.totalFleetTransitHours > 0
    ? ((summary.totalTimeSavedHours / originalMetrics.totalFleetTransitHours) * 100)
    : 0;

  return (
    <div className="bg-gradient-to-b from-emerald-950/30 to-black rounded-2xl border border-emerald-500/20 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Fleet Optimization Results</h2>
              <p className="text-xs text-white/50">
                {changes.length} optimization{changes.length !== 1 ? 's' : ''} identified • {confidence.toFixed(0)}% confidence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Savings Summary */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="grid grid-cols-4 gap-4">
          <SavingsCard
            icon={Route}
            label="Distance Saved"
            value={formatDistance(summary.totalDistanceSavedNm)}
            improvement={distanceImprovement}
            before={formatDistance(originalMetrics.totalFleetDistanceNm)}
            after={formatDistance(optimizedMetrics.totalFleetDistanceNm)}
          />
          <SavingsCard
            icon={Fuel}
            label="Fuel Saved"
            value={formatFuel(summary.totalFuelSavedLiters)}
            improvement={fuelImprovement}
            before={formatFuel(originalMetrics.totalFleetFuelLiters)}
            after={formatFuel(optimizedMetrics.totalFleetFuelLiters)}
          />
          <SavingsCard
            icon={Clock}
            label="Transit Time Saved"
            value={formatDuration(summary.totalTimeSavedHours)}
            improvement={timeImprovement}
            before={formatDuration(originalMetrics.totalFleetTransitHours)}
            after={formatDuration(optimizedMetrics.totalFleetTransitHours)}
          />
          <SavingsCard
            icon={DollarSign}
            label="Cost Saved"
            value={formatCurrency(summary.totalCostSavedUSD)}
            improvement={fuelImprovement} // Cost savings correlate with fuel
          />
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="px-5 py-3 border-b border-white/5">
          {warnings.map((warning, i) => (
            <div key={i} className="flex items-center gap-2 text-amber-400 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Before/After Comparison Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full px-5 py-3 flex items-center justify-between border-b border-white/5 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm font-medium text-white/70">Optimization Details</span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
      </button>

      {/* Changes List */}
      {showDetails && (
        <div className="divide-y divide-white/5">
          {changes.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-white/70 text-sm">Schedule is already well-optimized</p>
              <p className="text-white/40 text-xs mt-1">No significant improvements found</p>
            </div>
          ) : (
            changes.map((change, index) => (
              <ChangeCard
                key={index}
                change={change}
                index={index}
                isExpanded={expandedChanges.has(index)}
                onToggle={() => toggleChange(index)}
              />
            ))
          )}
        </div>
      )}

      {/* Apply Button */}
      {changes.length > 0 && onApply && (
        <div className="px-5 py-4 bg-white/[0.02]">
          <button
            onClick={onApply}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/80 hover:bg-emerald-500 text-white font-medium transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Apply All Optimizations
          </button>
          <p className="text-center text-xs text-white/40 mt-2">
            This will update the schedule with the recommended changes
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Savings Card Component
// ============================================================================

interface SavingsCardProps {
  icon: typeof Route;
  label: string;
  value: string;
  improvement: number;
  before?: string;
  after?: string;
}

function SavingsCard({ icon: Icon, label, value, improvement, before, after }: SavingsCardProps) {
  const isPositive = improvement > 0;
  const isNegative = improvement < 0;

  return (
    <div className={`p-3 rounded-xl border ${
      isNegative ? 'bg-amber-500/5 border-amber-500/10' : 'bg-white/[0.03] border-white/5'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${isNegative ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
          <Icon className={`w-3.5 h-3.5 ${isNegative ? 'text-amber-400' : 'text-emerald-400'}`} />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-white/40">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className={`text-xl font-bold ${
            isPositive ? 'text-emerald-400' : isNegative ? 'text-amber-400' : 'text-white'
          }`}>
            {isPositive && '+'}{value}
          </div>
          {before && after && (
            <div className="text-[10px] text-white/30 mt-1">
              {before} → {after}
            </div>
          )}
        </div>
        {improvement !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            isPositive ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            <TrendingUp className={`w-3 h-3 ${isNegative ? 'rotate-180' : ''}`} />
            {Math.abs(improvement).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Change Card Component
// ============================================================================

interface ChangeCardProps {
  change: OptimizationChange;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function ChangeCard({ change, index, isExpanded, onToggle }: ChangeCardProps) {
  const Icon = changeTypeIcons[change.type];
  const typeLabel = changeTypeLabels[change.type];

  return (
    <div className="bg-white/[0.01]">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 uppercase tracking-wide">
              {typeLabel}
            </span>
            <span className="text-xs text-white/30">#{index + 1}</span>
          </div>
          <h4 className="text-sm font-medium text-white">{change.description}</h4>
          
          {/* Impact Summary */}
          <div className="flex items-center gap-3 mt-2">
            {change.impact.distanceSavedNm > 0 && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Route className="w-3 h-3" />
                {formatDistance(change.impact.distanceSavedNm)}
              </span>
            )}
            {change.impact.fuelSavedLiters > 0 && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Fuel className="w-3 h-3" />
                {formatFuel(change.impact.fuelSavedLiters)}
              </span>
            )}
            {change.impact.costSavedUSD > 0 && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <DollarSign className="w-3 h-3" />
                {formatCurrency(change.impact.costSavedUSD)}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-5 pb-4 space-y-4">
          {/* Reasoning */}
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wide">Why this optimization?</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">{change.reasoning}</p>
          </div>

          {/* Before/After Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Before */}
            <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-medium text-rose-400 uppercase tracking-wide">Before</span>
              </div>
              {change.before.map((b, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
                    <Ship className="w-3 h-3" />
                    <span className="font-medium">{b.vessel}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-5 text-[11px] text-white/40">
                    {b.sequence.map((step, j) => (
                      <span key={j} className="flex items-center">
                        <span className="px-1.5 py-0.5 rounded bg-white/5">{step}</span>
                        {j < b.sequence.length - 1 && <ArrowRight className="w-3 h-3 mx-1 text-white/20" />}
                      </span>
                    ))}
                  </div>
                  <div className="ml-5 mt-1 text-[10px] text-rose-400/60">
                    {formatDistance(b.totalDistanceNm)} transit
                  </div>
                </div>
              ))}
            </div>

            {/* After */}
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wide">After</span>
              </div>
              {change.after.map((a, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
                    <Ship className="w-3 h-3" />
                    <span className="font-medium">{a.vessel}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-5 text-[11px] text-white/40 flex-wrap">
                    {a.sequence.map((step, j) => (
                      <span key={j} className="flex items-center">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300/70">{step}</span>
                        {j < a.sequence.length - 1 && <ArrowRight className="w-3 h-3 mx-1 text-emerald-400/30" />}
                      </span>
                    ))}
                  </div>
                  <div className="ml-5 mt-1 text-[10px] text-emerald-400">
                    {formatDistance(a.totalDistanceNm)} transit
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Affected Vessels */}
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Anchor className="w-3 h-3" />
            <span>Affects {change.affectedVessels.length} vessel(s)</span>
          </div>
        </div>
      )}
    </div>
  );
}

