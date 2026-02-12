'use client';

import { Vessel } from '@/lib/supabase';
import type { NMDCAlert as LegacyAlert } from '@/lib/nmdc/alerts';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2,
  Clock,
  Wrench,
  Fuel,
  Heart,
  Thermometer,
  Anchor,
} from 'lucide-react';

interface VesselAlertsPanelProps {
  vessel: Vessel;
  alerts: LegacyAlert[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  info: {
    icon: Info,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
  },
};

// Generate predictive alerts based on vessel condition
function generatePredictiveAlerts(vessel: Vessel): Array<{
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  prediction: string;
}> {
  const alerts: Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    prediction: string;
  }> = [];

  // Fuel level predictions
  if ((vessel.fuel_level ?? 100) < 20) {
    alerts.push({
      type: 'fuel',
      severity: 'critical',
      title: 'Critical Fuel Level',
      message: `Fuel at ${vessel.fuel_level?.toFixed(0)}%. Immediate refueling required.`,
      prediction: 'Estimated range: 2-3 hours at current consumption rate',
    });
  } else if ((vessel.fuel_level ?? 100) < 40) {
    alerts.push({
      type: 'fuel',
      severity: 'warning',
      title: 'Low Fuel Warning',
      message: `Fuel at ${vessel.fuel_level?.toFixed(0)}%. Plan refueling soon.`,
      prediction: 'Estimated range: 8-12 hours at current consumption rate',
    });
  }

  // Health score predictions
  if ((vessel.health_score ?? 100) < 60) {
    alerts.push({
      type: 'health',
      severity: 'critical',
      title: 'Critical Health Score',
      message: `Vessel health at ${vessel.health_score}%. Multiple systems need attention.`,
      prediction: 'Risk of operational failure within 24-48 hours if not addressed',
    });
  } else if ((vessel.health_score ?? 100) < 75) {
    alerts.push({
      type: 'health',
      severity: 'warning',
      title: 'Degraded Health Score',
      message: `Vessel health at ${vessel.health_score}%. Maintenance recommended.`,
      prediction: 'Schedule maintenance within next 5-7 days',
    });
  }

  // Hull fouling - use health score as proxy since hull_fouling_idx doesn't exist
  const healthScore = vessel.health_score ?? 100;
  if (healthScore < 70) {
    alerts.push({
      type: 'hull',
      severity: 'warning',
      title: 'Vessel Maintenance Advisory',
      message: `Health score at ${healthScore}%. Maintenance inspection recommended.`,
      prediction: 'Proactive inspection may prevent operational delays.',
    });
  }

  // Low speed advisory - check if vessel might be in standby
  if ((vessel.speed ?? 0) === 0 && vessel.status === 'operational') {
    alerts.push({
      type: 'thruster',
      severity: 'info',
      title: 'Vessel in Standby',
      message: 'Vessel stationary but marked as operational.',
      prediction: 'Confirm vessel status or update to standby mode.',
    });
  }

  // No issues
  if (alerts.length === 0) {
    alerts.push({
      type: 'status',
      severity: 'info',
      title: 'All Systems Normal',
      message: 'No alerts or warnings for this vessel.',
      prediction: 'Continue normal operations. Next scheduled maintenance check in 14 days.',
    });
  }

  return alerts;
}

export function VesselAlertsPanel({ vessel, alerts, onAcknowledge, onResolve }: VesselAlertsPanelProps) {
  // Filter alerts for this vessel
  const vesselAlerts = alerts.filter(a => a.vesselId === vessel.id);
  
  // Generate predictive alerts
  const predictiveAlerts = generatePredictiveAlerts(vessel);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'fuel': return Fuel;
      case 'health': return Heart;
      case 'hull': return Anchor;
      case 'engine': return Thermometer;
      case 'thruster': return Wrench;
      default: return Info;
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Vessel Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">{vessel.name}</h3>
          <p className="text-xs text-white/50">Alerts & Predictions</p>
        </div>
      </div>

      {/* Active Alerts */}
      {vesselAlerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Active Alerts ({vesselAlerts.length})
          </h4>
          
          {vesselAlerts.map((alert) => {
            const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info;
            const Icon = config.icon;
            
            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${config.bg} ${config.border}`}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className={`font-medium text-sm ${config.color}`}>
                        {alert.title}
                      </h5>
                      <span className="text-[10px] text-white/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 mt-1">{alert.description}</p>
                    
                    <div className="flex gap-2 mt-2">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => onAcknowledge(alert.id)}
                          className="text-xs px-2 py-1 rounded bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => onResolve(alert.id)}
                        className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Predictive Alerts */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          AI Predictions
        </h4>
        
        {predictiveAlerts.map((alert, i) => {
          const config = severityConfig[alert.severity];
          const Icon = getAlertIcon(alert.type);
          
          return (
            <div
              key={i}
              className={`p-3 rounded-lg border ${config.bg} ${config.border}`}
            >
              <div className="flex items-start gap-2">
                <Icon className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <h5 className={`font-medium text-sm ${config.color}`}>
                    {alert.title}
                  </h5>
                  <p className="text-xs text-white/60 mt-1">{alert.message}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-white/40">
                    <Clock className="w-3 h-3" />
                    <span>{alert.prediction}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Maintenance Schedule */}
      <div className="glass-panel p-4">
        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          Recommended Actions
        </h4>
        
        <div className="space-y-2">
          {(vessel.fuel_level ?? 100) < 50 && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span className="text-white/70">Schedule refueling at next port</span>
            </div>
          )}
          {(vessel.health_score ?? 100) < 80 && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span className="text-white/70">Book maintenance inspection</span>
            </div>
          )}
          {(vessel.health_score ?? 100) < 70 && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span className="text-white/70">Plan hull inspection</span>
            </div>
          )}
          {(vessel.health_score ?? 100) >= 80 && (vessel.fuel_level ?? 100) >= 50 && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-white/70">No immediate actions required</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

