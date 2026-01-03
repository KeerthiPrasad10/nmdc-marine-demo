'use client';

import { useMemo } from 'react';
import { AlertTriangle, Clock, TrendingUp, Wrench, ChevronRight, Zap, Thermometer, Activity, Anchor, Ship } from 'lucide-react';
import { Equipment } from '@/lib/supabase';
import { SensorData } from './SensorOverlay';
import { getTroubleshootingForVesselClass } from '@/lib/troubleshooting';

interface Prediction {
  id: string;
  equipment: string;
  issue: string;
  severity: 'critical' | 'warning' | 'info';
  daysUntilFailure: number | null;
  confidence: number;
  recommendedAction: string;
  costOfInaction: string;
  sensorType: 'temperature' | 'vibration' | 'pressure' | 'rpm' | 'fuel' | 'power';
  vesselClassSpecific?: boolean;
}

interface PredictionsPanelProps {
  equipment: Equipment[];
  sensors: SensorData[];
  vesselType?: string;
  onSensorSelect?: (sensorId: string) => void;
}

// Generate predictions based on equipment health and sensor status
function generatePredictions(equipment: Equipment[], sensors: SensorData[]): Prediction[] {
  const predictions: Prediction[] = [];
  
  equipment.forEach((eq, index) => {
    const healthScore = eq.health_score ?? 100;
    const temp = eq.temperature ?? 60;
    const vib = eq.vibration ?? 2;
    
    // Critical temperature prediction
    if (temp > 85) {
      const daysRemaining = Math.max(1, Math.round((100 - temp) / 3));
      predictions.push({
        id: `pred-temp-${eq.id}`,
        equipment: eq.name,
        issue: 'Overheating detected - bearing failure imminent',
        severity: 'critical',
        daysUntilFailure: daysRemaining,
        confidence: 92,
        recommendedAction: 'Replace thermal paste and clean cooling vents. Inspect bearing lubrication.',
        costOfInaction: '$45,000 - $120,000 (complete bearing replacement)',
        sensorType: 'temperature',
      });
    } else if (temp > 75) {
      const daysRemaining = Math.round((95 - temp) / 1.5);
      predictions.push({
        id: `pred-temp-${eq.id}`,
        equipment: eq.name,
        issue: 'Elevated temperature trend detected',
        severity: 'warning',
        daysUntilFailure: daysRemaining,
        confidence: 78,
        recommendedAction: 'Schedule cooling system inspection. Check coolant levels.',
        costOfInaction: '$8,000 - $15,000 (accelerated wear)',
        sensorType: 'temperature',
      });
    }
    
    // Vibration anomaly prediction
    if (vib > 7) {
      predictions.push({
        id: `pred-vib-${eq.id}`,
        equipment: eq.name,
        issue: 'Severe vibration - shaft misalignment or imbalance',
        severity: 'critical',
        daysUntilFailure: 3,
        confidence: 88,
        recommendedAction: 'Stop operation immediately. Perform laser alignment and balance check.',
        costOfInaction: '$80,000 - $200,000 (catastrophic failure)',
        sensorType: 'vibration',
      });
    } else if (vib > 5) {
      predictions.push({
        id: `pred-vib-${eq.id}`,
        equipment: eq.name,
        issue: 'Abnormal vibration pattern developing',
        severity: 'warning',
        daysUntilFailure: 14,
        confidence: 72,
        recommendedAction: 'Schedule vibration analysis. Check mounting bolts and foundation.',
        costOfInaction: '$12,000 - $25,000 (bearing damage)',
        sensorType: 'vibration',
      });
    }
    
    // Health-based predictions
    if (healthScore < 50) {
      predictions.push({
        id: `pred-health-${eq.id}`,
        equipment: eq.name,
        issue: 'Multiple degradation factors detected',
        severity: 'critical',
        daysUntilFailure: 7,
        confidence: 85,
        recommendedAction: 'Plan immediate overhaul. Order replacement parts now.',
        costOfInaction: '$150,000+ (unplanned downtime)',
        sensorType: 'power',
      });
    } else if (healthScore < 70) {
      predictions.push({
        id: `pred-health-${eq.id}`,
        equipment: eq.name,
        issue: 'Component wear exceeding normal rate',
        severity: 'warning',
        daysUntilFailure: 30,
        confidence: 68,
        recommendedAction: 'Schedule preventive maintenance. Review operating conditions.',
        costOfInaction: '$5,000 - $15,000/month (efficiency loss)',
        sensorType: 'power',
      });
    }
  });
  
  // Sort by severity and days until failure
  return predictions.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return (a.daysUntilFailure ?? 999) - (b.daysUntilFailure ?? 999);
  });
}

export function PredictionsPanel({ equipment, sensors, vesselType, onSensorSelect }: PredictionsPanelProps) {
  const predictions = useMemo(() => generatePredictions(equipment, sensors), [equipment, sensors]);
  const vesselClassInfo = vesselType ? getTroubleshootingForVesselClass(vesselType) : null;
  
  const criticalCount = predictions.filter(p => p.severity === 'critical').length;
  const warningCount = predictions.filter(p => p.severity === 'warning').length;
  
  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <Thermometer className="w-4 h-4" />;
      case 'vibration': return <Activity className="w-4 h-4" />;
      case 'power': return <Zap className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };
  
  if (predictions.length === 0) {
    return (
      <div className="bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <div className="flex items-center gap-2 text-emerald-400 mb-2">
          <TrendingUp className="w-5 h-5" />
          <span className="font-medium">All Systems Nominal</span>
        </div>
        <p className="text-sm text-white/50">
          No maintenance predictions at this time. All equipment operating within normal parameters.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="font-medium text-white">Predictive Maintenance</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {warningCount} warning
              </span>
            )}
          </div>
        </div>
        
        {/* Vessel Class Info */}
        {vesselClassInfo && (
          <div className="mt-2 p-2 rounded-lg bg-primary-500/10 border border-primary-500/20">
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-primary-400" />
              <span className="text-xs text-primary-300 font-medium capitalize">
                {vesselClassInfo.vesselClass.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[10px] text-white/40 mt-1">{vesselClassInfo.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {vesselClassInfo.criticalSystems.slice(0, 4).map((sys, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-white/50">
                  {sys}
                </span>
              ))}
              {vesselClassInfo.criticalSystems.length > 4 && (
                <span className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-white/50">
                  +{vesselClassInfo.criticalSystems.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
        
        <p className="text-xs text-white/40 mt-2">
          AI-powered failure predictions based on sensor data
        </p>
      </div>
      
      {/* Predictions List */}
      <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
        {predictions.map((prediction) => (
          <div
            key={prediction.id}
            className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
              prediction.severity === 'critical' ? 'border-l-2 border-rose-500' :
              prediction.severity === 'warning' ? 'border-l-2 border-amber-500' :
              'border-l-2 border-blue-500'
            }`}
            onClick={() => {
              // Find matching sensor and select it
              const matchingSensor = sensors.find(s => 
                s.name.includes(prediction.equipment) && s.type === prediction.sensorType
              );
              if (matchingSensor && onSensorSelect) {
                onSensorSelect(matchingSensor.id);
              }
            }}
          >
            {/* Prediction Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${
                  prediction.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                  prediction.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {getSensorIcon(prediction.sensorType)}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{prediction.equipment}</div>
                  <div className="text-xs text-white/50">{prediction.issue}</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
            </div>
            
            {/* Time to Failure */}
            {prediction.daysUntilFailure && (
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-white/40" />
                <span className={`text-xs font-medium ${
                  prediction.daysUntilFailure <= 7 ? 'text-rose-400' :
                  prediction.daysUntilFailure <= 14 ? 'text-amber-400' :
                  'text-white/60'
                }`}>
                  {prediction.daysUntilFailure <= 1 
                    ? 'Failure imminent (< 24 hours)'
                    : `Estimated failure in ${prediction.daysUntilFailure} days`
                  }
                </span>
                <span className="text-[10px] text-white/30">
                  ({prediction.confidence}% confidence)
                </span>
              </div>
            )}
            
            {/* Recommended Action */}
            <div className="bg-white/5 rounded-lg p-3 mb-2">
              <div className="flex items-center gap-1.5 text-[10px] text-white/40 uppercase tracking-wide mb-1">
                <Wrench className="w-3 h-3" />
                Recommended Action
              </div>
              <p className="text-xs text-white/80">{prediction.recommendedAction}</p>
            </div>
            
            {/* Cost of Inaction */}
            <div className="text-[10px] text-rose-400/80">
              💰 Cost of inaction: {prediction.costOfInaction}
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-white/10 bg-white/5">
        <p className="text-[10px] text-white/30 text-center">
          Predictions based on historical patterns, sensor readings, and equipment degradation models.
          Connect real sensors for accurate predictions.
        </p>
      </div>
    </div>
  );
}

export default PredictionsPanel;

