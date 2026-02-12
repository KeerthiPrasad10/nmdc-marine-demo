'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Radio, Ship, RefreshCw, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { FleetVessel } from '@/app/api/fleet/route';
import 'leaflet/dist/leaflet.css';

interface FleetMeta {
  source?: string;
  fetchedAt?: string;
  cached?: boolean;
  rateLimited?: boolean;
  note?: string;
}

interface LiveVesselsPanelProps {
  onVesselSelect?: (vessel: FleetVessel) => void;
  // If provided, use these instead of fetching
  fleetData?: FleetVessel[];
  fleetMeta?: FleetMeta;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const TYPE_COLORS: Record<string, { color: string; label: string }> = {
  dredger: { color: '#f97316', label: 'Dredger' },
  hopper_dredger: { color: '#ef4444', label: 'Hopper Dredger' },
  csd: { color: '#a855f7', label: 'Cutter Suction' },
  tug: { color: '#10b981', label: 'Tugboat' },
  supply: { color: '#3b82f6', label: 'Supply Vessel' },
  barge: { color: '#f59e0b', label: 'Barge' },
  survey: { color: '#06b6d4', label: 'Survey Vessel' },
  crane_barge: { color: '#eab308', label: 'Crane Barge' },
  unknown: { color: '#9ca3af', label: 'Unknown' },
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type]?.color || TYPE_COLORS.unknown.color;
}


export function LiveVesselsPanel({ 
  onVesselSelect, 
  fleetData, 
  fleetMeta, 
  onRefresh: externalRefresh,
  isLoading: externalLoading,
}: LiveVesselsPanelProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  
  // Use external data if provided, otherwise manage internal state
  const [internalVessels, setInternalVessels] = useState<FleetVessel[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState<FleetVessel | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [internalMeta, setInternalMeta] = useState<FleetMeta | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  // Determine which data to use
  const vessels = fleetData ?? internalVessels;
  const meta = fleetMeta ?? internalMeta;
  const isLoading = externalLoading ?? internalLoading;

  // Fetch fleet data (only if not using external data)
  const fetchFleet = useCallback(async (forceRefresh = false) => {
    if (fleetData) return; // Skip if using external data
    
    setInternalLoading(true);
    try {
      const url = forceRefresh 
        ? '/api/fleet?action=fleet&refresh=true' 
        : '/api/fleet?action=fleet';
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setInternalVessels(data.vessels);
        setInternalMeta(data.meta);
      }
    } catch (err) {
      console.error('Error fetching fleet:', err);
    } finally {
      setInternalLoading(false);
    }
  }, [fleetData]);

  // Fetch API stats to show remaining credits
  const fetchApiStats = useCallback(async () => {
    try {
      const response = await fetch('/api/fleet?action=api-stats');
      const data = await response.json();
      if (data.success) {
        setCreditsRemaining(data.apiStats?.requestsRemaining ?? null);
      }
    } catch (err) {
      console.error('Error fetching API stats:', err);
    }
  }, []);

  // Handle refresh with confirmation if credits are low
  const handleRefresh = useCallback(() => {
    if (creditsRemaining !== null && creditsRemaining < 100) {
      const confirm = window.confirm(
        `⚠️ Low API credits!\n\nRemaining: ${creditsRemaining} credits\nThis refresh will use: 15 credits\n\nContinue?`
      );
      if (!confirm) return;
    }
    
    // Use external refresh if provided, otherwise internal
    if (externalRefresh) {
      externalRefresh();
    } else {
      fetchFleet(true);
    }
    // Update credits after refresh
    setTimeout(fetchApiStats, 1000);
  }, [creditsRemaining, fetchFleet, fetchApiStats, externalRefresh]);

  // Initial fetch only - no auto-refresh to conserve API credits
  useEffect(() => {
    if (!fleetData) {
      fetchFleet();
    }
    fetchApiStats();
  }, [fetchFleet, fetchApiStats, fleetData]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Prevent double initialization
    if (mapRef.current) {
      setMapReady(true);
      return;
    }

    const initMap = async () => {
      try {
        const L = await import('leaflet');
        leafletRef.current = L.default || L;

        // Double check container isn't already initialized
        const container = mapContainerRef.current as HTMLElement & { _leaflet_id?: string };
        if (container?._leaflet_id) {
          setMapReady(true);
          return;
        }

        const map = leafletRef.current.map(mapContainerRef.current, {
          center: [24.5, 54.5],
          zoom: 8,
          zoomControl: true,
          attributionControl: false,
        });

        leafletRef.current.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;
        setMapReady(true);
        
        // Force a resize after initialization
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      } catch (err) {
        console.error('Map init error:', err);
        setMapError('Failed to load map');
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Update markers when vessels change
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !mapReady) return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    const bounds: [number, number][] = [];
    // Show ALL vessels, not just online ones
    const vesselsWithPosition = vessels.filter(v => v.position?.lat && v.position?.lng);

    vesselsWithPosition.forEach(vessel => {
      const color = getTypeColor(vessel.legacyMarine?.type || vessel.type);
      const isSelected = selectedVessel?.mmsi === vessel.mmsi;
      const isOnline = vessel.isOnline;

      // Use native Leaflet circleMarker for reliability
      const marker = L.circleMarker([vessel.position.lat, vessel.position.lng], {
        radius: isSelected ? 10 : 7,
        fillColor: isOnline ? color : '#6b7280',
        color: isSelected ? '#ffffff' : '#000000',
        weight: isSelected ? 3 : 1,
        opacity: 1,
        fillOpacity: isOnline ? 0.9 : 0.5,
      })
        .addTo(map)
        .on('click', () => {
          setSelectedVessel(vessel);
          onVesselSelect?.(vessel);
        });

      // Tooltip shows vessel name and status
      const statusText = isOnline ? 'Live' : 'Offline';
      const statusColor = isOnline ? '#22c55e' : '#6b7280';
      
      marker.bindTooltip(`
        <div style="text-align: center;">
          <div style="font-weight: 600;">${vessel.name}</div>
          <div style="font-size: 10px; color: ${statusColor};">${statusText}</div>
        </div>
      `, {
        permanent: false,
        direction: 'top',
        offset: [0, -8],
        className: 'vessel-tooltip',
      });

      markersRef.current.set(vessel.mmsi, marker);
      bounds.push([vessel.position.lat, vessel.position.lng]);
    });

    // Fit to bounds if we have vessels
    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
      } catch (e) {
        console.error('fitBounds error:', e);
      }
    }

    // Force redraw
    map.invalidateSize();
  }, [vessels, selectedVessel, mapReady, onVesselSelect]);

  const onlineCount = vessels.filter(v => v.isOnline).length;

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]" style={{ minHeight: '400px', height: '100%' }}>
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`h-4 w-4 ${meta?.rateLimited ? 'text-amber-400' : 'text-green-400'} ${!meta?.cached && !meta?.rateLimited ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium text-white">Grid Fleet</span>
            <span className="text-xs text-white/40">
              {onlineCount}/{vessels.length}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-white/40 hover:text-white/60 hover:bg-white/5 rounded transition-colors"
            title={`Refresh live data (uses 15 credits)${creditsRemaining !== null ? ` - ${creditsRemaining} remaining` : ''}`}
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        {/* Data source indicator */}
        <div className="flex items-center justify-between mt-1.5 text-[10px]">
          <div className="flex items-center gap-2">
            <span className={`px-1.5 py-0.5 rounded ${
              meta?.rateLimited ? 'bg-amber-500/20 text-amber-400' :
              meta?.cached ? 'bg-blue-500/20 text-blue-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {meta?.rateLimited ? 'Simulated' : meta?.cached ? 'Cached' : 'Live'}
            </span>
            {meta?.fetchedAt && (
              <span className="text-white/30">
                {new Date(meta.fetchedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          {creditsRemaining !== null && (
            <span className={`px-1.5 py-0.5 rounded ${
              creditsRemaining < 100 ? 'bg-red-500/20 text-red-400' :
              creditsRemaining < 500 ? 'bg-amber-500/20 text-amber-400' :
              'bg-white/5 text-white/40'
            }`}>
              {creditsRemaining.toLocaleString()} credits
            </span>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative" style={{ minHeight: '200px' }}>
        <div 
          ref={mapContainerRef} 
          className="absolute inset-0 z-0"
          style={{ background: '#1a1a1a' }}
        />
        
        {isLoading && vessels.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <RefreshCw className="h-6 w-6 text-white/40 animate-spin" />
          </div>
        )}

        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <p className="text-red-400 text-sm">{mapError}</p>
          </div>
        )}

        {/* Vessel count overlay */}
        {mapReady && vessels.length > 0 && (
          <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-black/80 rounded text-xs text-white/70 flex items-center gap-2">
            <span>{vessels.length} vessels</span>
            <span className="text-white/40">•</span>
            <span className="text-green-400">{onlineCount} live</span>
            <span className="text-white/40">{vessels.length - onlineCount} offline</span>
          </div>
        )}
      </div>

      {/* Selected Vessel Info */}
      {selectedVessel && (
        <div className="flex-shrink-0 p-3 border-t border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative"
              style={{ backgroundColor: `${getTypeColor(selectedVessel.legacyMarine?.type || selectedVessel.type)}20` }}
            >
              <Ship className="h-4 w-4" style={{ color: getTypeColor(selectedVessel.legacyMarine?.type || selectedVessel.type) }} />
              {selectedVessel.isOnline && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white truncate">{selectedVessel.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  selectedVessel.isOnline ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'
                }`}>
                  {selectedVessel.isOnline ? 'Live' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-white/40">
                {selectedVessel.speed?.toFixed(1) || 0} kn • {selectedVessel.heading?.toFixed(0) || 0}°
              </p>
            </div>
            <Link
              href={`/live/${selectedVessel.mmsi}`}
              className="p-2 text-white/40 hover:text-white/60 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-white/5">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {Object.entries(TYPE_COLORS)
            .filter(([type]) => type !== 'unknown')
            .map(([type, { color, label }]) => (
              <div key={type} className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24">
                  <path d="M12 2L4 14H8V22H16V14H20L12 2Z" fill={color} stroke="#000" strokeWidth="1"/>
                </svg>
                <span className="text-[10px] text-white/50">{label}</span>
              </div>
            ))}
          <div className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" style={{ opacity: 0.4 }}>
              <path d="M12 2L4 14H8V22H16V14H20L12 2Z" fill="#6b7280" stroke="#000" strokeWidth="1"/>
            </svg>
            <span className="text-[10px] text-white/40">Offline</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .vessel-tooltip {
          background: rgba(0,0,0,0.9) !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
          color: white !important;
          font-size: 11px !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
        }
        .vessel-tooltip::before {
          border-top-color: rgba(0,0,0,0.9) !important;
        }
        .leaflet-container {
          background: #1a1a1a !important;
        }
        .leaflet-control-zoom {
          border: none !important;
        }
        .leaflet-control-zoom a {
          background: rgba(0,0,0,0.7) !important;
          color: white !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(0,0,0,0.9) !important;
        }
      `}</style>
    </div>
  );
}

export default LiveVesselsPanel;
