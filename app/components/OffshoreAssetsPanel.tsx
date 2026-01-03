'use client';

import { useState, useEffect } from 'react';
import { OffshoreAssetCard, OffshoreAssetData } from './OffshoreAssetCard';
import { Factory, Gauge, Layers, GitBranch } from 'lucide-react';

type AssetFilter = 'all' | 'Subsea Pipeline' | 'Platform Compressor' | 'Offshore Platform';

// Mock data for offshore assets
const mockAssets: OffshoreAssetData[] = [
  {
    id: 'asset-1',
    name: 'ZADCO Pipeline Alpha',
    asset_type: 'pipeline',
    asset_subtype: 'Subsea Pipeline',
    op_mode: 'ONLINE',
    lat: 24.5,
    lng: 54.2,
    depth_m: 45,
    health_pct: 92,
    safety_state: 'NORMAL',
    current_pressure_bar: 85,
    design_pressure_bar: 120,
    throughput_m3h: 2500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'asset-2',
    name: 'Das Island Compressor',
    asset_type: 'compressor',
    asset_subtype: 'Platform Compressor',
    op_mode: 'ONLINE',
    lat: 25.15,
    lng: 52.87,
    depth_m: 0,
    health_pct: 88,
    safety_state: 'NORMAL',
    current_pressure_bar: 95,
    design_pressure_bar: 150,
    throughput_m3h: 5000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'asset-3',
    name: 'Umm Shaif Platform',
    asset_type: 'platform',
    asset_subtype: 'Offshore Platform',
    op_mode: 'ONLINE',
    lat: 24.8,
    lng: 53.1,
    depth_m: 0,
    health_pct: 95,
    safety_state: 'NORMAL',
    current_pressure_bar: 0,
    design_pressure_bar: 0,
    throughput_m3h: 12000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function OffshoreAssetsPanel() {
  const [assets, setAssets] = useState<OffshoreAssetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<OffshoreAssetData | null>(null);
  const [filter, setFilter] = useState<AssetFilter>('all');

  useEffect(() => {
    // Use mock data instead of fetching from non-existent table
    setAssets(mockAssets);
    setLoading(false);
  }, []);

  const filteredAssets = filter === 'all'
    ? assets
    : assets.filter(a => a.asset_subtype === filter);

  const getFilterCount = (subtype: AssetFilter) => {
    if (subtype === 'all') return assets.length;
    return assets.filter(a => a.asset_subtype === subtype).length;
  };

  const getAssetStats = () => {
    const online = assets.filter(a => a.op_mode === 'ONLINE').length;
    const amber = assets.filter(a => a.safety_state === 'AMBER').length;
    const red = assets.filter(a => a.safety_state === 'RED').length;
    const avgHealth = assets.length > 0
      ? assets.reduce((sum, a) => sum + (a.health_pct || 0), 0) / assets.length
      : 0;
    return { online, amber, red, avgHealth };
  };

  const stats = getAssetStats();

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-slate-700 rounded"></div>
            <div className="h-24 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Factory className="w-5 h-5 text-cyan-400" />
            Offshore Assets
          </h2>
          <span className="text-sm text-slate-400">{assets.length} assets</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
          <div className="bg-slate-700/30 rounded-lg p-2">
            <p className="text-emerald-400 font-semibold text-lg">{stats.online}</p>
            <p className="text-slate-400">Online</p>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-2">
            <p className="text-amber-400 font-semibold text-lg">{stats.amber}</p>
            <p className="text-slate-400">Advisory</p>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-2">
            <p className="text-red-400 font-semibold text-lg">{stats.red}</p>
            <p className="text-slate-400">Alert</p>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-2">
            <p className="text-cyan-400 font-semibold text-lg">{stats.avgHealth.toFixed(0)}%</p>
            <p className="text-slate-400">Avg Health</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
              filter === 'all'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            <Layers className="w-3 h-3" />
            All ({getFilterCount('all')})
          </button>
          <button
            onClick={() => setFilter('Subsea Pipeline')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
              filter === 'Subsea Pipeline'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            <GitBranch className="w-3 h-3" />
            Pipelines ({getFilterCount('Subsea Pipeline')})
          </button>
          <button
            onClick={() => setFilter('Platform Compressor')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
              filter === 'Platform Compressor'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            <Gauge className="w-3 h-3" />
            Compressors ({getFilterCount('Platform Compressor')})
          </button>
          <button
            onClick={() => setFilter('Offshore Platform')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
              filter === 'Offshore Platform'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            <Factory className="w-3 h-3" />
            Platforms ({getFilterCount('Offshore Platform')})
          </button>
        </div>
      </div>

      {/* Asset List */}
      <div className="p-4 max-h-[500px] overflow-y-auto space-y-3">
        {filteredAssets.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No assets found</p>
        ) : (
          filteredAssets.map((asset) => (
            <OffshoreAssetCard
              key={asset.id}
              asset={asset}
              isSelected={selectedAsset?.id === asset.id}
              onClick={() => setSelectedAsset(asset)}
            />
          ))
        )}
      </div>
    </div>
  );
}

