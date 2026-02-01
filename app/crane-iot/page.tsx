'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Activity,
  Camera,
  Weight,
  Gauge,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Shield,
  Eye,
  Play,
  RefreshCw,
  ChevronRight,
  Thermometer,
  Waves,
  BarChart3,
  Brain,
  Users,
  Package,
  Timer,
  Fuel,
} from 'lucide-react';
import {
  CraneAsset,
  CraneSensor,
  LiftCycle,
  MaterialItem,
  SafetyEvent,
} from '@/lib/crane-iot/types';
import {
  generateCraneAsset,
  generateRecentLifts,
  generateRecentItems,
  generateSafetyEvents,
  updateSensorValue,
  generateProductionTarget,
} from '@/lib/crane-iot/mock-data';
import { AIPredictiveMaintenance } from '@/app/components/PredictiveMaintenance';

// Sensor card component
function SensorCard({ sensor }: { sensor: CraneSensor }) {
  const percentage = ((sensor.value - sensor.minValue) / (sensor.maxValue - sensor.minValue)) * 100;
  const isInRange = sensor.value >= sensor.normalRange.min && sensor.value <= sensor.normalRange.max;
  
  const statusColors = {
    normal: 'text-emerald-400',
    warning: 'text-amber-400',
    critical: 'text-rose-400',
  };

  const statusBg = {
    normal: 'bg-emerald-500/20',
    warning: 'bg-amber-500/20',
    critical: 'bg-rose-500/20',
  };

  const icons: Record<string, React.ReactNode> = {
    load: <Weight className="w-4 h-4" />,
    angle: <Gauge className="w-4 h-4" />,
    speed: <TrendingUp className="w-4 h-4" />,
    vibration: <Waves className="w-4 h-4" />,
    proximity: <Eye className="w-4 h-4" />,
    accelerometer: <Activity className="w-4 h-4" />,
  };

  return (
    <div className={`p-3 rounded-xl border transition-all ${
      sensor.status === 'critical' ? 'bg-rose-500/10 border-rose-500/30' :
      sensor.status === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
      'bg-white/[0.02] border-white/10 hover:border-white/20'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={statusColors[sensor.status]}>{icons[sensor.type]}</span>
          <span className="text-xs text-white/60">{sensor.name}</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusBg[sensor.status]} ${statusColors[sensor.status]}`}>
          {sensor.status}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold ${statusColors[sensor.status]}`}>
          {sensor.value.toFixed(1)}
        </span>
        <span className="text-xs text-white/40">{sensor.unit}</span>
      </div>
      <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            sensor.status === 'critical' ? 'bg-rose-500' :
            sensor.status === 'warning' ? 'bg-amber-500' :
            'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-white/30">
        <span>{sensor.normalRange.min}</span>
        <span>Normal range</span>
        <span>{sensor.normalRange.max}</span>
      </div>
    </div>
  );
}

// Camera feed component - awaiting feed placeholder
function CameraFeedCard({ 
  camera, 
  isLarge = false,
  onSelect 
}: { 
  camera: { id: string; name: string; location: string; isActive: boolean; aiEnabled: boolean; detections: number };
  isLarge?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div 
      className={`relative rounded-xl overflow-hidden border border-white/10 group cursor-pointer transition-all hover:border-cyan-500/50 ${
        isLarge ? 'aspect-video' : 'aspect-[4/3]'
      }`}
      onClick={onSelect}
    >
      {/* Empty feed background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Camera className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-sm text-white/40">Awaiting feed</p>
          <p className="text-xs text-white/25 mt-1">{camera.name}</p>
        </div>
      </div>

      {/* Scanline effect */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
      }} />

      {/* Camera info bar at bottom */}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {camera.isActive ? (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] text-amber-400">Connecting...</span>
            </span>
          ) : (
            <span className="text-[10px] text-white/40">Offline</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {camera.aiEnabled && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/20">
              <Brain className="w-2.5 h-2.5 text-violet-400" />
              <span className="text-[9px] text-violet-300">AI</span>
            </div>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="absolute top-2 left-2 text-[10px] font-mono text-white/30">
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

// Lift cycle timeline component with expandable details
function LiftTimeline({ 
  lifts, 
  highlightedLiftId, 
  onHighlightClear 
}: { 
  lifts: LiftCycle[]; 
  highlightedLiftId?: string | null;
  onHighlightClear?: () => void;
}) {
  const [expandedLift, setExpandedLift] = useState<string | null>(null);

  // Auto-expand and scroll to highlighted lift
  useEffect(() => {
    if (highlightedLiftId) {
      setExpandedLift(highlightedLiftId);
    }
  }, [highlightedLiftId]);

  return (
    <div className="space-y-2">
      {lifts.slice(0, 5).map((lift) => {
        const isHighlighted = highlightedLiftId === lift.id;
        const isExpanded = expandedLift === lift.id;
        const hasWarnings = lift.warnings.length > 0;
        
        return (
        <div
          key={lift.id}
            id={`lift-${lift.id}`}
            onClick={() => {
              setExpandedLift(isExpanded ? null : lift.id);
              if (isHighlighted && onHighlightClear) onHighlightClear();
            }}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              isHighlighted
                ? 'bg-violet-500/20 border-violet-500/50 ring-2 ring-violet-500/30 animate-pulse'
                : lift.status === 'in_progress'
              ? 'bg-cyan-500/10 border-cyan-500/30 animate-pulse'
                  : hasWarnings 
                    ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
          }`}
        >
            {/* Main row - always visible */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {lift.status === 'in_progress' ? (
                <Activity className="w-4 h-4 text-cyan-400" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-sm font-medium text-white">{lift.itemClassification}</span>
            </div>
              <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">
              {lift.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
                <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>
          </div>
            
            {/* Summary metrics */}
          <div className="flex items-center gap-4 text-xs text-white/60">
            <span className="flex items-center gap-1">
              <Weight className="w-3 h-3" />
              {(lift.loadWeight / 1000).toFixed(1)}t
            </span>
            <span className="flex items-center gap-1">
              <Timer className="w-3 h-3" />
              {lift.duration}s
            </span>
            <span className={`flex items-center gap-1 ${
              lift.safetyScore >= 90 ? 'text-emerald-400' : 
              lift.safetyScore >= 80 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              <Shield className="w-3 h-3" />
              {lift.safetyScore}%
            </span>
              {hasWarnings && (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {lift.warnings.length}
              </span>
            )}
          </div>

            {/* Expanded details */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                {/* Warnings section - most important */}
                {hasWarnings && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Safety Warnings ({lift.warnings.length})
                    </div>
                    <div className="space-y-1">
                      {lift.warnings.map((warning, idx) => (
                        <div 
                          key={idx}
                          className="text-xs bg-amber-500/10 text-amber-300 px-2.5 py-1.5 rounded-lg border border-amber-500/20"
                        >
                          {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lift details grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 rounded-lg p-2">
                    <span className="text-white/40 block mb-0.5">Operator</span>
                    <span className="text-white">{lift.operatorId}</span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <span className="text-white/40 block mb-0.5">AI Confidence</span>
                    <span className={`font-medium ${
                      lift.aiConfidence >= 90 ? 'text-emerald-400' : 
                      lift.aiConfidence >= 75 ? 'text-amber-400' : 'text-rose-400'
                    }`}>{lift.aiConfidence}%</span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <span className="text-white/40 block mb-0.5">From</span>
                    <span className="text-white">{lift.pickupZone}</span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <span className="text-white/40 block mb-0.5">To</span>
                    <span className="text-white">{lift.dropZone}</span>
                  </div>
                </div>

                {/* Safety score breakdown */}
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-white/60">Safety Score Breakdown</span>
                    <span className={`text-sm font-bold ${
                      lift.safetyScore >= 90 ? 'text-emerald-400' : 
                      lift.safetyScore >= 80 ? 'text-amber-400' : 'text-rose-400'
                    }`}>{lift.safetyScore}% {lift.safetyScore >= 90 ? 'Excellent' : lift.safetyScore >= 80 ? 'Acceptable' : 'Needs Review'}</span>
                  </div>
                  
                  {/* Individual factor scores */}
                  {lift.safetyBreakdown && (
                    <div className="space-y-2">
                      {[
                        { label: 'Load Control', value: lift.safetyBreakdown.loadControl, icon: '⚖️' },
                        { label: 'Speed Compliance', value: lift.safetyBreakdown.speedCompliance, icon: '⚡' },
                        { label: 'Zone Safety', value: lift.safetyBreakdown.zoneSafety, icon: '🚧' },
                        { label: 'Rigging Quality', value: lift.safetyBreakdown.riggingQuality, icon: '🔗' },
                        { label: 'Communication', value: lift.safetyBreakdown.communication, icon: '📡' },
                      ].map((factor) => (
                        <div key={factor.label} className="flex items-center gap-2">
                          <span className="text-[10px] w-4">{factor.icon}</span>
                          <span className="text-[10px] text-white/50 w-24">{factor.label}</span>
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                factor.value >= 90 ? 'bg-emerald-500' : 
                                factor.value >= 80 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${factor.value}%` }}
                            />
                          </div>
                          <span className={`text-[10px] w-8 text-right font-mono ${
                            factor.value >= 90 ? 'text-emerald-400' : 
                            factor.value >= 80 ? 'text-amber-400' : 'text-rose-400'
                          }`}>{factor.value}%</span>
        </div>
      ))}
                    </div>
                  )}
                </div>

                {/* Status and timing */}
                <div className="flex items-center justify-between text-xs text-white/40">
                  <span>Status: <span className={`font-medium ${
                    lift.status === 'completed' ? 'text-emerald-400' : 
                    lift.status === 'in_progress' ? 'text-cyan-400' : 'text-rose-400'
                  }`}>{lift.status.replace('_', ' ')}</span></span>
                  {lift.endTime && (
                    <span>Completed: {lift.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Material classification component
function MaterialClassification({ items }: { items: MaterialItem[] }) {
  const categoryColors: Record<string, string> = {
    steel: 'bg-blue-500',
    concrete: 'bg-gray-500',
    pipe: 'bg-emerald-500',
    equipment: 'bg-amber-500',
    container: 'bg-violet-500',
    aggregate: 'bg-orange-500',
    other: 'bg-slate-500',
  };

  return (
    <div className="space-y-2">
      {items.slice(0, 4).map((item) => (
        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <div className={`w-8 h-8 rounded-lg ${categoryColors[item.category]} bg-opacity-20 flex items-center justify-center`}>
            <Package className={`w-4 h-4 ${categoryColors[item.category].replace('bg-', 'text-')}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{item.classification}</p>
            <p className="text-xs text-white/50">{(item.weight / 1000).toFixed(2)}t · {item.confidence}% conf</p>
          </div>
          <span className="text-[10px] text-white/30">
            {item.detectedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}
    </div>
  );
}

// Safety events component
function SafetyEventsPanel({ 
  events, 
  onLiftClick 
}: { 
  events: SafetyEvent[]; 
  onLiftClick?: (liftId: string) => void;
}) {
  const severityColors = {
    low: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    medium: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    high: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    critical: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
  };

  const typeIcons: Record<string, React.ReactNode> = {
    near_miss: <AlertTriangle className="w-4 h-4" />,
    unsafe_behavior: <Users className="w-4 h-4" />,
    zone_violation: <Shield className="w-4 h-4" />,
    overload: <Weight className="w-4 h-4" />,
    speed_violation: <TrendingUp className="w-4 h-4" />,
    fatigue_warning: <Clock className="w-4 h-4" />,
  };

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div
          key={event.id}
          onClick={() => {
            if (event.liftId && onLiftClick) {
              onLiftClick(event.liftId);
            }
          }}
          className={`p-3 rounded-lg border transition-all ${severityColors[event.severity]} ${
            !event.resolved ? 'animate-pulse' : ''
          } ${event.liftId ? 'cursor-pointer hover:ring-2 hover:ring-violet-500/30' : ''}`}
        >
          <div className="flex items-start gap-2">
            {typeIcons[event.type]}
            <div className="flex-1">
              <p className="text-sm font-medium">{event.description}</p>
              
              {/* Lift reference badge */}
              {event.liftDetails && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-[10px] text-violet-300">
                    <Package className="w-3 h-3" />
                    {event.liftDetails.itemClassification}
                  </span>
                  <span className="text-[10px] text-white/40">
                    {(event.liftDetails.loadWeight / 1000).toFixed(1)}t · {event.liftDetails.pickupZone} → {event.liftDetails.dropZone}
                  </span>
                </div>
              )}
              
              <p className="text-xs opacity-70 mt-1">
                {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {event.resolved && ' · Resolved'}
                {event.liftId && (
                  <span className="ml-2 text-violet-300">Click to view lift →</span>
                )}
              </p>
              
              {event.aiRecommendation && (
                <div className="mt-2 p-2 rounded bg-black/20 border border-white/5">
                  <p className="text-xs flex items-center gap-1">
                    <Brain className="w-3 h-3 text-violet-400" />
                    <span className="text-white/70">{event.aiRecommendation}</span>
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

// Main Dashboard
export default function CraneIoTDashboard() {
  const router = useRouter();
  const [crane, setCrane] = useState<CraneAsset | null>(null);
  const [lifts, setLifts] = useState<LiftCycle[]>([]);
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [safetyEvents, setSafetyEvents] = useState<SafetyEvent[]>([]);
  const [productionTarget, setProductionTarget] = useState(generateProductionTarget());
  const [selectedCamera, setSelectedCamera] = useState<number>(0);
  const [isLive, setIsLive] = useState(true);
  const [highlightedLiftId, setHighlightedLiftId] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    setCrane(generateCraneAsset());
    const generatedLifts = generateRecentLifts(10);
    setLifts(generatedLifts);
    setItems(generateRecentItems(8));
    setSafetyEvents(generateSafetyEvents(generatedLifts));
  }, []);

  // Real-time sensor updates
  useEffect(() => {
    if (!isLive || !crane) return;

    const interval = setInterval(() => {
      setCrane(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sensors: prev.sensors.map(updateSensorValue),
          metrics: {
            ...prev.metrics,
            utilizationRate: prev.metrics.utilizationRate + (Math.random() - 0.5) * 0.5,
            productionRate: prev.metrics.productionRate + (Math.random() - 0.5) * 0.1,
          }
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, crane]);

  if (!crane) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const dailyProgress = (productionTarget.currentDaily / productionTarget.daily) * 100;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-[2000px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/70" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-amber-500/20 border border-white/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Crane IoT Dashboard</h1>
                  <p className="text-sm text-white/50">{crane.name} · {crane.location}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Status indicator */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  crane.status === 'operational' ? 'bg-emerald-400 animate-pulse' :
                  crane.status === 'maintenance' ? 'bg-amber-400' : 'bg-gray-400'
                }`} />
                <span className="text-sm text-white capitalize">{crane.status}</span>
              </div>

              {/* Live toggle */}
              <button
                onClick={() => setIsLive(!isLive)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isLive 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-white/5 text-white/60 border border-white/10'
                }`}
              >
                {isLive ? <Play className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                {isLive ? 'Live' : 'Paused'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[2000px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Cameras & Sensors */}
          <div className="col-span-4 space-y-6">
            {/* Primary Camera Feed */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  Live Camera Feeds
                </h2>
                <span className="text-xs text-white/40">{crane.cameras.length} active</span>
              </div>
              
              {/* Main camera */}
              <CameraFeedCard
                camera={crane.cameras[selectedCamera]}
                isLarge
              />

              {/* Camera thumbnails */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {crane.cameras.map((cam, index) => (
                  <button
                    key={cam.id}
                    onClick={() => setSelectedCamera(index)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      selectedCamera === index 
                        ? 'border-cyan-500' 
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="aspect-[4/3] bg-slate-900 flex items-center justify-center">
                      <Camera className="w-3 h-3 text-white/20" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5">
                      <p className="text-[7px] text-white/60 truncate text-center">{cam.name}</p>
                    </div>
                    {cam.isActive && (
                      <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sensor Grid */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Gauge className="w-4 h-4 text-amber-400" />
                Hook IoT Sensors
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {crane.sensors.map((sensor) => (
                  <SensorCard key={sensor.id} sensor={sensor} />
                ))}
              </div>
            </div>
          </div>

          {/* Center Column - Production & Lifts */}
          <div className="col-span-5 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs text-emerald-400/60">Today</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400">{productionTarget.currentDaily}</p>
                <p className="text-xs text-white/50">of {productionTarget.daily} lifts</p>
                <div className="mt-2 h-1.5 bg-emerald-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${dailyProgress}%` }} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs text-cyan-400/60">Rate</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{crane.metrics.productionRate.toFixed(1)}</p>
                <p className="text-xs text-white/50">lifts/hour</p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <Weight className="w-5 h-5 text-amber-400" />
                  <span className="text-xs text-amber-400/60">Total</span>
                </div>
                <p className="text-2xl font-bold text-amber-400">{crane.metrics.totalTonnage.toLocaleString()}</p>
                <p className="text-xs text-white/50">tons moved</p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-violet-400" />
                  <span className="text-xs text-violet-400/60">Efficiency</span>
                </div>
                <p className="text-2xl font-bold text-violet-400">{crane.metrics.efficiency.toFixed(0)}%</p>
                <p className="text-xs text-white/50">utilization</p>
              </div>
            </div>

            {/* Lift Sequence Timeline */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Lift Cycle Timeline
                </h2>
                <span className="text-xs text-white/40">Showing last {Math.min(lifts.length, 5)} of {crane.metrics.completedLifts} today</span>
              </div>
              <LiftTimeline 
                lifts={lifts} 
                highlightedLiftId={highlightedLiftId}
                onHighlightClear={() => setHighlightedLiftId(null)}
              />
              
              {/* View history link */}
              <button 
                className="w-full mt-3 py-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg border border-dashed border-cyan-500/30 transition-all flex items-center justify-center gap-2"
                onClick={() => alert('Historical lift data would be available in the full analytics dashboard.')}
              >
                <Clock className="w-3 h-3" />
                View full history ({crane.metrics.completedLifts} lifts today · 423 this week)
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Material Classification */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-400" />
                  AI Item Classification
                </h2>
                <span className="text-xs text-violet-400 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Last {items.slice(0, 4).length} detections
                </span>
              </div>
              <MaterialClassification items={items.slice(0, 4)} />
            </div>

            {/* Operator Info */}
            {crane.operator && (
              <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                    {crane.operator.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{crane.operator.name}</p>
                    <p className="text-xs text-white/50 capitalize">{crane.operator.certificationLevel} Operator</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">{crane.operator.safetyScore}%</p>
                    <p className="text-xs text-white/50">Safety Score</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{crane.operator.hoursOnDuty}h</p>
                    <p className="text-xs text-white/50">On Duty</p>
                  </div>
                </div>
                {crane.operator.isFatigued && (
                  <div className="mt-3 p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-amber-300">Operator approaching fatigue threshold - rotation recommended</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Safety & AI Insights */}
          <div className="col-span-3 space-y-6">
            {/* Safety Events */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-400" />
                  Safety Monitoring
                </h2>
                <span className="text-xs text-rose-400 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  AI Active
                </span>
              </div>
              <SafetyEventsPanel 
                events={safetyEvents} 
                onLiftClick={(liftId) => {
                  setHighlightedLiftId(liftId);
                  // Scroll to the lift timeline section
                  const liftElement = document.getElementById(`lift-${liftId}`);
                  if (liftElement) {
                    liftElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
              />
            </div>

            {/* AI Predictive Maintenance */}
            <AIPredictiveMaintenance
              assetType="crane"
              assetId={crane.id}
              assetName={crane.name}
              equipment={[
                { 
                  id: 'wire-rope-main', 
                  name: 'Main Wire Rope', 
                  type: 'wire_rope',
                  currentHealth: 72,
                  cycleCount: lifts.length > 0 ? productionTarget.currentMonthly + Math.floor(Math.random() * 2000) + 8000 : 9500,
                  operatingHours: crane.metrics.operatingHours * 100 + 4200,
                },
                { 
                  id: 'hoist-motor-001', 
                  name: 'Main Hoist Motor', 
                  type: 'hoist_motor',
                  currentHealth: 85,
                  operatingHours: crane.metrics.operatingHours * 100 + 18500,
                  temperature: crane.sensors.find(s => s.type === 'vibration')?.value ? 58 + Math.random() * 15 : 62,
                  vibration: crane.sensors.find(s => s.type === 'vibration')?.value || 2.1,
                },
                { 
                  id: 'slew-bearing-001', 
                  name: 'Slew Bearing', 
                  type: 'slew_bearing',
                  currentHealth: crane.metrics.efficiency > 80 ? 88 : 65,
                  operatingHours: crane.metrics.operatingHours * 100 + 22000,
                  vibration: crane.sensors.find(s => s.type === 'accelerometer')?.value ? crane.sensors.find(s => s.type === 'accelerometer')!.value * 5 : 1.8,
                },
                { 
                  id: 'hydraulic-system-001', 
                  name: 'Hydraulic System', 
                  type: 'hydraulic_system',
                  currentHealth: 78,
                  operatingHours: crane.metrics.operatingHours * 100 + 15000,
                  temperature: 55 + Math.random() * 10,
                },
              ]}
              onResolve={(query) => {
                router.push(`/troubleshoot?q=${encodeURIComponent(query)}&asset=${encodeURIComponent(crane.name)}`)
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

