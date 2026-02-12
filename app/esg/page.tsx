// @ts-nocheck - ESG page with dynamic data
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AssetEmissions,
  GridEmissionsSummary,
  ComplianceTarget,
  ESGScore,
  DecarbonizationPathway,
} from '@/lib/esg/types';
import {
  generateAssetEmissions,
  generateGridSummary,
  generateComplianceTargets,
  generateESGScore,
  generateDecarbonizationPathway,
  generateEmissionsTrend,
  getESGImpactFromMaintenance,
} from '@/lib/esg/mock-data';
import { EXELON_ASSETS } from '@/lib/exelon/fleet';
import {
  ArrowLeft,
  Leaf,
  Factory,
  TrendingDown,
  Target,
  Shield,
  Users,
  Building2,
  BarChart3,
  PieChart,
  FileText,
  Download,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Droplets,
  Wind,
  Fuel,
  Zap,
  Calendar,
  DollarSign,
  Sparkles,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Play,
  Activity,
  Gauge,
  ThermometerSun,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ImpactAnalysisPanel } from '@/app/components/ImpactAnalysisPanel';
import { 
  analyzeImpact, 
  generateMockFleetState,
  ProposedChange,
  ImpactAnalysisResult,
} from '@/lib/impact-analysis';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function ESGPage() {
  const router = useRouter();
  const [assetEmissions, setAssetEmissions] = useState<AssetEmissions[]>([]);
  const [gridSummary, setGridSummary] = useState<GridEmissionsSummary | null>(null);
  const [complianceTargets, setComplianceTargets] = useState<ComplianceTarget[]>([]);
  const [esgScore, setEsgScore] = useState<ESGScore | null>(null);
  const [pathway, setPathway] = useState<DecarbonizationPathway | null>(null);
  const [emissionsTrend, setEmissionsTrend] = useState<Array<{ month: string; co2: number; target: number; maintenanceImpact?: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'compliance' | 'pathway' | 'predictive'>('overview');
  
  const [impactResult, setImpactResult] = useState<ImpactAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  useEffect(() => {
    try {
      const emissions = generateAssetEmissions();
      setAssetEmissions(emissions);
      setGridSummary(generateGridSummary(emissions));
      setComplianceTargets(generateComplianceTargets());
      setEsgScore(generateESGScore());
      setPathway(generateDecarbonizationPathway());
      setEmissionsTrend(generateEmissionsTrend(12));
    } catch (error) {
      console.error('Error generating ESG data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Emissions by asset type (power_transformer, distribution_transformer, substation)
  const emissionsByType = useMemo(() => {
    const totals: Record<string, { co2: number; losses: number; count: number }> = {};
    assetEmissions.forEach(a => {
      const type = a.assetType.replace(/_/g, ' ');
      if (!totals[type]) totals[type] = { co2: 0, losses: 0, count: 0 };
      totals[type].co2 += a.emissions.co2;
      totals[type].losses += a.emissions.gridLosses;
      totals[type].count++;
    });
    return Object.entries(totals)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.co2 - a.co2);
  }, [assetEmissions]);

  // Emissions by OpCo
  const emissionsByOpCo = useMemo(() => {
    const totals: Record<string, { co2: number; sf6: number; assets: number; customers: number }> = {};
    assetEmissions.forEach(a => {
      if (!totals[a.opCo]) totals[a.opCo] = { co2: 0, sf6: 0, assets: 0, customers: 0 };
      totals[a.opCo].co2 += a.emissions.co2;
      totals[a.opCo].sf6 += a.emissions.sf6;
      totals[a.opCo].assets++;
      totals[a.opCo].customers += a.customersServed || 0;
    });
    return Object.entries(totals)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.co2 - a.co2);
  }, [assetEmissions]);

  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const maintenanceImpact = useMemo(() => getESGImpactFromMaintenance(), []);

  const runImpactAnalysis = useCallback((scenarioType: string, parameters: Record<string, unknown>) => {
    setIsAnalyzing(true);
    setSelectedScenario(scenarioType);
    
    setTimeout(() => {
      const fleetState = generateMockFleetState();
      
      const assetIds = EXELON_ASSETS.slice(0, 3).map(a => a.assetTag);
      const projectIds = ['p1', 'p2'];
      
      const change: ProposedChange = {
        id: `change-${Date.now()}`,
        type: scenarioType as ProposedChange['type'],
        title: getScenarioTitle(scenarioType),
        description: getScenarioDescription(scenarioType, parameters),
        effectiveDate: new Date(),
        affectedVessels: assetIds,
        affectedProjects: projectIds,
        parameters,
      };
      
      const result = analyzeImpact(change, fleetState);
      setImpactResult(result);
      setIsAnalyzing(false);
    }, 1500);
  }, []);

  const getScenarioTitle = (type: string): string => {
    const titles: Record<string, string> = {
      sf6_replacement: 'SF₆ Breaker Replacement Program',
      transformer_upgrade: 'Transformer Fleet Modernization',
      maintenance_schedule: 'Predictive Maintenance Optimization',
      grid_modernization: 'Smart Grid Infrastructure Upgrade',
      equipment_failure: 'Critical Equipment Failure Response',
      load_optimization: 'Load Balancing & Loss Reduction',
    };
    return titles[type] || 'Operational Change';
  };

  const getScenarioDescription = (type: string, params: Record<string, unknown>): string => {
    switch (type) {
      case 'sf6_replacement':
        return 'Replace SF₆ circuit breakers with vacuum or solid-state alternatives to eliminate greenhouse gas leakage';
      case 'transformer_upgrade':
        return 'Modernize aging transformer fleet with high-efficiency units to reduce grid losses';
      case 'maintenance_schedule':
        return 'Shift from time-based to condition-based maintenance using DGA analytics and AI predictions';
      case 'grid_modernization':
        return 'Deploy advanced sensors, smart switches, and automation across distribution network';
      case 'equipment_failure':
        return 'Assess cascading impacts of critical transformer failure on grid reliability and emissions';
      default:
        return 'Evaluate operational change impact across the grid value chain';
    }
  };

  // Export asset emissions data as CSV
  const exportDataAsCSV = useCallback(() => {
    if (assetEmissions.length === 0) return;
    
    setIsExporting(true);
    
    try {
      const headers = [
        'Asset Name',
        'Asset Tag',
        'Asset Type',
        'OpCo',
        'CO2 from Losses (tonnes)',
        'SF6 Leakage (kg)',
        'Grid Losses (MWh)',
        'Line Loss %',
        'Efficiency %',
        'Health Index',
        'Energy Delivered (MWh)',
        'Peak Load (MW)',
        'Customers Served',
        'Maintenance Impact'
      ];
      
      const rows = assetEmissions.map(ae => [
        ae.assetName,
        ae.assetTag,
        ae.assetType.replace(/_/g, ' '),
        ae.opCo,
        ae.emissions.co2.toFixed(2),
        ae.emissions.sf6.toFixed(2),
        ae.emissions.gridLosses.toFixed(2),
        ae.emissions.linelossPct.toFixed(3),
        ae.efficiency.toFixed(2),
        ae.healthIndex.toFixed(0),
        ae.energyDelivered.toFixed(0),
        ae.peakLoadMW.toFixed(1),
        (ae.customersServed || 0).toString(),
        ae.maintenanceImpact,
      ]);
      
      const columnCount = headers.length;
      const padRow = (cells: string[]) => {
        const padded = [...cells];
        while (padded.length < columnCount) padded.push('');
        return padded;
      };
      
      if (gridSummary) {
        rows.push(padRow([]));
        rows.push(padRow(['--- Grid Summary ---']));
        rows.push(padRow(['Total CO2 (tonnes)', gridSummary.totalCO2.toFixed(2)]));
        rows.push(padRow(['Total SF6 (kg)', gridSummary.totalSF6.toFixed(2)]));
        rows.push(padRow(['Total Grid Losses (MWh)', gridSummary.totalGridLosses.toFixed(0)]));
        rows.push(padRow(['Average Efficiency %', gridSummary.avgEfficiency.toFixed(2)]));
        rows.push(padRow(['Best Performer', gridSummary.bestPerformer]));
        rows.push(padRow(['Worst Performer', gridSummary.worstPerformer]));
        rows.push(padRow(['Customers Served', gridSummary.totalCustomersServed.toString()]));
      }
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => Array.isArray(row) ? row.map(cell => `"${cell}"`).join(',') : row)
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `exelon_esg_grid_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  }, [assetEmissions, gridSummary]);

  // Generate comprehensive ESG report
  const generateESGReport = useCallback(() => {
    if (!gridSummary || !esgScore || !pathway) return;
    
    setIsGenerating(true);
    
    try {
      const reportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });
      
      const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Exelon Grid ESG Report - ${reportDate}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; line-height: 1.6; background: #f8f9fa; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px; background: white; min-height: 100vh; }
    .header { text-align: center; padding: 40px 0; border-bottom: 3px solid #3b82f6; margin-bottom: 40px; }
    .header h1 { font-size: 32px; color: #1e3a5f; margin-bottom: 8px; }
    .header .subtitle { color: #6b7280; font-size: 16px; }
    .header .date { color: #9ca3af; font-size: 14px; margin-top: 8px; }
    .section { margin-bottom: 40px; }
    .section-title { font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 20px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
    .metric-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; }
    .metric-value { font-size: 28px; font-weight: 700; color: #3b82f6; }
    .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-top: 4px; }
    .esg-scores { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
    .esg-score-card { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 24px; text-align: center; }
    .esg-score-card.social { background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%); }
    .esg-score-card.governance { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); }
    .esg-score-card h3 { font-size: 14px; color: #374151; margin-bottom: 8px; }
    .esg-score-card .score { font-size: 36px; font-weight: 700; color: #059669; }
    .esg-score-card.social .score { color: #0891b2; }
    .esg-score-card.governance .score { color: #7c3aed; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-size: 12px; text-transform: uppercase; color: #6b7280; }
    .compliance-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #f9fafb; border-radius: 8px; margin-bottom: 12px; }
    .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-on_track { background: #d1fae5; color: #059669; }
    .status-at_risk { background: #fef3c7; color: #d97706; }
    .status-behind { background: #fee2e2; color: #dc2626; }
    .pathway-phase { display: flex; gap: 20px; padding: 20px; background: #f9fafb; border-radius: 12px; margin-bottom: 16px; border-left: 4px solid #3b82f6; }
    .pathway-year { font-size: 24px; font-weight: 700; color: #3b82f6; min-width: 60px; }
    .initiative-tag { background: #e5e7eb; padding: 4px 10px; border-radius: 4px; font-size: 12px; color: #4b5563; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
    @media print { body { background: white; } .container { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ Exelon Grid ESG Report</h1>
      <div class="subtitle">Environmental, Social & Governance Performance — Grid Operations</div>
      <div class="date">Report Generated: ${reportDate}</div>
    </div>
    
    <div class="section">
      <h2 class="section-title">📊 Grid Emissions Summary</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${gridSummary.totalCO2.toFixed(0)}</div>
          <div class="metric-label">CO₂ from Losses (tonnes)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${gridSummary.totalSF6.toFixed(1)}</div>
          <div class="metric-label">SF₆ Leakage (kg)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${gridSummary.avgEfficiency.toFixed(1)}%</div>
          <div class="metric-label">Avg Grid Efficiency</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${assetEmissions.length}</div>
          <div class="metric-label">Assets Monitored</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">🏆 ESG Score Breakdown</h2>
      <div class="esg-scores">
        <div class="esg-score-card"><h3>🌍 Environmental</h3><div class="score">${esgScore.environmental.score}</div></div>
        <div class="esg-score-card social"><h3>👥 Social</h3><div class="score">${esgScore.social.score}</div></div>
        <div class="esg-score-card governance"><h3>🏛️ Governance</h3><div class="score">${esgScore.governance.score}</div></div>
      </div>
      <div style="text-align: center; margin-top: 20px; padding: 20px; background: #eff6ff; border-radius: 12px;">
        <div style="font-size: 14px; color: #6b7280;">Overall ESG Score</div>
        <div style="font-size: 48px; font-weight: 700; color: #3b82f6;">${esgScore.overall}</div>
        <div style="font-size: 14px; color: #9ca3af;">out of 100</div>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">⚡ Grid Asset Emissions Detail</h2>
      <table>
        <thead>
          <tr>
            <th>Asset</th><th>Type</th><th>OpCo</th><th>CO₂ (t)</th><th>SF₆ (kg)</th><th>Efficiency</th><th>Health</th>
          </tr>
        </thead>
        <tbody>
          ${assetEmissions.map(ae => `
            <tr>
              <td><strong>${ae.assetName}</strong></td>
              <td>${ae.assetType.replace(/_/g, ' ')}</td>
              <td>${ae.opCo}</td>
              <td>${ae.emissions.co2.toFixed(1)}</td>
              <td>${ae.emissions.sf6.toFixed(1)}</td>
              <td>${ae.efficiency.toFixed(1)}%</td>
              <td>${ae.healthIndex}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="section">
      <h2 class="section-title">✅ Compliance Status</h2>
      ${complianceTargets.map(t => `
        <div class="compliance-item">
          <div><strong>${t.name}</strong><div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${t.description}</div></div>
          <span class="status-badge status-${t.status}">${t.status === 'on_track' ? '✓ On Track' : t.status === 'at_risk' ? '⚠ At Risk' : '✗ Behind'}</span>
        </div>
      `).join('')}
    </div>
    
    <div class="section">
      <h2 class="section-title">🎯 Decarbonization Pathway</h2>
      <p style="margin-bottom: 20px; color: #6b7280;">${pathway.name}</p>
      ${pathway.phases.map(phase => `
        <div class="pathway-phase">
          <div class="pathway-year">${phase.year}</div>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 8px;">${phase.targetReduction}% Emission Reduction Target</div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${phase.initiatives.map(i => `<span class="initiative-tag">${i}</span>`).join('')}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="footer">
      <p>This report was automatically generated by Exelon GridIQ Intelligence Platform</p>
      <p>© ${new Date().getFullYear()} Exelon Corporation</p>
      <button onclick="window.print()" class="no-print" style="margin-top: 20px; padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">🖨️ Print / Save as PDF</button>
    </div>
  </div>
</body>
</html>
      `;
      
      const reportWindow = window.open('', '_blank');
      if (reportWindow) {
        reportWindow.document.write(reportHtml);
        reportWindow.document.close();
      }
    } finally {
      setTimeout(() => setIsGenerating(false), 500);
    }
  }, [gridSummary, esgScore, assetEmissions, complianceTargets, pathway]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60">Loading grid ESG data...</p>
        </div>
      </div>
    );
  }

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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-green-500/20 border border-white/10 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Grid ESG Intelligence</h1>
                  <p className="text-sm text-white/50">Decarbonization · SF₆ Reduction · Grid Efficiency</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={exportDataAsCSV}
                disabled={isExporting || assetEmissions.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export CSV
              </button>
              <button 
                onClick={generateESGReport}
                disabled={isGenerating || !gridSummary || !esgScore}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate ESG Report
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4">
            {[
              { id: 'overview', label: 'Overview', icon: PieChart },
              { id: 'assets', label: 'Grid Asset Emissions', icon: Zap },
              { id: 'compliance', label: 'Compliance', icon: Target },
              { id: 'pathway', label: 'Decarbonization', icon: TrendingDown },
              { id: 'predictive', label: 'Predictive Impact', icon: Brain },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? tab.id === 'predictive' ? 'bg-violet-500/20 text-violet-400' : 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'predictive' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-violet-500/30 text-violet-300">AI</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-6">
        {activeTab === 'overview' && gridSummary && esgScore && (
          <div className="space-y-6">
            {/* Top Metrics */}
            <div className="grid grid-cols-5 gap-4">
              <MetricCard
                icon={Factory}
                label="CO₂ from Grid Losses"
                value={`${gridSummary.totalCO2.toFixed(0)}t`}
                trend={gridSummary.trend.co2Change}
                color="rose"
              />
              <MetricCard
                icon={Wind}
                label="SF₆ Leakage"
                value={`${gridSummary.totalSF6.toFixed(1)}kg`}
                trend={gridSummary.trend.sf6Change}
                color="amber"
              />
              <MetricCard
                icon={Gauge}
                label="Avg Efficiency"
                value={`${gridSummary.avgEfficiency.toFixed(1)}%`}
                subtext="Grid delivery efficiency"
                trend={gridSummary.trend.efficiencyChange}
                color="cyan"
              />
              <MetricCard
                icon={Leaf}
                label="ESG Score"
                value={`${esgScore.overall}`}
                subtext="Out of 100"
                color="emerald"
              />
              <MetricCard
                icon={Target}
                label="Compliance"
                value={`${complianceTargets.filter(t => t.status === 'on_track').length}/${complianceTargets.length}`}
                subtext="Targets on track"
                color="primary"
              />
            </div>

            {/* Maintenance → ESG Impact Banner */}
            {maintenanceImpact.affectedAssets.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">
                    Maintenance Issues Impacting ESG Performance
                  </span>
                  <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${
                    maintenanceImpact.complianceRisk === 'high' ? 'bg-rose-500/20 text-rose-400' :
                    maintenanceImpact.complianceRisk === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {maintenanceImpact.complianceRisk} risk
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-white/50">Extra CO₂ from degradation:</span>
                    <span className="text-rose-400 font-medium ml-2">+{maintenanceImpact.totalEmissionsImpact} t/year</span>
                  </div>
                  <div>
                    <span className="text-white/50">Financial impact:</span>
                    <span className="text-amber-400 font-medium ml-2">${(maintenanceImpact.financialImpact / 1000).toFixed(0)}K/year</span>
                  </div>
                  <div>
                    <span className="text-white/50">Assets affected:</span>
                    <span className="text-white font-medium ml-2">{maintenanceImpact.affectedAssets.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-3 gap-6">
              {/* Emissions Trend */}
              <div className="col-span-2 bg-white/[0.02] rounded-xl border border-white/10 p-6">
                <h3 className="text-sm font-medium text-white mb-4">CO₂ from Grid Losses — Monthly Trend</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={emissionsTrend}>
                      <defs>
                        <linearGradient id="colorCO2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorMaint" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="month" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                      <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="co2" stroke="#ef4444" strokeWidth={2} fill="url(#colorCO2)" name="CO₂ from Losses (t)" />
                      <Area type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" fill="none" name="Target" />
                      <Area type="monotone" dataKey="maintenanceImpact" stroke="#f59e0b" strokeWidth={2} fill="url(#colorMaint)" name="Maintenance Impact (t)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ESG Score Breakdown */}
              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-6">
                <h3 className="text-sm font-medium text-white mb-4">ESG Score Breakdown</h3>
                <div className="space-y-4">
                  <ESGScoreBar label="Environmental" score={esgScore.environmental.score} icon={Leaf} color="emerald" />
                  <ESGScoreBar label="Social" score={esgScore.social.score} icon={Users} color="cyan" />
                  <ESGScoreBar label="Governance" score={esgScore.governance.score} icon={Building2} color="violet" />
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Overall Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-400">{esgScore.overall}</span>
                      <span className="text-white/30">/ 100</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-emerald-400">
                    {esgScore.trend === 'improving' ? (
                      <>
                        <TrendingDown className="w-3 h-3 rotate-180" />
                        <span>Improving trend</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-amber-400">Declining — maintenance issues</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-3 gap-6">
              {/* Emissions by Asset Type */}
              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-6">
                <h3 className="text-sm font-medium text-white mb-4">CO₂ by Asset Type</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={emissionsByType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                      <XAxis type="number" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} width={120} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} />
                      <Bar dataKey="co2" fill="#3b82f6" radius={[0, 4, 4, 0]} name="CO₂ (tonnes)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Emissions by OpCo */}
              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-6">
                <h3 className="text-sm font-medium text-white mb-4">CO₂ by Operating Company</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={emissionsByOpCo}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="co2"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {emissionsByOpCo.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Compliance Overview */}
              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-6">
                <h3 className="text-sm font-medium text-white mb-4">Compliance Status</h3>
                <div className="space-y-3">
                  {complianceTargets.slice(0, 4).map(target => (
                    <div key={target.id} className="flex items-center justify-between">
                      <span className="text-sm text-white/70 truncate mr-2">{target.name}</span>
                      <StatusBadge status={target.status} />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('compliance')}
                  className="w-full mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="bg-white/[0.02] rounded-xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-medium text-white">Grid Asset Emissions Report</h3>
              <p className="text-sm text-white/40">Monthly emissions, efficiency, and health data by grid asset</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase">Asset</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">OpCo</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase">CO₂ (t)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase">SF₆ (kg)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase">Losses (MWh)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase">Efficiency</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase">vs Fleet</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {assetEmissions.map((ae, i) => {
                    const vsBenchmark = ae.efficiency - ae.benchmark.fleetAverage;
                    return (
                      <tr key={ae.assetTag} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white">{ae.assetName}</div>
                          <div className="text-xs text-white/40 capitalize">{ae.assetType.replace(/_/g, ' ')}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-white/70">{ae.opCo}</td>
                        <td className="px-4 py-4 text-right text-sm text-white">{ae.emissions.co2.toFixed(1)}</td>
                        <td className="px-4 py-4 text-right text-sm text-white">{ae.emissions.sf6.toFixed(1)}</td>
                        <td className="px-4 py-4 text-right text-sm text-white">{ae.emissions.gridLosses.toFixed(0)}</td>
                        <td className="px-4 py-4 text-right">
                          <span className={`text-sm font-medium ${
                            ae.efficiency >= 99 ? 'text-emerald-400' :
                            ae.efficiency >= 98 ? 'text-cyan-400' :
                            'text-amber-400'
                          }`}>
                            {ae.efficiency.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className={`text-sm font-medium ${vsBenchmark > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {vsBenchmark > 0 ? '+' : ''}{vsBenchmark.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className={`text-xs px-2 py-1 rounded ${
                            ae.healthIndex >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                            ae.healthIndex >= 60 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-rose-500/20 text-rose-400'
                          }`}>
                            {ae.healthIndex}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="grid grid-cols-2 gap-6">
            {complianceTargets.map(target => (
              <div
                key={target.id}
                className={`rounded-xl border p-6 ${
                  target.status === 'on_track' ? 'bg-emerald-500/5 border-emerald-500/30' :
                  target.status === 'at_risk' ? 'bg-amber-500/5 border-amber-500/30' :
                  'bg-rose-500/5 border-rose-500/30'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">{target.name}</h3>
                    <p className="text-sm text-white/50">{target.description}</p>
                  </div>
                  <StatusBadge status={target.status} large />
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white/50">Progress</span>
                    <span className="text-white">
                      {target.currentValue} / {target.targetValue} {target.unit}
                    </span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        target.status === 'on_track' ? 'bg-emerald-500' :
                        target.status === 'at_risk' ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min((target.currentValue / target.targetValue) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-white/40">
                    <Calendar className="w-4 h-4" />
                    <span>Deadline: {target.deadline.toLocaleDateString()}</span>
                  </div>
                  <span className={`font-medium ${
                    target.status === 'on_track' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {Math.min(((target.currentValue / target.targetValue) * 100), 100).toFixed(0)}% complete
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pathway' && pathway && (
          <div className="space-y-6">
            {/* Pathway Header */}
            <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-xl border border-blue-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{pathway.name}</h2>
                  <p className="text-sm text-white/50">Strategic roadmap to net-zero grid operations</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">${(pathway.totalInvestment / 1000000000).toFixed(1)}B</div>
                  <div className="text-xs text-white/40">Total Investment</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-400">${(pathway.totalSavings / 1000000000).toFixed(1)}B</div>
                  <div className="text-xs text-white/40">Expected Savings</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{pathway.paybackPeriod} yrs</div>
                  <div className="text-xs text-white/40">Payback Period</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400 capitalize">{pathway.riskLevel}</div>
                  <div className="text-xs text-white/40">Risk Level</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white/[0.02] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-medium text-white mb-6">Decarbonization Timeline</h3>
              
              <div className="relative">
                <div className="absolute left-[60px] top-0 bottom-0 w-0.5 bg-white/10" />

                {pathway.phases.map((phase, i) => (
                  <div key={phase.year} className="relative flex gap-6 pb-8 last:pb-0">
                    <div className="w-[120px] flex-shrink-0 flex items-center gap-3">
                      <span className="text-2xl font-bold text-white">{phase.year}</span>
                      <div className={`w-4 h-4 rounded-full border-4 ${
                        i === 0 ? 'bg-blue-500 border-blue-500/30' : 'bg-white/20 border-white/10'
                      }`} />
                    </div>

                    <div className="flex-1 bg-white/[0.02] rounded-xl border border-white/10 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-blue-400">
                            {phase.targetReduction}% Reduction
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-white/40">
                          <span>Invest: ${(phase.investment / 1000000).toFixed(0)}M</span>
                          <span>Save: ${(phase.expectedSavings / 1000000).toFixed(0)}M</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {phase.initiatives.map((initiative, j) => (
                          <span key={j} className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/70">
                            {initiative}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'predictive' && (
          <div className="space-y-6">
            {/* Predictive Header */}
            <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 rounded-xl border border-violet-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-violet-500/20">
                  <Brain className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Predictive Impact Analysis</h2>
                  <p className="text-sm text-white/50">
                    See upstream & downstream effects of grid operational changes on ESG, reliability, and finances
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <ArrowUpRight className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-xs text-white/40">Upstream</div>
                  <div className="text-sm font-medium text-white">Supply Chain, Parts, Crews</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <div className="text-xs text-white/40">Change Event</div>
                  <div className="text-sm font-medium text-white">Proposed Action</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <ArrowDownRight className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                  <div className="text-xs text-white/40">Downstream</div>
                  <div className="text-sm font-medium text-white">Reliability, Customers, ESG</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <Target className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <div className="text-xs text-white/40">Outcome</div>
                  <div className="text-sm font-medium text-white">Recommendations</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Scenario Selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-amber-400" />
                  Run What-If Scenario
                </h3>
                
                <div className="space-y-3">
                  {[
                    {
                      id: 'sf6_replace',
                      type: 'sf6_replacement',
                      icon: Wind,
                      title: 'SF₆ Breaker Replacement',
                      description: 'Replace all SF₆ breakers with vacuum alternatives',
                      params: { replacementType: 'vacuum' },
                      color: 'emerald',
                    },
                    {
                      id: 'transformer_upgrade',
                      type: 'transformer_upgrade',
                      icon: Zap,
                      title: 'Transformer Modernization',
                      description: 'Replace aging transformers with high-efficiency units',
                      params: { upgradeType: 'high_efficiency' },
                      color: 'cyan',
                    },
                    {
                      id: 'schedule_change',
                      type: 'maintenance_schedule',
                      icon: Calendar,
                      title: 'Predictive Maintenance Shift',
                      description: 'Move from time-based to DGA-driven maintenance',
                      params: { strategy: 'condition_based' },
                      color: 'amber',
                    },
                    {
                      id: 'grid_modernize',
                      type: 'grid_modernization',
                      icon: Activity,
                      title: 'Smart Grid Deployment',
                      description: 'Deploy sensors, automation, and self-healing switches',
                      params: { coverage: '80%' },
                      color: 'violet',
                    },
                    {
                      id: 'equipment_failure',
                      type: 'equipment_failure',
                      icon: AlertTriangle,
                      title: 'Critical Transformer Failure',
                      description: 'Simulate 345kV transformer failure at Fisk St.',
                      params: { severity: 'critical', estimatedDowntime: 21 },
                      color: 'rose',
                    },
                    {
                      id: 'der_integration',
                      type: 'new_project',
                      icon: ThermometerSun,
                      title: 'DER Integration Program',
                      description: 'Integrate 500MW distributed energy resources',
                      params: { capacity: 500, type: 'solar_storage' },
                      color: 'blue',
                    },
                  ].map(scenario => {
                    const colorClasses: Record<string, string> = {
                      emerald: 'border-emerald-500/30 hover:bg-emerald-500/10',
                      cyan: 'border-cyan-500/30 hover:bg-cyan-500/10',
                      amber: 'border-amber-500/30 hover:bg-amber-500/10',
                      violet: 'border-violet-500/30 hover:bg-violet-500/10',
                      blue: 'border-blue-500/30 hover:bg-blue-500/10',
                      rose: 'border-rose-500/30 hover:bg-rose-500/10',
                    };
                    const iconColors: Record<string, string> = {
                      emerald: 'text-emerald-400',
                      cyan: 'text-cyan-400',
                      amber: 'text-amber-400',
                      violet: 'text-violet-400',
                      blue: 'text-blue-400',
                      rose: 'text-rose-400',
                    };
                    
                    return (
                      <button
                        key={scenario.id}
                        onClick={() => runImpactAnalysis(scenario.type, scenario.params)}
                        disabled={isAnalyzing}
                        className={`w-full p-4 rounded-xl bg-white/[0.02] border ${colorClasses[scenario.color]} transition-colors text-left disabled:opacity-50 ${
                          selectedScenario === scenario.type ? 'ring-2 ring-violet-500/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-white/5">
                            <scenario.icon className={`w-5 h-5 ${iconColors[scenario.color]}`} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{scenario.title}</div>
                            <p className="text-xs text-white/50 mt-0.5">{scenario.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Impact Analysis Results */}
              <div className="col-span-2">
                {isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center bg-white/[0.02] rounded-xl border border-white/10 p-8">
                    <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-white font-medium">Analyzing Grid Impact Chain...</p>
                    <p className="text-sm text-white/50 mt-1">Calculating upstream & downstream effects</p>
                    <div className="mt-4 flex items-center gap-6 text-xs text-white/40">
                      <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Supply Chain</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Financial</span>
                      <span className="flex items-center gap-1"><Leaf className="w-3 h-3" /> ESG</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Crews</span>
                    </div>
                  </div>
                ) : impactResult ? (
                  <ImpactAnalysisPanel
                    result={impactResult}
                    onDismiss={() => { setImpactResult(null); setSelectedScenario(null); }}
                    onApplyChange={() => {
                      alert('In production, this would initiate the change process with all stakeholders notified.');
                      setImpactResult(null);
                      setSelectedScenario(null);
                    }}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-white/[0.02] rounded-xl border border-white/10 border-dashed p-8">
                    <Brain className="w-16 h-16 text-white/20 mb-4" />
                    <p className="text-white/60 font-medium">Select a Scenario</p>
                    <p className="text-sm text-white/40 mt-1 text-center max-w-md">
                      Choose a what-if scenario to see how it impacts the entire grid operation chain — 
                      from supply chain and field crews upstream, to reliability, customers, and ESG downstream.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Key Insights */}
            {impactResult && (
              <div className="grid grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl border ${
                  impactResult.esgImpact.co2Change < 0 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf className={impactResult.esgImpact.co2Change < 0 ? 'w-5 h-5 text-emerald-400' : 'w-5 h-5 text-rose-400'} />
                    <span className="text-xs text-white/50">Carbon Impact</span>
                  </div>
                  <div className={`text-2xl font-bold ${impactResult.esgImpact.co2Change < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {impactResult.esgImpact.co2Change > 0 ? '+' : ''}{impactResult.esgImpact.co2Change.toFixed(1)}%
                  </div>
                  <p className="text-xs text-white/40 mt-1">Grid CO₂ emissions</p>
                </div>
                
                <div className={`p-4 rounded-xl border ${
                  impactResult.financialSummary.totalFinancialImpact < 500000
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                    <span className="text-xs text-white/50">Financial Impact</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-400">
                    ${(impactResult.financialSummary.totalFinancialImpact / 1000).toFixed(0)}K
                  </div>
                  <p className="text-xs text-white/40 mt-1">Total cost/benefit</p>
                </div>
                
                <div className={`p-4 rounded-xl border ${
                  impactResult.operationalImpact.scheduleDelayDays < 7
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : 'bg-orange-500/10 border-orange-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span className="text-xs text-white/50">Schedule Impact</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {impactResult.operationalImpact.scheduleDelayDays} days
                  </div>
                  <p className="text-xs text-white/40 mt-1">Outage / project shift</p>
                </div>
                
                <div className={`p-4 rounded-xl border ${
                  impactResult.esgImpact.esgScoreChange >= 0
                    ? 'bg-violet-500/10 border-violet-500/30' 
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className={impactResult.esgImpact.esgScoreChange >= 0 ? 'w-5 h-5 text-violet-400' : 'w-5 h-5 text-rose-400'} />
                    <span className="text-xs text-white/50">ESG Score</span>
                  </div>
                  <div className={`text-2xl font-bold ${impactResult.esgImpact.esgScoreChange >= 0 ? 'text-violet-400' : 'text-rose-400'}`}>
                    {impactResult.esgImpact.esgScoreChange > 0 ? '+' : ''}{impactResult.esgImpact.esgScoreChange} pts
                  </div>
                  <p className="text-xs text-white/40 mt-1">Overall ESG rating</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Helper Components
function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  subtext?: string;
  trend?: number;
  color: 'primary' | 'emerald' | 'amber' | 'rose' | 'cyan';
}) {
  const colorClasses: Record<'primary' | 'emerald' | 'amber' | 'rose' | 'cyan', string> = {
    primary: 'text-blue-400 bg-blue-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
  };

  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-white">{value}</div>
          {subtext && <div className="text-xs text-white/40">{subtext}</div>}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend < 0 ? 'text-emerald-400' : trend > 0 ? 'text-rose-400' : 'text-white/40'
          }`}>
            {trend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
            {trend < 0 ? '' : trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

function ESGScoreBar({
  label,
  score,
  icon: Icon,
  color,
}: {
  label: string;
  score: number;
  icon: LucideIcon;
  color: 'emerald' | 'cyan' | 'violet';
}) {
  const colorClasses: Record<'emerald' | 'cyan' | 'violet', { text: string; bg: string }> = {
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500' },
    violet: { text: 'text-violet-400', bg: 'bg-violet-500' },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colorClasses[color].text}`} />
          <span className="text-sm text-white/70">{label}</span>
        </div>
        <span className={`text-sm font-bold ${colorClasses[color].text}`}>{score}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClasses[color].bg}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ status, large = false }: { status: 'on_track' | 'at_risk' | 'behind'; large?: boolean }) {
  const config: Record<'on_track' | 'at_risk' | 'behind', { icon: LucideIcon; bg: string; text: string; label: string }> = {
    on_track: { icon: CheckCircle, bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'On Track' },
    at_risk: { icon: AlertTriangle, bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'At Risk' },
    behind: { icon: XCircle, bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Behind' },
  };

  const { icon: Icon, bg, text, label } = config[status];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${bg}`}>
      <Icon className={`${large ? 'w-4 h-4' : 'w-3 h-3'} ${text}`} />
      <span className={`${large ? 'text-sm' : 'text-xs'} font-medium ${text}`}>{label}</span>
    </div>
  );
}
