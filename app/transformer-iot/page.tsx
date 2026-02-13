// @ts-nocheck — Transformer IoT real-time monitoring dashboard
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Activity,
  Gauge,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  Shield,
  Eye,
  Play,
  RefreshCw,
  ChevronRight,
  Thermometer,
  BarChart3,
  Brain,
  Timer,
  Droplets,
  Wind,
  FlaskConical,
  BellRing,
  TrendingDown,
} from 'lucide-react';
import {
  TransformerSensor,
  LoadEvent,
  AlarmEvent,
  DGAReading,
  TransformerAsset,
} from '@/lib/transformer-iot/types';
import {
  generateTransformerAsset,
  generateRecentLoadEvents,
  generateAlarmEvents,
  generateDGAHistory,
  updateSensorValue,
} from '@/lib/transformer-iot/mock-data';
import { Building, FileText, ClipboardList, ExternalLink } from 'lucide-react';
import { getScenarioForAsset, type DemoScenario, type ScenarioEvent, type DecisionOption, type DecisionSupport } from '@/lib/demo-scenarios';

// ──────────────────── Decision Brief Panel ────────────────────────────
function DecisionBrief({
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
    <div className="mt-3 rounded-lg bg-white/[0.03] border border-amber-500/15 overflow-hidden" onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400/50" />
            <span className="text-xs font-semibold text-amber-400/60">Operator Decision Required</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${urg.color}`}>{urg.text}</span>
            <span className="text-[10px] text-white/30 flex items-center gap-1">
              <Brain className="w-3 h-3" /> {decisionSupport.confidenceScore}% confidence
            </span>
          </div>
        </div>
        <p className="text-xs text-white/50 leading-relaxed">{decisionSupport.summary}</p>
      </div>

      {/* Key Risks Banner */}
      <div className="px-3 py-2 bg-rose-500/[0.03] border-b border-white/[0.06]">
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

      {/* Tab Selector */}
      <div className="flex border-b border-white/[0.06]">
        <button
          onClick={() => setSelectedTab('approve')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-all ${
            selectedTab === 'approve'
              ? 'text-emerald-400/70 border-b-2 border-emerald-400/50 bg-emerald-500/[0.04]'
              : 'text-white/35 hover:text-white/50'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> {decisionSupport.approveOption.label}
          </span>
        </button>
        <button
          onClick={() => setSelectedTab('defer')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-all ${
            selectedTab === 'defer'
              ? 'text-amber-400/70 border-b-2 border-amber-400/50 bg-amber-500/[0.04]'
              : 'text-white/35 hover:text-white/50'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {decisionSupport.deferOption.label}
          </span>
        </button>
      </div>

      {/* Selected Option Details */}
      <div className="px-3 py-3 space-y-3">
        <p className="text-xs text-white/50">{option.description}</p>

        {/* Impact Strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`p-2 rounded-lg text-center ${
            option.financialImpact.trend === 'positive' ? 'bg-emerald-500/[0.06] border border-emerald-500/10' :
            'bg-rose-500/[0.06] border border-rose-500/10'
          }`}>
            <div className="text-[10px] text-white/35">{option.financialImpact.label}</div>
            <div className={`text-sm font-bold ${
              option.financialImpact.trend === 'positive' ? 'text-emerald-400/70' : 'text-rose-400/70'
            }`}>{option.financialImpact.value}</div>
          </div>
          <div className={`p-2 rounded-lg text-center ${riskColors[option.riskLevel]}`}>
            <div className="text-[10px] text-white/35">Risk Level</div>
            <div className="text-sm font-bold capitalize">{option.riskLevel}</div>
          </div>
          <div className="p-2 rounded-lg text-center bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[10px] text-white/35">Timeline</div>
            <div className="text-[11px] font-medium text-white/60 leading-tight">{option.timeline}</div>
          </div>
        </div>

        {/* Customer Impact */}
        <div className="p-2 rounded-lg bg-blue-500/[0.04] border border-blue-500/10 flex items-start gap-2">
          <Eye className="w-3.5 h-3.5 text-blue-400/50 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] text-blue-400/50 font-medium">Customer Impact</div>
            <div className="text-xs text-white/50">{option.customerImpact}</div>
          </div>
        </div>

        {/* Pros & Cons */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] font-semibold text-emerald-400/50 uppercase tracking-wider mb-1.5">Value</div>
            <div className="space-y-1">
              {option.pros.map((pro, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-white/45">
                  <CheckCircle className="w-3 h-3 text-emerald-400/40 flex-shrink-0 mt-0.5" />
                  {pro}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-rose-400/50 uppercase tracking-wider mb-1.5">Trade-offs</div>
            <div className="space-y-1">
              {option.cons.map((con, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-white/45">
                  <TrendingDown className="w-3 h-3 text-rose-400/40 flex-shrink-0 mt-0.5" />
                  {con}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-3 pb-3 flex items-center gap-2">
        <button
          onClick={onApprove}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-400/70 text-xs font-semibold hover:bg-emerald-500/25 transition-all"
        >
          <CheckCircle className="w-3.5 h-3.5" /> Approve &amp; Execute
        </button>
        <button
          onClick={onDefer}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 text-xs font-semibold hover:bg-white/[0.08] transition-all"
        >
          <Clock className="w-3.5 h-3.5" /> Defer for Review
        </button>
      </div>
    </div>
  );
}

// ──────────────────── Scenario Investigation Panel ────────────────────
function ScenarioInvestigation({ scenario }: { scenario: DemoScenario }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const [approved, setApproved] = useState(false);
  const totalSteps = scenario.timeline.length;

  const recommendationIndex = scenario.timeline.findIndex(e => e.type === 'recommendation');

  useEffect(() => {
    if (!isPlaying) return;
    if (activeStep >= totalSteps - 1) {
      setShowOutcome(true);
      setIsPlaying(false);
      return;
    }
    const currentEvent = activeStep >= 0 ? scenario.timeline[activeStep] : null;
    if (currentEvent?.type === 'recommendation' && !approved) {
      const pauseTimer = setTimeout(() => {
        setIsPlaying(false);
        setAwaitingApproval(true);
      }, 1200);
      return () => clearTimeout(pauseTimer);
    }
    const delay = activeStep === -1 ? 600 : 2800;
    const timer = setTimeout(() => setActiveStep(prev => prev + 1), delay);
    return () => clearTimeout(timer);
  }, [isPlaying, activeStep, totalSteps, approved, scenario.timeline]);

  const handleExpand = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setActiveStep(-1);
      setShowOutcome(false);
      setAwaitingApproval(false);
      setApproved(false);
      setIsPlaying(true);
    } else {
      setIsExpanded(false);
      setIsPlaying(false);
    }
  };

  const handleApprove = () => {
    setAwaitingApproval(false);
    setApproved(true);
    setActiveStep(prev => prev + 1);
    setTimeout(() => setIsPlaying(true), 800);
  };

  const handleDefer = () => {
    setAwaitingApproval(false);
    setIsPlaying(false);
  };

  const handleReplay = () => {
    setActiveStep(-1);
    setShowOutcome(false);
    setAwaitingApproval(false);
    setApproved(false);
    setTimeout(() => setIsPlaying(true), 100);
  };

  const handleStepClick = (i: number) => {
    setIsPlaying(false);
    setActiveStep(i);
    setShowOutcome(false);
    setAwaitingApproval(false);
  };

  const catConfig: Record<string, { accent: string; bg: string; border: string; label: string }> = {
    aging_asset: { accent: 'text-orange-400/60', bg: 'bg-orange-500/[0.04]', border: 'border-orange-500/10', label: 'Aging Asset' },
    dga_alert: { accent: 'text-red-400/60', bg: 'bg-red-500/[0.04]', border: 'border-red-500/10', label: 'DGA Alert' },
    avoided_outage: { accent: 'text-emerald-400/60', bg: 'bg-emerald-500/[0.04]', border: 'border-emerald-500/10', label: 'Outage Prevention' },
  };

  const stepIcons: Record<ScenarioEvent['type'], { icon: React.ReactNode; color: string }> = {
    detection: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-amber-400/60 bg-amber-500/10 border-amber-500/15' },
    analysis: { icon: <Brain className="w-3.5 h-3.5" />, color: 'text-violet-400/60 bg-violet-500/10 border-violet-500/15' },
    recommendation: { icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'text-cyan-400/60 bg-cyan-500/10 border-cyan-500/15' },
    action: { icon: <Zap className="w-3.5 h-3.5" />, color: 'text-blue-400/60 bg-blue-500/10 border-blue-500/15' },
    resolution: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-emerald-400/60 bg-emerald-500/10 border-emerald-500/15' },
  };

  const cfg = catConfig[scenario.category] || catConfig.aging_asset;
  const progress = activeStep >= 0 ? ((activeStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className={`rounded-2xl border transition-all ${isExpanded ? cfg.border + ' ' + cfg.bg : 'bg-white/[0.02] border-white/[0.06]'}`}>
      {/* Header — always visible */}
      <button onClick={handleExpand} className="w-full p-4 flex items-start gap-3 text-left">
        <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
          <Shield className={`w-4 h-4 ${cfg.accent}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.accent}`}>{cfg.label}</span>
            <span className="text-[10px] text-emerald-400/50 font-medium">· {scenario.outcome.costAvoided} avoided</span>
          </div>
          <p className="text-sm font-medium text-white/75 truncate">{scenario.title}</p>
          {!isExpanded && (
            <p className="text-xs text-white/35 mt-0.5 truncate">{scenario.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          {!isExpanded && (
            <span className="text-[10px] text-white/25 flex items-center gap-1">
              <Play className="w-3 h-3" /> Run
            </span>
          )}
          <ChevronRight className={`w-4 h-4 text-white/25 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {/* Expanded — auto-playing investigation */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/35">
                {isPlaying ? 'Executing investigation…' : showOutcome ? 'Investigation complete' : `Step ${activeStep + 1} of ${totalSteps}`}
              </span>
              <div className="flex items-center gap-2">
                {!isPlaying && activeStep >= 0 && (
                  <button onClick={(e) => { e.stopPropagation(); setIsPlaying(true); }} className="text-[10px] text-cyan-400/50 hover:text-cyan-400/70 flex items-center gap-1 transition-colors">
                    <Play className="w-3 h-3" /> Resume
                  </button>
                )}
                {(showOutcome || activeStep >= totalSteps - 1) && (
                  <button onClick={(e) => { e.stopPropagation(); handleReplay(); }} className="text-[10px] text-white/30 hover:text-white/50 flex items-center gap-1 transition-colors">
                    <RefreshCw className="w-3 h-3" /> Replay
                  </button>
                )}
              </div>
            </div>
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500/30 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${showOutcome ? 100 : progress}%` }}
              />
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-white/50 leading-relaxed">{scenario.description}</p>

          {/* Timeline Steps */}
          <div className="space-y-0">
            {scenario.timeline.map((event, i) => {
              const step = stepIcons[event.type] || stepIcons.detection;
              const isActive = i === activeStep;
              const isPast = i < activeStep || showOutcome;
              const isVisible = i <= activeStep || showOutcome;

              return (
                <div
                  key={event.id}
                  className={`flex gap-3 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-20'}`}
                >
                  {/* Connector Line + Icon */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStepClick(i); }}
                      className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                        isActive ? step.color + ' ring-1 ring-white/10 scale-110' :
                        isPast ? 'text-emerald-400/40 bg-emerald-500/[0.06] border-emerald-500/10' :
                        'text-white/25 bg-white/[0.03] border-white/[0.06]'
                      }`}
                    >
                      {isPast && !isActive ? <CheckCircle className="w-3.5 h-3.5" /> : step.icon}
                    </button>
                    {i < totalSteps - 1 && (
                      <div className={`w-px flex-1 min-h-[16px] transition-colors duration-500 ${isPast ? 'bg-emerald-500/15' : 'bg-white/[0.06]'}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-4 flex-1 ${i === totalSteps - 1 ? 'pb-0' : ''}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-medium transition-colors duration-300 ${isActive ? 'text-white/80' : isPast ? 'text-white/55' : 'text-white/30'}`}>
                        {event.title}
                      </span>
                      {isActive && isPlaying && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-pulse" />
                      )}
                    </div>
                    {(isActive || (isPast && showOutcome)) && (
                      <div className={`mt-1.5 space-y-2 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                        <p className="text-xs text-white/45 leading-relaxed">{event.description}</p>
                        {event.data && isActive && (
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(event.data).slice(0, 4).map(([key, val]) => (
                              <span key={key} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-white/40">
                                {key.replace(/([A-Z])/g, ' $1').trim()}: <span className="text-white/60">{String(val)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Decision Brief — pauses at recommendation for human decision */}
                        {event.type === 'recommendation' && isActive && awaitingApproval && (
                          <DecisionBrief
                            decisionSupport={scenario.decisionSupport}
                            onApprove={handleApprove}
                            onDefer={handleDefer}
                          />
                        )}
                        {event.type === 'recommendation' && isActive && approved && !isPlaying && !showOutcome && (
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400/50">
                            <CheckCircle className="w-3 h-3" /> Approved — executing action plan…
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Outcome Card — slides in after final step */}
          {showOutcome && (
            <div className="p-3 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400/50" />
                <span className="text-xs font-semibold text-emerald-400/60">{scenario.outcome.title}</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed mb-2">{scenario.outcome.description}</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-sm font-bold text-emerald-400/60">{scenario.outcome.costAvoided}</p>
                  <p className="text-[10px] text-white/30">Cost Avoided</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white/60">{scenario.outcome.customersProtected.toLocaleString()}</p>
                  <p className="text-[10px] text-white/30">Customers</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white/60">{scenario.outcome.outageHoursAvoided}h</p>
                  <p className="text-[10px] text-white/30">Outage Avoided</p>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics — visible after completion */}
          {showOutcome && (
            <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-700">
              {scenario.metrics.map(m => (
                <div key={m.label} className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <span className="text-[10px] text-white/30">{m.label}</span>
                  <p className="text-xs font-semibold text-white/70">{m.value}</p>
                  <span className="text-[9px] text-white/25">{m.context}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────── Grid IQ Branch Summary (inline from tree) ──────────────
const BRANCH_DATA: Record<string, {
  triggers: { label: string; detail: string; Icon: typeof FlaskConical }[];
  agents: { name: string; finding: string; sev: 'critical' | 'warning' }[];
  deepAnalysis: { text: string; method: string }[];
  rootCause: { label: string; detail: string; confidence: number };
  scenarioId: string;
}> = {
  'BGE-TF-001': {
    triggers: [
      { label: 'DGA TDCG Spike', detail: '1,384 ppm — Cond. 3', Icon: FlaskConical },
      { label: 'Thermal Alarm', detail: 'Hot-spot 112.4 °C', Icon: Thermometer },
      { label: 'Load Exceedance', detail: 'Peak 94 % nameplate', Icon: Activity },
    ],
    agents: [
      { name: 'DGA Analysis', finding: 'TDCG Cond. 3 — T2 thermal fault', sev: 'critical' },
      { name: 'Thermal Model', finding: 'Hot-spot +12 °C, aging 4.2×', sev: 'critical' },
      { name: 'Load Analytics', finding: 'Peak load 94 % — thermal stress', sev: 'warning' },
    ],
    deepAnalysis: [
      { text: 'Duval → T2 · Rogers 3.1 · TDCG 48 ppm/d', method: 'IEEE C57.104' },
      { text: 'DP = 285 · insulation 2.3 yr left', method: 'Thermal Model' },
      { text: 'LF 0.87 · 14 overloads/mo · LTC ↑', method: 'Load Analytics' },
    ],
    rootCause: { label: 'Thermal Fault Validated', detail: 'DGA T2 + hot-spot + load stress converge', confidence: 94 },
    scenarioId: 'aging-transformer',
  },
  'COMED-TF-004': {
    triggers: [
      { label: 'Fleet Batch Alert', detail: 'GE Prolec B-1989', Icon: Building },
      { label: 'OEM Bulletin Open', detail: 'SB-2019-047', Icon: FileText },
      { label: 'Elec. Test Fail', detail: 'PF 1.8 % (limit 1.0)', Icon: Zap },
    ],
    agents: [
      { name: 'Fleet Intelligence', finding: '67 % fail prob. — batch 3/8', sev: 'critical' },
      { name: 'OEM Specs', finding: 'Design life +3.2 yr · SB-047 open', sev: 'critical' },
      { name: 'Electrical Testing', finding: 'PF 1.8 % — insulation breakdown', sev: 'critical' },
    ],
    deepAnalysis: [
      { text: 'Weibull β 3.2 · 3/8 batch fail', method: 'Fleet Analytics' },
      { text: 'SB-047 bushing recall · dielectric ↓', method: 'OEM Cross-Ref' },
      { text: 'Tan-δ 0.042 · C₂ +8 % · SFRA shift', method: 'Dielectric' },
    ],
    rootCause: { label: 'End-of-Life Confirmed', detail: 'Fleet defect + OEM recall + dielectric degradation', confidence: 89 },
    scenarioId: 'dga-trending-alert',
  },
  'PECO-TF-001': {
    triggers: [
      { label: 'PM Compliance Drop', detail: 'Score 72 % (tgt 85 %)', Icon: ClipboardList },
      { label: 'Visual Score 4.1', detail: 'Oil seepage B-phase', Icon: Eye },
      { label: 'PD Trend Alert', detail: '↑ 340 % in 6 months', Icon: Activity },
    ],
    agents: [
      { name: 'Work Order History', finding: 'BUSH-SEAL replaced 3× / 24 mo', sev: 'critical' },
      { name: 'Field Inspection', finding: 'Visual 4.1/10 · seepage active', sev: 'critical' },
      { name: 'Condition Monitoring', finding: 'PD ↑ 340 % · acoustic anomaly', sev: 'warning' },
    ],
    deepAnalysis: [
      { text: 'MTBF ↓ 37 % · cost +120 % YoY', method: 'History' },
      { text: 'Corrosion C · gasket ↓ · 0.4 L/mo', method: 'Field Inspect' },
      { text: 'PD 450 pC · UHF trend · 38 dB', method: 'PD Diagnostics' },
    ],
    rootCause: { label: 'Maintenance Gap Critical', detail: 'Repeat failures + degradation + PD trending converge', confidence: 91 },
    scenarioId: 'avoided-outage',
  },
};

function GridIQBranchSummary({ assetTag }: { assetTag: string }) {
  const branch = BRANCH_DATA[assetTag];
  if (!branch) return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-white/40" />
          <h3 className="text-xs font-semibold text-white/60">Grid IQ Analysis</h3>
        </div>
        <Link href="/grid-iq" className="flex items-center gap-1 text-[10px] text-cyan-400/60 hover:text-cyan-400/80 transition-colors">
          Full Analysis <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <p className="text-[11px] text-white/40">No active Grid IQ analysis branch for this asset. Run full analysis in Grid IQ.</p>
    </div>
  );

  const sevColor = (s: string) => s === 'critical' ? 'text-rose-400/70 bg-rose-500/10' : 'text-amber-400/70 bg-amber-500/10';

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400/60" />
          <h3 className="text-xs font-semibold text-white/70">Grid IQ — Analysis Branch</h3>
        </div>
        <Link
          href={`/grid-iq?id=${branch.scenarioId}`}
          className="flex items-center gap-1 text-[10px] text-cyan-400/60 hover:text-cyan-400/80 transition-colors"
        >
          View Full Tree <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Triggers */}
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <span className="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-2 block">Triggers</span>
        <div className="flex flex-wrap gap-2">
          {branch.triggers.map((t, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-white/55 bg-white/[0.04] border border-white/[0.06] rounded px-2 py-1">
              <t.Icon className="w-3 h-3 text-white/35" />
              <span className="font-medium">{t.label}</span>
              <span className="text-white/30">— {t.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Findings */}
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <span className="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-2 block">Agent Findings</span>
        <div className="space-y-1.5">
          {branch.agents.map((a, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${sevColor(a.sev)}`}>
                {a.sev === 'critical' ? 'CRIT' : 'WARN'}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-white/45 font-medium">{a.name}:</span>
                <span className="text-[10px] text-white/65 ml-1">{a.finding}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deep Analysis */}
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <span className="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-2 block">Deep Analysis</span>
        <div className="space-y-1">
          {branch.deepAnalysis.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <span className="text-white/30 font-mono">{d.method}</span>
              <span className="text-white/10">→</span>
              <span className="text-white/55">{d.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Root Cause Convergence */}
      <div className="px-4 py-3">
        <span className="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-2 block">Root Cause</span>
        <div className="flex items-center gap-3 rounded-lg border border-rose-500/15 bg-rose-500/[0.04] p-3">
          <AlertTriangle className="w-4 h-4 text-rose-400/60 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-white/80">{branch.rootCause.label}</h4>
            <p className="text-[10px] text-white/45 mt-0.5">{branch.rootCause.detail}</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-rose-400/70">{branch.rootCause.confidence}%</span>
            <span className="text-[8px] text-white/30">confidence</span>
          </div>
        </div>
        <Link
          href={`/grid-iq?id=${branch.scenarioId}`}
          className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-medium text-cyan-400/60 hover:text-cyan-400/80 bg-cyan-500/[0.04] hover:bg-cyan-500/[0.08] border border-cyan-500/15 rounded-lg py-2 transition-all"
        >
          <Brain className="w-3.5 h-3.5" />
          Open Scenario & Decision in Grid IQ
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

// ──────────────────────────── Sensor Card ────────────────────────────
function SensorCard({ sensor }: { sensor: TransformerSensor }) {
  const percentage = ((sensor.value - sensor.minValue) / (sensor.maxValue - sensor.minValue)) * 100;
  const statusColors = { normal: 'text-emerald-400/50', warning: 'text-amber-400/50', critical: 'text-rose-400/50' };
  const statusBg = { normal: 'bg-emerald-500/10', warning: 'bg-amber-500/10', critical: 'bg-rose-500/10' };
  const icons: Record<string, React.ReactNode> = {
    thermal: <Thermometer className="w-4 h-4" />,
    load: <Zap className="w-4 h-4" />,
    dga: <FlaskConical className="w-4 h-4" />,
    oil: <Droplets className="w-4 h-4" />,
    electrical: <Activity className="w-4 h-4" />,
    environmental: <Wind className="w-4 h-4" />,
  };

  return (
    <div className={`p-3 rounded-xl border transition-all ${
      sensor.status === 'critical' ? 'bg-rose-500/[0.04] border-rose-500/15' :
      sensor.status === 'warning' ? 'bg-amber-500/[0.04] border-amber-500/15' :
      'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={statusColors[sensor.status]}>{icons[sensor.type]}</span>
          <span className="text-xs text-white/50">{sensor.name}</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusBg[sensor.status]} ${statusColors[sensor.status]}`}>
          {sensor.status}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold ${
          sensor.status === 'critical' ? 'text-rose-400/70' :
          sensor.status === 'warning' ? 'text-amber-400/70' : 'text-white/80'
        }`}>
          {sensor.value.toFixed(sensor.unit === 'ppm' ? 0 : 1)}
        </span>
        <span className="text-xs text-white/35">{sensor.unit}</span>
      </div>
      <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            sensor.status === 'critical' ? 'bg-rose-500/40' :
            sensor.status === 'warning' ? 'bg-amber-500/40' : 'bg-emerald-500/30'
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-white/25">
        <span>{sensor.normalRange.min}</span>
        <span>Normal range</span>
        <span>{sensor.normalRange.max}</span>
      </div>
    </div>
  );
}

// ──────────────────────── DGA Trend Panel ─────────────────────────
function DGATrendPanel({ history }: { history: DGAReading[] }) {
  if (history.length === 0) return null;
  const latest = history[history.length - 1];
  const prev = history.length > 1 ? history[history.length - 2] : null;

  const gases = [
    { label: 'H₂', key: 'h2' as const, color: 'text-rose-400/60', limit: 300 },
    { label: 'CH₄', key: 'ch4' as const, color: 'text-amber-400/60', limit: 120 },
    { label: 'C₂H₂', key: 'c2h2' as const, color: 'text-red-400/60', limit: 35 },
    { label: 'C₂H₄', key: 'c2h4' as const, color: 'text-orange-400/60', limit: 150 },
    { label: 'CO', key: 'co' as const, color: 'text-blue-400/60', limit: 570 },
  ];

  return (
    <div className="space-y-3">
      {/* Fault Diagnosis */}
      <div className={`p-3 rounded-lg border ${
        latest.faultType === 'normal' ? 'bg-emerald-500/[0.04] border-emerald-500/15' :
        latest.faultType === 'arcing' ? 'bg-rose-500/[0.04] border-rose-500/15' :
        'bg-amber-500/[0.04] border-amber-500/15'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-4 h-4 text-violet-400/50" />
          <span className="text-xs font-medium text-white/70">Duval Triangle Analysis</span>
        </div>
        <p className="text-xs text-white/60">{latest.interpretation}</p>
        <p className="text-[10px] text-white/35 mt-1">TDCG: {latest.tdcg} ppm</p>
      </div>

      {/* Gas bars */}
      <div className="space-y-2">
        {gases.map(gas => {
          const value = latest[gas.key];
          const prevValue = prev ? prev[gas.key] : value;
          const change = prev ? ((value - prevValue) / Math.max(1, prevValue) * 100) : 0;
          const pct = Math.min(100, (value / gas.limit) * 100);
          const isOver = value > gas.limit;

          return (
            <div key={gas.key} className="flex items-center gap-2">
              <span className={`text-[10px] w-10 font-mono ${gas.color}`}>{gas.label}</span>
              <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isOver ? 'bg-rose-500/30' : 'bg-cyan-500/25'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`text-[10px] w-14 text-right font-mono ${isOver ? 'text-rose-400/60' : 'text-white/50'}`}>
                {value}
              </span>
              {change !== 0 && (
                <span className={`text-[9px] w-12 text-right ${change > 0 ? 'text-rose-400/50' : 'text-emerald-400/50'}`}>
                  {change > 0 ? '↑' : '↓'}{Math.abs(change).toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* History timeline */}
      <div className="pt-2 border-t border-white/[0.06]">
        <div className="text-[10px] text-white/30 mb-1">Sample History</div>
        <div className="flex items-end gap-1">
          {history.map((reading, i) => {
            const height = Math.min(32, (reading.tdcg / 3000) * 32);
            const isLatest = i === history.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${reading.timestamp.toLocaleDateString()} — TDCG: ${reading.tdcg}`}>
                <div
                  className={`w-full rounded-t ${isLatest ? 'bg-cyan-500/40' : reading.tdcg > 1920 ? 'bg-rose-500/30' : reading.tdcg > 720 ? 'bg-amber-500/30' : 'bg-emerald-500/30'}`}
                  style={{ height }}
                />
                <span className="text-[8px] text-white/30">
                  {reading.timestamp.toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ──────────────────── Load Event Timeline ─────────────────────────
function LoadTimeline({ events, highlightedId, onHighlightClear }: {
  events: LoadEvent[];
  highlightedId?: string | null;
  onHighlightClear?: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (highlightedId) setExpandedId(highlightedId);
  }, [highlightedId]);

  const eventTypeColors: Record<string, string> = {
    normal: 'text-emerald-400/50', peak: 'text-amber-400/50', overload: 'text-rose-400/50',
    switching: 'text-cyan-400/50', fault_clearing: 'text-red-400/50',
  };

  return (
    <div className="space-y-2">
      {events.slice(0, 5).map(event => {
        const isHighlighted = highlightedId === event.id;
        const isExpanded = expandedId === event.id;
        const hasWarnings = event.warnings.length > 0;

        return (
          <div
            key={event.id}
            id={`event-${event.id}`}
            onClick={() => {
              setExpandedId(isExpanded ? null : event.id);
              if (isHighlighted && onHighlightClear) onHighlightClear();
            }}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              isHighlighted ? 'bg-violet-500/[0.06] border-violet-500/20 ring-1 ring-violet-500/15' :
              event.eventType === 'fault_clearing' ? 'bg-rose-500/[0.03] border-rose-500/10' :
              hasWarnings ? 'bg-amber-500/[0.02] border-amber-500/10 hover:border-amber-500/20' :
              'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.12]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {event.eventType === 'fault_clearing' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400/50" />
                ) : event.eventType === 'peak' ? (
                  <TrendingUp className="w-4 h-4 text-amber-400/50" />
                ) : (
                  <Activity className="w-4 h-4 text-emerald-400/40" />
                )}
                <span className="text-sm font-medium text-white/80">{event.description}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/35">
                  {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <ChevronRight className={`w-4 h-4 text-white/25 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-white/50">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {event.loadMVA} MVA ({event.loadPercent}%)
              </span>
              <span className="flex items-center gap-1">
                <Thermometer className="w-3 h-3" />
                {event.topOilTemp.toFixed(0)}°C / {event.hotSpotTemp.toFixed(0)}°C
              </span>
              <span className={`capitalize ${eventTypeColors[event.eventType] || 'text-white/40'}`}>
                {event.eventType.replace('_', ' ')}
              </span>
              {hasWarnings && (
                <span className="text-amber-400/50 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {event.warnings.length}
                </span>
              )}
            </div>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-3">
                {hasWarnings && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-amber-400/60 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Alerts ({event.warnings.length})
                    </div>
                    {event.warnings.map((w, i) => (
                      <div key={i} className="text-xs bg-amber-500/[0.05] text-amber-200/60 px-2.5 py-1.5 rounded-lg border border-amber-500/10">
                        {w}
                      </div>
                    ))}
                  </div>
                )}
                {event.dgaChange && (
                  <div className="bg-white/[0.04] rounded-lg p-2">
                    <span className="text-[10px] text-white/35">DGA Change During Event</span>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="text-white/70">{event.dgaChange.gasName}:</span>
                      <span className="text-white/50">{event.dgaChange.before} → {event.dgaChange.after} ppm</span>
                      <span className={event.dgaChange.changePercent > 5 ? 'text-rose-400/60' : 'text-amber-400/60'}>
                        +{event.dgaChange.changePercent}%
                      </span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/[0.04] rounded-lg p-2">
                    <span className="text-white/35 block mb-0.5">Duration</span>
                    <span className="text-white/80">{(event.duration / 60).toFixed(0)} min</span>
                  </div>
                  <div className="bg-white/[0.04] rounded-lg p-2">
                    <span className="text-white/35 block mb-0.5">Type</span>
                    <span className="text-white/80 capitalize">{event.eventType.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────── Alarm Events Panel ──────────────────────────
function AlarmEventsPanel({ events, onEventClick }: {
  events: AlarmEvent[];
  onEventClick?: (eventId: string) => void;
}) {
  const severityColors: Record<string, string> = {
    info: 'text-blue-400/50 bg-blue-500/[0.05] border-blue-500/15',
    warning: 'text-amber-400/50 bg-amber-500/[0.05] border-amber-500/15',
    alarm: 'text-orange-400/50 bg-orange-500/[0.05] border-orange-500/15',
    trip: 'text-rose-400/50 bg-rose-500/[0.05] border-rose-500/15',
  };

  const typeIcons: Record<string, React.ReactNode> = {
    dga_alarm: <FlaskConical className="w-4 h-4" />,
    thermal_alarm: <Thermometer className="w-4 h-4" />,
    electrical_fault: <Zap className="w-4 h-4" />,
    oil_alarm: <Droplets className="w-4 h-4" />,
    bushing_alarm: <Activity className="w-4 h-4" />,
    tap_changer: <Gauge className="w-4 h-4" />,
    cooling_failure: <Wind className="w-4 h-4" />,
  };

  return (
    <div className="space-y-2">
      {events.map(event => (
        <div
          key={event.id}
          onClick={() => event.relatedLoadEventId && onEventClick?.(event.relatedLoadEventId)}
          className={`p-3 rounded-lg border transition-all ${severityColors[event.severity]} ${
            !event.resolved ? 'animate-pulse' : ''
          } ${event.relatedLoadEventId ? 'cursor-pointer hover:ring-1 hover:ring-violet-500/20' : ''}`}
        >
          <div className="flex items-start gap-2">
            {typeIcons[event.type] || <AlertTriangle className="w-4 h-4" />}
            <div className="flex-1">
              <p className="text-sm font-medium text-white/70">{event.description}</p>
              {event.value !== undefined && event.threshold !== undefined && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] text-white/35">
                    Value: {event.value} {event.parameter && `(${event.parameter})`} · Limit: {event.threshold}
                  </span>
                </div>
              )}
              <p className="text-xs text-white/30 mt-1">
                {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {event.resolved && ' · Resolved'}
              </p>
              {event.aiRecommendation && (
                <div className="mt-2 p-2 rounded bg-white/[0.03] border border-white/[0.05]">
                  <p className="text-xs flex items-start gap-1">
                    <Brain className="w-3 h-3 text-violet-400/40 mt-0.5 flex-shrink-0" />
                    <span className="text-white/50">{event.aiRecommendation}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ──────────────────── Thermal Diagram ─────────────────────────────
function ThermalDiagram({ transformer }: { transformer: TransformerAsset }) {
  const { thermal, metrics } = transformer;
  const hotSpotColor = thermal.windingHotSpot > 105 ? 'text-rose-400/70' : thermal.windingHotSpot > 90 ? 'text-amber-400/70' : 'text-emerald-400/60';
  const topOilColor = thermal.topOilTemp > 85 ? 'text-rose-400/70' : thermal.topOilTemp > 75 ? 'text-amber-400/70' : 'text-emerald-400/60';

  return (
    <div className="p-4 rounded-xl bg-blue-500/[0.02] border border-blue-500/10">
      <h3 className="text-xs font-semibold text-white/80 flex items-center gap-2 mb-3">
        <Thermometer className="w-4 h-4 text-cyan-400/50" />
        Thermal Profile
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className={`text-2xl font-bold ${topOilColor}`}>{thermal.topOilTemp.toFixed(0)}°C</div>
          <div className="text-[10px] text-white/40">Top Oil</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${hotSpotColor}`}>{thermal.windingHotSpot.toFixed(0)}°C</div>
          <div className="text-[10px] text-white/40">Winding Hot Spot</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white/60">{thermal.bottomOilTemp.toFixed(0)}°C</div>
          <div className="text-[10px] text-white/40">Bottom Oil</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white/60">{thermal.ambientTemp.toFixed(0)}°C</div>
          <div className="text-[10px] text-white/40">Ambient</div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
        <div>
          <span className="text-white/30">Cooling: </span>
          <span className="text-cyan-400/50 font-medium">{thermal.coolingMode}</span>
        </div>
        <div>
          <span className="text-white/30">Fans: </span>
          <span className="text-white/60">{thermal.fansRunning}</span>
        </div>
        <div>
          <span className="text-white/30">Pumps: </span>
          <span className="text-white/60">{thermal.pumpsRunning}</span>
        </div>
        <div>
          <span className="text-white/30">Tap: </span>
          <span className="text-white/60">{metrics.tapPosition}</span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════ MAIN DASHBOARD ═════════════════════════════
export default function TransformerIoTPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TransformerIoTDashboard />
    </Suspense>
  );
}

function TransformerIoTDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetTag = searchParams.get('asset') || 'BGE-TF-001';

  const [transformer, setTransformer] = useState<TransformerAsset | null>(null);
  const [loadEvents, setLoadEvents] = useState<LoadEvent[]>([]);
  const [alarmEvents, setAlarmEvents] = useState<AlarmEvent[]>([]);
  const [dgaHistory, setDGAHistory] = useState<DGAReading[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  useEffect(() => {
    const tf = generateTransformerAsset(assetTag);
    setTransformer(tf);
    const events = generateRecentLoadEvents(10, assetTag);
    setLoadEvents(events);
    setAlarmEvents(generateAlarmEvents(events, assetTag));
    setDGAHistory(generateDGAHistory(assetTag));
  }, [assetTag]);

  useEffect(() => {
    if (!isLive || !transformer) return;
    const interval = setInterval(() => {
      setTransformer(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sensors: prev.sensors.map(updateSensorValue),
          metrics: {
            ...prev.metrics,
            loadFactor: prev.metrics.loadFactor + (Math.random() - 0.5) * 0.5,
            topOilTemp: prev.metrics.topOilTemp + (Math.random() - 0.5) * 0.2,
            hotSpotTemp: prev.metrics.hotSpotTemp + (Math.random() - 0.5) * 0.3,
          },
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive, transformer]);

  if (!transformer) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const healthColor = transformer.metrics.healthIndex >= 70 ? 'text-emerald-400/70' :
    transformer.metrics.healthIndex >= 50 ? 'text-amber-400/70' : 'text-rose-400/70';

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-[2000px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/')} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white/60" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/[0.06] border border-cyan-500/15 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-cyan-400/50" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white/90">{transformer.name}</h1>
                  <p className="text-sm text-white/40">
                    <Link href={`/vessel/${transformer.assetTag}`} className="text-cyan-400/60 hover:text-cyan-400/80 transition-colors">
                      {transformer.assetTag}
                    </Link>
                    {' · '}{transformer.rating} · {transformer.opCo}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Health Index */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                <Shield className="w-4 h-4 text-white/40" />
                <span className={`text-sm font-bold ${healthColor}`}>{transformer.metrics.healthIndex}</span>
                <span className="text-xs text-white/35">HI</span>
              </div>
              {/* Status */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  transformer.status === 'energized' ? 'bg-emerald-500/50' :
                  transformer.status === 'faulted' ? 'bg-rose-500/50' :
                  transformer.status === 'maintenance' ? 'bg-amber-500/40' : 'bg-gray-500/40'
                }`} />
                <span className="text-sm text-white/60 capitalize">{transformer.status}</span>
              </div>
              {/* Live toggle */}
              <button
                onClick={() => setIsLive(!isLive)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isLive ? 'bg-emerald-500/10 text-emerald-400/60 border border-emerald-500/15' :
                  'bg-white/[0.03] text-white/40 border border-white/[0.06]'
                }`}
              >
                {isLive ? <Play className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                {isLive ? 'Live' : 'Paused'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Key Metrics Strip */}
      <div className="max-w-[2000px] mx-auto px-6 pt-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-cyan-500/[0.03] border border-cyan-500/10 flex items-center gap-3">
            <Zap className="w-4 h-4 text-cyan-400/50 flex-shrink-0" />
            <div>
              <p className="text-lg font-bold text-cyan-400/70">{transformer.metrics.loadFactor.toFixed(0)}%</p>
              <p className="text-[10px] text-white/35">{transformer.metrics.avgLoadToday} MVA avg</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/[0.03] border border-amber-500/10 flex items-center gap-3">
            <Thermometer className="w-4 h-4 text-amber-400/50 flex-shrink-0" />
            <div>
              <p className={`text-lg font-bold ${
                transformer.metrics.hotSpotTemp > 105 ? 'text-rose-400/70' :
                transformer.metrics.hotSpotTemp > 90 ? 'text-amber-400/70' : 'text-emerald-400/60'
              }`}>{transformer.metrics.hotSpotTemp.toFixed(0)}°C</p>
              <p className="text-[10px] text-white/35">Hotspot</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-violet-500/[0.03] border border-violet-500/10 flex items-center gap-3">
            <FlaskConical className="w-4 h-4 text-violet-400/50 flex-shrink-0" />
            <div>
              <p className={`text-lg font-bold ${
                transformer.metrics.tdcg > 1920 ? 'text-rose-400/70' :
                transformer.metrics.tdcg > 720 ? 'text-amber-400/70' : 'text-emerald-400/60'
              }`}>{transformer.metrics.tdcg}</p>
              <p className="text-[10px] text-white/35">TDCG ppm</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/[0.03] border border-emerald-500/10 flex items-center gap-3">
            <Shield className="w-4 h-4 text-emerald-400/50 flex-shrink-0" />
            <div>
              <p className={`text-lg font-bold ${
                transformer.metrics.dgaScore > 60 ? 'text-emerald-400/70' :
                transformer.metrics.dgaScore > 30 ? 'text-amber-400/70' : 'text-rose-400/70'
              }`}>{transformer.metrics.dgaScore.toFixed(0)}/100</p>
              <p className="text-[10px] text-white/35">DGA Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content — clean 2-column layout */}
      <main className="max-w-[2000px] mx-auto px-6 py-4">
        <div className="grid grid-cols-12 gap-6">

          {/* ── Left: Operational Data ── */}
          <div className="col-span-5 space-y-5">
            {/* Sensors — compact 3-col */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <h2 className="text-xs font-semibold text-white/60 flex items-center gap-2 mb-3">
                <Gauge className="w-3.5 h-3.5 text-cyan-400/40" />
                Sensors
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {transformer.sensors.map(sensor => (
                  <SensorCard key={sensor.id} sensor={sensor} />
                ))}
              </div>
            </div>

            {/* DGA Trend */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-white/60 flex items-center gap-2">
                  <FlaskConical className="w-3.5 h-3.5 text-violet-400/40" />
                  Dissolved Gas Analysis
                </h2>
                <span className="text-[10px] text-white/30">
                  {transformer.metrics.lastDGASample.toLocaleDateString()}
                </span>
              </div>
              <DGATrendPanel history={dgaHistory} />
            </div>

            {/* Load Events + Alarms — tabbed */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-white/60 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400/40" />
                  Load Events &amp; Alarms
                </h2>
                <span className="text-[10px] text-white/30 flex items-center gap-1">
                  <BellRing className="w-3 h-3 text-rose-400/30" />
                  {alarmEvents.filter(a => a.status === 'active').length} active
                </span>
              </div>
              <LoadTimeline
                events={loadEvents.slice(0, 4)}
                highlightedId={highlightedEventId}
                onHighlightClear={() => setHighlightedEventId(null)}
              />
              <div className="mt-3 pt-3 border-t border-white/[0.04]">
                <AlarmEventsPanel
                  events={alarmEvents}
                  onEventClick={(eventId) => {
                    setHighlightedEventId(eventId);
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Right: Thermal + Grid IQ link ── */}
          <div className="col-span-7 space-y-5">
            {/* Grid IQ link banner — if this asset has an active investigation */}
            {(() => {
              const scenario = getScenarioForAsset(assetTag);
              const branch = BRANCH_DATA[assetTag];
              if (!scenario || !branch) return null;
              return (
                <Link
                  href={`/grid-iq?id=${branch.scenarioId}`}
                  className="block rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all group overflow-hidden"
                >
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/[0.08] border border-cyan-500/15 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4.5 h-4.5 text-cyan-400/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-white/75">Grid IQ Active Investigation</h3>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400/60 border border-rose-500/15 font-medium">
                          {branch.rootCause.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 mt-0.5 truncate">
                        Root cause: <span className="text-white/55 font-medium">{branch.rootCause.label}</span>
                        <span className="text-white/25 mx-1.5">—</span>
                        {branch.rootCause.detail}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/50 group-hover:text-cyan-400/70 transition-colors flex-shrink-0">
                      View Analysis <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="px-4 pb-3 flex gap-2 flex-wrap">
                    {branch.agents.map((a, i) => (
                      <span
                        key={i}
                        className={`text-[9px] px-2 py-0.5 rounded border ${
                          a.sev === 'critical'
                            ? 'text-rose-400/60 border-rose-500/15 bg-rose-500/[0.04]'
                            : 'text-amber-400/60 border-amber-500/15 bg-amber-500/[0.04]'
                        }`}
                      >
                        {a.name}: {a.finding}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })()}

            {/* Thermal Diagram */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <h2 className="text-xs font-semibold text-white/60 flex items-center gap-2 mb-3">
                <Thermometer className="w-3.5 h-3.5 text-amber-400/40" />
                Thermal Profile
              </h2>
              <ThermalDiagram transformer={transformer} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
