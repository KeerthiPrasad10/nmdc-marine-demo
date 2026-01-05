'use client';

import { useState } from 'react';
import { 
  AlertTriangle, 
  CloudRain, 
  Plus, 
  Settings,
  Play,
  Loader2,
  Ship,
  DollarSign,
  Clock,
  ChevronRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { ScenarioSimulation, VesselAssignment } from '@/lib/orchestration/types';
import { simulateScenario } from '@/lib/orchestration/optimizer';

interface ScenarioSimulatorProps {
  assignments: VesselAssignment[];
  vessels: Array<{ id: string; name: string; type: string }>;
  onSimulationComplete?: (result: ScenarioSimulation) => void;
}

type ScenarioType = 'vessel_breakdown' | 'weather_delay' | 'new_project' | 'resource_change';

import { LucideIcon } from 'lucide-react';

const scenarioOptions: Array<{
  type: ScenarioType;
  label: string;
  icon: LucideIcon;
  description: string;
  color: string;
}> = [
  {
    type: 'vessel_breakdown',
    label: 'Vessel Breakdown',
    icon: AlertTriangle,
    description: 'Simulate a vessel experiencing critical equipment failure',
    color: 'rose',
  },
  {
    type: 'weather_delay',
    label: 'Weather Delay',
    icon: CloudRain,
    description: 'Simulate weather-related operational delays',
    color: 'amber',
  },
  {
    type: 'new_project',
    label: 'New Project',
    icon: Plus,
    description: 'Evaluate fleet capacity for a new project',
    color: 'emerald',
  },
  {
    type: 'resource_change',
    label: 'Resource Change',
    icon: Settings,
    description: 'Simulate changes in resource allocation',
    color: 'blue',
  },
];

export function ScenarioSimulator({
  assignments,
  vessels,
  onSimulationComplete,
}: ScenarioSimulatorProps) {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<string>('');
  const [duration, setDuration] = useState<number>(3);
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<ScenarioSimulation | null>(null);

  const runSimulation = async () => {
    if (!selectedScenario) return;

    setIsSimulating(true);
    setResult(null);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const vessel = vessels.find(v => v.id === selectedVessel);
    const simulation = simulateScenario(
      selectedScenario,
      {
        vesselId: selectedVessel,
        vesselName: vessel?.name,
        duration,
      },
      assignments,
      vessels
    );

    setResult(simulation);
    onSimulationComplete?.(simulation);
    setIsSimulating(false);
  };

  const resetSimulation = () => {
    setSelectedScenario(null);
    setSelectedVessel('');
    setDuration(3);
    setResult(null);
  };

  return (
    <div className="h-full flex flex-col bg-black rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <h3 className="text-sm font-medium text-white">What-If Scenario Simulator</h3>
        <p className="text-xs text-white/40 mt-1">
          Simulate disruptions and evaluate fleet response
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!result ? (
          <div className="space-y-6">
            {/* Scenario Selection */}
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wide mb-2 block">
                Select Scenario Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {scenarioOptions.map(option => (
                  <button
                    key={option.type}
                    onClick={() => setSelectedScenario(option.type)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedScenario === option.type
                        ? `bg-${option.color}-500/20 border-${option.color}-500/50`
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <option.icon className={`w-4 h-4 ${
                        selectedScenario === option.type
                          ? `text-${option.color}-400`
                          : 'text-white/50'
                      }`} />
                      <span className={`text-sm font-medium ${
                        selectedScenario === option.type ? 'text-white' : 'text-white/70'
                      }`}>
                        {option.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/40">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Parameters */}
            {selectedScenario && (
              <div className="space-y-4">
                {/* Vessel Selection */}
                {(selectedScenario === 'vessel_breakdown' || selectedScenario === 'resource_change') && (
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wide mb-2 block">
                      Select Vessel
                    </label>
                    <select
                      value={selectedVessel}
                      onChange={(e) => setSelectedVessel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500"
                    >
                      <option value="">Choose a vessel...</option>
                      {vessels.map(vessel => (
                        <option key={vessel.id} value={vessel.id}>
                          {vessel.name} ({vessel.type.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Duration for weather delay */}
                {selectedScenario === 'weather_delay' && (
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wide mb-2 block">
                      Duration (days)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="14"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>1 day</span>
                      <span className="text-white font-medium">{duration} days</span>
                      <span>14 days</span>
                    </div>
                  </div>
                )}

                {/* Run Simulation Button */}
                <button
                  onClick={runSimulation}
                  disabled={isSimulating || (
                    (selectedScenario === 'vessel_breakdown' || selectedScenario === 'resource_change') && !selectedVessel
                  )}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary-500/80 hover:bg-primary-500 disabled:bg-white/10 disabled:text-white/30 text-white font-medium transition-colors"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Simulation
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Results */
          <div className="space-y-4">
            {/* Impact Summary */}
            <div className="bg-white/[0.02] rounded-lg border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-white">Impact Assessment</span>
              </div>

              {result.result.affectedProjects.length > 0 ? (
                <div className="space-y-2">
                  {result.result.affectedProjects.map((project, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-white/5">
                      <span className="text-sm text-white">{project.projectName}</span>
                      <div className="flex items-center gap-3 text-xs">
                        {project.delayDays > 0 && (
                          <div className="flex items-center gap-1 text-amber-400">
                            <Clock className="w-3 h-3" />
                            +{project.delayDays} days
                          </div>
                        )}
                        <div className={`flex items-center gap-1 ${
                          project.costImpact >= 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          <DollarSign className="w-3 h-3" />
                          {project.costImpact >= 0 ? '+' : ''}{(project.costImpact / 1000).toFixed(0)}k
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50">No significant project impact detected.</p>
              )}
            </div>

            {/* Alternative Vessels */}
            {result.result.alternativeVessels.length > 0 && (
              <div className="bg-white/[0.02] rounded-lg border border-white/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Ship className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-white">Alternative Vessels</span>
                </div>
                <div className="space-y-2">
                  {result.result.alternativeVessels.map((alt, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-white/5">
                      <div>
                        <span className="text-sm text-white">{alt.vesselName}</span>
                        <span className="text-xs text-white/40 ml-2">{alt.availability}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-12 h-2 rounded-full bg-white/10 overflow-hidden"
                          title={`${Math.round(alt.suitability)}% suitable`}
                        >
                          <div 
                            className={`h-full rounded-full ${
                              alt.suitability >= 80 ? 'bg-emerald-500' :
                              alt.suitability >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${alt.suitability}%` }}
                          />
                        </div>
                        <span className="text-xs text-white/50 w-8">
                          {Math.round(alt.suitability)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Actions */}
            <div className="bg-white/[0.02] rounded-lg border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-white">Recommended Actions</span>
              </div>
              <div className="space-y-2">
                {result.result.suggestedActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/70">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetSimulation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Run Another Simulation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

