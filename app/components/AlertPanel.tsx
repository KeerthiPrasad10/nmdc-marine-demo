'use client';

import { useState } from 'react';
import type { NMDCAlert as LegacyAlert } from '@/lib/nmdc/alerts';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Wrench,
  Fuel,
  Navigation,
  Shield,
} from 'lucide-react';

interface AlertPanelProps {
  alerts: LegacyAlert[];
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    textColor: 'text-rose-400',
    badgeColor: 'bg-rose-500',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    badgeColor: 'bg-amber-500',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-300',
    badgeColor: 'bg-blue-500',
  },
};

const typeIcons: Record<string, typeof Wrench> = {
  equipment: Wrench,
  fuel: Fuel,
  navigation: Navigation,
  safety: Shield,
};

export function AlertPanel({ alerts, onAcknowledge, onResolve }: AlertPanelProps) {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const activeAlerts = alerts.filter((a) => !a.resolved);
  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="relative">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-[10px] font-bold flex items-center justify-center text-white animate-pulse">
                {criticalCount}
              </span>
            )}
          </div>
          <h2 className="font-semibold text-white">Active Alerts</h2>
        </div>
        <span className="text-sm text-white/40">
          {activeAlerts.length} active
        </span>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {activeAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 py-12">
            <CheckCircle2 className="h-12 w-12 mb-3 text-emerald-400" />
            <p className="font-medium text-white">All Clear</p>
            <p className="text-sm">No active alerts</p>
          </div>
        ) : (
          activeAlerts.map((alert) => {
            const severity = severityConfig[alert.severity];
            const SeverityIcon = severity.icon;
            const TypeIcon = typeIcons[alert.type] || Shield;
            const isExpanded = expandedAlert === alert.id;

            return (
              <div
                key={alert.id}
                className={`rounded-xl border ${severity.borderColor} ${severity.bgColor} overflow-hidden transition-all duration-300`}
              >
                {/* Alert Header */}
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${severity.textColor}`}>
                      <SeverityIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${severity.badgeColor} text-white`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-white/40">
                          <TypeIcon className="h-3 w-3" />
                          {alert.type}
                        </span>
                        <span className="text-xs text-white/40">
                          • {alert.vesselName}
                        </span>
                      </div>
                      <h3 className="mt-1 font-medium text-sm text-white leading-tight">
                        {alert.title}
                      </h3>
                      <p className="mt-1 text-xs text-white/60 line-clamp-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-white/40 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {alert.timestamp.toLocaleTimeString()}
                        </span>
                        {alert.acknowledged && (
                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="text-white/40 hover:text-white transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Content - Actions */}
                {isExpanded && (
                  <div className="border-t border-white/8 bg-white/3 p-3">
                    <div className="flex gap-2">
                      {!alert.acknowledged && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAcknowledge?.(alert.id);
                          }}
                          className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-white/5 border border-white/12 text-white/85 hover:bg-white/10 transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onResolve?.(alert.id);
                        }}
                        className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Footer note */}
      <div className="p-2 border-t border-white/8 text-center">
        <p className="text-[10px] text-white/30">
          Alerts generated from fleet health & fuel data
        </p>
      </div>
    </div>
  );
}
