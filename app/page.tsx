'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EXELON_ASSETS, getExelonAssetByTag, type ExelonAsset } from '@/lib/exelon/fleet';
import { generateAlertsFromAssets, getAlertCounts, type GridAlert } from '@/lib/exelon/alerts';
import { 
  GRID_PROGRAMS,
  PROGRAM_TYPE_CONFIG,
  PROGRAM_STATUS_CONFIG,
  getProgramStats,
  getProgramsByAsset,
  getProgramsAtRisk,
  type GridProgram,
} from '@/lib/exelon/projects';
import { getAssetIssueSummary, type AssetIssueSummary } from '@/lib/asset-issues';
import {
  Header,
  MetricCard,
  AssetCard,
  TroubleshootPanel,
  NewsPanel,
} from './components';
import {
  AlertTriangle,
  Heart,
  ChevronLeft,
  ChevronRight,
  Bell,
  Radio,
  Zap,
  Users,
  MapPin,
  Newspaper,
  Gauge,
  Shield,
  Calendar,
  Map as MapIcon,
} from 'lucide-react';

interface GridStats {
  totalAssets: number;
  operationalAssets: number;
  maintenanceAssets: number;
  alertAssets: number;
  avgHealthIndex: number;
  totalCustomersServed: number;
  totalCapacityMVA: number;
  criticalAssets: number;
}

function computeGridStats(assets: ExelonAsset[]): GridStats {
  const operational = assets.filter(a => a.status === 'operational').length;
  const maintenance = assets.filter(a => a.status === 'maintenance').length;
  const alert = assets.filter(a => a.status === 'alert').length;
  const avgHealth = Math.round(assets.reduce((s, a) => s + a.healthIndex, 0) / (assets.length || 1));
  const totalCustomers = assets.reduce((s, a) => s + a.customersServed, 0);
  const totalMVA = assets.reduce((s, a) => s + a.ratedMVA, 0);
  const critical = assets.filter(a => a.criticality === 'critical').length;

  return {
    totalAssets: assets.length,
    operationalAssets: operational,
    maintenanceAssets: maintenance,
    alertAssets: alert,
    avgHealthIndex: avgHealth,
    totalCustomersServed: totalCustomers,
    totalCapacityMVA: totalMVA,
    criticalAssets: critical,
  };
}

const ARCGIS_EMBED_URL = 'https://exelonutilities.maps.arcgis.com/apps/dashboards/5bbc65640e0749a8a3f391af5f9188b4';

export default function Dashboard() {
  const assets = EXELON_ASSETS;
  const gridStats = useMemo(() => computeGridStats(assets), [assets]);
  const alerts = useMemo(() => generateAlertsFromAssets(assets), [assets]);
  const alertCounts = useMemo(() => getAlertCounts(alerts), [alerts]);
  const programStats = getProgramStats();
  
  const router = useRouter();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [leftPanel, setLeftPanel] = useState<'assets' | 'programs'>('assets');
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [rightPanel, setRightPanel] = useState<'alerts' | 'news' | 'map'>('alerts');
  const [selectedAssetTag, setSelectedAssetTag] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<GridProgram | null>(null);

  const isMapExpanded = rightPanel === 'map';
  const rightSidebarWidth = isMapExpanded ? 'w-[50vw]' : 'w-96';

  const issueSummaries = useMemo(() => {
    const summaries: Record<string, AssetIssueSummary> = {};
    for (const asset of assets) {
      summaries[asset.assetTag] = getAssetIssueSummary(asset.assetTag);
    }
    return summaries;
  }, [assets]);

  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) => {
      const aIssues = issueSummaries[a.assetTag];
      const bIssues = issueSummaries[b.assetTag];
      const aHigh = aIssues?.hasHighPriority ? 1 : 0;
      const bHigh = bIssues?.hasHighPriority ? 1 : 0;
      if (aHigh !== bHigh) return bHigh - aHigh;
      if (a.healthIndex !== b.healthIndex) return a.healthIndex - b.healthIndex;
      return a.name.localeCompare(b.name);
    });
  }, [assets, issueSummaries]);

  const assetsWithIssues = useMemo(
    () => Object.values(issueSummaries).filter(s => s.hasHighPriority).length,
    [issueSummaries],
  );

  const handleSelectAsset = useCallback(
    (tag: string) => {
      router.push(`/transformer-iot?asset=${tag}`);
    },
    [router],
  );

  const selectedAsset = selectedAssetTag ? getExelonAssetByTag(selectedAssetTag) ?? null : null;

  const [localAlerts, setLocalAlerts] = useState<GridAlert[]>([]);
  const displayAlerts = localAlerts.length > 0 ? localAlerts : alerts;

  const handleAcknowledgeAlert = (alertId: string) => {
    setLocalAlerts(prev => {
      const base = prev.length > 0 ? prev : alerts;
      return base.map(a => (a.id === alertId ? { ...a, acknowledged: true } : a));
    });
  };

  const handleResolveAlert = (alertId: string) => {
    setLocalAlerts(prev => {
      const base = prev.length > 0 ? prev : alerts;
      return base.filter(a => a.id !== alertId);
    });
  };

  const isConnected = true;

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      <Header alertCount={alertCounts.unacknowledged} isConnected={isConnected} onRefresh={() => {}} />

      <div className="flex-1 flex overflow-hidden">
        {/* ========== LEFT SIDEBAR ========== */}
        <aside
          className={`relative flex-shrink-0 transition-all duration-300 ease-in-out ${
            leftSidebarOpen ? 'w-80' : 'w-0'
          }`}
        >
          <div
            className={`absolute inset-y-0 left-0 w-80 bg-[#0a0a0a] border-r border-white/[0.06] flex flex-col overflow-hidden transition-transform duration-300 ${
              leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex-shrink-0 p-2 border-b border-white/[0.04]">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setLeftPanel('assets')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    leftPanel === 'assets'
                      ? 'bg-white/[0.08] text-white/90'
                      : 'text-white/35 hover:text-white/55 hover:bg-white/[0.04]'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  Assets
                </button>
                <button
                  onClick={() => setLeftPanel('programs')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    leftPanel === 'programs'
                      ? 'bg-white/[0.08] text-white/90'
                      : 'text-white/35 hover:text-white/55 hover:bg-white/[0.04]'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  Programs
                </button>
              </div>
            </div>

            {leftPanel === 'assets' && (
              <>
                {(() => {
                  const programsAtRisk = getProgramsAtRisk();
                  return programsAtRisk.length > 0 ? (
                    <button
                      onClick={() => setLeftPanel('programs')}
                      className="w-full p-3 border-b border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-white/50" />
                          <span className="text-sm font-medium text-white/60">
                            {programsAtRisk.length} Program{programsAtRisk.length > 1 ? 's' : ''} Behind Schedule
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/30" />
                      </div>
                      <p className="text-[10px] text-white/30 mt-1">
                        {programsAtRisk.map(p => p.name).slice(0, 2).join(', ')}
                        {programsAtRisk.length > 2 ? ` +${programsAtRisk.length - 2} more` : ''}
                      </p>
                    </button>
                  ) : null;
                })()}

                <div className="p-4 border-b border-white/[0.06]">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                    Exelon Grid Status
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <MetricCard
                      title="Operational"
                      value={gridStats.operationalAssets}
                      subtitle={`of ${gridStats.totalAssets}`}
                      icon={<Radio className="h-4 w-4" />}
                      color="success"
                      compact
                      info="Grid assets in operational status with active telemetry"
                      infoSource="live"
                    />
                    <MetricCard
                      title="Health Index"
                      value={`${gridStats.avgHealthIndex}%`}
                      icon={<Heart className="h-4 w-4" />}
                      color={gridStats.avgHealthIndex >= 70 ? 'success' : 'warning'}
                      compact
                      info="Average health index across all monitored grid assets based on DGA, thermal, and load data"
                      infoSource="live"
                    />
                    <MetricCard
                      title="Customers"
                      value={`${(gridStats.totalCustomersServed / 1000000).toFixed(1)}M`}
                      icon={<Users className="h-4 w-4" />}
                      color="primary"
                      compact
                      info="Total customers served by monitored grid assets across all Exelon OpCos"
                      infoSource="static"
                    />
                    <MetricCard
                      title="Capacity"
                      value={`${(gridStats.totalCapacityMVA / 1000).toFixed(1)} GVA`}
                      icon={<Gauge className="h-4 w-4" />}
                      color="primary"
                      compact
                      info="Total rated capacity across monitored transformers and substations"
                      infoSource="static"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-white/30">{gridStats.criticalAssets} critical assets</span>
                    <span className="flex items-center gap-1 text-white/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
                      SCADA Live
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                      Grid Assets ({sortedAssets.length})
                    </h3>
                    {assetsWithIssues > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-white/50 bg-white/[0.06] px-2 py-0.5 rounded-full">
                        <AlertTriangle className="h-3 w-3" />
                        {assetsWithIssues} need attention
                      </span>
                    )}
                  </div>
                  {sortedAssets.map(asset => {
                    const programs = getProgramsByAsset(asset.assetTag);
                    const program = programs[0];
                    const assignedProgram = program
                      ? { id: program.id, name: program.name, sponsor: program.sponsor }
                      : undefined;
                    
                    return (
                      <AssetCard
                        key={asset.assetTag}
                        asset={asset}
                        compact
                        selected={selectedAssetTag === asset.assetTag}
                        onClick={() => handleSelectAsset(asset.assetTag)}
                        issueSummary={issueSummaries[asset.assetTag]}
                        assignedProgram={assignedProgram}
                      />
                    );
                  })}
                </div>
              </>
            )}

            {leftPanel === 'programs' && (
              <>
                <div className="p-4 border-b border-white/[0.06]">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                    Program Overview
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/[0.04] rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-white/80">{programStats.active}</p>
                      <p className="text-[10px] text-white/40">Active</p>
                    </div>
                    <div className="bg-white/[0.04] rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-white/50">{programStats.planned}</p>
                      <p className="text-[10px] text-white/40">Planned</p>
                    </div>
                    <div className="bg-white/[0.04] rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-white/35">{programStats.total}</p>
                      <p className="text-[10px] text-white/40">Total</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-white/30">
                      {(programStats.totalCustomersImpacted / 1000000).toFixed(1)}M customers impacted
                    </span>
                    <span className="text-white/50 font-medium">
                      ${(programStats.totalBudgetM / 1000).toFixed(1)}B total
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {GRID_PROGRAMS.map(program => {
                    const typeConfig = PROGRAM_TYPE_CONFIG[program.type];
                    const statusCfg = PROGRAM_STATUS_CONFIG[program.status];
                    const isSelected = selectedProgram?.id === program.id;
                    
                    return (
                      <button
                        key={program.id}
                        onClick={() => setSelectedProgram(isSelected ? null : program)}
                        className={`w-full text-left p-3 border-b transition-all ${
                          isSelected ? 'border-b-white/[0.04] bg-white/[0.06]' : 'border-b-white/[0.04] hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm bg-white/[0.04]"
                          >
                            <Zap className="h-4 w-4 text-white/40" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-white/90 truncate">{program.name}</h3>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-white/25" />
                              <p className="text-xs text-white/40 truncate">{program.location.area}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50"
                              >
                                {statusCfg?.label ?? program.status}
                              </span>
                              <span className="text-[10px] text-white/40">
                                {program.sponsor}
                              </span>
                              {program.budget && (
                                <span className="text-[10px] text-white/35">{program.budget}</span>
                              )}
                            </div>
                            {program.status === 'active' && program.progress !== undefined && (
                              <div className="mt-2">
                                <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all bg-white/20"
                                    style={{ width: `${program.progress}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-white/30 mt-0.5 text-right">{program.progress}%</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                            <p className="text-xs text-white/50 line-clamp-3">{program.description}</p>
                            <div className="flex items-center gap-3 text-[10px] text-white/30">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {program.startDate} → {program.endDate ?? 'Ongoing'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {(program.customersImpacted / 1000).toFixed(0)}k customers
                              </span>
                            </div>
                            {program.scope && (
                              <div className="mt-2 p-2 bg-white/[0.03] rounded-lg">
                                <p className="text-[10px] text-white/30 mb-1">Scope:</p>
                                <div className="flex flex-wrap gap-1">
                                  {program.scope.substationsUpgraded && (
                                    <span className="text-[10px] px-2 py-0.5 bg-white/[0.06] text-white/50 rounded">
                                      {program.scope.substationsUpgraded} substations
                                    </span>
                                  )}
                                  {program.scope.transformersReplaced && (
                                    <span className="text-[10px] px-2 py-0.5 bg-white/[0.06] text-white/50 rounded">
                                      {program.scope.transformersReplaced} transformers
                                    </span>
                                  )}
                                  {program.scope.smartMetersDeployed && (
                                    <span className="text-[10px] px-2 py-0.5 bg-white/[0.06] text-white/50 rounded">
                                      {(program.scope.smartMetersDeployed / 1000).toFixed(0)}k smart meters
                                    </span>
                                  )}
                                  {program.scope.milesOfLine && (
                                    <span className="text-[10px] px-2 py-0.5 bg-white/[0.06] text-white/50 rounded">
                                      {program.scope.milesOfLine}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            {program.assignedAssets.length > 0 && (
                              <div className="mt-2 p-2 bg-white/[0.03] rounded-lg">
                                <p className="text-[10px] text-white/30 mb-1">Assigned Assets:</p>
                                <div className="flex flex-wrap gap-1">
                                  {program.assignedAssets.map(tag => {
                                    const a = getExelonAssetByTag(tag);
                                    return a ? (
                                      <span
                                        key={tag}
                                        className="text-[10px] px-2 py-0.5 bg-white/[0.06] text-white/50 rounded cursor-pointer hover:bg-white/[0.10] hover:text-white/70"
                                        onClick={e => {
                                          e.stopPropagation();
                                          handleSelectAsset(tag);
                                          setLeftPanel('assets');
                                        }}
                                      >
                                        {a.name.split(' ').slice(0, 2).join(' ')}
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

                <div className="p-3 border-t border-white/[0.06] bg-black/50">
                  <p className="text-[10px] text-white/30 mb-2">Program Types</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(PROGRAM_TYPE_CONFIG).map(([key, config]) => (
                      <div key={key} className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                        <span className="text-[10px] text-white/40">{config.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className={`absolute top-1/2 -translate-y-1/2 z-10 w-6 h-12 bg-[#111] border border-white/[0.08] rounded-r-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all ${
              leftSidebarOpen ? 'left-80' : 'left-0'
            }`}
          >
            {leftSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </aside>

        {/* ========== CENTER ========== */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-black">
          <TroubleshootPanel 
            selectedVessel={null}
            alerts={[]}
            weather={null}
            fleetMetrics={{
              totalVessels: gridStats.totalAssets,
              operationalVessels: gridStats.operationalAssets,
              maintenanceVessels: gridStats.maintenanceAssets,
            }}
          />
        </main>

        {/* ========== RIGHT SIDEBAR ========== */}
        <aside
          className={`relative flex-shrink-0 transition-all duration-300 ease-in-out ${
            rightSidebarOpen ? rightSidebarWidth : 'w-0'
          }`}
        >
          <div
            className={`absolute inset-y-0 right-0 ${rightSidebarWidth} bg-[#0a0a0a] border-l border-white/[0.06] flex flex-col overflow-hidden transition-all duration-300 ${
              rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex-shrink-0 p-2 border-b border-white/[0.04]">
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setRightPanel('alerts')}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all relative ${
                    rightPanel === 'alerts'
                      ? 'bg-white/[0.08] text-white/90'
                      : 'text-white/35 hover:text-white/55 hover:bg-white/[0.04]'
                  }`}
                >
                  <Bell className="h-3 w-3" />
                  Alerts
                  {alertCounts.unacknowledged > 0 && (
                    <span className="ml-1 text-[10px] text-white/60 font-bold">{alertCounts.unacknowledged}</span>
                  )}
                </button>
                <button
                  onClick={() => setRightPanel('news')}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    rightPanel === 'news'
                      ? 'bg-white/[0.08] text-white/90'
                      : 'text-white/35 hover:text-white/55 hover:bg-white/[0.04]'
                  }`}
                >
                  <Newspaper className="h-3 w-3" />
                  Intel
                </button>
                <button
                  onClick={() => setRightPanel(rightPanel === 'map' ? 'alerts' : 'map')}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    rightPanel === 'map'
                      ? 'bg-white/[0.08] text-white/90'
                      : 'text-white/35 hover:text-white/55 hover:bg-white/[0.04]'
                  }`}
                >
                  <MapIcon className="h-3 w-3" />
                  Load Map
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {rightPanel === 'alerts' && (
                <div className="h-full overflow-y-auto">
                  <div className="p-3 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      {alertCounts.critical > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded bg-rose-500/10 text-rose-400/70">
                          {alertCounts.critical} Critical
                        </span>
                      )}
                      {alertCounts.warning > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded bg-amber-500/10 text-amber-400/70">
                          {alertCounts.warning} Warning
                        </span>
                      )}
                      <span className="text-[10px] text-white/25 ml-auto">{alertCounts.total} total</span>
                    </div>
                  </div>
                  <div className="space-y-0">
                    {displayAlerts.map(alert => (
                      <div
                        key={alert.id}
                        className={`p-3 border-b border-white/[0.04] transition-all cursor-pointer hover:bg-white/[0.03] ${
                          alert.acknowledged ? 'opacity-40' : ''
                        } ${
                          alert.severity === 'critical'
                            ? 'border-l-2 border-l-rose-500/40'
                            : alert.severity === 'warning'
                            ? 'border-l-2 border-l-amber-500/40'
                            : ''
                        }`}
                        onClick={() => router.push(`/transformer-iot?asset=${alert.assetId}`)}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle
                            className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${
                              alert.severity === 'critical' ? 'text-rose-400/60' : 'text-amber-400/60'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium text-white/80">{alert.title}</h4>
                            <p className="text-[10px] text-white/40 mt-0.5">{alert.assetName}</p>
                            <p className="text-[10px] text-white/30 mt-1 line-clamp-2">{alert.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] text-white/40">{alert.opCo}</span>
                              <span className="text-[10px] text-white/25">
                                {alert.customersAffected.toLocaleString()} customers
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); router.push(`/transformer-iot?asset=${alert.assetId}`); }}
                                className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-cyan-400/60 hover:bg-cyan-500/10 hover:text-cyan-400/80 transition-all"
                              >
                                Investigate
                              </button>
                              {!alert.acknowledged && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAcknowledgeAlert(alert.id); }}
                                  className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-white/50 hover:bg-white/[0.10] hover:text-white/70 transition-all"
                                >
                                  Acknowledge
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleResolveAlert(alert.id); }}
                                className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-white/50 hover:bg-white/[0.10] hover:text-white/70 transition-all"
                              >
                                Resolve
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rightPanel === 'news' && <NewsPanel />}

              {rightPanel === 'map' && (
                <div className="flex-1 relative">
                  <iframe
                    src={ARCGIS_EMBED_URL}
                    className="absolute inset-0 w-full h-full border-0"
                    title="Exelon Utility Grid Map"
                    allow="geolocation"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className={`absolute top-1/2 -translate-y-1/2 z-10 w-6 h-12 bg-[#111] border border-white/[0.08] rounded-l-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all ${
              rightSidebarOpen ? (isMapExpanded ? 'right-[50vw]' : 'right-96') : 'right-0'
            }`}
          >
            {rightSidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </aside>
      </div>
    </div>
  );
}
