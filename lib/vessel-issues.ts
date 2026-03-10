export interface EquipmentIssue {
  equipmentName: string
  category: string
  issue: string
  healthScore: number
  temperature?: number
  vibration?: number
  status: 'critical' | 'warning' | 'degraded'
  pmPrediction: {
    predictedIssue: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    warningSignals: string[]
    recommendedAction: string
    timeToFailure?: string
    confidence?: number
  }
}

export interface VesselIssues {
  mmsi: string
  vesselName: string
  vesselType: string
  issues: EquipmentIssue[]
}

export const VESSEL_ISSUES: Record<string, VesselIssues> = {
  '366709770': {
    mmsi: '366709770',
    vesselName: 'M/V Puyallup',
    vesselType: 'jumbo_mark_ii',
    issues: [
      {
        equipmentName: 'Propulsion System',
        category: 'propulsion',
        issue: 'Starboard diesel-electric motor bearing temperature trending up',
        healthScore: 62,
        temperature: 94,
        vibration: 6.8,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Motor bearing failure causing propulsion loss',
          priority: 'high',
          warningSignals: [
            'Bearing temp 15°C above baseline',
            'Vibration at bearing frequency increasing',
            'Grease analysis shows metallic particles',
          ],
          recommendedAction: 'Replace motor bearings during next scheduled dry dock',
          timeToFailure: '200 operating hours',
          confidence: 87,
        },
      },
      {
        equipmentName: 'Vehicle Ramp System',
        category: 'hydraulic',
        issue: 'Port vehicle loading ramp hydraulic cylinder seal degradation',
        healthScore: 71,
        temperature: 72,
        vibration: 4.2,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Ramp positioning drift during loading operations',
          priority: 'medium',
          warningSignals: [
            'Minor oil seepage at cylinder rod',
            'Ramp leveling response 1.5s slower',
            'Hydraulic pressure drops when holding position',
          ],
          recommendedAction: 'Schedule seal kit replacement at next terminal layover',
          timeToFailure: '400 operating hours',
          confidence: 78,
        },
      },
      {
        equipmentName: 'Navigation System',
        category: 'navigation',
        issue: 'Radar #2 intermittent signal dropout',
        healthScore: 75,
        temperature: 58,
        vibration: 2.1,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Complete radar failure in adverse weather',
          priority: 'medium',
          warningSignals: [
            'Signal dropout 3-4 times per crossing',
            'Magnetron output power reduced 12%',
            'Waveguide connector showing corrosion',
          ],
          recommendedAction: 'Replace magnetron and inspect waveguide',
          timeToFailure: '600 operating hours',
          confidence: 74,
        },
      },
    ],
  },
  
  '366709790': {
    mmsi: '366709790',
    vesselName: 'M/V Wenatchee',
    vesselType: 'jumbo_mark_ii',
    issues: [
      {
        equipmentName: 'Propulsion System',
        category: 'propulsion',
        issue: 'Port engine turbocharger surge at high RPM',
        healthScore: 55,
        temperature: 98,
        vibration: 8.5,
        status: 'critical',
        pmPrediction: {
          predictedIssue: 'Turbocharger failure causing engine power loss',
          priority: 'critical',
          warningSignals: [
            'Compressor surge audible above 80% load',
            'Exhaust temperature variance 45°C between cylinders',
            'Boost pressure 15% below specification',
          ],
          recommendedAction: 'IMMEDIATE: Reduce max RPM. Schedule turbocharger replacement.',
          timeToFailure: '80 operating hours',
          confidence: 93,
        },
      },
      {
        equipmentName: 'Fire Suppression System',
        category: 'safety',
        issue: 'Engine room CO2 release valve actuator sticking',
        healthScore: 68,
        temperature: 62,
        vibration: 3.5,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Delayed fire suppression response',
          priority: 'high',
          warningSignals: [
            'Actuator test showed 4s delay vs 1s spec',
            'Solenoid coil resistance out of range',
            'Manual override tested satisfactory',
          ],
          recommendedAction: 'Replace CO2 release valve solenoid actuator',
          timeToFailure: 'Safety critical - immediate',
          confidence: 89,
        },
      },
      {
        equipmentName: 'Passenger HVAC System',
        category: 'hvac',
        issue: 'Main deck air handler compressor efficiency decline',
        healthScore: 74,
        temperature: 82,
        vibration: 4.8,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Passenger comfort degradation on warm weather crossings',
          priority: 'low',
          warningSignals: [
            'Cooling capacity down 20% from rated',
            'Compressor cycling more frequently',
            'Refrigerant pressure trending low',
          ],
          recommendedAction: 'Check for refrigerant leak and compressor overhaul',
          timeToFailure: '500 operating hours',
          confidence: 72,
        },
      },
    ],
  },

  '366709810': {
    mmsi: '366709810',
    vesselName: 'M/V Spokane',
    vesselType: 'jumbo',
    issues: [
      {
        equipmentName: 'Steering System',
        category: 'hydraulic',
        issue: 'Rudder actuator hydraulic pump pressure fluctuation',
        healthScore: 58,
        temperature: 86,
        vibration: 7.2,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Steering response degradation in heavy seas',
          priority: 'high',
          warningSignals: [
            'Pressure swings of ±15 bar during hard-over',
            'Pump cavitation noise at low temperatures',
            'Rudder response time 0.8s slower than spec',
          ],
          recommendedAction: 'Hydraulic pump overhaul and system flush',
          timeToFailure: '150 operating hours',
          confidence: 85,
        },
      },
      {
        equipmentName: 'Generator System',
        category: 'electrical',
        issue: 'Ship service generator #2 AVR fault',
        healthScore: 67,
        temperature: 78,
        vibration: 5.4,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Voltage instability causing equipment trips',
          priority: 'medium',
          warningSignals: [
            'Voltage regulation ±8% vs ±2.5% spec',
            'Occasional load-sharing hunting',
            'AVR board showing component degradation',
          ],
          recommendedAction: 'Replace AVR board and recalibrate',
          timeToFailure: '300 operating hours',
          confidence: 80,
        },
      },
      {
        equipmentName: 'Vehicle Ramp System',
        category: 'hydraulic',
        issue: 'Stern vehicle ramp chain wear approaching limit',
        healthScore: 72,
        temperature: 65,
        vibration: 4.1,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Chain elongation affecting ramp alignment',
          priority: 'medium',
          warningSignals: [
            'Chain stretch measured at 2.5% (limit 3%)',
            'Sprocket tooth wear visible',
            'Ramp leveling requires manual adjustment',
          ],
          recommendedAction: 'Plan chain replacement during annual overhaul',
          timeToFailure: '400 operating hours',
          confidence: 76,
        },
      },
    ],
  },
  
  '366709840': {
    mmsi: '366709840',
    vesselName: 'M/V Kaleetan',
    vesselType: 'super',
    issues: [
      {
        equipmentName: 'Propulsion System',
        category: 'propulsion',
        issue: 'Controllable pitch propeller hub seal leak',
        healthScore: 48,
        temperature: 88,
        vibration: 9.1,
        status: 'critical',
        pmPrediction: {
          predictedIssue: 'Progressive oil loss causing CPP malfunction',
          priority: 'critical',
          warningSignals: [
            'Oil consumption doubled in past month',
            'Pitch change response sluggish',
            'Oil sheen observed around stern gland',
          ],
          recommendedAction: 'IMMEDIATE: Schedule emergency dry dock for hub seal replacement',
          timeToFailure: '60 operating hours',
          confidence: 94,
        },
      },
      {
        equipmentName: 'Passenger Safety System',
        category: 'safety',
        issue: 'Life raft hydrostatic release unit approaching expiry',
        healthScore: 70,
        temperature: 55,
        vibration: 1.8,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Non-compliance with USCG safety requirements',
          priority: 'medium',
          warningSignals: [
            '4 of 12 HRUs expire within 30 days',
            'Annual service overdue by 15 days',
            'Certification pending renewal',
          ],
          recommendedAction: 'Replace expiring HRUs and complete annual service',
          timeToFailure: '30 days',
          confidence: 99,
        },
      },
      {
        equipmentName: 'Bilge System',
        category: 'hydraulic',
        issue: 'Engine room bilge pump #1 impeller erosion',
        healthScore: 73,
        temperature: 68,
        vibration: 5.6,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Reduced bilge pumping capacity',
          priority: 'low',
          warningSignals: [
            'Pump flow rate reduced 25%',
            'Higher current draw at same flow',
            'Impeller clearance out of spec',
          ],
          recommendedAction: 'Replace bilge pump impeller',
          timeToFailure: '500 operating hours',
          confidence: 77,
        },
      },
    ],
  },
  
  '366709860': {
    mmsi: '366709860',
    vesselName: 'M/V Chelan',
    vesselType: 'issaquah_130',
    issues: [
      {
        equipmentName: 'Propulsion System',
        category: 'propulsion',
        issue: 'Main engine cooling water pump bearing noise',
        healthScore: 64,
        temperature: 82,
        vibration: 7.8,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Cooling pump failure causing engine overheating',
          priority: 'high',
          warningSignals: [
            'Bearing noise audible above idle',
            'Pump shaft runout exceeds tolerance',
            'Coolant temperature 8°C above normal',
          ],
          recommendedAction: 'Replace cooling water pump at next scheduled maintenance',
          timeToFailure: '120 operating hours',
          confidence: 86,
        },
      },
      {
        equipmentName: 'Vehicle Ramp System',
        category: 'hydraulic',
        issue: 'Bow ramp hinge pin wear detected',
        healthScore: 69,
        temperature: 65,
        vibration: 5.2,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Ramp alignment issues during docking',
          priority: 'medium',
          warningSignals: [
            'Pin clearance 1.5mm above tolerance',
            'Visible wear on bushings',
            'Ramp creaks during operation',
          ],
          recommendedAction: 'Schedule hinge pin and bushing replacement',
          timeToFailure: '350 operating hours',
          confidence: 79,
        },
      },
      {
        equipmentName: 'Navigation System',
        category: 'navigation',
        issue: 'GPS antenna cable degradation',
        healthScore: 76,
        temperature: 52,
        vibration: 1.5,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Intermittent GPS position loss',
          priority: 'low',
          warningSignals: [
            'Signal-to-noise ratio declining',
            'Occasional position jumps of 5-10m',
            'Cable connector shows moisture ingress',
          ],
          recommendedAction: 'Replace GPS antenna cable run',
          timeToFailure: '800 operating hours',
          confidence: 71,
        },
      },
    ],
  },
  
  '366709910': {
    mmsi: '366709910',
    vesselName: 'M/V Chetzemoka',
    vesselType: 'olympic',
    issues: [
      {
        equipmentName: 'Propulsion System',
        category: 'propulsion',
        issue: 'Diesel-electric drive inverter thermal fault',
        healthScore: 56,
        temperature: 95,
        vibration: 6.4,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Inverter shutdown causing propulsion loss',
          priority: 'high',
          warningSignals: [
            'IGBT module temperature 10°C above threshold',
            'Cooling fan airflow reduced 30%',
            'Inverter derates above 85% load',
          ],
          recommendedAction: 'Replace inverter cooling fans and inspect IGBT modules',
          timeToFailure: '100 operating hours',
          confidence: 88,
        },
      },
      {
        equipmentName: 'Vehicle Ramp System',
        category: 'hydraulic',
        issue: 'Vehicle ramp limit switch intermittent failure',
        healthScore: 72,
        temperature: 58,
        vibration: 3.2,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Ramp position control unreliable',
          priority: 'medium',
          warningSignals: [
            'Limit switch signal dropout 2-3 times per shift',
            'Switch housing showing water ingress',
            'Wiring insulation cracked at terminal',
          ],
          recommendedAction: 'Replace limit switches and rewire connections',
          timeToFailure: '250 operating hours',
          confidence: 81,
        },
      },
      {
        equipmentName: 'Generator System',
        category: 'electrical',
        issue: 'Emergency generator auto-start battery weak',
        healthScore: 77,
        temperature: 62,
        vibration: 2.4,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Emergency generator may not start on demand',
          priority: 'medium',
          warningSignals: [
            'Cranking voltage drops to 9.8V (min 10.2V)',
            'Battery internal resistance increasing',
            'Cold start test marginal',
          ],
          recommendedAction: 'Replace emergency generator starting batteries',
          timeToFailure: '60 days',
          confidence: 83,
        },
      },
    ],
  },
}

export function getVesselIssues(mmsi: string): VesselIssues | null {
  return VESSEL_ISSUES[mmsi] || null
}

export function hasVesselIssues(mmsi: string): boolean {
  return mmsi in VESSEL_ISSUES
}

export function getEquipmentOverrides(mmsi: string): Map<string, Partial<{
  health_score: number
  temperature: number
  vibration: number
  status: string
}>> {
  const vesselIssues = getVesselIssues(mmsi)
  if (!vesselIssues) return new Map()
  
  const overrides = new Map<string, Partial<{
    health_score: number
    temperature: number
    vibration: number
    status: string
  }>>()
  
  for (const issue of vesselIssues.issues) {
    const key = issue.equipmentName.toLowerCase()
    overrides.set(key, {
      health_score: issue.healthScore,
      temperature: issue.temperature,
      vibration: issue.vibration,
      status: issue.status,
    })
  }
  
  return overrides
}

export interface VesselIssueSummary {
  issueCount: number
  worstPriority: 'critical' | 'high' | 'medium' | 'low' | null
  worstHealth: number
  hasHighPriority: boolean
  hasCritical: boolean
}

export function getVesselIssueSummary(mmsi: string): VesselIssueSummary {
  const vesselIssues = getVesselIssues(mmsi)
  
  if (!vesselIssues || vesselIssues.issues.length === 0) {
    return {
      issueCount: 0,
      worstPriority: null,
      worstHealth: 100,
      hasHighPriority: false,
      hasCritical: false,
    }
  }
  
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  let worstPriority: 'critical' | 'high' | 'medium' | 'low' = 'low'
  let worstHealth = 100
  let hasCritical = false
  let hasHighPriority = false
  
  for (const issue of vesselIssues.issues) {
    const priority = issue.pmPrediction.priority
    if (priorityOrder[priority] < priorityOrder[worstPriority]) {
      worstPriority = priority
    }
    if (issue.healthScore < worstHealth) {
      worstHealth = issue.healthScore
    }
    if (priority === 'critical') hasCritical = true
    if (priority === 'critical' || priority === 'high') hasHighPriority = true
  }
  
  return {
    issueCount: vesselIssues.issues.length,
    worstPriority,
    worstHealth,
    hasHighPriority,
    hasCritical,
  }
}
