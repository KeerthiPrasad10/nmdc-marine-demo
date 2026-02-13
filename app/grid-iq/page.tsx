// @ts-nocheck — Grid IQ: Beanstalk Analysis → Scenarios → Decision → Dispatch
'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  FlaskConical,
  Thermometer,
  Building,
  FileText,
  ClipboardList,
  Eye,
  CheckCircle,
  Sparkles,
  ArrowLeft,
  Clock,
  Activity,
  AlertTriangle,
  TrendingDown,
  Shield,
  Zap,
  ChevronRight,
  ChevronDown,
  Users,
  DollarSign,
  Timer,
  Wrench,
  Search,
  Truck,
  ArrowRightLeft,
  Lightbulb,
  Network,
  BadgeCheck,
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  Target,
  Calendar,
} from 'lucide-react';
import { DEMO_SCENARIOS, type DemoScenario, type ScenarioEvent, type DecisionSupport, type DecisionOption } from '@/lib/demo-scenarios';
import { EXELON_ASSETS } from '@/lib/exelon/fleet';
import { ASSET_ISSUES, getAssetIssueSummary } from '@/lib/asset-issues';
import { getProgramsByAsset } from '@/lib/exelon/projects';

// ════════════════════════════════════════════════════════════════════════
// TYPES & CONFIG
// ════════════════════════════════════════════════════════════════════════

type FlowPhase = 'analysis' | 'scenarios' | 'impact' | 'dispatch';

type ParamSeverity = 'normal' | 'warning' | 'critical' | 'info';

interface AnalysisParam {
  id: string;
  label: string;
  value: string;
  unit?: string;
  severity: ParamSeverity;
  note: string;
}

interface DetailedAgent {
  id: string;
  name: string;
  shortName: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
  dotColor: string;
  parameters: AnalysisParam[];
  finding: string;
  findingSeverity: ParamSeverity;
}

type AgentStatus = 'queued' | 'thinking' | 'complete';

const DETAILED_AGENTS: DetailedAgent[] = [
  {
    id: 'dga', name: 'Dissolved Gas Analysis Agent', shortName: 'DGA Oil Chemistry',
    icon: <FlaskConical className="w-4 h-4" />, color: 'text-amber-400',
    borderColor: 'border-amber-500/20', bgColor: 'bg-amber-500/[0.06]', dotColor: 'rgba(251,191,36,0.5)',
    finding: 'TDCG at Condition 3 — thermal fault signature detected via Duval T2 zone + Rogers Ratio confirmation',
    findingSeverity: 'critical',
    parameters: [
      { id: 'h2', label: 'Hydrogen (H₂)', value: '142', unit: 'ppm', severity: 'warning', note: 'Above normal; partial discharge indicator' },
      { id: 'ch4', label: 'Methane (CH₄)', value: '86', unit: 'ppm', severity: 'normal', note: 'Within IEEE C57.104 Condition 1' },
      { id: 'c2h6', label: 'Ethane (C₂H₆)', value: '47', unit: 'ppm', severity: 'normal', note: 'Stable — no thermal decomposition' },
      { id: 'c2h4', label: 'Ethylene (C₂H₄)', value: '201', unit: 'ppm', severity: 'critical', note: 'Thermal fault >300°C — primary concern' },
      { id: 'c2h2', label: 'Acetylene (C₂H₂)', value: '18', unit: 'ppm', severity: 'warning', note: 'Arcing threshold approach — partial discharge' },
      { id: 'co', label: 'Carbon Monoxide (CO)', value: '890', unit: 'ppm', severity: 'warning', note: 'Cellulose (paper insulation) degradation' },
      { id: 'co2', label: 'Carbon Dioxide (CO₂)', value: '4,200', unit: 'ppm', severity: 'normal', note: 'CO₂/CO ratio 4.7 — within normal range' },
      { id: 'tdcg', label: 'Total Dissolved Combustible Gas', value: '1,384', unit: 'ppm', severity: 'critical', note: 'IEEE Condition 3 — action required' },
      { id: 'duval', label: 'Duval Triangle Classification', value: 'T2', unit: 'zone', severity: 'critical', note: 'Low-energy thermal fault 300-700°C' },
      { id: 'rogers', label: 'Rogers Ratio Analysis', value: '2.1 / 0.4', unit: 'ratio', severity: 'warning', note: 'Confirms thermal fault, 150-300°C range' },
    ],
  },
  {
    id: 'thermal', name: 'Thermal & Aging Model Agent', shortName: 'Thermal Profile',
    icon: <Thermometer className="w-4 h-4" />, color: 'text-rose-400',
    borderColor: 'border-rose-500/20', bgColor: 'bg-rose-500/[0.06]', dotColor: 'rgba(251,113,133,0.5)',
    finding: 'Winding hot-spot 12°C above design limit — IEEE C57.91 aging factor 4.2× accelerated, DP below 300',
    findingSeverity: 'critical',
    parameters: [
      { id: 'top_oil', label: 'Top Oil Temperature', value: '78.3', unit: '°C', severity: 'normal', note: 'Within rated 85°C top-oil rise' },
      { id: 'hot_spot', label: 'Winding Hot-Spot', value: '112.4', unit: '°C', severity: 'critical', note: '12°C above 100°C design limit' },
      { id: 'bottom_oil', label: 'Bottom Oil Temperature', value: '52.1', unit: '°C', severity: 'normal', note: 'Normal gradient — no circulation issue' },
      { id: 'ambient_delta', label: 'Ambient Correlation Δ', value: '+8.2', unit: '°C', severity: 'warning', note: 'Abnormal rise vs expected thermal model' },
      { id: 'aging_factor', label: 'IEEE C57.91 Aging Factor', value: '4.2×', unit: '', severity: 'critical', note: 'Insulation aging 4.2× faster than normal' },
      { id: 'dp_value', label: 'Insulation DP Value (est.)', value: '285', unit: '', severity: 'warning', note: 'Below 300 threshold — end-of-life approaching' },
      { id: 'cooling_eff', label: 'Cooling System Efficiency', value: '72%', unit: '', severity: 'warning', note: 'Fan bank A degraded — 28% loss' },
      { id: 'load_thermal', label: 'Load vs Thermal Curve', value: 'Non-linear', unit: '', severity: 'warning', note: 'Divergence begins at 85% load — abnormal' },
      { id: 'temp_rise_delta', label: 'Temperature Rise Test Δ', value: '+14.3', unit: '°C', severity: 'critical', note: 'vs factory test — significant degradation' },
    ],
  },
  {
    id: 'fleet', name: 'Fleet Intelligence Agent', shortName: 'Fleet Comparison',
    icon: <Building className="w-4 h-4" />, color: 'text-blue-400',
    borderColor: 'border-blue-500/20', bgColor: 'bg-blue-500/[0.06]', dotColor: 'rgba(96,165,250,0.5)',
    finding: '3 identical GE batch-1989 units failed within 18mo at this DGA profile — 67% probability within 24mo',
    findingSeverity: 'critical',
    parameters: [
      { id: 'vintage', label: 'Vintage Cohort Match', value: '14 units', unit: '', severity: 'info', note: '1987-1992 GE units across fleet' },
      { id: 'fail_rate', label: 'Cohort Failure Rate (5yr)', value: '23%', unit: '', severity: 'critical', note: 'At this DGA + thermal profile' },
      { id: 'batch', label: 'Manufacturer Batch B-1989', value: '3 of 8 failed', unit: '', severity: 'critical', note: '37.5% batch failure rate' },
      { id: 'climate', label: 'Geographic Climate Factor', value: '7.2 / 10', unit: '', severity: 'warning', note: 'Mid-Atlantic humidity accelerates corrosion' },
      { id: 'load_sim', label: 'Loading Pattern Similarity', value: '87%', unit: 'match', severity: 'warning', note: 'Matches failed unit PE-TF-012 profile' },
      { id: 'mttf', label: 'Mean Time to Failure (est.)', value: '18 ± 6', unit: 'months', severity: 'critical', note: 'At current degradation trajectory' },
      { id: 'fleet_prob', label: 'Fleet Failure Probability', value: '67%', unit: '', severity: 'critical', note: 'Within 24 months at current state' },
      { id: 'cross_opco', label: 'Cross-OpCo Intelligence', value: 'PECO match', unit: '', severity: 'warning', note: 'PE-TF-012 showed identical DGA 14mo before failure' },
    ],
  },
  {
    id: 'oem', name: 'OEM Specifications Agent', shortName: 'OEM & Design Limits',
    icon: <FileText className="w-4 h-4" />, color: 'text-cyan-400',
    borderColor: 'border-cyan-500/20', bgColor: 'bg-cyan-500/[0.06]', dotColor: 'rgba(34,211,238,0.5)',
    finding: 'Design life exceeded by 3.2 years — SB-2019-047 bushing recall unaddressed, 38 months overdue for overhaul',
    findingSeverity: 'critical',
    parameters: [
      { id: 'design_life', label: 'Design Life Remaining', value: '-3.2', unit: 'years', severity: 'critical', note: 'Exceeded rated service life' },
      { id: 'sb_047', label: 'Service Bulletin SB-2019-047', value: 'Open', unit: '', severity: 'critical', note: 'Bushing porcelain seal recall — unaddressed' },
      { id: 'overhaul', label: 'Overhaul Interval Compliance', value: '38 mo overdue', unit: '', severity: 'critical', note: 'Major overhaul last performed 2016' },
      { id: 'nameplate', label: 'Nameplate vs Actual Load', value: '94%', unit: 'MVA', severity: 'normal', note: 'Within rated capacity — no overloading' },
      { id: 'bil', label: 'BIL Margin', value: '150 kV', unit: '', severity: 'normal', note: 'Operating at 138 kV — adequate margin' },
      { id: 'defect', label: 'Known Defect Pattern', value: 'Type-U bushing', unit: '', severity: 'warning', note: 'GE Type-U porcelain cracking pattern documented' },
      { id: 'cooling_rate', label: 'Cooling System Rating', value: 'ONAN/ONAF', unit: '', severity: 'warning', note: 'Fan bank A degraded — reduced ONAF capacity' },
      { id: 'eos', label: 'Manufacturer End-of-Support', value: '2019', unit: '', severity: 'warning', note: 'No further OEM parts guarantee' },
    ],
  },
  {
    id: 'history', name: 'Work Order & Maintenance Agent', shortName: 'Work Order History',
    icon: <ClipboardList className="w-4 h-4" />, color: 'text-violet-400',
    borderColor: 'border-violet-500/20', bgColor: 'bg-violet-500/[0.06]', dotColor: 'rgba(167,139,250,0.5)',
    finding: 'Repeat bushing seal failure (3× in 24mo), PM compliance 72%, repair costs escalating 2.2× year-over-year',
    findingSeverity: 'critical',
    parameters: [
      { id: 'pm_compliance', label: 'PM Compliance Rate', value: '72%', unit: '', severity: 'warning', note: 'Below 85% target — gaps in scheduled PM' },
      { id: 'cm_count', label: 'Corrective MOs (24 months)', value: '7', unit: '', severity: 'critical', note: 'Repeat-issue pattern exceeds threshold' },
      { id: 'repeat_code', label: 'Repeat Failure Code', value: 'BUSH-SEAL', unit: '', severity: 'critical', note: '3 occurrences in 24 months — systemic issue' },
      { id: 'mttr', label: 'Mean Repair Duration', value: '14.3', unit: 'hrs', severity: 'warning', note: 'Increasing +22% trend — complexity rising' },
      { id: 'parts_hist', label: 'Parts Replaced (24mo)', value: '6 items', unit: '', severity: 'warning', note: 'Bushing gasket ×3, oil seal ×2, fan motor ×1' },
      { id: 'outage_hrs', label: 'Total Outage Hours (12mo)', value: '127', unit: 'hrs', severity: 'critical', note: 'Well above fleet average of 24 hrs' },
      { id: 'cost_trend', label: 'Cost Per Repair Trend', value: '$18K→$41K', unit: '', severity: 'critical', note: 'Escalating 2.2× YoY — diminishing returns' },
      { id: 'last_overhaul', label: 'Last Major Overhaul', value: '2016', unit: '', severity: 'warning', note: '10 years ago — exceeds 7-year cycle' },
    ],
  },
  {
    id: 'inspection', name: 'Field Inspection Records Agent', shortName: 'Inspection & Environment',
    icon: <Eye className="w-4 h-4" />, color: 'text-emerald-400',
    borderColor: 'border-emerald-500/20', bgColor: 'bg-emerald-500/[0.06]', dotColor: 'rgba(52,211,153,0.5)',
    finding: 'Visual condition 4.1/10 — active oil seepage B-phase bushing, porcelain hairline crack, salt-air corrosion zone',
    findingSeverity: 'critical',
    parameters: [
      { id: 'visual', label: 'Visual Condition Score', value: '4.1 / 10', unit: '', severity: 'critical', note: 'Below 5.0 replacement threshold' },
      { id: 'oil_leak', label: 'Oil Leak Detection', value: 'Active', unit: '', severity: 'critical', note: 'Seepage at B-phase bushing gasket — progressive' },
      { id: 'bushing_cond', label: 'Bushing Porcelain Condition', value: 'Hairline crack', unit: '', severity: 'critical', note: 'B-phase — risk of catastrophic flashover' },
      { id: 'tank_corrosion', label: 'Tank Corrosion Index', value: '3.7 / 10', unit: '', severity: 'warning', note: 'Moderate surface rust — coating failure' },
      { id: 'foundation', label: 'Foundation & Leveling', value: '2mm δ', unit: '', severity: 'normal', note: 'Within acceptable tolerance' },
      { id: 'grounding', label: 'Grounding Resistance', value: '0.8', unit: 'Ω', severity: 'normal', note: 'Below 1.0Ω limit — acceptable' },
      { id: 'surge', label: 'Surge Arrester Status', value: 'Good', unit: '', severity: 'normal', note: 'MOV tested 2024-Q3 — pass' },
      { id: 'cabinet', label: 'Control Cabinet', value: 'Moisture ingress', unit: '', severity: 'warning', note: 'Door seal degraded — electronics at risk' },
      { id: 'environment', label: 'Environmental Exposure', value: 'Salt-air zone', unit: '', severity: 'warning', note: 'Coastal proximity — accelerated corrosion' },
    ],
  },
];

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; gradient: string }> = {
  aging_asset: { label: 'Aging Asset', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', gradient: 'from-orange-900/40 via-black to-black' },
  dga_alert: { label: 'DGA Alert', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', gradient: 'from-red-900/40 via-black to-black' },
  avoided_outage: { label: 'Outage Prevention', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', gradient: 'from-emerald-900/40 via-black to-black' },
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingDown, Activity, Clock, Lightbulb, Wrench, CheckCircle, AlertTriangle, Shield, Search, Zap, Thermometer, Network, Truck, ArrowRightLeft,
};

const EVENT_TYPE_STYLES: Record<string, { color: string; bg: string; lineColor: string }> = {
  detection: { color: 'text-amber-400', bg: 'bg-amber-500/10', lineColor: 'bg-amber-500' },
  analysis: { color: 'text-blue-400', bg: 'bg-blue-500/10', lineColor: 'bg-blue-500' },
  recommendation: { color: 'text-purple-400', bg: 'bg-purple-500/10', lineColor: 'bg-purple-500' },
  action: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', lineColor: 'bg-cyan-500' },
  resolution: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', lineColor: 'bg-emerald-500' },
};

// ════════════════════════════════════════════════════════════════════════
// PHASE 1 — Beanstalk Event Stream (clean, terminal-style agent cards)
// ════════════════════════════════════════════════════════════════════════

const SEV_STYLES: Record<ParamSeverity, { dot: string; text: string; bg: string; label: string; icon: string }> = {
  normal:   { dot: 'bg-emerald-400', text: 'text-emerald-400/80', bg: 'bg-emerald-400/10', label: 'OK', icon: '✓' },
  warning:  { dot: 'bg-amber-400',   text: 'text-amber-400/80',   bg: 'bg-amber-400/10',   label: 'WARN', icon: '⚠' },
  critical: { dot: 'bg-rose-400',    text: 'text-rose-400/80',    bg: 'bg-rose-400/10',    label: 'CRIT', icon: '✗' },
  info:     { dot: 'bg-blue-400',    text: 'text-blue-400/70',    bg: 'bg-blue-400/10',    label: 'INFO', icon: 'ℹ' },
};

// Tool-call operation names per agent (cycle through these)
const AGENT_OPS: Record<string, string[]> = {
  dga:        ['read_sensor', 'correlate', 'classify', 'cross_check', 'duval_map', 'rogers_calc', 'trend', 'threshold', 'compare', 'flag'],
  thermal:    ['read_sensor', 'model_ieee', 'compare', 'extrapolate', 'calc_dp', 'check_cooling', 'load_curve', 'delta_test', 'aging_calc'],
  fleet:      ['query_fleet', 'match_cohort', 'calc_rate', 'geo_factor', 'load_match', 'predict_mttf', 'bayes_prob', 'cross_opco'],
  oem:        ['lookup_spec', 'check_sb', 'overhaul_gap', 'load_check', 'bil_margin', 'defect_scan', 'cooling_spec', 'eos_check'],
  history:    ['query_wo', 'calc_pm', 'flag_repeat', 'mean_repair', 'parts_audit', 'outage_sum', 'cost_trend', 'overhaul_gap'],
  inspection: ['read_report', 'score_visual', 'leak_detect', 'porcelain_check', 'corrosion_idx', 'foundation', 'ground_test', 'surge_test', 'cabinet_check'],
};

/* ── Agent event stream card (Beanstalk-style) ────────────────────── */
function AgentEventStream({ agent, status, revealedCount }: {
  agent: DetailedAgent;
  status: AgentStatus;
  revealedCount: number;
}) {
  const isThinking = status === 'thinking';
  const isDone = status === 'complete';
  const isQueued = status === 'queued';
  const critCount = agent.parameters.filter(p => p.severity === 'critical').length;
  const warnCount = agent.parameters.filter(p => p.severity === 'warning').length;
  const ops = AGENT_OPS[agent.id] || [];
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new events appear
  useEffect(() => {
    if (scrollRef.current && isThinking) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [revealedCount, isThinking]);

  return (
    <div className={`rounded-lg border overflow-hidden transition-colors duration-500 ${
      isThinking ? 'border-white/[0.08] bg-[#0a0a0a]' :
      isDone ? 'border-white/[0.06] bg-[#080808]' :
      'border-white/[0.04] bg-[#060606]'
    }`}>
      {/* ── Card header (like Beanstalk dashboard) ── */}
      <div className="px-3 py-2.5 flex items-center gap-2.5 border-b border-white/[0.05]">
        {/* Status indicator */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${
          isThinking ? 'bg-emerald-400 animate-pulse' :
          isDone ? 'bg-white/20' :
          'bg-white/[0.06]'
        }`} />
        {/* Agent icon */}
        <span className={`flex-shrink-0 transition-colors duration-300 ${
          isThinking ? agent.color : isDone ? 'text-white/40' : 'text-white/10'
        }`}>
          {agent.icon}
        </span>
        {/* Agent name */}
        <span className={`text-xs font-semibold flex-1 truncate transition-colors ${
          isThinking ? 'text-white/80' : isDone ? 'text-white/50' : 'text-white/15'
        }`}>
          {agent.shortName}
        </span>
        {/* Status badge */}
        {isThinking && (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-400/80 uppercase tracking-wider">
            Running
          </span>
        )}
        {isDone && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30 uppercase tracking-wider">
            Done
          </span>
        )}
        {isQueued && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.02] text-white/10 uppercase tracking-wider">
            Queued
          </span>
        )}
        {/* Event count */}
        <span className={`text-[10px] font-mono tabular-nums transition-colors ${
          isThinking ? 'text-white/40' : isDone ? 'text-white/25' : 'text-white/8'
        }`}>
          {isDone ? agent.parameters.length : revealedCount}/{agent.parameters.length}
        </span>
      </div>

      {/* ── Event stream (like Beanstalk Live Event Stream) ── */}
      {(isThinking || isDone) && (
        <div ref={scrollRef} className="max-h-[220px] overflow-y-auto beanstalk-scrollbar">
          {agent.parameters.map((param, pIdx) => {
            const isRevealed = isDone || pIdx < revealedCount;
            const isActive = isThinking && pIdx === revealedCount - 1;
            const sev = SEV_STYLES[param.severity];
            const opName = ops[pIdx % ops.length] || 'analyze';

            if (!isRevealed) return null;

            return (
              <div
                key={param.id}
                className={`group flex items-center gap-2 px-3 py-[5px] border-b border-white/[0.02] transition-all duration-200 ${
                  isActive ? 'bg-white/[0.03]' : 'hover:bg-white/[0.015]'
                }`}
              >
                {/* Severity dot */}
                <span className={`flex-shrink-0 w-[6px] h-[6px] rounded-full transition-all ${sev.dot} ${
                  isActive ? 'animate-pulse' : 'opacity-70'
                }`} />
                {/* Tool call name (monospace, muted) */}
                <span className={`text-[10px] font-mono w-[90px] flex-shrink-0 truncate ${
                  isActive ? 'text-white/50' : 'text-white/25'
                }`}>
                  {opName}
                </span>
                {/* Parameter label */}
                <span className={`text-[10px] flex-1 truncate ${
                  isActive ? 'text-white/60' : 'text-white/35'
                }`}>
                  {param.label}
                </span>
                {/* Value */}
                <span className={`text-[10px] font-mono font-bold flex-shrink-0 text-right min-w-[60px] ${sev.text}`}>
                  {param.value}{param.unit ? ` ${param.unit}` : ''}
                </span>
                {/* Severity badge (only warn/crit) */}
                {(param.severity === 'warning' || param.severity === 'critical') && (
                  <span className={`text-[8px] font-bold font-mono px-1 py-[1px] rounded flex-shrink-0 ${sev.bg} ${sev.text}`}>
                    {sev.label}
                  </span>
                )}
                {/* Duration (simulated) */}
                <span className={`text-[9px] font-mono flex-shrink-0 w-[32px] text-right ${
                  isActive ? 'text-white/30' : 'text-white/15'
                }`}>
                  {isActive ? '...' : `${(0.2 + pIdx * 0.15).toFixed(1)}s`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Queued placeholder ── */}
      {isQueued && (
        <div className="px-3 py-4 text-center">
          <span className="text-[10px] text-white/10 font-mono">{agent.parameters.length} checks queued</span>
        </div>
      )}

      {/* ── Finding summary (appears after completion) ── */}
      {isDone && (
        <div className="px-3 py-2 border-t border-white/[0.05] flex items-start gap-2">
          <Target className={`w-3 h-3 flex-shrink-0 mt-0.5 ${agent.color}`} />
          <p className="text-[10px] leading-relaxed text-white/40">{agent.finding}</p>
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
            {critCount > 0 && (
              <span className="text-[8px] font-bold px-1 py-[1px] rounded bg-rose-400/10 text-rose-400/70">{critCount} CRIT</span>
            )}
            {warnCount > 0 && (
              <span className="text-[8px] font-bold px-1 py-[1px] rounded bg-amber-400/10 text-amber-400/70">{warnCount} WARN</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Beanstalk component (clean event-stream dashboard) ────────── */
function BeanstalkAnalysis({ onComplete }: { onComplete: () => void }) {
  const [agentStates, setAgentStates] = useState<Record<string, { status: AgentStatus; revealedParams: number }>>({});
  const [synthStatus, setSynthStatus] = useState<'waiting' | 'synthesizing' | 'complete'>('waiting');
  const [totalAnalyzed, setTotalAnalyzed] = useState(0);
  const timerRefs = useRef<NodeJS.Timeout[]>([]);
  const completeFired = useRef(false);

  const totalParams = DETAILED_AGENTS.reduce((s, a) => s + a.parameters.length, 0);

  useEffect(() => {
    const initial: Record<string, { status: AgentStatus; revealedParams: number }> = {};
    DETAILED_AGENTS.forEach(a => { initial[a.id] = { status: 'queued', revealedParams: 0 }; });
    setAgentStates(initial);
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    completeFired.current = false;
    setTotalAnalyzed(0);
    setSynthStatus('waiting');

    let runningTotal = 0;
    const PARAM_INTERVAL = 140;   // ms per parameter reveal
    const AGENT_STAGGER = 300;    // ms between agent starts

    const startAgent = (agent: DetailedAgent, delay: number) => {
      timerRefs.current.push(setTimeout(() => {
        setAgentStates(prev => ({ ...prev, [agent.id]: { status: 'thinking', revealedParams: 0 } }));
      }, delay));
      agent.parameters.forEach((_, pIdx) => {
        timerRefs.current.push(setTimeout(() => {
          setAgentStates(prev => ({ ...prev, [agent.id]: { status: 'thinking', revealedParams: pIdx + 1 } }));
          runningTotal++;
          setTotalAnalyzed(runningTotal);
        }, delay + (pIdx + 1) * PARAM_INTERVAL));
      });
      const completeTime = delay + agent.parameters.length * PARAM_INTERVAL + 200;
      timerRefs.current.push(setTimeout(() => {
        setAgentStates(prev => ({ ...prev, [agent.id]: { status: 'complete', revealedParams: agent.parameters.length } }));
      }, completeTime));
      return completeTime;
    };

    // Stagger agents so they overlap — looks like parallel processing
    let lastComplete = 0;
    DETAILED_AGENTS.forEach((a, i) => {
      const delay = i * AGENT_STAGGER + (i > 0 ? DETAILED_AGENTS[i - 1].parameters.length * PARAM_INTERVAL * 0.4 : 0);
      lastComplete = startAgent(a, delay);
    });

    timerRefs.current.push(setTimeout(() => setSynthStatus('synthesizing'), lastComplete + 400));
    timerRefs.current.push(setTimeout(() => setSynthStatus('complete'), lastComplete + 1800));
    timerRefs.current.push(setTimeout(() => {
      if (!completeFired.current) { completeFired.current = true; onComplete(); }
    }, lastComplete + 2600));

    return () => timerRefs.current.forEach(clearTimeout);
  }, [onComplete]);

  const allDone = synthStatus === 'complete';
  const activeCount = Object.values(agentStates).filter(s => s.status === 'thinking').length;
  const doneCount = Object.values(agentStates).filter(s => s.status === 'complete').length;

  return (
    <div className="space-y-3">
      {/* ── Orchestrator bar ── */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-500 ${
        allDone ? 'border-white/[0.06] bg-[#080808]' : 'border-white/[0.08] bg-[#0a0a0a]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            allDone ? 'bg-emerald-400/10' : 'bg-violet-400/10'
          }`}>
            <Brain className={`w-4 h-4 ${allDone ? 'text-emerald-400/70' : 'text-violet-400/70'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white/70">GridIQ Orchestrator</span>
              {!allDone && activeCount > 0 && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-400/70">
                  {activeCount} active
                </span>
              )}
              {doneCount > 0 && doneCount < 6 && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25">
                  {doneCount} done
                </span>
              )}
            </div>
            <div className="text-[10px] text-white/25 font-mono mt-0.5">
              {allDone
                ? `✓ ${totalParams} parameters evaluated across 6 agents`
                : `Scanning ${totalAnalyzed} / ${totalParams} parameters…`}
            </div>
          </div>
        </div>
        {/* Progress bar (not ring — cleaner) */}
        <div className="flex items-center gap-3">
          <div className="w-32 h-1.5 rounded-full bg-white/[0.04] overflow-hidden hidden sm:block">
            <div
              className={`h-full rounded-full transition-all duration-300 ${allDone ? 'bg-emerald-400/40' : 'bg-violet-400/30'}`}
              style={{ width: `${(totalAnalyzed / totalParams) * 100}%` }}
            />
          </div>
          <span className={`text-sm font-mono font-bold tabular-nums ${allDone ? 'text-emerald-400/60' : 'text-white/40'}`}>
            {Math.round((totalAnalyzed / totalParams) * 100)}%
          </span>
        </div>
      </div>

      {/* ── Agent grid (2 columns, no SVG connectors) ── */}
      <div className="grid md:grid-cols-2 gap-3">
        {DETAILED_AGENTS.map(agent => {
          const st = agentStates[agent.id] || { status: 'queued' as AgentStatus, revealedParams: 0 };
          return (
            <AgentEventStream
              key={agent.id}
              agent={agent}
              status={st.status}
              revealedCount={st.revealedParams}
            />
          );
        })}
      </div>

      {/* ── Synthesis bar ── */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-500 ${
        synthStatus === 'synthesizing' ? 'border-white/[0.08] bg-[#0a0a0a]' :
        allDone ? 'border-white/[0.06] bg-[#080808]' :
        'border-white/[0.04] bg-[#060606]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            synthStatus === 'synthesizing' ? 'bg-cyan-400/10' :
            allDone ? 'bg-emerald-400/10' : 'bg-white/[0.02]'
          }`}>
            {allDone ? <CheckCircle className="w-4 h-4 text-emerald-400/60" /> :
             synthStatus === 'synthesizing' ? <Sparkles className="w-4 h-4 text-cyan-400/70 animate-pulse" /> :
             <Sparkles className="w-4 h-4 text-white/10" />}
          </div>
          <div>
            <span className={`text-xs font-semibold block ${
              synthStatus === 'synthesizing' ? 'text-white/60' : allDone ? 'text-white/50' : 'text-white/12'
            }`}>
              {allDone ? 'Synthesis Complete' : 'Synthesis Engine'}
            </span>
            <span className={`text-[10px] font-mono block mt-0.5 ${
              synthStatus === 'synthesizing' ? 'text-white/25' : allDone ? 'text-white/20' : 'text-white/8'
            }`}>
              {synthStatus === 'synthesizing' ? 'Cross-correlating findings… generating scenarios…' :
               allDone ? `${totalParams} params → 6 findings → 3 scenarios` :
               'Waiting for agents to finish'}
            </span>
          </div>
        </div>
        {synthStatus === 'synthesizing' && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-400/70 animate-pulse">
            Running
          </span>
        )}
        {allDone && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25">
            Done
          </span>
        )}
      </div>

      <style jsx>{`
        .beanstalk-scrollbar::-webkit-scrollbar { width: 3px; }
        .beanstalk-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .beanstalk-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        .beanstalk-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// PHASE 2 — Scenario Cards (emerge after analysis)
// ════════════════════════════════════════════════════════════════════════

function ScenarioSelector({ scenarios, onSelect }: { scenarios: DemoScenario[]; onSelect: (s: DemoScenario) => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">3 Scenarios Identified</h3>
        <span className="text-xs text-white/30">Select one to investigate</span>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {scenarios.map((scenario, idx) => {
          const config = CATEGORY_CONFIG[scenario.category];
          return (
            <button
              key={scenario.id}
              onClick={() => onSelect(scenario)}
              className={`group relative overflow-hidden rounded-xl border ${config.border} bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 text-left`}
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-30 group-hover:opacity-50 transition-opacity`} />
              <div className="relative p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${config.bg} ${config.color}`}>
                    {config.label}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    scenario.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>{scenario.severity}</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">{scenario.title}</h4>
                <p className="text-[11px] text-white/40 mb-3 line-clamp-2">{scenario.subtitle}</p>
                <div className="flex items-center gap-3 text-[10px] text-white/40">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" />{scenario.assetTag}</span>
                  <span>{scenario.opCo}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mt-3">
                  <div className="rounded bg-white/5 p-1.5 text-center">
                    <div className="text-[9px] text-white/30">Cost Avoided</div>
                    <div className="text-xs font-bold text-emerald-400">{scenario.outcome.costAvoided}</div>
                  </div>
                  <div className="rounded bg-white/5 p-1.5 text-center">
                    <div className="text-[9px] text-white/30">Customers</div>
                    <div className="text-xs font-bold text-blue-400">{scenario.outcome.customersProtected.toLocaleString()}</div>
                  </div>
                  <div className="rounded bg-white/5 p-1.5 text-center">
                    <div className="text-[9px] text-white/30">Hours Saved</div>
                    <div className="text-xs font-bold text-amber-400">{scenario.outcome.outageHoursAvoided}h</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-3 text-xs font-medium text-amber-400 group-hover:text-amber-300 transition-colors">
                  Investigate <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// PHASE 3 — Impact Analysis + Decision Support
// ════════════════════════════════════════════════════════════════════════

function ImpactAnalysis({
  scenario,
  onApprove,
  onDefer,
  onBack,
}: {
  scenario: DemoScenario;
  onApprove: () => void;
  onDefer: () => void;
  onBack: () => void;
}) {
  const config = CATEGORY_CONFIG[scenario.category];
  const [timelineIdx, setTimelineIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [showDecision, setShowDecision] = useState(false);

  // Auto-play timeline
  useEffect(() => {
    if (!autoPlay) return;
    if (timelineIdx >= scenario.timeline.length) {
      setAutoPlay(false);
      setShowDecision(true);
      return;
    }
    const t = setTimeout(() => setTimelineIdx(prev => prev + 1), 1800);
    return () => clearTimeout(t);
  }, [timelineIdx, autoPlay, scenario.timeline.length]);

  const currentEvent = scenario.timeline[Math.min(timelineIdx, scenario.timeline.length - 1)];
  const progress = Math.min(100, (timelineIdx / scenario.timeline.length) * 100);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Scenario header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${config.bg} ${config.color}`}>{config.label}</span>
            <span className="text-xs text-white/30">{scenario.opCo} • {scenario.assetTag}</span>
          </div>
          <h2 className="text-lg font-bold text-white">{scenario.title}</h2>
        </div>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-4 gap-2">
        {scenario.metrics.map((m, i) => (
          <div key={i} className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
            <div className="text-[10px] text-white/40">{m.label}</div>
            <div className="text-sm font-bold text-white">{m.value}</div>
            <div className="text-[9px] text-white/30">{m.context}</div>
          </div>
        ))}
      </div>

      {/* Two-column: Timeline + Details */}
      <div className="grid grid-cols-12 gap-4">
        {/* Timeline rail */}
        <div className="col-span-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              <Timer className="w-3.5 h-3.5 text-amber-400" /> Event Timeline
            </h3>
            <div className="flex items-center gap-1">
              <button onClick={() => { setAutoPlay(!autoPlay); }} className="p-1 rounded bg-white/5 hover:bg-white/10">
                {autoPlay ? <Pause className="w-3 h-3 text-white/60" /> : <Play className="w-3 h-3 text-white/60" />}
              </button>
              <button onClick={() => { setTimelineIdx(0); setAutoPlay(true); setShowDecision(false); }} className="p-1 rounded bg-white/5 hover:bg-white/10">
                <RotateCcw className="w-3 h-3 text-white/60" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-white/10 rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>

          {/* Timeline items */}
          <div className="space-y-0 max-h-[400px] overflow-y-auto pr-2">
            {scenario.timeline.map((event, idx) => {
              const isActive = idx === timelineIdx;
              const isPast = idx < timelineIdx;
              const style = EVENT_TYPE_STYLES[event.type];
              const Icon = ICON_MAP[event.icon] || Activity;
              return (
                <div key={event.id} className="relative flex gap-3">
                  {idx < scenario.timeline.length - 1 && (
                    <div className={`absolute left-[14px] top-8 bottom-0 w-0.5 ${isPast ? style.lineColor : 'bg-white/10'} opacity-30`} />
                  )}
                  <div className={`relative z-10 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isPast || isActive ? style.bg : 'bg-white/5'
                  } ${isActive ? 'ring-2 ring-white/20 scale-110' : ''}`}>
                    <Icon className={`w-3.5 h-3.5 ${isPast || isActive ? style.color : 'text-white/20'}`} />
                  </div>
                  <div className={`flex-1 pb-4 transition-opacity duration-300 ${isPast || isActive ? 'opacity-100' : 'opacity-30'}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] font-semibold uppercase tracking-wider ${isPast || isActive ? style.color : 'text-white/20'}`}>{event.type}</span>
                    </div>
                    <h4 className="text-xs font-medium text-white">{event.title}</h4>
                    {(isPast || isActive) && (
                      <p className="text-[10px] text-white/50 mt-1 leading-relaxed">{event.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Details / Decision */}
        <div className="col-span-7">
          {!showDecision ? (
            <div className="space-y-4">
              {/* Current event detail */}
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
                <div className="flex items-start gap-3 mb-3">
                  <Brain className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">Scenario Overview</h3>
                    <p className="text-xs text-white/50 leading-relaxed">{scenario.description}</p>
                  </div>
                </div>
              </div>

              {/* Live event data */}
              {currentEvent?.data && (
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <h4 className="text-xs font-medium text-white/60 mb-2 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" /> Event Data
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(currentEvent.data).map(([key, val]) => (
                      <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-[10px]">
                        <span className="text-white/35">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="text-white/75 font-medium">{String(val)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Outcome preview */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400 mb-1">{scenario.outcome.title}</h4>
                    <p className="text-xs text-white/50 leading-relaxed">{scenario.outcome.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <DecisionPanel
              decisionSupport={scenario.decisionSupport}
              onApprove={onApprove}
              onDefer={onDefer}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Decision Panel (reused from transformer-iot, adapted)
// ════════════════════════════════════════════════════════════════════════

function DecisionPanel({
  decisionSupport,
  onApprove,
  onDefer,
}: {
  decisionSupport: DecisionSupport;
  onApprove: () => void;
  onDefer: () => void;
}) {
  const [selectedTab, setSelectedTab] = useState<'approve' | 'defer'>('approve');
  const option = selectedTab === 'approve' ? decisionSupport.approveOption : decisionSupport.deferOption;

  const urgencyLabels: Record<string, { text: string; color: string }> = {
    immediate: { text: 'Immediate', color: 'text-rose-400/70 bg-rose-500/10 border-rose-500/15' },
    within_24h: { text: 'Within 24 hours', color: 'text-amber-400/70 bg-amber-500/10 border-amber-500/15' },
    within_week: { text: 'Within 1 week', color: 'text-yellow-400/60 bg-yellow-500/10 border-yellow-500/15' },
    within_month: { text: 'Within 1 month', color: 'text-cyan-400/60 bg-cyan-500/10 border-cyan-500/15' },
  };

  const riskColors: Record<string, string> = {
    low: 'text-emerald-400/60 bg-emerald-500/10',
    medium: 'text-amber-400/60 bg-amber-500/10',
    high: 'text-orange-400/60 bg-orange-500/10',
    critical: 'text-rose-400/60 bg-rose-500/10',
  };

  const urg = urgencyLabels[decisionSupport.urgency] || urgencyLabels.within_week;

  return (
    <div className="rounded-xl bg-white/[0.03] border border-amber-500/15 overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400/50" />
            <span className="text-sm font-semibold text-amber-400/60">Operator Decision Required</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${urg.color}`}>{urg.text}</span>
            <span className="text-[10px] text-white/30 flex items-center gap-1">
              <Brain className="w-3 h-3" /> {decisionSupport.confidenceScore}%
            </span>
          </div>
        </div>
        <p className="text-xs text-white/50 leading-relaxed">{decisionSupport.summary}</p>
      </div>

      {/* Key Risks */}
      <div className="px-4 py-2.5 bg-rose-500/[0.03] border-b border-white/[0.06]">
        <div className="text-[10px] font-semibold text-rose-400/50 uppercase tracking-wider mb-1">Key Risks</div>
        <div className="space-y-1">
          {decisionSupport.keyRisks.map((risk, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px] text-white/45">
              <AlertTriangle className="w-3 h-3 text-rose-400/40 flex-shrink-0 mt-0.5" />
              {risk}
            </div>
          ))}
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex border-b border-white/[0.06]">
        <button onClick={() => setSelectedTab('approve')} className={`flex-1 px-3 py-2 text-xs font-medium transition-all ${
          selectedTab === 'approve' ? 'text-emerald-400/70 border-b-2 border-emerald-400/50 bg-emerald-500/[0.04]' : 'text-white/35 hover:text-white/50'
        }`}>
          <span className="flex items-center justify-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Approve</span>
        </button>
        <button onClick={() => setSelectedTab('defer')} className={`flex-1 px-3 py-2 text-xs font-medium transition-all ${
          selectedTab === 'defer' ? 'text-amber-400/70 border-b-2 border-amber-400/50 bg-amber-500/[0.04]' : 'text-white/35 hover:text-white/50'
        }`}>
          <span className="flex items-center justify-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Defer</span>
        </button>
      </div>

      {/* Option details */}
      <div className="px-4 py-4 space-y-3">
        <p className="text-xs text-white/50">{option.description}</p>

        {/* Impact strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`p-2.5 rounded-lg text-center ${
            option.financialImpact.trend === 'positive' ? 'bg-emerald-500/[0.06] border border-emerald-500/10' : 'bg-rose-500/[0.06] border border-rose-500/10'
          }`}>
            <div className="text-[10px] text-white/35">{option.financialImpact.label}</div>
            <div className={`text-sm font-bold ${option.financialImpact.trend === 'positive' ? 'text-emerald-400/70' : 'text-rose-400/70'}`}>{option.financialImpact.value}</div>
          </div>
          <div className={`p-2.5 rounded-lg text-center ${riskColors[option.riskLevel]}`}>
            <div className="text-[10px] text-white/35">Risk Level</div>
            <div className="text-sm font-bold capitalize">{option.riskLevel}</div>
          </div>
          <div className="p-2.5 rounded-lg text-center bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[10px] text-white/35">Timeline</div>
            <div className="text-[10px] font-medium text-white/60 leading-tight">{option.timeline}</div>
          </div>
        </div>

        {/* Customer impact */}
        <div className="p-2.5 rounded-lg bg-blue-500/[0.04] border border-blue-500/10 flex items-start gap-2">
          <Users className="w-3.5 h-3.5 text-blue-400/50 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] text-blue-400/50 font-medium">Customer Impact</div>
            <div className="text-xs text-white/50">{option.customerImpact}</div>
          </div>
        </div>

        {/* Pros & Cons */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] font-semibold text-emerald-400/50 uppercase tracking-wider mb-1.5">Value</div>
            {option.pros.map((p, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-white/45 mb-1">
                <CheckCircle className="w-3 h-3 text-emerald-400/40 flex-shrink-0 mt-0.5" /> {p}
              </div>
            ))}
          </div>
          <div>
            <div className="text-[10px] font-semibold text-rose-400/50 uppercase tracking-wider mb-1.5">Risks</div>
            {option.cons.map((c, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-white/45 mb-1">
                <AlertTriangle className="w-3 h-3 text-rose-400/40 flex-shrink-0 mt-0.5" /> {c}
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
          <button onClick={onApprove} className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" /> Approve & Execute
          </button>
          <button onClick={onDefer} className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 font-medium text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" /> Defer
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// PHASE 4 — Dispatch / Orchestration
// ════════════════════════════════════════════════════════════════════════

function DispatchPhase({ scenario, onReset }: { scenario: DemoScenario; onReset: () => void }) {
  const [dispatchSteps, setDispatchSteps] = useState([
    { id: 'wo', label: 'Generate Work Order', detail: `WO-${scenario.assetTag.slice(-3)}-GIQ`, status: 'pending' as 'pending' | 'running' | 'done', icon: ClipboardList },
    { id: 'crew', label: 'Dispatch Crew Notification', detail: `${scenario.opCo} field operations notified`, status: 'pending' as 'pending' | 'running' | 'done', icon: Users },
    { id: 'scada', label: 'SCADA Switching Order', detail: 'Automated load transfer prepared', status: 'pending' as 'pending' | 'running' | 'done', icon: Zap },
    { id: 'parts', label: 'Parts Procurement', detail: 'Spare components reserved from inventory', status: 'pending' as 'pending' | 'running' | 'done', icon: Wrench },
    { id: 'schedule', label: 'Update Program Schedule', detail: 'Gantt chart adjusted, stakeholders notified', status: 'pending' as 'pending' | 'running' | 'done', icon: Calendar },
  ]);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    dispatchSteps.forEach((_, idx) => {
      setTimeout(() => {
        setDispatchSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'running' } : s));
      }, idx * 800);
      setTimeout(() => {
        setDispatchSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'done' } : s));
      }, idx * 800 + 600);
    });
    setTimeout(() => setAllDone(true), dispatchSteps.length * 800 + 600);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Dispatch & Execution</h2>
          <p className="text-xs text-white/40">{scenario.title} — Approved by operator</p>
        </div>
      </div>

      {/* Dispatch steps */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
        {dispatchSteps.map((step, idx) => {
          const StepIcon = step.icon;
          return (
            <div key={step.id} className={`flex items-center gap-4 px-5 py-4 ${idx < dispatchSteps.length - 1 ? 'border-b border-white/5' : ''} ${
              step.status === 'running' ? 'bg-cyan-500/[0.04]' : step.status === 'done' ? 'bg-emerald-500/[0.02]' : ''
            } transition-all duration-500`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                step.status === 'done' ? 'bg-emerald-500/20' : step.status === 'running' ? 'bg-cyan-500/20' : 'bg-white/5'
              }`}>
                {step.status === 'done' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                 step.status === 'running' ? <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" /> :
                 <StepIcon className="w-4 h-4 text-white/30" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{step.label}</div>
                <div className="text-xs text-white/40">{step.detail}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                step.status === 'done' ? 'bg-emerald-500/15 text-emerald-400' :
                step.status === 'running' ? 'bg-cyan-500/15 text-cyan-400' :
                'bg-white/5 text-white/30'
              }`}>
                {step.status === 'done' ? 'Complete' : step.status === 'running' ? 'Executing…' : 'Queued'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Completion */}
      {allDone && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center animate-in zoom-in-95 duration-300">
          <BadgeCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-emerald-400 mb-1">Dispatch Complete</h3>
          <p className="text-sm text-white/50 mb-4">All systems updated. Crews notified. SCADA orders queued.</p>
          <div className="grid grid-cols-3 gap-4 mb-6 max-w-md mx-auto">
            <div>
              <div className="text-xs text-white/40">Cost Avoided</div>
              <div className="text-lg font-bold text-emerald-400">{scenario.outcome.costAvoided}</div>
            </div>
            <div>
              <div className="text-xs text-white/40">Customers Protected</div>
              <div className="text-lg font-bold text-blue-400">{scenario.outcome.customersProtected.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-white/40">Hours Saved</div>
              <div className="text-lg font-bold text-amber-400">{scenario.outcome.outageHoursAvoided}h</div>
            </div>
          </div>
          <button onClick={onReset} className="px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors">
            ← Analyze Another Scenario
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN GRID IQ PAGE
// ════════════════════════════════════════════════════════════════════════

function GridIQContent() {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<FlowPhase>('analysis');
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Deep-linking: if ?id=<scenario_id> is in URL, skip to impact phase
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      const match = DEMO_SCENARIOS.find(s => s.id === id);
      if (match) {
        setSelectedScenario(match);
        setAnalysisComplete(true);
        setPhase('impact');
      }
    }
  }, [searchParams]);

  const handleAnalysisComplete = useCallback(() => {
    setAnalysisComplete(true);
    setTimeout(() => setPhase('scenarios'), 300);
  }, []);

  const handleSelectScenario = (s: DemoScenario) => {
    setSelectedScenario(s);
    setPhase('impact');
  };

  const handleApprove = () => {
    setPhase('dispatch');
  };

  const handleDefer = () => {
    setSelectedScenario(null);
    setPhase('scenarios');
  };

  const handleReset = () => {
    setSelectedScenario(null);
    setAnalysisComplete(false);
    setPhase('analysis');
  };

  // Phase indicators
  const phases: { id: FlowPhase; label: string; icon: React.ReactNode }[] = [
    { id: 'analysis', label: 'Analysis', icon: <Brain className="w-3.5 h-3.5" /> },
    { id: 'scenarios', label: 'Scenarios', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'impact', label: 'Decision', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'dispatch', label: 'Dispatch', icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  const phaseOrder: FlowPhase[] = ['analysis', 'scenarios', 'impact', 'dispatch'];
  const currentPhaseIdx = phaseOrder.indexOf(phase);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-400" />
                <h1 className="text-base font-bold">Grid IQ</h1>
              </div>
              <p className="text-xs text-white/40">Multi-agent analysis → Scenarios → Decision → Dispatch</p>
            </div>
          </div>

          {/* Phase stepper */}
          <div className="hidden md:flex items-center gap-1">
            {phases.map((p, idx) => {
              const isCurrent = p.id === phase;
              const isPast = idx < currentPhaseIdx;
              return (
                <div key={p.id} className="flex items-center">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isCurrent ? 'bg-white/10 text-white' :
                    isPast ? 'text-emerald-400/60' :
                    'text-white/25'
                  }`}>
                    {isPast ? <CheckCircle className="w-3.5 h-3.5" /> : p.icon}
                    {p.label}
                  </div>
                  {idx < phases.length - 1 && (
                    <ChevronRight className={`w-3.5 h-3.5 mx-0.5 ${isPast ? 'text-emerald-400/30' : 'text-white/10'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {phase === 'analysis' && (
          <div className="max-w-6xl mx-auto">
            <BeanstalkAnalysis onComplete={handleAnalysisComplete} />
          </div>
        )}

        {phase === 'scenarios' && (
          <ScenarioSelector scenarios={DEMO_SCENARIOS} onSelect={handleSelectScenario} />
        )}

        {phase === 'impact' && selectedScenario && (
          <ImpactAnalysis
            scenario={selectedScenario}
            onApprove={handleApprove}
            onDefer={handleDefer}
            onBack={() => { setSelectedScenario(null); setPhase('scenarios'); }}
          />
        )}

        {phase === 'dispatch' && selectedScenario && (
          <DispatchPhase scenario={selectedScenario} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default function GridIQPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <GridIQContent />
    </Suspense>
  );
}



