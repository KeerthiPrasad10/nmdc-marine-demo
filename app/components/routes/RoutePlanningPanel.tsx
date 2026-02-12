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
  Waves,
  Wind,
  DollarSign,
  Shield,
  Sparkles,
  Ship,
  Calendar,
  Timer,
  Gauge,
  Leaf,
  Info,
  ChevronDown,
  ChevronUp,
  Lightbulb,
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

  // Optimization mode
  const [useSmartMode, setUseSmartMode] = useState(true);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Smart Priorities - all optimized by default
  const priorities = {
    fuel: 70,
    time: 60,
    emissions: 70,
    cost: 60,
    safety: 80,
    comfort: 50,
  };

  // Smart optimization options
  const [departureTime, setDepartureTime] = useState<string>('');
  const [arrivalWindow, setArrivalWindow] = useState({
    enabled: false,
    earliest: '',
    latest: '',
    preferredTime: '',
  });
  const [portConditions, setPortConditions] = useState({
    enabled: false,
    berthAvailable: true,
    expectedBerthTime: '',
    congestionLevel: 'low' as 'low' | 'medium' | 'high',
  });
  const [preferences, setPreferences] = useState({
    maxWaveHeight: 3.0,
    maxWindSpeed: 25,
  });

  // Result state
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<RouteOptimizationResult | any>(null);
  const [resultMode, setResultMode] = useState<'single' | 'multi-stop' | 'smart' | null>(null);
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

  // All Middle East ports with accurate coordinates from Datalastic API
  const commonPorts = [
    // === UAE Ports ===
    { name: '🇦🇪 Musaffah (Marine Base)', lat: 24.33506, lng: 54.43968 },
    { name: '🇦🇪 Abu Dhabi', lat: 24.4821, lng: 54.50214 },
    { name: '🇦🇪 Khalifa Port', lat: 24.78751, lng: 54.67621 },
    { name: '🇦🇪 Jebel Ali (Dubai)', lat: 25.00328, lng: 55.05206 },
    { name: '🇦🇪 Dubai', lat: 25.27754, lng: 55.29378 },
    { name: '🇦🇪 Das Island', lat: 25.1465, lng: 52.891 },
    { name: '🇦🇪 Ruwais', lat: 24.15887, lng: 52.73211 },
    { name: '🇦🇪 Jebel Dhanna', lat: 24.18434, lng: 52.59507 },
    { name: '🇦🇪 Fujairah', lat: 25.16122, lng: 56.36583 },
    { name: '🇦🇪 Zirku Island', lat: 24.87291, lng: 53.08971 },
    { name: '🇦🇪 Sharjah', lat: 25.36205, lng: 55.37989 },
    { name: '🇦🇪 Khor Fakkan', lat: 25.35783, lng: 56.36544 },
    { name: '🇦🇪 Arzanah', lat: 24.77533, lng: 52.5631 },
    { name: '🇦🇪 Mubarraz', lat: 24.53195, lng: 53.34188 },
    { name: '🇦🇪 Zakum', lat: 24.88638, lng: 53.68538 },
    // === Qatar Ports ===
    { name: '🇶🇦 Doha', lat: 25.305, lng: 51.552 },
    { name: '🇶🇦 Ras Laffan', lat: 25.90255, lng: 51.61554 },
    { name: '🇶🇦 Mesaieed', lat: 24.93598, lng: 51.59607 },
    { name: '🇶🇦 Hamad Port', lat: 25.02946, lng: 51.6245 },
    { name: '🇶🇦 Halul Island', lat: 25.6635, lng: 52.4175 },
    // === Saudi Arabia Ports (Gulf Coast) ===
    { name: '🇸🇦 Dammam', lat: 26.441, lng: 50.1485 },
    { name: '🇸🇦 Ras Tanura', lat: 26.67255, lng: 50.1219 },
    { name: '🇸🇦 Al Jubail', lat: 27.035, lng: 49.6795 },
    { name: '🇸🇦 Ras Al Khair', lat: 27.55828, lng: 49.18322 },
    // Note: Red Sea ports below - routing from Gulf will fail
    { name: '🇸🇦 Jeddah (Red Sea)', lat: 21.48182, lng: 39.14713 },
    { name: '🇸🇦 Yanbu (Red Sea)', lat: 24.0665, lng: 38.0675 },
    { name: '🇸🇦 King Abdullah (Red Sea)', lat: 22.52477, lng: 39.09416 },
    // === Kuwait Ports ===
    { name: '🇰🇼 Kuwait', lat: 29.3663, lng: 48.00172 },
    { name: '🇰🇼 Shuwaikh', lat: 29.359635, lng: 47.923489 },
    { name: '🇰🇼 Mina Al Ahmadi', lat: 29.0663, lng: 48.16348 },
    { name: '🇰🇼 Shuaiba', lat: 29.03937, lng: 48.16788 },
    // === Bahrain Ports ===
    { name: '🇧🇭 Mina Sulman', lat: 26.18934, lng: 50.6087 },
    { name: '🇧🇭 Khalifa Bin Salman', lat: 26.19784, lng: 50.71145 },
    { name: '🇧🇭 Sitrah', lat: 26.15065, lng: 50.6529 },
    // === Oman Ports ===
    { name: '🇴🇲 Muscat', lat: 23.62733, lng: 58.57026 },
    { name: '🇴🇲 Sohar', lat: 24.50074, lng: 56.62371 },
    { name: '🇴🇲 Salalah', lat: 16.95312, lng: 54.00435 },
    { name: '🇴🇲 Duqm', lat: 19.67459, lng: 57.70646 },
    { name: '🇴🇲 Khasab', lat: 26.2042, lng: 56.24992 },
    { name: '🇴🇲 Sur', lat: 22.57859, lng: 59.52914 },
    // === Iraq Ports ===
    { name: '🇮🇶 Basrah', lat: 30.54325, lng: 47.80325 },
    { name: '🇮🇶 Umm Qasr', lat: 30.02737, lng: 47.973 },
    { name: '🇮🇶 Khor Al Zubair', lat: 30.19381, lng: 47.8767 },
    // === Iran Ports ===
    { name: '🇮🇷 Bandar Abbas', lat: 27.17667, lng: 56.27861 },
    { name: '🇮🇷 Chabahar', lat: 25.31749, lng: 60.60548 },
    { name: '🇮🇷 Kangan', lat: 27.8305, lng: 52.05661 },
    { name: '🇮🇷 Lengeh', lat: 26.54945, lng: 54.88763 },
    { name: '🇮🇷 Qeshm Island', lat: 26.95164, lng: 55.75161 },
    // === Yemen Ports ===
    { name: '🇾🇪 Aden', lat: 12.79113, lng: 44.96292 },
    { name: '🇾🇪 Hudaidah', lat: 14.83994, lng: 42.93277 },
    { name: '🇾🇪 Al Mukalla', lat: 14.52996, lng: 49.13709 },
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
      
      // Build request body based on mode
      let requestBody;
      
      if (isMultiStop) {
        // Multi-stop mode
        requestBody = {
                vesselId,
                vesselName,
                vesselType,
                origin: { lat: origin.lat, lng: origin.lng, name: origin.name },
                stops: [
                  ...intermediateStops.map(s => ({ name: s.name, lat: s.lat, lng: s.lng })),
                  { name: destination.name, lat: destination.lat, lng: destination.lng },
                ],
                returnToOrigin,
        };
      } else if (useSmartMode) {
        // Smart optimization mode
        requestBody = {
          mode: 'smart',
                vesselId,
                vesselName,
                vesselType,
                origin: { lat: origin.lat, lng: origin.lng, name: origin.name },
                destination: { lat: destination.lat, lng: destination.lng, name: destination.name },
                priorities,
          ...(departureTime && { departureTime }),
          ...(arrivalWindow.enabled && {
            arrivalWindow: {
              earliest: arrivalWindow.earliest,
              latest: arrivalWindow.latest,
              ...(arrivalWindow.preferredTime && { preferredTime: arrivalWindow.preferredTime }),
            },
          }),
          ...(portConditions.enabled && {
            portConditions: {
              berthAvailable: portConditions.berthAvailable,
              ...(portConditions.expectedBerthTime && { expectedBerthTime: portConditions.expectedBerthTime }),
              congestionLevel: portConditions.congestionLevel,
            },
          }),
          preferences: {
            maxWaveHeight: preferences.maxWaveHeight,
            maxWindSpeed: preferences.maxWindSpeed,
          },
        };
      } else {
        // Basic optimization mode
        requestBody = {
          vesselId,
          vesselName,
          vesselType,
          origin: { lat: origin.lat, lng: origin.lng, name: origin.name },
          destination: { lat: destination.lat, lng: destination.lng, name: destination.name },
          priorities: {
            time: priorities.time,
            fuel: priorities.fuel,
            cost: priorities.cost,
            emissions: priorities.emissions,
            safety: priorities.safety,
          },
        };
      }
      
      const response = await fetch('/api/route-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
        
        // Combine all leg waypoints for proper sea route visualization
        // This includes all the intermediate waypoints from each leg, not just the stops
        if (multiStopResult.routes && multiStopResult.routes.length > 0) {
          const allWaypoints: Array<{ lat: number; lng: number; name?: string }> = [];
          
          // Start with origin
          const firstRoute = multiStopResult.routes[0];
          allWaypoints.push({
            lat: firstRoute.origin.lat,
            lng: firstRoute.origin.lng,
            name: firstRoute.origin.name,
          });
          
          // Add all waypoints from each leg
          for (const route of multiStopResult.routes) {
            // Add intermediate waypoints from this leg (these are the sea route waypoints)
            if (route.waypoints && route.waypoints.length > 0) {
              for (const wp of route.waypoints) {
                allWaypoints.push({
                  lat: wp.lat,
                  lng: wp.lng,
                  name: wp.name,
                });
              }
            }
            // Add destination of this leg
            allWaypoints.push({
              lat: route.destination.lat,
              lng: route.destination.lng,
              name: route.destination.name,
            });
          }
          
          // Notify parent of all waypoints for map visualization
          if (onWaypointsChange) {
            onWaypointsChange(allWaypoints);
          }
          
          // Create a combined route for route card display
          const lastRoute = multiStopResult.routes[multiStopResult.routes.length - 1];
          const combinedRoute = {
            ...firstRoute,
            name: `Multi-stop: ${firstRoute.origin.name} → ${lastRoute.destination.name}`,
            destination: lastRoute.destination,
            totalDistance: multiStopResult.totalDistance,
            estimatedTime: multiStopResult.totalTime,
            fuelConsumption: multiStopResult.totalFuel,
            waypoints: allWaypoints.slice(1), // All waypoints except origin
          };
          
          if (onRouteGenerated) {
            onRouteGenerated(combinedRoute);
          }
        }
      } else if (data.mode === 'smart') {
        // Smart optimization result
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
  }, [origin, destination, intermediateStops, returnToOrigin, priorities, vesselId, vesselName, vesselType, onRouteGenerated, onWaypointsChange, useSmartMode, departureTime, arrivalWindow, portConditions, preferences]);

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
    setDepartureTime('');
    setArrivalWindow({ enabled: false, earliest: '', latest: '', preferredTime: '' });
    setPortConditions({ enabled: false, berthAvailable: true, expectedBerthTime: '', congestionLevel: 'low' });
    setShowAdvancedOptions(false);
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

        {/* Smart Mode Toggle */}
        {!compact && intermediateStops.length === 0 && (
          <div className="pt-2">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <div>
                  <span className="text-xs font-medium text-white">Smart Optimization</span>
                  <p className="text-[10px] text-white/50">Weather, currents, speed profiles</p>
                </div>
              </div>
              <button
                onClick={() => setUseSmartMode(!useSmartMode)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  useSmartMode ? 'bg-violet-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    useSmartMode ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Smart Optimization - What will be optimized */}
            {useSmartMode && (
              <div className="space-y-4">
                {/* Optimization Factors - Simple icon grid */}
                <div>
                  <label className="block text-xs text-white/50 mb-2">Optimizing for:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <OptimizationFactor icon={<Fuel className="w-4 h-4" />} label="Fuel" color="amber" />
                    <OptimizationFactor icon={<Gauge className="w-4 h-4" />} label="Speed" color="cyan" />
                    <OptimizationFactor icon={<Leaf className="w-4 h-4" />} label="Emissions" color="emerald" />
                    <OptimizationFactor icon={<DollarSign className="w-4 h-4" />} label="Cost" color="yellow" />
                    <OptimizationFactor icon={<Shield className="w-4 h-4" />} label="Safety" color="rose" />
                    <OptimizationFactor icon={<Waves className="w-4 h-4" />} label="Comfort" color="blue" />
                  </div>
                </div>

                {/* Departure Time */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Departure Time <span className="text-white/30">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                {/* Advanced Options Toggle */}
                <button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  <span className="text-xs text-white/70">Advanced Options</span>
                  {showAdvancedOptions ? (
                    <ChevronUp className="w-4 h-4 text-white/50" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/50" />
                  )}
                </button>

                {/* Advanced Options */}
                {showAdvancedOptions && (
                  <div className="space-y-4 p-3 rounded-lg bg-white/5 border border-white/10">
                    {/* Arrival Window */}
                    <div>
                      <label className="flex items-center gap-2 mb-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={arrivalWindow.enabled}
                          onChange={(e) => setArrivalWindow({ ...arrivalWindow, enabled: e.target.checked })}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500"
                        />
                        <span className="text-xs text-white/70 flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          Arrival Window (Just-in-Time)
                        </span>
                      </label>
                      
                      {arrivalWindow.enabled && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <label className="block text-[10px] text-white/40 mb-1">Earliest</label>
                            <input
                              type="datetime-local"
                              value={arrivalWindow.earliest}
                              onChange={(e) => setArrivalWindow({ ...arrivalWindow, earliest: e.target.value })}
                              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-violet-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-white/40 mb-1">Latest</label>
                            <input
                              type="datetime-local"
                              value={arrivalWindow.latest}
                              onChange={(e) => setArrivalWindow({ ...arrivalWindow, latest: e.target.value })}
                              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-violet-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Port Conditions (Virtual Arrival) */}
                    <div>
                      <label className="flex items-center gap-2 mb-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={portConditions.enabled}
                          onChange={(e) => setPortConditions({ ...portConditions, enabled: e.target.checked })}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500"
                        />
                        <span className="text-xs text-white/70 flex items-center gap-1">
                          <Ship className="w-3 h-3" />
                          Port Conditions (Virtual Arrival)
                        </span>
                      </label>
                      
                      {portConditions.enabled && (
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={portConditions.berthAvailable}
                                onChange={(e) => setPortConditions({ ...portConditions, berthAvailable: e.target.checked })}
                                className="w-3 h-3 rounded border-white/20 bg-white/5 text-violet-500"
                              />
                              <span className="text-[10px] text-white/60">Berth Available</span>
                            </label>
                          </div>
                          
                          {!portConditions.berthAvailable && (
                            <div>
                              <label className="block text-[10px] text-white/40 mb-1">Expected Berth Time</label>
                              <input
                                type="datetime-local"
                                value={portConditions.expectedBerthTime}
                                onChange={(e) => setPortConditions({ ...portConditions, expectedBerthTime: e.target.value })}
                                className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-violet-500"
                              />
                            </div>
                          )}
                          
                          <div>
                            <label className="block text-[10px] text-white/40 mb-1">Congestion Level</label>
                            <select
                              value={portConditions.congestionLevel}
                              onChange={(e) => setPortConditions({ ...portConditions, congestionLevel: e.target.value as 'low' | 'medium' | 'high' })}
                              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-violet-500"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Weather Preferences */}
                    <div>
                      <label className="block text-xs text-white/70 mb-2 flex items-center gap-1">
                        <Wind className="w-3 h-3" />
                        Weather Limits
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-white/40 mb-1">Max Wave Height (m)</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="10"
                            value={preferences.maxWaveHeight}
                            onChange={(e) => setPreferences({ ...preferences, maxWaveHeight: parseFloat(e.target.value) })}
                            className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-violet-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/40 mb-1">Max Wind (knots)</label>
                          <input
                            type="number"
                            step="5"
                            min="10"
                            max="50"
                            value={preferences.maxWindSpeed}
                            onChange={(e) => setPreferences({ ...preferences, maxWindSpeed: parseInt(e.target.value) })}
                            className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-violet-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
          className={`w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            useSmartMode && intermediateStops.length === 0
              ? 'bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white shadow-lg shadow-violet-500/25'
              : 'bg-primary-500/80 hover:bg-primary-500 text-white'
          } disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {useSmartMode ? 'Smart Analyzing...' : 'Calculating Route...'}
            </>
          ) : (
            <>
              {useSmartMode && intermediateStops.length === 0 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Smart Optimize Route
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Optimize Route
                </>
              )}
            </>
          )}
        </button>

        {/* Results - Smart Optimization */}
        {result && resultMode === 'smart' && result.recommendedRoute && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-violet-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium">Smart Route Optimized</span>
            </div>

            {/* Optimized Factors with Checkmarks */}
            <div className="grid grid-cols-6 gap-1.5">
              <OptimizationFactor icon={<Fuel className="w-3.5 h-3.5" />} label="Fuel" color="amber" optimized />
              <OptimizationFactor icon={<Gauge className="w-3.5 h-3.5" />} label="Speed" color="cyan" optimized />
              <OptimizationFactor icon={<Leaf className="w-3.5 h-3.5" />} label="CO₂" color="emerald" optimized />
              <OptimizationFactor icon={<DollarSign className="w-3.5 h-3.5" />} label="Cost" color="yellow" optimized />
              <OptimizationFactor icon={<Shield className="w-3.5 h-3.5" />} label="Safe" color="rose" optimized />
              <OptimizationFactor icon={<Waves className="w-3.5 h-3.5" />} label="Comfort" color="blue" optimized />
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
                value={`${Math.round(result.metrics.totalFuel)} L`}
                icon={<Fuel className="w-3 h-3" />}
              />
              <MetricCard
                label="CO₂"
                value={`${Math.round(result.metrics.totalEmissions.co2)} kg`}
                icon={<Leaf className="w-3 h-3" />}
              />
            </div>

            {/* Savings Highlight */}
            {(result.metrics.fuelSaved > 0 || result.metrics.costSaved > 0) && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">Smart Savings</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-sm font-bold text-white">{Math.round(result.metrics.fuelSaved)} L</div>
                    <div className="text-[10px] text-white/50">Fuel Saved</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">${result.metrics.costSaved.toFixed(0)}</div>
                    <div className="text-[10px] text-white/50">Cost Saved</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{Math.round(result.metrics.emissionsSaved.co2)} kg</div>
                    <div className="text-[10px] text-white/50">CO₂ Reduced</div>
                  </div>
                </div>
              </div>
            )}

            {/* Virtual Arrival Recommendation */}
            {result.timing.virtualArrivalRecommended && result.timing.virtualArrivalSavings && (
              <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Ship className="w-3 h-3 text-violet-400" />
                  <span className="text-xs font-medium text-violet-400">Virtual Arrival Recommended</span>
                </div>
                <p className="text-[10px] text-white/60 mb-2">
                  Slow down to arrive when berth is ready, avoiding anchoring wait time.
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div>
                    <div className="text-xs font-medium text-white">{Math.round(result.timing.virtualArrivalSavings.fuelSaved)} L</div>
                    <div className="text-white/40">Extra Fuel Saved</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">{result.timing.virtualArrivalSavings.waitingReduced.toFixed(1)}h</div>
                    <div className="text-white/40">Wait Reduced</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">{Math.round(result.timing.virtualArrivalSavings.emissionsSaved)} kg</div>
                    <div className="text-white/40">CO₂ Saved</div>
                  </div>
                </div>
              </div>
            )}

            {/* Speed Profile Summary */}
            {result.speedProfile && result.speedProfile.length > 0 && (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs font-medium text-white/80">Speed Profile</span>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {result.speedProfile.slice(0, 6).map((profile: { recommendedSpeed: number; reason: string }, i: number) => (
                    <div 
                      key={i}
                      className="flex-shrink-0 px-2 py-1 rounded bg-cyan-500/20 border border-cyan-500/30"
                      title={profile.reason}
                    >
                      <div className="text-[10px] text-white/50">Seg {i + 1}</div>
                      <div className="text-xs font-medium text-cyan-400">{profile.recommendedSpeed.toFixed(1)} kt</div>
                    </div>
                  ))}
                  {result.speedProfile.length > 6 && (
                    <div className="text-[10px] text-white/40 px-2">+{result.speedProfile.length - 6}</div>
                  )}
                </div>
              </div>
            )}

            {/* Weather Effects */}
            {result.weatherRouting && (Math.abs(result.weatherRouting.currentAssist) > 0.1 || Math.abs(result.weatherRouting.windEffect) > 0.1) && (
              <div className="flex gap-2">
                {Math.abs(result.weatherRouting.currentAssist) > 0.1 && (
                  <div className={`flex-1 p-2 rounded-lg border ${
                    result.weatherRouting.currentAssist > 0 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-amber-500/10 border-amber-500/30'
                  }`}>
                    <div className="flex items-center gap-1 mb-1">
                      <Waves className="w-3 h-3" />
                      <span className="text-[10px] text-white/50">Current</span>
                    </div>
                    <span className={`text-xs font-medium ${
                      result.weatherRouting.currentAssist > 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {result.weatherRouting.currentAssist > 0 ? '+' : ''}{result.weatherRouting.currentAssist.toFixed(1)} kt
                    </span>
                  </div>
                )}
                {Math.abs(result.weatherRouting.windEffect) > 0.1 && (
                  <div className={`flex-1 p-2 rounded-lg border ${
                    result.weatherRouting.windEffect > 0 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-amber-500/10 border-amber-500/30'
                  }`}>
                    <div className="flex items-center gap-1 mb-1">
                      <Wind className="w-3 h-3" />
                      <span className="text-[10px] text-white/50">Wind</span>
                    </div>
                    <span className={`text-xs font-medium ${
                      result.weatherRouting.windEffect > 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {result.weatherRouting.windEffect > 0 ? '+' : ''}{result.weatherRouting.windEffect.toFixed(1)} kt
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-white/50">
                  <Lightbulb className="w-3 h-3" />
                  <span className="text-[10px]">Recommendations</span>
                </div>
                {result.recommendations.slice(0, 3).map((rec: { type: string; priority: string; title: string; description: string; potentialSavings?: { fuel?: number; cost?: number } }, i: number) => (
                  <div 
                    key={i}
                    className={`p-2 rounded-lg border ${
                      rec.priority === 'high' 
                        ? 'bg-violet-500/10 border-violet-500/30' 
                        : rec.priority === 'medium'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Info className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                        rec.priority === 'high' ? 'text-violet-400' :
                        rec.priority === 'medium' ? 'text-amber-400' : 'text-white/50'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white/90">{rec.title}</div>
                        <div className="text-[10px] text-white/50 line-clamp-2">{rec.description}</div>
                        {rec.potentialSavings && (rec.potentialSavings.fuel || rec.potentialSavings.cost) && (
                          <div className="text-[10px] text-emerald-400 mt-1">
                            {rec.potentialSavings.fuel && `${Math.round(rec.potentialSavings.fuel)}L fuel`}
                            {rec.potentialSavings.fuel && rec.potentialSavings.cost && ' · '}
                            {rec.potentialSavings.cost && `$${rec.potentialSavings.cost.toFixed(0)} saved`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Arrival Time */}
            {result.timing && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-white/50" />
                  <span className="text-xs text-white/70">Est. Arrival</span>
                </div>
                <span className="text-xs font-medium text-white">
                  {new Date(result.timing.estimatedArrival).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

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

function OptimizationFactor({
  icon,
  label,
  color,
  optimized = false,
}: {
  icon: React.ReactNode;
  label: string;
  color: 'cyan' | 'amber' | 'emerald' | 'rose' | 'yellow' | 'blue' | 'violet';
  optimized?: boolean;
}) {
  const colorClasses = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  };

  const iconColorClasses = {
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    violet: 'text-violet-400',
  };

  return (
    <div className={`relative p-2 rounded-lg border ${colorClasses[color]} flex flex-col items-center gap-1`}>
      <div className={iconColorClasses[color]}>{icon}</div>
      <span className="text-[10px] text-white/70">{label}</span>
      {optimized && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      )}
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

