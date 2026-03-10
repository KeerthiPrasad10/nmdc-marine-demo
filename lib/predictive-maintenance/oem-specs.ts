import { PMEquipmentProfile, PMEquipmentType } from './types'

export const OEM_EQUIPMENT_PROFILES: Record<PMEquipmentType, PMEquipmentProfile> = {
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

  propulsion_drive: {
    id: 'oem-propulsion-drive-001',
    equipmentType: 'propulsion_drive',
    manufacturer: 'ABB',
    model: 'Azipod CO Series',
    specs: {
      ratedCapacity: 5000,
      ratedCapacityUnit: 'kW',
      maxOperatingHours: 50000,
      maintenanceIntervalHours: 4000,
      maxTemperature: 85,
      maxVibration: 4.5,
      mtbf: 40000,
    },
    wearCurve: [
      { cycles: 0, healthPercent: 100 },
      { cycles: 12500, healthPercent: 92 },
      { cycles: 25000, healthPercent: 80 },
      { cycles: 37500, healthPercent: 65 },
      { cycles: 45000, healthPercent: 45 },
      { cycles: 50000, healthPercent: 20 },
    ],
    failureModes: [
      {
        mode: 'Bearing failure',
        probability: 0.35,
        warningSignals: ['Increased vibration', 'Temperature rise', 'Noise change'],
        mtbf: 30000,
      },
      {
        mode: 'Propeller pitch control failure',
        probability: 0.25,
        warningSignals: ['Pitch response sluggish', 'Hydraulic pressure drop', 'Speed hunting'],
        mtbf: 25000,
      },
      {
        mode: 'Shaft seal degradation',
        probability: 0.25,
        warningSignals: ['Oil leak at seal', 'Contamination', 'Seal temperature rise'],
        mtbf: 20000,
      },
      {
        mode: 'Motor winding degradation',
        probability: 0.15,
        warningSignals: ['Insulation resistance drop', 'Hot spots', 'Partial discharge'],
        mtbf: 45000,
      },
    ],
    maintenanceTasks: [
      {
        task: 'Vibration analysis',
        intervalHours: 500,
        estimatedDuration: 1,
      },
      {
        task: 'Propeller inspection',
        intervalHours: 2000,
        estimatedDuration: 4,
      },
      {
        task: 'Pitch system service',
        intervalHours: 4000,
        estimatedDuration: 8,
        requiredParts: ['Pitch system seals', 'Hydraulic oil'],
      },
      {
        task: 'Complete drive overhaul',
        intervalHours: 25000,
        estimatedDuration: 72,
        requiredParts: ['Bearing set', 'Shaft seals', 'Coupling elements'],
      },
    ],
  },

  steering_system: {
    id: 'oem-steering-001',
    equipmentType: 'steering_system',
    manufacturer: 'Rolls-Royce',
    model: 'Rotary Vane Steering Gear',
    specs: {
      ratedCapacity: 100,
      ratedCapacityUnit: 'tons-m',
      maxOperatingHours: 40000,
      maintenanceIntervalHours: 2000,
      maxVibration: 3.0,
      mtbf: 35000,
    },
    wearCurve: [
      { cycles: 0, healthPercent: 100 },
      { cycles: 10000, healthPercent: 92 },
      { cycles: 20000, healthPercent: 80 },
      { cycles: 30000, healthPercent: 65 },
      { cycles: 36000, healthPercent: 45 },
      { cycles: 40000, healthPercent: 20 },
    ],
    failureModes: [
      {
        mode: 'Hydraulic pump wear',
        probability: 0.30,
        warningSignals: ['Slow steering response', 'Pressure drop', 'Pump noise'],
        mtbf: 25000,
      },
      {
        mode: 'Rudder bearing wear',
        probability: 0.30,
        warningSignals: ['Play in rudder stock', 'Vibration during turns', 'Noise at helm'],
        mtbf: 30000,
      },
      {
        mode: 'Solenoid valve failure',
        probability: 0.25,
        warningSignals: ['Steering lag', 'Erratic response', 'Electrical fault alarm'],
        mtbf: 20000,
      },
      {
        mode: 'Hydraulic line leak',
        probability: 0.15,
        warningSignals: ['Fluid level drop', 'Visible oil on deck', 'Reduced pressure'],
        mtbf: 18000,
      },
    ],
    maintenanceTasks: [
      {
        task: 'Hydraulic fluid check',
        intervalHours: 250,
        estimatedDuration: 0.5,
      },
      {
        task: 'Steering gear test',
        intervalHours: 500,
        estimatedDuration: 1,
      },
      {
        task: 'Pump and valve service',
        intervalHours: 4000,
        estimatedDuration: 8,
        requiredParts: ['Seal kit', 'Valve cartridges'],
      },
      {
        task: 'Rudder bearing inspection',
        intervalHours: 10000,
        estimatedDuration: 16,
        requiredParts: ['Bearing grease 5kg'],
      },
    ],
  },

  ramp_system: {
    id: 'oem-ramp-001',
    equipmentType: 'ramp_system',
    manufacturer: 'MacGregor',
    model: 'RoRo Stern/Bow Ramp',
    specs: {
      ratedCapacity: 80,
      ratedCapacityUnit: 'tons',
      maxOperatingHours: 30000,
      maintenanceIntervalHours: 1000,
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
        mode: 'Hydraulic cylinder seal failure',
        probability: 0.35,
        warningSignals: ['Oil seepage', 'Ramp drift', 'Slow operation'],
        mtbf: 15000,
      },
      {
        mode: 'Hinge pin wear',
        probability: 0.30,
        warningSignals: ['Ramp misalignment', 'Unusual noise', 'Vibration during operation'],
        mtbf: 20000,
      },
      {
        mode: 'Chain elongation',
        probability: 0.20,
        warningSignals: ['Ramp leveling issues', 'Chain slack', 'Sprocket skip'],
        mtbf: 18000,
      },
      {
        mode: 'Structural fatigue',
        probability: 0.15,
        warningSignals: ['Surface cracks', 'Deformation', 'Paint cracking at welds'],
        mtbf: 25000,
      },
    ],
    maintenanceTasks: [
      {
        task: 'Visual inspection',
        intervalHours: 250,
        estimatedDuration: 1,
      },
      {
        task: 'Hinge pin lubrication',
        intervalHours: 500,
        estimatedDuration: 2,
        requiredParts: ['Marine grease 5kg'],
      },
      {
        task: 'Cylinder seal inspection',
        intervalHours: 2000,
        estimatedDuration: 4,
      },
      {
        task: 'Chain adjustment',
        intervalHours: 5000,
        estimatedDuration: 8,
        requiredParts: ['Chain links', 'Shackles'],
      },
    ],
  },

  navigation_electronics: {
    id: 'oem-nav-electronics-001',
    equipmentType: 'navigation_electronics',
    manufacturer: 'Furuno',
    model: 'FAR-2228 Radar / GP-170 GPS',
    specs: {
      maxOperatingHours: 60000,
      maintenanceIntervalHours: 8760,
      mtbf: 50000,
    },
    wearCurve: [
      { cycles: 0, healthPercent: 100 },
      { cycles: 15000, healthPercent: 95 },
      { cycles: 30000, healthPercent: 85 },
      { cycles: 45000, healthPercent: 70 },
      { cycles: 55000, healthPercent: 50 },
      { cycles: 60000, healthPercent: 25 },
    ],
    failureModes: [
      {
        mode: 'Radar magnetron degradation',
        probability: 0.30,
        warningSignals: ['Reduced range', 'Weak targets', 'Signal dropout'],
        mtbf: 12000,
      },
      {
        mode: 'GPS antenna cable degradation',
        probability: 0.25,
        warningSignals: ['Position jumps', 'Signal-to-noise decline', 'Intermittent fix'],
        mtbf: 20000,
      },
      {
        mode: 'Display unit failure',
        probability: 0.25,
        warningSignals: ['Screen artifacts', 'Backlight dimming', 'Touch unresponsive'],
        mtbf: 30000,
      },
      {
        mode: 'AIS transceiver fault',
        probability: 0.20,
        warningSignals: ['No AIS targets', 'Own vessel not broadcasting', 'Error codes'],
        mtbf: 25000,
      },
    ],
    maintenanceTasks: [
      {
        task: 'System diagnostic check',
        intervalHours: 1000,
        estimatedDuration: 1,
      },
      {
        task: 'Antenna inspection',
        intervalHours: 4000,
        estimatedDuration: 2,
      },
      {
        task: 'Software update',
        intervalHours: 8760,
        estimatedDuration: 4,
      },
      {
        task: 'Magnetron replacement',
        intervalHours: 12000,
        estimatedDuration: 8,
        requiredParts: ['Magnetron unit', 'Waveguide gaskets'],
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

