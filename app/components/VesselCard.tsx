'use client';

import Link from 'next/link';
import { Vessel } from '@/lib/supabase';
import { getWeatherAtLocation, getWeatherIcon } from '@/lib/weather';
import type { VesselIssueSummary } from '@/lib/vessel-issues';
import {
  Anchor,
  Ship,
  Construction,
  Waves,
  Radar,
  Fuel,
  Heart,
  Users,
  Navigation,
  AlertTriangle,
  Wrench,
  Clock,
  Cloud,
  ChevronRight,
  Cpu,
  MapPin,
  Briefcase,
} from 'lucide-react';

interface AssignedProject {
  id: string;
  name: string;
  client: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

interface VesselCardProps {
  vessel: Vessel;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
  linkToDetail?: boolean;
  issueSummary?: VesselIssueSummary;
  assignedProject?: AssignedProject;
}

const vesselIcons: Record<string, typeof Ship> = {
  tugboat: Anchor,
  supply_vessel: Ship,
  crane_barge: Construction,
  dredger: Waves,
  survey_vessel: Radar,
};

const vesselTypeLabels: Record<string, string> = {
  tugboat: 'Tugboat',
  supply_vessel: 'Supply Vessel',
  crane_barge: 'Crane Barge',
  dredger: 'Dredger',
  survey_vessel: 'Survey Vessel',
  pipelay_barge: 'Pipelay Barge',
  jack_up_barge: 'Jack-Up Barge',
  accommodation_barge: 'Accommodation Barge',
  work_barge: 'Work Barge',
  derrick_barge: 'Derrick Barge',
};

function getVesselTypeDisplay(vessel: Vessel): string {
  if (vessel.vessel_class) {
    return vessel.vessel_class.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  return vesselTypeLabels[vessel.type] || vessel.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const statusConfig = {
  operational: {
    color: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    label: 'Operational',
    icon: null,
  },
  maintenance: {
    color: 'bg-amber-500',
    textColor: 'text-amber-400',
    label: 'Maintenance',
    icon: Wrench,
  },
  idle: {
    color: 'bg-white/40',
    textColor: 'text-white/40',
    label: 'Idle',
    icon: Clock,
  },
  alert: {
    color: 'bg-rose-500',
    textColor: 'text-rose-400',
    label: 'Alert',
    icon: AlertTriangle,
  },
};

export function VesselCard({ vessel, onClick, selected, compact = false, linkToDetail = false, issueSummary, assignedProject }: VesselCardProps) {
  const Icon = vesselIcons[vessel.type] || Ship;
  const status = statusConfig[vessel.status || 'operational'];
  const StatusIcon = status.icon;

  // More muted colors - only show color for problems
  const healthColor =
    (vessel.health_score ?? 100) >= 70
      ? 'text-white/60'
      : (vessel.health_score ?? 100) >= 40
      ? 'text-amber-400'
      : 'text-rose-400';

  const fuelColor =
    (vessel.fuel_level ?? 100) >= 50
      ? 'text-white/60'
      : (vessel.fuel_level ?? 100) >= 25
      ? 'text-amber-400'
      : 'text-rose-400';

  // Get local weather for this vessel
  const localWeather = getWeatherAtLocation(vessel.position_lat, vessel.position_lng);
  const weatherEmoji = getWeatherIcon(localWeather.condition);
  const riskColors = {
    low: 'text-white/40',
    moderate: 'text-amber-400',
    high: 'text-rose-400',
    critical: 'text-red-500',
  };

  // Determine if vessel has equipment issues that need attention
  const hasIssues = issueSummary && issueSummary.issueCount > 0;
  const issueIndicatorColor = issueSummary?.hasCritical 
    ? 'bg-rose-500' 
    : issueSummary?.hasHighPriority 
      ? 'bg-amber-500' 
      : 'bg-yellow-500';

  // Compact mode for sidebar - clean, minimal design
  if (compact) {
    const vesselType = getVesselTypeDisplay(vessel);
    
    return (
      <div
        onClick={onClick}
        className={`group relative overflow-hidden rounded-lg border transition-all duration-200 ${
          onClick ? 'cursor-pointer hover:bg-white/5' : ''
        } ${
          hasIssues && issueSummary?.hasHighPriority
            ? 'border-amber-500/40 bg-amber-500/5'
            : selected 
              ? 'border-white/30 bg-white/5' 
              : 'border-white/5 bg-transparent hover:border-white/10'
        }`}
      >
        {/* Equipment Issue Indicator Bar */}
        {hasIssues && issueSummary?.hasHighPriority && (
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${issueIndicatorColor}`} />
        )}
        
        <div className="flex items-center gap-3 p-2.5">
          <div
            className={`relative flex h-7 w-7 items-center justify-center rounded ${
              hasIssues && issueSummary?.hasHighPriority
                ? 'bg-amber-500/20 text-amber-400'
                : selected 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white/5 text-white/40'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {/* Issue count badge */}
            {hasIssues && (
              <span className={`absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full ${issueIndicatorColor} text-[9px] font-bold text-white flex items-center justify-center`}>
                {issueSummary.issueCount}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-medium truncate ${
                hasIssues && issueSummary?.hasHighPriority 
                  ? 'text-amber-300' 
                  : selected 
                    ? 'text-white' 
                    : 'text-white/80'
              }`}>
                {vessel.name}
              </h3>
              {vessel.status === 'alert' && (
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
              {vessel.status === 'maintenance' && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              )}
            </div>
            {/* Project assignment - always show vessel type, then project below */}
            <p className="text-[10px] text-white/30 truncate capitalize">{vesselType}</p>
            {assignedProject && (
              <div className="flex items-center gap-1 mt-0.5">
                <Briefcase className={`h-2.5 w-2.5 flex-shrink-0 ${
                  assignedProject.priority === 'critical' ? 'text-rose-400' :
                  assignedProject.priority === 'high' ? 'text-amber-400' :
                  'text-cyan-400'
                }`} />
                <span className={`text-[10px] font-medium truncate ${
                  assignedProject.priority === 'critical' ? 'text-rose-400' :
                  assignedProject.priority === 'high' ? 'text-amber-400' :
                  'text-cyan-400'
                }`}>
                  {assignedProject.name}
                </span>
              </div>
            )}
            {/* Show equipment health if has issues, otherwise show fuel/speed */}
            {hasIssues ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] text-amber-400 font-medium">
                  {issueSummary.issueCount} issue{issueSummary.issueCount > 1 ? 's' : ''} • {issueSummary.worstHealth}% health
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-0.5 text-xs text-white/40">
                <span className={healthColor}>{vessel.health_score ?? 100}%</span>
                <span>·</span>
                <span className={fuelColor}>{Math.round(vessel.fuel_level ?? 100)}% fuel</span>
                <span>·</span>
                <span>{vessel.speed?.toFixed(1) ?? 0} kn</span>
              </div>
            )}
          </div>
          {/* Links on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <Link
              href={`/vessel/${vessel.mmsi || vessel.id}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 transition-all"
              title="Digital Twin"
            >
              <Cpu className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/live/${vessel.mmsi || vessel.id}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white/60 transition-all"
              title="Live Track"
            >
              <MapPin className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`glass-panel relative overflow-hidden transition-all duration-300 cursor-pointer card-hover ${
        selected
          ? 'border-primary-500/50 bg-primary-500/10'
          : 'hover:border-primary-500/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/8">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            selected ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/70'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{vessel.name}</h3>
          <p className="text-xs text-white/40">
            {getVesselTypeDisplay(vessel)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {StatusIcon && <StatusIcon className={`h-4 w-4 ${status.textColor}`} />}
          <span className={`h-2.5 w-2.5 rounded-full ${status.color} ${
            vessel.status === 'alert' ? 'animate-pulse' : ''
          }`} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Health & Fuel */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Heart className={`h-4 w-4 ${healthColor}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Health</span>
                <span className={`font-medium ${healthColor}`}>{vessel.health_score ?? 100}%</span>
              </div>
              <div className="mt-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (vessel.health_score ?? 100) >= 70
                      ? 'bg-emerald-500'
                      : (vessel.health_score ?? 100) >= 40
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${vessel.health_score ?? 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Fuel className={`h-4 w-4 ${fuelColor}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Fuel</span>
                <span className={`font-medium ${fuelColor}`}>{Math.round(vessel.fuel_level ?? 100)}%</span>
              </div>
              <div className="mt-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (vessel.fuel_level ?? 100) >= 50
                      ? 'bg-emerald-500'
                      : (vessel.fuel_level ?? 100) >= 25
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${vessel.fuel_level ?? 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/8">
          <div className="flex items-center gap-1 text-white/40">
            <Navigation className="h-3.5 w-3.5" />
            <span>{vessel.speed?.toFixed(1) ?? 0} kn</span>
          </div>
          <div className="flex items-center gap-1 text-white/40">
            <Users className="h-3.5 w-3.5" />
            <span>{vessel.crew_count ?? 0} crew</span>
          </div>
          <div className="text-white/40 truncate max-w-[100px]" title={vessel.project ?? ''}>
            {vessel.project ?? 'Unassigned'}
          </div>
        </div>

        {/* Detail Links */}
        {linkToDetail && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/8">
            <Link
              href={`/vessel/${vessel.mmsi || vessel.id}`}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-primary-500/10 text-xs text-primary-400 hover:bg-primary-500/20 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Cpu className="w-3 h-3" />
              <span>Digital Twin</span>
            </Link>
            <Link
              href={`/live/${vessel.mmsi || vessel.id}`}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-white/5 text-xs text-white/60 hover:bg-white/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MapPin className="w-3 h-3" />
              <span>Live Track</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
