'use client';

import Link from 'next/link';
import { Vessel } from '@/lib/supabase';
import { getWeatherAtLocation, getWeatherIcon } from '@/lib/weather';
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
} from 'lucide-react';

interface VesselCardProps {
  vessel: Vessel;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
  linkToDetail?: boolean;
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

export function VesselCard({ vessel, onClick, selected, compact = false, linkToDetail = false }: VesselCardProps) {
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

  // Compact mode for sidebar - clean, minimal design
  if (compact) {
    const vesselType = getVesselTypeDisplay(vessel);
    
    return (
      <div
        onClick={onClick}
        className={`group relative overflow-hidden rounded-lg border transition-all duration-200 ${
          onClick ? 'cursor-pointer hover:bg-white/5' : ''
        } ${selected ? 'border-white/30 bg-white/5' : 'border-white/5 bg-transparent hover:border-white/10'}`}
      >
        <div className="flex items-center gap-3 p-2.5">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded ${
              selected ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-medium truncate ${selected ? 'text-white' : 'text-white/80'}`}>
                {vessel.name}
              </h3>
              {vessel.status === 'alert' && (
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
              {vessel.status === 'maintenance' && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              )}
            </div>
            <p className="text-[10px] text-white/30 truncate capitalize">{vesselType}</p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-white/40">
              <span className={healthColor}>{vessel.health_score ?? 100}%</span>
              <span>·</span>
              <span className={fuelColor}>{Math.round(vessel.fuel_level ?? 100)}% fuel</span>
              <span>·</span>
              <span>{vessel.speed?.toFixed(1) ?? 0} kn</span>
            </div>
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
