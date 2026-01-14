'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CloudRain,
  Fuel,
  Shield,
  Zap,
  CheckCircle,
  Clock,
  DollarSign,
  Ship,
  Activity,
  Sparkles,
  Cpu,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { 
  CrisisScenario, 
  DemoStep, 
  allScenarios,
  engineFailureScenario,
} from '@/lib/demo/scenarios';

const phaseColors: Record<string, string> = {
  detection: 'from-blue-500 to-cyan-500',
  analysis: 'from-purple-500 to-violet-500',
  prediction: 'from-amber-500 to-orange-500',
  impact: 'from-rose-500 to-pink-500',
  solution: 'from-emerald-500 to-green-500',
  action: 'from-primary-500 to-violet-500',
};

const scenarioIcons: Record<CrisisScenario['type'], LucideIcon> = {
  engine_failure: AlertTriangle,
  storm_response: CloudRain,
  fuel_crisis: Fuel,
  safety_incident: Shield,
  crane_efficiency: Cpu,
};

export default function DemoPage() {
  const router = useRouter();
  const [selectedScenario, setSelectedScenario] = useState<CrisisScenario>(engineFailureScenario);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const runDemo = useCallback(() => {
    if (isRunning) return;
    
    setIsRunning(true);
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
    setElapsedTime(0);

    // Start elapsed time counter
    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 100);
    }, 100);
  }, [isRunning]);

  // Process steps sequentially
  useEffect(() => {
    if (!isRunning || currentStepIndex < 0) return;
    if (currentStepIndex >= selectedScenario.steps.length) {
      // Demo complete
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    const step = selectedScenario.steps[currentStepIndex];
    
    stepTimeoutRef.current = setTimeout(() => {
      setCompletedSteps(prev => new Set([...prev, step.id]));
      setCurrentStepIndex(prev => prev + 1);
    }, step.duration);

    return () => {
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
      }
    };
  }, [isRunning, currentStepIndex, selectedScenario.steps]);

  const resetDemo = useCallback(() => {
    setIsRunning(false);
    setCurrentStepIndex(-1);
    setCompletedSteps(new Set());
    setElapsedTime(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
    }
  }, []);

  const pauseDemo = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
    }
  }, []);

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(1) + 's';
  };

  const isComplete = completedSteps.size === selectedScenario.steps.length;

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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-white/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Predictive AI Demo</h1>
                  <p className="text-sm text-white/50">Spot risks early, deploy countermeasures before they escalate</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
                {!isRunning && !isComplete && (
                  <button
                    onClick={runDemo}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Run Demo
                  </button>
                )}
                {isRunning && (
                  <button
                    onClick={pauseDemo}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/80 hover:bg-amber-500 text-white font-medium transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                )}
                <button
                  onClick={resetDemo}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-6">
          {/* Scenario Selection */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-white/50 uppercase tracking-wide">Select Scenario</h2>
            <div className="space-y-2">
              {allScenarios.map(scenario => {
                const Icon: LucideIcon = scenarioIcons[scenario.type];
                return (
                  <button
                    key={scenario.id}
                    onClick={() => {
                      resetDemo();
                      setSelectedScenario(scenario);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedScenario.id === scenario.id
                        ? 'bg-primary-500/10 border-primary-500/50'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        selectedScenario.id === scenario.id
                          ? 'bg-primary-500/20'
                          : 'bg-white/5'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          selectedScenario.id === scenario.id
                            ? 'text-primary-400'
                            : 'text-white/50'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium text-white">{scenario.name}</div>
                        <div className="text-xs text-white/40">{scenario.steps.length} steps</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Scenario Info */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <h3 className="text-sm font-medium text-white mb-2">About This Scenario</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                {selectedScenario.description}
              </p>
              {selectedScenario.vessel && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-white">{selectedScenario.vessel.name}</span>
                  </div>
                  <span className="text-xs text-white/40 capitalize ml-6">
                    {selectedScenario.vessel.type.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Main Demo Area */}
          <div className="col-span-2">
            {/* Step Timeline */}
            <div className="bg-black rounded-xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-400" />
                Predictive AI Timeline
              </h2>

              <div className="space-y-4">
                {selectedScenario.steps.map((step, index) => {
                  const isActive = currentStepIndex === index;
                  const isCompleted = completedSteps.has(step.id);
                  const isPending = !isActive && !isCompleted;

                  return (
                    <div
                      key={step.id}
                      className={`relative pl-8 pb-4 ${
                        index < selectedScenario.steps.length - 1 ? 'border-l-2' : ''
                      } ${
                        isCompleted ? 'border-primary-500/50' : 'border-white/10'
                      }`}
                    >
                      {/* Step indicator */}
                      <div
                        className={`absolute left-0 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isActive
                            ? `bg-gradient-to-r ${phaseColors[step.phase]} animate-pulse`
                            : isCompleted
                            ? 'bg-primary-500'
                            : 'bg-white/10'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : isActive ? (
                          <Activity className="w-3 h-3 text-white animate-pulse" />
                        ) : (
                          <span className="text-xs text-white/50">{index + 1}</span>
                        )}
                      </div>

                      {/* Step content */}
                      <div
                        className={`rounded-xl border p-4 transition-all duration-300 ${
                          isActive
                            ? 'bg-white/[0.08] border-primary-500/50 shadow-lg shadow-primary-500/10'
                            : isCompleted
                            ? 'bg-white/[0.04] border-white/10'
                            : 'bg-white/[0.02] border-white/5 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{step.icon}</span>
                            <span className={`text-sm font-medium ${isActive || isCompleted ? 'text-white' : 'text-white/50'}`}>
                              {step.title}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            isActive
                              ? `bg-gradient-to-r ${phaseColors[step.phase]} text-white`
                              : isCompleted
                              ? 'bg-primary-500/20 text-primary-400'
                              : 'bg-white/5 text-white/30'
                          }`}>
                            {step.phase}
                          </span>
                        </div>
                        
                        <p className={`text-sm ${isActive || isCompleted ? 'text-white/70' : 'text-white/30'}`}>
                          {step.description}
                        </p>

                        {/* Step data (show when completed or active) */}
                        {(isActive || isCompleted) && step.data && (
                          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
                            {Object.entries(step.data).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="text-white/40 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <span className="text-white ml-1">
                                  {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Progress indicator for active step */}
                        {isActive && (
                          <div className="mt-3">
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${phaseColors[step.phase]} animate-pulse`}
                                style={{ width: '100%' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            {/* Live Status */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <h3 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-3">
                Demo Status
              </h3>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  isRunning ? 'bg-emerald-400 animate-pulse' :
                  isComplete ? 'bg-primary-400' : 'bg-white/20'
                }`} />
                <span className="text-white">
                  {isRunning ? 'Running...' : isComplete ? 'Complete!' : 'Ready'}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Progress</span>
                  <span className="text-white">
                    {completedSteps.size} / {selectedScenario.steps.length} steps
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${(completedSteps.size / selectedScenario.steps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Cost Comparison (show when complete) */}
            {isComplete && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30">
                <h3 className="text-sm font-medium text-emerald-400 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Cost Analysis
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Planned Response</span>
                    <span className="text-lg font-bold text-emerald-400">
                      ${(selectedScenario.summary.plannedCost / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Emergency Cost</span>
                    <span className="text-lg font-bold text-rose-400">
                      ${(selectedScenario.summary.emergencyCost / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Total Savings</span>
                      <span className="text-2xl font-bold text-emerald-400">
                        ${(selectedScenario.summary.savings / 1000).toFixed(0)}k
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {isComplete && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-3">
                  AI Performance
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Response Time</span>
                    <span className="text-white font-mono">{formatTime(elapsedTime)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Decisions Made</span>
                    <span className="text-white">{selectedScenario.steps.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Data Points Analyzed</span>
                    <span className="text-white">10,847+</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Confidence</span>
                    <span className="text-emerald-400">87%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Key Message */}
          </div>
        </div>
      </main>
    </div>
  );
}

