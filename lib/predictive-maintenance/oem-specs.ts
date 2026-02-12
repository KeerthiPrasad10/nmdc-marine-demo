import { PMEquipmentProfile, PMComponentType } from './types'

export const OEM_COMPONENT_PROFILES: Record<PMComponentType, PMEquipmentProfile> = {
  winding: {
    id: 'oem-winding-001',
    componentType: 'winding',
    manufacturer: 'ABB / Hitachi Energy',
    model: 'Power Transformer Winding Assembly',
    specs: {
      maxTemperature: 110,
      maxMoisture: 35,
      expectedLifeYears: 50,
      maintenanceIntervalHours: 8760,
      mtbf: 175000,
    },
    wearCurve: [
      { years: 0, healthPercent: 100 },
      { years: 10, healthPercent: 95 },
      { years: 20, healthPercent: 85 },
      { years: 30, healthPercent: 70 },
      { years: 40, healthPercent: 50 },
      { years: 50, healthPercent: 25 },
    ],
    failureModes: [
      {
        mode: 'Insulation thermal degradation (cellulose aging)',
        probability: 0.35,
        warningSignals: ['Elevated CO/CO2 in DGA', 'Furan levels increasing', 'DP below 400', 'Hot-spot temperature exceedance'],
        mtbf: 175000,
      },
      {
        mode: 'Turn-to-turn insulation failure',
        probability: 0.20,
        warningSignals: ['Elevated H2 in DGA', 'Partial discharge activity', 'Winding resistance imbalance', 'Hot-spot deviation'],
        mtbf: 200000,
      },
      {
        mode: 'Winding deformation from through-faults',
        probability: 0.15,
        warningSignals: ['FRA pattern change', 'Impedance shift', 'Elevated C2H2 after fault', 'Oil movement during faults'],
        mtbf: 250000,
      },
      {
        mode: 'Overload-accelerated aging',
        probability: 0.30,
        warningSignals: ['Sustained load above nameplate', 'Top-oil > 95°C', 'Hot-spot > 110°C', 'Furan rate of increase'],
        mtbf: 120000,
      },
    ],
    maintenanceTasks: [
      { task: 'DGA oil sampling and analysis', intervalMonths: 6, estimatedDuration: 2 },
      { task: 'Power factor / dissipation factor test', intervalMonths: 12, estimatedDuration: 4 },
      { task: 'Winding resistance measurement', intervalMonths: 24, estimatedDuration: 4 },
      { task: 'Frequency response analysis (FRA)', intervalMonths: 60, estimatedDuration: 8 },
      { task: 'Furan analysis (oil sample)', intervalMonths: 12, estimatedDuration: 2 },
    ],
  },

  bushing: {
    id: 'oem-bushing-001',
    componentType: 'bushing',
    manufacturer: 'ABB / Trench / HSP',
    model: 'OIP/RIP HV Bushing',
    specs: {
      maxTemperature: 85,
      expectedLifeYears: 40,
      maintenanceIntervalHours: 8760,
      mtbf: 200000,
    },
    wearCurve: [
      { years: 0, healthPercent: 100 },
      { years: 10, healthPercent: 96 },
      { years: 20, healthPercent: 88 },
      { years: 30, healthPercent: 72 },
      { years: 35, healthPercent: 55 },
      { years: 40, healthPercent: 30 },
    ],
    failureModes: [
      {
        mode: 'Capacitance / power factor change (dielectric deterioration)',
        probability: 0.35,
        warningSignals: ['Power factor increase > 0.5%', 'Capacitance change > 5%', 'Oil leakage at base', 'Thermal asymmetry'],
        mtbf: 200000,
      },
      {
        mode: 'Moisture ingress through gasket',
        probability: 0.25,
        warningSignals: ['Capacitance change', 'Elevated power factor', 'Oil discoloration', 'Reduced dielectric strength'],
        mtbf: 150000,
      },
      {
        mode: 'Porcelain cracking / flashover',
        probability: 0.15,
        warningSignals: ['Visible cracks', 'Partial discharge during fog/rain', 'Salt/pollution buildup', 'Corona activity'],
        mtbf: 180000,
      },
      {
        mode: 'Internal short circuit',
        probability: 0.25,
        warningSignals: ['Sudden power factor jump', 'DGA shows H2/C2H2 spike', 'Trip event', 'Oil discoloration'],
        mtbf: 220000,
      },
    ],
    maintenanceTasks: [
      { task: 'Visual inspection and IR thermography', intervalMonths: 6, estimatedDuration: 1 },
      { task: 'Power factor and capacitance test', intervalMonths: 12, estimatedDuration: 4 },
      { task: 'Oil level and leakage check', intervalMonths: 3, estimatedDuration: 0.5 },
      { task: 'Bushing replacement (planned)', intervalMonths: 480, estimatedDuration: 48, requiredParts: ['RIP bushing assembly', 'Gasket set', 'Connection hardware'] },
    ],
  },

  tap_changer: {
    id: 'oem-tap-changer-001',
    componentType: 'tap_changer',
    manufacturer: 'MR (Maschinenfabrik Reinhausen)',
    model: 'OLTC Type M',
    specs: {
      expectedLifeYears: 30,
      maintenanceIntervalHours: 4380,
      mtbf: 80000,
    },
    wearCurve: [
      { years: 0, healthPercent: 100 },
      { years: 5, healthPercent: 92 },
      { years: 15, healthPercent: 75 },
      { years: 25, healthPercent: 50 },
      { years: 30, healthPercent: 25 },
    ],
    failureModes: [
      {
        mode: 'Contact erosion / carbon buildup',
        probability: 0.40,
        warningSignals: ['Elevated contact resistance', 'DGA in OLTC compartment: C2H2', 'Oil discoloration', 'Slow tap change time'],
        mtbf: 80000,
      },
      {
        mode: 'Diverter switch wear',
        probability: 0.25,
        warningSignals: ['Arcing during operation', 'Oil carbonization', 'Transition resistance change', 'Motor current anomaly'],
        mtbf: 60000,
      },
      {
        mode: 'Drive mechanism failure',
        probability: 0.20,
        warningSignals: ['Motor current spike', 'Tap change time increase', 'Mechanical noise', 'Position feedback error'],
        mtbf: 100000,
      },
      {
        mode: 'Oil contamination from switching',
        probability: 0.15,
        warningSignals: ['Oil darkening', 'Particle count increase', 'Dielectric strength reduction', 'Sludge formation'],
        mtbf: 50000,
      },
    ],
    maintenanceTasks: [
      { task: 'Oil sampling from OLTC compartment', intervalMonths: 6, estimatedDuration: 1 },
      { task: 'Operations counter reading and drive test', intervalMonths: 3, estimatedDuration: 0.5 },
      { task: 'Contact resistance measurement', intervalMonths: 12, estimatedDuration: 4 },
      { task: 'OLTC overhaul (contact/diverter replacement)', intervalMonths: 120, estimatedDuration: 72, requiredParts: ['Contact assembly', 'Diverter switch', 'Resistors', 'Oil for OLTC compartment'] },
    ],
  },

  cooling_system: {
    id: 'oem-cooling-001',
    componentType: 'cooling_system',
    manufacturer: 'Kelvion / GE',
    model: 'ONAF/OFAF Cooling Bank',
    specs: {
      maxTemperature: 65,
      expectedLifeYears: 25,
      maintenanceIntervalHours: 4380,
      mtbf: 30000,
    },
    wearCurve: [
      { years: 0, healthPercent: 100 },
      { years: 5, healthPercent: 92 },
      { years: 10, healthPercent: 80 },
      { years: 15, healthPercent: 65 },
      { years: 20, healthPercent: 45 },
      { years: 25, healthPercent: 20 },
    ],
    failureModes: [
      {
        mode: 'Fan motor bearing failure',
        probability: 0.35,
        warningSignals: ['Motor current increase', 'Vibration', 'Reduced airflow', 'Fan motor temperature rise'],
        mtbf: 30000,
      },
      {
        mode: 'Radiator blockage (internal sludge)',
        probability: 0.25,
        warningSignals: ['Oil flow reduction', 'Temperature differential across radiator', 'Top-oil temperature rise'],
        mtbf: 40000,
      },
      {
        mode: 'Oil pump failure',
        probability: 0.20,
        warningSignals: ['Flow rate decrease', 'Pump motor current change', 'Oil temperature differential', 'Pump noise'],
        mtbf: 35000,
      },
      {
        mode: 'Control system malfunction',
        probability: 0.20,
        warningSignals: ['Fans not starting on temperature', 'Stage control failure', 'Sensor drift', 'Relay failure'],
        mtbf: 25000,
      },
    ],
    maintenanceTasks: [
      { task: 'Fan motor inspection and cleaning', intervalMonths: 6, estimatedDuration: 2 },
      { task: 'Oil pump flow verification', intervalMonths: 12, estimatedDuration: 2 },
      { task: 'Radiator cleaning (external)', intervalMonths: 6, estimatedDuration: 4 },
      { task: 'Fan motor replacement', intervalMonths: 120, estimatedDuration: 8, requiredParts: ['Fan motor assembly', 'Fan blades', 'Mounting hardware'] },
      { task: 'Oil pump replacement', intervalMonths: 144, estimatedDuration: 16, requiredParts: ['Oil circulation pump', 'Coupling', 'Gaskets'] },
    ],
  },

  oil_system: {
    id: 'oem-oil-001',
    componentType: 'oil_system',
    manufacturer: 'Nynas / Shell Diala',
    model: 'Mineral Insulating Oil System',
    specs: {
      maxMoisture: 35,
      expectedLifeYears: 20,
      maintenanceIntervalHours: 4380,
      mtbf: 50000,
    },
    wearCurve: [
      { years: 0, healthPercent: 100 },
      { years: 5, healthPercent: 90 },
      { years: 10, healthPercent: 75 },
      { years: 15, healthPercent: 55 },
      { years: 20, healthPercent: 30 },
    ],
    failureModes: [
      {
        mode: 'Oil oxidation and acidity increase',
        probability: 0.30,
        warningSignals: ['Acidity > 0.20 mg KOH/g', 'IFT < 22 mN/m', 'Color darkening', 'Sludge formation'],
        mtbf: 50000,
      },
      {
        mode: 'Moisture contamination',
        probability: 0.30,
        warningSignals: ['Moisture > 30 ppm (for 230kV+)', 'Dielectric strength drop', 'Power factor increase', 'Gasket deterioration'],
        mtbf: 40000,
      },
      {
        mode: 'Corrosive sulfur attack',
        probability: 0.15,
        warningSignals: ['Copper strip test fails', 'DBDS detection', 'Conductor surface deposits', 'Elevated copper in oil'],
        mtbf: 60000,
      },
      {
        mode: 'Oil leak (tank/gasket/valve)',
        probability: 0.25,
        warningSignals: ['Oil level decrease', 'Visible staining', 'Conservator level low', 'Pressure gauge anomaly'],
        mtbf: 35000,
      },
    ],
    maintenanceTasks: [
      { task: 'Oil sampling and routine analysis', intervalMonths: 6, estimatedDuration: 1 },
      { task: 'DGA analysis', intervalMonths: 6, estimatedDuration: 1 },
      { task: 'Silica gel breather inspection/replacement', intervalMonths: 6, estimatedDuration: 1, requiredParts: ['Silica gel cartridge'] },
      { task: 'Hot oil filtration and dehydration', intervalMonths: 60, estimatedDuration: 24, requiredParts: ['Filter elements', 'Vacuum pump oil'] },
      { task: 'Full oil replacement', intervalMonths: 240, estimatedDuration: 72, requiredParts: ['Transformer oil (volume per unit)'] },
    ],
  },

  surge_arrester: {
    id: 'oem-surge-001',
    componentType: 'surge_arrester',
    manufacturer: 'ABB / Siemens',
    model: 'PEXLIM Metal Oxide Arrester',
    specs: {
      expectedLifeYears: 25,
      maintenanceIntervalHours: 8760,
      mtbf: 100000,
    },
    wearCurve: [
      { years: 0, healthPercent: 100 },
      { years: 10, healthPercent: 90 },
      { years: 15, healthPercent: 75 },
      { years: 20, healthPercent: 55 },
      { years: 25, healthPercent: 30 },
    ],
    failureModes: [
      {
        mode: 'MOV disc degradation from surge events',
        probability: 0.40,
        warningSignals: ['Leakage current increase', 'Surge counter high count', 'Third harmonic change', 'Thermal image anomaly'],
        mtbf: 100000,
      },
      {
        mode: 'Moisture ingress (seal failure)',
        probability: 0.30,
        warningSignals: ['Leakage current increase', 'Visible seal damage', 'Partial discharge on housing'],
        mtbf: 80000,
      },
      {
        mode: 'Porcelain housing failure',
        probability: 0.15,
        warningSignals: ['Visible cracks', 'Pollution flashover risk', 'Mechanical damage'],
        mtbf: 120000,
      },
    ],
    maintenanceTasks: [
      { task: 'Visual inspection and surge counter reading', intervalMonths: 6, estimatedDuration: 0.5 },
      { task: 'Leakage current measurement', intervalMonths: 12, estimatedDuration: 2 },
      { task: 'IR thermography scan', intervalMonths: 12, estimatedDuration: 1 },
      { task: 'Arrester replacement', intervalMonths: 300, estimatedDuration: 8, requiredParts: ['Metal oxide arrester assembly', 'Mounting hardware', 'Ground lead'] },
    ],
  },

  current_transformer: {
    id: 'oem-ct-001',
    componentType: 'current_transformer',
    manufacturer: 'Trench / ABB',
    model: 'Oil-filled Metering CT',
    specs: {
      expectedLifeYears: 35,
      maintenanceIntervalHours: 8760,
      mtbf: 100000,
    },
    wearCurve: [
      { years: 0, healthPercent: 100 },
      { years: 10, healthPercent: 95 },
      { years: 20, healthPercent: 82 },
      { years: 30, healthPercent: 60 },
      { years: 35, healthPercent: 35 },
    ],
    failureModes: [
      { mode: 'CT ratio error / saturation', probability: 0.30, warningSignals: ['Ratio test deviation', 'Burden measurement change', 'Protection misoperation'], mtbf: 100000 },
      { mode: 'Oil leak / moisture ingress', probability: 0.35, warningSignals: ['Oil level low', 'Visible leakage', 'Dielectric test failure'], mtbf: 80000 },
      { mode: 'Internal insulation failure', probability: 0.20, warningSignals: ['DGA anomaly', 'Power factor change', 'Partial discharge'], mtbf: 120000 },
    ],
    maintenanceTasks: [
      { task: 'Visual inspection', intervalMonths: 6, estimatedDuration: 0.5 },
      { task: 'Ratio and burden test', intervalMonths: 60, estimatedDuration: 4 },
      { task: 'Oil sampling (if oil-filled)', intervalMonths: 24, estimatedDuration: 1 },
    ],
  },

  breaker: {
    id: 'oem-breaker-001',
    componentType: 'breaker',
    manufacturer: 'ABB / Siemens / GE',
    model: 'SF6 Circuit Breaker',
    specs: {
      expectedLifeYears: 30,
      maintenanceIntervalHours: 4380,
      mtbf: 50000,
    },
    wearCurve: [
      { years: 0, healthPercent: 100 },
      { years: 10, healthPercent: 90 },
      { years: 20, healthPercent: 70 },
      { years: 25, healthPercent: 50 },
      { years: 30, healthPercent: 25 },
    ],
    failureModes: [
      { mode: 'SF6 gas leak', probability: 0.30, warningSignals: ['SF6 pressure drop', 'Density alarm', 'Leak detection'], mtbf: 80000 },
      { mode: 'Trip coil failure', probability: 0.25, warningSignals: ['Coil resistance change', 'Trip time increase', 'Trip test failure'], mtbf: 50000 },
      { mode: 'Contact wear', probability: 0.25, warningSignals: ['Contact resistance increase', 'Arcing contact worn', 'Trip counter high'], mtbf: 60000 },
      { mode: 'Operating mechanism failure', probability: 0.20, warningSignals: ['Slow operation', 'Mechanical binding', 'Spring charge failure'], mtbf: 70000 },
    ],
    maintenanceTasks: [
      { task: 'SF6 gas pressure check', intervalMonths: 3, estimatedDuration: 0.5 },
      { task: 'Trip and close test', intervalMonths: 12, estimatedDuration: 4 },
      { task: 'Contact resistance measurement', intervalMonths: 12, estimatedDuration: 2 },
      { task: 'Breaker timing test', intervalMonths: 24, estimatedDuration: 4 },
      { task: 'Major overhaul', intervalMonths: 180, estimatedDuration: 48, requiredParts: ['Contact set', 'SF6 gas', 'Seal kit', 'Trip coils'] },
    ],
  },

  relay: {
    id: 'oem-relay-001',
    componentType: 'relay',
    manufacturer: 'SEL / GE / ABB',
    model: 'Digital Protective Relay',
    specs: {
      expectedLifeYears: 20,
      maintenanceIntervalHours: 8760,
      mtbf: 60000,
    },
    wearCurve: [
      { years: 0, healthPercent: 100 },
      { years: 5, healthPercent: 95 },
      { years: 10, healthPercent: 85 },
      { years: 15, healthPercent: 65 },
      { years: 20, healthPercent: 40 },
    ],
    failureModes: [
      { mode: 'Settings drift / misoperation', probability: 0.35, warningSignals: ['Relay event log anomaly', 'Settings audit discrepancy', 'Trip test deviation'], mtbf: 60000 },
      { mode: 'Communication failure', probability: 0.25, warningSignals: ['SCADA communication loss', 'IEC 61850 message errors', 'Ping timeout'], mtbf: 40000 },
      { mode: 'Power supply failure', probability: 0.20, warningSignals: ['DC voltage fluctuation', 'Relay reboot events', 'Battery alarm'], mtbf: 50000 },
      { mode: 'Hardware component failure', probability: 0.20, warningSignals: ['Self-test alarm', 'I/O board failure', 'Display malfunction'], mtbf: 70000 },
    ],
    maintenanceTasks: [
      { task: 'Relay event log review', intervalMonths: 3, estimatedDuration: 1 },
      { task: 'Trip test and calibration', intervalMonths: 12, estimatedDuration: 4 },
      { task: 'Settings audit and verification', intervalMonths: 24, estimatedDuration: 2 },
      { task: 'Firmware update', intervalMonths: 36, estimatedDuration: 2 },
    ],
  },

  protection_system: {
    id: 'oem-protection-001',
    componentType: 'protection_system',
    manufacturer: 'Various',
    model: 'Integrated Protection System',
    specs: {
      expectedLifeYears: 25,
      maintenanceIntervalHours: 8760,
      mtbf: 80000,
    },
    wearCurve: [
      { years: 0, healthPercent: 100 },
      { years: 10, healthPercent: 88 },
      { years: 15, healthPercent: 72 },
      { years: 20, healthPercent: 55 },
      { years: 25, healthPercent: 30 },
    ],
    failureModes: [
      { mode: 'Protection coordination error', probability: 0.30, warningSignals: ['Miscoordination event', 'Settings change needed', 'Study results outdated'], mtbf: 80000 },
      { mode: 'Backup protection failure', probability: 0.25, warningSignals: ['Trip test failure', 'Relay self-test alarm', 'DC supply issue'], mtbf: 90000 },
    ],
    maintenanceTasks: [
      { task: 'Protection coordination study review', intervalMonths: 60, estimatedDuration: 16 },
      { task: 'End-to-end trip test', intervalMonths: 12, estimatedDuration: 8 },
    ],
  },
}

export function getOEMProfile(componentType: PMComponentType): PMEquipmentProfile {
  return OEM_COMPONENT_PROFILES[componentType]
}

export function getWearPercentage(componentType: PMComponentType, ageYears: number): number {
  const profile = OEM_COMPONENT_PROFILES[componentType]
  if (!profile.wearCurve || profile.wearCurve.length === 0) return 100

  const curve = profile.wearCurve
  if (ageYears <= curve[0].years) return curve[0].healthPercent
  if (ageYears >= curve[curve.length - 1].years) return curve[curve.length - 1].healthPercent

  for (let i = 0; i < curve.length - 1; i++) {
    if (ageYears >= curve[i].years && ageYears < curve[i + 1].years) {
      const ratio = (ageYears - curve[i].years) / (curve[i + 1].years - curve[i].years)
      return curve[i].healthPercent - ratio * (curve[i].healthPercent - curve[i + 1].healthPercent)
    }
  }
  return 50
}

export function getNextMaintenanceTask(
  componentType: PMComponentType,
  ageMonths: number
): { task: string; dueInMonths: number; estimatedDuration: number; parts?: string[] } | null {
  const profile = OEM_COMPONENT_PROFILES[componentType]
  if (!profile.maintenanceTasks || profile.maintenanceTasks.length === 0) return null

  let nearestTask = null
  let nearestDue = Infinity

  for (const task of profile.maintenanceTasks) {
    const lastCompleted = Math.floor(ageMonths / task.intervalMonths) * task.intervalMonths
    const nextDue = lastCompleted + task.intervalMonths
    const dueInMonths = nextDue - ageMonths

    if (dueInMonths > 0 && dueInMonths < nearestDue) {
      nearestDue = dueInMonths
      nearestTask = {
        task: task.task,
        dueInMonths,
        estimatedDuration: task.estimatedDuration,
        parts: task.requiredParts,
      }
    }
  }
  return nearestTask
}

export function getMostLikelyFailureMode(
  componentType: PMComponentType,
  moisture?: number,
  temperature?: number
): { mode: string; probability: number; warningSignals: string[] } | null {
  const profile = OEM_COMPONENT_PROFILES[componentType]
  if (!profile.failureModes || profile.failureModes.length === 0) return null

  let highestProbability = 0
  let mostLikely = null

  for (const fm of profile.failureModes) {
    let adjustedProbability = fm.probability

    if (moisture && profile.specs.maxMoisture) {
      const moistureRatio = moisture / profile.specs.maxMoisture
      if (moistureRatio > 0.8 && fm.warningSignals.some(s => s.toLowerCase().includes('moisture') || s.toLowerCase().includes('dielectric'))) {
        adjustedProbability *= 1.5
      }
    }

    if (temperature && profile.specs.maxTemperature) {
      const tempRatio = temperature / profile.specs.maxTemperature
      if (tempRatio > 0.8 && fm.warningSignals.some(s => s.toLowerCase().includes('temperature') || s.toLowerCase().includes('hot') || s.toLowerCase().includes('thermal'))) {
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
