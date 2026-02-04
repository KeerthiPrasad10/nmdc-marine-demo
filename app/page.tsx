'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Weather, Vessel } from '@/lib/supabase';
import type { FleetVessel } from './api/fleet/route';
import { generateAlertsFromFleet, getAlertCounts, type NMDCAlert } from '@/lib/nmdc/alerts';
import { getNMDCVesselByMMSI } from '@/lib/nmdc/fleet';
import { 
  PROJECT_SITES, 
  PROJECT_TYPE_CONFIG, 
  PROJECT_STATUS_CONFIG,
  getProjectStats,
  getProjectsByVessel,
  getProjectsAtRisk,
  getProjectRisk,
  type ProjectSite,
  type ProjectRisk,
} from '@/lib/nmdc/projects';
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
  Building2,
  Newspaper,
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
  const [alerts, setAlerts] = useState<NMDCAlert[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<'live' | 'cache' | 'simulated'>('cache');
  
  // Sidebar state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [leftPanel, setLeftPanel] = useState<'vessels' | 'projects'>('vessels');
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [rightPanel, setRightPanel] = useState<'alerts' | 'live' | 'news'>('live');
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectSite | null>(null);
  
  // Project stats
  const projectStats = getProjectStats();

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
  const rawVessels = fleetVessels.map(toDbVessel);
  
  // Get issue summaries for all vessels (keyed by MMSI)
  const issueSummaries = useMemo(() => {
    const summaries: Record<string, VesselIssueSummary> = {};
    for (const vessel of rawVessels) {
      const mmsi = vessel.mmsi || vessel.id;
      summaries[mmsi] = getVesselIssueSummary(mmsi);
    }
    return summaries;
  }, [rawVessels]);
  
  // Sort vessels: those with high-priority issues first, then by name
  const vessels = useMemo(() => {
    return [...rawVessels].sort((a, b) => {
      const aIssues = issueSummaries[a.mmsi || a.id];
      const bIssues = issueSummaries[b.mmsi || b.id];
      
      // Vessels with critical/high priority issues come first
      const aHasHighPriority = aIssues?.hasHighPriority ? 1 : 0;
      const bHasHighPriority = bIssues?.hasHighPriority ? 1 : 0;
      
      if (aHasHighPriority !== bHasHighPriority) {
        return bHasHighPriority - aHasHighPriority;
      }
      
      // Then by worst health score (lower = more urgent)
      const aWorstHealth = aIssues?.worstHealth ?? 100;
      const bWorstHealth = bIssues?.worstHealth ?? 100;
      
      if (aWorstHealth !== bWorstHealth) {
        return aWorstHealth - bWorstHealth;
      }
      
      // Finally alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [rawVessels, issueSummaries]);
  
  // Count vessels with attention needed
  const vesselsWithIssues = useMemo(() => {
    return Object.values(issueSummaries).filter(s => s.hasHighPriority).length;
  }, [issueSummaries]);
  
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
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      <Header
        alertCount={alertCounts.unacknowledged}
        isConnected={isConnected}
        onRefresh={fetchFleet}
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
            {/* Tab Switcher */}
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
                  Vessels
                </button>
                <button
                  onClick={() => setLeftPanel('projects')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    leftPanel === 'projects'
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  <Anchor className="h-4 w-4" />
                  Projects
                </button>
              </div>
            </div>

            {/* Vessels Panel */}
            {leftPanel === 'vessels' && (
              <>
                {/* Projects at Risk Banner */}
                {(() => {
                  const projectsAtRisk = getProjectsAtRisk();
                  return projectsAtRisk.length > 0 ? (
                    <button
                      onClick={() => setLeftPanel('projects')}
                      className="w-full p-3 border-b border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/15 transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-rose-400" />
                          <span className="text-sm font-medium text-rose-400">
                            {projectsAtRisk.length} Project{projectsAtRisk.length > 1 ? 's' : ''} at Risk
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-rose-400" />
                      </div>
                      <p className="text-[10px] text-rose-300/70 mt-1">
                        {projectsAtRisk.map(r => r.project.name).slice(0, 2).join(', ')}
                        {projectsAtRisk.length > 2 ? ` +${projectsAtRisk.length - 2} more` : ''}
                      </p>
                    </button>
                  ) : null;
                })()}
                
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
                    const projects = getProjectsByVessel(mmsi);
                    const project = projects[0];
                    
                    // Determine priority based on client and value
                    const getPriority = (p: ProjectSite): 'critical' | 'high' | 'medium' | 'low' => {
                      if (p.client === 'ADNOC' || p.client === 'ZADCO') return 'critical';
                      if (p.client === 'Abu Dhabi Ports' || p.client === 'ADNOC Offshore') return 'high';
                      return 'medium';
                    };
                    
                    const assignedProject = project ? {
                      id: project.id,
                      name: project.name,
                      client: project.client,
                      priority: getPriority(project),
                    } : undefined;
                    
                    return (
                      <VesselCard
                        key={vessel.id}
                        vessel={vessel}
                        compact
                        selected={selectedVessel === vessel.id}
                        onClick={() => handleSelectVessel(vessel.id)}
                        issueSummary={issueSummaries[mmsi]}
                        assignedProject={assignedProject}
                      />
                    );
                  })}
                </div>
              </>
            )}

            {/* Projects Panel */}
            {leftPanel === 'projects' && (
              <>
                {/* Projects at Risk - Primary Focus */}
                {(() => {
                  const projectsAtRisk = getProjectsAtRisk();
                  const criticalCount = projectsAtRisk.filter(r => r.riskLevel === 'critical').length;
                  const highCount = projectsAtRisk.filter(r => r.riskLevel === 'high').length;
                  return projectsAtRisk.length > 0 ? (
                    <div className="p-4 border-b border-rose-500/30 bg-rose-500/5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-rose-400" />
                          <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                            Projects at Risk
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          {criticalCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300">{criticalCount} Critical</span>
                          )}
                          {highCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300">{highCount} High</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {projectsAtRisk.slice(0, 3).map((risk) => (
                          <div
                            key={risk.project.id}
                            className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                              risk.riskLevel === 'critical' 
                                ? 'border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20' 
                                : 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20'
                            }`}
                            onClick={() => setSelectedProject(risk.project)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-white truncate">{risk.project.name}</h4>
                                <p className="text-[10px] text-white/50">{risk.project.client}</p>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                risk.riskLevel === 'critical' ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/30 text-amber-300'
                              }`}>
                                {risk.riskLevel.toUpperCase()}
                              </span>
                            </div>
                            <div className="mt-2 space-y-1">
                              <p className={`text-[10px] ${risk.riskLevel === 'critical' ? 'text-rose-300' : 'text-amber-300'}`}>
                                ⚠️ {risk.impactSummary}
                              </p>
                              <p className="text-[10px] text-white/40">
                                📊 {risk.clientImpact}
                              </p>
                              {risk.riskLevel === 'critical' && (
                                <p className="text-[10px] text-rose-400">
                                  💰 {risk.financialRisk}
                                </p>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {risk.vesselIssues.map((vi) => (
                                <button 
                                  key={vi.mmsi}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/vessel/${vi.mmsi}`);
                                  }}
                                  className={`text-[9px] px-1.5 py-0.5 rounded transition-all hover:ring-1 hover:ring-white/30 ${
                                    vi.hasCritical ? 'bg-rose-500/30 text-rose-300 hover:bg-rose-500/50' : 'bg-amber-500/30 text-amber-300 hover:bg-amber-500/50'
                                  }`}
                                  title={`View ${vi.vesselName} details`}
                                >
                                  {vi.vesselName} ({vi.worstHealth}%)
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        {projectsAtRisk.length > 3 && (
                          <Link
                            href="/orchestration"
                            className="block text-center text-[10px] text-cyan-400 hover:text-cyan-300 py-2"
                          >
                            View all {projectsAtRisk.length} projects at risk →
                          </Link>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Project Stats */}
                <div className="p-4 border-b border-white/8">
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                    Project Overview
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-green-400">{projectStats.active}</p>
                      <p className="text-[10px] text-white/50">Active</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-blue-400">{projectStats.planned}</p>
                      <p className="text-[10px] text-white/50">Planned</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-white/40">{projectStats.completed}</p>
                      <p className="text-[10px] text-white/50">Completed</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-white/40">Avg progress: {projectStats.avgProgress}%</span>
                    <span className="text-amber-400 font-medium">{projectStats.totalValue}</span>
                  </div>
                </div>

                {/* Project List */}
                <div className="flex-1 overflow-y-auto">
                  {PROJECT_SITES.map((project) => {
                    const typeConfig = PROJECT_TYPE_CONFIG[project.type];
                    const statusConfig = PROJECT_STATUS_CONFIG[project.status];
                    const isSelected = selectedProject?.id === project.id;
                    const risk = project.status === 'active' ? getProjectRisk(project) : null;
                    const hasRisk = risk && risk.riskLevel !== 'none';
                    
                    return (
                      <button
                        key={project.id}
                        onClick={() => setSelectedProject(isSelected ? null : project)}
                        className={`w-full text-left p-3 border-b transition-all ${
                          hasRisk && risk.riskLevel === 'critical'
                            ? 'border-l-2 border-l-rose-500 border-b-white/5 bg-rose-500/5 hover:bg-rose-500/10'
                            : hasRisk
                            ? 'border-l-2 border-l-amber-500 border-b-white/5 bg-amber-500/5 hover:bg-amber-500/10'
                            : isSelected 
                            ? 'border-b-white/5 bg-white/10' 
                            : 'border-b-white/5 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                              hasRisk && risk.riskLevel === 'critical' ? 'ring-2 ring-rose-500/50' :
                              hasRisk ? 'ring-2 ring-amber-500/50' : ''
                            }`}
                            style={{ backgroundColor: `${typeConfig.color}20` }}
                          >
                            {typeConfig.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-white truncate">{project.name}</h3>
                              {hasRisk && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                  risk.riskLevel === 'critical' ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/30 text-amber-300'
                                }`}>
                                  ⚠️ {risk.riskLevel.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-white/30" />
                              <p className="text-xs text-white/50 truncate">{project.location.area}</p>
                            </div>
                            {hasRisk && (
                              <p className={`text-[10px] mt-1 ${risk.riskLevel === 'critical' ? 'text-rose-300' : 'text-amber-300'}`}>
                                {risk.impactSummary}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded"
                                style={{ 
                                  backgroundColor: `${statusConfig.color}20`,
                                  color: statusConfig.color,
                                }}
                              >
                                {statusConfig.label}
                              </span>
                              {project.assignedVessels.length > 0 && (
                                <span className="flex items-center gap-1 text-[10px] text-cyan-400">
                                  <Ship className="h-3 w-3" />
                                  {project.assignedVessels.map(mmsi => getNMDCVesselByMMSI(mmsi)?.name).filter(Boolean).join(', ')}
                                </span>
                              )}
                            </div>
                            {project.status === 'active' && project.progress !== undefined && (
                              <div className="mt-2">
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ 
                                      width: `${project.progress}%`,
                                      backgroundColor: typeConfig.color,
                                    }}
                                  />
                                </div>
                                <p className="text-[10px] text-white/40 mt-0.5 text-right">{project.progress}%</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Expanded Details */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                            <p className="text-xs text-white/60 line-clamp-2">{project.description}</p>
                            <div className="flex items-center gap-3 text-[10px] text-white/40">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {project.client}
                              </span>
                              {project.value && (
                                <span className="text-amber-400">{project.value}</span>
                              )}
                            </div>
                            {project.assignedVessels.length > 0 && (
                              <div className="mt-2 p-2 bg-white/5 rounded-lg">
                                <p className="text-[10px] text-white/40 mb-1">Assigned Vessels:</p>
                                <div className="flex flex-wrap gap-1">
                                  {project.assignedVessels.map(mmsi => {
                                    const vessel = getNMDCVesselByMMSI(mmsi);
                                    return vessel ? (
                                      <span key={mmsi} className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
                                        {vessel.name}
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="p-3 border-t border-white/10 bg-black/50">
                  <p className="text-[10px] text-white/40 mb-2">Project Types</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(PROJECT_TYPE_CONFIG).map(([key, config]) => (
                      <div key={key} className="flex items-center gap-1">
                        <span className="text-xs">{config.icon}</span>
                        <span className="text-[10px] text-white/50">{config.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
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

        {/* Center - Resolve Troubleshooting */}
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

            {/* Panel Content */}
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
