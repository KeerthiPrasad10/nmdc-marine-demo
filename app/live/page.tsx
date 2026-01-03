'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Radio, Ship, ChevronLeft, RefreshCw, ExternalLink, Navigation } from 'lucide-react';
import Link from 'next/link';
import type { FleetVessel } from '@/app/api/fleet/route';
import 'leaflet/dist/leaflet.css';

// UAE/Abu Dhabi region
const UAE_CENTER = { lat: 24.5, lng: 54.5 };

const TYPE_COLORS: Record<string, string> = {
  dredger: '#f97316',
  hopper_dredger: '#ef4444',
  csd: '#a855f7',
  tug: '#10b981',
  supply: '#3b82f6',
  barge: '#f59e0b',
  survey: '#06b6d4',
  crane_barge: '#eab308',
  unknown: '#9ca3af',
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || TYPE_COLORS.unknown;
}

function formatTimeAgo(dateInput?: Date | string | null): string {
  if (!dateInput) return 'Unknown';
  let date: Date;
  if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return 'Unknown';
  }
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function NMDCFleetMap() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  const [vessels, setVessels] = useState<FleetVessel[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<FleetVessel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch NMDC fleet
  const fetchFleet = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/fleet?action=fleet');
      const data = await response.json();

      if (data.success) {
        setVessels(data.vessels);
        setLastRefresh(new Date());
      } else {
        setError(data.message || 'Failed to fetch fleet');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFleet();
  }, [fetchFleet]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchFleet, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchFleet]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initMap = async () => {
      const L = await import('leaflet');
      leafletRef.current = L.default || L;

      if ((containerRef.current as HTMLElement & { _leaflet_id?: string })?._leaflet_id) {
        return;
      }

      const map = leafletRef.current.map(containerRef.current, {
        center: [UAE_CENTER.lat, UAE_CENTER.lng],
        zoom: 9,
        zoomControl: false,
        attributionControl: true,
      });

      leafletRef.current.control.zoom({ position: 'bottomright' }).addTo(map);

      leafletRef.current.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; CartoDB',
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
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

    // Remove old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    const bounds: [number, number][] = [];

    vessels.forEach(vessel => {
      if (!vessel.isOnline || !vessel.position?.lat) return;

      const color = getTypeColor(vessel.nmdc?.type || vessel.type);
      const isSelected = selectedVessel?.mmsi === vessel.mmsi;

      // Use circleMarker for reliable rendering
      const marker = L.circleMarker([vessel.position.lat, vessel.position.lng], {
        radius: isSelected ? 14 : 10,
        fillColor: color,
        color: isSelected ? '#fff' : '#000',
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: 0.9,
      })
        .addTo(map)
        .on('click', () => setSelectedVessel(vessel));

      marker.bindTooltip(`
        <div style="font-weight: 600;">${vessel.name}</div>
        <div style="font-size: 11px; opacity: 0.7;">${vessel.nmdc?.type || vessel.type}</div>
      `, {
        permanent: false,
        direction: 'top',
        offset: [0, -12],
        className: 'vessel-tooltip',
      });

      markersRef.current.set(vessel.mmsi, marker);
      bounds.push([vessel.position.lat, vessel.position.lng]);
    });

    // Fit to bounds if we have vessels
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [vessels, selectedVessel, mapReady]);

  // Pan to selected vessel
  useEffect(() => {
    if (selectedVessel && mapRef.current && selectedVessel.position?.lat) {
      mapRef.current.flyTo([selectedVessel.position.lat, selectedVessel.position.lng], 12, {
        duration: 0.5,
      });
    }
  }, [selectedVessel]);

  const onlineVessels = vessels.filter(v => v.isOnline);
  const typeCounts = vessels.reduce((acc, v) => {
    const type = v.nmdc?.type || v.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="h-screen flex bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-white/10 flex flex-col bg-[#0a0a0a]`}
      >
        <div className="p-4 border-b border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors">
                <ChevronLeft className="h-5 w-5 text-white/60" />
              </Link>
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-green-400 animate-pulse" />
                <span className="font-semibold">NMDC Fleet</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">{onlineVessels.length}</div>
              <div className="text-xs text-white/50">Online</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold">{vessels.length}</div>
              <div className="text-xs text-white/50">Total Fleet</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={fetchFleet}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                autoRefresh ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/60'
              }`}
            >
              Auto
            </button>
          </div>

          {lastRefresh && (
            <p className="text-xs text-white/40 mt-2">
              Last updated: {formatTimeAgo(lastRefresh)}
            </p>
          )}
        </div>

        {/* Type Legend */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeCounts).slice(0, 6).map(([type, count]) => (
              <button
                key={type}
                className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded text-xs hover:bg-white/10 transition-colors"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getTypeColor(type) }} />
                <span className="capitalize">{type.replace(/_/g, ' ')}: {count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Vessel List */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="m-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="p-2">
            {vessels.map(vessel => (
              <div
                key={vessel.mmsi}
                className={`mb-2 p-3 rounded-lg cursor-pointer transition-all ${
                  selectedVessel?.mmsi === vessel.mmsi
                    ? 'bg-white/10 border border-white/20'
                    : 'bg-white/5 hover:bg-white/8 border border-transparent'
                }`}
                onClick={() => setSelectedVessel(vessel)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${getTypeColor(vessel.nmdc?.type || vessel.type)}20` }}
                  >
                    <Ship className="h-4 w-4" style={{ color: getTypeColor(vessel.nmdc?.type || vessel.type) }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">{vessel.name}</h3>
                      {vessel.isOnline && (
                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-white/40 flex items-center gap-2">
                      <span className="capitalize">{(vessel.nmdc?.type || vessel.type).replace(/_/g, ' ')}</span>
                      {vessel.speed != null && <span>• {vessel.speed.toFixed(1)} kn</span>}
                    </div>
                  </div>
                  <Link
                    href={`/live/${vessel.mmsi}`}
                    className="p-1.5 text-white/30 hover:text-white/60 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Toggle Sidebar */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/80 border border-white/10 rounded-r-lg hover:bg-black transition-colors"
        style={{ left: sidebarOpen ? '320px' : '0' }}
      >
        <ChevronLeft className={`h-4 w-4 text-white/60 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="absolute inset-0" />

        {isLoading && vessels.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 text-white/60 animate-spin mx-auto mb-3" />
              <p className="text-white/60">Loading NMDC Fleet...</p>
            </div>
          </div>
        )}

        {/* Selected Vessel Panel */}
        {selectedVessel && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[400px] max-w-[calc(100vw-2rem)]">
            <div className="bg-black/90 backdrop-blur-lg rounded-xl border border-white/10 p-4 shadow-2xl">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${getTypeColor(selectedVessel.nmdc?.type || selectedVessel.type)}20` }}
                >
                  <Ship className="h-6 w-6" style={{ color: getTypeColor(selectedVessel.nmdc?.type || selectedVessel.type) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg truncate">{selectedVessel.name}</h3>
                    {selectedVessel.isOnline && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">Online</span>
                    )}
                  </div>
                  <p className="text-sm text-white/50 capitalize mb-2">
                    {(selectedVessel.nmdc?.type || selectedVessel.type).replace(/_/g, ' ')}
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-white/40 text-xs">Speed</span>
                      <p className="font-medium">{selectedVessel.speed?.toFixed(1) || '0'} kn</p>
                    </div>
                    <div>
                      <span className="text-white/40 text-xs">Heading</span>
                      <p className="font-medium flex items-center gap-1">
                        <Navigation className="h-3 w-3" style={{ transform: `rotate(${selectedVessel.heading || 0}deg)` }} />
                        {selectedVessel.heading?.toFixed(0) || '0'}°
                      </p>
                    </div>
                    <div>
                      <span className="text-white/40 text-xs">Health</span>
                      <p className="font-medium">{selectedVessel.healthScore || 0}%</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/live/${selectedVessel.mmsi}`}
                    className="px-3 py-1.5 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
                  >
                    Details
                  </Link>
                  <button
                    onClick={() => setSelectedVessel(null)}
                    className="px-3 py-1.5 text-white/40 text-sm hover:text-white/60 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .vessel-marker {
          background: transparent !important;
          border: none !important;
        }
        .vessel-tooltip {
          background: rgba(0,0,0,0.9) !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
          color: white !important;
          padding: 6px 10px !important;
          border-radius: 6px !important;
          font-size: 12px !important;
        }
        .vessel-tooltip::before {
          border-top-color: rgba(0,0,0,0.9) !important;
        }
        .leaflet-container {
          background: #1a1a1a !important;
          font-family: inherit !important;
        }
        .leaflet-control-zoom {
          border: 1px solid rgba(255,255,255,0.1) !important;
          background: rgba(0,0,0,0.8) !important;
        }
        .leaflet-control-zoom a {
          background: transparent !important;
          color: white !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.5) !important;
          color: rgba(255,255,255,0.4) !important;
        }
        .leaflet-control-attribution a {
          color: rgba(255,255,255,0.6) !important;
        }
      `}</style>
    </div>
  );
}
