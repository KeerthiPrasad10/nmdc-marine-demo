export type AssetType =
  | 'power_transformer'
  | 'distribution_transformer'
  | 'substation'
  | 'feeder'
  | 'circuit_breaker'
  | 'capacitor_bank'
  | 'recloser'
  | 'switch'

export type AssetStatus = 'operational' | 'maintenance' | 'idle' | 'alert'
export type AlertType = 'dga' | 'thermal' | 'overload' | 'equipment' | 'weather' | 'safety'
export type AlertSeverity = 'critical' | 'warning' | 'info'
export type MitigationPriority = 'immediate' | 'high' | 'medium' | 'low'
export type ComponentType =
  | 'winding'
  | 'bushing'
  | 'tap_changer'
  | 'cooling_system'
  | 'oil_system'
  | 'surge_arrester'
  | 'current_transformer'
  | 'potential_transformer'
  | 'breaker'
  | 'relay'

export interface Position {
  lat: number
  lng: number
}

export interface GridEmissions {
  sf6Leakage: number
  carbonIntensity: number
  linelosses: number
}

export interface FieldCrew {
  count: number
  hoursOnDuty: number
  safetyScore: number
}

export interface ComponentStatus {
  id: string
  type: ComponentType
  name: string
  healthScore: number
  temperature: number
  moisture: number
  hoursOperated: number
  lastMaintenance: Date
  predictedFailure: Date | null
  failureConfidence: number
}

export interface GridAsset {
  id: string
  name: string
  type: AssetType
  assetTag: string
  opCo: string
  position: Position
  voltageClass: number
  ratedCapacityMVA: number
  loadFactor: number
  status: AssetStatus
  healthIndex: number
  yearInstalled: number
  manufacturer: string
  model: string
  emissions: GridEmissions
  crew: FieldCrew
  components: ComponentStatus[]
  program: string
  substationName: string
  lastUpdate: Date
}

export interface WeatherCondition {
  windSpeed: number
  windDirection: number
  temperature: number
  humidity: number
  precipitation: number
  condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'ice' | 'heat_wave'
  severity: 'normal' | 'advisory' | 'warning' | 'severe'
}

export interface Mitigation {
  id: string
  action: string
  priority: MitigationPriority
  estimatedImpact: string
  businessValue: string
  timeToImplement: string
  costEstimate: string
}

export interface Alert {
  id: string
  assetId: string
  assetName: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  timestamp: Date
  acknowledged: boolean
  resolved: boolean
  mitigations: Mitigation[]
}

export interface MaintenancePrediction {
  id: string
  assetId: string
  assetName: string
  component: ComponentStatus
  predictedIssue: string
  probability: number
  daysUntilFailure: number
  recommendedAction: string
  priority: MitigationPriority
  estimatedDowntime: string
  estimatedCost: string
  customersAffected: number
}

export interface GridMetrics {
  totalAssets: number
  operationalAssets: number
  maintenanceAssets: number
  alertAssets: number
  averageHealthIndex: number
  averageLoadFactor: number
  totalEmissions: GridEmissions
  activeAlerts: number
  criticalAlerts: number
  upcomingMaintenance: number
  saidi: number
  saifi: number
  customersServed: number
}

export interface SimulationState {
  assets: Map<string, GridAsset>
  alerts: Alert[]
  weather: WeatherCondition
  lastUpdate: Date
  simulationSpeed: number
}

export interface StreamEvent {
  type: 'asset_update' | 'alert' | 'weather' | 'maintenance' | 'metrics'
  data: GridAsset | Alert | WeatherCondition | MaintenancePrediction | GridMetrics
  timestamp: Date
}
