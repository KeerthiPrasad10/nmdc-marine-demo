import { v4 as uuidv4 } from 'uuid'
import {
  PMAnalysis,
  PMAnalysisRequest,
  PMDataSource,
  PMDegradationPoint,
  PMComponentType,
  PMPrediction,
  PMPriority,
  PMReasoningStep,
  PMSourceContribution,
} from './types'
import {
  getOEMProfile,
  getWearPercentage,
  getNextMaintenanceTask,
  getMostLikelyFailureMode,
} from './oem-specs'
import { getWorkOrderHistory, getFleetPatterns } from './history'
import { getAssetIssues, type ComponentIssue } from '../asset-issues'

const DATA_SOURCES: PMDataSource[] = [
  {
    id: 'src-telemetry',
    type: 'live_telemetry',
    name: 'Live Sensor Telemetry',
    description: 'Real-time data from transformer sensors (temperature, load, moisture)',
    lastUpdated: new Date(),
    dataQuality: 95,
    isAvailable: true,
    iconName: 'Activity',
  },
  {
    id: 'src-dga',
    type: 'dga_analysis',
    name: 'Dissolved Gas Analysis',
    description: 'DGA trending per IEEE C57.104 — Duval Triangle, Rogers Ratio, Key Gas',
    lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dataQuality: 98,
    isAvailable: true,
    iconName: 'FlaskConical',
  },
  {
    id: 'src-oem',
    type: 'oem_specs',
    name: 'OEM Specifications',
    description: 'Manufacturer nameplate data, rated life curves, and maintenance schedules',
    lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    dataQuality: 100,
    isAvailable: true,
    iconName: 'FileText',
  },
  {
    id: 'src-history',
    type: 'work_history',
    name: 'Work Order History',
    description: 'Historical maintenance, repair, and test records',
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    dataQuality: 88,
    isAvailable: true,
    iconName: 'ClipboardList',
  },
  {
    id: 'src-fleet',
    type: 'fleet_data',
    name: 'Fleet Intelligence',
    description: 'Pattern analysis across Exelon OpCo transformer fleet',
    lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dataQuality: 82,
    isAvailable: true,
    iconName: 'Zap',
  },
  {
    id: 'src-environment',
    type: 'environment',
    name: 'Operating Environment',
    description: 'Ambient temperature, weather, load profile, and storm exposure',
    lastUpdated: new Date(),
    dataQuality: 90,
    isAvailable: true,
    iconName: 'Cloud',
  },
  {
    id: 'src-inspection',
    type: 'inspection_records',
    name: 'Inspection Records',
    description: 'Visual, IR thermography, and condition assessment findings',
    lastUpdated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    dataQuality: 85,
    isAvailable: true,
    iconName: 'Eye',
  },
  {
    id: 'src-oil',
    type: 'oil_analysis',
    name: 'Oil Quality Analysis',
    description: 'Transformer oil condition: moisture, acidity, dielectric strength, furans',
    lastUpdated: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    dataQuality: 92,
    isAvailable: true,
    iconName: 'Droplets',
  },
  {
    id: 'src-industry',
    type: 'industry_standards',
    name: 'Industry Standards',
    description: 'IEEE C57.104, IEEE C57.106, NERC FAC, and utility best practices',
    lastUpdated: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    dataQuality: 100,
    isAvailable: true,
    iconName: 'BookOpen',
  },
]

function calculateRemainingLife(
  componentType: PMComponentType,
  currentHealth: number,
  ageYears: number
): { value: number; unit: 'months' | 'days'; percentRemaining: number } {
  const profile = getOEMProfile(componentType)
  const expectedLife = profile.specs.expectedLifeYears || 40

  const remainingYears = Math.max(0, expectedLife - ageYears)
  const adjustedRemaining = remainingYears * (currentHealth / 100)
  const percentRemaining = (adjustedRemaining / expectedLife) * 100

  const months = Math.round(adjustedRemaining * 12)
  if (months > 6) {
    return { value: months, unit: 'months', percentRemaining: Math.round(percentRemaining) }
  }
  return { value: Math.max(1, Math.round(adjustedRemaining * 365)), unit: 'days', percentRemaining: Math.round(percentRemaining) }
}

function determinePriority(
  currentHealth: number,
  remainingLifePercent: number,
  hasActiveFailureMode: boolean
): PMPriority {
  if (currentHealth < 30 || remainingLifePercent < 10 || hasActiveFailureMode) return 'critical'
  if (currentHealth < 50 || remainingLifePercent < 25) return 'high'
  if (currentHealth < 70 || remainingLifePercent < 50) return 'medium'
  return 'low'
}

function generateDegradationCurve(
  currentHealth: number,
  ageYears: number,
  componentType: PMComponentType
): PMDegradationPoint[] {
  const points: PMDegradationPoint[] = []
  const profile = getOEMProfile(componentType)
  const expectedLife = profile.specs.expectedLifeYears || 40

  const historyPoints = 8
  const yearsPerPoint = ageYears / historyPoints

  for (let i = 0; i <= historyPoints; i++) {
    const healthAtPoint = 100 - ((100 - currentHealth) * (i / historyPoints))
    points.push({
      timestamp: new Date(Date.now() - (historyPoints - i) * 365 * 24 * 60 * 60 * 1000),
      healthScore: Math.round(healthAtPoint * 10) / 10,
      isProjected: false,
    })
  }

  const futurePoints = 5
  const degradationRate = (100 - currentHealth) / Math.max(ageYears, 1)

  for (let i = 1; i <= futurePoints; i++) {
    const projectedYears = i * 2
    const projectedHealth = Math.max(0, currentHealth - (degradationRate * projectedYears * 1.3))
    points.push({
      timestamp: new Date(Date.now() + i * 2 * 365 * 24 * 60 * 60 * 1000),
      healthScore: Math.round(projectedHealth * 10) / 10,
      isProjected: true,
    })
  }

  return points
}

function buildReasoningChain(
  component: PMAnalysisRequest['componentList'][0],
  profile: ReturnType<typeof getOEMProfile>,
  workHistory: ReturnType<typeof getWorkOrderHistory>,
  fleetPatterns: ReturnType<typeof getFleetPatterns>,
  failureMode: ReturnType<typeof getMostLikelyFailureMode>
): PMReasoningStep[] {
  const steps: PMReasoningStep[] = []

  steps.push({
    id: uuidv4(),
    text: `Component age: ${component.ageYears || 'N/A'} years. Current health index: ${component.currentHealth || 'N/A'}%`,
    sourceType: 'live_telemetry',
    confidence: 95,
    isKey: true,
  })

  if (component.ageYears) {
    const expectedLife = profile.specs.expectedLifeYears || 40
    const lifeUsed = ((component.ageYears / expectedLife) * 100).toFixed(1)
    steps.push({
      id: uuidv4(),
      text: `${lifeUsed}% of OEM expected ${expectedLife}-year service life consumed (${profile.manufacturer})`,
      sourceType: 'oem_specs',
      confidence: 100,
      isKey: true,
    })
  }

  if (component.temperature) {
    const maxTemp = profile.specs.maxTemperature || 95
    const tempPercent = ((component.temperature / maxTemp) * 100).toFixed(0)
    steps.push({
      id: uuidv4(),
      text: `Operating temperature: ${component.temperature}°C (${tempPercent}% of max rated ${maxTemp}°C)`,
      sourceType: 'live_telemetry',
      confidence: 92,
      isKey: component.temperature > maxTemp * 0.85,
    })
  }

  if (component.moisture) {
    const maxMoisture = profile.specs.maxMoisture || 35
    const moistPercent = ((component.moisture / maxMoisture) * 100).toFixed(0)
    steps.push({
      id: uuidv4(),
      text: `Moisture content: ${component.moisture} ppm (${moistPercent}% of limit ${maxMoisture} ppm per IEEE C57.106)`,
      sourceType: 'oil_analysis',
      confidence: 90,
      isKey: component.moisture > maxMoisture * 0.8,
    })
  }

  if (workHistory.length > 0) {
    const recentCM = workHistory.filter(wo => wo.type === 'CM').slice(0, 3)
    if (recentCM.length > 0) {
      steps.push({
        id: uuidv4(),
        text: `${recentCM.length} corrective maintenance events in past 12 months — most recent: "${recentCM[0].issue}"`,
        sourceType: 'work_history',
        confidence: 88,
        isKey: recentCM.length >= 2,
      })
    }
  }

  const relevantPatterns = fleetPatterns.filter(p => p.componentType === component.type)
  if (relevantPatterns.length > 0) {
    const pattern = relevantPatterns[0]
    steps.push({
      id: uuidv4(),
      text: `Fleet analysis: ${pattern.occurrences} similar ${component.type.replace('_', ' ')}s across Exelon OpCos showed "${pattern.pattern}" — avg failure at ${pattern.averageFailurePoint.value} ${pattern.averageFailurePoint.unit}`,
      sourceType: 'fleet_data',
      confidence: 82,
      isKey: true,
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
  component: PMAnalysisRequest['componentList'][0],
  profile: ReturnType<typeof getOEMProfile>,
  workHistory: ReturnType<typeof getWorkOrderHistory>
): PMSourceContribution[] {
  const contributions: PMSourceContribution[] = []

  contributions.push({
    source: DATA_SOURCES.find(s => s.type === 'live_telemetry')!,
    contribution: 'Real-time health index, temperature, moisture, and load readings',
    relevanceScore: 95,
    dataPoints: [
      { label: 'Health Index', value: component.currentHealth || 0, unit: '%' },
      { label: 'Temperature', value: component.temperature || 0, unit: '°C' },
      { label: 'Moisture', value: component.moisture || 0, unit: 'ppm' },
      { label: 'Load', value: component.loadPercent || 0, unit: '%' },
    ],
  })

  contributions.push({
    source: DATA_SOURCES.find(s => s.type === 'dga_analysis')!,
    contribution: 'DGA trending per IEEE C57.104 — gas generation rates and fault type identification',
    relevanceScore: 98,
    dataPoints: [
      { label: 'Analysis Method', value: 'Duval Triangle + Key Gas' },
      { label: 'Standard', value: 'IEEE C57.104-2019' },
    ],
  })

  contributions.push({
    source: DATA_SOURCES.find(s => s.type === 'oem_specs')!,
    contribution: `${profile.manufacturer} maintenance specs and life expectancy curves`,
    relevanceScore: 100,
    dataPoints: [
      { label: 'Expected Life', value: profile.specs.expectedLifeYears || 'N/A', unit: 'years' },
      { label: 'MTBF', value: profile.specs.mtbf || 'N/A', unit: 'hrs' },
    ],
  })

  const cmCount = workHistory.filter(wo => wo.type === 'CM').length
  const pmCount = workHistory.filter(wo => wo.type === 'PM').length
  contributions.push({
    source: DATA_SOURCES.find(s => s.type === 'work_history')!,
    contribution: `${workHistory.length} historical records analyzed (${cmCount} corrective, ${pmCount} preventive)`,
    relevanceScore: 88,
    dataPoints: [
      { label: 'Total Records', value: workHistory.length },
      { label: 'Corrective', value: cmCount },
      { label: 'Preventive', value: pmCount },
    ],
  })

  contributions.push({
    source: DATA_SOURCES.find(s => s.type === 'fleet_data')!,
    contribution: 'Cross-referenced with similar transformers across all 6 Exelon OpCos',
    relevanceScore: 82,
    dataPoints: [
      { label: 'Fleet Units', value: 24 },
      { label: 'Avg Health', value: 65, unit: '%' },
      { label: 'Common Issues', value: 5 },
    ],
  })

  contributions.push({
    source: DATA_SOURCES.find(s => s.type === 'environment')!,
    contribution: 'Service territory weather, seasonal load profile, storm exposure history',
    relevanceScore: 75,
    dataPoints: [
      { label: 'Summer Peak Load', value: component.loadPercent || 0, unit: '%' },
      { label: 'Storm Exposure', value: 'Moderate' },
    ],
  })

  return contributions
}

function findMatchingAssetIssue(assetId: string, componentName: string): ComponentIssue | null {
  const assetIssues = getAssetIssues(assetId)
  if (!assetIssues) return null

  const nameLower = componentName.toLowerCase()
  return assetIssues.issues.find(issue => {
    const issueNameLower = issue.componentName.toLowerCase()
    const issueFirstWord = issueNameLower.split(' ')[0]
    const compFirstWord = nameLower.split(' ')[0]
    return nameLower.includes(issueFirstWord) || issueNameLower.includes(compFirstWord)
  }) || null
}

export function analyzeEquipment(request: PMAnalysisRequest): PMAnalysis {
  const predictions: PMPrediction[] = []
  const allReasoningSteps: PMReasoningStep[] = []
  const allContributions: PMSourceContribution[] = []
  let overallHealth = 0

  for (const component of request.componentList) {
    const profile = getOEMProfile(component.type)
    const workHistory = getWorkOrderHistory(request.assetId, component.id)
    const fleetPatterns = getFleetPatterns(component.type)

    const assetIssue = findMatchingAssetIssue(request.assetId, component.name)

    const failureMode = assetIssue
      ? {
          mode: assetIssue.pmPrediction.predictedIssue,
          probability: assetIssue.status === 'critical' ? 0.85 : assetIssue.status === 'warning' ? 0.65 : 0.45,
          warningSignals: assetIssue.pmPrediction.warningSignals,
        }
      : getMostLikelyFailureMode(component.type, component.moisture, component.temperature)

    const currentHealth = assetIssue?.healthScore || component.currentHealth ||
      getWearPercentage(component.type, component.ageYears || 0)

    overallHealth += currentHealth

    const remainingLife = calculateRemainingLife(
      component.type,
      currentHealth,
      component.ageYears || 0
    )

    const effectivePriority: PMPriority = assetIssue
      ? assetIssue.pmPrediction.priority
      : determinePriority(currentHealth, remainingLife.percentRemaining, failureMode !== null && failureMode.probability > 0.5)

    const reasoningChain = buildReasoningChain(
      { ...component, currentHealth },
      profile,
      workHistory,
      fleetPatterns,
      failureMode
    )

    if (assetIssue) {
      reasoningChain.unshift({
        id: uuidv4(),
        text: `Known issue: ${assetIssue.issue}. Status: ${assetIssue.status.toUpperCase()}.`,
        sourceType: 'live_telemetry',
        confidence: 95,
        isKey: true,
      })
    }

    allReasoningSteps.push(...reasoningChain)

    const contributions = buildSourceContributions(
      { ...component, currentHealth },
      profile,
      workHistory
    )
    if (allContributions.length === 0) {
      allContributions.push(...contributions)
    }

    const nextTask = getNextMaintenanceTask(component.type, (component.ageYears || 0) * 12)

    let costMultiplier = 1
    if (effectivePriority === 'critical') costMultiplier = 5
    else if (effectivePriority === 'high') costMultiplier = 3
    else if (effectivePriority === 'medium') costMultiplier = 1.5

    const baseCost = profile.maintenanceTasks[profile.maintenanceTasks.length - 1]?.estimatedDuration * 2000 || 50000

    const predictionDescription = assetIssue
      ? `Primary concern: ${assetIssue.pmPrediction.predictedIssue}. Warning signs: ${assetIssue.pmPrediction.warningSignals.join('; ')}.`
      : failureMode
        ? `Primary concern: ${failureMode.mode}. Warning signs: ${failureMode.warningSignals.slice(0, 3).join('; ')}.`
        : `Component operating within parameters but approaching maintenance threshold.`

    const recommendedAction = assetIssue
      ? assetIssue.pmPrediction.recommendedAction
      : nextTask
        ? `Schedule "${nextTask.task}" within ${nextTask.dueInMonths} months. ${nextTask.parts ? `Parts required: ${nextTask.parts.join(', ')}` : ''}`
        : `Continue monitoring. Next assessment in ${Math.max(1, Math.round(remainingLife.value * 0.2))} ${remainingLife.unit}.`

    predictions.push({
      id: uuidv4(),
      componentId: component.id,
      componentName: component.name,
      componentType: component.type,
      assetType: request.assetType,
      assetId: request.assetId,
      assetName: request.assetName,
      priority: effectivePriority,
      title: `${component.name} — ${effectivePriority === 'critical' ? 'Immediate Action Required' : effectivePriority === 'high' ? 'Maintenance Due Soon' : effectivePriority === 'medium' ? 'Schedule Maintenance' : 'Monitor Condition'}`,
      description: predictionDescription,
      predictedIssue: assetIssue?.pmPrediction.predictedIssue || failureMode?.mode || 'General aging progression',
      remainingLife,
      confidence: assetIssue ? (assetIssue.pmPrediction.confidence ?? 92) : Math.round(80 + Math.random() * 15),
      recommendedAction,
      alternativeActions: [
        'Increase monitoring frequency',
        'Order spare parts — note transformer lead time 18-24 months',
        'Coordinate with system operations for maintenance outage window',
        'Deploy mobile substation as contingency',
      ],
      costOfInaction: {
        amount: Math.round(baseCost * costMultiplier * 3),
        currency: 'USD',
        description: `Unplanned failure could result in ${Math.round(24 * costMultiplier)}-${Math.round(168 * costMultiplier)} hour outage affecting ${assetIssue?.pmPrediction.customersAtRisk?.toLocaleString() || '25,000+'} customers`,
      },
      estimatedRepairCost: {
        min: Math.round(baseCost * 0.8),
        max: Math.round(baseCost * 2),
        currency: 'USD',
      },
      estimatedDowntime: {
        min: Math.round(24 * costMultiplier),
        max: Math.round(72 * costMultiplier),
        unit: 'hours',
      },
      partsRequired: nextTask?.parts || [],
      customersAtRisk: assetIssue?.pmPrediction.customersAtRisk,
      optimalMaintenanceWindow: {
        start: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
  }

  const avgHealth = request.componentList.length > 0 ? overallHealth / request.componentList.length : 100

  const primaryComponent = request.componentList[0]
  const degradationCurve = primaryComponent
    ? generateDegradationCurve(
        primaryComponent.currentHealth || 75,
        primaryComponent.ageYears || 20,
        primaryComponent.type
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
    analysisVersion: '3.0.0-grid',
  }
}

export { DATA_SOURCES }
