'use client';

import Link from 'next/link';
import { Vessel, Equipment } from '@/lib/supabase';
import {
  X,
  Ship,
  Anchor,
  Construction,
  Waves,
  Radar,
  Heart,
  Fuel,
  Users,
  Navigation,
  Clock,
  Thermometer,
  Activity,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Shield,
  Droplets,
  Gauge,
  Calendar,
  Zap,
  Target,
  FileCheck,
  Info,
  Radio,
  Satellite,
  Wind,
  Eye,
  ExternalLink,
} from 'lucide-react';

// Extended vessel type with optional PdM and telemetry fields
// These fields may not exist in the database but are used for display with defaults
interface ExtendedVessel extends Vessel {
  utilization_rate?: number | null;
  availability_rate?: number | null;
  hull_fouling_idx?: number | null;
  thruster_vibration_mm_s?: number | null;
  lube_oil_ferro_ppm?: number | null;
  rope_health_score?: number | null;
  ai_anomaly_score?: number | null;
  predicted_failure_risk_pct?: number | null;
  connect_rssi_dbm?: number | null;
  sat_latency_ms?: number | null;
  wind_speed_kn?: number | null;
  wave_height_m?: number | null;
  op_mode?: string | null;
  dp_mode?: string | null;
  safety_state?: string | null;
}

interface VesselDetailsProps {
  vessel: Vessel;
  equipment: Equipment[];
  onClose: () => void;
}

const vesselIcons: Record<string, typeof Ship> = {
  tugboat: Anchor,
  supply_vessel: Ship,
  crane_barge: Construction,
  dredger: Waves,
  survey_vessel: Radar,
};

const vesselTypeLabels: Record<string, string> = {
  tugboat: 'Tugboat',
  supply_vessel: 'Supply Vessel',
  crane_barge: 'Crane Barge',
  dredger: 'Dredger',
  survey_vessel: 'Survey Vessel',
  pipelay_barge: 'Pipelay Barge',
  jack_up_barge: 'Jack-Up Barge',
  accommodation_barge: 'Accommodation Barge',
  work_barge: 'Work Barge',
  derrick_barge: 'Derrick Barge',
};

function getVesselTypeDisplay(vessel: Vessel): string {
  if (vessel.vessel_class) {
    return vessel.vessel_class.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  return vesselTypeLabels[vessel.type] || vessel.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const fuelTypeLabels: Record<string, { label: string; color: string; description: string }> = {
  VLSFO: { label: 'VLSFO', color: 'text-blue-400', description: 'Very Low Sulfur Fuel Oil (0.5%)' },
  ULSFO: { label: 'ULSFO', color: 'text-cyan-400', description: 'Ultra Low Sulfur Fuel Oil (0.1%)' },
  MGO: { label: 'MGO', color: 'text-sky-400', description: 'Marine Gas Oil (0.1%)' },
  MDO: { label: 'MDO', color: 'text-indigo-400', description: 'Marine Diesel Oil' },
  HFO: { label: 'HFO', color: 'text-orange-400', description: 'Heavy Fuel Oil (3.5%) - Restricted' },
  LNG: { label: 'LNG', color: 'text-emerald-400', description: 'Liquefied Natural Gas - Low Emission' },
  METHANOL: { label: 'Methanol', color: 'text-teal-400', description: 'Alternative Fuel' },
  BIOFUEL: { label: 'Biofuel', color: 'text-green-400', description: 'Sustainable Marine Biofuel' },
};

const failureModeLabels: Record<string, string> = {
  bearing_wear: 'Bearing Wear',
  piston_ring_wear: 'Piston Ring Wear',
  fuel_injector_fouling: 'Fuel Injector Fouling',
  turbocharger_failure: 'Turbocharger Failure',
  cooling_system_failure: 'Cooling System Failure',
  lube_oil_degradation: 'Lube Oil Degradation',
  cavitation_damage: 'Cavitation Damage',
  shaft_misalignment: 'Shaft Misalignment',
  seal_leakage: 'Seal Leakage',
  gearbox_wear: 'Gearbox Wear',
  thruster_bearing_wear: 'Thruster Bearing Wear',
  hull_fouling: 'Hull Fouling',
  propeller_fouling: 'Propeller Fouling',
  corrosion: 'Corrosion',
  fatigue_cracking: 'Fatigue Cracking',
  cutter_motor_bearing: 'Cutter Motor Bearing',
  spud_embedment: 'Spud Embedment',
  dredge_pump_wear: 'Dredge Pump Wear',
  suction_pipe_wear: 'Suction Pipe Wear',
  wire_rope_fatigue: 'Wire Rope Fatigue',
  crane_boom_fatigue: 'Crane Boom Fatigue',
  hydraulic_leak: 'Hydraulic Leak',
  winch_brake_wear: 'Winch Brake Wear',
  generator_winding: 'Generator Winding',
  switchboard_failure: 'Switchboard Failure',
  sensor_drift: 'Sensor Drift',
};

export function VesselDetails({ vessel: vesselProp, equipment, onClose }: VesselDetailsProps) {
  // Cast to extended type to allow optional PdM fields
  const vessel = vesselProp as ExtendedVessel;
  const Icon = vesselIcons[vessel.type] || Ship;
  const fuelInfo = fuelTypeLabels['VLSFO']; // Default to VLSFO since fuel_type not in schema

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getHealthBg = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getCIIColor = (rating: string | null) => {
    switch (rating) {
      case 'A': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'B': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'C': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'D': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'E': return 'text-rose-400 bg-rose-500/20 border-rose-500/30';
      default: return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  // Calculate equipment at risk
  const equipmentAtRisk = equipment.filter(eq => (eq.failure_confidence ?? 0) > 30);
  const criticalEquipment = equipment.filter(eq => (eq.health_score ?? 100) < 40);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500 text-white">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-white">{vessel.name}</h2>
            <p className="text-xs text-white/40">
              {getVesselTypeDisplay(vessel)} • {vessel.project || 'Unassigned'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/live/${vessel.mmsi || vessel.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 text-xs font-medium transition-colors"
          >
            <span>Full Profile</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Vessel Specifications */}
        <div className="rounded-xl bg-gradient-to-br from-primary-500/10 to-primary-600/5 border border-primary-500/20 p-3">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <p className="text-white/40">ID</p>
              <p className="font-mono text-white/80">{vessel.id.slice(0, 8)}</p>
            </div>
            <div>
              <p className="text-white/40">Type</p>
              <p className="font-medium text-white/80">{getVesselTypeDisplay(vessel)}</p>
            </div>
            <div>
              <p className="text-white/40">Status</p>
              <p className="font-medium text-white/80 capitalize">{vessel.status}</p>
            </div>
            <div>
              <p className="text-white/40">Crew</p>
              <p className="font-medium text-white/80">{vessel.crew_count || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/5 border border-white/8 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Heart className={`h-4 w-4 ${getHealthColor(vessel.health_score ?? 100)}`} />
              <span className="text-xs text-white/40">Health Score</span>
            </div>
            <p className={`text-2xl font-bold ${getHealthColor(vessel.health_score ?? 100)}`}>
              {vessel.health_score ?? 100}%
            </p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/8 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Fuel className={`h-4 w-4 ${getHealthColor(vessel.fuel_level ?? 100)}`} />
              <span className="text-xs text-white/40">Fuel Level</span>
            </div>
            <p className={`text-2xl font-bold ${getHealthColor(vessel.fuel_level ?? 100)}`}>
              {Math.round(vessel.fuel_level ?? 100)}%
            </p>
          </div>
        </div>

        {/* Fuel Type & Compliance */}
        <div className="rounded-xl bg-white/5 border border-white/8 p-4">
          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary-400" />
            Fuel & Compliance
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/40 mb-1">Fuel Type</p>
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10`}>
                <span className={`font-medium text-sm ${fuelInfo.color}`}>{fuelInfo.label}</span>
              </div>
              <p className="text-xs text-white/30 mt-1">{fuelInfo.description}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">CII Rating</p>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border ${getCIIColor('B')}`}>
                <span className="font-bold text-lg">B</span>
              </div>
              <p className="text-xs text-white/30 mt-1">Carbon Intensity Indicator</p>
            </div>
          </div>
          
          {/* MARPOL Compliance Status */}
          <div className="mt-4 pt-3 border-t border-white/8">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-white/80">MARPOL Annex VI Compliant</span>
            </div>
            <p className="text-xs text-white/40">
              Sulfur limit: 0.50% (IMO 2020 Global Cap: 0.50%)
            </p>
          </div>
        </div>

        {/* Health & Efficiency */}
        <div className="rounded-xl bg-white/5 border border-white/8 p-4">
          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary-400" />
            Health & Efficiency
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/40">Overall Health</span>
                <span className={`text-sm font-medium ${getHealthColor(vessel.health_score ?? 100)}`}>
                  {vessel.health_score ?? 100}%
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getHealthBg(vessel.health_score ?? 100)}`}
                  style={{ width: `${vessel.health_score ?? 100}%` }}
                />
              </div>
              <p className="text-xs text-white/30 mt-1">
                {(vessel.health_score ?? 100) < 70 ? 'Maintenance recommended' : 'Good condition'}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/40">Fuel Level</span>
                <span className={`text-sm font-medium ${getHealthColor(vessel.fuel_level ?? 100)}`}>
                  {Math.round(vessel.fuel_level ?? 100)}%
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getHealthBg(vessel.fuel_level ?? 100)}`}
                  style={{ width: `${vessel.fuel_level ?? 100}%` }}
                />
              </div>
              <p className="text-xs text-white/30 mt-1">
                {(vessel.fuel_level ?? 100) < 30 ? 'Refueling needed' : 'Adequate fuel'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Info */}
        <div className="rounded-xl bg-white/5 border border-white/8 p-4">
          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary-400" />
            Navigation
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-white/40">Position</p>
              <p className="font-medium text-white/85">
                {vessel.position_lat.toFixed(4)}°N, {vessel.position_lng.toFixed(4)}°E
              </p>
            </div>
            <div>
              <p className="text-white/40">Speed</p>
              <p className="font-medium text-white/85">{vessel.speed?.toFixed(1) ?? 0} knots</p>
            </div>
            <div>
              <p className="text-white/40">Heading</p>
              <p className="font-medium text-white/85">{Math.round(vessel.heading ?? 0)}°</p>
            </div>
            <div>
              <p className="text-white/40">Status</p>
              <p className={`font-medium capitalize ${
                vessel.status === 'operational' ? 'text-emerald-400' :
                vessel.status === 'maintenance' ? 'text-amber-400' :
                vessel.status === 'alert' ? 'text-rose-400' :
                'text-white/40'
              }`}>
                {vessel.status}
              </p>
            </div>
          </div>
        </div>

        {/* Crew Info */}
        <div className="rounded-xl bg-white/5 border border-white/8 p-4">
          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary-400" />
            Crew
          </h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-white/40">Members</p>
              <p className="font-medium text-white/85">{vessel.crew_count ?? 0}</p>
            </div>
            <div>
              <p className="text-white/40">Hours on Duty</p>
              <p className={`font-medium ${(vessel.crew_hours_on_duty ?? 0) > 10 ? 'text-amber-400' : 'text-white/85'}`}>
                {(vessel.crew_hours_on_duty ?? 0).toFixed(1)}h
              </p>
            </div>
            <div>
              <p className="text-white/40">Safety Score</p>
              <p className={`font-medium ${getHealthColor(vessel.crew_safety_score ?? 100)}`}>
                {vessel.crew_safety_score ?? 100}%
              </p>
            </div>
          </div>
        </div>

        {/* Predictive Maintenance Insights */}
        {equipmentAtRisk.length > 0 && (
          <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-rose-500/10 border border-amber-500/20 p-4">
            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              AI Predictive Maintenance Insights
            </h3>
            <div className="space-y-2">
              {equipmentAtRisk.slice(0, 3).map((eq) => (
                <div key={eq.id} className="rounded-lg bg-black/20 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{eq.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      (eq.failure_confidence ?? 0) > 50 
                        ? 'bg-rose-500/20 text-rose-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {eq.failure_confidence}% risk
                    </span>
                  </div>
                  {eq.predicted_failure && (
                    <p className="text-xs text-white/50 mb-1">
                      Predicted: {eq.predicted_failure}
                    </p>
                  )}
                  {(eq.failure_confidence ?? 0) > 30 && (
                    <p className="text-xs text-amber-400/80">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Maintenance recommended within 7 days
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipment Health */}
        <div className="rounded-xl bg-white/5 border border-white/8 p-4">
          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary-400" />
            Equipment Status
            {criticalEquipment.length > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                {criticalEquipment.length} critical
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {equipment.length === 0 ? (
              <p className="text-sm text-white/40">No equipment data available</p>
            ) : (
              equipment.map((eq) => (
                <div
                  key={eq.id}
                  className={`rounded-lg p-3 border ${
                    (eq.health_score ?? 100) < 40
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : (eq.health_score ?? 100) < 70
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-white/5 border-white/8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {(eq.health_score ?? 100) < 40 ? (
                        <AlertTriangle className="h-4 w-4 text-rose-400" />
                      ) : (eq.health_score ?? 100) < 70 ? (
                        <TrendingDown className="h-4 w-4 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                      <span className="font-medium text-sm text-white">{eq.name}</span>
                    </div>
                    <span className={`text-sm font-bold ${getHealthColor(eq.health_score ?? 100)}`}>
                      {eq.health_score ?? 100}%
                    </span>
                  </div>
                  
                  {/* Health bar */}
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${getHealthBg(eq.health_score ?? 100)}`}
                      style={{ width: `${eq.health_score ?? 100}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-white/40">
                      <Thermometer className="h-3 w-3" />
                      {eq.temperature?.toFixed(0) ?? 50}°C
                    </div>
                    <div className="flex items-center gap-1 text-white/40">
                      <Activity className="h-3 w-3" />
                      {eq.vibration?.toFixed(1) ?? 0} mm/s
                    </div>
                    <div className="flex items-center gap-1 text-white/40">
                      <Clock className="h-3 w-3" />
                      {Math.round(eq.hours_operated ?? 0)}h
                    </div>
                  </div>

                  {(eq.failure_confidence ?? 0) > 20 && (
                    <div className="mt-2 text-xs text-amber-400/80 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Failure risk: {eq.failure_confidence}%
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Emissions */}
        <div className="rounded-xl bg-white/5 border border-white/8 p-4">
          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary-400" />
            Emissions (kg/hr)
          </h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center">
              <p className="text-white/40 text-xs">CO₂</p>
              <p className="font-bold text-lg text-white">{vessel.emissions_co2?.toFixed(1) ?? 0}</p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-xs">NOx</p>
              <p className="font-bold text-lg text-white">{vessel.emissions_nox?.toFixed(2) ?? 0}</p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-xs">SOx</p>
              <p className="font-bold text-lg text-white">{vessel.emissions_sox?.toFixed(3) ?? 0}</p>
            </div>
          </div>
          {vessel.fuel_type === 'LNG' && (
            <p className="text-xs text-emerald-400/80 mt-2 text-center">
              <CheckCircle2 className="h-3 w-3 inline mr-1" />
              LNG fuel: Up to 25% lower CO₂, near-zero SOx emissions
            </p>
          )}
          {vessel.fuel_type === 'BIOFUEL' && (
            <p className="text-xs text-green-400/80 mt-2 text-center">
              <CheckCircle2 className="h-3 w-3 inline mr-1" />
              Biofuel: Up to 80% lifecycle CO₂ reduction
            </p>
          )}
        </div>

        {/* Asset Metrics */}
        <div className="rounded-xl bg-white/5 border border-white/8 p-4">
          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary-400" />
            Asset Performance (ISO 55000)
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-white/40 text-xs">Utilization Rate</p>
              <p className="font-medium text-white/85">{vessel.utilization_rate?.toFixed(0) ?? 0}%</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Availability</p>
              <p className="font-medium text-white/85">{vessel.availability_rate?.toFixed(0) ?? 100}%</p>
            </div>
          </div>
        </div>

        {/* PdM Health Signals */}
        <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-4">
          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            PdM Health Signals
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/40 text-xs">Hull Fouling Index</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  (vessel.hull_fouling_idx ?? 0) > 5 
                    ? 'bg-red-500/20 text-red-400' 
                    : (vessel.hull_fouling_idx ?? 0) > 3 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {(vessel.hull_fouling_idx ?? 0).toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-white/30">
                {(vessel.hull_fouling_idx ?? 0) > 5 
                  ? 'High fouling → +15-20% fuel' 
                  : (vessel.hull_fouling_idx ?? 0) > 3 
                  ? 'Moderate fouling → +5-10% fuel'
                  : 'Clean hull → optimal efficiency'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/40 text-xs">Thruster Vibration</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  (vessel.thruster_vibration_mm_s ?? 0) > 7 
                    ? 'bg-red-500/20 text-red-400' 
                    : (vessel.thruster_vibration_mm_s ?? 0) > 5 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {(vessel.thruster_vibration_mm_s ?? 0).toFixed(1)} mm/s
                </span>
              </div>
              <p className="text-xs text-white/30">
                {(vessel.thruster_vibration_mm_s ?? 0) > 7 
                  ? 'Critical vibration level' 
                  : (vessel.thruster_vibration_mm_s ?? 0) > 5 
                  ? 'Elevated vibration'
                  : 'Normal vibration levels'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/40 text-xs">Lube Oil Ferro</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  (vessel.lube_oil_ferro_ppm ?? 0) > 60 
                    ? 'bg-red-500/20 text-red-400' 
                    : (vessel.lube_oil_ferro_ppm ?? 0) > 40 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {vessel.lube_oil_ferro_ppm ?? 0} ppm
                </span>
              </div>
              <p className="text-xs text-white/30">
                {(vessel.lube_oil_ferro_ppm ?? 0) > 60 
                  ? 'High metal content → risk ↑' 
                  : (vessel.lube_oil_ferro_ppm ?? 0) > 40 
                  ? 'Elevated metal content'
                  : 'Normal metal content'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/40 text-xs">Rope Health</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  (vessel.rope_health_score ?? 100) < 70 
                    ? 'bg-red-500/20 text-red-400' 
                    : (vessel.rope_health_score ?? 100) < 85 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {vessel.rope_health_score ?? 100}%
                </span>
              </div>
              <p className="text-xs text-white/30">
                {(vessel.rope_health_score ?? 100) < 70 
                  ? 'ROPE_ALERT risk' 
                  : (vessel.rope_health_score ?? 100) < 85 
                  ? 'Inspect soon'
                  : 'Good condition'}
              </p>
            </div>
          </div>
          
          {/* AI Anomaly Score & Failure Risk */}
          <div className="mt-3 pt-3 border-t border-white/8 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${
                (vessel.ai_anomaly_score ?? 0.5) > 0.7 ? 'text-red-400' : 
                (vessel.ai_anomaly_score ?? 0.5) > 0.55 ? 'text-amber-400' : 'text-emerald-400'
              }`} />
              <div>
                <p className="text-xs text-white/40">AI Anomaly Score</p>
                <p className={`font-medium ${
                  (vessel.ai_anomaly_score ?? 0.5) > 0.7 ? 'text-red-400' : 
                  (vessel.ai_anomaly_score ?? 0.5) > 0.55 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {((vessel.ai_anomaly_score ?? 0.5) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className={`h-4 w-4 ${
                (vessel.predicted_failure_risk_pct ?? 0) > 40 ? 'text-red-400' : 
                (vessel.predicted_failure_risk_pct ?? 0) > 20 ? 'text-amber-400' : 'text-emerald-400'
              }`} />
              <div>
                <p className="text-xs text-white/40">Failure Risk</p>
                <p className={`font-medium ${
                  (vessel.predicted_failure_risk_pct ?? 0) > 40 ? 'text-red-400' : 
                  (vessel.predicted_failure_risk_pct ?? 0) > 20 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {vessel.predicted_failure_risk_pct ?? 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connectivity & Environment */}
        <div className="rounded-xl bg-white/5 border border-white/8 p-4">
          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary-400" />
            Connectivity & Environment
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Radio className={`h-4 w-4 ${
                (vessel.connect_rssi_dbm ?? -50) > -50 ? 'text-emerald-400' : 
                (vessel.connect_rssi_dbm ?? -50) > -60 ? 'text-amber-400' : 'text-red-400'
              }`} />
              <div>
                <p className="text-white/40 text-xs">Signal Strength</p>
                <p className="font-medium text-white/85">{vessel.connect_rssi_dbm ?? -50} dBm</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Satellite className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-white/40 text-xs">Sat Latency</p>
                <p className={`font-medium ${
                  (vessel.sat_latency_ms ?? 100) > 200 ? 'text-amber-400' : 'text-white/85'
                }`}>
                  {vessel.sat_latency_ms ?? 100} ms
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-white/40 text-xs">Wind Speed</p>
                <p className="font-medium text-white/85">{vessel.wind_speed_kn?.toFixed(0) ?? 0} kn</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Waves className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-white/40 text-xs">Wave Height</p>
                <p className="font-medium text-white/85">{vessel.wave_height_m?.toFixed(1) ?? 0} m</p>
              </div>
            </div>
          </div>
          
          {/* Operational Mode */}
          <div className="mt-3 pt-3 border-t border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-slate-400" />
              <span className="text-white/40 text-sm">Operational Mode</span>
            </div>
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
              vessel.op_mode === 'TRANSIT' ? 'bg-blue-500/20 text-blue-400' :
              vessel.op_mode === 'WORK' ? 'bg-emerald-500/20 text-emerald-400' :
              vessel.op_mode === 'MAINT' ? 'bg-red-500/20 text-red-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {vessel.op_mode || 'IDLE'}
              {vessel.dp_mode && ' • DP Active'}
            </span>
          </div>
          
          {/* Safety State */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-400" />
              <span className="text-white/40 text-sm">Safety State</span>
            </div>
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
              vessel.safety_state === 'GREEN' ? 'bg-emerald-500/20 text-emerald-400' :
              vessel.safety_state === 'AMBER' ? 'bg-amber-500/20 text-amber-400' :
              vessel.safety_state === 'RED' ? 'bg-red-500/20 text-red-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {vessel.safety_state || 'GREEN'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
