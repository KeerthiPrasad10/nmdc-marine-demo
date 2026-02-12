/**
 * Generate alerts based on legacy marine fleet data
 * These are derived from actual fleet health/fuel values
 */

import type { FleetVessel } from '@/app/api/fleet/route';

export interface NMDCAlert {
  id: string;
  vesselId: string;
  vesselName: string;
  severity: 'critical' | 'warning' | 'info';
  type: 'equipment' | 'fuel' | 'navigation' | 'safety';
  title: string;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
}

/**
 * Generate alerts from fleet vessel data
 * Thresholds:
 * - Health < 75%: Warning
 * - Health < 60%: Critical
 * - Fuel < 50%: Warning  
 * - Fuel < 30%: Critical
 */
export function generateAlertsFromFleet(vessels: FleetVessel[]): NMDCAlert[] {
  const alerts: NMDCAlert[] = [];
  const now = new Date();

  for (const vessel of vessels) {
    const healthScore = vessel.healthScore ?? 100;
    const fuelLevel = vessel.fuelLevel ?? 100;

    // Critical health alerts (< 60%)
    if (healthScore < 60) {
      alerts.push({
        id: `health-critical-${vessel.mmsi}`,
        vesselId: vessel.mmsi,
        vesselName: vessel.name,
        severity: 'critical',
        type: 'equipment',
        title: 'Critical: Equipment Health Below Threshold',
        description: `Health score at ${healthScore}%. Immediate inspection required. Schedule maintenance within 24 hours.`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
      });
    }
    // Warning health alerts (60-75%)
    else if (healthScore < 75) {
      alerts.push({
        id: `health-warning-${vessel.mmsi}`,
        vesselId: vessel.mmsi,
        vesselName: vessel.name,
        severity: 'warning',
        type: 'equipment',
        title: 'Equipment Health Degraded',
        description: `Health score at ${healthScore}%. Schedule preventive maintenance within 7 days.`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
      });
    }

    // Critical fuel alerts (< 30%)
    if (fuelLevel < 30) {
      alerts.push({
        id: `fuel-critical-${vessel.mmsi}`,
        vesselId: vessel.mmsi,
        vesselName: vessel.name,
        severity: 'critical',
        type: 'fuel',
        title: 'Critical: Low Fuel Level',
        description: `Fuel level at ${fuelLevel}%. Immediate refueling required. Estimated ${Math.round(fuelLevel * 0.5)} hours remaining.`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
      });
    }
    // Warning fuel alerts (30-50%)
    else if (fuelLevel < 50) {
      alerts.push({
        id: `fuel-warning-${vessel.mmsi}`,
        vesselId: vessel.mmsi,
        vesselName: vessel.name,
        severity: 'warning',
        type: 'fuel',
        title: 'Low Fuel Warning',
        description: `Fuel level at ${fuelLevel}%. Plan refueling within next port call.`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
      });
    }

    // Offline vessel alert
    if (!vessel.isOnline) {
      alerts.push({
        id: `offline-${vessel.mmsi}`,
        vesselId: vessel.mmsi,
        vesselName: vessel.name,
        severity: 'info',
        type: 'navigation',
        title: 'Vessel Offline',
        description: `No AIS signal received. Last known position may be outdated.`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
      });
    }
  }

  // Sort: critical first, then warning, then info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

/**
 * Get alert counts by severity
 */
export function getAlertCounts(alerts: NMDCAlert[]): {
  total: number;
  critical: number;
  warning: number;
  info: number;
  unacknowledged: number;
} {
  return {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
    unacknowledged: alerts.filter(a => !a.acknowledged).length,
  };
}















