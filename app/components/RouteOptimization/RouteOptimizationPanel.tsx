'use client';

import { useState } from 'react';
import { RouteOptimizationResult } from '@/lib/route-optimization/types';
import { formatDistance, formatDuration, formatFuel, formatCurrency } from '@/lib/route-optimization/optimizer';
import { RouteComparisonMap } from './RouteComparisonMap';
import {
  Route,
  Clock,
  Fuel,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Navigation,
  CloudRain,
  Wind,
  Anchor,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  Ship,
} from 'lucide-react';

interface RouteOptimizationPanelProps {
  result: RouteOptimizationResult;
  onApplyRoute?: (routeId: string) => void;
  onDismiss?: () => void;
}

const recommendationStyles = {
  use_optimized: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    label: 'Recommended: Use Optimized Route',
    icon: CheckCircle,
  },
  use_original: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    label: 'Recommended: Use Direct Route',
    icon: Navigation,
  },
  review_required: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    label: 'Manual Review Required',
    icon: AlertTriangle,
  },
};

const safetyStyles = {
  significant: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Significant Safety Improvement' },
  moderate: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', label: 'Moderate Safety Improvement' },
  minor: { bg: 'bg-white/10', text: 'text-white/70', label: 'Minor Safety Improvement' },
  none: { bg: 'bg-white/5', text: 'text-white/50', label: 'No Safety Change' },
};

export function RouteOptimizationPanel({ result, onApplyRoute, onDismiss }: RouteOptimizationPanelProps) {
  const [showOptimizations, setShowOptimizations] = useState(true);
  const [showOriginalRoute, setShowOriginalRoute] = useState(true);
  const [showOptimizedRoute, setShowOptimizedRoute] = useState(true);
  const [showWeatherZones, setShowWeatherZones] = useState(true);

  const recStyle = recommendationStyles[result.recommendation];
  const RecIcon = recStyle.icon;
  const safetyStyle = safetyStyles[result.summary.safetyImprovement];

  // Calculate if optimized route is longer (tradeoff for safety)
  const isLonger = result.summary.distanceDeltaNm < 0;

  return (
    <div className="bg-gradient-to-b from-slate-900 to-black rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Route className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Route Optimization</h2>
              <p className="text-xs text-white/50">
                {result.origin.name} → {result.destination.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">{result.confidence}% confidence</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="p-4">
        <RouteComparisonMap
          result={result}
          showOriginal={showOriginalRoute}
          showOptimized={showOptimizedRoute}
          showWeatherZones={showWeatherZones}
          height="320px"
        />

        {/* Map Controls */}
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={() => setShowOriginalRoute(!showOriginalRoute)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              showOriginalRoute ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-white/40'
            }`}
          >
            {showOriginalRoute ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Original
          </button>
          <button
            onClick={() => setShowOptimizedRoute(!showOptimizedRoute)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              showOptimizedRoute ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'
            }`}
          >
            {showOptimizedRoute ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Optimized
          </button>
          <button
            onClick={() => setShowWeatherZones(!showWeatherZones)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              showWeatherZones ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white/40'
            }`}
          >
            {showWeatherZones ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Weather
          </button>
        </div>
      </div>

      {/* Recommendation Banner */}
      <div className={`mx-4 mb-4 p-4 rounded-xl ${recStyle.bg} border ${recStyle.border}`}>
        <div className="flex items-start gap-3">
          <RecIcon className={`w-5 h-5 ${recStyle.text} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <div className={`text-sm font-medium ${recStyle.text}`}>{recStyle.label}</div>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">{result.reasoningText}</p>
          </div>
        </div>
      </div>

      {/* Route Comparison Cards */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Original Route */}
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-medium text-rose-400 uppercase tracking-wide">Direct Route</span>
            </div>
            <div className="space-y-2">
              <MetricRow icon={Route} label="Distance" value={formatDistance(result.originalRoute.totalDistanceNm)} />
              <MetricRow icon={Clock} label="Duration" value={formatDuration(result.originalRoute.estimatedDurationHours)} />
              <MetricRow icon={Fuel} label="Fuel" value={formatFuel(result.originalRoute.estimatedFuelLiters)} />
              <MetricRow icon={DollarSign} label="Cost" value={formatCurrency(result.originalRoute.estimatedCostUSD)} />
            </div>
            {result.weatherZonesAvoided.length > 0 && (
              <div className="mt-3 pt-3 border-t border-rose-500/20">
                <div className="flex items-center gap-1.5 text-rose-400 text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  Passes through {result.weatherZonesAvoided.length} hazard zone(s)
                </div>
              </div>
            )}
          </div>

          {/* Optimized Route */}
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Optimized Route</span>
            </div>
            <div className="space-y-2">
              <MetricRow 
                icon={Route} 
                label="Distance" 
                value={formatDistance(result.optimizedRoute.totalDistanceNm)}
                delta={result.summary.distanceDeltaNm}
                invertDelta
              />
              <MetricRow 
                icon={Clock} 
                label="Duration" 
                value={formatDuration(result.optimizedRoute.estimatedDurationHours)}
                delta={result.summary.timeDeltaHours}
                invertDelta
              />
              <MetricRow 
                icon={Fuel} 
                label="Fuel" 
                value={formatFuel(result.optimizedRoute.estimatedFuelLiters)}
                delta={result.summary.fuelDeltaLiters}
                invertDelta
              />
              <MetricRow 
                icon={DollarSign} 
                label="Cost" 
                value={formatCurrency(result.optimizedRoute.estimatedCostUSD)}
                delta={result.summary.costDeltaUSD}
                invertDelta
              />
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-500/20">
              <div className={`flex items-center gap-1.5 text-xs ${safetyStyle.text}`}>
                <Shield className="w-3 h-3" />
                {safetyStyle.label}
              </div>
              {result.summary.safetyReasoning && (
                <p className="mt-2 text-[10px] text-white/50 leading-relaxed">
                  {result.summary.safetyReasoning}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hazards Avoided */}
      {result.hazardsAvoided && result.hazardsAvoided.length > 0 && (
        <div className="px-4 pb-4">
          <div className="text-xs font-medium text-white/50 uppercase tracking-wide mb-2">
            Hazards Avoided
          </div>
          <div className="space-y-2">
            {result.hazardsAvoided.map((hazard, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-300">{hazard.name}</span>
                </div>
                <p className="mt-1 text-[10px] text-white/50 ml-6">{hazard.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waypoints */}
      <div className="px-4 pb-4">
        <button
          onClick={() => setShowOptimizations(!showOptimizations)}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
        >
          <span className="text-sm font-medium text-white/70">
            Route Waypoints ({result.optimizedRoute.waypoints.length})
          </span>
          <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showOptimizations ? 'rotate-180' : ''}`} />
        </button>

        {showOptimizations && (
          <div className="mt-3 space-y-2">
            {result.optimizedRoute.waypoints.map((waypoint, index) => (
              <div
                key={waypoint.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  waypoint.type === 'origin' ? 'bg-blue-500/20 text-blue-400' :
                  waypoint.type === 'destination' ? 'bg-purple-500/20 text-purple-400' :
                  waypoint.type === 'weather_avoidance' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-white/10 text-white/50'
                }`}>
                  {waypoint.type === 'origin' ? <Ship className="w-4 h-4" /> :
                   waypoint.type === 'destination' ? <Anchor className="w-4 h-4" /> :
                   waypoint.type === 'weather_avoidance' ? <Wind className="w-4 h-4" /> :
                   <span className="text-xs font-medium">{index}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{waypoint.name || `Waypoint ${index + 1}`}</div>
                  <div className="text-[10px] text-white/40">
                    {waypoint.lat.toFixed(4)}°N, {waypoint.lng.toFixed(4)}°E
                    {waypoint.distanceFromPrevious && waypoint.distanceFromPrevious > 0 && (
                      <span className="ml-2">• {formatDistance(waypoint.distanceFromPrevious)} from previous</span>
                    )}
                  </div>
                  {waypoint.notes && (
                    <div className="text-[10px] text-emerald-400/70 mt-0.5">{waypoint.notes}</div>
                  )}
                </div>
                {index < result.optimizedRoute.waypoints.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-white/20" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weather Zones Avoided */}
      {result.weatherZonesAvoided.length > 0 && (
        <div className="px-4 pb-4">
          <div className="text-xs font-medium text-white/50 uppercase tracking-wide mb-2">
            Weather Hazards Avoided
          </div>
          <div className="space-y-2">
            {result.weatherZonesAvoided.map((zone) => (
              <div
                key={zone.id}
                className={`p-3 rounded-lg border ${
                  zone.severity === 'severe' ? 'bg-rose-500/10 border-rose-500/30' :
                  zone.severity === 'moderate' ? 'bg-amber-500/10 border-amber-500/30' :
                  'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  {zone.type === 'storm' ? <CloudRain className="w-4 h-4" /> : <Wind className="w-4 h-4" />}
                  <span className="text-sm font-medium text-white">{zone.name || zone.type}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                    zone.severity === 'severe' ? 'bg-rose-500/30 text-rose-300' :
                    zone.severity === 'moderate' ? 'bg-amber-500/30 text-amber-300' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {zone.severity}
                  </span>
                </div>
                <div className="text-xs text-white/50 mt-1">
                  {zone.windSpeedKnots && `${zone.windSpeedKnots} knot winds`}
                  {zone.waveHeightM && ` • ${zone.waveHeightM}m waves`}
                  {` • ${Math.round(zone.radiusNm)}nm radius`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 bg-white/[0.02] border-t border-white/5">
        <div className="flex gap-3">
          <button
            onClick={() => onApplyRoute?.(result.originalRoute.id)}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium transition-colors"
          >
            Use Direct Route
          </button>
          <button
            onClick={() => onApplyRoute?.(result.optimizedRoute.id)}
            className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          >
            Use Optimized Route
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

interface MetricRowProps {
  icon: typeof Route;
  label: string;
  value: string;
  delta?: number;
  invertDelta?: boolean; // If true, positive delta means savings (original - optimized)
  formatDelta?: (val: number) => string; // Custom formatter for delta
}

function MetricRow({ icon: Icon, label, value, delta, invertDelta, formatDelta }: MetricRowProps) {
  const showDelta = delta !== undefined && Math.abs(delta) > 0.1;
  // When invertDelta is true: positive delta = savings = good (green)
  // When invertDelta is false: positive delta = increase = bad (red)
  const isGood = invertDelta ? delta! > 0 : delta! < 0;

  const formatDeltaValue = (val: number): string => {
    if (formatDelta) return formatDelta(Math.abs(val));
    if (Math.abs(val) >= 1000) return `${(Math.abs(val) / 1000).toFixed(1)}K`;
    if (Math.abs(val) >= 100) return Math.round(Math.abs(val)).toString();
    return Math.abs(val).toFixed(1);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-white/50">
        <Icon className="w-3 h-3" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">{value}</span>
        {showDelta && (
          <span className={`text-[10px] ${isGood ? 'text-emerald-400' : 'text-rose-400'}`}>
            {invertDelta ? (delta! > 0 ? '-' : '+') : (delta! > 0 ? '+' : '')}{formatDeltaValue(delta!)}
          </span>
        )}
      </div>
    </div>
  );
}

