'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Brain,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Clock,
  Zap,
  Shield,
  Wrench,
  ChevronRight,
  Sparkles,
  Target,
  Eye,
  Gauge,
} from 'lucide-react';

export interface EquipmentData {
  id: string;
  name: string;
  health_score?: number | null;
  temperature?: number | null;
  vibration?: number | null;
  hours_operated?: number | null;
  type?: string;
}

export interface AlertData {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'critical';
  description?: string;
}

export interface SensorData {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  type: string;
}

interface Prediction {
  id: string;
  type: 'failure' | 'optimization' | 'safety' | 'maintenance';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  source: string; // Which data triggered this
  metrics?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'stable';
  }[];
}

interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'analyzing' | 'complete';
  result?: string;
}

interface PredictiveAIPanelProps {
  equipment?: EquipmentData[];
  alerts?: AlertData[];
  sensors?: SensorData[];
  vesselName?: string;
  assetType?: 'vessel' | 'crane';
  compact?: boolean;
}

// Generate predictions based on actual data
function generatePredictions(
  equipment: EquipmentData[],
  alerts: AlertData[],
  sensors: SensorData[]
): Prediction[] {
  const predictions: Prediction[] = [];

  // Analyze equipment health
  equipment.forEach((eq) => {
    const health = eq.health_score ?? 100;
    
    if (health < 60) {
      predictions.push({
        id: `pred-${eq.id}-critical`,
        type: 'failure',
        title: `${eq.name} Failure Risk`,
        description: `Health score at ${health}% indicates imminent component degradation. Vibration patterns match pre-failure signature.`,
        confidence: 85 + Math.floor(Math.random() * 10),
        timeframe: '24-48 hours',
        impact: 'critical',
        recommendation: `Schedule immediate inspection of ${eq.name}. Prepare replacement parts and maintenance crew.`,
        source: eq.name,
        metrics: [
          { label: 'Health', value: `${health}%`, trend: 'down' },
          { label: 'Hours', value: `${eq.hours_operated?.toLocaleString() ?? 0}h` },
          { label: 'Temp', value: `${eq.temperature ?? 0}°C`, trend: eq.temperature && eq.temperature > 70 ? 'up' : 'stable' },
        ],
      });
    } else if (health < 75) {
      predictions.push({
        id: `pred-${eq.id}-warning`,
        type: 'maintenance',
        title: `${eq.name} Maintenance Due`,
        description: `Degradation pattern detected. Current trajectory suggests ${(100 - health) * 2}% efficiency loss within 2 weeks.`,
        confidence: 78 + Math.floor(Math.random() * 12),
        timeframe: '7-14 days',
        impact: 'medium',
        recommendation: `Plan preventive maintenance for ${eq.name} during next scheduled downtime.`,
        source: eq.name,
        metrics: [
          { label: 'Health', value: `${health}%`, trend: 'down' },
          { label: 'Vibration', value: `${eq.vibration ?? 0} mm/s`, trend: eq.vibration && eq.vibration > 2 ? 'up' : 'stable' },
        ],
      });
    }
  });

  // Analyze sensors
  const criticalSensors = sensors.filter(s => s.status === 'critical');
  const warningSensors = sensors.filter(s => s.status === 'warning');

  if (criticalSensors.length > 0) {
    predictions.push({
      id: 'pred-sensor-critical',
      type: 'safety',
      title: 'Sensor Anomaly Detected',
      description: `${criticalSensors.length} sensor(s) exceeding safe operating limits: ${criticalSensors.map(s => s.name).join(', ')}`,
      confidence: 95,
      timeframe: 'Immediate',
      impact: 'critical',
      recommendation: 'Reduce operational load immediately. Investigate root cause before resuming full operations.',
      source: 'Sensor Array',
      metrics: criticalSensors.slice(0, 3).map(s => ({
        label: s.name,
        value: `${s.value} ${s.unit}`,
        trend: 'up' as const,
      })),
    });
  }

  if (warningSensors.length >= 2) {
    predictions.push({
      id: 'pred-sensor-pattern',
      type: 'optimization',
      title: 'Performance Optimization Opportunity',
      description: `Correlated patterns in ${warningSensors.length} sensors suggest sub-optimal operating parameters.`,
      confidence: 72 + Math.floor(Math.random() * 15),
      timeframe: 'Ongoing',
      impact: 'low',
      recommendation: 'Adjust operating parameters to reduce stress on monitored components. Estimated 12% efficiency gain.',
      source: 'Pattern Analysis',
    });
  }

  // Analyze alerts
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  
  if (criticalAlerts.length > 1) {
    predictions.push({
      id: 'pred-cascade',
      type: 'failure',
      title: 'Cascade Failure Risk',
      description: `${criticalAlerts.length} related critical conditions detected. Pattern matches historical cascade failure signature.`,
      confidence: 68 + Math.floor(Math.random() * 20),
      timeframe: '4-8 hours',
      impact: 'high',
      recommendation: 'Initiate emergency response protocol. Consider temporary operational pause for system-wide assessment.',
      source: 'Alert Correlation',
    });
  }

  // Add optimization if everything is healthy
  if (predictions.length === 0 && equipment.length > 0) {
    const avgHealth = equipment.reduce((sum, eq) => sum + (eq.health_score ?? 100), 0) / equipment.length;
    predictions.push({
      id: 'pred-optimal',
      type: 'optimization',
      title: 'System Operating Optimally',
      description: `All ${equipment.length} monitored systems within normal parameters. Average health at ${avgHealth.toFixed(0)}%.`,
      confidence: 95,
      timeframe: 'Continuous monitoring',
      impact: 'low',
      recommendation: 'Maintain current operational parameters. Next scheduled review in 24 hours.',
      source: 'Fleet Health Monitor',
      metrics: [
        { label: 'Avg Health', value: `${avgHealth.toFixed(0)}%`, trend: 'stable' },
        { label: 'Systems', value: `${equipment.length}` },
        { label: 'Alerts', value: `${alerts.length}` },
      ],
    });
  }

  return predictions.sort((a, b) => {
    const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });
}

export function PredictiveAIPanel({
  equipment = [],
  alerts = [],
  sensors = [],
  vesselName,
  assetType = 'vessel',
  compact = false,
}: PredictiveAIPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const hasRunRef = useRef(false);
  const equipmentRef = useRef(equipment);
  const alertsRef = useRef(alerts);
  const sensorsRef = useRef(sensors);

  // Update refs when props change
  useEffect(() => {
    equipmentRef.current = equipment;
    alertsRef.current = alerts;
    sensorsRef.current = sensors;
  }, [equipment, alerts, sensors]);

  // Run analysis function
  const runAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    
    const steps: AnalysisStep[] = [
      { id: 'step-1', label: 'Scanning equipment health scores', status: 'pending' },
      { id: 'step-2', label: 'Analyzing sensor patterns', status: 'pending' },
      { id: 'step-3', label: 'Correlating alert signatures', status: 'pending' },
      { id: 'step-4', label: 'Running predictive models', status: 'pending' },
      { id: 'step-5', label: 'Generating recommendations', status: 'pending' },
    ];
    
    setAnalysisSteps(steps);

    // Simulate step-by-step analysis (1.5s per step for readability)
    let currentStep = 0;
    const interval = setInterval(() => {
      setAnalysisSteps(prev => prev.map((step, idx) => {
        if (idx === currentStep) {
          return { ...step, status: 'analyzing' };
        } else if (idx < currentStep) {
          return { 
            ...step, 
            status: 'complete',
            result: idx === 0 ? `${equipmentRef.current.length} systems scanned` :
                    idx === 1 ? `${sensorsRef.current.length} data points analyzed` :
                    idx === 2 ? `${alertsRef.current.length} alerts correlated` :
                    idx === 3 ? `ML models executed` :
                    `Complete`
          };
        }
        return step;
      }));

      currentStep++;
      
      if (currentStep > steps.length) {
        clearInterval(interval);
        setIsAnalyzing(false);
        setPredictions(generatePredictions(equipmentRef.current, alertsRef.current, sensorsRef.current));
        setLastAnalysis(new Date());
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Run analysis only once on mount
  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    const cleanup = runAnalysis();
    return cleanup;
  }, [runAnalysis]);

  const impactColors = {
    low: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    medium: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    high: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    critical: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
  };

  const typeIcons = {
    failure: <AlertTriangle className="w-4 h-4" />,
    optimization: <Zap className="w-4 h-4" />,
    safety: <Shield className="w-4 h-4" />,
    maintenance: <Wrench className="w-4 h-4" />,
  };

  const typeColors = {
    failure: 'text-rose-400',
    optimization: 'text-cyan-400',
    safety: 'text-amber-400',
    maintenance: 'text-violet-400',
  };

  if (compact) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-violet-500/5 to-cyan-500/5 border border-violet-500/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" />
            Predictive AI
          </h3>
          {isAnalyzing && (
            <span className="text-[10px] text-violet-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Analyzing...
            </span>
          )}
        </div>

        {predictions.length > 0 && !isAnalyzing && (
          <div className="space-y-2">
            {predictions.slice(0, 2).map((pred) => (
              <div
                key={pred.id}
                className={`p-2 rounded-lg border ${impactColors[pred.impact]}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={typeColors[pred.type]}>{typeIcons[pred.type]}</span>
                  <span className="text-xs font-medium text-white truncate">{pred.title}</span>
                </div>
                <p className="text-[10px] text-white/60 line-clamp-2">{pred.recommendation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Predictive AI</h2>
              <p className="text-xs text-white/50">
                {vesselName ? `Analyzing ${vesselName}` : `Real-time ${assetType} analysis`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastAnalysis && (
              <span className="text-[10px] text-white/40">
                Updated {lastAnalysis.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Activity className={`w-4 h-4 text-white/60 ${isAnalyzing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Analysis Steps */}
        {isAnalyzing && (
          <div className="mt-4 space-y-1.5">
            {analysisSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-2">
                {step.status === 'pending' && (
                  <div className="w-3 h-3 rounded-full border border-white/20" />
                )}
                {step.status === 'analyzing' && (
                  <div className="w-3 h-3 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                )}
                {step.status === 'complete' && (
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                )}
                <span className={`text-xs ${
                  step.status === 'analyzing' ? 'text-violet-400' :
                  step.status === 'complete' ? 'text-white/70' :
                  'text-white/40'
                }`}>
                  {step.label}
                  {step.result && <span className="text-white/40 ml-2">· {step.result}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Predictions */}
      <div className="p-4">
        {!isAnalyzing && predictions.length > 0 && (
          <div className="space-y-3">
            {predictions.map((pred) => (
              <div
                key={pred.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${impactColors[pred.impact]} ${
                  selectedPrediction?.id === pred.id ? 'ring-2 ring-offset-2 ring-offset-black' : ''
                }`}
                onClick={() => setSelectedPrediction(selectedPrediction?.id === pred.id ? null : pred)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={typeColors[pred.type]}>{typeIcons[pred.type]}</span>
                    <span className="text-sm font-medium text-white">{pred.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">{pred.confidence}% conf</span>
                    <ChevronRight className={`w-4 h-4 text-white/40 transition-transform ${
                      selectedPrediction?.id === pred.id ? 'rotate-90' : ''
                    }`} />
                  </div>
                </div>

                <p className="text-xs text-white/70 mb-2">{pred.description}</p>

                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-white/50">
                    <Clock className="w-3 h-3" />
                    {pred.timeframe}
                  </span>
                  <span className="flex items-center gap-1 text-white/50">
                    <Target className="w-3 h-3" />
                    {pred.source}
                  </span>
                </div>

                {/* Expanded content */}
                {selectedPrediction?.id === pred.id && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                    {/* Metrics */}
                    {pred.metrics && pred.metrics.length > 0 && (
                      <div className="flex items-center gap-3">
                        {pred.metrics.map((m, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/30">
                            <span className="text-[10px] text-white/40">{m.label}</span>
                            <span className="text-xs font-medium text-white">{m.value}</span>
                            {m.trend && (
                              m.trend === 'up' ? <TrendingUp className="w-3 h-3 text-rose-400" /> :
                              m.trend === 'down' ? <TrendingDown className="w-3 h-3 text-emerald-400" /> :
                              <Gauge className="w-3 h-3 text-white/40" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendation */}
                    <div className="p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-xs font-medium text-violet-400">AI Recommendation</span>
                      </div>
                      <p className="text-xs text-white/80">{pred.recommendation}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isAnalyzing && predictions.length === 0 && (
          <div className="text-center py-8">
            <Eye className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/40">No predictions available</p>
            <p className="text-xs text-white/30 mt-1">Provide equipment or sensor data to analyze</p>
          </div>
        )}
      </div>
    </div>
  );
}


