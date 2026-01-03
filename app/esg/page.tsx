'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Vessel } from '@/lib/supabase';
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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'vessels' | 'compliance' | 'pathway'>('overview');

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await supabase
          .from('vessels')
          .select('*')
          .order('name');

        if (data) {
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
        }
      } catch (error) {
        console.error('Error fetching data:', error);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60">Loading ESG data...</p>
        </div>
      </div>
    );
  }

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
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors">
                <Download className="w-4 h-4" />
                Export Report
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white font-medium text-sm transition-colors">
                <FileText className="w-4 h-4" />
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
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/70 hover:bg-white/5'
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

