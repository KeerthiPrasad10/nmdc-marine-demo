export type PMSourceType = 
  | 'live_telemetry'
  | 'oem_specs'
  | 'work_history'
  | 'fleet_data'
  | 'environment'
  | 'inspection_records'
  | 'oil_analysis'
  | 'industry_standards'

export type PMEquipmentType =
  | 'wire_rope'
  | 'hoist_motor'
  | 'main_engine'
  | 'pump_system'
  | 'hydraulic_system'
  | 'generator'
  | 'crane_boom'
  | 'slew_bearing'

export type PMPriority = 'critical' | 'high' | 'medium' | 'low'

export type PMAssetType = 'crane' | 'vessel'

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
  equipmentId: string
  equipmentName: string
  equipmentType: PMEquipmentType
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
  equipmentType: PMEquipmentType
  manufacturer: string
  model: string
  specs: {
    ratedCapacity?: number
    ratedCapacityUnit?: string
    maxOperatingHours?: number
    maintenanceIntervalHours?: number
    expectedLifeCycles?: number
    maxTemperature?: number
    maxVibration?: number
    mtbf?: number
  }
  wearCurve?: {
    cycles: number
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
    intervalHours: number
    estimatedDuration: number
    requiredParts?: string[]
  }[]
}

export interface PMWorkOrder {
  id: string
  assetId: string
  assetName: string
  equipmentId: string
  equipmentName: string
  type: 'PM' | 'CM' | 'inspection'
  issue: string
  resolution?: string
  dateCreated: Date
  dateCompleted?: Date
  laborHours: number
  partsCost: number
  downtime: number
  wasUnplanned: boolean
}

export interface PMFleetPattern {
  equipmentType: PMEquipmentType
  pattern: string
  occurrences: number
  averageFailurePoint: {
    value: number
    unit: 'hours' | 'cycles'
  }
  affectedAssets: string[]
  recommendedIntervention: string
}

export interface PMInspectionRecord {
  id: string
  assetId: string
  equipmentId: string
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
  equipmentId: string
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
  equipmentList: {
    id: string
    name: string
    type: PMEquipmentType
    currentHealth?: number
    operatingHours?: number
    cycleCount?: number
    temperature?: number
    vibration?: number
  }[]
  environmentData?: {
    temperature?: number
    humidity?: number
    seaState?: number
    windSpeed?: number
  }
}

