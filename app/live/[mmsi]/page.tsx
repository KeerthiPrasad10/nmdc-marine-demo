'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import {
  Radio,
  Ship,
  ChevronLeft,
  RefreshCw,
  MapPin,
  Globe,
  Gauge,
  Compass,
  Navigation,
  Clock,
  Anchor,
  Ruler,
  Calendar,
  Phone,
  Flag,
  History,
  Info,
  Target,
  TrendingUp,
  Waves,
} from 'lucide-react';
import type { SimplifiedVessel } from '@/lib/datalastic';

// Mapbox token from environment
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface VesselInfo {
  uuid: string;
  name: string;
  name_ais?: string;
  mmsi: string;
  imo?: string;
  eni?: string;
  country_iso?: string;
  country_name?: string;
  callsign?: string;
  type?: string;
  type_specific?: string;
  gross_tonnage?: number;
  deadweight?: number;
  teu?: number;
  liquid_gas?: number;
  length?: number;
  breadth?: number;
  draught_avg?: number;
  draught_max?: number;
  speed_avg?: number;
  speed_max?: number;
  year_built?: string;
  home_port?: string;
}

interface HistoricalPosition {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  heading: number;
  destination?: string;
  last_position_epoch: number;
  last_position_UTC: string;
}

interface VesselHistory {
  uuid: string;
  name: string;
  mmsi: string;
  imo?: string;
  positions: HistoricalPosition[];
}

const TYPE_COLORS: Record<string, string> = {
  tanker: '#ef4444',
  cargo: '#3b82f6',
  container: '#8b5cf6',
  passenger: '#ec4899',
  tug: '#10b981',
  tugboat: '#10b981',
  offshore: '#f59e0b',
  supply: '#06b6d4',
  dredger: '#a855f7',
  fishing: '#22c55e',
  sailing: '#0ea5e9',
  military: '#6b7280',
  other: '#f97316',
  reserved: '#14b8a6',
  unknown: '#9ca3af',
};

function getTypeColor(type?: string): string {
  if (!type) return TYPE_COLORS.unknown;
  const lowerType = type.toLowerCase();
  return TYPE_COLORS[lowerType] || TYPE_COLORS.unknown;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function VesselTrackingContent({ mmsi }: { mmsi: string }) {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trackLineRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  const [vessel, setVessel] = useState<SimplifiedVessel | null>(null);
  const [vesselInfo, setVesselInfo] = useState<VesselInfo | null>(null);
  const [history, setHistory] = useState<VesselHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [historyDays, setHistoryDays] = useState(1);
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'info'>('live');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch live vessel position
  const fetchVessel = useCallback(async () => {
    try {
      const response = await fetch(`/api/live-vessels?action=single&mmsi=${mmsi}`);
      const data = await response.json();
      if (data.success && data.vessel) {
        setVessel(data.vessel);
        setLastRefresh(new Date());
      } else {
        setError(data.message || 'Vessel not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vessel');
    }
  }, [mmsi]);

  // Fetch vessel info
  const fetchVesselInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/live-vessels?action=info&mmsi=${mmsi}`);
      const data = await response.json();
      if (data.success && data.info) {
        setVesselInfo(data.info);
      }
    } catch (err) {
      console.error('Failed to fetch vessel info:', err);
    }
  }, [mmsi]);

  // Fetch historical track
  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/live-vessels?action=history&mmsi=${mmsi}&days=${historyDays}`);
      const data = await response.json();
      if (data.success && data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, [mmsi, historyDays]);

  // Initial data fetch
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);
      await Promise.all([fetchVessel(), fetchVesselInfo(), fetchHistory()]);
      setIsLoading(false);
    };
    fetchAll();
  }, [fetchVessel, fetchVesselInfo, fetchHistory]);

  // Auto-refresh live position
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshInterval.current = setInterval(fetchVessel, 10000);
    } else if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
    }
    return () => {
      if (autoRefreshInterval.current) clearInterval(autoRefreshInterval.current);
    };
  }, [autoRefresh, fetchVessel]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initMap = async () => {
      const L = await import('leaflet');
      leafletRef.current = L.default || L;

      const map = leafletRef.current.map(containerRef.current, {
        center: [24.8, 54.0],
        zoom: 10,
        zoomControl: true,
      });

      if (MAPBOX_TOKEN) {
        leafletRef.current.tileLayer(
          `https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
          { maxZoom: 19, tileSize: 512, zoomOffset: -1 }
        ).addTo(map);
      } else {
        leafletRef.current.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(map);
      }

      leafletRef.current.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
        maxZoom: 19,
        opacity: 0.6,
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map with vessel position and track
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !mapReady) return;

    // Clear existing
    if (trackLineRef.current) {
      trackLineRef.current.remove();
      trackLineRef.current = null;
    }
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    const color = getTypeColor(vessel?.type);

    // Draw historical track
    if (history?.positions && history.positions.length > 0) {
      const trackPoints = history.positions.map(p => [p.lat, p.lon] as [number, number]);
      
      // Add gradient effect by drawing multiple lines
      trackLineRef.current = L.polyline(trackPoints, {
        color: color,
        weight: 3,
        opacity: 0.7,
        smoothFactor: 1,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '10, 5',
      }).addTo(map);

      // Add time markers for significant points
      history.positions.forEach((pos, idx) => {
        if (idx % Math.ceil(history.positions.length / 5) === 0 || idx === 0) {
          const timeMarker = L.circleMarker([pos.lat, pos.lon], {
            radius: 4,
            fillColor: color,
            color: '#fff',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.8,
          }).addTo(map);
          
          timeMarker.bindTooltip(formatDate(pos.last_position_UTC), {
            permanent: false,
            direction: 'top',
            className: 'track-tooltip',
          });
        }
      });
    }

    // Add current position marker
    if (vessel) {
      const rotation = vessel.heading || vessel.course || 0;
      const icon = L.divIcon({
        className: 'vessel-tracking-marker',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            transform: rotate(${rotation}deg);
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
          ">
            <svg viewBox="0 0 24 24" fill="${color}">
              <path d="M12 2L4 20h16L12 2z"/>
            </svg>
          </div>
          <div style="
            position: absolute;
            top: -4px;
            left: -4px;
            width: 40px;
            height: 40px;
            border: 2px solid ${color};
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      markerRef.current = L.marker([vessel.position.lat, vessel.position.lng], { icon }).addTo(map);
      
      map.setView([vessel.position.lat, vessel.position.lng], 11);
    }
  }, [vessel, history, mapReady]);

  // Re-fetch history when days change
  useEffect(() => {
    if (!isLoading) {
      fetchHistory();
    }
  }, [historyDays]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-green-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading vessel data...</p>
        </div>
      </div>
    );
  }

  if (error && !vessel) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Ship className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">Vessel Not Found</p>
          <p className="text-white/60 mb-4">{error}</p>
          <Link href="/live" className="text-green-400 hover:underline">
            ← Back to Live Tracking
          </Link>
        </div>
      </div>
    );
  }

  const color = getTypeColor(vessel?.type);

  return (
    <div className="h-screen w-screen flex bg-black overflow-hidden">
      {/* Sidebar */}
      <aside className="w-96 flex-shrink-0 bg-[#0a0a0a] border-r border-white/5 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-white/5">
          <Link
            href="/live"
            className="flex items-center gap-2 text-white/40 hover:text-white/60 text-xs mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Fleet View
          </Link>

          <div className="flex items-start gap-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              <Ship className="h-7 w-7" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white truncate">{vessel?.name || 'Unknown'}</h1>
              <p className="text-sm text-white/50 capitalize">
                {vesselInfo?.type_specific || vessel?.type?.replace(/_/g, ' ') || 'Unknown Type'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-white/40">MMSI: {mmsi}</span>
                {vessel?.imo && <span className="text-xs text-white/40">IMO: {vessel.imo}</span>}
              </div>
            </div>
          </div>

          {/* Live Status */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-green-400 animate-pulse" />
              <span className="text-sm text-green-400">Live Tracking</span>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-xs px-2 py-1 rounded ${
                autoRefresh
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {autoRefresh ? 'Auto: ON' : 'Auto: OFF'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 border-b border-white/5">
          <div className="flex">
            {[
              { id: 'live', label: 'Live', icon: Target },
              { id: 'history', label: 'Track', icon: History },
              { id: 'info', label: 'Details', icon: Info },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'text-white border-b-2 border-green-500'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'live' && vessel && (
            <div className="space-y-4">
              {/* Position Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <Gauge className="h-5 w-5 mx-auto text-white/40 mb-1" />
                  <div className="text-xl font-bold text-white">{vessel.speed?.toFixed(1) || '0'}</div>
                  <div className="text-xs text-white/40">Speed (kn)</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <Compass className="h-5 w-5 mx-auto text-white/40 mb-1" />
                  <div className="text-xl font-bold text-white">{vessel.heading?.toFixed(0) || '—'}°</div>
                  <div className="text-xs text-white/40">Heading</div>
                </div>
              </div>

              {/* Current Position */}
              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Current Position
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/40">Latitude</span>
                    <div className="font-mono text-white">{vessel.position.lat.toFixed(6)}°</div>
                  </div>
                  <div>
                    <span className="text-white/40">Longitude</span>
                    <div className="font-mono text-white">{vessel.position.lng.toFixed(6)}°</div>
                  </div>
                </div>
                {lastRefresh && (
                  <div className="text-xs text-white/40 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated {formatTime(lastRefresh.toISOString())}
                  </div>
                )}
              </div>

              {/* Voyage Info */}
              {(vessel.destination || vessel.eta) && (
                <div className="bg-white/5 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    Voyage
                  </h3>
                  {vessel.destination && (
                    <div>
                      <span className="text-xs text-white/40">Destination</span>
                      <div className="text-white font-medium">{vessel.destination}</div>
                    </div>
                  )}
                  {vessel.eta && (
                    <div>
                      <span className="text-xs text-white/40">ETA</span>
                      <div className="text-white">{formatDate(vessel.eta)}</div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={fetchVessel}
                className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Position
              </button>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* History Controls */}
              <div className="bg-white/5 rounded-lg p-4">
                <label className="text-sm text-white/60 block mb-2">Track History</label>
                <div className="flex gap-2">
                  {[1, 3, 7].map((days) => (
                    <button
                      key={days}
                      onClick={() => setHistoryDays(days)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        historyDays === days
                          ? 'bg-green-600 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
                <p className="text-xs text-white/40 mt-2">
                  Cost: {historyDays} credit{historyDays > 1 ? 's' : ''} per request
                </p>
              </div>

              {/* Track Stats */}
              {history?.positions && (
                <div className="bg-white/5 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Track Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/40">Positions</span>
                      <div className="text-white font-medium">{history.positions.length}</div>
                    </div>
                    <div>
                      <span className="text-white/40">Time Range</span>
                      <div className="text-white font-medium">{historyDays} day{historyDays > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Position List */}
              {history?.positions && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white/70">Recent Positions</h3>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {history.positions.slice(0, 20).map((pos, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white/[0.02] rounded text-xs"
                      >
                        <span className="text-white/60">{formatDate(pos.last_position_UTC)}</span>
                        <span className="text-white">{pos.speed.toFixed(1)} kn</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'info' && vesselInfo && (
            <div className="space-y-4">
              {/* Vessel Identity */}
              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                  <Ship className="h-4 w-4" />
                  Identity
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/40">Name</span>
                    <span className="text-white">{vesselInfo.name}</span>
                  </div>
                  {vesselInfo.callsign && (
                    <div className="flex justify-between">
                      <span className="text-white/40">Call Sign</span>
                      <span className="text-white font-mono">{vesselInfo.callsign}</span>
                    </div>
                  )}
                  {vesselInfo.country_name && (
                    <div className="flex justify-between">
                      <span className="text-white/40">Flag</span>
                      <span className="text-white">{vesselInfo.country_name}</span>
                    </div>
                  )}
                  {vesselInfo.home_port && (
                    <div className="flex justify-between">
                      <span className="text-white/40">Home Port</span>
                      <span className="text-white">{vesselInfo.home_port}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dimensions */}
              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Dimensions
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {vesselInfo.length && (
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-lg font-bold text-white">{vesselInfo.length}m</div>
                      <div className="text-xs text-white/40">Length</div>
                    </div>
                  )}
                  {vesselInfo.breadth && (
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-lg font-bold text-white">{vesselInfo.breadth}m</div>
                      <div className="text-xs text-white/40">Beam</div>
                    </div>
                  )}
                  {vesselInfo.draught_max && (
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-lg font-bold text-white">{vesselInfo.draught_max}m</div>
                      <div className="text-xs text-white/40">Max Draft</div>
                    </div>
                  )}
                  {vesselInfo.gross_tonnage && (
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-lg font-bold text-white">{vesselInfo.gross_tonnage}</div>
                      <div className="text-xs text-white/40">GT</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance */}
              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Performance
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {vesselInfo.speed_max && (
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-lg font-bold text-white">{vesselInfo.speed_max}</div>
                      <div className="text-xs text-white/40">Max Speed (kn)</div>
                    </div>
                  )}
                  {vesselInfo.speed_avg && (
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-lg font-bold text-white">{vesselInfo.speed_avg}</div>
                      <div className="text-xs text-white/40">Avg Speed (kn)</div>
                    </div>
                  )}
                  {vesselInfo.deadweight && (
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-lg font-bold text-white">{vesselInfo.deadweight}</div>
                      <div className="text-xs text-white/40">DWT</div>
                    </div>
                  )}
                  {vesselInfo.year_built && (
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-lg font-bold text-white">{vesselInfo.year_built}</div>
                      <div className="text-xs text-white/40">Year Built</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Attribution */}
        <div className="flex-shrink-0 p-2 border-t border-white/5">
          <p className="text-[10px] text-white/30 text-center">
            Live AIS data powered by{' '}
            <a href="https://datalastic.com" target="_blank" rel="noopener noreferrer" className="underline">
              Datalastic
            </a>
          </p>
        </div>
      </aside>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="absolute inset-0" />
      </div>

      <style jsx global>{`
        .track-tooltip {
          background: rgba(10, 10, 10, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 4px !important;
          color: white !important;
          font-size: 11px !important;
          padding: 4px 8px !important;
        }
        .track-tooltip::before {
          border-top-color: rgba(10, 10, 10, 0.9) !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

// Next.js 16 compatible page component with async params
export default function VesselTrackingPage({ 
  params 
}: { 
  params: Promise<{ mmsi: string }> 
}) {
  const { mmsi } = use(params);
  return <VesselTrackingContent mmsi={mmsi} />;
}

