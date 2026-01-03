'use client';

import {
  Activity,
  AlertTriangle,
  Gauge,
  Radio,
  Satellite,
  Thermometer,
  Waves,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';

// Simplified asset type for mock data
export interface OffshoreAssetData {
  id: string;
  name: string;
  asset_type: string;
  asset_subtype: string;
  op_mode: string;
  lat: number;
  lng: number;
  depth_m: number;
  health_pct: number;
  safety_state: string;
  current_pressure_bar: number;
  design_pressure_bar: number;
  throughput_m3h: number;
  created_at: string;
  updated_at: string;
  // Extended fields
  health_score?: number;
  predicted_failure_risk_pct?: number;
  connect_rssi_dbm?: number;
  // Pipeline specific
  pipe_pressure_bar?: number;
  pipe_temp_c?: number;
  pipe_flow_kbd?: number;
  das_event_flag?: boolean;
  leak_risk_pct?: number;
  // Compressor specific
  machine_vibration_mm_s?: number;
  compressor_load_pct?: number;
  discharge_pressure_bar?: number;
  // Environment
  wind_speed_kn?: number;
  wave_height_m?: number;
  sat_latency_ms?: number;
  // Project
  project?: string;
}

interface OffshoreAssetCardProps {
  asset: OffshoreAssetData;
  onClick?: () => void;
  isSelected?: boolean;
}

export function OffshoreAssetCard({ asset, onClick, isSelected }: OffshoreAssetCardProps) {
  const getAssetIcon = () => {
    switch (asset.asset_subtype) {
      case 'Subsea Pipeline':
        return '🔵';
      case 'Platform Compressor':
        return '⚙️';
      case 'Offshore Platform':
        return '🏭';
      default:
        return '📍';
    }
  };

  const getSafetyStateColor = () => {
    switch (asset.safety_state) {
      case 'GREEN':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'AMBER':
        return 'text-amber-400 bg-amber-500/20';
      case 'RED':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getOpModeColor = () => {
    switch (asset.op_mode) {
      case 'ONLINE':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'STANDBY':
        return 'text-amber-400 bg-amber-500/20';
      case 'MAINT':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-red-400';
  };

  const getConnectivityQuality = () => {
    const rssi = asset.connect_rssi_dbm || -70;
    if (rssi > -50) return { label: 'Excellent', color: 'text-emerald-400' };
    if (rssi > -60) return { label: 'Good', color: 'text-emerald-400' };
    if (rssi > -70) return { label: 'Fair', color: 'text-amber-400' };
    return { label: 'Weak', color: 'text-red-400' };
  };

  const connectivity = getConnectivityQuality();

  return (
    <div
      onClick={onClick}
      className={`
        rounded-lg border p-4 cursor-pointer transition-all duration-200
        ${isSelected
          ? 'border-cyan-500/50 bg-cyan-500/10'
          : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/80'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getAssetIcon()}</span>
          <div>
            <h3 className="font-semibold text-white text-sm">{asset.name}</h3>
            <p className="text-xs text-slate-400">{asset.asset_subtype}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${getOpModeColor()}`}>
            {asset.op_mode}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getSafetyStateColor()}`}>
            {asset.safety_state}
          </span>
        </div>
      </div>

      {/* Health & AI Score */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <div>
            <span className="text-xs text-slate-400">Health</span>
            <p className={`text-sm font-medium ${getHealthColor(asset.health_score || 0)}`}>
              {asset.health_score?.toFixed(0)}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-slate-400" />
          <div>
            <span className="text-xs text-slate-400">Risk</span>
            <p className={`text-sm font-medium ${getHealthColor(100 - (asset.predicted_failure_risk_pct || 0))}`}>
              {asset.predicted_failure_risk_pct?.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Asset-specific metrics */}
      {asset.asset_subtype === 'Subsea Pipeline' && (
        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1">
            <Gauge className="w-3 h-3 text-blue-400" />
            <span className="text-slate-400">{asset.pipe_pressure_bar?.toFixed(0)} bar</span>
          </div>
          <div className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-orange-400" />
            <span className="text-slate-400">{asset.pipe_temp_c?.toFixed(0)}°C</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">{asset.pipe_flow_kbd?.toFixed(0)} kbd</span>
          </div>
          {asset.das_event_flag && (
            <div className="col-span-3 flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded">
              <AlertTriangle className="w-3 h-3" />
              <span>DAS Event Detected • Leak Risk: {asset.leak_risk_pct?.toFixed(0)}%</span>
            </div>
          )}
        </div>
      )}

      {asset.asset_subtype === 'Platform Compressor' && (
        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-purple-400" />
            <span className="text-slate-400">{asset.machine_vibration_mm_s?.toFixed(1)} mm/s</span>
          </div>
          <div className="flex items-center gap-1">
            <Gauge className="w-3 h-3 text-blue-400" />
            <span className="text-slate-400">{asset.compressor_load_pct?.toFixed(0)}% load</span>
          </div>
          <div className="flex items-center gap-1">
            <Wrench className="w-3 h-3 text-amber-400" />
            <span className="text-slate-400">{asset.discharge_pressure_bar?.toFixed(0)} bar</span>
          </div>
        </div>
      )}

      {/* Environment & Connectivity */}
      <div className="flex items-center justify-between text-xs border-t border-slate-700/50 pt-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Wind className="w-3 h-3 text-slate-400" />
            <span className="text-slate-500">{asset.wind_speed_kn?.toFixed(0)} kn</span>
          </div>
          <div className="flex items-center gap-1">
            <Waves className="w-3 h-3 text-slate-400" />
            <span className="text-slate-500">{asset.wave_height_m?.toFixed(1)}m</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Radio className={`w-3 h-3 ${connectivity.color}`} />
            <span className={connectivity.color}>{connectivity.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <Satellite className="w-3 h-3 text-slate-400" />
            <span className="text-slate-500">{asset.sat_latency_ms}ms</span>
          </div>
        </div>
      </div>

      {/* Project */}
      {asset.project && (
        <p className="text-xs text-slate-500 mt-2 truncate">{asset.project}</p>
      )}
    </div>
  );
}

