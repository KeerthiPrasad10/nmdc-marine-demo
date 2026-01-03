'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Vessel, Equipment } from '@/lib/supabase';
import { getVesselProfileByName, VesselProfile, VesselSystem } from '@/lib/vessel-profiles';
import { ChatPanel } from '@/app/components/ChatPanel';
import type { FleetVessel } from '@/app/api/fleet/route';
import { generateAlertsFromFleet, type NMDCAlert } from '@/lib/nmdc/alerts';
import {
  ArrowLeft,
  Ship,
  Anchor,
  Gauge,
  Fuel,
  Users,
  MapPin,
  Compass,
  Activity,
  Wrench,
  AlertTriangle,
  FileText,
  ExternalLink,
  ChevronRight,
  Thermometer,
  Zap,
  Shield,
  Clock,
  TrendingDown,
  Settings,
  BarChart3,
  MessageSquare,
  Cpu,
  Waves,
  Navigation,
  Box,
  Heart,
  Cuboid,
  Download,
  File,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import DigitalTwin to avoid SSR issues with Three.js
const DigitalTwin = dynamic(
  () => import('@/app/components/DigitalTwin').then(mod => mod.DigitalTwin),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-[#0a0a0f] rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading 3D Digital Twin...</p>
        </div>
      </div>
    )
  }
);

// Dynamically import PredictionsPanel 
const PredictionsPanel = dynamic(
  () => import('@/app/components/DigitalTwin/PredictionsPanel').then(mod => mod.PredictionsPanel),
  { ssr: false }
);

type TabType = 'overview' | 'digital-twin' | 'systems' | 'maintenance' | 'analysis';

export default function VesselDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vesselId = params.id as string;

  const [vessel, setVessel] = useState<Vessel | null>(null);
  const [fleetVessel, setFleetVessel] = useState<FleetVessel | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [alerts, setAlerts] = useState<NMDCAlert[]>([]);
  const [profile, setProfile] = useState<VesselProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedSystem, setSelectedSystem] = useState<VesselSystem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [datasheets, setDatasheets] = useState<Array<{
    id: string;
    title: string;
    url: string;
    source_domain: string;
    document_type: string;
    vessel_subtype: string;
    highlights?: string[];
  }>>([]);

  const fetchVesselData = useCallback(async () => {
    if (!vesselId) return;

    setIsLoading(true);
    try {
      // First try to fetch from NMDC fleet API (vesselId could be MMSI)
      const fleetResponse = await fetch('/api/fleet?action=fleet');
      const fleetData = await fleetResponse.json();
      
      if (fleetData.success) {
        // Find vessel by MMSI or name
        const nmdcVessel = fleetData.vessels.find((v: FleetVessel) => 
          v.mmsi === vesselId || v.id === vesselId || v.name.toLowerCase().replace(/\s+/g, '-') === vesselId.toLowerCase()
        );
        
        if (nmdcVessel) {
          setFleetVessel(nmdcVessel);
          
          // Convert to Vessel format for component compatibility
          const vesselData: Vessel = {
            id: nmdcVessel.mmsi,
            name: nmdcVessel.name,
            type: nmdcVessel.nmdc?.type === 'hopper_dredger' || nmdcVessel.nmdc?.type === 'csd' ? 'dredger' : 
                  nmdcVessel.nmdc?.type === 'supply' ? 'supply_vessel' : 
                  nmdcVessel.nmdc?.type === 'tug' ? 'tugboat' : 
                  nmdcVessel.nmdc?.type === 'survey' ? 'survey_vessel' : 
                  nmdcVessel.nmdc?.type === 'barge' ? 'crane_barge' : 'dredger',
            mmsi: nmdcVessel.mmsi,
            imo_number: nmdcVessel.imo ?? null,
            position_lat: nmdcVessel.position.lat,
            position_lng: nmdcVessel.position.lng,
            heading: nmdcVessel.heading || 0,
            speed: nmdcVessel.speed || 0,
            status: nmdcVessel.isOnline ? (nmdcVessel.healthScore > 60 ? 'operational' : 'maintenance') : 'idle',
            health_score: nmdcVessel.healthScore,
            fuel_level: nmdcVessel.fuelLevel,
            crew_count: nmdcVessel.crew?.count || nmdcVessel.nmdc?.crewCount || 15,
            project: nmdcVessel.nmdc?.project || null,
            destination_port: nmdcVessel.destination ?? null,
            destination_lat: null,
            destination_lng: null,
            eta: nmdcVessel.eta ?? null,
            emissions_co2: nmdcVessel.emissions?.co2 || 0,
            emissions_nox: nmdcVessel.emissions?.nox || 0,
            emissions_sox: nmdcVessel.emissions?.sox || 0,
            fuel_consumption: nmdcVessel.fuelConsumption || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // Additional required fields
            breadth: null,
            call_sign: null,
            crew_hours_on_duty: null,
            crew_safety_score: null,
            deadweight: null,
            flag: nmdcVessel.flag ?? null,
            fuel_type: null,
            gross_tonnage: null,
            length_overall: null,
            max_draught: null,
            vessel_class: null,
            year_built: null,
          };
          setVessel(vesselData);
          
          // Get profile from vessel name
          const vesselProfile = getVesselProfileByName(nmdcVessel.name);
          setProfile(vesselProfile || null);
          
          // Generate alerts from fleet data (just for this vessel)
          const vesselAlerts = generateAlertsFromFleet([nmdcVessel]);
          setAlerts(vesselAlerts);
          
          // Generate equipment from profile if available
          if (vesselProfile?.systems) {
            const generatedEquipment = vesselProfile.systems.map((sys, idx) => ({
              id: `${nmdcVessel.mmsi}-${idx}`,
              vessel_id: nmdcVessel.mmsi,
              name: sys.name,
              type: sys.category,
              health_score: Math.round(70 + Math.random() * 30),
              last_maintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
              predicted_failure: null,
              failure_confidence: null,
              hours_operated: Math.round(Math.random() * 5000),
              temperature: Math.round(45 + Math.random() * 30),
              vibration: Math.round((0.5 + Math.random() * 2) * 10) / 10, // 1 decimal place
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })) as Equipment[];
            setEquipment(generatedEquipment);
          }
          
          // Fetch datasheets for this vessel's subtype
          if (vesselProfile) {
            const { data: datasheetsData } = await supabase
              .from('vessel_datasheets')
              .select('*')
              .eq('vessel_subtype', vesselProfile.subtype)
              .order('score', { ascending: false })
              .limit(10);
            setDatasheets((datasheetsData || []).map(ds => ({
              id: ds.id,
              title: ds.title,
              url: ds.url,
              source_domain: ds.source_domain || '',
              document_type: ds.document_type || '',
              vessel_subtype: ds.vessel_subtype,
              highlights: undefined,
            })));
          }
          
          setIsLoading(false);
          return;
        }
      }
      
      // Fallback to Supabase if not found in NMDC fleet
      const { data: vesselData, error: vesselError } = await supabase
        .from('vessels')
        .select('*')
        .eq('id', vesselId)
        .single();

      if (vesselError) throw vesselError;
      setVessel(vesselData);

      // Get profile from vessel name
      if (vesselData) {
        const vesselProfile = getVesselProfileByName(vesselData.name);
        setProfile(vesselProfile || null);
      }

      // Fetch equipment
      const { data: equipmentData } = await supabase
        .from('equipment')
        .select('*')
        .eq('vessel_id', vesselId);
      setEquipment(equipmentData || []);

    } catch (error) {
      console.error('Error fetching vessel data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [vesselId]);

  useEffect(() => {
    fetchVesselData();
  }, [fetchVesselData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60">Loading vessel data...</p>
        </div>
      </div>
    );
  }

  if (!vessel) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Vessel Not Found</h1>
          <Link href="/" className="text-primary-400 hover:text-primary-300">
            ← Return to Fleet Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-emerald-400 bg-emerald-500/10';
      case 'maintenance': return 'text-amber-400 bg-amber-500/10';
      case 'alert': return 'text-rose-400 bg-rose-500/10';
      default: return 'text-white/40 bg-white/5';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const criticalEquipment = equipment.filter(e => (e.health_score ?? 100) < 70);
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/5">
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
                  <Ship className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{vessel.name}</h1>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white/50 capitalize">{vessel.type.replace('_', ' ')}</span>
                    <span className="text-white/20">•</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vessel.status || 'idle')}`}>
                      {vessel.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Stats + Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Quick Stats - compact pills */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-sm">
                <Heart className={`w-3.5 h-3.5 ${getHealthColor(vessel.health_score ?? 100)}`} />
                <span className={`font-medium ${getHealthColor(vessel.health_score ?? 100)}`}>
                  {vessel.health_score ?? 100}%
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-sm">
                <Fuel className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium text-white">{vessel.fuel_level?.toFixed(0) ?? 100}%</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-sm">
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium text-white">{vessel.speed?.toFixed(1) ?? 0} kn</span>
              </div>

              <div className="w-px h-6 bg-white/10" />

              {/* Action Buttons */}
              <Link
                href={`/troubleshoot?vessel=${vesselId}&name=${encodeURIComponent(vessel.name)}&equipment=${encodeURIComponent(vessel.type || '')}&project=${encodeURIComponent(fleetVessel?.nmdc?.project || '')}&mmsi=${fleetVessel?.mmsi || ''}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors text-sm border border-amber-500/20"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Report</span> Fault
              </Link>
              <Link
                href={`/schematics?vessel=${vesselId}&name=${encodeURIComponent(vessel.name)}&type=${encodeURIComponent(vessel.type || '')}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 hover:text-primary-300 transition-colors text-sm border border-primary-500/20"
              >
                <FileText className="w-3.5 h-3.5" />
                P&ID
              </Link>
              {profile?.officialUrl && (
                <a
                  href={profile.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors text-sm"
                  title="Official Specifications"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Specs
                </a>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4">
            {[
              { id: 'overview', label: 'Overview', icon: Box },
              { id: 'digital-twin', label: '3D Digital Twin', icon: Cuboid },
              { id: 'systems', label: 'Systems & Equipment', icon: Cpu },
              { id: 'maintenance', label: 'Predictive Maintenance', icon: Wrench },
              { id: 'analysis', label: 'AI Analysis', icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Vessel Info */}
            <div className="col-span-2 space-y-6">
              {/* Alert Banner if critical issues */}
              {(criticalAlerts.length > 0 || criticalEquipment.length > 0) && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <div>
                      <h3 className="font-semibold text-rose-400">Attention Required</h3>
                      <p className="text-sm text-white/60">
                        {criticalAlerts.length > 0 && `${criticalAlerts.length} critical alert(s)`}
                        {criticalAlerts.length > 0 && criticalEquipment.length > 0 && ' • '}
                        {criticalEquipment.length > 0 && `${criticalEquipment.length} equipment issue(s)`}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('maintenance')}
                      className="ml-auto px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 text-sm hover:bg-rose-500/30 transition-colors"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              )}

              {/* Specifications Card */}
              <div className="rounded-xl bg-white/[0.02] border border-white/8 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Anchor className="w-5 h-5 text-primary-400" />
                  Vessel Specifications
                </h2>
                {profile ? (
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-white/50 mb-3">Dimensions</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Length Overall</span>
                          <span className="text-white">{profile.specs.lengthOverall} m</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Breadth</span>
                          <span className="text-white">{profile.specs.breadth} m</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Depth</span>
                          <span className="text-white">{profile.specs.depth} m</span>
                        </div>
                        {profile.specs.dredgingDepth && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Dredging Depth</span>
                            <span className="text-white">{profile.specs.dredgingDepth} m</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white/50 mb-3">Performance</h3>
                      <div className="space-y-2">
                        {profile.specs.powerInstalled && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Power Installed</span>
                            <span className="text-white">{profile.specs.powerInstalled.toLocaleString()} kW</span>
                          </div>
                        )}
                        {profile.specs.maxSpeed && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Max Speed</span>
                            <span className="text-white">{profile.specs.maxSpeed} knots</span>
                          </div>
                        )}
                        {profile.specs.craneCapacity && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Crane Capacity</span>
                            <span className="text-white">{profile.specs.craneCapacity.toLocaleString()} T</span>
                          </div>
                        )}
                        {profile.specs.accommodation && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Accommodation</span>
                            <span className="text-white">{profile.specs.accommodation} persons</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white/50 mb-3">Classification</h3>
                      <div className="space-y-2">
                        {profile.specs.yearBuilt && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Year Built</span>
                            <span className="text-white">{profile.specs.yearBuilt}</span>
                          </div>
                        )}
                        {profile.specs.flag && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Flag</span>
                            <span className="text-white">{profile.specs.flag}</span>
                          </div>
                        )}
                        {profile.specs.classNotation && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Class</span>
                            <span className="text-white">{profile.specs.classNotation}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Type</span>
                          <span className="text-white text-right text-xs">{profile.subtype}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/40 text-sm">No detailed profile available for this vessel.</p>
                )}
              </div>

              {/* Capabilities */}
              {profile?.capabilities && (
                <div className="rounded-xl bg-white/[0.02] border border-white/8 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    Capabilities
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.capabilities.map((cap, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-lg bg-white/5 text-white/70 text-sm border border-white/8"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                  <p className="text-white/50 text-sm mt-4">{profile.description}</p>
                </div>
              )}

              {/* Current Status */}
              <div className="rounded-xl bg-white/[0.02] border border-white/8 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Current Status
                </h2>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/8">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                      <MapPin className="w-4 h-4" />
                      Position
                    </div>
                    <p className="text-white font-mono text-sm">
                      {vessel.position_lat.toFixed(4)}°N
                    </p>
                    <p className="text-white font-mono text-sm">
                      {vessel.position_lng.toFixed(4)}°E
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/8">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                      <Compass className="w-4 h-4" />
                      Heading
                    </div>
                    <p className="text-2xl font-bold text-white">{vessel.heading?.toFixed(0) ?? 0}°</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/8">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                      <Users className="w-4 h-4" />
                      Crew
                    </div>
                    <p className="text-2xl font-bold text-white">{vessel.crew_count ?? 0}</p>
                    <p className="text-xs text-white/40">on board</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/8">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                      <Waves className="w-4 h-4" />
                      Project
                    </div>
                    <p className="text-sm font-medium text-white">{vessel.project || 'Unassigned'}</p>
                  </div>
                </div>
              </div>

              {/* Equipment Overview */}
              <div className="rounded-xl bg-white/[0.02] border border-white/8 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-white/50" />
                    Equipment Status
                  </h2>
                  <button
                    onClick={() => setActiveTab('systems')}
                    className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    View All Systems <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {equipment.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {equipment.slice(0, 6).map((eq) => (
                      <div
                        key={eq.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/8"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            (eq.health_score ?? 100) >= 80 ? 'bg-emerald-400' :
                            (eq.health_score ?? 100) >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                          }`} />
                          <div>
                            <p className="text-sm text-white">{eq.name}</p>
                            <p className="text-xs text-white/40 capitalize">{eq.type}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-medium ${getHealthColor(eq.health_score ?? 100)}`}>
                          {eq.health_score ?? 100}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40 text-sm">No equipment data available.</p>
                )}
              </div>
            </div>

            {/* Right Column - Quick Actions & Alerts */}
            <div className="space-y-6">
              {/* Documentation Links */}
              {profile?.docs && (
                <div className="rounded-xl bg-white/[0.02] border border-white/8 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-white/50" />
                    Documentation
                  </h2>
                  <div className="space-y-2">
                    {profile.docs.fleetPageUrl && (
                      <a
                        href={profile.docs.fleetPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 transition-colors group"
                      >
                        <span className="text-sm text-white/70 group-hover:text-white">Fleet Page</span>
                        <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-primary-400" />
                      </a>
                    )}
                    <a
                      href="https://www.nmdc-group.com/assets/files/annual-reports/2023/Integrated_Report_EN.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 transition-colors group"
                    >
                      <span className="text-sm text-white/70 group-hover:text-white">NMDC Integrated Report 2023</span>
                      <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-primary-400" />
                    </a>
                    <a
                      href="https://www.nmdc-group.com/en/media/download-centre"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 transition-colors group"
                    >
                      <span className="text-sm text-white/70 group-hover:text-white">Download Centre</span>
                      <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-primary-400" />
                    </a>
                  </div>
                </div>
              )}

              {/* Technical Datasheets */}
              {datasheets.length > 0 && (
                <div className="rounded-xl bg-white/[0.02] border border-white/8 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5 text-cyan-400" />
                    Technical Datasheets
                    <span className="ml-auto text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
                      {datasheets.length}
                    </span>
                  </h2>
                  <p className="text-xs text-white/40 mb-3">
                    Industry specifications for {profile?.subtype || vessel.type}
                  </p>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {datasheets.map((ds) => (
                      <a
                        key={ds.id}
                        href={ds.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 p-1.5 rounded ${
                            ds.document_type === 'pdf' 
                              ? 'bg-rose-500/20' 
                              : 'bg-blue-500/20'
                          }`}>
                            <File className={`w-3.5 h-3.5 ${
                              ds.document_type === 'pdf' 
                                ? 'text-rose-400' 
                                : 'text-blue-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/70 group-hover:text-white line-clamp-2">
                              {ds.title}
                            </p>
                            <p className="text-xs text-white/40 mt-1">
                              {ds.source_domain} • {ds.document_type?.toUpperCase()}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-primary-400 flex-shrink-0" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Alerts */}
              <div className="rounded-xl bg-white/[0.02] border border-white/8 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Active Alerts
                  {alerts.length > 0 && (
                    <span className="ml-auto text-sm bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">
                      {alerts.length}
                    </span>
                  )}
                </h2>
                {alerts.length > 0 ? (
                  <div className="space-y-2">
                    {alerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border ${
                          alert.severity === 'critical'
                            ? 'bg-rose-500/10 border-rose-500/30'
                            : alert.severity === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-blue-500/10 border-blue-500/30'
                        }`}
                      >
                        <p className="text-sm text-white font-medium">{alert.title}</p>
                        <p className="text-xs text-white/50 mt-1">{alert.description?.slice(0, 100)}...</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40 text-sm text-center py-4">No active alerts</p>
                )}
              </div>

              {/* Emissions */}
              <div className="rounded-xl bg-white/[0.02] border border-white/8 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  Emissions
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/50">CO₂</span>
                    <span className="text-sm text-white">{vessel.emissions_co2?.toFixed(1) ?? 0} t/hr</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/50">NOx</span>
                    <span className="text-sm text-white">{vessel.emissions_nox?.toFixed(1) ?? 0} kg/hr</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/50">SOx</span>
                    <span className="text-sm text-white">{vessel.emissions_sox?.toFixed(1) ?? 0} kg/hr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'digital-twin' && (
          <div className="grid grid-cols-3 gap-6 h-[calc(100vh-240px)]">
            {/* 3D Digital Twin - 2/3 width */}
            <div className="col-span-2 h-full">
              <DigitalTwin vessel={vessel} equipment={equipment} />
            </div>
            
            {/* Predictions Panel - 1/3 width */}
            <div className="h-full overflow-y-auto">
              <PredictionsPanel 
                equipment={equipment} 
                sensors={[]}
                vesselType={vessel.type}
                onSensorSelect={(sensorId) => {
                  console.log('Select sensor:', sensorId);
                }}
              />
              
              {/* Troubleshooting Guide */}
              <div className="mt-6 bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary-400" />
                  Troubleshooting Guide
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-rose-400" />
                      <span className="text-white font-medium">Red Sensors</span>
                    </div>
                    <p className="text-white/50">Critical - Immediate action required. Click sensor for details and recommended fixes.</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-white font-medium">Yellow Sensors</span>
                    </div>
                    <p className="text-white/50">Warning - Schedule maintenance within 7-14 days to prevent failure.</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-white font-medium">Green Sensors</span>
                    </div>
                    <p className="text-white/50">Normal - Operating within acceptable parameters.</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10">
                  <p className="text-white/40 text-[10px]">
                    💡 Tip: Use the heatmap controls on the left to visualize temperature, vibration, or stress patterns across the vessel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'systems' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Systems List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Vessel Systems</h2>
              {profile?.systems ? (
                <div className="space-y-2">
                  {profile.systems.map((system) => (
                    <button
                      key={system.id}
                      onClick={() => setSelectedSystem(system)}
                      className={`w-full text-left p-4 rounded-xl border transition-colors ${
                        selectedSystem?.id === system.id
                          ? 'bg-primary-500/10 border-primary-500/30'
                          : 'bg-white/[0.02] border-white/8 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">{system.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          system.criticalityLevel === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                          system.criticalityLevel === 'high' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-white/10 text-white/50'
                        }`}>
                          {system.criticalityLevel}
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mt-1 capitalize">{system.category}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-sm">No system data available.</p>
              )}
            </div>

            {/* System Details */}
            <div className="col-span-2">
              {selectedSystem ? (
                <div className="rounded-xl bg-white/[0.02] border border-white/8 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-white">{selectedSystem.name}</h2>
                      <p className="text-sm text-white/50 capitalize">{selectedSystem.category} System</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/50">Maintenance Interval</p>
                      <p className="text-lg font-semibold text-white">{selectedSystem.maintenanceIntervalHours.toLocaleString()} hrs</p>
                    </div>
                  </div>

                  <h3 className="text-sm font-medium text-white/50 mb-3">Components</h3>
                  <div className="space-y-4">
                    {selectedSystem.components.map((component) => (
                      <div key={component.id} className="bg-white/5 rounded-lg p-4 border border-white/8">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-white">{component.name}</h4>
                            <p className="text-xs text-white/40">{component.type} {component.manufacturer && `• ${component.manufacturer}`}</p>
                          </div>
                        </div>

                        {component.failureModes.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <h5 className="text-xs font-medium text-white/50 mb-2">Failure Modes & RCA</h5>
                            <div className="space-y-3">
                              {component.failureModes.map((fm, i) => (
                                <div key={i} className="bg-white/5 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-sm font-medium text-white">{fm.mode}</span>
                                    {fm.mtbf && (
                                      <span className="ml-auto text-xs text-white/40">MTBF: {fm.mtbf.toLocaleString()} hrs</span>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <p className="text-white/40 mb-1">Symptoms</p>
                                      <ul className="text-white/70 space-y-0.5">
                                        {fm.symptoms.map((s, j) => (
                                          <li key={j}>• {s}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <p className="text-white/40 mb-1">Root Causes</p>
                                      <ul className="text-white/70 space-y-0.5">
                                        {fm.causes.map((c, j) => (
                                          <li key={j}>• {c}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-white/5">
                                    <p className="text-white/40 text-xs mb-1">Mitigations</p>
                                    <div className="flex flex-wrap gap-1">
                                      {fm.mitigations.map((m, j) => (
                                        <span key={j} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs">
                                          {m}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-white/[0.02] border border-white/8 p-12 text-center">
                  <Cpu className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">Select a system to view components and failure modes</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Equipment Health */}
            <div className="col-span-2 space-y-6">
              <div className="rounded-xl bg-white/[0.02] border border-white/8 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary-400" />
                  Equipment Health Status
                </h2>
                {equipment.length > 0 ? (
                  <div className="space-y-3">
                    {equipment.map((eq) => (
                      <div key={eq.id} className="bg-white/5 rounded-lg p-4 border border-white/8">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              (eq.health_score ?? 100) >= 80 ? 'bg-emerald-400' :
                              (eq.health_score ?? 100) >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                            }`} />
                            <div>
                              <h3 className="font-medium text-white">{eq.name}</h3>
                              <p className="text-xs text-white/40 capitalize">{eq.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-lg font-bold ${getHealthColor(eq.health_score ?? 100)}`}>
                              {eq.health_score ?? 100}%
                            </span>
                            <p className="text-xs text-white/40">health</p>
                          </div>
                        </div>
                        
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              (eq.health_score ?? 100) >= 80 ? 'bg-emerald-400' :
                              (eq.health_score ?? 100) >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                            }`}
                            style={{ width: `${eq.health_score ?? 100}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-4 mt-4 text-xs">
                          <div>
                            <p className="text-white/40">Temperature</p>
                            <p className="text-white">{eq.temperature?.toFixed(0) ?? '--'}°C</p>
                          </div>
                          <div>
                            <p className="text-white/40">Vibration</p>
                            <p className="text-white">{eq.vibration?.toFixed(1) ?? '--'} mm/s</p>
                          </div>
                          <div>
                            <p className="text-white/40">Hours Operated</p>
                            <p className="text-white">{eq.hours_operated?.toLocaleString() ?? '--'}</p>
                          </div>
                          <div>
                            <p className="text-white/40">Last Maintenance</p>
                            <p className="text-white">
                              {eq.last_maintenance
                                ? new Date(eq.last_maintenance).toLocaleDateString()
                                : '--'}
                            </p>
                          </div>
                        </div>

                        {eq.predicted_failure && (
                          <div className="mt-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="w-4 h-4 text-rose-400" />
                              <span className="text-xs text-rose-400">
                                Predicted: {eq.predicted_failure} ({eq.failure_confidence}% confidence)
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40 text-sm">No equipment data available.</p>
                )}
              </div>
            </div>

            {/* PdM Summary */}
            <div className="space-y-6">
              <div className="rounded-xl bg-white/[0.02] border border-white/8 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  PdM Summary
                </h2>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/8">
                    <div className="flex items-center justify-between">
                      <span className="text-white/50">Overall Health</span>
                      <span className={`text-xl font-bold ${getHealthColor(vessel.health_score ?? 100)}`}>
                        {vessel.health_score ?? 100}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/8">
                    <div className="flex items-center justify-between">
                      <span className="text-white/50">Equipment Monitored</span>
                      <span className="text-xl font-bold text-white">{equipment.length}</span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/8">
                    <div className="flex items-center justify-between">
                      <span className="text-white/50">Critical Issues</span>
                      <span className={`text-xl font-bold ${criticalEquipment.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {criticalEquipment.length}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/8">
                    <div className="flex items-center justify-between">
                      <span className="text-white/50">Active Alerts</span>
                      <span className={`text-xl font-bold ${alerts.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {alerts.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Maintenance */}
              <div className="rounded-xl bg-white/[0.02] border border-white/8 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Upcoming Maintenance
                </h2>
                {profile?.systems ? (
                  <div className="space-y-2">
                    {profile.systems
                      .filter(s => s.criticalityLevel === 'critical' || s.criticalityLevel === 'high')
                      .slice(0, 4)
                      .map((system) => (
                        <div key={system.id} className="p-3 rounded-lg bg-white/5 border border-white/8">
                          <p className="text-sm text-white">{system.name}</p>
                          <p className="text-xs text-white/40">
                            Every {system.maintenanceIntervalHours.toLocaleString()} hours
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-white/40 text-sm">No maintenance schedule available.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="grid grid-cols-2 gap-6 h-[calc(100vh-240px)]">
            <div className="rounded-xl bg-white/[0.02] border border-white/8 overflow-hidden">
              <ChatPanel selectedVessel={vessel} />
            </div>
            <div className="rounded-xl bg-white/[0.02] border border-white/8 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">AI Analysis Context</h2>
              <div className="space-y-4 text-sm">
                <div className="bg-white/5 rounded-lg p-4 border border-white/8">
                  <h3 className="text-white/50 mb-2">Current Vessel State</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Health: <span className={getHealthColor(vessel.health_score ?? 100)}>{vessel.health_score ?? 100}%</span></div>
                    <div>Fuel: <span className="text-white">{vessel.fuel_level?.toFixed(0)}%</span></div>
                    <div>Speed: <span className="text-white">{vessel.speed?.toFixed(1)} kn</span></div>
                    <div>Crew: <span className="text-white">{vessel.crew_count}</span></div>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4 border border-white/8">
                  <h3 className="text-white/50 mb-2">Equipment Summary</h3>
                  <div className="space-y-1">
                    <div>Total Equipment: <span className="text-white">{equipment.length}</span></div>
                    <div>Healthy (&gt;80%): <span className="text-emerald-400">{equipment.filter(e => (e.health_score ?? 100) >= 80).length}</span></div>
                    <div>Warning (60-80%): <span className="text-amber-400">{equipment.filter(e => (e.health_score ?? 100) >= 60 && (e.health_score ?? 100) < 80).length}</span></div>
                    <div>Critical (&lt;60%): <span className="text-rose-400">{equipment.filter(e => (e.health_score ?? 100) < 60).length}</span></div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/8">
                  <h3 className="text-white/50 mb-2">Active Alerts</h3>
                  <div className="space-y-1">
                    <div>Critical: <span className="text-rose-400">{alerts.filter(a => a.severity === 'critical').length}</span></div>
                    <div>Warning: <span className="text-amber-400">{alerts.filter(a => a.severity === 'warning').length}</span></div>
                    <div>Info: <span className="text-blue-400">{alerts.filter(a => a.severity === 'info').length}</span></div>
                  </div>
                </div>

                <p className="text-white/40 text-xs">
                  The AI has access to all vessel data, equipment status, and documentation to provide contextual analysis and recommendations.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

