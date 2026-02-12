'use client';

import {
  Navigation,
  Clock,
  Fuel,
  TrendingDown,
  AlertTriangle,
  MoreVertical,
  Play,
  Trash2,
  Eye,
} from 'lucide-react';
import { Route } from '@/lib/routes/types';
import { useState } from 'react';

interface RouteCardProps {
  route: Route;
  onView?: (route: Route) => void;
  onActivate?: (route: Route) => void;
  onDelete?: (route: Route) => void;
  compact?: boolean;
}

export function RouteCard({
  route,
  onView,
  onActivate,
  onDelete,
  compact = false,
}: RouteCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const statusColors = {
    planned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    completed: 'bg-white/10 text-white/50 border-white/20',
  };

  const formatDuration = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
  };

  if (compact) {
    return (
      <div
        onClick={() => onView?.(route)}
        className="p-3 rounded-lg bg-white/[0.02] border border-white/10 hover:border-white/20 cursor-pointer transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white truncate">{route.name}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] border ${statusColors[route.status]}`}>
            {route.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-white/50">
          <span className="flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            {route.totalDistance.toFixed(0)} nm
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(route.estimatedTime)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-white">{route.name}</h3>
          <p className="text-xs text-white/40 mt-0.5">{route.vesselName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[route.status]}`}>
            {route.status}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 py-1 bg-black border border-white/20 rounded-lg shadow-xl z-10 min-w-[120px]">
                {onView && (
                  <button
                    onClick={() => { onView(route); setShowMenu(false); }}
                    className="w-full px-3 py-1.5 text-left text-xs text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <Eye className="w-3 h-3" />
                    View on Map
                  </button>
                )}
                {onActivate && route.status === 'planned' && (
                  <button
                    onClick={() => { onActivate(route); setShowMenu(false); }}
                    className="w-full px-3 py-1.5 text-left text-xs text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2"
                  >
                    <Play className="w-3 h-3" />
                    Activate
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => { onDelete(route); setShowMenu(false); }}
                    className="w-full px-3 py-1.5 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Route Path */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 truncate max-w-[80px]">
          {route.origin.name}
        </span>
        <div className="flex-1 border-t border-dashed border-white/20 relative">
          {route.waypoints.length > 0 && (
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-1 bg-black text-[10px] text-white/40">
              +{route.waypoints.length} stops
            </span>
          )}
        </div>
        <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 truncate max-w-[80px]">
          {route.destination.name}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2 rounded-lg bg-white/5">
          <div className="flex items-center gap-1 text-white/40 mb-0.5">
            <Navigation className="w-3 h-3" />
            <span className="text-[10px]">Distance</span>
          </div>
          <div className="text-xs font-medium text-white">
            {route.totalDistance.toFixed(1)} nm
          </div>
        </div>
        
        <div className="p-2 rounded-lg bg-white/5">
          <div className="flex items-center gap-1 text-white/40 mb-0.5">
            <Clock className="w-3 h-3" />
            <span className="text-[10px]">Duration</span>
          </div>
          <div className="text-xs font-medium text-white">
            {formatDuration(route.estimatedTime)}
          </div>
        </div>
        
        <div className="p-2 rounded-lg bg-white/5">
          <div className="flex items-center gap-1 text-white/40 mb-0.5">
            <Fuel className="w-3 h-3" />
            <span className="text-[10px]">Fuel</span>
          </div>
          <div className="text-xs font-medium text-white">
            {Math.round(route.fuelConsumption)} L
          </div>
        </div>
        
        <div className="p-2 rounded-lg bg-white/5">
          <div className="flex items-center gap-1 text-white/40 mb-0.5">
            <TrendingDown className="w-3 h-3" />
            <span className="text-[10px]">CO₂</span>
          </div>
          <div className="text-xs font-medium text-white">
            {Math.round(route.emissions.co2)} kg
          </div>
        </div>
      </div>

      {/* Weather Risk Indicator */}
      {route.weatherRisk > 50 && (
        <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] text-amber-400">
            Elevated weather risk ({Math.round(route.weatherRisk)}%)
          </span>
        </div>
      )}

      {/* Created At */}
      <div className="mt-3 text-[10px] text-white/30">
        Created {new Date(route.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}

export default RouteCard;













