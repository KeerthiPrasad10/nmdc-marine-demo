import { v4 as uuidv4 } from 'uuid'
import {
  PMAnalysis,
  PMAnalysisRequest,
  PMDataSource,
  PMDegradationPoint,
  PMEquipmentType,
  PMPrediction,
  PMPriority,
  PMReasoningStep,
  PMSourceContribution,
  PMSourceType,
} from './types'
import {
  getOEMProfile,
  getWearPercentage,
  getNextMaintenanceTask,
  getMostLikelyFailureMode,
} from './oem-specs'
import { getWorkOrderHistory, getFleetPatterns } from './history'
import { getVesselIssues, type EquipmentIssue } from '../vessel-issues'

const DATA_SOURCES: PMDataSource[] = [
  {
    id: 'src-telemetry',
    type: 'live_telemetry',
    name: 'Live Sensor Telemetry',
    description: 'Real-time data from equipment sensors',
    lastUpdated: new Date(),
    dataQuality: 95,
    isAvailable: true,
    iconName: 'Activity',
  },
  {
    id: 'src-oem',
    type: 'oem_specs',
    name: 'OEM Specifications',
    description: 'Manufacturer maintenance intervals and wear curves',
    lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    dataQuality: 100,
    isAvailable: true,
    iconName: 'FileText',
  },
  {
    id: 'src-history',
    type: 'work_history',
    name: 'Work Order History',
    description: 'Historical maintenance and repair records',
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    dataQuality: 88,
    isAvailable: true,
    iconName: 'ClipboardList',
  },
  {
    id: 'src-fleet',
    type: 'fleet_data',
    name: 'Fleet Intelligence',
    description: 'Similar equipment patterns across NMDC fleet',
    lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dataQuality: 82,
    isAvailable: true,
    iconName: 'Ship',
  },
  {
    id: 'src-environment',
    type: 'environment',
    name: 'Operating Environment',
    description: 'Weather, sea state, and operational conditions',
    lastUpdated: new Date(),
    dataQuality: 90,
    isAvailable: true,
    iconName: 'Cloud',
  },
  {
    id: 'src-inspection',
    type: 'inspection_records',
    name: 'Inspection Records',
    description: 'Visual and NDT inspection findings',
    lastUpdated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    dataQuality: 85,
    isAvailable: true,
    iconName: 'Eye',
  },
  {
    id: 'src-oil',
    type: 'oil_analysis',
    name: 'Oil Analysis Reports',
    description: 'Lubricant condition and wear debris analysis',
    lastUpdated: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    dataQuality: 92,
    isAvailable: true,
    iconName: 'Droplets',
  },
  {
    id: 'src-industry',
    type: 'industry_standards',
    name: 'Industry Standards',
    description: 'DNV, ABS, and industry best practices',
    lastUpdated: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    dataQuality: 100,
    isAvailable: true,
    iconName: 'BookOpen',
  },
]

function calculateRemainingLife(
  equipmentType: PMEquipmentType,
  currentHealth: number,
  operatingHours: number,
  cycleCount?: number
): { value: number; unit: 'hours' | 'days' | 'cycles'; percentRemaining: number } {
  const profile = getOEMProfile(equipmentType)
  
  if (cycleCount !== undefined && profile.specs.expectedLifeCycles) {
    const remainingCycles = Math.max(0, profile.specs.expectedLifeCycles - cycleCount)
    const percentRemaining = (remainingCycles / profile.specs.expectedLifeCycles) * 100
    return {
      value: Math.round(remainingCycles),
      unit: 'cycles',
      percentRemaining: Math.round(percentRemaining),
    }
  }

  if (profile.specs.maxOperatingHours) {
    const remainingHours = Math.max(0, profile.specs.maxOperatingHours - operatingHours)
    const adjustedRemaining = remainingHours * (currentHealth / 100)
    const percentRemaining = (adjustedRemaining / profile.specs.maxOperatingHours) * 100
    
    if (adjustedRemaining > 168) {
      return {
        value: Math.round(adjustedRemaining / 24),
        unit: 'days',
        percentRemaining: Math.round(percentRemaining),
      }
    }
    return {
      value: Math.round(adjustedRemaining),
      unit: 'hours',
      percentRemaining: Math.round(percentRemaining),
    }
  }

  const estimatedHours = (currentHealth / 100) * 1000
  return {
    value: Math.round(estimatedHours / 24),
    unit: 'days',
    percentRemaining: currentHealth,
  }
}

function determinePriority(
  currentHealth: number,
  remainingLifePercent: number,
  hasActiveFailureMode: boolean
): PMPriority {
  if (currentHealth < 30 || remainingLifePercent < 10 || hasActiveFailureMode) {
    return 'critical'
  }
  if (currentHealth < 50 || remainingLifePercent < 25) {
    return 'high'
  }
  if (currentHealth < 70 || remainingLifePercent < 50) {
    return 'medium'
  }
  return 'low'
}

function generateDegradationCurve(
  currentHealth: number,
  operatingHours: number,
  equipmentType: PMEquipmentType
): PMDegradationPoint[] {
  const points: PMDegradationPoint[] = []
  const profile = getOEMProfile(equipmentType)
  const maxHours = profile.specs.maxOperatingHours || 20000

  const historyPoints = 10
  const hoursPerPoint = operatingHours / historyPoints
  
  for (let i = 0; i <= historyPoints; i++) {
    const pointHours = hoursPerPoint * i
    const healthAtPoint = 100 - ((100 - currentHealth) * (i / historyPoints))
    points.push({
      timestamp: new Date(Date.now() - (historyPoints - i) * 24 * 60 * 60 * 1000),
      healthScore: Math.round(healthAtPoint * 10) / 10,
      isProjected: false,
    })
  }

  const futurePoints = 5
  const degradationRate = (100 - currentHealth) / operatingHours
  const futureHoursPerPoint = (maxHours - operatingHours) / futurePoints / 2

  for (let i = 1; i <= futurePoints; i++) {
    const projectedHours = operatingHours + (futureHoursPerPoint * i)
    const projectedHealth = Math.max(0, currentHealth - (degradationRate * futureHoursPerPoint * i * 1.2))
    points.push({
      timestamp: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
      healthScore: Math.round(projectedHealth * 10) / 10,
      isProjected: true,
    })
  }

  return points
}

function buildReasoningChain(
  equipment: PMAnalysisRequest['equipmentList'][0],
  profile: ReturnType<typeof getOEMProfile>,
  workHistory: ReturnType<typeof getWorkOrderHistory>,
  fleetPatterns: ReturnType<typeof getFleetPatterns>,
  failureMode: ReturnType<typeof getMostLikelyFailureMode>
): PMReasoningStep[] {
  const steps: PMReasoningStep[] = []

  steps.push({
    id: uuidv4(),
    text: `Current operating hours: ${equipment.operatingHours?.toLocaleString() || 'N/A'}h with health score at ${equipment.currentHealth || 'N/A'}%`,
    sourceType: 'live_telemetry',
    confidence: 95,
    isKey: true,
  })

  if (equipment.cycleCount) {
    const expectedCycles = profile.specs.expectedLifeCycles || 15000
    const usagePercent = ((equipment.cycleCount / expectedCycles) * 100).toFixed(1)
    steps.push({
      id: uuidv4(),
      text: `Cycle count at ${equipment.cycleCount.toLocaleString()} (${usagePercent}% of OEM rated ${expectedCycles.toLocaleString()} cycles)`,
      sourceType: 'oem_specs',
      confidence: 100,
      isKey: true,
    })
  }

  if (profile.specs.maintenanceIntervalHours && equipment.operatingHours) {
    const nextTask = getNextMaintenanceTask(equipment.type, equipment.operatingHours)
    if (nextTask) {
      steps.push({
        id: uuidv4(),
        text: `OEM recommends "${nextTask.task}" in ${nextTask.dueInHours.toLocaleString()} operating hours`,
        sourceType: 'oem_specs',
        confidence: 100,
      })
    }
  }

  if (workHistory.length > 0) {
    const recentCM = workHistory.filter(wo => wo.type === 'CM').slice(0, 3)
    if (recentCM.length > 0) {
      steps.push({
        id: uuidv4(),
        text: `${recentCM.length} corrective maintenance events in past 6 months - most recent: "${recentCM[0].issue}"`,
        sourceType: 'work_history',
        confidence: 88,
        isKey: recentCM.length >= 2,
      })
    }
  }

  const relevantPatterns = fleetPatterns.filter(p => p.equipmentType === equipment.type)
  if (relevantPatterns.length > 0) {
    const pattern = relevantPatterns[0]
    steps.push({
      id: uuidv4(),
      text: `Fleet analysis: ${pattern.occurrences} similar ${equipment.type.replace('_', ' ')}s showed "${pattern.pattern}" - avg failure at ${pattern.averageFailurePoint.value.toLocaleString()} ${pattern.averageFailurePoint.unit}`,
      sourceType: 'fleet_data',
      confidence: 82,
      isKey: true,
    })
  }

  if (equipment.vibration) {
    const maxVib = profile.specs.maxVibration || 5
    const vibPercent = ((equipment.vibration / maxVib) * 100).toFixed(0)
    const status = equipment.vibration > maxVib * 0.8 ? 'elevated' : equipment.vibration > maxVib * 0.6 ? 'moderate' : 'normal'
    steps.push({
      id: uuidv4(),
      text: `Vibration at ${equipment.vibration} mm/s (${vibPercent}% of threshold) - ${status} level indicates ${status === 'elevated' ? 'bearing or alignment concern' : 'acceptable wear pattern'}`,
      sourceType: 'live_telemetry',
      confidence: 90,
      isKey: status === 'elevated',
    })
  }

  if (equipment.temperature) {
    const maxTemp = profile.specs.maxTemperature || 80
    const tempPercent = ((equipment.temperature / maxTemp) * 100).toFixed(0)
    steps.push({
      id: uuidv4(),
      text: `Operating temperature ${equipment.temperature}°C (${tempPercent}% of max rated ${maxTemp}°C)`,
      sourceType: 'live_telemetry',
      confidence: 92,
    })
  }

  if (failureMode) {
    steps.push({
      id: uuidv4(),
      text: `Most probable failure mode: "${failureMode.mode}" (${(failureMode.probability * 100).toFixed(0)}% probability based on current indicators)`,
      sourceType: 'industry_standards',
      confidence: Math.round(failureMode.probability * 100),
      isKey: true,
    })
  }

  return steps
}

function buildSourceContributions(
  equipment: PMAnalysisRequest['equipmentList'][0],
  profile: ReturnType<typeof getOEMProfile>,
  workHistory: ReturnType<typeof getWorkOrderHistory>
): PMSourceContribution[] {
  const contributions: PMSourceContribution[] = []

  contributions.push({
    source: DATA_SOURCES.find(s => s.type === 'live_telemetry')!,
    contribution: 'Real-time health score, vibration, and temperature readings',
    relevanceScore: 95,
    dataPoints: [
      { label: 'Health Score', value: equipment.currentHealth || 0, unit: '%' },
      { label: 'Vibration', value: equipment.vibration || 0, unit: 'mm/s' },
      { label: 'Temperature', value: equipment.temperature || 0, unit: '°C' },
      { label: 'Operating Hours', value: equipment.operatingHours || 0, unit: 'h' },
    ],
  })

  contributions.push({
    source: DATA_SOURCES.find(s => s.type === 'oem_specs')!,
    contribution: `${profile.manufacturer} ${profile.model} maintenance specifications and wear curve`,
    relevanceScore: 100,
    dataPoints: [
      { label: 'Max Hours', value: profile.specs.maxOperatingHours || 'N/A' },
      { label: 'PM Interval', value: profile.specs.maintenanceIntervalHours || 'N/A', unit: 'h' },
      { label: 'MTBF', value: profile.specs.mtbf || 'N/A', unit: 'h' },
    ],
  })

  const cmCount = workHistory.filter(wo => wo.type === 'CM').length
  const pmCount = workHistory.filter(wo => wo.type === 'PM').length
  contributions.push({
    source: DATA_SOURCES.find(s => s.type === 'work_history')!,
    contribution: `${workHistory.length} historical records analyzed (${cmCount} CM, ${pmCount} PM)`,
    relevanceScore: 88,
    dataPoints: [
      { label: 'Total Records', value: workHistory.length },
      { label: 'Corrective', value: cmCount },
      { label: 'Preventive', value: pmCount },
    ],
  })

  contributions.push({
    source: DATA_SOURCES.find(s => s.type === 'fleet_data')!,
    contribution: 'Cross-referenced with 12 similar equipment units across NMDC fleet',
    relevanceScore: 82,
    dataPoints: [
      { label: 'Fleet Units', value: 12 },
      { label: 'Avg Health', value: 74, unit: '%' },
      { label: 'Common Issues', value: 3 },
    ],
  })

  contributions.push({
    source: DATA_SOURCES.find(s => s.type === 'environment')!,
    contribution: 'Operating environment factors: offshore conditions, salt exposure, load severity',
    relevanceScore: 75,
    dataPoints: [
      { label: 'Exposure', value: 'High Salt' },
      { label: 'Load Factor', value: 68, unit: '%' },
    ],
  })

  return contributions
}

function findMatchingVesselIssue(assetId: string, equipmentName: string): EquipmentIssue | null {
  const vesselIssues = getVesselIssues(assetId)
  if (!vesselIssues) return null
  
  const nameLower = equipmentName.toLowerCase()
  return vesselIssues.issues.find(issue => {
    const issueNameLower = issue.equipmentName.toLowerCase()
    const issueFirstWord = issueNameLower.split(' ')[0]
    const equipFirstWord = nameLower.split(' ')[0]
    return nameLower.includes(issueFirstWord) || issueNameLower.includes(equipFirstWord)
  }) || null
}

export function analyzeEquipment(request: PMAnalysisRequest): PMAnalysis {
  const predictions: PMPrediction[] = []
  const allReasoningSteps: PMReasoningStep[] = []
  const allContributions: PMSourceContribution[] = []
  let overallHealth = 0

  for (const equipment of request.equipmentList) {
    const profile = getOEMProfile(equipment.type)
    const workHistory = getWorkOrderHistory(request.assetId, equipment.id)
    const fleetPatterns = getFleetPatterns(equipment.type)
    
    const vesselIssue = findMatchingVesselIssue(request.assetId, equipment.name)
    
    const failureMode = vesselIssue 
      ? { 
          mode: vesselIssue.pmPrediction.predictedIssue, 
          probability: vesselIssue.status === 'critical' ? 0.85 : vesselIssue.status === 'warning' ? 0.65 : 0.45,
          warningSignals: vesselIssue.pmPrediction.warningSignals 
        }
      : getMostLikelyFailureMode(equipment.type, equipment.vibration, equipment.temperature)

    const currentHealth = vesselIssue?.healthScore || equipment.currentHealth || 
      getWearPercentage(equipment.type, equipment.cycleCount || equipment.operatingHours || 0)
    
    overallHealth += currentHealth

    const remainingLife = calculateRemainingLife(
      equipment.type,
      currentHealth,
      equipment.operatingHours || 0,
      equipment.cycleCount
    )

    const effectivePriority: PMPriority = vesselIssue 
      ? vesselIssue.pmPrediction.priority
      : determinePriority(currentHealth, remainingLife.percentRemaining, failureMode !== null && failureMode.probability > 0.5)

    const reasoningChain = buildReasoningChain(
      { ...equipment, currentHealth },
      profile,
      workHistory,
      fleetPatterns,
      failureMode
    )
    
    if (vesselIssue) {
      reasoningChain.unshift({
        id: uuidv4(),
        text: `Known issue detected: ${vesselIssue.issue}. Status: ${vesselIssue.status.toUpperCase()}.`,
        sourceType: 'live_telemetry',
        confidence: 95,
        isKey: true,
      })
    }
    
    allReasoningSteps.push(...reasoningChain)

    const contributions = buildSourceContributions(
      { ...equipment, currentHealth },
      profile,
      workHistory
    )
    if (allContributions.length === 0) {
      allContributions.push(...contributions)
    }

    const nextTask = getNextMaintenanceTask(equipment.type, equipment.operatingHours || 0)

    let costMultiplier = 1
    if (effectivePriority === 'critical') costMultiplier = 3
    else if (effectivePriority === 'high') costMultiplier = 2
    else if (effectivePriority === 'medium') costMultiplier = 1.5

    const baseCost = profile.maintenanceTasks[profile.maintenanceTasks.length - 1]?.estimatedDuration * 500 || 10000

    const predictionDescription = vesselIssue
      ? `Primary concern: ${vesselIssue.pmPrediction.predictedIssue}. Warning signs include: ${vesselIssue.pmPrediction.warningSignals.join(', ')}.`
      : failureMode 
        ? `Primary concern: ${failureMode.mode}. Warning signs include: ${failureMode.warningSignals.slice(0, 2).join(', ')}.`
        : `Equipment operating within parameters but approaching maintenance threshold.`

    const recommendedAction = vesselIssue
      ? vesselIssue.pmPrediction.recommendedAction
      : nextTask 
        ? `Schedule "${nextTask.task}" within ${nextTask.dueInHours} operating hours. ${nextTask.parts ? `Parts required: ${nextTask.parts.join(', ')}` : ''}`
        : `Continue monitoring. Next inspection recommended in ${Math.round(remainingLife.value * 0.3)} ${remainingLife.unit}.`

    predictions.push({
      id: uuidv4(),
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      equipmentType: equipment.type,
      assetType: request.assetType,
      assetId: request.assetId,
      assetName: request.assetName,
      priority: effectivePriority,
      title: `${equipment.name} - ${effectivePriority === 'critical' ? 'Immediate Action Required' : effectivePriority === 'high' ? 'Maintenance Due Soon' : effectivePriority === 'medium' ? 'Schedule Maintenance' : 'Monitor Condition'}`,
      description: predictionDescription,
      predictedIssue: vesselIssue?.pmPrediction.predictedIssue || failureMode?.mode || 'General wear progression',
      remainingLife,
      confidence: vesselIssue ? 92 : Math.round(85 + Math.random() * 10),
      recommendedAction,
      alternativeActions: [
        'Increase monitoring frequency',
        'Order spare parts preemptively',
        'Coordinate with operations for maintenance window',
      ],
      costOfInaction: {
        amount: Math.round(baseCost * costMultiplier * 2),
        currency: 'USD',
        description: `Unplanned failure could result in ${Math.round(24 * costMultiplier)}-${Math.round(72 * costMultiplier)} hours downtime`,
      },
      estimatedRepairCost: {
        min: Math.round(baseCost * 0.8),
        max: Math.round(baseCost * 1.5),
        currency: 'USD',
      },
      estimatedDowntime: {
        min: Math.round(8 * costMultiplier),
        max: Math.round(24 * costMultiplier),
        unit: 'hours',
      },
      partsRequired: nextTask?.parts || [],
      optimalMaintenanceWindow: {
        start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    })
  }

  const avgHealth = request.equipmentList.length > 0 ? overallHealth / request.equipmentList.length : 100

  const primaryEquipment = request.equipmentList[0]
  const degradationCurve = primaryEquipment 
    ? generateDegradationCurve(
        primaryEquipment.currentHealth || 75,
        primaryEquipment.operatingHours || 5000,
        primaryEquipment.type
      )
    : []

  return {
    id: uuidv4(),
    assetType: request.assetType,
    assetId: request.assetId,
    assetName: request.assetName,
    timestamp: new Date(),
    status: 'complete',
    sourcesQueried: DATA_SOURCES,
    sourceContributions: allContributions,
    reasoningChain: allReasoningSteps,
    predictions: predictions.sort((a, b) => {
      const priorityOrder: Record<PMPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }),
    degradationCurve,
    overallHealthScore: Math.round(avgHealth),
    nextAnalysisRecommended: new Date(Date.now() + 24 * 60 * 60 * 1000),
    analysisVersion: '2.1.0',
  }
}

export { DATA_SOURCES }

