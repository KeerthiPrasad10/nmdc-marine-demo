'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Navigation,
  MapPin,
  Anchor,
  Fuel,
  Clock,
  TrendingDown,
  AlertTriangle,
  Plus,
  Trash2,
  ArrowRight,
  RotateCcw,
  Zap,
  Loader2,
  CheckCircle,
  GripVertical,
} from 'lucide-react';
import { Route, RouteOptimizationResult } from '@/lib/routes/types';

// ============================================================================
// Types
// ============================================================================

interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface RoutePlanningPanelProps {
  vesselId: string;
  vesselName: string;
  vesselType: string;
  initialOrigin?: { lat: number; lng: number; name?: string };
  initialDestination?: { lat: number; lng: number; name?: string };
  onRouteGenerated?: (route: Route) => void;
  onWaypointsChange?: (waypoints: Array<{ lat: number; lng: number }>) => void;
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function RoutePlanningPanel({
  vesselId,
  vesselName,
  vesselType,
  initialOrigin,
  initialDestination,
  onRouteGenerated,
  onWaypointsChange,
  compact = false,
}: RoutePlanningPanelProps) {
  // Form state
  const [origin, setOrigin] = useState<Waypoint | null>(
    initialOrigin
      ? { id: 'origin', name: initialOrigin.name || 'Origin', lat: initialOrigin.lat, lng: initialOrigin.lng }
      : null
  );
  const [destination, setDestination] = useState<Waypoint | null>(
    initialDestination
      ? { id: 'dest', name: initialDestination.name || 'Destination', lat: initialDestination.lat, lng: initialDestination.lng }
      : null
  );
  const [intermediateStops, setIntermediateStops] = useState<Waypoint[]>([]);
  const [returnToOrigin, setReturnToOrigin] = useState(false);

  // Priorities (0-100)
  const [priorities, setPriorities] = useState({
    time: 50,
    fuel: 50,
    cost: 50,
    emissions: 50,
    safety: 70,
  });

  // Result state
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<RouteOptimizationResult | any>(null);
  const [resultMode, setResultMode] = useState<'single' | 'multi-stop' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update map markers when origin/destination changes
  useEffect(() => {
    if (onWaypointsChange) {
      const waypoints: Array<{ lat: number; lng: number }> = [];
      if (origin) {
        waypoints.push({ lat: origin.lat, lng: origin.lng });
      }
      intermediateStops.forEach(stop => {
        waypoints.push({ lat: stop.lat, lng: stop.lng });
      });
      if (destination) {
        waypoints.push({ lat: destination.lat, lng: destination.lng });
      }
      onWaypointsChange(waypoints);
    }
  }, [origin, destination, intermediateStops, onWaypointsChange]);

  // Common ports for quick selection (UAE + regional)
  const commonPorts = [
    // UAE Ports
    { name: 'Abu Dhabi Port', lat: 24.4539, lng: 54.3773 },
    { name: 'Khalifa Port', lat: 24.8029, lng: 54.5950 },
    { name: 'Das Island', lat: 25.1533, lng: 52.8722 },
    { name: 'Ruwais', lat: 24.1167, lng: 52.7333 },
    { name: 'Fujairah Port', lat: 25.1164, lng: 56.3481 },
    { name: 'Dubai (Jebel Ali)', lat: 24.9857, lng: 55.0272 },
    // Regional ports (will demonstrate curved routing)
    { name: 'Doha, Qatar', lat: 25.2854, lng: 51.5310 },
    { name: 'Ras Laffan, Qatar', lat: 25.9300, lng: 51.5300 },
    { name: 'Kuwait Port', lat: 29.3800, lng: 47.9900 },
    { name: 'Dammam, Saudi', lat: 26.4500, lng: 50.1000 },
  ];

  const handleOptimize = useCallback(async () => {
    if (!origin || !destination) {
      setError('Please select both origin and destination');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isMultiStop = intermediateStops.length > 0;
      
      const response = await fetch('/api/route-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isMultiStop
            ? {
                vesselId,
                vesselName,
                vesselType,
                origin: { lat: origin.lat, lng: origin.lng, name: origin.name },
                stops: [
                  ...intermediateStops.map(s => ({ name: s.name, lat: s.lat, lng: s.lng })),
                  { name: destination.name, lat: destination.lat, lng: destination.lng },
                ],
                returnToOrigin,
              }
            : {
                vesselId,
                vesselName,
                vesselType,
                origin: { lat: origin.lat, lng: origin.lng, name: origin.name },
                destination: { lat: destination.lat, lng: destination.lng, name: destination.name },
                priorities,
              }
        ),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Optimization failed');
      }

      setResult(data.result);
      setResultMode(data.mode);

      // Handle different result formats
      if (data.mode === 'multi-stop') {
        // Multi-stop route result
        const multiStopResult = data.result;
        
        // Build waypoints from optimized order
        if (onWaypointsChange && multiStopResult.optimizedOrder) {
          const waypoints = multiStopResult.optimizedOrder.map((stop: { lat: number; lng: number }) => ({
            lat: stop.lat,
            lng: stop.lng,
          }));
          onWaypointsChange(waypoints);
        }
        
        // Notify parent of first route for route card display
        if (onRouteGenerated && multiStopResult.routes && multiStopResult.routes.length > 0) {
          // Create a combined route from all legs
          const firstRoute = multiStopResult.routes[0];
          const lastRoute = multiStopResult.routes[multiStopResult.routes.length - 1];
          const combinedRoute = {
            ...firstRoute,
            name: `Multi-stop: ${firstRoute.origin.name} → ${lastRoute.destination.name}`,
            destination: lastRoute.destination,
            totalDistance: multiStopResult.totalDistance,
            estimatedTime: multiStopResult.totalTime,
            fuelConsumption: multiStopResult.totalFuel,
            waypoints: multiStopResult.optimizedOrder.slice(1).map((stop: { lat: number; lng: number; name: string }) => ({
              lat: stop.lat,
              lng: stop.lng,
              name: stop.name,
            })),
          };
          onRouteGenerated(combinedRoute);
        }
      } else {
        // Single route result
        if (onRouteGenerated && data.result.recommendedRoute) {
          onRouteGenerated(data.result.recommendedRoute);
        }

        // Notify parent of waypoints for map visualization
        if (onWaypointsChange && data.result.recommendedRoute) {
          const waypoints = [
            { lat: data.result.recommendedRoute.origin.lat, lng: data.result.recommendedRoute.origin.lng },
            ...data.result.recommendedRoute.waypoints.map((wp: { lat: number; lng: number }) => ({ lat: wp.lat, lng: wp.lng })),
            { lat: data.result.recommendedRoute.destination.lat, lng: data.result.recommendedRoute.destination.lng },
          ];
          onWaypointsChange(waypoints);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize route');
    } finally {
      setIsLoading(false);
    }
  }, [origin, destination, intermediateStops, returnToOrigin, priorities, vesselId, vesselName, vesselType, onRouteGenerated, onWaypointsChange]);

  const addIntermediateStop = () => {
    const newStop: Waypoint = {
      id: `stop-${Date.now()}`,
      name: `Stop ${intermediateStops.length + 1}`,
      lat: 24.5,
      lng: 54.0,
    };
    setIntermediateStops([...intermediateStops, newStop]);
  };

  const removeIntermediateStop = (id: string) => {
    setIntermediateStops(intermediateStops.filter(s => s.id !== id));
  };

  const updateIntermediateStop = (id: string, updates: Partial<Waypoint>) => {
    setIntermediateStops(
      intermediateStops.map(s => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const resetForm = () => {
    setOrigin(null);
    setDestination(null);
    setIntermediateStops([]);
    setResult(null);
    setResultMode(null);
    setError(null);
    setPriorities({ time: 50, fuel: 50, cost: 50, emissions: 50, safety: 70 });
  };

  return (
    <div className={`bg-black rounded-xl border border-white/10 overflow-hidden ${compact ? '' : 'h-full'}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary-400" />
            <h3 className="text-sm font-medium text-white">Route Planning</h3>
          </div>
          <button
            onClick={resetForm}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`p-4 space-y-4 ${compact ? '' : 'overflow-y-auto max-h-[calc(100%-48px)]'}`}>
        {/* Origin Selection */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Origin</label>
          <div className="flex gap-2">
            <select
              value={origin ? `${origin.lat},${origin.lng}` : ''}
              onChange={(e) => {
                const [lat, lng] = e.target.value.split(',').map(Number);
                const port = commonPorts.find(p => p.lat === lat && p.lng === lng);
                if (port) {
                  setOrigin({ id: 'origin', name: port.name, lat: port.lat, lng: port.lng });
                }
              }}
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
            >
              <option value="">Select port...</option>
              {commonPorts.map((port) => (
                <option key={port.name} value={`${port.lat},${port.lng}`}>
                  {port.name}
                </option>
              ))}
            </select>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Intermediate Stops */}
        {intermediateStops.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs text-white/50">Stops</label>
            {intermediateStops.map((stop, index) => (
              <div key={stop.id} className="flex gap-2 items-center">
                <GripVertical className="w-4 h-4 text-white/30 cursor-grab" />
                <select
                  value={`${stop.lat},${stop.lng}`}
                  onChange={(e) => {
                    const [lat, lng] = e.target.value.split(',').map(Number);
                    const port = commonPorts.find(p => p.lat === lat && p.lng === lng);
                    if (port) {
                      updateIntermediateStop(stop.id, { name: port.name, lat: port.lat, lng: port.lng });
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
                >
                  <option value={`${stop.lat},${stop.lng}`}>
                    {stop.name || `Stop ${index + 1}`}
                  </option>
                  {commonPorts.map((port) => (
                    <option key={port.name} value={`${port.lat},${port.lng}`}>
                      {port.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeIntermediateStop(stop.id)}
                  className="p-2 rounded-lg hover:bg-rose-500/20 text-white/50 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Stop Button */}
        <button
          onClick={addIntermediateStop}
          className="w-full py-2 border border-dashed border-white/20 rounded-lg text-xs text-white/50 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add Intermediate Stop
        </button>

        {/* Destination Selection */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Destination</label>
          <div className="flex gap-2">
            <select
              value={destination ? `${destination.lat},${destination.lng}` : ''}
              onChange={(e) => {
                const [lat, lng] = e.target.value.split(',').map(Number);
                const port = commonPorts.find(p => p.lat === lat && p.lng === lng);
                if (port) {
                  setDestination({ id: 'dest', name: port.name, lat: port.lat, lng: port.lng });
                }
              }}
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
            >
              <option value="">Select port...</option>
              {commonPorts.map((port) => (
                <option key={port.name} value={`${port.lat},${port.lng}`}>
                  {port.name}
                </option>
              ))}
            </select>
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <Anchor className="w-4 h-4 text-rose-400" />
            </div>
          </div>
        </div>

        {/* Return to Origin Toggle */}
        {intermediateStops.length > 0 && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={returnToOrigin}
              onChange={(e) => setReturnToOrigin(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-xs text-white/70">Return to origin</span>
          </label>
        )}

        {/* Priority Sliders */}
        {!compact && intermediateStops.length === 0 && (
          <div className="space-y-3 pt-2">
            <label className="block text-xs text-white/50">Optimization Priorities</label>
            
            <PrioritySlider
              label="Speed"
              value={priorities.time}
              onChange={(v) => setPriorities({ ...priorities, time: v })}
              icon={<Clock className="w-3 h-3" />}
              color="cyan"
            />
            
            <PrioritySlider
              label="Fuel Efficiency"
              value={priorities.fuel}
              onChange={(v) => setPriorities({ ...priorities, fuel: v })}
              icon={<Fuel className="w-3 h-3" />}
              color="amber"
            />
            
            <PrioritySlider
              label="Low Emissions"
              value={priorities.emissions}
              onChange={(v) => setPriorities({ ...priorities, emissions: v })}
              icon={<TrendingDown className="w-3 h-3" />}
              color="emerald"
            />
            
            <PrioritySlider
              label="Safety"
              value={priorities.safety}
              onChange={(v) => setPriorities({ ...priorities, safety: v })}
              icon={<AlertTriangle className="w-3 h-3" />}
              color="rose"
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
            <p className="text-xs text-rose-400">{error}</p>
          </div>
        )}

        {/* Optimize Button */}
        <button
          onClick={handleOptimize}
          disabled={isLoading || !origin || !destination}
          className="w-full py-3 rounded-lg bg-primary-500/80 hover:bg-primary-500 disabled:bg-white/10 disabled:text-white/30 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Calculating Route...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Optimize Route
            </>
          )}
        </button>

        {/* Results - Single Route */}
        {result && resultMode === 'single' && result.recommendedRoute && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Route Optimized</span>
            </div>

            {/* Route Summary */}
            <div className="grid grid-cols-2 gap-2">
              <MetricCard
                label="Distance"
                value={`${result.recommendedRoute.totalDistance.toFixed(1)} nm`}
                icon={<Navigation className="w-3 h-3" />}
              />
              <MetricCard
                label="Duration"
                value={formatDuration(result.recommendedRoute.estimatedTime)}
                icon={<Clock className="w-3 h-3" />}
              />
              <MetricCard
                label="Fuel"
                value={`${Math.round(result.recommendedRoute.fuelConsumption)} L`}
                icon={<Fuel className="w-3 h-3" />}
              />
              <MetricCard
                label="CO₂"
                value={`${Math.round(result.recommendedRoute.emissions.co2)} kg`}
                icon={<TrendingDown className="w-3 h-3" />}
              />
            </div>

            {/* Risk Assessment */}
            {result.riskAssessment && result.riskAssessment.factors.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">Risk Factors</span>
                </div>
                <ul className="space-y-1">
                  {result.riskAssessment.factors.map((factor: { description: string }, i: number) => (
                    <li key={i} className="text-[10px] text-white/60">
                      • {factor.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Route Legs Preview */}
            {!compact && (
              <div className="space-y-1">
                <span className="text-xs text-white/50">Route Path</span>
                <div className="flex items-center gap-1 flex-wrap text-xs">
                  <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">
                    {result.recommendedRoute.origin.name}
                  </span>
                  {result.recommendedRoute.waypoints.slice(0, 3).map((wp: { name: string }, i: number) => (
                    <div key={i} className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-white/30" />
                      <span className="px-2 py-1 rounded bg-white/10 text-white/70">
                        {wp.name}
                      </span>
                    </div>
                  ))}
                  {result.recommendedRoute.waypoints.length > 3 && (
                    <span className="text-white/40">+{result.recommendedRoute.waypoints.length - 3} more</span>
                  )}
                  <ArrowRight className="w-3 h-3 text-white/30" />
                  <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-400">
                    {result.recommendedRoute.destination.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results - Multi-Stop Route */}
        {result && resultMode === 'multi-stop' && result.optimizedOrder && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Multi-Stop Route Optimized</span>
            </div>

            {/* Route Summary */}
            <div className="grid grid-cols-2 gap-2">
              <MetricCard
                label="Distance"
                value={`${result.totalDistance.toFixed(1)} nm`}
                icon={<Navigation className="w-3 h-3" />}
              />
              <MetricCard
                label="Duration"
                value={formatDuration(result.totalTime)}
                icon={<Clock className="w-3 h-3" />}
              />
              <MetricCard
                label="Fuel"
                value={`${Math.round(result.totalFuel)} L`}
                icon={<Fuel className="w-3 h-3" />}
              />
              <MetricCard
                label="Saved"
                value={`${result.savings.percentImprovement.toFixed(1)}%`}
                icon={<TrendingDown className="w-3 h-3" />}
              />
            </div>

            {/* Savings Info */}
            {result.savings.distanceSaved > 0 && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">Optimization Savings</span>
                </div>
                <div className="text-[10px] text-white/60 space-y-1">
                  <p>• {result.savings.distanceSaved.toFixed(1)} nm distance saved</p>
                  <p>• {formatDuration(result.savings.timeSaved)} time saved</p>
                  <p>• {Math.round(result.savings.fuelSaved)} L fuel saved</p>
                </div>
              </div>
            )}

            {/* Optimized Route Order */}
            {!compact && (
              <div className="space-y-1">
                <span className="text-xs text-white/50">Optimized Stop Order</span>
                <div className="flex items-center gap-1 flex-wrap text-xs">
                  {result.optimizedOrder.map((stop: { name: string }, i: number) => (
                    <div key={i} className="flex items-center gap-1">
                      {i > 0 && <ArrowRight className="w-3 h-3 text-white/30" />}
                      <span className={`px-2 py-1 rounded ${
                        i === 0 ? 'bg-emerald-500/20 text-emerald-400' :
                        i === result.optimizedOrder.length - 1 ? 'bg-rose-500/20 text-rose-400' :
                        'bg-white/10 text-white/70'
                      }`}>
                        {stop.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function PrioritySlider({
  label,
  value,
  onChange,
  icon,
  color,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: React.ReactNode;
  color: 'cyan' | 'amber' | 'emerald' | 'rose';
}) {
  const colorClasses = {
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 flex justify-center ${colorClasses[color]}`}>{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-white/50">{label}</span>
          <span className="text-[10px] text-white/70">{value}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-400"
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center gap-1.5 text-white/50 mb-1">
        {icon}
        <span className="text-[10px]">{label}</span>
      </div>
      <div className="text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return `${days}d ${remainingHours}h`;
}

export default RoutePlanningPanel;

