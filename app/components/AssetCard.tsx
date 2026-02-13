'use client';

import {
  Zap,
  Activity,
  AlertTriangle,
  Wrench,
  Clock,
  Heart,
  Users,
  ChevronRight,
  Thermometer,
  Gauge,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import type { ExelonAsset } from '@/lib/exelon/fleet';
import type { AssetIssueSummary } from '@/lib/asset-issues';
import { getScenarioForAsset } from '@/lib/demo-scenarios';

interface AssetCardProps {
  asset: ExelonAsset;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
  issueSummary?: AssetIssueSummary;
  assignedProgram?: {
    id: string;
    name: string;
    sponsor: string;
  };
}

const typeIcons: Record<string, typeof Zap> = {
  power_transformer: Zap,
  distribution_transformer: Activity,
  substation: Building2,
  circuit_breaker: Gauge,
  capacitor_bank: Thermometer,
};

const typeLabels: Record<string, string> = {
  power_transformer: 'Power Transformer',
  distribution_transformer: 'Distribution Transformer',
  substation: 'Substation',
  circuit_breaker: 'Circuit Breaker',
  capacitor_bank: 'Capacitor Bank',
};

const statusConfig = {
  operational: {
    dotColor: 'bg-emerald-500/50',
    textColor: 'text-white/50',
    label: 'Operational',
    icon: null,
  },
  maintenance: {
    dotColor: 'bg-amber-500/50',
    textColor: 'text-white/45',
    label: 'Maintenance',
    icon: Wrench,
  },
  idle: {
    dotColor: 'bg-white/30',
    textColor: 'text-white/35',
    label: 'De-Energized',
    icon: Clock,
  },
  alert: {
    dotColor: 'bg-rose-500/50',
    textColor: 'text-white/50',
    label: 'Alert',
    icon: AlertTriangle,
  },
};

export function AssetCard({
  asset,
  onClick,
  selected,
  compact = false,
  issueSummary,
  assignedProgram,
}: AssetCardProps) {
  const Icon = typeIcons[asset.type] || Zap;
  const status = statusConfig[asset.status] || statusConfig.operational;

  const healthColor =
    asset.healthIndex >= 70
      ? 'text-white/60'
      : asset.healthIndex >= 50
      ? 'text-white/50'
      : 'text-rose-400/70';

  const healthBarColor =
    asset.healthIndex >= 70
      ? 'bg-white/20'
      : asset.healthIndex >= 50
      ? 'bg-white/15'
      : 'bg-rose-500/40';

  const age = new Date().getFullYear() - asset.yearInstalled;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`w-full text-left p-3 rounded-lg border transition-all ${
          selected
            ? 'border-white/15 bg-white/[0.06]'
            : issueSummary?.hasCritical
            ? 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
            : issueSummary?.hasHighPriority
            ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
            : 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${
              issueSummary?.hasCritical
                ? 'bg-rose-500/10 text-rose-400/60'
                : issueSummary?.hasHighPriority
                ? 'bg-white/[0.06] text-white/40'
                : 'bg-white/[0.04] text-white/30'
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-white/85 truncate">{asset.name}</h3>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-white/35">{asset.opCo}</span>
              <span className="text-[10px] text-white/15">•</span>
              <span className="text-[10px] text-white/35">{asset.substationName}</span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${healthBarColor}`}
                  style={{ width: `${asset.healthIndex}%` }}
                />
              </div>
              <span className={`text-[10px] font-medium ${healthColor}`}>
                {asset.healthIndex}%
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1.5">
              <span className={`flex items-center gap-1 text-[10px] ${status.textColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                {status.label}
              </span>
              <span className="text-[10px] text-white/25">
                {asset.voltageClassKV}kV • {asset.ratedMVA} MVA
              </span>
              <span className="text-[10px] text-white/25">{age}yr</span>
            </div>

            {issueSummary && issueSummary.issueCount > 0 && (
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    issueSummary.hasCritical
                      ? 'bg-rose-500/10 text-rose-400/70'
                      : 'bg-white/[0.06] text-white/50'
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  {issueSummary.issueCount} issue{issueSummary.issueCount > 1 ? 's' : ''}
                </span>
                {issueSummary.totalCustomersAtRisk > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-white/30">
                    <Users className="h-3 w-3" />
                    {(issueSummary.totalCustomersAtRisk / 1000).toFixed(0)}k customers
                  </span>
                )}
              </div>
            )}

            {assignedProgram && (
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-[10px] text-white/35 truncate">
                  📋 {assignedProgram.name}
                </span>
              </div>
            )}

            {(() => {
              const scenario = getScenarioForAsset(asset.assetTag);
              if (!scenario) return null;
              return (
                <Link
                  href={`/grid-iq?id=${scenario.id}`}
                  onClick={e => e.stopPropagation()}
                  className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-white/45 hover:bg-white/[0.08] hover:text-white/60 transition-all"
                >
                  ⚡ {scenario.title.split(' — ')[0]}
                </Link>
              );
            })()}
          </div>

          <ChevronRight className="h-4 w-4 text-white/15 flex-shrink-0 mt-1" />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? 'border-white/15 bg-white/[0.06]'
          : 'border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            asset.healthIndex < 50 ? 'bg-white/[0.04] text-white/40' : 'bg-white/[0.04] text-white/30'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white/85">{asset.name}</h3>
          <p className="text-xs text-white/35 mt-0.5">
            {asset.opCo} • {typeLabels[asset.type] || asset.type} • {asset.manufacturer}
          </p>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <p className="text-[10px] text-white/30">Health</p>
              <p className={`text-sm font-semibold ${healthColor}`}>{asset.healthIndex}%</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30">Load</p>
              <p className="text-sm font-semibold text-white/70">{asset.loadFactor}%</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30">Customers</p>
              <p className="text-sm font-semibold text-white/70">
                {(asset.customersServed / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
