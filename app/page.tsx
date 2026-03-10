'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Weather, Vessel } from '@/lib/supabase';
import type { FleetVessel } from './api/fleet/route';
import { generateAlertsFromFleet, getAlertCounts, type WSDOTAlert } from '@/lib/wsdot/alerts';
import { FERRY_ROUTES, FERRY_TERMINALS, getRouteStats, type FerryRoute } from '@/lib/wsdot/routes';
import { getVesselIssueSummary, type VesselIssueSummary } from '@/lib/vessel-issues';
import {
  Header,
  MetricCard,
  VesselCard,
  AlertPanel,
  VesselAlertsPanel,
  LiveVesselsPanel,
  TroubleshootPanel,
  NewsPanel,
} from './components';
import {
  AlertTriangle,
  Heart,
  Activity,
  ChevronLeft,
  ChevronRight,
  Bell,
  Radio,
  Ship,
  Users,
  Anchor,
  MapPin,
  Newspaper,
  Navigation,
} from 'lucide-react';

function toDbVessel(v: FleetVessel): Vessel {
  return {
    id: v.mmsi,
    name: v.name,
    type: 'ferry',
    mmsi: v.mmsi,
    imo_number: null,
    position_lat: v.position.lat,
    position_lng: v.position.lng,
    heading: v.heading || 0,
    speed: v.speed || 0,
    status: v.atDock ? 'idle' : (v.healthScore > 60 ? 'operational' : 'maintenance'),
    health_score: v.healthScore,
    fuel_level: v.fuelLevel,
    fuel_consumption: v.fuelConsumption,
    emissions_co2: v.emissions.co2,
    emissions_nox: v.emissions.nox,
    emissions_sox: v.emissions.sox,
    crew_count: v.crew.count,
    crew_hours_on_duty: v.crew.hoursOnDuty,
    crew_safety_score: v.crew.safetyScore,
    project: v.route ?? null,
    destination_port: null,
    eta: null,
    flag: 'USA',
    vessel_class: v.subType ?? null,
    breadth: null,
    call_sign: null,
    deadweight: null,
    destination_lat: null,
    destination_lng: null,
    max_draught: null,
    length_overall: null,
    year_built: null,
    gross_tonnage: null,
    fuel_type: null,
    created_at: null,
    updated_at: new Date().toISOString(),
  };
}

interface FleetStats {
  totalVessels: number;
  onlineVessels: number;
  offlineVessels: number;
  operationalVessels: number;
  maintenanceVessels: number;
  totalCrew: number;
  avgSpeed: number;
  avgHealthScore: number;
  activeRoutes: number;
  totalEmissionsCO2: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [fleetVessels, setFleetVessels] = useState<FleetVessel[]>([]);
  const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);
  const [fleetMeta, setFleetMeta] = useState<{
    source?: string;
    fetchedAt?: string;
    cached?: boolean;
    rateLimited?: boolean;
    note?: string;
  } | null>(null);
  const [alerts, setAlerts] = useState<WSDOTAlert[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<'live' | 'cache' | 'simulated'>('cache');
  
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [leftPanel, setLeftPanel] = useState<'vessels' | 'routes'>('vessels');
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [rightPanel, setRightPanel] = useState<'alerts' | 'live' | 'news'>('live');
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<FerryRoute | null>(null);

  const routeStats = getRouteStats();

  const handleSelectVessel = useCallback((vesselId: string | null) => {
    if (vesselId === selectedVessel) {
      setSelectedVessel(null);
    } else {
      setSelectedVessel(vesselId);
      if (vesselId) {
        setRightPanel('live');
        setRightSidebarOpen(true);
      }
    }
  }, [selectedVessel]);

  const fetchFleet = useCallback(async (forceRefresh = false) => {
    try {
      const url = forceRefresh 
        ? '/api/fleet?action=fleet&refresh=true' 
        : '/api/fleet?action=fleet';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setFleetVessels(data.vessels);
        setFleetStats(data.stats);
        setFleetMeta(data.meta);
        setIsConnected(true);
        
        const fleetAlerts = generateAlertsFromFleet(data.vessels);
        setAlerts(fleetAlerts);
        
        if (data.meta?.rateLimited) {
          setDataSource('simulated');
        } else if (data.meta?.cached) {
          setDataSource('cache');
        } else {
          setDataSource('live');
        }
      } else {
        console.error('Fleet API error:', data.error);
        setIsConnected(false);
      }
      
      setLastUpdate(data.meta?.fetchedAt ? new Date(data.meta.fetchedAt) : new Date());
    } catch (error) {
      console.error('Error fetching fleet:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchWeather = useCallback(async () => {
    try {
      const { data } = await supabase.from('weather').select('*').limit(1).single();
      if (data) setWeather(data);
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  }, []);

  useEffect(() => {
    fetchFleet();
    fetchWeather();
  }, [fetchFleet, fetchWeather]);

  const rawVessels = fleetVessels.map(toDbVessel);
  
  const issueSummaries = useMemo(() => {
    const summaries: Record<string, VesselIssueSummary> = {};
    for (const vessel of rawVessels) {
      const mmsi = vessel.mmsi || vessel.id;
      summaries[mmsi] = getVesselIssueSummary(mmsi);
    }
    return summaries;
  }, [rawVessels]);
  
  const vessels = useMemo(() => {
    return [...rawVessels].sort((a, b) => {
      const aIssues = issueSummaries[a.mmsi || a.id];
      const bIssues = issueSummaries[b.mmsi || b.id];
      
      const aHasHighPriority = aIssues?.hasHighPriority ? 1 : 0;
      const bHasHighPriority = bIssues?.hasHighPriority ? 1 : 0;
      
      if (aHasHighPriority !== bHasHighPriority) {
        return bHasHighPriority - aHasHighPriority;
      }
      
      const aWorstHealth = aIssues?.worstHealth ?? 100;
      const bWorstHealth = bIssues?.worstHealth ?? 100;
      
      if (aWorstHealth !== bWorstHealth) {
        return aWorstHealth - bWorstHealth;
      }
      
      return a.name.localeCompare(b.name);
    });
  }, [rawVessels, issueSummaries]);
  
  const vesselsWithIssues = useMemo(() => {
    return Object.values(issueSummaries).filter(s => s.hasHighPriority).length;
  }, [issueSummaries]);
  
  const selectedVesselData = selectedVessel 
    ? vessels.find(v => v.id === selectedVessel) || null 
    : null;

  const metrics = {
    totalVessels: fleetStats?.totalVessels || 0,
    onlineVessels: fleetStats?.onlineVessels || 0,
    operationalVessels: fleetStats?.operationalVessels || 0,
    maintenanceVessels: fleetStats?.maintenanceVessels || 0,
    alertVessels: alerts.filter((a) => a.severity === 'critical').length,
    averageHealth: fleetStats?.avgHealthScore || 0,
    avgSpeed: fleetStats?.avgSpeed || 0,
    totalCrew: fleetStats?.totalCrew || 0,
    activeRoutes: fleetStats?.activeRoutes || 0,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
  };

  const alertCounts = getAlertCounts(alerts);

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, acknowledged: true } : a
    ));
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Loading WSDOT Ferry Fleet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      <Header
        alertCount={alertCounts.unacknowledged}
        isConnected={isConnected}
        onRefresh={fetchFleet}
      />

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={`relative flex-shrink-0 transition-all duration-300 ease-in-out ${
            leftSidebarOpen ? 'w-80' : 'w-0'
          }`}
        >
          <div
            className={`absolute inset-y-0 left-0 w-80 bg-[#0a0a0a] border-r border-white/8 flex flex-col overflow-hidden transition-transform duration-300 ${
              leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex-shrink-0 p-2 border-b border-white/5">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setLeftPanel('vessels')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    leftPanel === 'vessels'
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  <Ship className="h-4 w-4" />
                  Ferries
                </button>
                <button
                  onClick={() => setLeftPanel('routes')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    leftPanel === 'routes'
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  <Navigation className="h-4 w-4" />
                  Routes
                </button>
              </div>
            </div>

            {leftPanel === 'vessels' && (
              <>
                <div className="p-4 border-b border-white/8">
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                    WSDOT Ferry Fleet
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <MetricCard
                      title="En Route"
                      value={metrics.onlineVessels}
                      subtitle={`of ${metrics.totalVessels}`}
                      icon={<Radio className="h-4 w-4" />}
                      color="success"
                      compact
                      info="Ferries currently underway between terminals"
                      infoSource="live"
                    />
                    <MetricCard
                      title="Operational"
                      value={metrics.operationalVessels}
                      subtitle={`of ${metrics.totalVessels}`}
                      icon={<Activity className="h-4 w-4" />}
                      color="primary"
                      compact
                      info="Ferries with health score above 60%, indicating operational status"
                      infoSource="simulated"
                    />
                    <MetricCard
                      title="Total Crew"
                      value={metrics.totalCrew}
                      icon={<Users className="h-4 w-4" />}
                      color="primary"
                      compact
                      info="Total crew members across the WSDOT ferry fleet"
                      infoSource="static"
                    />
                    <MetricCard
                      title="Health"
                      value={`${metrics.averageHealth}%`}
                      icon={<Heart className="h-4 w-4" />}
                      color={metrics.averageHealth >= 70 ? 'success' : 'warning'}
                      compact
                      info="Average equipment health score across fleet"
                      infoSource="simulated"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-white/40">{metrics.activeRoutes} active routes</span>
                    <span className={`flex items-center gap-1 ${
                      dataSource === 'live' ? 'text-green-400' : 
                      dataSource === 'cache' ? 'text-blue-400' : 'text-amber-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        dataSource === 'live' ? 'bg-green-400 animate-pulse' : 
                        dataSource === 'cache' ? 'bg-blue-400' : 'bg-amber-400'
                      }`} />
                      {dataSource === 'live' ? 'Live AIS' : dataSource === 'cache' ? 'Cached' : 'Simulated'}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                      Vessels ({vessels.length})
                    </h3>
                    {vesselsWithIssues > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="h-3 w-3" />
                        {vesselsWithIssues} need attention
                      </span>
                    )}
                  </div>
                  {vessels.map((vessel) => {
                    const mmsi = vessel.mmsi || vessel.id;
                    const fleetVessel = fleetVessels.find(fv => fv.mmsi === mmsi);
                    
                    const assignedRoute = fleetVessel?.route ? {
                      id: fleetVessel.route,
                      name: fleetVessel.route,
                      client: 'WSDOT',
                      priority: 'medium' as const,
                    } : undefined;
                    
                    return (
                      <VesselCard
                        key={vessel.id}
                        vessel={vessel}
                        compact
                        selected={selectedVessel === vessel.id}
                        onClick={() => handleSelectVessel(vessel.id)}
                        issueSummary={issueSummaries[mmsi]}
                        assignedProject={assignedRoute}
                      />
                    );
                  })}
                </div>
              </>
            )}

            {leftPanel === 'routes' && (
              <>
                <div className="p-4 border-b border-white/8">
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                    Route Overview
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-green-400">{routeStats.active}</p>
                      <p className="text-[10px] text-white/50">Active</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-blue-400">{routeStats.totalTerminals}</p>
                      <p className="text-[10px] text-white/50">Terminals</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-cyan-400">{routeStats.totalDistanceNm}</p>
                      <p className="text-[10px] text-white/50">Total NM</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {FERRY_ROUTES.map((route) => {
                    const isSelected = selectedRoute?.id === route.id;
                    const routeVessels = fleetVessels.filter(v => v.route === route.name);
                    const statusColor = route.status === 'active' ? '#22c55e' : route.status === 'suspended' ? '#f59e0b' : '#6b7280';
                    
                    return (
                      <button
                        key={route.id}
                        onClick={() => setSelectedRoute(isSelected ? null : route)}
                        className={`w-full text-left p-3 border-b transition-all ${
                          isSelected 
                            ? 'border-b-white/5 bg-white/10' 
                            : 'border-b-white/5 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-500/10">
                            <Navigation className="h-4 w-4 text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-white truncate">{route.name}</h3>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-white/30" />
                              <p className="text-xs text-white/50 truncate">{route.abbreviation} • {route.crossingTimeMinutes} min</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded"
                                style={{ 
                                  backgroundColor: `${statusColor}20`,
                                  color: statusColor,
                                }}
                              >
                                {route.status.toUpperCase()}
                              </span>
                              {routeVessels.length > 0 && (
                                <span className="flex items-center gap-1 text-[10px] text-cyan-400">
                                  <Ship className="h-3 w-3" />
                                  {routeVessels.map(v => v.name).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                            <p className="text-xs text-white/60 line-clamp-2">{route.description}</p>
                            <div className="flex items-center gap-3 text-[10px] text-white/40">
                              <span>{route.distanceNm} NM</span>
                              <span>{route.terminals.length} terminals</span>
                            </div>
                            <div className="mt-2 p-2 bg-white/5 rounded-lg">
                              <p className="text-[10px] text-white/40 mb-1">Terminals:</p>
                              <div className="flex flex-wrap gap-1">
                                {route.terminals.map(terminal => (
                                  <span key={terminal.name} className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
                                    {terminal.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 border-t border-white/10 bg-black/50">
                  <p className="text-[10px] text-white/40 mb-2">Puget Sound Ferry System</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-[10px] text-white/50">Active</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-[10px] text-white/50">Suspended</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-[10px] text-white/50">Seasonal</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className={`absolute top-1/2 -translate-y-1/2 z-10 w-6 h-12 bg-[#1a1a1a] border border-white/10 rounded-r-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all ${
              leftSidebarOpen ? 'left-80' : 'left-0'
            }`}
          >
            {leftSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-black">
          <TroubleshootPanel 
            selectedVessel={selectedVesselData}
            alerts={alerts}
            weather={weather}
            fleetMetrics={{
              totalVessels: metrics.totalVessels,
              operationalVessels: metrics.operationalVessels,
              maintenanceVessels: metrics.maintenanceVessels,
            }}
          />
        </main>

        <aside
          className={`relative flex-shrink-0 transition-all duration-300 ease-in-out ${
            rightSidebarOpen ? 'w-96' : 'w-0'
          }`}
        >
          <div
            className={`absolute inset-y-0 right-0 w-96 bg-[#0a0a0a] border-l border-white/8 flex flex-col overflow-hidden transition-transform duration-300 ${
              rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex-shrink-0 p-2 border-b border-white/5">
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setRightPanel('live')}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    rightPanel === 'live'
                      ? 'bg-green-500/20 text-green-400'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  <Radio className="h-3 w-3" />
                  Live
                </button>
                <button
                  onClick={() => setRightPanel('news')}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    rightPanel === 'news'
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  <Newspaper className="h-3 w-3" />
                  Intel
                </button>
                <button
                  onClick={() => setRightPanel('alerts')}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all relative ${
                    rightPanel === 'alerts'
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  <Bell className="h-3 w-3" />
                  {alertCounts.unacknowledged > 0 && (
                    <span className="ml-1 text-[10px] text-white/50">
                      {alertCounts.unacknowledged}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {rightPanel === 'news' && <NewsPanel />}
              {rightPanel === 'live' && (
                <LiveVesselsPanel
                  fleetData={fleetVessels}
                  fleetMeta={fleetMeta ?? undefined}
                  onRefresh={() => fetchFleet(true)}
                  isLoading={isLoading}
                  onVesselSelect={(vessel) => {
                    console.log('Selected live vessel:', vessel);
                  }}
                />
              )}
              {rightPanel === 'alerts' && (
                <div className="h-full overflow-y-auto">
                  {selectedVesselData ? (
                    <VesselAlertsPanel
                      vessel={selectedVesselData}
                      alerts={alerts}
                      onAcknowledge={handleAcknowledgeAlert}
                      onResolve={handleResolveAlert}
                    />
                  ) : (
                    <AlertPanel
                      alerts={alerts}
                      onAcknowledge={handleAcknowledgeAlert}
                      onResolve={handleResolveAlert}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className={`absolute top-1/2 -translate-y-1/2 z-10 w-6 h-12 bg-[#1a1a1a] border border-white/10 rounded-l-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all ${
              rightSidebarOpen ? 'right-96' : 'right-0'
            }`}
          >
            {rightSidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </aside>
      </div>
    </div>
  );
}
