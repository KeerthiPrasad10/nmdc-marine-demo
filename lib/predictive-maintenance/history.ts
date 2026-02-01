import { PMWorkOrder, PMFleetPattern, PMInspectionRecord, PMOilAnalysis, PMEquipmentType } from './types'

const WORK_ORDER_ISSUES: Record<PMEquipmentType, { pm: string[]; cm: string[] }> = {
  wire_rope: {
    pm: [
      'Scheduled wire rope lubrication',
      'Visual inspection - no defects found',
      'NDT inspection completed',
      'End fitting inspection',
      'Drum alignment check',
    ],
    cm: [
      'Wire breakage detected - partial replacement',
      'Kinking observed near sheave',
      'Corrosion treatment applied',
      'Emergency replacement due to wear',
      'Bird-caging repair',
    ],
  },
  hoist_motor: {
    pm: [
      'Motor bearing regreasing',
      'Vibration analysis - within limits',
      'Insulation resistance test passed',
      'Cooling system cleaning',
      'Alignment verification',
    ],
    cm: [
      'Bearing replacement - excessive vibration',
      'Winding repair - hot spot detected',
      'Shaft seal replacement - oil leakage',
      'Motor overheating investigation',
      'Emergency bearing replacement',
    ],
  },
  main_engine: {
    pm: [
      'Oil and filter change completed',
      'Valve clearance adjustment',
      'Turbocharger inspection',
      'Injector timing check',
      'Cooling system flush',
    ],
    cm: [
      'Turbocharger bearing replacement',
      'Injector replacement - poor atomization',
      'Coolant leak repair',
      'Governor adjustment - speed hunting',
      'Emergency cylinder liner replacement',
    ],
  },
  pump_system: {
    pm: [
      'Mechanical seal inspection',
      'Vibration monitoring completed',
      'Impeller clearance check',
      'Bearing lubrication',
      'Alignment verification',
    ],
    cm: [
      'Mechanical seal replacement - leakage',
      'Impeller replacement - cavitation damage',
      'Bearing replacement - high vibration',
      'Shaft sleeve replacement',
      'Emergency pump overhaul',
    ],
  },
  hydraulic_system: {
    pm: [
      'Hydraulic oil analysis completed',
      'Filter replacement',
      'Hose inspection - no defects',
      'Pressure test completed',
      'Valve calibration',
    ],
    cm: [
      'Hose replacement - external damage',
      'Pump repair - internal wear',
      'Valve replacement - sticking',
      'Oil contamination flush',
      'Cylinder seal replacement',
    ],
  },
  generator: {
    pm: [
      'Generator oil service completed',
      'Insulation testing passed',
      'AVR calibration',
      'Bearing inspection',
      'Load bank test completed',
    ],
    cm: [
      'AVR replacement - voltage instability',
      'Bearing replacement',
      'Exciter repair',
      'Cooling fan motor replacement',
      'Stator winding repair',
    ],
  },
  crane_boom: {
    pm: [
      'Structural inspection completed',
      'Pin and bushing greased',
      'NDT inspection - no cracks',
      'Paint touch-up',
      'Hydraulic cylinder inspection',
    ],
    cm: [
      'Pin replacement - excessive wear',
      'Crack repair - weld remediation',
      'Bushing replacement',
      'Cylinder seal replacement',
      'Corrosion treatment',
    ],
  },
  slew_bearing: {
    pm: [
      'Slew bearing greased',
      'Bolt torque verification',
      'Backlash measurement - within spec',
      'Seal condition check',
      'Gear tooth inspection',
    ],
    cm: [
      'Seal replacement - grease leakage',
      'Bolt re-torquing - found loose',
      'Gear wear investigation',
      'Bearing noise investigation',
      'Emergency seal repair',
    ],
  },
}

const FLEET_PATTERNS_DATA: PMFleetPattern[] = [
  {
    equipmentType: 'wire_rope',
    pattern: 'Accelerated fatigue wear in high-cycle offshore operations',
    occurrences: 8,
    averageFailurePoint: { value: 11500, unit: 'cycles' },
    affectedAssets: ['Al Mirfa', 'Arzanah', 'SEP-450'],
    recommendedIntervention: 'Reduce inspection interval from 500h to 350h for offshore cranes',
  },
  {
    equipmentType: 'wire_rope',
    pattern: 'Corrosion-induced degradation in Arabian Gulf conditions',
    occurrences: 5,
    averageFailurePoint: { value: 9200, unit: 'cycles' },
    affectedAssets: ['Al Mirfa', 'Kawkab'],
    recommendedIntervention: 'Apply enhanced corrosion inhibitor every 100 operating hours',
  },
  {
    equipmentType: 'hoist_motor',
    pattern: 'Bearing degradation under continuous heavy-lift operations',
    occurrences: 6,
    averageFailurePoint: { value: 22000, unit: 'hours' },
    affectedAssets: ['SEP-450', 'Arzanah', 'Zakher'],
    recommendedIntervention: 'Increase bearing regreasing frequency to 1500h intervals',
  },
  {
    equipmentType: 'hoist_motor',
    pattern: 'Insulation degradation in high-humidity environments',
    occurrences: 4,
    averageFailurePoint: { value: 28000, unit: 'hours' },
    affectedAssets: ['Al Mirfa', 'Kawkab'],
    recommendedIntervention: 'Install dehumidifiers in motor housings',
  },
  {
    equipmentType: 'main_engine',
    pattern: 'Turbocharger bearing wear at high ambient temperatures',
    occurrences: 7,
    averageFailurePoint: { value: 18500, unit: 'hours' },
    affectedAssets: ['Al Mirfa', 'Arzanah', 'Kawkab', 'Zakher'],
    recommendedIntervention: 'Reduce turbo service interval to 8000h in summer months',
  },
  {
    equipmentType: 'main_engine',
    pattern: 'Injector coking from frequent load variations',
    occurrences: 9,
    averageFailurePoint: { value: 12000, unit: 'hours' },
    affectedAssets: ['Al Mirfa', 'Arzanah', 'Kawkab', 'Al Sadr', 'Zakher'],
    recommendedIntervention: 'Use premium fuel additives and increase injector inspection frequency',
  },
  {
    equipmentType: 'pump_system',
    pattern: 'Mechanical seal failure due to abrasive slurry content',
    occurrences: 12,
    averageFailurePoint: { value: 4500, unit: 'hours' },
    affectedAssets: ['Al Mirfa', 'Arzanah', 'Kawkab', 'Ghasha'],
    recommendedIntervention: 'Upgrade to tungsten carbide seal faces for dredge operations',
  },
  {
    equipmentType: 'pump_system',
    pattern: 'Impeller erosion from high-velocity sand particles',
    occurrences: 8,
    averageFailurePoint: { value: 6200, unit: 'hours' },
    affectedAssets: ['Al Mirfa', 'Arzanah', 'Ghasha'],
    recommendedIntervention: 'Install pre-strainers and monitor flow rate deviation',
  },
  {
    equipmentType: 'hydraulic_system',
    pattern: 'Contamination ingress through worn cylinder seals',
    occurrences: 6,
    averageFailurePoint: { value: 14000, unit: 'hours' },
    affectedAssets: ['SEP-450', 'Al Mirfa', 'Zakher'],
    recommendedIntervention: 'Implement ISO 4406 cleanliness monitoring program',
  },
  {
    equipmentType: 'slew_bearing',
    pattern: 'Raceway wear from sustained high-load operations',
    occurrences: 4,
    averageFailurePoint: { value: 32000, unit: 'hours' },
    affectedAssets: ['SEP-450', 'Arzanah'],
    recommendedIntervention: 'Reduce maximum continuous slew operations under full load',
  },
  {
    equipmentType: 'generator',
    pattern: 'AVR component degradation from voltage transients',
    occurrences: 5,
    averageFailurePoint: { value: 25000, unit: 'hours' },
    affectedAssets: ['Al Mirfa', 'Kawkab', 'Al Sadr'],
    recommendedIntervention: 'Install surge protection and conduct quarterly AVR checks',
  },
  {
    equipmentType: 'crane_boom',
    pattern: 'Fatigue cracking at boom-jib connection points',
    occurrences: 3,
    averageFailurePoint: { value: 65000, unit: 'hours' },
    affectedAssets: ['SEP-450', 'Arzanah'],
    recommendedIntervention: 'Implement annual MPI inspection at critical weld joints',
  },
]

export function getWorkOrderHistory(assetId: string, equipmentId: string): PMWorkOrder[] {
  const seed = hashCode(assetId + equipmentId)
  const random = seededRandom(seed)
  
  const equipmentType = equipmentId.includes('wire') ? 'wire_rope' :
    equipmentId.includes('hoist') || equipmentId.includes('motor') ? 'hoist_motor' :
    equipmentId.includes('engine') ? 'main_engine' :
    equipmentId.includes('pump') ? 'pump_system' :
    equipmentId.includes('hydraulic') ? 'hydraulic_system' :
    equipmentId.includes('generator') || equipmentId.includes('gen') ? 'generator' :
    equipmentId.includes('boom') ? 'crane_boom' :
    equipmentId.includes('slew') ? 'slew_bearing' : 'main_engine'

  const issues = WORK_ORDER_ISSUES[equipmentType as PMEquipmentType] || WORK_ORDER_ISSUES.main_engine

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
      equipmentId,
      equipmentName: equipmentId,
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

export function getFleetPatterns(equipmentType?: PMEquipmentType): PMFleetPattern[] {
  if (equipmentType) {
    return FLEET_PATTERNS_DATA.filter(p => p.equipmentType === equipmentType)
  }
  return FLEET_PATTERNS_DATA
}

export function getInspectionRecords(assetId: string, equipmentId: string): PMInspectionRecord[] {
  const seed = hashCode(assetId + equipmentId + 'inspection')
  const random = seededRandom(seed)

  const records: PMInspectionRecord[] = []
  const recordCount = Math.floor(random() * 4) + 2

  const conditions: Array<'good' | 'fair' | 'poor' | 'critical'> = ['good', 'fair', 'poor', 'critical']
  const inspectors = ['Ahmed Hassan', 'Mohammed Al-Rashid', 'Khalid Omar', 'Saeed Al-Mansoori']

  for (let i = 0; i < recordCount; i++) {
    const daysAgo = Math.floor(random() * 90) + 14
    const conditionIndex = Math.min(Math.floor(random() * 3), 3)
    
    records.push({
      id: `INS-${new Date().getFullYear()}-${String(Math.floor(random() * 900) + 100)}`,
      assetId,
      equipmentId,
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

export function getOilAnalysisRecords(assetId: string, equipmentId: string): PMOilAnalysis[] {
  const seed = hashCode(assetId + equipmentId + 'oil')
  const random = seededRandom(seed)

  const records: PMOilAnalysis[] = []
  const recordCount = Math.floor(random() * 3) + 1

  for (let i = 0; i < recordCount; i++) {
    const daysAgo = Math.floor(random() * 60) + 21
    const overallCondition = random() > 0.7 ? 'marginal' : random() > 0.9 ? 'critical' : 'good'
    
    records.push({
      id: `OIL-${new Date().getFullYear()}-${String(Math.floor(random() * 900) + 100)}`,
      assetId,
      equipmentId,
      date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      lab: 'SGS Middle East',
      results: [
        {
          parameter: 'Viscosity @ 40°C',
          value: 95 + Math.floor(random() * 20),
          unit: 'cSt',
          status: random() > 0.8 ? 'warning' : 'normal',
          trend: 'stable',
        },
        {
          parameter: 'Iron (Fe)',
          value: Math.floor(random() * 50) + 10,
          unit: 'ppm',
          status: random() > 0.7 ? 'warning' : 'normal',
          trend: random() > 0.5 ? 'increasing' : 'stable',
        },
        {
          parameter: 'Water Content',
          value: Math.floor(random() * 500) + 50,
          unit: 'ppm',
          status: random() > 0.85 ? 'warning' : 'normal',
          trend: 'stable',
        },
        {
          parameter: 'Particle Count ISO',
          value: Math.floor(random() * 4) + 16,
          unit: '/17/14',
          status: random() > 0.75 ? 'warning' : 'normal',
          trend: random() > 0.6 ? 'increasing' : 'stable',
        },
        {
          parameter: 'TAN',
          value: Math.round((random() * 2 + 0.5) * 10) / 10,
          unit: 'mgKOH/g',
          status: random() > 0.8 ? 'warning' : 'normal',
          trend: 'increasing',
        },
      ],
      overallCondition: overallCondition as 'good' | 'marginal' | 'critical',
      recommendation: overallCondition === 'critical' 
        ? 'Immediate oil change recommended. Investigate source of contamination.'
        : overallCondition === 'marginal'
        ? 'Schedule oil change within next 500 operating hours. Monitor wear metals.'
        : 'Oil condition acceptable. Continue normal monitoring.',
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
    findings.push('Minor wear observed on contact surfaces')
    findings.push('Lubrication adequate but due for service')
    if (random() > 0.5) findings.push('Small paint chips noted, no corrosion')
  } else if (condition === 'poor') {
    findings.push('Significant wear patterns detected')
    findings.push('Lubrication degraded, service overdue')
    findings.push('Early signs of fatigue noted')
    if (random() > 0.5) findings.push('Surface corrosion present')
  } else {
    findings.push('Critical wear requiring immediate attention')
    findings.push('Visible defects affecting operation')
    findings.push('Potential safety concern identified')
    findings.push('Recommend equipment stand-down pending repair')
  }
  
  return findings
}

function generateRecommendedActions(random: () => number): string[] {
  const actions = [
    'Schedule maintenance within 7 days',
    'Order replacement parts',
    'Increase inspection frequency',
    'Consult OEM for guidance',
    'Coordinate with operations for downtime',
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

