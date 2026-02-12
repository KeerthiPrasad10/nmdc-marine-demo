'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Radio, Zap, ChevronLeft, Building2, ExternalLink, Activity, Heart, Users, Gauge, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { EXELON_ASSETS, type ExelonAsset } from '@/lib/exelon/fleet';
import { getAssetIssueSummary } from '@/lib/asset-issues';
import 'leaflet/dist/leaflet.css';

// Center on US Mid-Atlantic — spans from Chicago to DC/NJ coast
const US_CENTER = { lat: 40.0, lng: -78.5 };
const DEFAULT_ZOOM = 6;

const TYPE_COLORS: Record<string, string> = {
  power_transformer: '#f97316',
  distribution_transformer: '#3b82f6',
  substation: '#8b5cf6',
  circuit_breaker: '#10b981',
  capacitor_bank: '#06b6d4',
  unknown: '#9ca3af',
};

const OPCO_COLORS: Record<string, string> = {
  ComEd: '#f97316',
  PECO: '#3b82f6',
  BGE: '#10b981',
  Pepco: '#a855f7',
  DPL: '#06b6d4',
  ACE: '#eab308',
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || TYPE_COLORS.unknown;
}

function getOpCoColor(opCo: string): string {
  return OPCO_COLORS[opCo] || '#9ca3af';
}

function getHealthColor(health: number): string {
  if (health >= 70) return '#10b981';
  if (health >= 50) return '#f59e0b';
  return '#ef4444';
}

export default function LiveGridMap() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  const assets = EXELON_ASSETS;
  const [selectedAsset, setSelectedAsset] = useState<ExelonAsset | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [colorBy, setColorBy] = useState<'opco' | 'health' | 'type'>('opco');

  // Sorted assets — critical/low health first
  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) => a.healthIndex - b.healthIndex);
  }, [assets]);

  // Stats
  const opCoCounts = useMemo(() => {
    return assets.reduce((acc, a) => {
      acc[a.opCo] = (acc[a.opCo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [assets]);

  const operationalCount = assets.filter(a => a.status === 'operational').length;

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
        center: [US_CENTER.lat, US_CENTER.lng],
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: true,
      });

      leafletRef.current.control.zoom({ position: 'bottomright' }).addTo(map);

      leafletRef.current
        .tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '&copy; CartoDB',
        })
        .addTo(map);

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

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !mapReady) return;

    // Remove old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    assets.forEach(asset => {
      const fillColor =
        colorBy === 'opco'
          ? getOpCoColor(asset.opCo)
          : colorBy === 'health'
          ? getHealthColor(asset.healthIndex)
          : getTypeColor(asset.type);

      const isSelected = selectedAsset?.assetTag === asset.assetTag;
      const isSubstation = asset.type === 'substation';
      const hasIssues = getAssetIssueSummary(asset.assetTag).hasHighPriority;

      const marker = L.circleMarker([asset.position.lat, asset.position.lng], {
        radius: isSelected ? 16 : isSubstation ? 12 : 9,
        fillColor,
        color: isSelected ? '#fff' : hasIssues ? '#ef4444' : '#000',
        weight: isSelected ? 3 : hasIssues ? 2 : 1.5,
        opacity: 1,
        fillOpacity: 0.85,
      })
        .addTo(map)
        .on('click', () => setSelectedAsset(asset));

      marker.bindTooltip(
        `
        <div style="font-weight: 600;">${asset.name.split(' ').slice(0, 3).join(' ')}</div>
        <div style="font-size: 11px; opacity: 0.7;">${asset.opCo} • ${asset.voltageClassKV}kV • Health: ${asset.healthIndex}%</div>
      `,
        {
          permanent: false,
          direction: 'top',
          offset: [0, -12],
          className: 'asset-tooltip',
        },
      );

      markersRef.current.set(asset.assetTag, marker);
    });
  }, [assets, selectedAsset, mapReady, colorBy]);

  // Pan to selected asset
  useEffect(() => {
    if (selectedAsset && mapRef.current) {
      mapRef.current.flyTo([selectedAsset.position.lat, selectedAsset.position.lng], 11, {
        duration: 0.5,
      });
    }
  }, [selectedAsset]);

  return (
    <div className="h-screen flex bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 overflow-hidden border-r border-white/10 flex flex-col bg-[#0a0a0a]`}
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
                <span className="font-semibold">Live Grid</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">{operationalCount}</div>
              <div className="text-xs text-white/50">Operational</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold">{assets.length}</div>
              <div className="text-xs text-white/50">Total Assets</div>
            </div>
          </div>

          {/* Color By Toggle */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
            {(['opco', 'health', 'type'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setColorBy(mode)}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                  colorBy === mode ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'
                }`}
              >
                {mode === 'opco' ? 'OpCo' : mode === 'health' ? 'Health' : 'Type'}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex flex-wrap gap-2">
            {colorBy === 'opco' &&
              Object.entries(opCoCounts).map(([opCo, count]) => (
                <button
                  key={opCo}
                  className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded text-xs hover:bg-white/10 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getOpCoColor(opCo) }} />
                  <span>
                    {opCo}: {count}
                  </span>
                </button>
              ))}
            {colorBy === 'health' && (
              <>
                <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Good (≥70%)
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Fair (50-69%)
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded text-xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Poor (&lt;50%)
                </span>
              </>
            )}
            {colorBy === 'type' &&
              Object.entries(TYPE_COLORS)
                .filter(([k]) => k !== 'unknown')
                .map(([type, color]) => (
                  <span key={type} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                ))}
          </div>
        </div>

        {/* Asset List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {sortedAssets.map(asset => {
              const isSelected = selectedAsset?.assetTag === asset.assetTag;
              const issues = getAssetIssueSummary(asset.assetTag);
              const healthColor =
                asset.healthIndex >= 70
                  ? 'text-emerald-400'
                  : asset.healthIndex >= 50
                  ? 'text-amber-400'
                  : 'text-rose-400';

              return (
                <div
                  key={asset.assetTag}
                  className={`mb-2 p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white/10 border border-white/20'
                      : issues.hasCritical
                      ? 'bg-rose-500/5 border border-rose-500/20 hover:bg-rose-500/10'
                      : 'bg-white/5 hover:bg-white/8 border border-transparent'
                  }`}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${getOpCoColor(asset.opCo)}20` }}
                    >
                      <Zap className="h-4 w-4" style={{ color: getOpCoColor(asset.opCo) }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate">{asset.name}</h3>
                        {issues.hasCritical && <AlertTriangle className="h-3 w-3 text-rose-400 flex-shrink-0" />}
                      </div>
                      <div className="text-xs text-white/40 flex items-center gap-2">
                        <span>{asset.opCo}</span>
                        <span>•</span>
                        <span className={healthColor}>{asset.healthIndex}%</span>
                        <span>•</span>
                        <span>{asset.voltageClassKV}kV</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Toggle Sidebar */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/80 border border-white/10 rounded-r-lg hover:bg-black transition-colors"
        style={{ left: sidebarOpen ? '320px' : '0' }}
      >
        <ChevronLeft
          className={`h-4 w-4 text-white/60 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="absolute inset-0" />

        {/* Selected Asset Panel */}
        {selectedAsset && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[440px] max-w-[calc(100vw-2rem)]">
            <div className="bg-black/90 backdrop-blur-lg rounded-xl border border-white/10 p-4 shadow-2xl">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${getOpCoColor(selectedAsset.opCo)}20` }}
                >
                  <Zap className="h-6 w-6" style={{ color: getOpCoColor(selectedAsset.opCo) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg truncate">{selectedAsset.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        selectedAsset.status === 'operational'
                          ? 'bg-green-500/20 text-green-400'
                          : selectedAsset.status === 'alert'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {selectedAsset.status}
                    </span>
                  </div>
                  <p className="text-sm text-white/50 mb-2">
                    {selectedAsset.opCo} • {selectedAsset.substationName} • {selectedAsset.manufacturer}
                  </p>
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-white/40 text-xs flex items-center gap-1">
                        <Heart className="h-3 w-3" /> Health
                      </span>
                      <p
                        className={`font-medium ${
                          selectedAsset.healthIndex >= 70
                            ? 'text-emerald-400'
                            : selectedAsset.healthIndex >= 50
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {selectedAsset.healthIndex}%
                      </p>
                    </div>
                    <div>
                      <span className="text-white/40 text-xs flex items-center gap-1">
                        <Gauge className="h-3 w-3" /> Load
                      </span>
                      <p className="font-medium">{selectedAsset.loadFactor}%</p>
                    </div>
                    <div>
                      <span className="text-white/40 text-xs flex items-center gap-1">
                        <Activity className="h-3 w-3" /> Voltage
                      </span>
                      <p className="font-medium">{selectedAsset.voltageClassKV}kV</p>
                    </div>
                    <div>
                      <span className="text-white/40 text-xs flex items-center gap-1">
                        <Users className="h-3 w-3" /> Customers
                      </span>
                      <p className="font-medium">{(selectedAsset.customersServed / 1000).toFixed(0)}k</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
                    <span>{selectedAsset.ratedMVA} MVA</span>
                    <span>•</span>
                    <span>Installed {selectedAsset.yearInstalled}</span>
                    <span>•</span>
                    <span>{selectedAsset.coolingType}</span>
                    <span>•</span>
                    <span className={selectedAsset.criticality === 'critical' ? 'text-rose-400' : ''}>
                      {selectedAsset.criticality.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedAsset(null)}
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
        .asset-tooltip {
          background: rgba(0, 0, 0, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          color: white !important;
          padding: 6px 10px !important;
          border-radius: 6px !important;
          font-size: 12px !important;
        }
        .asset-tooltip::before {
          border-top-color: rgba(0, 0, 0, 0.9) !important;
        }
        .leaflet-container {
          background: #1a1a1a !important;
          font-family: inherit !important;
        }
        .leaflet-control-zoom {
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          background: rgba(0, 0, 0, 0.8) !important;
        }
        .leaflet-control-zoom a {
          background: transparent !important;
          color: white !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .leaflet-control-attribution {
          background: rgba(0, 0, 0, 0.5) !important;
          color: rgba(255, 255, 255, 0.4) !important;
        }
        .leaflet-control-attribution a {
          color: rgba(255, 255, 255, 0.6) !important;
        }
      `}</style>
    </div>
  );
}
