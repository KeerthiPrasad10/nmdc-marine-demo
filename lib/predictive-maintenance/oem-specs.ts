import { PMEquipmentProfile, PMEquipmentType } from './types'

export const OEM_EQUIPMENT_PROFILES: Record<PMEquipmentType, PMEquipmentProfile> = {
  wire_rope: {
    id: 'oem-wire-rope-001',
    equipmentType: 'wire_rope',
    manufacturer: 'Bridon-Bekaert',
    model: '8-Strand IWRC',
    specs: {
      ratedCapacity: 300,
      ratedCapacityUnit: 'tons',
      expectedLifeCycles: 15000,
      maxOperatingHours: 8000,
    },
    wearCurve: [
      { cycles: 0, healthPercent: 100 },
      { cycles: 3000, healthPercent: 95 },
      { cycles: 6000, healthPercent: 85 },
      { cycles: 9000, healthPercent: 70 },
      { cycles: 12000, healthPercent: 50 },
      { cycles: 14000, healthPercent: 30 },
      { cycles: 15000, healthPercent: 10 },
    ],
    failureModes: [
      {
        mode: 'Wire breakage due to fatigue',
        probability: 0.45,
        warningSignals: ['Visible broken wires', 'Increased diameter variation', 'Localized wear patterns'],
        mtbf: 12000,
      },
      {
        mode: 'Corrosion-induced degradation',
        probability: 0.25,
        warningSignals: ['Surface rust', 'Pitting', 'Reduced lubrication retention'],
        mtbf: 10000,
      },
      {
        mode: 'Abrasion wear',
        probability: 0.20,
        warningSignals: ['Flat spots on wires', 'Reduced rope diameter', 'Metallic debris'],
        mtbf: 11000,
      },
      {
        mode: 'Kinking or bird-caging',
        probability: 0.10,
        warningSignals: ['Deformation visible', 'Uneven load distribution', 'Abnormal sounds'],
        mtbf: 8000,
      },
    ],
    maintenanceTasks: [
      {
        task: 'Visual inspection',
        intervalHours: 50,
        estimatedDuration: 0.5,
      },
      {
        task: 'Lubrication application',
        intervalHours: 100,
        estimatedDuration: 1,
        requiredParts: ['Wire rope lubricant 5L'],
      },
      {
        task: 'Detailed NDT inspection',
        intervalHours: 500,
        estimatedDuration: 4,
      },
      {
        task: 'Full replacement',
        intervalHours: 8000,
        estimatedDuration: 24,
        requiredParts: ['Wire rope assembly', 'End fittings', 'Swage sleeves'],
      },
    ],
  },

  hoist_motor: {
    id: 'oem-hoist-motor-001',
    equipmentType: 'hoist_motor',
    manufacturer: 'ABB',
    model: 'AMI 450 Marine Motor',
    specs: {
      ratedCapacity: 750,
      ratedCapacityUnit: 'kW',
      maxOperatingHours: 40000,
      maintenanceIntervalHours: 4000,
      maxTemperature: 85,
      maxVibration: 4.5,
      mtbf: 35000,
    },
    wearCurve: [
      { cycles: 0, healthPercent: 100 },
      { cycles: 10000, healthPercent: 92 },
      { cycles: 20000, healthPercent: 80 },
      { cycles: 30000, healthPercent: 65 },
      { cycles: 35000, healthPercent: 45 },
      { cycles: 40000, healthPercent: 20 },
    ],
    failureModes: [
      {
        mode: 'Bearing failure',
        probability: 0.40,
        warningSignals: ['Increased vibration', 'Abnormal noise', 'Temperature rise', 'Grease discoloration'],
        mtbf: 25000,
      },
      {
        mode: 'Winding insulation breakdown',
        probability: 0.25,
        warningSignals: ['Partial discharge activity', 'Increased winding temperature', 'Megger test degradation'],
        mtbf: 35000,
      },
      {
        mode: 'Shaft seal failure',
        probability: 0.20,
        warningSignals: ['Oil leakage', 'Contamination in housing', 'Bearing temperature increase'],
        mtbf: 20000,
      },
      {
        mode: 'Cooling system degradation',
        probability: 0.15,
        warningSignals: ['Fan noise', 'Blocked vents', 'Elevated operating temperature'],
        mtbf: 30000,
      },
    ],
    maintenanceTasks: [
      {
        task: 'Vibration analysis',
        intervalHours: 500,
        estimatedDuration: 1,
      },
      {
        task: 'Bearing regreasing',
        intervalHours: 2000,
        estimatedDuration: 2,
        requiredParts: ['High-temp bearing grease 1kg'],
      },
      {
        task: 'Insulation resistance test',
        intervalHours: 4000,
        estimatedDuration: 2,
      },
      {
        task: 'Complete bearing replacement',
        intervalHours: 25000,
        estimatedDuration: 16,
        requiredParts: ['SKF 6320 bearing x2', 'Shaft seals', 'Bearing housing gaskets'],
      },
    ],
  },

  main_engine: {
    id: 'oem-main-engine-001',
    equipmentType: 'main_engine',
    manufacturer: 'Caterpillar Marine',
    model: 'CAT 3516E',
    specs: {
      ratedCapacity: 2525,
      ratedCapacityUnit: 'kW',
      maxOperatingHours: 60000,
      maintenanceIntervalHours: 500,
      maxTemperature: 95,
      mtbf: 50000,
    },
    wearCurve: [
      { cycles: 0, healthPercent: 100 },
      { cycles: 15000, healthPercent: 90 },
      { cycles: 30000, healthPercent: 75 },
      { cycles: 45000, healthPercent: 55 },
      { cycles: 55000, healthPercent: 35 },
      { cycles: 60000, healthPercent: 15 },
    ],
    failureModes: [
      {
        mode: 'Turbocharger failure',
        probability: 0.25,
        warningSignals: ['Reduced boost pressure', 'Abnormal turbo noise', 'Increased exhaust temperature', 'Black smoke'],
        mtbf: 20000,
      },
      {
        mode: 'Injector degradation',
        probability: 0.30,
        warningSignals: ['Poor fuel atomization', 'Increased fuel consumption', 'Rough running', 'Misfires'],
        mtbf: 15000,
      },
      {
        mode: 'Cylinder liner wear',
        probability: 0.20,
        warningSignals: ['Increased oil consumption', 'Blow-by gases', 'Compression loss'],
        mtbf: 40000,
      },
      {
        mode: 'Cooling system failure',
        probability: 0.15,
        warningSignals: ['Coolant loss', 'Temperature fluctuations', 'Corrosion in coolant'],
        mtbf: 25000,
      },
      {
        mode: 'Governor/control system fault',
        probability: 0.10,
        warningSignals: ['Speed hunting', 'Load acceptance issues', 'Sensor faults'],
        mtbf: 35000,
      },
    ],
    maintenanceTasks: [
      {
        task: 'Oil and filter change',
        intervalHours: 500,
        estimatedDuration: 4,
        requiredParts: ['Engine oil 200L', 'Oil filter x4', 'Fuel filter x2'],
      },
      {
        task: 'Valve clearance adjustment',
        intervalHours: 2000,
        estimatedDuration: 8,
      },
      {
        task: 'Injector overhaul',
        intervalHours: 8000,
        estimatedDuration: 16,
        requiredParts: ['Injector nozzles x16', 'Injector seals kit'],
      },
      {
        task: 'Turbocharger service',
        intervalHours: 10000,
        estimatedDuration: 12,
        requiredParts: ['Turbo bearing kit', 'Turbo seals'],
      },
      {
        task: 'Major overhaul',
        intervalHours: 30000,
        estimatedDuration: 120,
        requiredParts: ['Piston rings x16', 'Bearings set', 'Gasket set', 'Liner sleeves'],
      },
    ],
  },

  pump_system: {
    id: 'oem-pump-001',
    equipmentType: 'pump_system',
    manufacturer: 'Warman',
    model: 'WBH 500',
    specs: {
      ratedCapacity: 5000,
      ratedCapacityUnit: 'm³/hr',
      maxOperatingHours: 20000,
      maintenanceIntervalHours: 2000,
      maxVibration: 6.0,
      mtbf: 15000,
    },
    wearCurve: [
      { cycles: 0, healthPercent: 100 },
      { cycles: 5000, healthPercent: 88 },
      { cycles: 10000, healthPercent: 70 },
      { cycles: 15000, healthPercent: 48 },
      { cycles: 18000, healthPercent: 30 },
      { cycles: 20000, healthPercent: 10 },
    ],
    failureModes: [
      {
        mode: 'Impeller erosion',
        probability: 0.35,
        warningSignals: ['Reduced flow rate', 'Increased vibration', 'Cavitation noise', 'Pressure drop'],
        mtbf: 8000,
      },
      {
        mode: 'Mechanical seal failure',
        probability: 0.30,
        warningSignals: ['Seal leakage', 'Contamination in bearing housing', 'Temperature rise at seal'],
        mtbf: 6000,
      },
      {
        mode: 'Bearing failure',
        probability: 0.25,
        warningSignals: ['High vibration amplitude', 'Bearing temperature', 'Abnormal noise'],
        mtbf: 12000,
      },
      {
        mode: 'Shaft wear/damage',
        probability: 0.10,
        warningSignals: ['Shaft runout', 'Seal wear pattern', 'Coupling misalignment'],
        mtbf: 18000,
      },
    ],
    maintenanceTasks: [
      {
        task: 'Seal inspection',
        intervalHours: 500,
        estimatedDuration: 1,
      },
      {
        task: 'Vibration monitoring',
        intervalHours: 250,
        estimatedDuration: 0.5,
      },
      {
        task: 'Mechanical seal replacement',
        intervalHours: 4000,
        estimatedDuration: 8,
        requiredParts: ['Mechanical seal assembly', 'O-rings kit'],
      },
      {
        task: 'Impeller replacement',
        intervalHours: 8000,
        estimatedDuration: 16,
        requiredParts: ['Impeller', 'Wear plates', 'Volute liner'],
      },
      {
        task: 'Complete pump overhaul',
        intervalHours: 16000,
        estimatedDuration: 48,
        requiredParts: ['Overhaul kit', 'Bearings', 'Shaft sleeves', 'Impeller'],
      },
    ],
  },

  hydraulic_system: {
    id: 'oem-hydraulic-001',
    equipmentType: 'hydraulic_system',
    manufacturer: 'Bosch Rexroth',
    model: 'A4VSO Series',
    specs: {
      ratedCapacity: 500,
      ratedCapacityUnit: 'bar',
      maxOperatingHours: 30000,
      maintenanceIntervalHours: 1000,
      maxTemperature: 70,
      mtbf: 25000,
    },
    wearCurve: [
      { cycles: 0, healthPercent: 100 },
      { cycles: 7500, healthPercent: 90 },
      { cycles: 15000, healthPercent: 75 },
      { cycles: 22500, healthPercent: 55 },
      { cycles: 27500, healthPercent: 35 },
      { cycles: 30000, healthPercent: 15 },
    ],
    failureModes: [
      {
        mode: 'Internal pump wear',
        probability: 0.30,
        warningSignals: ['Reduced system pressure', 'Increased cycle time', 'Pump noise change'],
        mtbf: 20000,
      },
      {
        mode: 'Oil contamination',
        probability: 0.25,
        warningSignals: ['Particle count increase', 'Filter bypass', 'Valve sticking'],
        mtbf: 15000,
      },
      {
        mode: 'Seal/hose failure',
        probability: 0.25,
        warningSignals: ['External leakage', 'Hose bulging', 'Fitting weepage'],
        mtbf: 12000,
      },
      {
        mode: 'Valve malfunction',
        probability: 0.20,
        warningSignals: ['Erratic operation', 'Slow response', 'Overheating'],
        mtbf: 22000,
      },
    ],
    maintenanceTasks: [
      {
        task: 'Oil analysis',
        intervalHours: 500,
        estimatedDuration: 0.5,
      },
      {
        task: 'Filter replacement',
        intervalHours: 1000,
        estimatedDuration: 2,
        requiredParts: ['Hydraulic filter element x3'],
      },
      {
        task: 'Hose inspection',
        intervalHours: 2000,
        estimatedDuration: 4,
      },
      {
        task: 'Complete oil change',
        intervalHours: 5000,
        estimatedDuration: 8,
        requiredParts: ['Hydraulic oil ISO VG46 500L'],
      },
      {
        task: 'Pump overhaul',
        intervalHours: 20000,
        estimatedDuration: 24,
        requiredParts: ['Pump repair kit', 'Bearings', 'Seals'],
      },
    ],
  },

  generator: {
    id: 'oem-generator-001',
    equipmentType: 'generator',
    manufacturer: 'Cummins Power Generation',
    model: 'QSK60-G',
    specs: {
      ratedCapacity: 2000,
      ratedCapacityUnit: 'kVA',
      maxOperatingHours: 50000,
      maintenanceIntervalHours: 500,
      maxTemperature: 90,
      mtbf: 40000,
    },
    wearCurve: [
      { cycles: 0, healthPercent: 100 },
      { cycles: 12500, healthPercent: 92 },
      { cycles: 25000, healthPercent: 78 },
      { cycles: 37500, healthPercent: 58 },
      { cycles: 45000, healthPercent: 38 },
      { cycles: 50000, healthPercent: 15 },
    ],
    failureModes: [
      {
        mode: 'AVR/excitation failure',
        probability: 0.25,
        warningSignals: ['Voltage instability', 'Frequency hunting', 'Excitation current anomaly'],
        mtbf: 30000,
      },
      {
        mode: 'Stator winding degradation',
        probability: 0.20,
        warningSignals: ['Insulation resistance drop', 'Partial discharge', 'Hot spots'],
        mtbf: 45000,
      },
      {
        mode: 'Bearing wear',
        probability: 0.30,
        warningSignals: ['Vibration increase', 'Temperature rise', 'Noise change'],
        mtbf: 25000,
      },
      {
        mode: 'Engine-generator coupling issue',
        probability: 0.15,
        warningSignals: ['Alignment drift', 'Vibration at 1x RPM', 'Coupling wear'],
        mtbf: 35000,
      },
      {
        mode: 'Cooling fan/system failure',
        probability: 0.10,
        warningSignals: ['Overheating', 'Fan bearing noise', 'Reduced airflow'],
        mtbf: 20000,
      },
    ],
    maintenanceTasks: [
      {
        task: 'Routine inspection',
        intervalHours: 250,
        estimatedDuration: 1,
      },
      {
        task: 'Oil and filter service',
        intervalHours: 500,
        estimatedDuration: 4,
        requiredParts: ['Engine oil 100L', 'Oil filter x2', 'Fuel filter'],
      },
      {
        task: 'Insulation testing',
        intervalHours: 4000,
        estimatedDuration: 4,
      },
      {
        task: 'Bearing inspection/regreasing',
        intervalHours: 8000,
        estimatedDuration: 8,
        requiredParts: ['Generator bearing grease 2kg'],
      },
      {
        task: 'Major service',
        intervalHours: 20000,
        estimatedDuration: 48,
        requiredParts: ['Service kit', 'Bearings', 'Coupling elements'],
      },
    ],
  },

  crane_boom: {
    id: 'oem-crane-boom-001',
    equipmentType: 'crane_boom',
    manufacturer: 'Huisman',
    model: 'Offshore Crane Boom',
    specs: {
      ratedCapacity: 300,
      ratedCapacityUnit: 'tons',
      maxOperatingHours: 100000,
      maintenanceIntervalHours: 2000,
      mtbf: 80000,
    },
    wearCurve: [
      { cycles: 0, healthPercent: 100 },
      { cycles: 25000, healthPercent: 95 },
      { cycles: 50000, healthPercent: 85 },
      { cycles: 75000, healthPercent: 70 },
      { cycles: 90000, healthPercent: 50 },
      { cycles: 100000, healthPercent: 25 },
    ],
    failureModes: [
      {
        mode: 'Structural fatigue crack',
        probability: 0.30,
        warningSignals: ['Crack detection in NDT', 'Paint flaking at stress points', 'Deformation'],
        mtbf: 70000,
      },
      {
        mode: 'Pin/bushing wear',
        probability: 0.35,
        warningSignals: ['Play in joints', 'Squeaking', 'Uneven wear pattern'],
        mtbf: 30000,
      },
      {
        mode: 'Corrosion damage',
        probability: 0.25,
        warningSignals: ['Surface rust', 'Pitting', 'Paint degradation'],
        mtbf: 50000,
      },
      {
        mode: 'Hydraulic cylinder failure',
        probability: 0.10,
        warningSignals: ['Leakage', 'Slow movement', 'Rod scoring'],
        mtbf: 25000,
      },
    ],
    maintenanceTasks: [
      {
        task: 'Visual inspection',
        intervalHours: 500,
        estimatedDuration: 2,
      },
      {
        task: 'Pin and bushing greasing',
        intervalHours: 250,
        estimatedDuration: 4,
        requiredParts: ['Grease 10kg'],
      },
      {
        task: 'NDT inspection',
        intervalHours: 5000,
        estimatedDuration: 16,
      },
      {
        task: 'Pin and bushing replacement',
        intervalHours: 25000,
        estimatedDuration: 48,
        requiredParts: ['Pin set', 'Bushings', 'Seals'],
      },
    ],
  },

  slew_bearing: {
    id: 'oem-slew-bearing-001',
    equipmentType: 'slew_bearing',
    manufacturer: 'Rothe Erde',
    model: 'KD 800 Series',
    specs: {
      ratedCapacity: 400,
      ratedCapacityUnit: 'tons',
      maxOperatingHours: 50000,
      maintenanceIntervalHours: 500,
      maxVibration: 3.0,
      mtbf: 40000,
    },
    wearCurve: [
      { cycles: 0, healthPercent: 100 },
      { cycles: 12500, healthPercent: 90 },
      { cycles: 25000, healthPercent: 75 },
      { cycles: 37500, healthPercent: 55 },
      { cycles: 45000, healthPercent: 35 },
      { cycles: 50000, healthPercent: 10 },
    ],
    failureModes: [
      {
        mode: 'Raceway wear',
        probability: 0.35,
        warningSignals: ['Increased rotational resistance', 'Play in bearing', 'Noise during slewing'],
        mtbf: 35000,
      },
      {
        mode: 'Seal degradation',
        probability: 0.25,
        warningSignals: ['Grease leakage', 'Contamination ingress', 'Corrosion at seal area'],
        mtbf: 20000,
      },
      {
        mode: 'Gear tooth wear',
        probability: 0.25,
        warningSignals: ['Backlash increase', 'Gear noise', 'Vibration during slewing'],
        mtbf: 30000,
      },
      {
        mode: 'Bolt loosening/failure',
        probability: 0.15,
        warningSignals: ['Torque loss on bolts', 'Movement at interface', 'Fretting corrosion'],
        mtbf: 25000,
      },
    ],
    maintenanceTasks: [
      {
        task: 'Greasing',
        intervalHours: 250,
        estimatedDuration: 2,
        requiredParts: ['Slew bearing grease 5kg'],
      },
      {
        task: 'Bolt torque check',
        intervalHours: 1000,
        estimatedDuration: 4,
      },
      {
        task: 'Backlash measurement',
        intervalHours: 2000,
        estimatedDuration: 2,
      },
      {
        task: 'Seal replacement',
        intervalHours: 15000,
        estimatedDuration: 24,
        requiredParts: ['Seal kit'],
      },
      {
        task: 'Full bearing replacement',
        intervalHours: 40000,
        estimatedDuration: 168,
        requiredParts: ['Slew bearing assembly', 'Mounting hardware', 'Seals'],
      },
    ],
  },
}

export function getOEMProfile(equipmentType: PMEquipmentType): PMEquipmentProfile {
  return OEM_EQUIPMENT_PROFILES[equipmentType]
}

export function getWearPercentage(equipmentType: PMEquipmentType, currentCycles: number): number {
  const profile = OEM_EQUIPMENT_PROFILES[equipmentType]
  if (!profile.wearCurve || profile.wearCurve.length === 0) return 100

  const curve = profile.wearCurve
  
  if (currentCycles <= curve[0].cycles) return curve[0].healthPercent
  if (currentCycles >= curve[curve.length - 1].cycles) return curve[curve.length - 1].healthPercent

  for (let i = 0; i < curve.length - 1; i++) {
    if (currentCycles >= curve[i].cycles && currentCycles < curve[i + 1].cycles) {
      const ratio = (currentCycles - curve[i].cycles) / (curve[i + 1].cycles - curve[i].cycles)
      return curve[i].healthPercent - ratio * (curve[i].healthPercent - curve[i + 1].healthPercent)
    }
  }

  return 50
}

export function getNextMaintenanceTask(
  equipmentType: PMEquipmentType, 
  currentHours: number
): { task: string; dueInHours: number; estimatedDuration: number; parts?: string[] } | null {
  const profile = OEM_EQUIPMENT_PROFILES[equipmentType]
  if (!profile.maintenanceTasks || profile.maintenanceTasks.length === 0) return null

  let nearestTask = null
  let nearestDue = Infinity

  for (const task of profile.maintenanceTasks) {
    const lastCompleted = Math.floor(currentHours / task.intervalHours) * task.intervalHours
    const nextDue = lastCompleted + task.intervalHours
    const dueInHours = nextDue - currentHours

    if (dueInHours > 0 && dueInHours < nearestDue) {
      nearestDue = dueInHours
      nearestTask = {
        task: task.task,
        dueInHours,
        estimatedDuration: task.estimatedDuration,
        parts: task.requiredParts,
      }
    }
  }

  return nearestTask
}

export function getMostLikelyFailureMode(
  equipmentType: PMEquipmentType,
  vibration?: number,
  temperature?: number
): { mode: string; probability: number; warningSignals: string[] } | null {
  const profile = OEM_EQUIPMENT_PROFILES[equipmentType]
  if (!profile.failureModes || profile.failureModes.length === 0) return null

  let highestProbability = 0
  let mostLikely = null

  for (const fm of profile.failureModes) {
    let adjustedProbability = fm.probability

    if (vibration && profile.specs.maxVibration) {
      const vibrationRatio = vibration / profile.specs.maxVibration
      if (vibrationRatio > 0.8 && fm.warningSignals.some(s => s.toLowerCase().includes('vibration'))) {
        adjustedProbability *= 1.5
      }
    }

    if (temperature && profile.specs.maxTemperature) {
      const tempRatio = temperature / profile.specs.maxTemperature
      if (tempRatio > 0.8 && fm.warningSignals.some(s => s.toLowerCase().includes('temperature') || s.toLowerCase().includes('heat'))) {
        adjustedProbability *= 1.4
      }
    }

    if (adjustedProbability > highestProbability) {
      highestProbability = adjustedProbability
      mostLikely = {
        mode: fm.mode,
        probability: Math.min(0.95, adjustedProbability),
        warningSignals: fm.warningSignals,
      }
    }
  }

  return mostLikely
}

