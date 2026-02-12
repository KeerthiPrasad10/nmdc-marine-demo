import { PMWorkOrder, PMFleetPattern, PMInspectionRecord, PMOilAnalysis, PMEquipmentType } from './types'

const WORK_ORDER_ISSUES: Record<PMEquipmentType, { pm: string[]; cm: string[] }> = {
  winding: {
    pm: [
      'Winding resistance measurement completed',
      'Power factor test — within limits',
      'Turns ratio test passed',
      'Winding temperature sensor calibrated',
      'Insulation resistance test completed',
    ],
    cm: [
      'Winding hot spot detected — de-rating applied',
      'Insulation degradation — scheduled rewinding',
      'Partial discharge detected — monitoring increased',
      'Inter-turn fault investigation',
      'Emergency winding repair — thermal event',
    ],
  },
  bushing: {
    pm: [
      'Bushing power factor test passed',
      'Oil level verification — normal',
      'Infrared scan — no hot spots',
      'Capacitance measurement completed',
      'Visual inspection — no leakage',
    ],
    cm: [
      'Bushing oil leak repair',
      'Capacitance drift detected — replacement scheduled',
      'Bushing thermal anomaly — urgent replacement',
      'Porcelain crack detected — emergency replacement',
      'Bushing DGA sampling — elevated gases',
    ],
  },
  tap_changer: {
    pm: [
      'Tap changer contact inspection completed',
      'Drive mechanism lubrication',
      'Operation counter logged',
      'Transition resistance measurement',
      'Motor drive current test passed',
    ],
    cm: [
      'Contact erosion — pitting detected',
      'Drive mechanism failure — motor replaced',
      'Selector switch sticking — cleaned and adjusted',
      'Oil contamination from arcing — oil replaced',
      'Emergency tap changer lockout — diverter failure',
    ],
  },
  cooling_system: {
    pm: [
      'Cooling fan operation verified',
      'Radiator fin cleaning completed',
      'Oil pump flow rate test passed',
      'Thermostat calibration verified',
      'Cooling control relay test completed',
    ],
    cm: [
      'Fan motor replacement — bearing failure',
      'Oil pump seal leak repair',
      'Radiator blockage cleared',
      'Cooling control board replacement',
      'Emergency portable cooling deployed — fan bank failure',
    ],
  },
  oil_system: {
    pm: [
      'Oil DGA sampling completed',
      'Moisture content test — within limits',
      'Oil filtration service completed',
      'Silica gel breather replaced',
      'Conservator tank inspection',
    ],
    cm: [
      'Oil reclamation — elevated acidity',
      'Moisture ingress — seal repair and oil treatment',
      'Oil leak repair at drain valve',
      'Buchholz relay trip investigation — gas accumulation',
      'Emergency oil replacement — dielectric breakdown',
    ],
  },
  surge_arrester: {
    pm: [
      'Leakage current measurement completed',
      'Visual inspection — no discharge tracking',
      'Ground connection resistance verified',
      'Thermal scan completed',
      'Counter reading logged',
    ],
    cm: [
      'Arrester replacement — elevated leakage current',
      'Ground connection repair',
      'Tracking damage detected — replacement scheduled',
      'Arrester failure post-lightning event',
      'Emergency arrester replacement — flashover',
    ],
  },
  current_transformer: {
    pm: [
      'Ratio test completed — within tolerance',
      'Burden test passed',
      'Insulation resistance measurement',
      'Secondary winding continuity verified',
      'Visual inspection — no oil leaks',
    ],
    cm: [
      'CT ratio drift — replacement scheduled',
      'Secondary winding open circuit protection activated',
      'Oil leak at terminal box — sealed',
      'CT saturation investigation — relay misoperation',
      'Emergency CT replacement — insulation failure',
    ],
  },
  breaker: {
    pm: [
      'Breaker timing test completed',
      'Contact resistance measurement — within spec',
      'SF6 gas pressure verified',
      'Trip coil current test passed',
      'Mechanism lubrication completed',
    ],
    cm: [
      'Breaker trip coil replacement',
      'SF6 gas leak repair',
      'Contact erosion — replacement scheduled',
      'Mechanism spring failure — repair completed',
      'Emergency breaker replacement — failure to trip',
    ],
  },
  relay: {
    pm: [
      'Relay setting verification completed',
      'Trip test — successful operation',
      'Communication link test passed',
      'Firmware version verified',
      'Battery backup test completed',
    ],
    cm: [
      'Relay misoperation investigation — settings adjusted',
      'Communication module replacement',
      'Power supply failure — replacement',
      'Firmware upgrade — bug fix applied',
      'Emergency relay replacement — board failure',
    ],
  },
  protection_system: {
    pm: [
      'End-to-end protection test completed',
      'Differential protection scheme verified',
      'CT circuit integrity confirmed',
      'Overcurrent relay coordination reviewed',
      'Arc flash study updated',
    ],
    cm: [
      'Protection misoperation — coordination study updated',
      'CT wiring fault repaired',
      'Relay replacement — intermittent fault',
      'Protection scheme reconfiguration after network change',
      'Emergency protection bypass removed',
    ],
  },
}

const FLEET_PATTERNS_DATA: PMFleetPattern[] = [
  {
    componentType: 'winding',
    pattern: 'Accelerated insulation aging in high-load summer conditions',
    occurrences: 8,
    averageFailurePoint: { value: 28, unit: 'years' },
    affectedAssets: ['BGE-TF-001', 'PECO-TF-003', 'ComEd-TF-005'],
    recommendedIntervention: 'Reduce loading to 85% during peak summer and increase DGA sampling frequency',
  },
  {
    componentType: 'winding',
    pattern: 'Partial discharge activity in units above 30 years service',
    occurrences: 5,
    averageFailurePoint: { value: 32, unit: 'years' },
    affectedAssets: ['BGE-TF-001', 'ACE-TF-008'],
    recommendedIntervention: 'Install online PD monitoring and schedule power factor testing every 6 months',
  },
  {
    componentType: 'bushing',
    pattern: 'Capacitance drift in older porcelain bushings',
    occurrences: 6,
    averageFailurePoint: { value: 25, unit: 'years' },
    affectedAssets: ['PECO-TF-003', 'ComEd-TF-005', 'DPL-TF-007'],
    recommendedIntervention: 'Replace with RIP bushings during next planned outage',
  },
  {
    componentType: 'tap_changer',
    pattern: 'Contact erosion from frequent voltage regulation cycles',
    occurrences: 9,
    averageFailurePoint: { value: 15, unit: 'years' },
    affectedAssets: ['BGE-TF-001', 'PECO-TF-003', 'ComEd-TF-005', 'PHI-TF-006', 'ACE-TF-008'],
    recommendedIntervention: 'Implement condition-based tap changer maintenance at 50k operations',
  },
  {
    componentType: 'cooling_system',
    pattern: 'Fan motor bearing failures during extended heat waves',
    occurrences: 12,
    averageFailurePoint: { value: 8, unit: 'years' },
    affectedAssets: ['BGE-TF-001', 'PECO-TF-003', 'ComEd-TF-005', 'PHI-TF-006'],
    recommendedIntervention: 'Stock spare fan motors and pre-stage portable cooling for summer peak',
  },
  {
    componentType: 'oil_system',
    pattern: 'Moisture ingress through aging gaskets in coastal substations',
    occurrences: 7,
    averageFailurePoint: { value: 20, unit: 'years' },
    affectedAssets: ['BGE-TF-001', 'ACE-TF-008', 'DPL-TF-007'],
    recommendedIntervention: 'Replace gaskets and install online moisture sensors',
  },
  {
    componentType: 'oil_system',
    pattern: 'Elevated DBDS levels in naphthenic oil',
    occurrences: 4,
    averageFailurePoint: { value: 18, unit: 'years' },
    affectedAssets: ['PECO-TF-003', 'ComEd-TF-005'],
    recommendedIntervention: 'Schedule oil reclamation with passivator injection',
  },
  {
    componentType: 'breaker',
    pattern: 'SF6 micro-leaks in circuit breakers above 20 years',
    occurrences: 6,
    averageFailurePoint: { value: 22, unit: 'years' },
    affectedAssets: ['BGE-TF-001', 'PHI-TF-006', 'DPL-TF-007'],
    recommendedIntervention: 'Implement SF6 leak detection monitoring and schedule seal replacements',
  },
  {
    componentType: 'surge_arrester',
    pattern: 'Elevated leakage current post-storm season',
    occurrences: 5,
    averageFailurePoint: { value: 15, unit: 'years' },
    affectedAssets: ['BGE-TF-001', 'ACE-TF-008', 'DPL-TF-007'],
    recommendedIntervention: 'Conduct post-storm arrester testing and replace units showing degradation',
  },
  {
    componentType: 'protection_system',
    pattern: 'Relay coordination issues after network reconfiguration',
    occurrences: 4,
    averageFailurePoint: { value: 10, unit: 'years' },
    affectedAssets: ['ComEd-TF-005', 'PECO-TF-003'],
    recommendedIntervention: 'Mandate protection coordination study after any topology change',
  },
  {
    componentType: 'current_transformer',
    pattern: 'CT ratio errors in aging oil-filled units',
    occurrences: 3,
    averageFailurePoint: { value: 30, unit: 'years' },
    affectedAssets: ['BGE-TF-001', 'ACE-TF-008'],
    recommendedIntervention: 'Schedule CT replacement with dry-type units during planned outages',
  },
  {
    componentType: 'relay',
    pattern: 'Firmware compatibility issues after SCADA upgrades',
    occurrences: 5,
    averageFailurePoint: { value: 7, unit: 'years' },
    affectedAssets: ['ComEd-TF-005', 'PECO-TF-003', 'PHI-TF-006'],
    recommendedIntervention: 'Establish firmware lifecycle management and pre-test all upgrades',
  },
]

export function getWorkOrderHistory(assetId: string, componentId: string): PMWorkOrder[] {
  const seed = hashCode(assetId + componentId)
  const random = seededRandom(seed)

  const componentType: PMEquipmentType = componentId.includes('winding') ? 'winding' :
    componentId.includes('bushing') ? 'bushing' :
    componentId.includes('tap') ? 'tap_changer' :
    componentId.includes('cool') || componentId.includes('fan') ? 'cooling_system' :
    componentId.includes('oil') ? 'oil_system' :
    componentId.includes('surge') || componentId.includes('arrester') ? 'surge_arrester' :
    componentId.includes('ct') || componentId.includes('current') ? 'current_transformer' :
    componentId.includes('breaker') ? 'breaker' :
    componentId.includes('relay') ? 'relay' :
    componentId.includes('protect') ? 'protection_system' : 'winding'

  const issues = WORK_ORDER_ISSUES[componentType] || WORK_ORDER_ISSUES.winding

  const workOrders: PMWorkOrder[] = []
  const orderCount = Math.floor(random() * 8) + 4

  for (let i = 0; i < orderCount; i++) {
    const isPM = random() > 0.35
    const issueList = isPM ? issues.pm : issues.cm
    const daysAgo = Math.floor(random() * 180) + 1
    const dateCreated = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

    workOrders.push({
      id: `WO-${new Date().getFullYear()}-${String(Math.floor(random() * 900) + 100)}`,
      assetId,
      assetName: assetId,
      componentId,
      componentName: componentId,
      type: isPM ? 'PM' : 'CM',
      issue: issueList[Math.floor(random() * issueList.length)],
      resolution: isPM ? 'Completed as scheduled' : 'Repair completed, equipment returned to service',
      dateCreated,
      dateCompleted: new Date(dateCreated.getTime() + (Math.floor(random() * 48) + 4) * 60 * 60 * 1000),
      laborHours: Math.floor(random() * 16) + 2,
      partsCost: Math.floor(random() * 5000) + 500,
      downtime: isPM ? Math.floor(random() * 8) + 2 : Math.floor(random() * 24) + 8,
      wasUnplanned: !isPM,
    })
  }

  return workOrders.sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime())
}

export function getFleetPatterns(componentType?: PMEquipmentType): PMFleetPattern[] {
  if (componentType) {
    return FLEET_PATTERNS_DATA.filter(p => p.componentType === componentType)
  }
  return FLEET_PATTERNS_DATA
}

export function getInspectionRecords(assetId: string, componentId: string): PMInspectionRecord[] {
  const seed = hashCode(assetId + componentId + 'inspection')
  const random = seededRandom(seed)

  const records: PMInspectionRecord[] = []
  const recordCount = Math.floor(random() * 4) + 2

  const conditions: Array<'good' | 'fair' | 'poor' | 'critical'> = ['good', 'fair', 'poor', 'critical']
  const inspectors = ['James Wilson', 'Maria Chen', 'David Okafor', 'Sarah Mitchell']

  for (let i = 0; i < recordCount; i++) {
    const daysAgo = Math.floor(random() * 90) + 14
    const conditionIndex = Math.min(Math.floor(random() * 3), 3)

    records.push({
      id: `INS-${new Date().getFullYear()}-${String(Math.floor(random() * 900) + 100)}`,
      assetId,
      componentId,
      date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      inspector: inspectors[Math.floor(random() * inspectors.length)],
      findings: generateFindings(random, conditions[conditionIndex]),
      condition: conditions[conditionIndex],
      photosCount: Math.floor(random() * 12) + 3,
      recommendedActions: conditionIndex > 0 ? generateRecommendedActions(random) : undefined,
    })
  }

  return records.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export function getOilAnalysisRecords(assetId: string, componentId: string): PMOilAnalysis[] {
  const seed = hashCode(assetId + componentId + 'oil')
  const random = seededRandom(seed)

  const records: PMOilAnalysis[] = []
  const recordCount = Math.floor(random() * 3) + 1

  for (let i = 0; i < recordCount; i++) {
    const daysAgo = Math.floor(random() * 60) + 21
    const overallCondition = random() > 0.7 ? 'marginal' : random() > 0.9 ? 'critical' : 'good'

    records.push({
      id: `OIL-${new Date().getFullYear()}-${String(Math.floor(random() * 900) + 100)}`,
      assetId,
      componentId,
      date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      lab: 'Weidmann Electrical Technology',
      results: [
        {
          parameter: 'Hydrogen (H₂)',
          value: Math.floor(random() * 200) + 20,
          unit: 'ppm',
          status: random() > 0.7 ? 'warning' : 'normal',
          trend: random() > 0.5 ? 'increasing' : 'stable',
        },
        {
          parameter: 'Acetylene (C₂H₂)',
          value: Math.floor(random() * 15),
          unit: 'ppm',
          status: random() > 0.85 ? 'warning' : 'normal',
          trend: 'stable',
        },
        {
          parameter: 'Moisture Content',
          value: Math.floor(random() * 30) + 5,
          unit: 'ppm',
          status: random() > 0.8 ? 'warning' : 'normal',
          trend: random() > 0.6 ? 'increasing' : 'stable',
        },
        {
          parameter: 'Dielectric Strength',
          value: Math.floor(random() * 20) + 25,
          unit: 'kV',
          status: random() > 0.75 ? 'warning' : 'normal',
          trend: random() > 0.5 ? 'decreasing' : 'stable',
        },
        {
          parameter: 'Power Factor',
          value: Math.round((random() * 3 + 0.2) * 100) / 100,
          unit: '%',
          status: random() > 0.8 ? 'warning' : 'normal',
          trend: 'increasing',
        },
      ],
      overallCondition: overallCondition as 'good' | 'marginal' | 'critical',
      recommendation: overallCondition === 'critical'
        ? 'Immediate oil treatment recommended. Schedule DGA follow-up within 30 days per IEEE C57.104.'
        : overallCondition === 'marginal'
        ? 'Schedule oil filtration within next quarter. Increase DGA sampling to monthly.'
        : 'Oil condition acceptable. Continue annual DGA monitoring per IEEE C57.104.',
    })
  }

  return records.sort((a, b) => b.date.getTime() - a.date.getTime())
}

function generateFindings(random: () => number, condition: string): string[] {
  const findings: string[] = []

  if (condition === 'good') {
    findings.push('Equipment in good operating condition')
    findings.push('No visible defects or abnormalities')
    if (random() > 0.5) findings.push('Minor cosmetic wear within acceptable limits')
  } else if (condition === 'fair') {
    findings.push('Minor oil weeping observed at gasket')
    findings.push('Cooling fan vibration slightly elevated')
    if (random() > 0.5) findings.push('Paint deterioration on radiators — no structural impact')
  } else if (condition === 'poor') {
    findings.push('Significant oil discoloration noted')
    findings.push('Bushing porcelain showing surface tracking')
    findings.push('Elevated top oil temperature under normal load')
    if (random() > 0.5) findings.push('Corrosion on tank base — monitoring recommended')
  } else {
    findings.push('Critical DGA readings — immediate follow-up required')
    findings.push('Visible oil leak at main gasket')
    findings.push('Abnormal noise from tap changer mechanism')
    findings.push('Recommend de-loading pending investigation')
  }

  return findings
}

function generateRecommendedActions(random: () => number): string[] {
  const actions = [
    'Schedule maintenance during next planned outage',
    'Order replacement components from OEM',
    'Increase DGA sampling frequency to monthly',
    'Consult transformer specialist for assessment',
    'Coordinate with dispatch for load transfer capability',
  ]

  const count = Math.floor(random() * 2) + 1
  return actions.slice(0, count)
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

