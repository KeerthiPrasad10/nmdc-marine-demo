import type { FleetVessel } from '@/app/api/fleet/route'

export interface WSDOTAlert {
  id: string
  vesselId: string
  vesselName: string
  severity: 'critical' | 'warning' | 'info'
  type: 'equipment' | 'fuel' | 'navigation' | 'safety' | 'schedule'
  title: string
  description: string
  timestamp: Date
  acknowledged: boolean
  resolved: boolean
}

export function generateAlertsFromFleet(vessels: FleetVessel[]): WSDOTAlert[] {
  const alerts: WSDOTAlert[] = []
  const now = new Date()

  for (const vessel of vessels) {
    const healthScore = vessel.healthScore ?? 100
    const fuelLevel = vessel.fuelLevel ?? 100

    if (healthScore < 60) {
      alerts.push({
        id: `health-critical-${vessel.mmsi}`,
        vesselId: vessel.mmsi,
        vesselName: vessel.name,
        severity: 'critical',
        type: 'equipment',
        title: 'Critical: Vessel Health Below Threshold',
        description: `Health score at ${healthScore}%. Immediate inspection required. Schedule maintenance within 24 hours.`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
      })
    } else if (healthScore < 75) {
      alerts.push({
        id: `health-warning-${vessel.mmsi}`,
        vesselId: vessel.mmsi,
        vesselName: vessel.name,
        severity: 'warning',
        type: 'equipment',
        title: 'Vessel Health Degraded',
        description: `Health score at ${healthScore}%. Schedule preventive maintenance within 7 days.`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
      })
    }

    if (fuelLevel < 30) {
      alerts.push({
        id: `fuel-critical-${vessel.mmsi}`,
        vesselId: vessel.mmsi,
        vesselName: vessel.name,
        severity: 'critical',
        type: 'fuel',
        title: 'Critical: Low Fuel Level',
        description: `Fuel level at ${fuelLevel}%. Immediate refueling required at next terminal.`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
      })
    } else if (fuelLevel < 50) {
      alerts.push({
        id: `fuel-warning-${vessel.mmsi}`,
        vesselId: vessel.mmsi,
        vesselName: vessel.name,
        severity: 'warning',
        type: 'fuel',
        title: 'Low Fuel Warning',
        description: `Fuel level at ${fuelLevel}%. Plan refueling at next available window.`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
      })
    }

    if (!vessel.isOnline) {
      alerts.push({
        id: `offline-${vessel.mmsi}`,
        vesselId: vessel.mmsi,
        vesselName: vessel.name,
        severity: 'info',
        type: 'navigation',
        title: 'Vessel Offline',
        description: `No AIS signal received. Vessel may be at dock or out of service.`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
      })
    }

    if (vessel.speed && vessel.speed > 20) {
      alerts.push({
        id: `speed-warning-${vessel.mmsi}`,
        vesselId: vessel.mmsi,
        vesselName: vessel.name,
        severity: 'warning',
        type: 'safety',
        title: 'Excessive Speed',
        description: `Vessel traveling at ${vessel.speed.toFixed(1)} knots. Exceeds normal ferry operating speed.`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
      })
    }
  }

  const severityOrder = { critical: 0, warning: 1, info: 2 }
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return alerts
}

export function getAlertCounts(alerts: WSDOTAlert[]): {
  total: number
  critical: number
  warning: number
  info: number
  unacknowledged: number
} {
  return {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
    unacknowledged: alerts.filter(a => !a.acknowledged).length,
  }
}

