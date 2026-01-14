'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Vessel, Equipment } from '@/lib/supabase';
import { getVesselProfileByName, VesselProfile, VesselSystem } from '@/lib/vessel-profiles';
import { TroubleshootPanel } from '@/app/components/TroubleshootPanel';
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
  ClipboardList,
  CheckCircle2,
  XCircle,
  Lightbulb,
  TrendingUp,
  Calendar,
  Route,
} from 'lucide-react';
import { RoutePlanningPanel } from '@/app/components/routes';
import { PredictiveAIPanel } from '@/app/components/PredictiveAI';
import dynamic from 'next/dynamic';

// Dynamically import DigitalTwin to avoid SSR issues with Three.js
const DigitalTwin = dynamic(
  () => import('@/app/components/DigitalTwin').then(mod => mod.DigitalTwin),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-black rounded-xl flex items-center justify-center">
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

type TabType = 'overview' | 'digital-twin' | 'systems' | 'analysis' | 'maintenance';

// Wrapper component to handle Next.js 16 async params
function VesselDetailContent({ vesselId }: { vesselId: string }) {
  const router = useRouter();

  const [vessel, setVessel] = useState<Vessel | null>(null);
  const [fleetVessel, setFleetVessel] = useState<FleetVessel | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [alerts, setAlerts] = useState<NMDCAlert[]>([]);
  const [profile, setProfile] = useState<VesselProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedSystem, setSelectedSystem] = useState<VesselSystem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRoutePlanning, setShowRoutePlanning] = useState(false);
  const [datasheets, setDatasheets] = useState<Array<{
    id: string;
    title: string;
    url: string;
    source_domain: string;
    document_type: string;
    vessel_subtype: string;
    highlights?: string[];
  }>>([]);
  const [vesselSpecs, setVesselSpecs] = useState<{
    specifications: {
      length?: number;
      width?: number;
      draught?: number;
      maxDraught?: number;
      grossTonnage?: number;
      deadweight?: number;
      yearBuilt?: number | string;
      homeport?: string;
      flag?: string;
      callSign?: string;
      shipType?: string;
      shipSubType?: string;
      enginePower?: string;
      engineType?: string;
      averageSpeed?: number;
      maxSpeed?: number;
    };
    sensors?: {
      mainEngine: {
        rpm: number;
        temperature: number;
        oilPressure: number;
        fuelRate: number;
        runningHours: number;
        status: 'normal' | 'warning' | 'critical';
      };
      generator: {
        load: number;
        voltage: number;
        frequency: number;
        fuelLevel: number;
        status: 'normal' | 'warning' | 'critical';
      };
      navigation: {
        gpsAccuracy: number;
        compassHeading: number;
        windSpeed: number;
        windDirection: number;
      };
      safety: {
        fireAlarms: number;
        bilgeLevel: number;
        lifeboatStatus: 'ready' | 'maintenance';
        emergencyBeacon: 'armed' | 'inactive';
      };
    };
  } | null>(null);

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
          
          // Fetch enriched vessel specs (includes sensor data)
          try {
            const specsResponse = await fetch(`/api/vessel-specs?mmsi=${nmdcVessel.mmsi}`);
            const specsData = await specsResponse.json();
            if (specsData.success && specsData.vessel) {
              setVesselSpecs(specsData.vessel);
            }
          } catch (specsError) {
            console.log('[VesselDetail] Could not fetch vessel specs:', specsError);
          }
          
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60">Loading vessel data...</p>
        </div>
      </div>
    );
  }

  if (!vessel) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
              <button
                onClick={() => setShowRoutePlanning(!showRoutePlanning)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  showRoutePlanning
                    ? 'bg-primary-500/20 text-primary-400 border-primary-500/30'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border-cyan-500/20'
                }`}
              >
                <Route className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Plan</span> Route
              </button>
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
              { id: 'systems', label: 'Systems & Maintenance', icon: Cpu },
              { id: 'analysis', label: 'Resolve', icon: Wrench },
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
                ) : vesselSpecs?.specifications ? (
                  // Use Datalastic API specs if no profile available
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-white/50 mb-3">Dimensions</h3>
                      <div className="space-y-2">
                        {vesselSpecs.specifications.length && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Length Overall</span>
                            <span className="text-white">{vesselSpecs.specifications.length} m</span>
                          </div>
                        )}
                        {vesselSpecs.specifications.width && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Breadth</span>
                            <span className="text-white">{vesselSpecs.specifications.width} m</span>
                          </div>
                        )}
                        {vesselSpecs.specifications.maxDraught && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Depth</span>
                            <span className="text-white">{vesselSpecs.specifications.maxDraught} m</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white/50 mb-3">Performance</h3>
                      <div className="space-y-2">
                        {vesselSpecs.specifications.enginePower && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Engine Power</span>
                            <span className="text-white">{vesselSpecs.specifications.enginePower}</span>
                          </div>
                        )}
                        {vesselSpecs.specifications.maxSpeed && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Max Speed</span>
                            <span className="text-white">{vesselSpecs.specifications.maxSpeed} knots</span>
                          </div>
                        )}
                        {vesselSpecs.specifications.averageSpeed && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Avg Speed</span>
                            <span className="text-white">{vesselSpecs.specifications.averageSpeed} knots</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white/50 mb-3">Classification</h3>
                      <div className="space-y-2">
                        {vesselSpecs.specifications.yearBuilt && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Year Built</span>
                            <span className="text-white">{vesselSpecs.specifications.yearBuilt}</span>
                          </div>
                        )}
                        {vesselSpecs.specifications.flag && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Flag</span>
                            <span className="text-white">{vesselSpecs.specifications.flag}</span>
                          </div>
                        )}
                        {vesselSpecs.specifications.callSign && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Call Sign</span>
                            <span className="text-white">{vesselSpecs.specifications.callSign}</span>
                          </div>
                        )}
                        {vesselSpecs.specifications.shipSubType && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40">Type</span>
                            <span className="text-white text-right text-xs">{vesselSpecs.specifications.shipSubType}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/40 text-sm">Loading vessel specifications...</p>
                )}
              </div>

              {/* Live Sensor Data */}
              {vesselSpecs?.sensors && (
                <div className="rounded-xl bg-white/[0.02] border border-white/8 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-cyan-400" />
                    Live Sensor Data
                    <span className="ml-auto text-xs text-white/40 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Simulated
                    </span>
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Main Engine */}
                    <div className="bg-black/30 rounded-xl p-4 border border-white/8">
                      <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Main Engine
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">RPM</span>
                          <span className="text-white font-mono">{vesselSpecs.sensors.mainEngine.rpm}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Temperature</span>
                          <span className={`font-mono ${vesselSpecs.sensors.mainEngine.temperature > 90 ? 'text-amber-400' : 'text-white'}`}>
                            {vesselSpecs.sensors.mainEngine.temperature}°C
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Oil Pressure</span>
                          <span className="text-white font-mono">{vesselSpecs.sensors.mainEngine.oilPressure} bar</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Fuel Rate</span>
                          <span className="text-white font-mono">{vesselSpecs.sensors.mainEngine.fuelRate} L/hr</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Running Hours</span>
                          <span className="text-white font-mono">{vesselSpecs.sensors.mainEngine.runningHours.toLocaleString()}h</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                          <span className="text-xs text-white/40">Status</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            vesselSpecs.sensors.mainEngine.status === 'normal' ? 'bg-emerald-500/20 text-emerald-400' :
                            vesselSpecs.sensors.mainEngine.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-rose-500/20 text-rose-400'
                          }`}>
                            {vesselSpecs.sensors.mainEngine.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Generator */}
                    <div className="bg-black/30 rounded-xl p-4 border border-white/8">
                      <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Generator
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Load</span>
                          <span className="text-white font-mono">{vesselSpecs.sensors.generator.load}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Voltage</span>
                          <span className="text-white font-mono">{vesselSpecs.sensors.generator.voltage}V</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Frequency</span>
                          <span className="text-white font-mono">{vesselSpecs.sensors.generator.frequency} Hz</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Fuel Level</span>
                          <span className={`font-mono ${vesselSpecs.sensors.generator.fuelLevel < 30 ? 'text-amber-400' : 'text-white'}`}>
                            {vesselSpecs.sensors.generator.fuelLevel}%
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                          <span className="text-xs text-white/40">Status</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            vesselSpecs.sensors.generator.status === 'normal' ? 'bg-emerald-500/20 text-emerald-400' :
                            vesselSpecs.sensors.generator.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-rose-500/20 text-rose-400'
                          }`}>
                            {vesselSpecs.sensors.generator.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="bg-black/30 rounded-xl p-4 border border-white/8">
                      <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                        <Navigation className="w-4 h-4" />
                        Navigation
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">GPS Accuracy</span>
                          <span className="text-white font-mono">±{vesselSpecs.sensors.navigation.gpsAccuracy}m</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Compass</span>
                          <span className="text-white font-mono">{vesselSpecs.sensors.navigation.compassHeading}°</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Wind Speed</span>
                          <span className="text-white font-mono">{vesselSpecs.sensors.navigation.windSpeed} kt</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Wind Dir</span>
                          <span className="text-white font-mono">{vesselSpecs.sensors.navigation.windDirection}°</span>
                        </div>
                      </div>
                    </div>

                    {/* Safety Systems */}
                    <div className="bg-black/30 rounded-xl p-4 border border-white/8">
                      <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Safety Systems
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Fire Alarms</span>
                          <span className={`font-mono ${vesselSpecs.sensors.safety.fireAlarms > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {vesselSpecs.sensors.safety.fireAlarms > 0 ? vesselSpecs.sensors.safety.fireAlarms : 'Clear'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Bilge Level</span>
                          <span className={`font-mono ${vesselSpecs.sensors.safety.bilgeLevel > 15 ? 'text-amber-400' : 'text-white'}`}>
                            {vesselSpecs.sensors.safety.bilgeLevel} cm
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Lifeboats</span>
                          <span className={`font-mono ${vesselSpecs.sensors.safety.lifeboatStatus === 'ready' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {vesselSpecs.sensors.safety.lifeboatStatus}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">EPIRB</span>
                          <span className={`font-mono ${vesselSpecs.sensors.safety.emergencyBeacon === 'armed' ? 'text-emerald-400' : 'text-white/40'}`}>
                            {vesselSpecs.sensors.safety.emergencyBeacon}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
              {/* Predictive AI Panel */}
              <PredictiveAIPanel
                equipment={equipment.map(eq => ({
                  id: eq.id,
                  name: eq.name,
                  health_score: eq.health_score,
                  temperature: eq.temperature,
                  vibration: eq.vibration,
                  hours_operated: eq.hours_operated,
                  type: eq.type,
                }))}
                alerts={alerts.map(a => ({
                  id: a.id,
                  title: a.title,
                  severity: a.severity,
                  description: a.description,
                }))}
                vesselName={vessel.name}
                assetType="vessel"
              />

              {/* Route Planning Panel */}
              {showRoutePlanning && (
                <RoutePlanningPanel
                  vesselId={vessel.id}
                  vesselName={vessel.name}
                  vesselType={vessel.type}
                  initialOrigin={
                    vessel.position_lat && vessel.position_lng
                      ? { lat: vessel.position_lat, lng: vessel.position_lng, name: 'Current Position' }
                      : undefined
                  }
                  onRouteGenerated={(route) => {
                    console.log('Route generated:', route);
                    // Could show toast or navigate to routes page
                  }}
                  compact
                />
              )}

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
              
              {/* Resolve Guide */}
              <div className="mt-6 bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary-400" />
                  Resolve Guide
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
          <div className="grid grid-cols-12 gap-6">
            {/* Left: Systems & Equipment List */}
            <div className="col-span-3 space-y-4">
              {/* Health Summary - Compact */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/8">
                <div className={`text-2xl font-bold ${getHealthColor(vessel.health_score ?? 100)}`}>
                  {vessel.health_score ?? 100}%
                </div>
                <div className="text-xs text-white/50">
                  <div>Overall Health</div>
                  <div>{equipment.length} systems monitored</div>
                </div>
              </div>

              {/* Systems List */}
              <div className="space-y-1">
                {profile?.systems ? (
                  profile.systems.map((system) => {
                    const systemEquipment = equipment.find(e => 
                      e.name.toLowerCase().includes(system.name.toLowerCase().split(' ')[0])
                    );
                    const health = systemEquipment?.health_score ?? 100;
                    
                    return (
                      <button
                        key={system.id}
                        onClick={() => setSelectedSystem(system)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedSystem?.id === system.id
                            ? 'bg-primary-500/10 border-primary-500/30'
                            : 'bg-transparent border-transparent hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            health >= 80 ? 'bg-emerald-400' :
                            health >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">{system.name}</div>
                            <div className="text-[10px] text-white/40">{system.maintenanceIntervalHours.toLocaleString()}h interval</div>
                          </div>
                          <div className={`text-xs font-medium ${getHealthColor(health)}`}>
                            {health}%
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : equipment.length > 0 ? (
                  equipment.map((eq) => (
                    <button
                      key={eq.id}
                      onClick={() => setSelectedSystem(null)}
                      className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          (eq.health_score ?? 100) >= 80 ? 'bg-emerald-400' :
                          (eq.health_score ?? 100) >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{eq.name}</div>
                          <div className="text-[10px] text-white/40 capitalize">{eq.type}</div>
                        </div>
                        <div className={`text-xs font-medium ${getHealthColor(eq.health_score ?? 100)}`}>
                          {eq.health_score ?? 100}%
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-white/40 text-sm p-3">No system data available.</p>
                )}
              </div>
            </div>

            {/* Center: System Details */}
            <div className="col-span-6">
              {selectedSystem ? (
                <div className="space-y-4">
                  {/* System Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{selectedSystem.name}</h2>
                      <p className="text-xs text-white/40 capitalize">{selectedSystem.category} • {selectedSystem.criticalityLevel} priority</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/40">PM Interval</div>
                      <div className="text-sm font-medium text-white">{selectedSystem.maintenanceIntervalHours.toLocaleString()} hrs</div>
                    </div>
                  </div>

                  {/* Components - Compact */}
                  <div className="rounded-lg bg-white/[0.02] border border-white/8 divide-y divide-white/5">
                    {selectedSystem.components.map((component) => (
                      <div key={component.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-medium text-white">{component.name}</span>
                            {component.manufacturer && (
                              <span className="text-xs text-white/40 ml-2">{component.manufacturer}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-white/30 uppercase">{component.type}</span>
                        </div>

                        {component.failureModes.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {component.failureModes.slice(0, 2).map((fm, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="text-white/70">{fm.mode}</span>
                                  {fm.mtbf && (
                                    <span className="text-white/30 ml-2">MTBF {fm.mtbf.toLocaleString()}h</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Equipment Metrics */}
                  {equipment.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                      {equipment.slice(0, 4).map((eq) => (
                        <div key={eq.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/8">
                          <div className="text-[10px] text-white/40 mb-1 truncate">{eq.name}</div>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-lg font-semibold ${getHealthColor(eq.health_score ?? 100)}`}>
                              {eq.health_score ?? 100}%
                            </span>
                          </div>
                          {eq.hours_operated && (
                            <div className="text-[10px] text-white/30 mt-1">
                              {eq.hours_operated.toLocaleString()}h operated
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center rounded-lg bg-white/[0.01] border border-white/5">
                  <div className="text-center p-8">
                    <Cpu className="w-8 h-8 text-white/20 mx-auto mb-3" />
                    <p className="text-sm text-white/40">Select a system to view details</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Maintenance Intelligence */}
            <div className="col-span-3 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/8 text-center">
                  <div className={`text-lg font-bold ${criticalEquipment.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {criticalEquipment.length}
                  </div>
                  <div className="text-[10px] text-white/40">Critical</div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/8 text-center">
                  <div className={`text-lg font-bold ${alerts.length > 0 ? 'text-amber-400' : 'text-white/50'}`}>
                    {alerts.length}
                  </div>
                  <div className="text-[10px] text-white/40">Alerts</div>
                </div>
              </div>

              {/* Past Work Orders */}
              <div className="rounded-lg bg-white/[0.02] border border-white/8 p-4">
                <h3 className="text-xs font-medium text-white/60 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <ClipboardList className="w-3.5 h-3.5" />
                  Past Work Orders
                </h3>
                <div className="space-y-2">
                  {/* Mock work order data - in production, fetch from API */}
                  {[
                    { id: 'WO-2024-127', type: 'CM', system: 'Main Propulsion', issue: 'Bearing replacement', date: '2024-12-28', status: 'completed' },
                    { id: 'WO-2024-119', type: 'PM', system: 'Hydraulic System', issue: 'Oil change & filter', date: '2024-12-15', status: 'completed' },
                    { id: 'WO-2024-108', type: 'CM', system: 'Dredge Pump', issue: 'Seal leak repair', date: '2024-12-02', status: 'completed' },
                  ].map((wo) => (
                    <div key={wo.id} className="p-2 rounded bg-white/[0.03] border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-white/50">{wo.id}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                          wo.type === 'CM' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {wo.type}
                        </span>
                      </div>
                      <div className="text-xs text-white/80">{wo.issue}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-white/40">{wo.system}</span>
                        <span className="text-[10px] text-white/30">{wo.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link 
                  href="/work-order"
                  className="w-full mt-3 text-[10px] text-primary-400 hover:text-primary-300 transition-colors block text-center"
                >
                  View all work orders →
                </Link>
              </div>

              {/* PM Schedule Recommendations */}
              <div className="rounded-lg bg-primary-500/5 border border-primary-500/20 p-4">
                <h3 className="text-xs font-medium text-primary-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5" />
                  PM Recommendations
                </h3>
                <div className="space-y-3">
                  {/* AI-generated recommendations based on work order history */}
                  <div className="p-2 rounded bg-white/[0.03] border-l-2 border-amber-400">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-white/80">Increase PM frequency for Main Propulsion bearings</div>
                        <div className="text-[10px] text-white/40 mt-0.5">3 corrective repairs in last 6 months suggests 500h interval vs current 1000h</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-white/[0.03] border-l-2 border-emerald-400">
                    <div className="flex items-start gap-2">
                      <TrendingDown className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-white/80">Extend Hydraulic System oil change interval</div>
                        <div className="text-[10px] text-white/40 mt-0.5">Oil analysis shows good condition at 750h - can extend to 1000h</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-white/[0.03] border-l-2 border-blue-400">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-white/80">Schedule Dredge Pump overhaul</div>
                        <div className="text-[10px] text-white/40 mt-0.5">Based on OEM recommendation at 5000h - currently at 4658h</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current PM Schedule */}
              <div className="rounded-lg bg-white/[0.02] border border-white/8 p-4">
                <h3 className="text-xs font-medium text-white/60 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  PM Schedule
                </h3>
                <div className="space-y-1">
                  {profile?.systems?.slice(0, 4).map((system) => (
                    <div key={system.id} className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-white/70 truncate flex-1">{system.name}</span>
                      <span className="text-[10px] text-white/40 ml-2">
                        {system.maintenanceIntervalHours.toLocaleString()}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* OEM Documentation Query */}
              <button
                onClick={() => setActiveTab('analysis')}
                className="w-full p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-left hover:bg-amber-500/15 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">Query OEM Manuals</span>
                </div>
                <p className="text-[10px] text-white/50">
                  Get maintenance procedures, intervals, and recommendations from manufacturer documentation
                </p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-240px)]">
            {/* Resolve Panel - Takes most of the space */}
            <div className="col-span-8 rounded-xl bg-white/[0.02] border border-white/8 overflow-hidden">
              <TroubleshootPanel 
                selectedVessel={vessel} 
                equipmentType={selectedSystem?.name}
              />
            </div>

            {/* Context Panel - Narrow sidebar */}
            <div className="col-span-4 space-y-3 overflow-y-auto">
              {/* Active Issues - Only show if there are issues */}
              {(criticalAlerts.length > 0 || criticalEquipment.length > 0) && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3">
                  <h3 className="text-[10px] font-medium text-rose-400 uppercase tracking-wide mb-2">Active Issues</h3>
                  <div className="space-y-1">
                    {criticalAlerts.slice(0, 2).map((alert, i) => (
                      <div key={i} className="text-xs text-white/70 truncate">• {alert.title}</div>
                    ))}
                    {criticalEquipment.slice(0, 2).map((eq, i) => (
                      <div key={i} className="text-xs text-white/70">• {eq.name}: {eq.health_score}%</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/8 text-center">
                  <div className={`text-sm font-bold ${getHealthColor(vessel.health_score ?? 100)}`}>
                    {vessel.health_score ?? 100}%
                  </div>
                  <div className="text-[9px] text-white/40">Health</div>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/8 text-center">
                  <div className="text-sm font-bold text-white">{equipment.length}</div>
                  <div className="text-[9px] text-white/40">Systems</div>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/8 text-center">
                  <div className={`text-sm font-bold ${alerts.length > 0 ? 'text-amber-400' : 'text-white/50'}`}>
                    {alerts.length}
                  </div>
                  <div className="text-[9px] text-white/40">Alerts</div>
                </div>
              </div>

              {/* Equipment with Issues */}
              {equipment.filter(e => (e.health_score ?? 100) < 80).length > 0 && (
                <div className="rounded-lg bg-white/[0.02] border border-white/8 p-3">
                  <h3 className="text-[10px] font-medium text-white/50 uppercase tracking-wide mb-2">Equipment Status</h3>
                  <div className="space-y-1">
                    {equipment
                      .sort((a, b) => (a.health_score ?? 100) - (b.health_score ?? 100))
                      .slice(0, 5)
                      .map((eq) => (
                        <div key={eq.id} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              (eq.health_score ?? 100) >= 80 ? 'bg-emerald-400' :
                              (eq.health_score ?? 100) >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                            }`} />
                            <span className="text-xs text-white/70 truncate">{eq.name}</span>
                          </div>
                          <span className={`text-xs font-medium ml-2 ${getHealthColor(eq.health_score ?? 100)}`}>
                            {eq.health_score ?? 100}%
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Tip */}
              <p className="text-[10px] text-white/30 px-1">
                Resolve queries OEM manuals and P&IDs for procedures and root cause analysis.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Next.js 16 compatible page component with async params
export default function VesselDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = React.use(params);
  return <VesselDetailContent vesselId={id} />;
}

