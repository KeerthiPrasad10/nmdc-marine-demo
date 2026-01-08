'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Navigation,
  Plus,
  Filter,
  Search,
  Ship,
  RefreshCw,
} from 'lucide-react';
import { Route } from '@/lib/routes/types';
import { RoutePlanningPanel, RouteCard } from '@/app/components/routes';
import { supabase, isSupabaseConfigured, Vessel } from '@/lib/supabase';
import { NMDC_FLEET } from '@/lib/nmdc/fleet';
import type L from 'leaflet';

// Leaflet types - actual import happens client-side only
let leafletModule: typeof import('leaflet') | null = null;

// ============================================================================
// Main Page Component
// ============================================================================

export default function RoutesPage() {
  const router = useRouter();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  // Data state
  const [vessels, setVessels] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<{ id: string; name: string; type: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [showPlanningPanel, setShowPlanningPanel] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'planned' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentRouteWaypoints, setCurrentRouteWaypoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [mapReady, setMapReady] = useState(false);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchVessels = useCallback(async () => {
    // Always use NMDC fleet data for this demo
    setVessels(NMDC_FLEET.map(v => ({
      id: v.mmsi,
      name: v.name,
      type: v.type,
    })));
  }, []);

  const fetchRoutes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.set('status', filterStatus);
      }

      const response = await fetch(`/api/routes?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRoutes(data.routes);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchVessels();
    fetchRoutes();
  }, [fetchVessels, fetchRoutes]);

  // ============================================================================
  // Map Initialization
  // ============================================================================

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      const L = await import('leaflet');
      // CSS is imported via a style tag to avoid TypeScript issues
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      leafletModule = L;

      if (!mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [24.8, 54.0],
        zoom: 7,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark map tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // OpenSeaMap overlay
      L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
        maxZoom: 19,
        opacity: 0.7,
      }).addTo(map);

      // Create layer group for routes
      routeLayerRef.current = L.layerGroup().addTo(map);

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

  // ============================================================================
  // Route Visualization on Map
  // ============================================================================

  useEffect(() => {
    if (!mapRef.current || !routeLayerRef.current || !leafletModule) return;

    const L = leafletModule;

    // Clear existing route layer
    routeLayerRef.current.clearLayers();

    if (currentRouteWaypoints.length === 0) return;

    // Single waypoint (just origin selected)
    if (currentRouteWaypoints.length === 1) {
      const originMarker = L.circleMarker(
        [currentRouteWaypoints[0].lat, currentRouteWaypoints[0].lng],
        {
          radius: 10,
          fillColor: '#22c55e',
          fillOpacity: 1,
          color: '#000',
          weight: 2,
        }
      );
      routeLayerRef.current.addLayer(originMarker);
      mapRef.current.setView([currentRouteWaypoints[0].lat, currentRouteWaypoints[0].lng], 10);
      return;
    }

    // Multiple waypoints - draw route polyline
    const latLngs = currentRouteWaypoints.map(wp => [wp.lat, wp.lng] as [number, number]);
    
    const routeLine = L.polyline(latLngs, {
      color: '#5b8a8a',
      weight: 3,
      opacity: 0.8,
      smoothFactor: 1,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: '10, 5',
    });
    
    routeLayerRef.current.addLayer(routeLine);

    // Add markers for origin and destination
    const originMarker = L.circleMarker(
      [currentRouteWaypoints[0].lat, currentRouteWaypoints[0].lng],
      {
        radius: 10,
        fillColor: '#22c55e',
        fillOpacity: 1,
        color: '#000',
        weight: 2,
      }
    );
    
    const destMarker = L.circleMarker(
      [currentRouteWaypoints[currentRouteWaypoints.length - 1].lat, currentRouteWaypoints[currentRouteWaypoints.length - 1].lng],
      {
        radius: 10,
        fillColor: '#ef4444',
        fillOpacity: 1,
        color: '#000',
        weight: 2,
      }
    );
    
    routeLayerRef.current.addLayer(originMarker);
    routeLayerRef.current.addLayer(destMarker);

    // Add intermediate waypoint markers
    for (let i = 1; i < currentRouteWaypoints.length - 1; i++) {
      const waypointMarker = L.circleMarker(
        [currentRouteWaypoints[i].lat, currentRouteWaypoints[i].lng],
        {
          radius: 6,
          fillColor: '#5b8a8a',
          fillOpacity: 1,
          color: '#000',
          weight: 1,
        }
      );
      routeLayerRef.current.addLayer(waypointMarker);
    }

    // Fit map to route bounds
    mapRef.current.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
  }, [currentRouteWaypoints, mapReady]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleRouteGenerated = useCallback((route: Route) => {
    setRoutes(prev => [route, ...prev]);
  }, []);

  const handleViewRoute = useCallback((route: Route) => {
    const waypoints = [
      { lat: route.origin.lat, lng: route.origin.lng },
      ...route.waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng })),
      { lat: route.destination.lat, lng: route.destination.lng },
    ];
    setCurrentRouteWaypoints(waypoints);
  }, []);

  const handleDeleteRoute = useCallback(async (route: Route) => {
    try {
      await fetch(`/api/routes?id=${route.id}`, { method: 'DELETE' });
      setRoutes(prev => prev.filter(r => r.id !== route.id));
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  }, []);

  const handleActivateRoute = useCallback(async (route: Route) => {
    try {
      await fetch('/api/routes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: route.id, status: 'active' }),
      });
      setRoutes(prev =>
        prev.map(r => (r.id === route.id ? { ...r, status: 'active' as const } : r))
      );
    } catch (error) {
      console.error('Error activating route:', error);
    }
  }, []);

  // Filter routes
  const filteredRoutes = routes.filter(route => {
    if (filterStatus !== 'all' && route.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        route.name.toLowerCase().includes(query) ||
        route.vesselName.toLowerCase().includes(query) ||
        route.origin.name.toLowerCase().includes(query) ||
        route.destination.name.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/70" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Route Optimization</h1>
                  <p className="text-sm text-white/50">Plan and manage vessel routes</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchRoutes}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowPlanningPanel(!showPlanningPanel)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/80 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Route
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-6">
          {/* Left Panel - Route List */}
          <div className="col-span-1 space-y-4">
            {/* Search & Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search routes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex gap-2">
                {(['all', 'planned', 'active', 'completed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterStatus === status
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'bg-white/5 text-white/60 hover:text-white border border-transparent'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Route List */}
            <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-white/40 text-sm">
                  Loading routes...
                </div>
              ) : filteredRoutes.length === 0 ? (
                <div className="text-center py-8">
                  <Navigation className="w-8 h-8 mx-auto mb-2 text-white/20" />
                  <p className="text-white/40 text-sm">No routes found</p>
                  <button
                    onClick={() => setShowPlanningPanel(true)}
                    className="mt-3 text-xs text-primary-400 hover:text-primary-300"
                  >
                    Create your first route
                  </button>
                </div>
              ) : (
                filteredRoutes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    compact
                    onView={handleViewRoute}
                    onActivate={handleActivateRoute}
                    onDelete={handleDeleteRoute}
                  />
                ))
              )}
            </div>
          </div>

          {/* Center - Map */}
          <div className="col-span-2">
            <div className="bg-black rounded-xl border border-white/10 overflow-hidden h-[calc(100vh-180px)]">
              <div
                ref={mapContainerRef}
                className="w-full h-full"
                style={{ minHeight: '500px' }}
              />
            </div>
          </div>

          {/* Right Panel - Planning or Details */}
          <div className="col-span-1">
            {showPlanningPanel || selectedVessel ? (
              <div className="h-[calc(100vh-180px)]">
                {/* Vessel Selector */}
                <div className="mb-4">
                  <label className="block text-xs text-white/50 mb-1.5">Select Vessel</label>
                  <div className="relative">
                    <Ship className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <select
                      value={selectedVessel?.id || ''}
                      onChange={(e) => {
                        const vessel = vessels.find(v => v.id === e.target.value);
                        setSelectedVessel(vessel || null);
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500 appearance-none"
                    >
                      <option value="">Select a vessel...</option>
                      {vessels.map((vessel) => (
                        <option key={vessel.id} value={vessel.id}>
                          {vessel.name} ({vessel.type.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedVessel ? (
                  <RoutePlanningPanel
                    vesselId={selectedVessel.id}
                    vesselName={selectedVessel.name}
                    vesselType={selectedVessel.type}
                    onRouteGenerated={handleRouteGenerated}
                    onWaypointsChange={setCurrentRouteWaypoints}
                  />
                ) : (
                  <div className="bg-black rounded-xl border border-white/10 p-6 text-center">
                    <Ship className="w-12 h-12 mx-auto mb-3 text-white/20" />
                    <p className="text-white/40 text-sm">
                      Select a vessel to start planning a route
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-black rounded-xl border border-white/10 p-6 text-center h-[calc(100vh-180px)] flex flex-col items-center justify-center">
                <Navigation className="w-12 h-12 mb-3 text-white/20" />
                <p className="text-white/40 text-sm mb-4">
                  Click on a route to view details or create a new route
                </p>
                <button
                  onClick={() => setShowPlanningPanel(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/20 text-primary-400 text-sm hover:bg-primary-500/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Route
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Custom styles for map */}
      <style jsx global>{`
        .leaflet-container {
          background: #0a0a0a;
        }
      `}</style>
    </div>
  );
}

