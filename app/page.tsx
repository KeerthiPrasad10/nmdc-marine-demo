'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Weather, Vessel } from '@/lib/supabase';
import type { FleetVessel } from './api/fleet/route';
import { generateAlertsFromFleet, getAlertCounts, type NMDCAlert } from '@/lib/nmdc/alerts';
import {
  Header,
  MetricCard,
  VesselCard,
  AlertPanel,
  WeatherWidget,
  ChatPanel,
  AIInsightsPanel,
  VesselWeatherPanel,
  VesselAlertsPanel,
  LiveVesselsPanel,
} from './components';
import {
  AlertTriangle,
  Wrench,
  Heart,
  Activity,
  ChevronLeft,
  ChevronRight,
  Bell,
  Cloud,
  Compass,
  Radio,
  Ship,
  Users,
} from 'lucide-react';

// Convert FleetVessel to database Vessel format for compatibility
function toDbVessel(v: FleetVessel): Vessel {
  return {
    id: v.mmsi,
    name: v.name,
    type: v.nmdc.type === 'hopper_dredger' || v.nmdc.type === 'csd' ? 'dredger' : 
          v.nmdc.type === 'supply' ? 'supply_vessel' : 
          v.nmdc.type === 'tug' ? 'tugboat' : 
          v.nmdc.type === 'survey' ? 'survey_vessel' : 
          v.nmdc.type === 'barge' ? 'crane_barge' : 'dredger',
    mmsi: v.mmsi,
    imo_number: v.imo ?? null,
    position_lat: v.position.lat,
    position_lng: v.position.lng,
    heading: v.heading || 0,
    speed: v.speed || 0,
    status: v.isOnline ? (v.healthScore > 60 ? 'operational' : 'maintenance') : 'idle',
    health_score: v.healthScore,
    fuel_level: v.fuelLevel,
    fuel_consumption: v.fuelConsumption,
    emissions_co2: v.emissions.co2,
    emissions_nox: v.emissions.nox,
    emissions_sox: v.emissions.sox,
    crew_count: v.crew.count,
    crew_hours_on_duty: v.crew.hoursOnDuty,
    crew_safety_score: v.crew.safetyScore,
    project: v.nmdc.project ?? null,
    destination_port: v.destination ?? null,
    eta: v.eta ?? null,
    flag: 'UAE',
    vessel_class: v.nmdc.subType ?? null,
    // Missing fields with default values
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
  activeProjects: number;
  totalEmissionsCO2: number;
}

export default function Dashboard() {
  const [fleetVessels, setFleetVessels] = useState<FleetVessel[]>([]);
  const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);
  const [fleetMeta, setFleetMeta] = useState<{
    source?: string;
    fetchedAt?: string;
    cached?: boolean;
    rateLimited?: boolean;
    note?: string;
  } | null>(null);
  const [alerts, setAlerts] = useState<NMDCAlert[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<'live' | 'cache' | 'simulated'>('cache');
  
  // Sidebar state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [rightPanel, setRightPanel] = useState<'alerts' | 'weather' | 'ai' | 'live'>('live');
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);

  // Handle vessel selection - switch to live panel and highlight
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

  // Fetch fleet data (cached by default to conserve API credits)
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
        
        // Generate alerts from fleet data
        const fleetAlerts = generateAlertsFromFleet(data.vessels);
        setAlerts(fleetAlerts);
        
        // Track data source
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

  // Fetch weather from Supabase
  const fetchWeather = useCallback(async () => {
    try {
      const { data } = await supabase.from('weather').select('*').limit(1).single();
      if (data) setWeather(data);
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchFleet();
    fetchWeather();
  }, [fetchFleet, fetchWeather]);

  // Convert fleet vessels to DB format for component compatibility
  const vessels = fleetVessels.map(toDbVessel);
  
  // Get the full vessel object for the selected vessel
  const selectedVesselData = selectedVessel 
    ? vessels.find(v => v.id === selectedVessel) || null 
    : null;

  // Use live stats from API
  const metrics = {
    totalVessels: fleetStats?.totalVessels || 0,
    onlineVessels: fleetStats?.onlineVessels || 0,
    operationalVessels: fleetStats?.operationalVessels || 0,
    maintenanceVessels: fleetStats?.maintenanceVessels || 0,
    alertVessels: alerts.filter((a) => a.severity === 'critical').length,
    averageHealth: fleetStats?.avgHealthScore || 0,
    avgSpeed: fleetStats?.avgSpeed || 0,
    totalCrew: fleetStats?.totalCrew || 0,
    activeProjects: fleetStats?.activeProjects || 0,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
  };

  // Get alert counts for consistent display
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
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Loading NMDC Fleet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header
        alertCount={alertCounts.unacknowledged}
        isConnected={isConnected}
        onRefresh={fetchFleet}
        onlineCount={metrics.onlineVessels}
        totalCount={metrics.totalVessels}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Fleet Overview */}
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
            {/* Metrics Grid */}
            <div className="p-4 border-b border-white/8">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                NMDC Fleet Status
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <MetricCard
                  title="Online"
                  value={metrics.onlineVessels}
                  subtitle={`of ${metrics.totalVessels}`}
                  icon={<Radio className="h-4 w-4" />}
                  color="success"
                  compact
                  info="Vessels actively transmitting AIS position data within the last hour"
                  infoSource="live"
                />
                <MetricCard
                  title="At Sea"
                  value={metrics.operationalVessels}
                  subtitle={`of ${metrics.totalVessels}`}
                  icon={<Activity className="h-4 w-4" />}
                  color="primary"
                  compact
                  info="Vessels with health score above 60%, indicating operational status"
                  infoSource="simulated"
                />
                <MetricCard
                  title="Total Crew"
                  value={metrics.totalCrew}
                  icon={<Users className="h-4 w-4" />}
                  color="primary"
                  compact
                  info="Total crew members across all NMDC fleet vessels based on vessel profiles"
                  infoSource="static"
                />
                <MetricCard
                  title="Health"
                  value={`${metrics.averageHealth}%`}
                  icon={<Heart className="h-4 w-4" />}
                  color={metrics.averageHealth >= 70 ? 'success' : 'warning'}
                  compact
                  info="Average equipment health score. Note: This is simulated - real data would come from onboard SCADA systems"
                  infoSource="simulated"
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-white/40">{metrics.activeProjects} project sites</span>
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

            {/* Vessel List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                Vessels ({vessels.length})
              </h3>
              {vessels.map((vessel) => (
                <VesselCard
                  key={vessel.id}
                  vessel={vessel}
                  compact
                  selected={selectedVessel === vessel.id}
                  onClick={() => handleSelectVessel(vessel.id)}
                />
              ))}
            </div>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className={`absolute top-1/2 -translate-y-1/2 z-10 w-6 h-12 bg-[#1a1a1a] border border-white/10 rounded-r-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all ${
              leftSidebarOpen ? 'left-80' : 'left-0'
            }`}
          >
            {leftSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </aside>

        {/* Center - AI Chat (Main Element) */}
        <main className="flex-1 min-w-0 flex flex-col">
          <ChatPanel selectedVessel={selectedVesselData} />
        </main>

        {/* Right Sidebar - Map/Alerts/Weather */}
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
            {/* Panel Tabs */}
            <div className="flex-shrink-0 p-2 border-b border-white/5">
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => setRightPanel('ai')}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    rightPanel === 'ai'
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  <Compass className="h-3 w-3" />
                  AI
                </button>
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
                  onClick={() => setRightPanel('alerts')}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all relative ${
                    rightPanel === 'alerts'
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  <Bell className="h-3 w-3" />
                  Alerts
                  {alertCounts.unacknowledged > 0 && (
                    <span className="ml-1 text-[10px] text-white/50">
                      {alertCounts.unacknowledged}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setRightPanel('weather')}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    rightPanel === 'weather'
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  <Cloud className="h-3 w-3" />
                  Wx
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {rightPanel === 'ai' && <AIInsightsPanel />}
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
              {rightPanel === 'weather' && (
                selectedVesselData ? (
                  <VesselWeatherPanel vessel={selectedVesselData} />
                ) : (
                  <div className="p-4">
                    <WeatherWidget weather={weather} />
                    <p className="text-xs text-white/40 text-center mt-4">
                      Select a vessel to see location-specific weather
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Toggle Button */}
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
