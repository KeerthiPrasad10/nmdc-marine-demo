'use client';

import { ReactNode, useState } from 'react';
import { Info } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'error';
  className?: string;
  compact?: boolean;
  info?: string; // Tooltip text explaining the metric
  infoSource?: 'live' | 'static' | 'simulated'; // Data source indicator
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  className = '',
  compact = false,
  info,
  infoSource,
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Muted color config - only subtle hints of color
  const isWarning = color === 'warning' || color === 'error';
  const iconColor = 'text-white/35';
  const valueColor = isWarning ? 'text-white/70' : 'text-white/90';
  
  const sourceColors = {
    live: 'text-white/40',
    static: 'text-white/35',
    simulated: 'text-white/35',
  };
  
  const sourceLabels = {
    live: 'Live SCADA',
    static: 'Fleet Data',
    simulated: 'Simulated',
  };

  if (compact) {
    return (
      <div
        className={`relative overflow-hidden rounded-lg border border-white/5 bg-white/[0.02] p-2.5 ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded bg-white/5 ${iconColor}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide truncate">
                {title}
              </p>
              {info && (
                <div className="relative">
                  <Info 
                    className="h-2.5 w-2.5 text-white/20 hover:text-white/50 cursor-help transition-colors" 
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  />
                  {showTooltip && (
                    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black/95 border border-white/10 rounded-lg shadow-xl">
                      <p className="text-[10px] text-white/70 leading-relaxed">{info}</p>
                      {infoSource && (
                        <p className={`text-[9px] mt-1 ${sourceColors[infoSource]}`}>
                          Source: {sourceLabels[infoSource]}
                        </p>
                      )}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-white/10" />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <p className={`text-base font-semibold ${valueColor}`}>{value}</p>
              {subtitle && (
                <p className="text-[10px] text-white/30 truncate">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`glass-panel relative overflow-hidden p-5 border border-white/5 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wide">
            {title}
          </p>
          <p className={`mt-2 text-2xl font-bold tracking-tight ${valueColor}`}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-white/30">{subtitle}</p>
          )}
          {trend && (
            <p className={`mt-2 text-sm font-medium ${trend.positive ? 'text-white/50' : 'text-white/45'}`}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
