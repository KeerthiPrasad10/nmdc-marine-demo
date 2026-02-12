import type { ExelonAsset } from './fleet'

export interface GridAlert {
  id: string
  assetId: string
  assetName: string
  opCo: string
  severity: 'critical' | 'warning' | 'info'
  type: 'dga' | 'thermal' | 'overload' | 'equipment' | 'weather' | 'safety'
  title: string
  description: string
  timestamp: Date
  acknowledged: boolean
  resolved: boolean
  customersAffected: number
}

export function generateAlertsFromAssets(assets: ExelonAsset[]): GridAlert[] {
  const alerts: GridAlert[] = []
  const now = new Date()

  for (const asset of assets) {
    if (asset.healthIndex < 40) {
      alerts.push({
        id: `health-critical-${asset.assetTag}`,
        assetId: asset.assetTag,
        assetName: asset.name,
        opCo: asset.opCo,
        severity: 'critical',
        type: 'equipment',
        title: 'Critical: Health Index Below Threshold',
        description: `Health index at ${asset.healthIndex}%. DGA trending indicates accelerated degradation. Immediate inspection required. ${asset.customersServed.toLocaleString()} customers at risk.`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
        customersAffected: asset.customersServed,
      })
    } else if (asset.healthIndex < 60) {
      alerts.push({
        id: `health-warning-${asset.assetTag}`,
        assetId: asset.assetTag,
        assetName: asset.name,
        opCo: asset.opCo,
        severity: 'warning',
        type: 'equipment',
        title: 'Health Index Degraded',
        description: `Health index at ${asset.healthIndex}%. Schedule condition assessment within 30 days. ${asset.customersServed.toLocaleString()} customers downstream.`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
        customersAffected: asset.customersServed,
      })
    }

    if (asset.loadFactor > 85) {
      alerts.push({
        id: `overload-critical-${asset.assetTag}`,
        assetId: asset.assetTag,
        assetName: asset.name,
        opCo: asset.opCo,
        severity: 'critical',
        type: 'overload',
        title: 'Critical: Approaching Rated Capacity',
        description: `Load factor at ${asset.loadFactor}% of rated ${asset.ratedMVA} MVA. Hot-spot temperature rising. Consider load transfer or de-rating.`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
        customersAffected: asset.customersServed,
      })
    } else if (asset.loadFactor > 75) {
      alerts.push({
        id: `overload-warning-${asset.assetTag}`,
        assetId: asset.assetTag,
        assetName: asset.name,
        opCo: asset.opCo,
        severity: 'warning',
        type: 'overload',
        title: 'High Load Condition',
        description: `Load factor at ${asset.loadFactor}% of rated ${asset.ratedMVA} MVA. Monitor top-oil and winding temperatures. Plan load relief if forecast exceeds 90%.`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
        customersAffected: asset.customersServed,
      })
    }

    const age = new Date().getFullYear() - asset.yearInstalled
    if (age > 45 && asset.healthIndex < 55) {
      alerts.push({
        id: `aging-${asset.assetTag}`,
        assetId: asset.assetTag,
        assetName: asset.name,
        opCo: asset.opCo,
        severity: 'warning',
        type: 'equipment',
        title: 'Aging Asset: Replacement Planning Required',
        description: `${age}-year-old ${asset.type.replace('_', ' ')} with health index ${asset.healthIndex}%. Lead time for replacement: 18-24 months. Initiate procurement.`,
        timestamp: now,
        acknowledged: false,
        resolved: false,
        customersAffected: asset.customersServed,
      })
    }
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}

export function getAlertCounts(alerts: GridAlert[]) {
  return {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
    unacknowledged: alerts.filter(a => !a.acknowledged).length,
  }
}

