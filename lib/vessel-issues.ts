/**
 * Vessel-Specific Equipment Issues
 * 
 * This maps specific vessels to their known equipment issues,
 * ensuring coherent storytelling between:
 * - 3D Digital Twin sensors
 * - Predictive Maintenance predictions
 * - Alerts and notifications
 * - Troubleshooting context
 * 
 * Each vessel has 3 PM stories that match their actual systems.
 */

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

// =============================================================================
// PIPELAY BARGES - Systems: Tensioner, Stinger, Main Crane, Mooring, Ballast
// =============================================================================

export const VESSEL_ISSUES: Record<string, VesselIssues> = {
  '470284000': {
    mmsi: '470284000',
    vesselName: 'DLB-1000',
    vesselType: 'pipelay_barge',
    issues: [
      {
        equipmentName: 'Tensioner System',
        category: 'hydraulic',
        issue: 'Track pad wear detected - grip pressure reducing',
        healthScore: 62,
        temperature: 78,
        vibration: 6.8,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Track pad degradation causing pipe slippage risk',
          priority: 'high',
          warningSignals: [
            'Grip pressure reduced by 15%',
            'Uneven wear pattern on pads',
            'Increased hydraulic compensation',
          ],
          recommendedAction: 'Replace track pads on tensioner units 1 & 3',
          timeToFailure: '180 operating hours',
          confidence: 87,
        },
      },
      {
        equipmentName: 'Stinger System',
        category: 'hydraulic',
        issue: 'Articulation cylinder seal degradation',
        healthScore: 71,
        temperature: 82,
        vibration: 4.5,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Stinger angle control drift',
          priority: 'medium',
          warningSignals: [
            'Minor oil seepage at cylinder rod',
            'Position holding drift of 0.3°',
            'Elevated cylinder temperature',
          ],
          recommendedAction: 'Schedule seal kit replacement during next mobilization',
          timeToFailure: '400 operating hours',
          confidence: 78,
        },
      },
      {
        equipmentName: 'Main Crane System',
        category: 'crane',
        issue: 'Hoist wire rope showing fatigue indicators',
        healthScore: 68,
        temperature: 65,
        vibration: 5.2,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Wire rope strand breakage risk',
          priority: 'high',
          warningSignals: [
            '3 broken wires in 6-rope diameter length',
            'Increased rope stretch during lifts',
            'MPI detected internal corrosion',
          ],
          recommendedAction: 'Wire rope replacement required within 150 lift cycles',
          timeToFailure: '150 lift cycles',
          confidence: 91,
        },
      },
    ],
  },
  
  '470339000': {
    mmsi: '470339000',
    vesselName: 'DLB-750',
    vesselType: 'pipelay_barge',
    issues: [
      {
        equipmentName: 'Tensioner System',
        category: 'hydraulic',
        issue: 'Hydraulic accumulator pre-charge low',
        healthScore: 58,
        temperature: 74,
        vibration: 7.2,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Tensioner response lag during pipe movement',
          priority: 'high',
          warningSignals: [
            'Pre-charge pressure dropped 20%',
            'Slower clamping response time',
            'Pressure spikes during tension changes',
          ],
          recommendedAction: 'Recharge accumulators and check bladder integrity',
          timeToFailure: '100 operating hours',
          confidence: 85,
        },
      },
      {
        equipmentName: 'Mooring System',
        category: 'safety',
        issue: 'Anchor winch #4 brake band wear',
        healthScore: 65,
        temperature: 88,
        vibration: 5.4,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Brake holding capacity reduction',
          priority: 'medium',
          warningSignals: [
            'Brake band thickness below 60%',
            'Higher brake drum temperature',
            'Increased brake adjustment frequency',
          ],
          recommendedAction: 'Replace brake band on winch #4',
          timeToFailure: '300 operating hours',
          confidence: 82,
        },
      },
      {
        equipmentName: 'Ballast System',
        category: 'hydraulic',
        issue: 'Ballast pump #2 cavitation detected',
        healthScore: 73,
        temperature: 68,
        vibration: 6.1,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Pump impeller erosion',
          priority: 'medium',
          warningSignals: [
            'Cavitation noise at high flow rates',
            'Reduced discharge pressure',
            'Vibration increase during startup',
          ],
          recommendedAction: 'Check suction strainer and impeller condition',
          timeToFailure: '500 operating hours',
          confidence: 75,
        },
      },
    ],
  },
  
  '470285000': {
    mmsi: '470285000',
    vesselName: 'PLB-648',
    vesselType: 'pipelay_barge',
    issues: [
      {
        equipmentName: 'Stinger System',
        category: 'hydraulic',
        issue: 'Stinger hinge pin wear - critical',
        healthScore: 48,
        temperature: 92,
        vibration: 8.5,
        status: 'critical',
        pmPrediction: {
          predictedIssue: 'Hinge joint failure risk during pipe lay',
          priority: 'critical',
          warningSignals: [
            'Pin clearance exceeds tolerance by 2mm',
            'Metal particles in grease samples',
            'Audible clunking during articulation',
          ],
          recommendedAction: 'IMMEDIATE: Replace hinge pins before next pipe lay operation',
          timeToFailure: '50 operating hours',
          confidence: 94,
        },
      },
      {
        equipmentName: 'Tensioner System',
        category: 'hydraulic',
        issue: 'Track chain elongation approaching limit',
        healthScore: 64,
        temperature: 76,
        vibration: 5.8,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Track misalignment causing uneven pipe grip',
          priority: 'high',
          warningSignals: [
            'Chain stretch measured at 2.8%',
            'Track alignment deviation detected',
            'Increased track tension required',
          ],
          recommendedAction: 'Plan track chain replacement during next dry dock',
          timeToFailure: '250 operating hours',
          confidence: 83,
        },
      },
      {
        equipmentName: 'Main Crane System',
        category: 'crane',
        issue: 'Slew bearing grease degradation',
        healthScore: 72,
        temperature: 71,
        vibration: 4.8,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Slew bearing accelerated wear',
          priority: 'medium',
          warningSignals: [
            'Grease sample shows oxidation',
            'Slight grinding noise during slew',
            'Increased slew motor current',
          ],
          recommendedAction: 'Full grease replacement and bearing inspection',
          timeToFailure: '600 operating hours',
          confidence: 76,
        },
      },
    ],
  },

  // =============================================================================
  // DERRICK BARGES - Systems: Main Crane, Ballast, Mooring
  // =============================================================================
  
  '470212000': {
    mmsi: '470212000',
    vesselName: 'DLS-4200',
    vesselType: 'derrick_barge',
    issues: [
      {
        equipmentName: 'Main Crane System',
        category: 'crane',
        issue: 'Boom hoist wire rope nearing replacement criteria',
        healthScore: 56,
        temperature: 68,
        vibration: 7.8,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Wire rope failure during heavy lift',
          priority: 'critical',
          warningSignals: [
            '6 broken wires detected in 30-diameter length',
            'Diameter reduction of 5%',
            'Core degradation visible on MPI',
          ],
          recommendedAction: 'Replace boom hoist wire rope before next platform lift',
          timeToFailure: '80 lift cycles',
          confidence: 92,
        },
      },
      {
        equipmentName: 'Ballast System',
        category: 'hydraulic',
        issue: 'Ballast transfer valve response degraded',
        healthScore: 69,
        temperature: 74,
        vibration: 5.1,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Ballast transfer rate reduction',
          priority: 'medium',
          warningSignals: [
            'Valve actuation time increased 40%',
            'Occasional position feedback errors',
            'Higher actuator current draw',
          ],
          recommendedAction: 'Valve actuator overhaul during scheduled maintenance',
          timeToFailure: '400 operating hours',
          confidence: 79,
        },
      },
      {
        equipmentName: 'Mooring System',
        category: 'safety',
        issue: 'Mooring winch #6 hydraulic motor wear',
        healthScore: 66,
        temperature: 86,
        vibration: 6.4,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Winch speed reduction under load',
          priority: 'medium',
          warningSignals: [
            'Motor case drain flow increased 25%',
            'Speed drops under high tension',
            'Elevated motor temperature',
          ],
          recommendedAction: 'Motor overhaul or replacement',
          timeToFailure: '350 operating hours',
          confidence: 81,
        },
      },
    ],
  },
  
  '471026000': {
    mmsi: '471026000',
    vesselName: 'DELMA 2000',
    vesselType: 'derrick_barge',
    issues: [
      {
        equipmentName: 'Main Crane System',
        category: 'crane',
        issue: 'Main hoist gearbox imminent failure - metal debris detected',
        healthScore: 47,
        temperature: 98,
        vibration: 9.8,
        status: 'critical',
        pmPrediction: {
          predictedIssue: 'Catastrophic gearbox failure during heavy lift operation',
          priority: 'critical',
          warningSignals: [
            'Iron particle count critical (180 ppm)',
            'Gearbox temperature 25°C above normal',
            'Severe vibration spikes during load',
            'Audible grinding from gear mesh',
          ],
          recommendedAction: 'IMMEDIATE: Cease heavy lift operations. Emergency gearbox replacement required.',
          timeToFailure: '40 operating hours',
          confidence: 96,
        },
      },
      {
        equipmentName: 'Ballast System',
        category: 'hydraulic',
        issue: 'Ballast pump seal leakage detected',
        healthScore: 71,
        temperature: 72,
        vibration: 4.9,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Progressive seal failure',
          priority: 'medium',
          warningSignals: [
            'Visible oil seepage at pump shaft',
            'Pump priming issues occasionally',
            'Slight flow rate reduction',
          ],
          recommendedAction: 'Schedule mechanical seal replacement',
          timeToFailure: '450 operating hours',
          confidence: 77,
        },
      },
      {
        equipmentName: 'Mooring System',
        category: 'safety',
        issue: 'Wire rope fairlead roller bearing noise',
        healthScore: 74,
        temperature: 65,
        vibration: 5.6,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Fairlead roller seizure risk',
          priority: 'low',
          warningSignals: [
            'Squeaking noise during wire payout',
            'Uneven roller rotation',
            'Grease contamination',
          ],
          recommendedAction: 'Replace fairlead roller bearings',
          timeToFailure: '600 operating hours',
          confidence: 72,
        },
      },
    ],
  },

  // =============================================================================
  // JACK-UP PLATFORMS - Systems: Jacking, Leg, Main Crane, Power Generation
  // =============================================================================
  
  '470340000': {
    mmsi: '470340000',
    vesselName: 'SEP-450',
    vesselType: 'jack_up',
    issues: [
      {
        equipmentName: 'Jacking System',
        category: 'hydraulic',
        issue: 'Leg #2 jacking unit pinion gear wear',
        healthScore: 58,
        temperature: 82,
        vibration: 8.1,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Jacking speed reduction and gear damage',
          priority: 'high',
          warningSignals: [
            'Gear tooth pitting visible on inspection',
            'Jacking time increased 15%',
            'Higher motor current during jacking',
          ],
          recommendedAction: 'Plan pinion gear replacement during next repositioning',
          timeToFailure: '40 jacking cycles',
          confidence: 88,
        },
      },
      {
        equipmentName: 'Power Generation',
        category: 'electrical',
        issue: 'Generator #1 bearing temperature trending up',
        healthScore: 67,
        temperature: 94,
        vibration: 4.8,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Generator bearing failure',
          priority: 'medium',
          warningSignals: [
            'Bearing temp 12°C above baseline',
            'Slight vibration increase at bearing frequency',
            'Grease analysis shows wear particles',
          ],
          recommendedAction: 'Replace generator bearing at next scheduled maintenance',
          timeToFailure: '500 operating hours',
          confidence: 82,
        },
      },
      {
        equipmentName: 'Leg System',
        category: 'safety',
        issue: 'Leg #3 guide wear plates need inspection',
        healthScore: 74,
        temperature: 58,
        vibration: 3.9,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Increased leg movement during jacking',
          priority: 'low',
          warningSignals: [
            'Guide clearance increased',
            'Minor scraping sounds during jacking',
            'Wear visible on guide surfaces',
          ],
          recommendedAction: 'Inspect and measure guide wear plates',
          timeToFailure: '100 jacking cycles',
          confidence: 74,
        },
      },
    ],
  },
  
  '470114000': {
    mmsi: '470114000',
    vesselName: 'SEP-550',
    vesselType: 'jack_up',
    issues: [
      {
        equipmentName: 'Jacking System',
        category: 'hydraulic',
        issue: 'Jacking HPU accumulator pressure decay',
        healthScore: 64,
        temperature: 76,
        vibration: 5.4,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Jacking system response lag',
          priority: 'high',
          warningSignals: [
            'Pre-charge holding time reduced',
            'Pressure fluctuation during jacking',
            'Emergency stop response slower',
          ],
          recommendedAction: 'Replace accumulator bladders and recharge',
          timeToFailure: '60 jacking cycles',
          confidence: 86,
        },
      },
      {
        equipmentName: 'Main Crane System',
        category: 'crane',
        issue: 'Crane boom structural fatigue monitoring',
        healthScore: 72,
        temperature: 62,
        vibration: 4.2,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Fatigue crack initiation at stress concentration',
          priority: 'medium',
          warningSignals: [
            'Strain gauge readings elevated',
            'Minor paint cracking at weld joints',
            'Approaching design fatigue cycles',
          ],
          recommendedAction: 'NDT inspection of boom weld joints',
          timeToFailure: '800 lift cycles',
          confidence: 71,
        },
      },
      {
        equipmentName: 'Power Generation',
        category: 'electrical',
        issue: 'Generator #2 cooling fan efficiency reduced',
        healthScore: 76,
        temperature: 88,
        vibration: 3.6,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Generator overheating under full load',
          priority: 'low',
          warningSignals: [
            'Air flow reduced 20%',
            'Higher operating temperature',
            'Fan motor current slightly elevated',
          ],
          recommendedAction: 'Clean cooling system and check fan belt',
          timeToFailure: '700 operating hours',
          confidence: 73,
        },
      },
    ],
  },
  
  '470426000': {
    mmsi: '470426000',
    vesselName: 'SEP-650',
    vesselType: 'jack_up',
    issues: [
      {
        equipmentName: 'Jacking System',
        category: 'hydraulic',
        issue: 'Jacking motor efficiency declining',
        healthScore: 69,
        temperature: 78,
        vibration: 5.8,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Extended jacking times',
          priority: 'medium',
          warningSignals: [
            'Motor volumetric efficiency down 8%',
            'Case drain flow increasing',
            'Jacking current higher than baseline',
          ],
          recommendedAction: 'Plan motor overhaul during scheduled maintenance',
          timeToFailure: '80 jacking cycles',
          confidence: 79,
        },
      },
      {
        equipmentName: 'Leg System',
        category: 'safety',
        issue: 'Spud can #1 minor settlement observed',
        healthScore: 73,
        temperature: 55,
        vibration: 3.2,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Uneven platform level',
          priority: 'medium',
          warningSignals: [
            'Settlement rate 2mm/day',
            'Leg load distribution shifted',
            'Inclinometer showing 0.1° tilt',
          ],
          recommendedAction: 'Monitor settlement and plan repositioning if continues',
          timeToFailure: 'Monitoring',
          confidence: 68,
        },
      },
      {
        equipmentName: 'Main Crane System',
        category: 'crane',
        issue: 'Auxiliary hoist brake adjustment required',
        healthScore: 77,
        temperature: 68,
        vibration: 4.1,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Brake holding torque reduction',
          priority: 'low',
          warningSignals: [
            'Brake travel at upper limit',
            'Slight drift when holding load',
            'Higher pedal effort required',
          ],
          recommendedAction: 'Adjust brake and inspect linings',
          timeToFailure: '200 lift cycles',
          confidence: 75,
        },
      },
    ],
  },
  
  '470395000': {
    mmsi: '470395000',
    vesselName: 'SEP-750',
    vesselType: 'jack_up',
    issues: [
      {
        equipmentName: 'Leg System',
        category: 'safety',
        issue: 'Leg #4 rack teeth inspection due',
        healthScore: 71,
        temperature: 62,
        vibration: 4.5,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Rack tooth wear affecting jacking',
          priority: 'medium',
          warningSignals: [
            'Approaching 500 jacking cycles since last inspection',
            'Minor surface wear visible',
            'Lubrication consumption increased',
          ],
          recommendedAction: 'Detailed rack inspection and measurement',
          timeToFailure: '50 jacking cycles',
          confidence: 76,
        },
      },
      {
        equipmentName: 'Jacking System',
        category: 'hydraulic',
        issue: 'Hydraulic oil contamination warning',
        healthScore: 66,
        temperature: 74,
        vibration: 5.2,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Accelerated component wear',
          priority: 'high',
          warningSignals: [
            'Particle count exceeds ISO 18/16/13',
            'Water content at 0.08%',
            'Filter differential pressure rising',
          ],
          recommendedAction: 'Full hydraulic oil change and system flush',
          timeToFailure: '150 operating hours',
          confidence: 85,
        },
      },
      {
        equipmentName: 'Power Generation',
        category: 'electrical',
        issue: 'Generator synchronization drift',
        healthScore: 75,
        temperature: 72,
        vibration: 3.8,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Load sharing imbalance',
          priority: 'low',
          warningSignals: [
            'Sync time increased',
            'Minor frequency hunting',
            'Governor response slower',
          ],
          recommendedAction: 'Governor calibration and load sharing check',
          timeToFailure: '400 operating hours',
          confidence: 71,
        },
      },
    ],
  },

  // =============================================================================
  // DP SUPPLY VESSEL - Systems: Propulsion, DP System
  // =============================================================================
  
  '470927000': {
    mmsi: '470927000',
    vesselName: 'UMM SHAIF',
    vesselType: 'supply',
    issues: [
      {
        equipmentName: 'Propulsion System',
        category: 'propulsion',
        issue: 'Thruster #2 propeller cavitation erosion',
        healthScore: 52,
        temperature: 74,
        vibration: 9.2,
        status: 'critical',
        pmPrediction: {
          predictedIssue: 'Propeller blade failure and thrust loss',
          priority: 'critical',
          warningSignals: [
            'Cavitation noise increased significantly',
            'Thrust efficiency down 18%',
            'Vibration spikes during DP operations',
          ],
          recommendedAction: 'URGENT: Propeller inspection/repair at next port call',
          timeToFailure: '100 operating hours',
          confidence: 93,
        },
      },
      {
        equipmentName: 'DP System',
        category: 'navigation',
        issue: 'Position reference sensor drift detected',
        healthScore: 68,
        temperature: 58,
        vibration: 2.8,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'DP position accuracy degradation',
          priority: 'high',
          warningSignals: [
            'Reference comparison variance 0.8m',
            'More frequent DP alarms',
            'Higher thruster activity for station keeping',
          ],
          recommendedAction: 'Sensor recalibration and reference system check',
          timeToFailure: '200 operating hours',
          confidence: 84,
        },
      },
      {
        equipmentName: 'Propulsion System',
        category: 'propulsion',
        issue: 'Main engine #1 turbocharger bearing wear',
        healthScore: 65,
        temperature: 88,
        vibration: 6.4,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Turbocharger failure and power loss',
          priority: 'medium',
          warningSignals: [
            'Turbo speed fluctuation',
            'Boost pressure slightly reduced',
            'Oil consumption increased',
          ],
          recommendedAction: 'Turbocharger overhaul during next scheduled maintenance',
          timeToFailure: '350 operating hours',
          confidence: 80,
        },
      },
    ],
  },

  // =============================================================================
  // TUG/AHTS VESSELS - Systems: Propulsion, Towing Equipment
  // =============================================================================
  
  '470337000': {
    mmsi: '470337000',
    vesselName: 'NPCC SAADIYAT',
    vesselType: 'tug',
    issues: [
      {
        equipmentName: 'Towing Equipment',
        category: 'safety',
        issue: 'Tow winch brake band thickness below limit',
        healthScore: 59,
        temperature: 92,
        vibration: 6.8,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Brake failure during towing operations',
          priority: 'critical',
          warningSignals: [
            'Brake band at 40% remaining',
            'Higher drum temperature during holds',
            'Brake slip observed under high load',
          ],
          recommendedAction: 'Replace brake bands before next towing operation',
          timeToFailure: '80 operating hours',
          confidence: 91,
        },
      },
      {
        equipmentName: 'Propulsion System',
        category: 'propulsion',
        issue: 'Starboard azimuth thruster steering lag',
        healthScore: 68,
        temperature: 78,
        vibration: 5.6,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Reduced maneuverability during operations',
          priority: 'medium',
          warningSignals: [
            'Steering response 2 seconds slower',
            'Hydraulic pressure fluctuation',
            'Feedback sensor intermittent',
          ],
          recommendedAction: 'Steering system hydraulic overhaul',
          timeToFailure: '250 operating hours',
          confidence: 79,
        },
      },
      {
        equipmentName: 'Towing Equipment',
        category: 'safety',
        issue: 'Stern roller bearing wear',
        healthScore: 73,
        temperature: 68,
        vibration: 4.9,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Roller seizure and tow wire damage',
          priority: 'low',
          warningSignals: [
            'Roller rotation resistance increased',
            'Minor squeaking noise',
            'Grease contamination detected',
          ],
          recommendedAction: 'Replace stern roller bearings',
          timeToFailure: '400 operating hours',
          confidence: 74,
        },
      },
    ],
  },
  
  '470642000': {
    mmsi: '470642000',
    vesselName: 'NPCC YAS',
    vesselType: 'tug',
    issues: [
      {
        equipmentName: 'Propulsion System',
        category: 'propulsion',
        issue: 'Port engine turbocharger surge detected',
        healthScore: 62,
        temperature: 96,
        vibration: 7.4,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Turbocharger failure and power reduction',
          priority: 'high',
          warningSignals: [
            'Compressor surge at high load',
            'Exhaust temperature variance',
            'Unusual turbo whistling sound',
          ],
          recommendedAction: 'Turbocharger inspection and possible replacement',
          timeToFailure: '150 operating hours',
          confidence: 86,
        },
      },
      {
        equipmentName: 'Towing Equipment',
        category: 'safety',
        issue: 'Tow winch hydraulic motor internal leakage',
        healthScore: 66,
        temperature: 84,
        vibration: 5.8,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Reduced winch speed and pulling power',
          priority: 'medium',
          warningSignals: [
            'Motor case drain flow elevated',
            'Winch speed reduced 12% under load',
            'Oil temperature higher than normal',
          ],
          recommendedAction: 'Motor seal replacement',
          timeToFailure: '200 operating hours',
          confidence: 81,
        },
      },
      {
        equipmentName: 'Propulsion System',
        category: 'propulsion',
        issue: 'Azimuth gearbox oil analysis warning',
        healthScore: 71,
        temperature: 76,
        vibration: 5.1,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Gear wear progression',
          priority: 'medium',
          warningSignals: [
            'Iron content 65 ppm (limit 80)',
            'Oil viscosity slightly reduced',
            'Minor gear whine noise',
          ],
          recommendedAction: 'Oil change and trending, plan inspection',
          timeToFailure: '500 operating hours',
          confidence: 75,
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
