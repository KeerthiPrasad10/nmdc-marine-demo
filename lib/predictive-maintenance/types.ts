export type PMSourceType =
  | 'live_telemetry'
  | 'oem_specs'
  | 'work_history'
  | 'fleet_data'
  | 'environment'
  | 'inspection_records'
  | 'oil_analysis'
  | 'industry_standards'
  | 'dga_analysis'

export type PMComponentType =
  | 'winding'
  | 'bushing'
  | 'tap_changer'
  | 'cooling_system'
  | 'oil_system'
  | 'surge_arrester'
  | 'current_transformer'
  | 'breaker'
  | 'relay'
  | 'protection_system'

export type PMPriority = 'critical' | 'high' | 'medium' | 'low'

export type PMAssetType = 'power_transformer' | 'distribution_transformer' | 'substation' | 'circuit_breaker'

// Alias — used by the PredictiveMaintenance component for equipment-level types
export type PMEquipmentType = PMComponentType

export interface PMDataSource {
  id: string
  type: PMSourceType
  name: string
  description: string
  lastUpdated: Date
  dataQuality: number
  isAvailable: boolean
  iconName: string
}

export interface PMSourceContribution {
  source: PMDataSource
  contribution: string
  relevanceScore: number
  dataPoints?: {
    label: string
    value: string | number
    unit?: string
  }[]
}

export interface PMReasoningStep {
  id: string
  text: string
  sourceType: PMSourceType
  confidence: number
  isKey?: boolean
}

export interface PMDegradationPoint {
  timestamp: Date
  healthScore: number
  isProjected?: boolean
}

export interface PMPrediction {
  id: string
  componentId: string
  componentName: string
  componentType: PMComponentType
  assetType: PMAssetType
  assetId: string
  assetName: string
  priority: PMPriority
  title: string
  description: string
  predictedIssue: string
  remainingLife: {
    value: number
    unit: 'hours' | 'days' | 'cycles' | 'months'
    percentRemaining: number
  }
  confidence: number
  recommendedAction: string
  alternativeActions?: string[]
  costOfInaction: {
    amount: number
    currency: string
    description: string
  }
  estimatedRepairCost: {
    min: number
    max: number
    currency: string
  }
  estimatedDowntime: {
    min: number
    max: number
    unit: 'hours' | 'days'
  }
  partsRequired?: string[]
  customersAtRisk?: number
  optimalMaintenanceWindow?: {
    start: Date
    end: Date
  }
}

export interface PMAnalysis {
  id: string
  assetType: PMAssetType
  assetId: string
  assetName: string
  timestamp: Date
  status: 'analyzing' | 'complete' | 'error'
  sourcesQueried: PMDataSource[]
  sourceContributions: PMSourceContribution[]
  reasoningChain: PMReasoningStep[]
  predictions: PMPrediction[]
  degradationCurve: PMDegradationPoint[]
  overallHealthScore: number
  nextAnalysisRecommended: Date
  analysisVersion: string
}

export interface PMEquipmentProfile {
  id: string
  componentType: PMComponentType
  manufacturer: string
  model: string
  specs: {
    ratedCapacity?: number
    ratedCapacityUnit?: string
    maxOperatingHours?: number
    maintenanceIntervalHours?: number
    expectedLifeYears?: number
    maxTemperature?: number
    maxMoisture?: number
    maxVibration?: number
    maxPressure?: number
    mtbf?: number
  }
  wearCurve?: {
    years: number
    healthPercent: number
  }[]
  failureModes: {
    mode: string
    probability: number
    warningSignals: string[]
    mtbf?: number
  }[]
  maintenanceTasks: {
    task: string
    intervalMonths: number
    estimatedDuration: number
    requiredParts?: string[]
  }[]
}

export interface PMWorkOrder {
  id: string
  assetId: string
  assetName: string
  componentId: string
  componentName: string
  type: 'PM' | 'CM' | 'inspection' | 'oil_test'
  issue: string
  resolution?: string
  dateCreated: Date
  dateCompleted?: Date
  laborHours: number
  partsCost: number
  downtime: number
  wasUnplanned: boolean
  customersAffected?: number
}

export interface PMFleetPattern {
  componentType: PMComponentType
  pattern: string
  occurrences: number
  averageFailurePoint: {
    value: number
    unit: 'years' | 'months'
  }
  affectedAssets: string[]
  recommendedIntervention: string
}

export interface PMInspectionRecord {
  id: string
  assetId: string
  componentId: string
  date: Date
  inspector: string
  findings: string[]
  condition: 'good' | 'fair' | 'poor' | 'critical'
  photosCount: number
  recommendedActions?: string[]
}

export interface PMOilAnalysis {
  id: string
  assetId: string
  componentId: string
  date: Date
  lab: string
  results: {
    parameter: string
    value: number
    unit: string
    status: 'normal' | 'warning' | 'critical'
    trend?: 'stable' | 'increasing' | 'decreasing'
  }[]
  overallCondition: 'good' | 'marginal' | 'critical'
  recommendation: string
}

export interface PMAnalysisRequest {
  assetType: PMAssetType
  assetId: string
  assetName: string
  componentList: {
    id: string
    name: string
    type: PMComponentType
    currentHealth?: number
    ageYears?: number
    temperature?: number
    moisture?: number
    loadPercent?: number
  }[]
  environmentData?: {
    temperature?: number
    humidity?: number
    loadPercent?: number
    windSpeed?: number
  }
}
