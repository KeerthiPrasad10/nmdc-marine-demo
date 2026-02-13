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

interface AgentNode {
  id: string;
  name: string;
  shortName: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
  thinkingMessages: string[];
  finding: string;
}

type AgentStatus = 'queued' | 'thinking' | 'complete';

const ANALYSIS_AGENTS: AgentNode[] = [
  {
    id: 'dga', name: 'DGA Analysis Agent', shortName: 'DGA',
    icon: <FlaskConical className="w-4 h-4" />, color: 'text-amber-400',
    borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/10',
    thinkingMessages: ['Reading dissolved gas concentrations…', 'Computing Duval Triangle classification…', 'Evaluating Rogers Ratio patterns…', 'Mapping to IEEE C57.104 thresholds…'],
    finding: 'TDCG trending above Condition 2 threshold',
  },
  {
    id: 'thermal', name: 'Thermal Modeling Agent', shortName: 'Thermal',
    icon: <Thermometer className="w-4 h-4" />, color: 'text-rose-400',
    borderColor: 'border-rose-500/30', bgColor: 'bg-rose-500/10',
    thinkingMessages: ['Analyzing winding hot-spot temperatures…', 'Running IEEE C57.91 aging model…', 'Correlating ambient vs load profile…', 'Estimating insulation DP degradation…'],
    finding: 'Hot-spot 12°C above design limit at peak load',
  },
  {
    id: 'fleet', name: 'Fleet Intelligence Agent', shortName: 'Fleet',
    icon: <Building className="w-4 h-4" />, color: 'text-blue-400',
    borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/10',
    thinkingMessages: ['Querying similar assets across fleet…', 'Matching failure patterns by vintage…', 'Cross-referencing manufacturer batch…', 'Computing fleet-wide failure probability…'],
    finding: '3 similar units failed within 18 months of this profile',
  },
  {
    id: 'oem', name: 'OEM Specs Agent', shortName: 'OEM',
    icon: <FileText className="w-4 h-4" />, color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30', bgColor: 'bg-cyan-500/10',
    thinkingMessages: ['Loading manufacturer service bulletins…', 'Checking design-life parameters…', 'Evaluating overhaul intervals…', 'Reviewing known failure modes…'],
    finding: 'Operating beyond OEM recommended service life',
  },
  {
    id: 'history', name: 'Work Order History Agent', shortName: 'History',
    icon: <ClipboardList className="w-4 h-4" />, color: 'text-violet-400',
    borderColor: 'border-violet-500/30', bgColor: 'bg-violet-500/10',
    thinkingMessages: ['Scanning corrective maintenance records…', 'Analyzing PM compliance gaps…', 'Correlating repeat failure modes…', 'Evaluating repair effectiveness…'],
    finding: 'Repeat bushing repairs — 3 CMs in 24 months',
  },
  {
    id: 'inspection', name: 'Inspection Records Agent', shortName: 'Inspect',
    icon: <Eye className="w-4 h-4" />, color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/10',
    thinkingMessages: ['Reviewing latest field inspection notes…', 'Flagging condition deterioration trends…', 'Correlating visual findings with DGA…', 'Checking environmental exposure factors…'],
    finding: 'Oil seepage noted at bushing gasket — progressive',
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
// PHASE 1 — Beanstalk Orchestration
// ════════════════════════════════════════════════════════════════════════

function BeanstalkAnalysis({ onComplete }: { onComplete: () => void }) {
  const [agentStates, setAgentStates] = useState<Record<string, { status: AgentStatus; messageIdx: number }>>({});
  const [synthStatus, setSynthStatus] = useState<'waiting' | 'synthesizing' | 'complete'>('waiting');
  const timerRefs = useRef<NodeJS.Timeout[]>([]);
  const completeFired = useRef(false);

  useEffect(() => {
    const initial: Record<string, { status: AgentStatus; messageIdx: number }> = {};
    ANALYSIS_AGENTS.forEach(a => { initial[a.id] = { status: 'queued', messageIdx: 0 }; });
    setAgentStates(initial);
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    completeFired.current = false;

    const startAgent = (agent: AgentNode, delay: number) => {
      timerRefs.current.push(setTimeout(() => {
        setAgentStates(prev => ({ ...prev, [agent.id]: { status: 'thinking', messageIdx: 0 } }));
      }, delay));
      agent.thinkingMessages.forEach((_, mIdx) => {
        if (mIdx === 0) return;
        timerRefs.current.push(setTimeout(() => {
          setAgentStates(prev => ({ ...prev, [agent.id]: { status: 'thinking', messageIdx: mIdx } }));
        }, delay + mIdx * 400));
      });
      const completeDelay = delay + agent.thinkingMessages.length * 400 + 150;
      timerRefs.current.push(setTimeout(() => {
        setAgentStates(prev => ({ ...prev, [agent.id]: { status: 'complete', messageIdx: agent.thinkingMessages.length - 1 } }));
      }, completeDelay));
    };

    ANALYSIS_AGENTS.forEach((a, i) => startAgent(a, 200 + i * 300));

    const maxAgentTime = 200 + 5 * 300 + 4 * 400 + 150;
    timerRefs.current.push(setTimeout(() => setSynthStatus('synthesizing'), maxAgentTime + 300));
    timerRefs.current.push(setTimeout(() => {
      setSynthStatus('complete');
    }, maxAgentTime + 1200));
    timerRefs.current.push(setTimeout(() => {
      if (!completeFired.current) {
        completeFired.current = true;
        onComplete();
      }
    }, maxAgentTime + 2000));

    return () => timerRefs.current.forEach(clearTimeout);
  }, [onComplete]);

  const allDone = synthStatus === 'complete';
  const stemColor = !allDone ? 'bg-violet-500/25' : 'bg-emerald-500/15';

  return (
    <div className="relative py-2">
      {/* Orchestrator */}
      <div className="flex justify-center mb-0">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500 ${
          !allDone ? 'bg-violet-500/10 border-violet-500/25 shadow-md shadow-violet-500/10' : 'bg-emerald-500/[0.06] border-emerald-500/20'
        }`}>
          <Brain className={`w-4 h-4 transition-colors duration-500 ${!allDone ? 'text-violet-400' : 'text-emerald-400/70'}`} />
          <span className="text-[11px] font-semibold text-white/50">GridIQ Orchestrator</span>
          {!allDone && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />}
          {allDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-400/60" />}
        </div>
      </div>

      {/* Vertical Stem + Branches */}
      <div className="relative ml-[50%]">
        <div className={`absolute left-0 top-0 bottom-0 w-px ${stemColor} transition-all duration-500`} />

        {ANALYSIS_AGENTS.map((agent, i) => {
          const state = agentStates[agent.id] || { status: 'queued', messageIdx: 0 };
          const isThinking = state.status === 'thinking';
          const isDone = state.status === 'complete';
          const isLeft = i % 2 === 0;
          const branchColor = isThinking ? agent.borderColor.replace('border-', 'bg-') : isDone ? 'bg-emerald-500/20' : 'bg-white/[0.06]';

          return (
            <div key={agent.id} className="relative" style={{ height: 68 }}>
              <div className={`absolute top-[34px] h-px transition-all duration-500 ${branchColor}`}
                style={isLeft ? { right: '0', width: '40px', left: 'auto', transform: 'translateX(-1px)' } : { left: '1px', width: '40px' }}
              />
              {isThinking && (
                <div className="absolute top-[32px] w-2 h-2 rounded-full"
                  style={{
                    ...(isLeft ? { right: '0', animation: 'pulseLeft 1.2s ease-in-out infinite' } : { left: '1px', animation: 'pulseRight 1.2s ease-in-out infinite' }),
                    background: agent.color.includes('amber') ? 'rgba(251,191,36,0.6)' :
                      agent.color.includes('rose') ? 'rgba(251,113,133,0.6)' :
                      agent.color.includes('blue') ? 'rgba(96,165,250,0.6)' :
                      agent.color.includes('cyan') ? 'rgba(34,211,238,0.6)' :
                      agent.color.includes('violet') ? 'rgba(167,139,250,0.6)' : 'rgba(52,211,153,0.6)',
                  }}
                />
              )}
              <div className={`absolute top-[31px] left-0 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 transition-all duration-500 ${
                isThinking ? `${agent.borderColor} ${agent.bgColor}` : isDone ? 'border-emerald-500/40 bg-emerald-500/25' : 'border-white/10 bg-white/[0.04]'
              }`} />
              <div className={`absolute top-[10px] transition-all duration-500 ${isLeft ? 'right-[calc(50%+52px)]' : 'left-[52px]'}`} style={{ width: 'calc(50% - 64px)' }}>
                <div className={`p-2.5 rounded-lg border transition-all duration-500 ${
                  isThinking ? `${agent.bgColor} ${agent.borderColor}` : isDone ? 'bg-emerald-500/[0.03] border-emerald-500/15' : 'bg-white/[0.015] border-white/[0.06]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`flex-shrink-0 transition-colors ${isThinking ? agent.color : isDone ? 'text-emerald-400/60' : 'text-white/15'}`}>
                      {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : agent.icon}
                    </span>
                    <span className={`text-[11px] font-medium truncate ${isThinking ? 'text-white/70' : isDone ? 'text-white/45' : 'text-white/20'}`}>
                      {agent.shortName}
                    </span>
                    {isThinking && <span className={`ml-auto w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0 ${agent.bgColor.replace('/10', '/50')}`} />}
                  </div>
                  <p className={`text-[10px] mt-1 leading-snug line-clamp-1 ${isThinking ? 'text-white/35' : isDone ? 'text-emerald-400/35' : 'text-white/10'}`}>
                    {isThinking ? agent.thinkingMessages[state.messageIdx] : isDone ? `→ ${agent.finding}` : 'Waiting…'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Synthesis node */}
        <div className="relative" style={{ height: 48 }}>
          <div className={`absolute top-[24px] left-0 -translate-x-1/2 w-3 h-3 rounded-full border-2 transition-all duration-500 ${
            synthStatus === 'synthesizing' ? 'border-cyan-500/50 bg-cyan-500/30 animate-pulse' : allDone ? 'border-emerald-500/40 bg-emerald-500/30' : 'border-white/10 bg-white/[0.04]'
          }`} />
        </div>
      </div>

      {/* Synthesis label */}
      <div className="flex justify-center mt-0">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500 ${
          synthStatus === 'synthesizing' ? 'bg-cyan-500/10 border-cyan-500/25 shadow-md shadow-cyan-500/10' : allDone ? 'bg-emerald-500/[0.06] border-emerald-500/20' : 'bg-white/[0.02] border-white/[0.06]'
        }`}>
          {allDone ? <CheckCircle className="w-4 h-4 text-emerald-400/60" /> :
           synthStatus === 'synthesizing' ? <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" /> :
           <Sparkles className="w-4 h-4 text-white/20" />}
          <span className={`text-[11px] font-semibold ${synthStatus === 'synthesizing' ? 'text-cyan-400/60' : allDone ? 'text-emerald-400/50' : 'text-white/20'}`}>
            {synthStatus === 'synthesizing' ? 'Synthesizing findings…' : allDone ? 'Analysis complete — 3 scenarios identified' : 'Synthesis Engine'}
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulseLeft { 0% { transform: translateX(0); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateX(-38px); opacity: 0; } }
        @keyframes pulseRight { 0% { transform: translateX(0); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateX(38px); opacity: 0; } }
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
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-white mb-1">Multi-Agent Fleet Analysis</h2>
              <p className="text-sm text-white/40">6 specialized AI agents analyzing your grid fleet in parallel</p>
            </div>
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

