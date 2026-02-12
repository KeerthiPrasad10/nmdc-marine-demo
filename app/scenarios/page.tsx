// @ts-nocheck — Demo Scenarios Page: Hero narratives for Exelon GridIQ
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  TrendingDown,
  Thermometer,
  Zap,
  CheckCircle,
  Activity,
  Clock,
  Lightbulb,
  Search,
  Wrench,
  ArrowRightLeft,
  Truck,
  Network,
  ChevronRight,
  ChevronDown,
  Users,
  DollarSign,
  Timer,
  BadgeCheck,
  BarChart3,
  Brain,
} from 'lucide-react';
import { DEMO_SCENARIOS, type DemoScenario, type ScenarioEvent } from '@/lib/demo-scenarios';

// Map icon names to components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingDown,
  Activity,
  Clock,
  Lightbulb,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Shield,
  Search,
  Zap,
  Thermometer,
  Network,
  Truck,
  ArrowRightLeft,
};

function getEventIcon(iconName: string) {
  return ICON_MAP[iconName] || Activity;
}

const CATEGORY_CONFIG = {
  aging_asset: {
    label: 'Aging Asset',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: Clock,
    gradient: 'from-orange-900/40 via-black to-black',
  },
  dga_alert: {
    label: 'DGA Alert',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: Activity,
    gradient: 'from-red-900/40 via-black to-black',
  },
  avoided_outage: {
    label: 'Outage Prevention',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: Shield,
    gradient: 'from-emerald-900/40 via-black to-black',
  },
};

const EVENT_TYPE_STYLES = {
  detection: { color: 'text-amber-400', bg: 'bg-amber-500/10', lineColor: 'bg-amber-500' },
  analysis: { color: 'text-blue-400', bg: 'bg-blue-500/10', lineColor: 'bg-blue-500' },
  recommendation: { color: 'text-purple-400', bg: 'bg-purple-500/10', lineColor: 'bg-purple-500' },
  action: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', lineColor: 'bg-cyan-500' },
  resolution: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', lineColor: 'bg-emerald-500' },
};

// ============================================================================
// SCENARIO CARD — Summary card on the landing view
// ============================================================================

function ScenarioCard({ scenario, onClick }: { scenario: DemoScenario; onClick: () => void }) {
  const config = CATEGORY_CONFIG[scenario.category];
  const CategoryIcon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border ${config.border} bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 text-left w-full`}
    >
      {/* Gradient accent */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-30 group-hover:opacity-50 transition-opacity`} />
      
      <div className="relative p-6">
        {/* Category badge */}
        <div className="flex items-center justify-between mb-4">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${config.bg} ${config.color}`}>
            <CategoryIcon className="w-3 h-3" />
            {config.label}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
            scenario.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {scenario.severity}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
          {scenario.title}
        </h3>
        <p className="text-sm text-white/50 mb-4">{scenario.subtitle}</p>

        {/* Asset info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <div>
              <div className="text-xs font-medium text-white">{scenario.assetTag}</div>
              <div className="text-[10px] text-white/40">{scenario.opCo}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-white/40">
            <Timer className="w-3.5 h-3.5" />
            {scenario.timeline.length} events
          </div>
        </div>

        {/* Outcome highlights */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-lg bg-white/5 p-2.5">
            <div className="text-xs text-white/40">Cost Avoided</div>
            <div className="text-sm font-bold text-emerald-400">{scenario.outcome.costAvoided}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2.5">
            <div className="text-xs text-white/40">Customers</div>
            <div className="text-sm font-bold text-blue-400">{scenario.outcome.customersProtected.toLocaleString()}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2.5">
            <div className="text-xs text-white/40">Hours Saved</div>
            <div className="text-sm font-bold text-amber-400">{scenario.outcome.outageHoursAvoided}h</div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-1 text-xs font-medium text-amber-400 group-hover:text-amber-300 transition-colors">
          View full scenario
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// TIMELINE EVENT — Individual step in the scenario timeline
// ============================================================================

function TimelineEvent({ event, index, isLast }: { event: ScenarioEvent; index: number; isLast: boolean }) {
  const [expanded, setExpanded] = useState(index === 0);
  const style = EVENT_TYPE_STYLES[event.type];
  const Icon = getEventIcon(event.icon);

  const ts = new Date(event.timestamp);
  const timeStr = ts.toLocaleString('en-US', { 
    month: 'short', day: 'numeric', 
    hour: 'numeric', minute: '2-digit', 
    hour12: true 
  });

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isLast && (
        <div className={`absolute left-[18px] top-10 bottom-0 w-0.5 ${style.lineColor} opacity-30`} />
      )}
      
      {/* Icon */}
      <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full ${style.bg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${style.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left group"
        >
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${style.color}`}>
              {event.type}
            </span>
            <span className="text-[10px] text-white/30">{timeStr}</span>
          </div>
          <div className="flex items-center gap-1">
            <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
              {event.title}
            </h4>
            <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {expanded && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-white/60 leading-relaxed">{event.description}</p>
            
            {event.data && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Object.entries(event.data).map(([key, val]) => (
                  <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-[10px]">
                    <span className="text-white/40">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="text-white/80 font-medium">{String(val)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SCENARIO DETAIL — Full narrative view
// ============================================================================

function ScenarioDetail({ scenario, onBack }: { scenario: DemoScenario; onBack: () => void }) {
  const config = CATEGORY_CONFIG[scenario.category];
  const CategoryIcon = config.icon;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${config.bg} ${config.color}`}>
              <CategoryIcon className="w-3 h-3" />
              {config.label}
            </span>
            <span className="text-xs text-white/30">{scenario.opCo} • {scenario.assetTag}</span>
          </div>
          <h2 className="text-xl font-bold text-white">{scenario.title}</h2>
          <p className="text-sm text-white/50 mt-0.5">{scenario.assetName}</p>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Scenario Overview</h3>
            <p className="text-sm text-white/60 leading-relaxed">{scenario.description}</p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {scenario.metrics.map((m, i) => (
          <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <div className="text-xs text-white/40 mb-1">{m.label}</div>
            <div className="text-lg font-bold text-white">{m.value}</div>
            <div className="flex items-center gap-1 mt-1">
              {m.trend === 'up' && <TrendingDown className="w-3 h-3 text-emerald-400 rotate-180" />}
              {m.trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-400" />}
              {m.trend === 'stable' && <CheckCircle className="w-3 h-3 text-blue-400" />}
              <span className="text-[10px] text-white/40">{m.context}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Timer className="w-4 h-4 text-amber-400" />
          Event Timeline
        </h3>
        <div className="pl-1">
          {scenario.timeline.map((event, i) => (
            <TimelineEvent 
              key={event.id} 
              event={event} 
              index={i} 
              isLast={i === scenario.timeline.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Outcome */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <div className="flex items-start gap-3">
          <BadgeCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <div>
            <h3 className="text-base font-bold text-emerald-400 mb-2">{scenario.outcome.title}</h3>
            <p className="text-sm text-white/60 leading-relaxed mb-4">{scenario.outcome.description}</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-white/40 mb-0.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  Cost Avoided
                </div>
                <div className="text-xl font-bold text-emerald-400">{scenario.outcome.costAvoided}</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-white/40 mb-0.5">
                  <Users className="w-3.5 h-3.5" />
                  Customers Protected
                </div>
                <div className="text-xl font-bold text-blue-400">{scenario.outcome.customersProtected.toLocaleString()}</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-white/40 mb-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  Outage Hours Avoided
                </div>
                <div className="text-xl font-bold text-amber-400">{scenario.outcome.outageHoursAvoided}h</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ScenariosPage() {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);

  // Aggregate totals
  const totalCostAvoided = '$31.7M';
  const totalCustomers = DEMO_SCENARIOS.reduce((sum, s) => sum + s.outcome.customersProtected, 0);
  const totalHours = DEMO_SCENARIOS.reduce((sum, s) => sum + s.outcome.outageHoursAvoided, 0);

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
                <Zap className="w-4 h-4 text-amber-400" />
                <h1 className="text-base font-bold">GridIQ Value Scenarios</h1>
              </div>
              <p className="text-xs text-white/40">AI-powered predictive intelligence — real outcomes</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <div className="text-right">
              <div className="text-white/40">Total Cost Avoided</div>
              <div className="text-lg font-bold text-emerald-400">{totalCostAvoided}</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-right">
              <div className="text-white/40">Customers Protected</div>
              <div className="text-lg font-bold text-blue-400">{totalCustomers.toLocaleString()}</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-right">
              <div className="text-white/40">Outage Hours Avoided</div>
              <div className="text-lg font-bold text-amber-400">{totalHours}h</div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {selectedScenario ? (
          <ScenarioDetail 
            scenario={selectedScenario} 
            onBack={() => setSelectedScenario(null)} 
          />
        ) : (
          <div className="space-y-8">
            {/* Intro */}
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-white mb-2">
                Predictive Intelligence in Action
              </h2>
              <p className="text-sm text-white/50 leading-relaxed">
                Three real-world scenarios demonstrating how GridIQ&apos;s AI-driven predictive
                maintenance platform transforms grid operations — from early detection through
                resolution, with measurable outcomes.
              </p>
            </div>

            {/* Scenario cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {DEMO_SCENARIOS.map(scenario => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  onClick={() => setSelectedScenario(scenario)}
                />
              ))}
            </div>

            {/* Platform capabilities summary */}
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                Platform Capabilities Demonstrated
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  {
                    icon: Activity,
                    title: 'Continuous DGA Monitoring',
                    desc: 'IEEE C57.104 compliant dissolved gas analysis with Duval Triangle fault classification',
                  },
                  {
                    icon: Brain,
                    title: 'AI Predictive Analytics',
                    desc: 'Machine learning models predict failures 6-12 months ahead using fleet-wide intelligence',
                  },
                  {
                    icon: Network,
                    title: 'Automated Load Management',
                    desc: 'SCADA-integrated load transfer orchestration with N-1 contingency analysis',
                  },
                  {
                    icon: Shield,
                    title: 'Zero Customer Impact',
                    desc: 'Proactive intervention during planned windows achieves 100% blue-sky uptime target',
                  },
                ].map((cap, i) => (
                  <div key={i} className="flex gap-3">
                    <cap.icon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-white mb-0.5">{cap.title}</div>
                      <div className="text-[11px] text-white/40 leading-relaxed">{cap.desc}</div>
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

