// @ts-nocheck - ESG page with dynamic data
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Vessel, isSupabaseConfigured } from '@/lib/supabase';
import {
  VesselEmissions,
  FleetEmissionsSummary,
  ComplianceTarget,
  ESGScore,
  DecarbonizationPathway,
} from '@/lib/esg/types';
import {
  generateVesselEmissions,
  generateFleetSummary,
  generateComplianceTargets,
  generateESGScore,
  generateDecarbonizationPathway,
  generateEmissionsTrend,
} from '@/lib/esg/mock-data';
import { NMDC_FLEET } from '@/lib/nmdc/fleet';
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
  Ship,
  Calendar,
  DollarSign,
  Sparkles,
  Loader2,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Play,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ImpactAnalysisPanel, WhatIfSimulator } from '@/app/components/ImpactAnalysisPanel';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';

const COLORS = ['#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function ESGPage() {
  const router = useRouter();
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [vesselEmissions, setVesselEmissions] = useState<VesselEmissions[]>([]);
  const [fleetSummary, setFleetSummary] = useState<FleetEmissionsSummary | null>(null);
  const [complianceTargets, setComplianceTargets] = useState<ComplianceTarget[]>([]);
  const [esgScore, setEsgScore] = useState<ESGScore | null>(null);
  const [pathway, setPathway] = useState<DecarbonizationPathway | null>(null);
  const [emissionsTrend, setEmissionsTrend] = useState<Array<{ month: string; co2: number; target: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'vessels' | 'compliance' | 'pathway' | 'predictive'>('overview');
  
  const [impactResult, setImpactResult] = useState<ImpactAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Always use NMDC fleet data for this demo
        const data = NMDC_FLEET.map((v) => ({
          id: v.mmsi,
          name: v.name,
          type: v.type,
          mmsi: v.mmsi,
          imo: v.imo || null,
          status: 'operational',
          current_lat: 24.5 + Math.random() * 0.5,
          current_lng: 54.0 + Math.random() * 0.5,
          heading: Math.floor(Math.random() * 360),
          speed: 5 + Math.random() * 10,
          destination: v.project || 'Abu Dhabi',
          eta: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          last_update: new Date().toISOString(),
          crew_count: v.crewCount || 20,
          engine_status: 'operational',
          fuel_level: 70 + Math.random() * 25,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })) as unknown as Vessel[];

        setVessels(data);

        const emissions = generateVesselEmissions(
          data.map(v => ({ id: v.id, name: v.name, type: v.type }))
        );
        setVesselEmissions(emissions);
        setFleetSummary(generateFleetSummary(emissions));
        setComplianceTargets(generateComplianceTargets());
        setEsgScore(generateESGScore());
        setPathway(generateDecarbonizationPathway());
        setEmissionsTrend(generateEmissionsTrend(12));
      } catch (error) {
        console.error('Error fetching data:', error);
        
        // Even on error, fall back to NMDC fleet data
        const fallbackData = NMDC_FLEET.map((v) => ({
          id: v.mmsi,
          name: v.name,
          type: v.type,
          mmsi: v.mmsi,
          imo: v.imo || null,
          status: 'operational',
          current_lat: 24.5 + Math.random() * 0.5,
          current_lng: 54.0 + Math.random() * 0.5,
          heading: Math.floor(Math.random() * 360),
          speed: 5 + Math.random() * 10,
          destination: v.project || 'Abu Dhabi',
          eta: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          last_update: new Date().toISOString(),
          crew_count: v.crewCount || 20,
          engine_status: 'operational',
          fuel_level: 70 + Math.random() * 25,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })) as unknown as Vessel[];
        
        setVessels(fallbackData);
        
        const emissions = generateVesselEmissions(
          fallbackData.map(v => ({ id: v.id, name: v.name, type: v.type }))
        );
        setVesselEmissions(emissions);
        setFleetSummary(generateFleetSummary(emissions));
        setComplianceTargets(generateComplianceTargets());
        setEsgScore(generateESGScore());
        setPathway(generateDecarbonizationPathway());
        setEmissionsTrend(generateEmissionsTrend(12));
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Fuel type distribution
  const fuelDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    vesselEmissions.forEach(v => {
      counts[v.fuelType] = (counts[v.fuelType] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [vesselEmissions]);

  // Emissions by vessel type
  const emissionsByType = useMemo(() => {
    const totals: Record<string, number> = {};
    vesselEmissions.forEach(v => {
      const type = v.vesselType.replace('_', ' ');
      totals[type] = (totals[type] || 0) + v.emissions.co2;
    });
    return Object.entries(totals)
      .map(([name, co2]) => ({ name, co2 }))
      .sort((a, b) => b.co2 - a.co2);
  }, [vesselEmissions]);

  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const runImpactAnalysis = useCallback((scenarioType: string, parameters: Record<string, unknown>) => {
    setIsAnalyzing(true);
    setSelectedScenario(scenarioType);
    
    setTimeout(() => {
      const fleetState = generateMockFleetState();
      
      const vesselIds = NMDC_FLEET.slice(0, 3).map(v => v.mmsi);
      const projectIds = ['p1', 'p2'];
      
      const change: ProposedChange = {
        id: `change-${Date.now()}`,
        type: scenarioType as ProposedChange['type'],
        title: getScenarioTitle(scenarioType),
        description: getScenarioDescription(scenarioType, parameters),
        effectiveDate: new Date(),
        affectedVessels: vesselIds,
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
      fuel_switch: 'Fleet Fuel Transition',
      vessel_assignment: 'Vessel Reallocation',
      maintenance_schedule: 'Maintenance Schedule Change',
      new_project: 'New Project Acquisition',
      equipment_failure: 'Equipment Failure Response',
      route_change: 'Route Optimization',
    };
    return titles[type] || 'Operational Change';
  };

  const getScenarioDescription = (type: string, params: Record<string, unknown>): string => {
    switch (type) {
      case 'fuel_switch':
        return `Transition fleet to ${params.newFuelType || 'LNG'} fuel to reduce emissions`;
      case 'vessel_assignment':
        return 'Reassign vessels to optimize fleet utilization and project coverage';
      case 'maintenance_schedule':
        return 'Adjust preventive maintenance schedules to minimize downtime';
      case 'new_project':
        return 'Evaluate impact of taking on a new high-priority client project';
      case 'equipment_failure':
        return 'Assess cascading impacts of critical equipment failure';
      default:
        return 'Evaluate operational change impact across the value chain';
    }
  };

  // Export vessel emissions data as CSV
  const exportDataAsCSV = useCallback(() => {
    if (vesselEmissions.length === 0) return;
    
    setIsExporting(true);
    
    try {
      // Create CSV header
      const headers = [
        'Vessel Name',
        'Vessel Type',
        'CO2 Emissions (tonnes)',
        'NOx Emissions (kg)',
        'SOx Emissions (kg)',
        'PM Emissions (kg)',
        'Fuel Consumed (L)',
        'Fuel Type',
        'Efficiency (g CO2/tonne-mile)',
        'Fleet Avg Efficiency',
        'CII Rating',
        'ETS Eligible'
      ];
      
      // Create CSV rows
      const rows = vesselEmissions.map(ve => [
        ve.vesselName,
        ve.vesselType.replace('_', ' '),
        ve.emissions.co2.toFixed(2),
        ve.emissions.nox.toFixed(2),
        ve.emissions.sox.toFixed(2),
        ve.emissions.pm.toFixed(2),
        ve.fuelConsumed.toFixed(0),
        ve.fuelType,
        ve.efficiency.toFixed(2),
        ve.benchmark.fleetAverage.toFixed(2),
        ve.ciiRating,
        ve.etsEligible ? 'Yes' : 'No'
      ]);
      
      // Add fleet summary rows (padded to match header column count)
      const columnCount = headers.length;
      const padRow = (cells: string[]) => {
        const padded = [...cells];
        while (padded.length < columnCount) {
          padded.push('');
        }
        return padded;
      };
      
      if (fleetSummary) {
        rows.push(padRow([]));
        rows.push(padRow(['--- Fleet Summary ---']));
        rows.push(padRow(['Total CO2 (tonnes)', fleetSummary.totalCO2.toFixed(2)]));
        rows.push(padRow(['Total NOx (kg)', fleetSummary.totalNOx.toFixed(2)]));
        rows.push(padRow(['Total SOx (kg)', fleetSummary.totalSOx.toFixed(2)]));
        rows.push(padRow(['Total Fuel (L)', fleetSummary.totalFuel.toFixed(0)]));
        rows.push(padRow(['Average Efficiency', fleetSummary.avgEfficiency.toFixed(2)]));
        rows.push(padRow(['Best Performer', fleetSummary.bestPerformer]));
        rows.push(padRow(['Worst Performer', fleetSummary.worstPerformer]));
      }
      
      // Convert to CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map(row => Array.isArray(row) ? row.map(cell => `"${cell}"`).join(',') : row)
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `esg_emissions_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  }, [vesselEmissions, fleetSummary]);

  // Generate comprehensive ESG report as HTML and open in new window for printing
  const generateESGReport = useCallback(() => {
    if (!fleetSummary || !esgScore || !pathway) return;
    
    setIsGenerating(true);
    
    try {
      const reportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NMDC ESG Report - ${reportDate}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      color: #1a1a1a; 
      line-height: 1.6;
      background: #f8f9fa;
    }
    .container { max-width: 900px; margin: 0 auto; padding: 40px; background: white; min-height: 100vh; }
    .header { 
      text-align: center; 
      padding: 40px 0; 
      border-bottom: 3px solid #10b981; 
      margin-bottom: 40px;
    }
    .header h1 { font-size: 32px; color: #064e3b; margin-bottom: 8px; }
    .header .subtitle { color: #6b7280; font-size: 16px; }
    .header .date { color: #9ca3af; font-size: 14px; margin-top: 8px; }
    
    .section { margin-bottom: 40px; }
    .section-title { 
      font-size: 20px; 
      font-weight: 600; 
      color: #1f2937; 
      margin-bottom: 20px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .metrics-grid { 
      display: grid; 
      grid-template-columns: repeat(4, 1fr); 
      gap: 16px; 
      margin-bottom: 30px; 
    }
    .metric-card { 
      background: #f9fafb; 
      border: 1px solid #e5e7eb; 
      border-radius: 12px; 
      padding: 20px; 
      text-align: center; 
    }
    .metric-value { font-size: 28px; font-weight: 700; color: #10b981; }
    .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-top: 4px; }
    
    .esg-scores { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
    .esg-score-card { 
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border-radius: 12px; 
      padding: 24px; 
      text-align: center;
    }
    .esg-score-card.social { background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%); }
    .esg-score-card.governance { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); }
    .esg-score-card h3 { font-size: 14px; color: #374151; margin-bottom: 8px; }
    .esg-score-card .score { font-size: 36px; font-weight: 700; color: #059669; }
    .esg-score-card.social .score { color: #0891b2; }
    .esg-score-card.governance .score { color: #7c3aed; }
    
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-size: 12px; text-transform: uppercase; color: #6b7280; }
    td { font-size: 14px; }
    tr:hover { background: #f9fafb; }
    
    .compliance-item { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .status-badge { 
      padding: 4px 12px; 
      border-radius: 20px; 
      font-size: 12px; 
      font-weight: 600;
    }
    .status-on_track { background: #d1fae5; color: #059669; }
    .status-at_risk { background: #fef3c7; color: #d97706; }
    .status-behind { background: #fee2e2; color: #dc2626; }
    
    .pathway-phase { 
      display: flex; 
      gap: 20px; 
      padding: 20px;
      background: #f9fafb;
      border-radius: 12px;
      margin-bottom: 16px;
      border-left: 4px solid #10b981;
    }
    .pathway-year { font-size: 24px; font-weight: 700; color: #10b981; min-width: 60px; }
    .pathway-content { flex: 1; }
    .pathway-target { font-weight: 600; color: #1f2937; margin-bottom: 8px; }
    .pathway-initiatives { display: flex; flex-wrap: wrap; gap: 8px; }
    .initiative-tag { 
      background: #e5e7eb; 
      padding: 4px 10px; 
      border-radius: 4px; 
      font-size: 12px; 
      color: #4b5563;
    }
    
    .footer { 
      margin-top: 60px; 
      padding-top: 20px; 
      border-top: 1px solid #e5e7eb; 
      text-align: center; 
      color: #9ca3af; 
      font-size: 12px; 
    }
    
    @media print {
      body { background: white; }
      .container { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌿 NMDC Fleet ESG Report</h1>
      <div class="subtitle">Environmental, Social & Governance Performance</div>
      <div class="date">Report Generated: ${reportDate}</div>
    </div>
    
    <div class="section">
      <h2 class="section-title">📊 Fleet Emissions Summary</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${fleetSummary.totalCO2.toFixed(0)}</div>
          <div class="metric-label">Total CO₂ (tonnes)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${(fleetSummary.totalFuel / 1000).toFixed(0)}K</div>
          <div class="metric-label">Fuel Consumed (L)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${fleetSummary.avgEfficiency.toFixed(1)}</div>
          <div class="metric-label">Avg Efficiency</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${vesselEmissions.length}</div>
          <div class="metric-label">Vessels Monitored</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">🏆 ESG Score Breakdown</h2>
      <div class="esg-scores">
        <div class="esg-score-card">
          <h3>🌍 Environmental</h3>
          <div class="score">${esgScore.environmental.score}</div>
        </div>
        <div class="esg-score-card social">
          <h3>👥 Social</h3>
          <div class="score">${esgScore.social.score}</div>
        </div>
        <div class="esg-score-card governance">
          <h3>🏛️ Governance</h3>
          <div class="score">${esgScore.governance.score}</div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 20px; padding: 20px; background: #f0fdf4; border-radius: 12px;">
        <div style="font-size: 14px; color: #6b7280;">Overall ESG Score</div>
        <div style="font-size: 48px; font-weight: 700; color: #10b981;">${esgScore.overall}</div>
        <div style="font-size: 14px; color: #9ca3af;">out of 100</div>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">🚢 Vessel Emissions Detail</h2>
      <table>
        <thead>
          <tr>
            <th>Vessel</th>
            <th>Type</th>
            <th>CO₂ (t)</th>
            <th>Fuel (L)</th>
            <th>Fuel Type</th>
            <th>CII Rating</th>
          </tr>
        </thead>
        <tbody>
          ${vesselEmissions.map(ve => `
            <tr>
              <td><strong>${ve.vesselName}</strong></td>
              <td>${ve.vesselType.replace('_', ' ')}</td>
              <td>${ve.emissions.co2.toFixed(1)}</td>
              <td>${ve.fuelConsumed.toFixed(0)}</td>
              <td>${ve.fuelType}</td>
              <td><strong>${ve.ciiRating}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="section">
      <h2 class="section-title">✅ Compliance Status</h2>
      ${complianceTargets.map(t => `
        <div class="compliance-item">
          <div>
            <strong>${t.name}</strong>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${t.description}</div>
          </div>
          <span class="status-badge status-${t.status}">
            ${t.status === 'on_track' ? '✓ On Track' : t.status === 'at_risk' ? '⚠ At Risk' : '✗ Behind'}
          </span>
        </div>
      `).join('')}
    </div>
    
    <div class="section">
      <h2 class="section-title">🎯 Decarbonization Pathway</h2>
      <p style="margin-bottom: 20px; color: #6b7280;">${pathway.name}</p>
      ${pathway.phases.map(phase => `
        <div class="pathway-phase">
          <div class="pathway-year">${phase.year}</div>
          <div class="pathway-content">
            <div class="pathway-target">${phase.targetReduction}% Emission Reduction Target</div>
            <div class="pathway-initiatives">
              ${phase.initiatives.map(i => `<span class="initiative-tag">${i}</span>`).join('')}
            </div>
          </div>
        </div>
      `).join('')}
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 24px;">
        <div style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="font-size: 20px; font-weight: 700; color: #10b981;">$${(pathway.totalInvestment / 1000000).toFixed(0)}M</div>
          <div style="font-size: 12px; color: #6b7280;">Total Investment</div>
        </div>
        <div style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="font-size: 20px; font-weight: 700; color: #0891b2;">$${(pathway.totalSavings / 1000000).toFixed(0)}M</div>
          <div style="font-size: 12px; color: #6b7280;">Expected Savings</div>
        </div>
        <div style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="font-size: 20px; font-weight: 700; color: #7c3aed;">${pathway.paybackPeriod} years</div>
          <div style="font-size: 12px; color: #6b7280;">Payback Period</div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>This report was automatically generated by NMDC Fleet Intelligence Platform</p>
      <p>© ${new Date().getFullYear()} NMDC Marine Operations</p>
      <button onclick="window.print()" class="no-print" style="margin-top: 20px; padding: 12px 24px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
        🖨️ Print / Save as PDF
      </button>
    </div>
  </div>
</body>
</html>
      `;
      
      // Open in new window
      const reportWindow = window.open('', '_blank');
      if (reportWindow) {
        reportWindow.document.write(reportHtml);
        reportWindow.document.close();
      }
    } finally {
      setTimeout(() => setIsGenerating(false), 500);
    }
  }, [fleetSummary, esgScore, vesselEmissions, complianceTargets, pathway]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60">Loading ESG data...</p>
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-white/10 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">ESG Intelligence Center</h1>
                  <p className="text-sm text-white/50">Environmental, Social & Governance</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={exportDataAsCSV}
                disabled={isExporting || vesselEmissions.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export CSV
              </button>
              <button 
                onClick={generateESGReport}
                disabled={isGenerating || !fleetSummary || !esgScore}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              { id: 'vessels', label: 'Vessel Emissions', icon: Ship },
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
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-violet-500/30 text-violet-300">NEW</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-6">
        {activeTab === 'overview' && fleetSummary && esgScore && (
          <div className="space-y-6">
            {/* Top Metrics */}
            <div className="grid grid-cols-5 gap-4">
              <MetricCard
                icon={Factory}
                label="Total CO₂ Emissions"
                value={`${fleetSummary.totalCO2.toFixed(0)}t`}
                trend={fleetSummary.trend.co2Change}
                color="rose"
              />
              <MetricCard
                icon={Fuel}
                label="Fuel Consumed"
                value={`${(fleetSummary.totalFuel / 1000).toFixed(0)}kL`}
                color="amber"
              />
              <MetricCard
                icon={BarChart3}
                label="Avg Efficiency"
                value={`${fleetSummary.avgEfficiency.toFixed(1)}`}
                subtext="g CO₂/tonne-mile"
                trend={fleetSummary.trend.efficiencyChange}
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

            {/* Charts Row */}
            <div className="grid grid-cols-3 gap-6">
              {/* Emissions Trend */}
              <div className="col-span-2 bg-white/[0.02] rounded-xl border border-white/10 p-6">
                <h3 className="text-sm font-medium text-white mb-4">CO₂ Emissions Trend</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={emissionsTrend}>
                      <defs>
                        <linearGradient id="colorCO2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="month" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                      <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #333',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="co2"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fill="url(#colorCO2)"
                        name="Actual CO₂ (t)"
                      />
                      <Area
                        type="monotone"
                        dataKey="target"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="none"
                        name="Target"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ESG Score Breakdown */}
              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-6">
                <h3 className="text-sm font-medium text-white mb-4">ESG Score Breakdown</h3>
                <div className="space-y-4">
                  <ESGScoreBar
                    label="Environmental"
                    score={esgScore.environmental.score}
                    icon={Leaf}
                    color="emerald"
                  />
                  <ESGScoreBar
                    label="Social"
                    score={esgScore.social.score}
                    icon={Users}
                    color="cyan"
                  />
                  <ESGScoreBar
                    label="Governance"
                    score={esgScore.governance.score}
                    icon={Building2}
                    color="violet"
                  />
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Overall Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-emerald-400">{esgScore.overall}</span>
                      <span className="text-white/30">/ 100</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-emerald-400">
                    <TrendingDown className="w-3 h-3 rotate-180" />
                    <span>Improving trend</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-3 gap-6">
              {/* Emissions by Vessel Type */}
              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-6">
                <h3 className="text-sm font-medium text-white mb-4">Emissions by Vessel Type</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={emissionsByType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                      <XAxis type="number" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#666"
                        tick={{ fill: '#888', fontSize: 10 }}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #333',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="co2" fill="#a855f7" radius={[0, 4, 4, 0]} name="CO₂ (tonnes)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Fuel Type Distribution */}
              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-6">
                <h3 className="text-sm font-medium text-white mb-4">Fuel Type Distribution</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={fuelDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {fuelDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #333',
                          borderRadius: '8px',
                        }}
                      />
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
                      <span className="text-sm text-white/70">{target.name}</span>
                      <StatusBadge status={target.status} />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('compliance')}
                  className="w-full mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-1 text-sm text-primary-400 hover:text-primary-300"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vessels' && (
          <div className="bg-white/[0.02] rounded-xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-medium text-white">Vessel Emissions Report</h3>
              <p className="text-sm text-white/40">Monthly emissions data by vessel</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase">Vessel</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50 uppercase">CO₂ (t)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50 uppercase">NOx (kg)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50 uppercase">Fuel (L)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50 uppercase">Fuel Type</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50 uppercase">Efficiency</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/50 uppercase">vs Fleet Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {vesselEmissions.map((ve, i) => {
                    const vsBenchmark = ve.efficiency - ve.benchmark.fleetAverage;
                    return (
                      <tr key={ve.vesselId} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white">{ve.vesselName}</div>
                          <div className="text-xs text-white/40 capitalize">{ve.vesselType.replace('_', ' ')}</div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-white">{ve.emissions.co2.toFixed(1)}</td>
                        <td className="px-6 py-4 text-right text-sm text-white">{ve.emissions.nox.toFixed(0)}</td>
                        <td className="px-6 py-4 text-right text-sm text-white">{ve.fuelConsumed.toFixed(0)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-xs px-2 py-1 rounded ${
                            ve.fuelType === 'LNG' ? 'bg-emerald-500/20 text-emerald-400' :
                            ve.fuelType === 'MDO' ? 'bg-cyan-500/20 text-cyan-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {ve.fuelType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-white">{ve.efficiency.toFixed(1)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm font-medium ${vsBenchmark > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {vsBenchmark > 0 ? '+' : ''}{vsBenchmark.toFixed(1)}
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
                      style={{ width: `${(target.currentValue / target.targetValue) * 100}%` }}
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
                    {((target.currentValue / target.targetValue) * 100).toFixed(0)}% complete
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pathway' && pathway && (
          <div className="space-y-6">
            {/* Pathway Header */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/20">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{pathway.name}</h2>
                  <p className="text-sm text-white/50">Strategic roadmap to net-zero emissions</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    ${(pathway.totalInvestment / 1000000).toFixed(0)}M
                  </div>
                  <div className="text-xs text-white/40">Total Investment</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-400">
                    ${(pathway.totalSavings / 1000000).toFixed(0)}M
                  </div>
                  <div className="text-xs text-white/40">Expected Savings</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {pathway.paybackPeriod} yrs
                  </div>
                  <div className="text-xs text-white/40">Payback Period</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400 capitalize">
                    {pathway.riskLevel}
                  </div>
                  <div className="text-xs text-white/40">Risk Level</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white/[0.02] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-medium text-white mb-6">Decarbonization Timeline</h3>
              
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[60px] top-0 bottom-0 w-0.5 bg-white/10" />

                {pathway.phases.map((phase, i) => (
                  <div key={phase.year} className="relative flex gap-6 pb-8 last:pb-0">
                    {/* Year marker */}
                    <div className="w-[120px] flex-shrink-0 flex items-center gap-3">
                      <span className="text-2xl font-bold text-white">{phase.year}</span>
                      <div className={`w-4 h-4 rounded-full border-4 ${
                        i === 0 ? 'bg-emerald-500 border-emerald-500/30' :
                        'bg-white/20 border-white/10'
                      }`} />
                    </div>

                    {/* Phase content */}
                    <div className="flex-1 bg-white/[0.02] rounded-xl border border-white/10 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-400">
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
                          <span
                            key={j}
                            className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/70"
                          >
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
            <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 rounded-xl border border-violet-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-violet-500/20">
                  <Brain className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Predictive Impact Analysis</h2>
                  <p className="text-sm text-white/50">
                    See upstream & downstream effects of any operational change on ESG, finances, and operations
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <ArrowUpRight className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-xs text-white/40">Upstream</div>
                  <div className="text-sm font-medium text-white">Supply Chain, Crew, Parts</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <div className="text-xs text-white/40">Change Event</div>
                  <div className="text-sm font-medium text-white">Proposed Action</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <ArrowDownRight className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                  <div className="text-xs text-white/40">Downstream</div>
                  <div className="text-sm font-medium text-white">Revenue, Clients, ESG</div>
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
                      id: 'fuel_switch_lng',
                      type: 'fuel_switch',
                      icon: Leaf,
                      title: 'LNG Fuel Transition',
                      description: 'Analyze impact of switching 5 vessels to LNG fuel',
                      params: { newFuelType: 'LNG' },
                      color: 'emerald',
                    },
                    {
                      id: 'fuel_switch_hybrid',
                      type: 'fuel_switch',
                      icon: Fuel,
                      title: 'Hybrid Propulsion',
                      description: 'Evaluate hybrid electric-diesel conversion',
                      params: { newFuelType: 'Hybrid' },
                      color: 'cyan',
                    },
                    {
                      id: 'schedule_change',
                      type: 'schedule_change',
                      icon: Calendar,
                      title: 'Schedule Optimization',
                      description: 'Reschedule operations for weather windows',
                      params: { delayDays: 5 },
                      color: 'amber',
                    },
                    {
                      id: 'maintenance_defer',
                      type: 'maintenance_schedule',
                      icon: Building2,
                      title: 'Defer Maintenance',
                      description: 'Push non-critical maintenance by 30 days',
                      params: { deferDays: 30 },
                      color: 'violet',
                    },
                    {
                      id: 'new_project',
                      type: 'new_project',
                      icon: Target,
                      title: 'New ADNOC Project',
                      description: 'Evaluate taking on a $15M installation project',
                      params: { estimatedCost: 15000000, requiredVesselTypes: ['dredger', 'jack_up_barge'] },
                      color: 'blue',
                    },
                    {
                      id: 'equipment_failure',
                      type: 'equipment_failure',
                      icon: AlertTriangle,
                      title: 'Equipment Failure',
                      description: 'Simulate main engine failure on Al Mirfa',
                      params: { severity: 'critical', estimatedDowntime: 14 },
                      color: 'rose',
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
                          <div className={`p-2 rounded-lg bg-white/5`}>
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
                    <p className="text-white font-medium">Analyzing Impact Chain...</p>
                    <p className="text-sm text-white/50 mt-1">Calculating upstream & downstream effects</p>
                    <div className="mt-4 flex items-center gap-6 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> Supply Chain
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Financial
                      </span>
                      <span className="flex items-center gap-1">
                        <Leaf className="w-3 h-3" /> ESG
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> Crew
                      </span>
                    </div>
                  </div>
                ) : impactResult ? (
                  <ImpactAnalysisPanel
                    result={impactResult}
                    onDismiss={() => {
                      setImpactResult(null);
                      setSelectedScenario(null);
                    }}
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
                      Choose a what-if scenario to see how it impacts the entire operation chain — 
                      from supply chain and crew upstream, to revenue, clients, and ESG downstream.
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
                  <p className="text-xs text-white/40 mt-1">Annual CO₂ emissions</p>
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
                  <p className="text-xs text-white/40 mt-1">Project timeline shift</p>
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
    primary: 'text-primary-400 bg-primary-500/10',
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
        <div
          className={`h-full rounded-full ${colorClasses[color].bg}`}
          style={{ width: `${score}%` }}
        />
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

