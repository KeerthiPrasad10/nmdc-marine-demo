import { PMWorkOrder, PMFleetPattern, PMInspectionRecord, PMOilAnalysis, PMEquipmentType } from './types'

const WORK_ORDER_ISSUES: Record<PMEquipmentType, { pm: string[]; cm: string[] }> = {
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
  propulsion_drive: {
    pm: [
      'Vibration analysis completed',
      'Propeller inspection - no damage',
      'Pitch system hydraulic pressure check',
      'Shaft seal inspection',
      'Motor insulation resistance test',
    ],
    cm: [
      'Bearing replacement - excessive vibration',
      'Propeller blade repair - cavitation damage',
      'Pitch control valve replacement',
      'Shaft seal replacement - oil leakage',
      'Motor winding repair - insulation failure',
    ],
  },
  steering_system: {
    pm: [
      'Hydraulic fluid level and condition check',
      'Steering gear functional test',
      'Rudder bearing clearance measurement',
      'Solenoid valve response test',
      'Emergency steering drill completed',
    ],
    cm: [
      'Hydraulic pump replacement - low pressure',
      'Rudder bearing bushing replacement',
      'Solenoid valve replacement - steering lag',
      'Hydraulic hose replacement - leak detected',
      'Control unit board replacement',
    ],
  },
  ramp_system: {
    pm: [
      'Visual inspection of ramp structure',
      'Hinge pin lubrication completed',
      'Hydraulic cylinder seal inspection',
      'Chain tension adjustment',
      'Ramp limit switch test',
    ],
    cm: [
      'Hydraulic cylinder seal replacement - drift',
      'Hinge pin replacement - excessive play',
      'Chain link replacement - elongation',
      'Ramp structural weld repair',
      'Emergency hydraulic hose replacement',
    ],
  },
  navigation_electronics: {
    pm: [
      'Radar performance monitor test',
      'GPS signal strength verification',
      'ECDIS chart database update',
      'AIS transceiver functional test',
      'VHF radio check completed',
    ],
    cm: [
      'Radar magnetron replacement - weak signal',
      'GPS antenna cable replacement',
      'ECDIS display unit replacement',
      'AIS transceiver replacement - no targets',
      'Gyro compass recalibration - heading drift',
    ],
  },
}

const FLEET_PATTERNS_DATA: PMFleetPattern[] = [
  {
    equipmentType: 'main_engine',
    pattern: 'Injector coking from frequent load variations in ferry stop-start operations',
    occurrences: 9,
    averageFailurePoint: { value: 12000, unit: 'hours' },
    affectedAssets: ['M/V Puyallup', 'M/V Tacoma', 'M/V Wenatchee', 'M/V Spokane'],
    recommendedIntervention: 'Use premium fuel additives and increase injector inspection frequency',
  },
  {
    equipmentType: 'main_engine',
    pattern: 'Turbocharger bearing wear at high ambient temperatures during summer',
    occurrences: 7,
    averageFailurePoint: { value: 18500, unit: 'hours' },
    affectedAssets: ['M/V Puyallup', 'M/V Tacoma', 'M/V Wenatchee'],
    recommendedIntervention: 'Reduce turbo service interval to 8000h in summer months',
  },
  {
    equipmentType: 'propulsion_drive',
    pattern: 'Bearing wear from frequent forward-astern maneuvers and docking cycles',
    occurrences: 8,
    averageFailurePoint: { value: 28000, unit: 'hours' },
    affectedAssets: ['M/V Spokane', 'M/V Wenatchee', 'M/V Tacoma'],
    recommendedIntervention: 'Increase propulsion drive bearing inspection to quarterly intervals',
  },
  {
    equipmentType: 'propulsion_drive',
    pattern: 'Propeller cavitation damage in shallow terminal approaches',
    occurrences: 10,
    averageFailurePoint: { value: 14000, unit: 'hours' },
    affectedAssets: ['M/V Chetzemoka', 'M/V Salish', 'M/V Kennewick'],
    recommendedIntervention: 'Conduct quarterly underwater inspections and optimize approach speeds',
  },
  {
    equipmentType: 'steering_system',
    pattern: 'Hydraulic pump wear from continuous maneuvering in confined terminals',
    occurrences: 6,
    averageFailurePoint: { value: 18000, unit: 'hours' },
    affectedAssets: ['M/V Puyallup', 'M/V Kaleetan', 'M/V Yakima'],
    recommendedIntervention: 'Increase hydraulic oil analysis frequency and monitor pump pressure trends',
  },
  {
    equipmentType: 'ramp_system',
    pattern: 'Hydraulic cylinder seal degradation from high-frequency loading cycles',
    occurrences: 12,
    averageFailurePoint: { value: 10000, unit: 'hours' },
    affectedAssets: ['M/V Puyallup', 'M/V Tacoma', 'M/V Wenatchee', 'M/V Spokane'],
    recommendedIntervention: 'Replace cylinder seals at 8000h intervals rather than waiting for leakage',
  },
  {
    equipmentType: 'ramp_system',
    pattern: 'Hinge pin wear accelerated by saltwater exposure at vehicle deck level',
    occurrences: 8,
    averageFailurePoint: { value: 15000, unit: 'hours' },
    affectedAssets: ['M/V Puyallup', 'M/V Tacoma', 'M/V Kaleetan'],
    recommendedIntervention: 'Apply marine-grade grease and install protective boots on exposed pins',
  },
  {
    equipmentType: 'pump_system',
    pattern: 'Ballast pump seal failure from saltwater and sediment ingestion',
    occurrences: 7,
    averageFailurePoint: { value: 6500, unit: 'hours' },
    affectedAssets: ['M/V Puyallup', 'M/V Wenatchee', 'M/V Spokane'],
    recommendedIntervention: 'Install pre-strainers on ballast intakes and monitor seal temperatures',
  },
  {
    equipmentType: 'hydraulic_system',
    pattern: 'Contamination ingress through worn cylinder seals on car deck equipment',
    occurrences: 6,
    averageFailurePoint: { value: 14000, unit: 'hours' },
    affectedAssets: ['M/V Puyallup', 'M/V Tacoma', 'M/V Wenatchee'],
    recommendedIntervention: 'Implement ISO 4406 cleanliness monitoring program',
  },
  {
    equipmentType: 'generator',
    pattern: 'AVR component degradation from voltage transients during ramp operations',
    occurrences: 5,
    averageFailurePoint: { value: 25000, unit: 'hours' },
    affectedAssets: ['M/V Puyallup', 'M/V Kaleetan', 'M/V Yakima'],
    recommendedIntervention: 'Install surge protection and conduct quarterly AVR checks',
  },
  {
    equipmentType: 'navigation_electronics',
    pattern: 'GPS antenna cable degradation from continuous marine environment exposure',
    occurrences: 4,
    averageFailurePoint: { value: 18000, unit: 'hours' },
    affectedAssets: ['M/V Puyallup', 'M/V Tacoma'],
    recommendedIntervention: 'Implement annual GPS antenna and cabling inspection for corrosion/damage',
  },
  {
    equipmentType: 'navigation_electronics',
    pattern: 'Radar magnetron early failure from power cycling during layovers',
    occurrences: 5,
    averageFailurePoint: { value: 10000, unit: 'hours' },
    affectedAssets: ['M/V Spokane', 'M/V Wenatchee', 'M/V Kaleetan'],
    recommendedIntervention: 'Keep radar in standby rather than full power-down during short layovers',
  },
]

export function getWorkOrderHistory(assetId: string, equipmentId: string): PMWorkOrder[] {
  const seed = hashCode(assetId + equipmentId)
  const random = seededRandom(seed)
  
  const equipmentType = equipmentId.includes('engine') ? 'main_engine' :
    equipmentId.includes('pump') ? 'pump_system' :
    equipmentId.includes('hydraulic') ? 'hydraulic_system' :
    equipmentId.includes('generator') || equipmentId.includes('gen') ? 'generator' :
    equipmentId.includes('propulsion') || equipmentId.includes('drive') ? 'propulsion_drive' :
    equipmentId.includes('steering') || equipmentId.includes('rudder') ? 'steering_system' :
    equipmentId.includes('ramp') ? 'ramp_system' :
    equipmentId.includes('nav') || equipmentId.includes('radar') || equipmentId.includes('gps') ? 'navigation_electronics' : 'main_engine'

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
  const inspectors = ['James Peterson', 'Sarah Chen', 'Mike O\'Brien', 'David Nakamura']

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
      lab: 'Puget Sound Analytical',
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

