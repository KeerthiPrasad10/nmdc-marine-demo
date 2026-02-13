// @ts-nocheck — Grid IQ: Unified Analysis Tree → Scenarios → Decision → Dispatch
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
  Shield,
  Zap,
  Users,
  Wrench,
  BadgeCheck,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { DEMO_SCENARIOS, type DemoScenario, type DecisionSupport } from '@/lib/demo-scenarios';

// ════════════════════════════════════════════════════════════════════════
// TYPES & CONFIG
// ════════════════════════════════════════════════════════════════════════

type ParamSeverity = 'normal' | 'warning' | 'critical' | 'info';

interface DetailedAgent {
  id: string;
  name: string;
  shortName: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
  dotColor: string;
  finding: string;
}

const DETAILED_AGENTS: DetailedAgent[] = [
  {
    id: 'dga', name: 'Dissolved Gas Analysis', shortName: 'DGA',
    icon: <FlaskConical className="w-3.5 h-3.5" />, color: 'text-amber-400',
    borderColor: 'border-amber-500/20', bgColor: 'bg-amber-500/[0.06]', dotColor: 'rgba(251,191,36,0.5)',
    finding: 'TDCG Condition 3 — T2 thermal fault',
  },
  {
    id: 'thermal', name: 'Thermal & Aging Model', shortName: 'Thermal',
    icon: <Thermometer className="w-3.5 h-3.5" />, color: 'text-rose-400',
    borderColor: 'border-rose-500/20', bgColor: 'bg-rose-500/[0.06]', dotColor: 'rgba(251,113,133,0.5)',
    finding: 'Hot-spot +12°C — aging 4.2× accelerated',
  },
  {
    id: 'load', name: 'Load Profile Analysis', shortName: 'Load',
    icon: <Activity className="w-3.5 h-3.5" />, color: 'text-sky-400',
    borderColor: 'border-sky-500/20', bgColor: 'bg-sky-500/[0.06]', dotColor: 'rgba(56,189,248,0.5)',
    finding: 'Peak load 94% nameplate — thermal stress',
  },
  {
    id: 'fleet', name: 'Fleet Intelligence', shortName: 'Fleet',
    icon: <Building className="w-3.5 h-3.5" />, color: 'text-blue-400',
    borderColor: 'border-blue-500/20', bgColor: 'bg-blue-500/[0.06]', dotColor: 'rgba(96,165,250,0.5)',
    finding: '67% failure probability within 24mo',
  },
  {
    id: 'oem', name: 'OEM Specifications', shortName: 'OEM',
    icon: <FileText className="w-3.5 h-3.5" />, color: 'text-cyan-400',
    borderColor: 'border-cyan-500/20', bgColor: 'bg-cyan-500/[0.06]', dotColor: 'rgba(34,211,238,0.5)',
    finding: 'Design life exceeded 3.2yr, SB-047 open',
  },
  {
    id: 'electrical', name: 'Electrical Testing', shortName: 'Elec. Test',
    icon: <Zap className="w-3.5 h-3.5" />, color: 'text-fuchsia-400',
    borderColor: 'border-fuchsia-500/20', bgColor: 'bg-fuchsia-500/[0.06]', dotColor: 'rgba(232,121,249,0.5)',
    finding: 'Power factor 1.8% — insulation breakdown',
  },
  {
    id: 'history', name: 'Work Order History', shortName: 'History',
    icon: <ClipboardList className="w-3.5 h-3.5" />, color: 'text-violet-400',
    borderColor: 'border-violet-500/20', bgColor: 'bg-violet-500/[0.06]', dotColor: 'rgba(167,139,250,0.5)',
    finding: 'Repeat BUSH-SEAL 3×/24mo, cost ↑2.2×',
  },
  {
    id: 'inspection', name: 'Field Inspection', shortName: 'Inspect',
    icon: <Eye className="w-3.5 h-3.5" />, color: 'text-emerald-400',
    borderColor: 'border-emerald-500/20', bgColor: 'bg-emerald-500/[0.06]', dotColor: 'rgba(52,211,153,0.5)',
    finding: 'Visual 4.1/10 — oil seepage B-phase',
  },
  {
    id: 'condition', name: 'Condition Monitoring', shortName: 'Condition',
    icon: <Activity className="w-3.5 h-3.5" />, color: 'text-lime-400',
    borderColor: 'border-lime-500/20', bgColor: 'bg-lime-500/[0.06]', dotColor: 'rgba(163,230,53,0.5)',
    finding: 'PD trend ↑ 340% in 6 months',
  },
];

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  aging_asset: { label: 'Aging Asset', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  dga_alert: { label: 'DGA Alert', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  avoided_outage: { label: 'Outage Prevention', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
};

// ════════════════════════════════════════════════════════════════════════
// TREE DATA — Triggers → Agents → Findings → CrossVal → Scenarios
// ════════════════════════════════════════════════════════════════════════

interface TreeTrigger {
  label: string;
  detail: string;
  color: string;
  Icon: React.ComponentType<{ className?: string }>;
}

interface TreeCluster {
  id: string;
  x: number;
  triggers: TreeTrigger[];
  agentIds: string[];
  findings: { text: string; sev: ParamSeverity }[];
  deepAnalysis: { text: string; method: string }[];
  crossVal: { label: string; detail: string; confidence: number };
  scenarioId: string;
  color: string;
}

const TREE_CLUSTERS: TreeCluster[] = [
  {
    id: 'c1', x: 18,
    triggers: [
      { label: 'DGA TDCG Spike', detail: '1,384 ppm — Cond. 3', color: 'amber', Icon: FlaskConical },
      { label: 'Thermal Alarm', detail: 'Hot-spot 112.4 °C', color: 'rose', Icon: Thermometer },
      { label: 'Load Exceedance', detail: 'Peak 94 % nameplate', color: 'sky', Icon: Activity },
    ],
    agentIds: ['dga', 'thermal', 'load'],
    findings: [
      { text: 'TDCG Cond. 3 — T2 thermal fault', sev: 'critical' },
      { text: 'Hot-spot +12 °C, aging 4.2×', sev: 'critical' },
      { text: 'Peak load 94 % — thermal stress', sev: 'warning' },
    ],
    deepAnalysis: [
      { text: 'Duval → T2 · Rogers 3.1 · TDCG 48 ppm/d', method: 'IEEE C57.104' },
      { text: 'DP = 285 · insulation 2.3 yr left', method: 'Thermal Model' },
      { text: 'LF 0.87 · 14 overloads/mo · LTC ↑', method: 'Load Analytics' },
    ],
    crossVal: { label: 'Thermal Fault Validated', detail: 'DGA T2 + hot-spot + load stress converge', confidence: 94 },
    scenarioId: 'aging-transformer',
    color: 'rose',
  },
  {
    id: 'c2', x: 50,
    triggers: [
      { label: 'Fleet Batch Alert', detail: 'GE Prolec B-1989', color: 'blue', Icon: Building },
      { label: 'OEM Bulletin Open', detail: 'SB-2019-047', color: 'cyan', Icon: FileText },
      { label: 'Elec. Test Fail', detail: 'PF 1.8 % (limit 1.0)', color: 'fuchsia', Icon: Zap },
    ],
    agentIds: ['fleet', 'oem', 'electrical'],
    findings: [
      { text: '67 % fail prob. — batch 3/8', sev: 'critical' },
      { text: 'Design life +3.2 yr · SB-047 open', sev: 'critical' },
      { text: 'PF 1.8 % — insulation breakdown', sev: 'critical' },
    ],
    deepAnalysis: [
      { text: 'Weibull β 3.2 · 3/8 batch fail', method: 'Fleet Analytics' },
      { text: 'SB-047 bushing recall · dielectric ↓', method: 'OEM Cross-Ref' },
      { text: 'Tan-δ 0.042 · C₂ +8 % · SFRA shift', method: 'Dielectric' },
    ],
    crossVal: { label: 'End-of-Life Confirmed', detail: 'Fleet defect + OEM recall + dielectric degradation', confidence: 89 },
    scenarioId: 'dga-trending-alert',
    color: 'amber',
  },
  {
    id: 'c3', x: 82,
    triggers: [
      { label: 'PM Compliance Drop', detail: 'Score 72 % (tgt 85 %)', color: 'violet', Icon: ClipboardList },
      { label: 'Visual Score 4.1', detail: 'Oil seepage B-phase', color: 'emerald', Icon: Eye },
      { label: 'PD Trend Alert', detail: '↑ 340 % in 6 months', color: 'lime', Icon: Activity },
    ],
    agentIds: ['history', 'inspection', 'condition'],
    findings: [
      { text: 'BUSH-SEAL replaced 3× / 24 mo', sev: 'critical' },
      { text: 'Visual 4.1/10 · seepage active', sev: 'critical' },
      { text: 'PD ↑ 340 % · acoustic anomaly', sev: 'warning' },
    ],
    deepAnalysis: [
      { text: 'MTBF ↓ 37 % · cost +120 % YoY', method: 'History' },
      { text: 'Corrosion C · gasket ↓ · 0.4 L/mo', method: 'Field Inspect' },
      { text: 'PD 450 pC · UHF trend · 38 dB', method: 'PD Diagnostics' },
    ],
    crossVal: { label: 'Maintenance Gap Critical', detail: 'Repeat failures + degradation + PD trending converge', confidence: 91 },
    scenarioId: 'avoided-outage',
    color: 'violet',
  },
];

const CROSS_LINKS = [
  { from: 0, to: 1, label: 'DGA ↔ Fleet batch correlation' },
  { from: 1, to: 2, label: 'OEM EoS ↔ Inspection decay' },
  { from: 0, to: 2, label: 'Load stress ↔ Condition accel.' },
];

/* ── Layout constants ── */
const A_OFF = 12;
const STAGGER = [-30, 0, 30];
const ROW = { trigger: 60, agent: 210, finding: 360, deep: 520, crossVal: 700, scenario: 840 };
const TREE_H = 960;
const VB_W = 1400;

const TRIGGER_COLORS: Record<string, string> = {
  amber: 'text-amber-400 border-amber-500/20 bg-amber-500/[0.06]',
  rose: 'text-rose-400 border-rose-500/20 bg-rose-500/[0.06]',
  blue: 'text-blue-400 border-blue-500/20 bg-blue-500/[0.06]',
  cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/[0.06]',
  violet: 'text-violet-400 border-violet-500/20 bg-violet-500/[0.06]',
  emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.06]',
  sky: 'text-sky-400 border-sky-500/20 bg-sky-500/[0.06]',
  fuchsia: 'text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-500/[0.06]',
  lime: 'text-lime-400 border-lime-500/20 bg-lime-500/[0.06]',
};

function branchX(clusterX: number, branchIdx: number, count: number): number {
  if (count === 3) return clusterX + (branchIdx - 1) * A_OFF;
  return clusterX + (branchIdx === 0 ? -A_OFF : A_OFF);
}

const CONV_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  rose: { border: 'border-rose-500/25', bg: 'bg-rose-500/[0.08]', text: 'text-rose-400' },
  amber: { border: 'border-amber-500/25', bg: 'bg-amber-500/[0.08]', text: 'text-amber-400' },
  violet: { border: 'border-violet-500/25', bg: 'bg-violet-500/[0.08]', text: 'text-violet-400' },
};

// ════════════════════════════════════════════════════════════════════════
// SVG UTILITIES
// ════════════════════════════════════════════════════════════════════════

function AnimatedPath({ d, id, visible, color = 'rgba(255,255,255,0.12)', width = 1.5, delay = 0, dash = false }: {
  d: string; id?: string; visible: boolean; color?: string; width?: number; delay?: number; dash?: boolean;
}) {
  const ref = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(400);
  useEffect(() => { if (ref.current) setLen(ref.current.getTotalLength()); }, [d]);
  if (dash) {
    return (
      <path id={id} ref={ref} d={d} fill="none" stroke={color} strokeWidth={width}
        strokeDasharray="4,4"
        style={{ transition: `opacity 600ms ease ${delay}ms`, opacity: visible ? 0.6 : 0 }} />
    );
  }
  return (
    <path id={id} ref={ref} d={d} fill="none" stroke={color} strokeWidth={width}
      strokeDasharray={len} strokeDashoffset={visible ? 0 : len}
      style={{ transition: `stroke-dashoffset 800ms ease-out ${delay}ms, stroke 300ms ease ${delay}ms` }} />
  );
}

function PulseDot({ pathId, dur = 3, delay = 0, color = 'rgba(255,255,255,0.4)' }: {
  pathId: string; dur?: number; delay?: number; color?: string;
}) {
  return (
    <circle r="2.5" fill={color} opacity="0.7">
      <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite"
        keyPoints="0;1" keyTimes="0;1" calcMode="linear">
        <mpath href={`#${pathId}`} />
      </animateMotion>
    </circle>
  );
}

// ════════════════════════════════════════════════════════════════════════
// UNIFIED TREE — triggers → agents → findings → crossval → scenarios
// ════════════════════════════════════════════════════════════════════════

function UnifiedTree() {
  const searchParams = useSearchParams();
  const [reveal, setReveal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<'pending' | 'approved' | 'deferred'>('pending');
  const deepLinked = useRef(false);

  // Deep-linking via ?id= or ?asset=
  useEffect(() => {
    const id = searchParams.get('id');
    const asset = searchParams.get('asset');
    if (id) { setReveal(6); setSelectedId(id); deepLinked.current = true; }
    else if (asset) {
      const match = DEMO_SCENARIOS.find(s => s.assetTag === asset);
      if (match) { setReveal(6); setSelectedId(match.id); deepLinked.current = true; }
    }
  }, [searchParams]);

  // Auto-animate tree growth (runs once, skipped if deep-linked)
  useEffect(() => {
    if (deepLinked.current) return;
    const t: NodeJS.Timeout[] = [];
    t.push(setTimeout(() => setReveal(1), 400));   // Triggers
    t.push(setTimeout(() => setReveal(2), 1400));   // Agents
    t.push(setTimeout(() => setReveal(3), 3000));   // Findings
    t.push(setTimeout(() => setReveal(4), 4600));   // Deep Analysis
    t.push(setTimeout(() => setReveal(5), 6200));   // Root Cause
    t.push(setTimeout(() => setReveal(6), 8000));   // Scenarios
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedScenario = selectedId ? DEMO_SCENARIOS.find(s => s.id === selectedId) || null : null;

  const handleScenarioClick = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id);
    setDecision('pending');
  }, []);

  const handleReset = useCallback(() => {
    setSelectedId(null);
    setDecision('pending');
  }, []);

  return (
    <div className="space-y-0">
      {/* ═══ Row labels ═══ */}
      <div className="relative" style={{ height: TREE_H }}>

        {/* Row label column */}
        <div className="absolute left-0 top-0 w-[70px] h-full pointer-events-none z-10">
          {[
            { y: ROW.trigger, label: 'TRIGGERS', rev: 1 },
            { y: ROW.agent, label: 'AGENTS', rev: 2 },
            { y: ROW.finding, label: 'FINDINGS', rev: 3 },
            { y: ROW.deep, label: 'DEEP ANALYSIS', rev: 4 },
            { y: ROW.crossVal, label: 'ROOT CAUSE', rev: 5 },
            { y: ROW.scenario, label: 'SCENARIOS', rev: 6 },
          ].map((r, i) => (
            <div key={i} className={`absolute text-[9px] font-bold uppercase tracking-widest text-white/35 transition-opacity duration-500 ${reveal >= r.rev ? 'opacity-100' : 'opacity-0'}`}
              style={{ top: r.y - 2, left: 0, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              {r.label}
            </div>
          ))}
        </div>

        {/* ═══ SVG CONNECTION LAYER ═══ */}
        <svg className="absolute inset-0 w-full pointer-events-none" style={{ height: TREE_H }} viewBox={`0 0 ${VB_W} ${TREE_H}`} preserveAspectRatio="none">

          {/* Per-cluster vertical connections (3 branches each) */}
          {TREE_CLUSTERS.map((cluster, ci) => {
            const cx = cluster.x * (VB_W / 100);
            const branchCount = cluster.agentIds.length;

            return (
              <g key={cluster.id}>
                {cluster.agentIds.map((agentId, bi) => {
                  const bx = branchX(cluster.x, bi, branchCount) * (VB_W / 100);
                  const st = STAGGER[bi] || 0;
                  const agent = DETAILED_AGENTS.find(a => a.id === agentId);
                  const convId = `conv-${cluster.id}-${bi}`;

                  return (
                    <g key={`${cluster.id}-${bi}`}>
                      {/* Trigger → Agent (trigger bottom ≈ +14+st, agent top ≈ -16) */}
                      <AnimatedPath d={`M ${bx},${ROW.trigger + 14 + st} C ${bx},${ROW.trigger + 40 + st} ${bx},${ROW.agent - 40} ${bx},${ROW.agent - 16}`} visible={reveal >= 2} delay={ci * 120 + bi * 60} color="rgba(255,255,255,0.35)" width={1.5} />

                      {/* Agent → Finding (agent bottom ≈ +28, finding top ≈ -10+st) */}
                      <AnimatedPath d={`M ${bx},${ROW.agent + 28} C ${bx},${ROW.agent + 60} ${bx},${ROW.finding - 35 + st} ${bx},${ROW.finding - 10 + st}`} visible={reveal >= 3} delay={ci * 150 + bi * 60} color="rgba(255,255,255,0.35)" width={1.5} />

                      {/* Finding → Deep (finding bottom ≈ +22+st, deep top ≈ -14+st) */}
                      <AnimatedPath d={`M ${bx},${ROW.finding + 22 + st} L ${bx},${ROW.deep - 14 + st}`} visible={reveal >= 4} delay={ci * 150 + bi * 80} color={agent?.dotColor || 'rgba(255,255,255,0.2)'} width={2} />

                      {/* Deep → Root Cause (deep bottom ≈ +28+st, root top ≈ -18) */}
                      <AnimatedPath
                        id={convId}
                        d={`M ${bx},${ROW.deep + 28 + st} C ${bx},${ROW.deep + 60 + st} ${cx},${ROW.crossVal - 50} ${cx},${ROW.crossVal - 18}`}
                        visible={reveal >= 5} delay={ci * 200 + bi * 100}
                        color={agent?.dotColor} width={2.5}
                      />

                      {/* Pulse dots on convergence */}
                      {reveal >= 5 && (
                        <PulseDot pathId={convId} dur={2.5} delay={ci * 0.3 + bi * 0.3} color={agent?.dotColor || 'rgba(255,255,255,0.3)'} />
                      )}
                    </g>
                  );
                })}

                {/* Root Cause → Scenario (root bottom ≈ +44, scenario top ≈ -20) */}
                <AnimatedPath d={`M ${cx},${ROW.crossVal + 44} L ${cx},${ROW.scenario - 20}`} visible={reveal >= 6} delay={ci * 150} color="rgba(255,255,255,0.4)" width={2} />

                {/* Selected expansion connector */}
                {selectedId === cluster.scenarioId && (
                  <line x1={cx} y1={ROW.scenario + 46} x2={cx} y2={TREE_H}
                    stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeDasharray="4,4" />
                )}
              </g>
            );
          })}

          {/* Cross-cluster interlinks — connect rightmost branch of 'from' to leftmost branch of 'to' at their staggered deep-analysis Y */}
          {CROSS_LINKS.map((link, li) => {
            const fromC = TREE_CLUSTERS[link.from];
            const toC = TREE_CLUSTERS[link.to];
            const fromBx = branchX(fromC.x, 2, 3) * (VB_W / 100);
            const toBx = branchX(toC.x, 0, 3) * (VB_W / 100);
            const fromY = ROW.deep + 6 + STAGGER[2];
            const toY = ROW.deep + 6 + STAGGER[0];
            const midX = (fromBx + toBx) / 2;
            const midY = Math.min(fromY, toY) - (li === 2 ? 55 : 45);
            const pathId = `xlink-${li}`;
            return (
              <g key={pathId}>
                <AnimatedPath
                  id={pathId}
                  d={`M ${fromBx},${fromY} C ${midX},${midY} ${midX},${midY} ${toBx},${toY}`}
                  visible={reveal >= 5} delay={600 + li * 300}
                  color="rgba(255,255,255,0.22)" width={1.5} dash
                />
                {reveal >= 5 && (
                  <PulseDot pathId={pathId} dur={4} delay={1 + li * 0.5} color="rgba(255,255,255,0.4)" />
                )}
                <text x={midX} y={midY + 12} fill="rgba(255,255,255,0.35)" fontSize="9"
                  textAnchor="middle" fontFamily="monospace"
                  className={`transition-opacity duration-500 ${reveal >= 5 ? 'opacity-100' : 'opacity-0'}`}
                  style={{ transitionDelay: `${900 + li * 300}ms` }}>
                  {link.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* ═══ HTML NODE LAYERS ═══ */}

        {/* Layer 1: TRIGGERS (staggered vertically) */}
        {TREE_CLUSTERS.map((cluster, ci) =>
          cluster.triggers.map((trigger, ti) => {
            const x = branchX(cluster.x, ti, cluster.triggers.length);
            const st = STAGGER[ti] || 0;
            const TIcon = trigger.Icon;
            return (
              <div key={`t-${ci}-${ti}`}
                className={`absolute -translate-x-1/2 transition-all duration-500 ${reveal >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                style={{ left: `${x}%`, top: ROW.trigger - 18 + st, transitionDelay: `${ci * 150 + ti * 80}ms` }}>
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border max-w-[155px] ${TRIGGER_COLORS[trigger.color]}`}>
                  <TIcon className="w-3 h-3 flex-shrink-0" />
                  <div className="min-w-0 overflow-hidden">
                    <div className="text-[10px] font-bold leading-tight truncate">{trigger.label}</div>
                    <div className="text-[9px] text-white/55 truncate">{trigger.detail}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Layer 2: AGENTS (centered, no stagger) */}
        {TREE_CLUSTERS.map((cluster, ci) =>
          cluster.agentIds.map((agentId, ai) => {
            const agent = DETAILED_AGENTS.find(a => a.id === agentId)!;
            const x = branchX(cluster.x, ai, cluster.agentIds.length);
            return (
              <div key={`a-${ci}-${ai}`}
                className={`absolute -translate-x-1/2 transition-all duration-500 ${reveal >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                style={{ left: `${x}%`, top: ROW.agent - 16, transitionDelay: `${ci * 150 + ai * 80}ms` }}>
                <div className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded border ${agent.borderColor} ${agent.bgColor}`}>
                  <span className={agent.color}>{agent.icon}</span>
                  <span className={`text-[10px] font-bold ${agent.color}`}>{agent.shortName}</span>
                  <span className={`text-[8px] font-mono transition-colors duration-500 ${reveal >= 3 ? 'text-emerald-400' : 'text-white/30'}`}>
                    {reveal >= 3 ? '✓ done' : '⟳'}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Layer 3: FINDINGS (staggered) */}
        {TREE_CLUSTERS.map((cluster, ci) =>
          cluster.findings.map((finding, fi) => {
            const x = branchX(cluster.x, fi, cluster.findings.length);
            const st = STAGGER[fi] || 0;
            const isCrit = finding.sev === 'critical';
            return (
              <div key={`f-${ci}-${fi}`}
                className={`absolute -translate-x-1/2 transition-all duration-400 ${reveal >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                style={{ left: `${x}%`, top: ROW.finding - 10 + st, transitionDelay: `${ci * 200 + fi * 100}ms` }}>
                <div className={`text-[9px] font-mono font-semibold px-2 py-1 rounded border w-[135px] leading-snug overflow-hidden ${
                  isCrit ? 'border-rose-500/30 bg-rose-500/[0.10] text-rose-300' : 'border-amber-500/30 bg-amber-500/[0.10] text-amber-300'
                }`}>
                  <span className="line-clamp-2">{finding.text}</span>
                </div>
              </div>
            );
          })
        )}

        {/* Layer 4: DEEP ANALYSIS (staggered) */}
        {TREE_CLUSTERS.map((cluster, ci) =>
          cluster.deepAnalysis.map((da, di) => {
            const x = branchX(cluster.x, di, cluster.deepAnalysis.length);
            const st = STAGGER[di] || 0;
            const agent = DETAILED_AGENTS.find(a => a.id === cluster.agentIds[di]);
            return (
              <div key={`d-${ci}-${di}`}
                className={`absolute -translate-x-1/2 transition-all duration-500 ${reveal >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                style={{ left: `${x}%`, top: ROW.deep - 14 + st, transitionDelay: `${ci * 200 + di * 120}ms` }}>
                <div className={`w-[130px] px-2 py-1.5 rounded border overflow-hidden ${agent?.borderColor || 'border-white/10'} ${agent?.bgColor || 'bg-white/[0.03]'}`}>
                  <div className={`text-[8px] font-bold uppercase tracking-wider ${agent?.color || 'text-white/50'} mb-0.5 truncate`}>{da.method}</div>
                  <div className="text-[9px] text-white/70 leading-snug line-clamp-2">{da.text}</div>
                </div>
              </div>
            );
          })
        )}

        {/* Layer 5: CROSS-VALIDATION / ROOT CAUSE */}
        {TREE_CLUSTERS.map((cluster, ci) => {
          const cc = CONV_COLORS[cluster.color];
          return (
            <div key={`cv-${ci}`}
              className={`absolute -translate-x-1/2 transition-all duration-500 ${reveal >= 5 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
              style={{ left: `${cluster.x}%`, top: ROW.crossVal - 18, transitionDelay: `${ci * 250}ms` }}>
              <div className={`flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg border-2 max-w-[200px] ${cc.border} ${cc.bg}`}>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] uppercase tracking-wider font-bold ${cc.text}`}>✓ Root Cause</span>
                  <span className={`text-[10px] font-mono font-bold ${cc.text}`}>{cluster.crossVal.confidence}%</span>
                </div>
                <span className="text-[11px] font-bold text-white/90 text-center leading-tight">{cluster.crossVal.label}</span>
                <span className="text-[9px] text-white/55 text-center leading-snug">{cluster.crossVal.detail}</span>
              </div>
            </div>
          );
        })}

        {/* Layer 6: SCENARIOS (clickable convergence points) */}
        {TREE_CLUSTERS.map((cluster, ci) => {
          const scenario = DEMO_SCENARIOS.find(s => s.id === cluster.scenarioId);
          if (!scenario) return null;
          const config = CATEGORY_CONFIG[scenario.category];
          const isSelected = selectedId === cluster.scenarioId;
          return (
            <div key={`s-${ci}`}
              className={`absolute -translate-x-1/2 transition-all duration-500 ${reveal >= 6 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
              style={{ left: `${cluster.x}%`, top: ROW.scenario - 20, transitionDelay: `${ci * 200}ms` }}>
              <button
                onClick={() => handleScenarioClick(cluster.scenarioId)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer max-w-[170px] ${
                  isSelected
                    ? `${config.border} ${config.bg} ring-1 ring-white/10 shadow-lg shadow-white/5`
                    : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15'
                }`}>
                <span className={`text-[9px] uppercase tracking-wider font-bold ${config.color}`}>{config.label}</span>
                <span className="text-[11px] font-bold text-white/90 text-center leading-tight">{scenario.title}</span>
                <div className="flex items-center gap-1.5 text-[9px] text-white/50">
                  <span>{scenario.outcome.costAvoided}</span>
                  <span className="text-white/20">•</span>
                  <span>{scenario.outcome.customersProtected.toLocaleString()} cust.</span>
                </div>
                <span className={`text-[9px] font-medium ${isSelected ? 'text-amber-400' : 'text-white/35'}`}>
                  {isSelected ? '▼ Expanded' : '▶ Investigate'}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* ═══ SCENARIO EXPANSION (below tree) ═══ */}
      {selectedScenario && (
        <ScenarioExpansion
          scenario={selectedScenario}
          decision={decision}
          onApprove={() => setDecision('approved')}
          onDefer={() => setDecision('deferred')}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SCENARIO EXPANSION — branches into Decision → Dispatch sub-tree
// ════════════════════════════════════════════════════════════════════════

function ScenarioExpansion({ scenario, decision, onApprove, onDefer, onReset }: {
  scenario: DemoScenario;
  decision: 'pending' | 'approved' | 'deferred';
  onApprove: () => void;
  onDefer: () => void;
  onReset: () => void;
}) {
  const config = CATEGORY_CONFIG[scenario.category];

  return (
    <div className="max-w-3xl mx-auto px-4 pb-12 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Connector line from tree */}
      <div className="flex justify-center py-2">
        <div className="w-px h-6 bg-white/10" />
      </div>

      {/* Scenario brief card */}
      <div className={`rounded-xl border ${config.border} bg-white/[0.02] p-5 mb-4`}>
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-white">{scenario.title}</h3>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${config.bg} ${config.color}`}>{scenario.severity}</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">{scenario.description}</p>
          </div>
        </div>

        {/* Impact metrics strip */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10 p-2.5 text-center">
            <div className="text-[9px] text-white/35">Cost Avoided</div>
            <div className="text-sm font-bold text-emerald-400">{scenario.outcome.costAvoided}</div>
          </div>
          <div className="rounded-lg bg-blue-500/[0.04] border border-blue-500/10 p-2.5 text-center">
            <div className="text-[9px] text-white/35">Customers</div>
            <div className="text-sm font-bold text-blue-400">{scenario.outcome.customersProtected.toLocaleString()}</div>
          </div>
          <div className="rounded-lg bg-amber-500/[0.04] border border-amber-500/10 p-2.5 text-center">
            <div className="text-[9px] text-white/35">Hours Saved</div>
            <div className="text-sm font-bold text-amber-400">{scenario.outcome.outageHoursAvoided}h</div>
          </div>
        </div>
      </div>

      {/* ── Branch: Decision (pending) ── */}
      {decision === 'pending' && (
        <>
          <div className="flex justify-center py-1">
            <div className="w-px h-4 bg-white/10" />
          </div>
          <DecisionPanel
            decisionSupport={scenario.decisionSupport}
            onApprove={onApprove}
            onDefer={onDefer}
          />
        </>
      )}

      {/* ── Branch: Dispatch (approved) ── */}
      {decision === 'approved' && (
        <>
          <div className="flex justify-center py-1">
            <div className="w-px h-4 bg-emerald-500/20" />
          </div>
          <InlineDispatch scenario={scenario} onReset={onReset} />
        </>
      )}

      {/* ── Branch: Deferred ── */}
      {decision === 'deferred' && (
        <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-5 text-center mt-4">
          <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-amber-400 mb-1">Deferred to Watch List</h4>
          <p className="text-xs text-white/40 mb-3">Asset will be re-evaluated at next monitoring cycle.</p>
          <button onClick={onReset} className="text-xs text-white/40 hover:text-white/60 transition-colors">← Back to analysis</button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// DECISION PANEL — Approve / Defer with full impact analysis
// ════════════════════════════════════════════════════════════════════════

function DecisionPanel({ decisionSupport, onApprove, onDefer }: {
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
// INLINE DISPATCH — execution steps after approval
// ════════════════════════════════════════════════════════════════════════

function InlineDispatch({ scenario, onReset }: { scenario: DemoScenario; onReset: () => void }) {
  const [steps, setSteps] = useState([
    { id: 'wo', label: 'Generate Work Order', detail: `WO-${scenario.assetTag.slice(-3)}-GIQ`, status: 'pending' as 'pending' | 'running' | 'done', icon: ClipboardList },
    { id: 'crew', label: 'Dispatch Crew Notification', detail: `${scenario.opCo} field operations notified`, status: 'pending' as 'pending' | 'running' | 'done', icon: Users },
    { id: 'scada', label: 'SCADA Switching Order', detail: 'Automated load transfer prepared', status: 'pending' as 'pending' | 'running' | 'done', icon: Zap },
    { id: 'parts', label: 'Parts Reserved', detail: 'Spare components from inventory', status: 'pending' as 'pending' | 'running' | 'done', icon: Wrench },
    { id: 'schedule', label: 'Schedule Updated', detail: 'Gantt chart adjusted, stakeholders notified', status: 'pending' as 'pending' | 'running' | 'done', icon: Calendar },
  ]);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    steps.forEach((_, idx) => {
      setTimeout(() => {
        setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'running' } : s));
      }, idx * 800);
      setTimeout(() => {
        setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'done' } : s));
      }, idx * 800 + 600);
    });
    setTimeout(() => setAllDone(true), steps.length * 800 + 600);
  }, []);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-white">Dispatch & Execution</span>
        <span className="text-[10px] text-white/30">— {scenario.title}</span>
      </div>

      <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          return (
            <div key={step.id} className={`flex items-center gap-3 px-4 py-3 ${idx < steps.length - 1 ? 'border-b border-white/5' : ''} ${
              step.status === 'running' ? 'bg-cyan-500/[0.04]' : step.status === 'done' ? 'bg-emerald-500/[0.02]' : ''
            } transition-all duration-500`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                step.status === 'done' ? 'bg-emerald-500/20' : step.status === 'running' ? 'bg-cyan-500/20' : 'bg-white/5'
              }`}>
                {step.status === 'done' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> :
                 step.status === 'running' ? <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" /> :
                 <StepIcon className="w-3.5 h-3.5 text-white/30" />}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-white">{step.label}</div>
                <div className="text-[10px] text-white/40">{step.detail}</div>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                step.status === 'done' ? 'bg-emerald-500/15 text-emerald-400' :
                step.status === 'running' ? 'bg-cyan-500/15 text-cyan-400' :
                'bg-white/5 text-white/30'
              }`}>
                {step.status === 'done' ? '✓' : step.status === 'running' ? '⟳' : '○'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Completion card */}
      {allDone && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center animate-in zoom-in-95 duration-300">
          <BadgeCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-emerald-400 mb-1">Dispatch Complete</h4>
          <p className="text-xs text-white/40 mb-3">All systems updated. Crews notified. SCADA orders queued.</p>
          <div className="grid grid-cols-3 gap-3 mb-4 max-w-sm mx-auto">
            <div>
              <div className="text-[10px] text-white/35">Cost Avoided</div>
              <div className="text-sm font-bold text-emerald-400">{scenario.outcome.costAvoided}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/35">Customers</div>
              <div className="text-sm font-bold text-blue-400">{scenario.outcome.customersProtected.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/35">Hours Saved</div>
              <div className="text-sm font-bold text-amber-400">{scenario.outcome.outageHoursAvoided}h</div>
            </div>
          </div>
          <button onClick={onReset} className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors">
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
  return (
    <div className="min-h-screen bg-black text-white">
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
              <p className="text-xs text-white/40">Triggers → Agents → Findings → Deep Analysis → Root Cause → Scenario → Decision → Dispatch</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 overflow-x-auto">
        <div className="min-w-[1400px] max-w-[1600px] mx-auto">
          <UnifiedTree />
        </div>
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
