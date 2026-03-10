// Comprehensive troubleshooting knowledge base for WSDOT ferry vessels
// Organized by vessel system and equipment type

export interface TroubleshootingStep {
  step: number;
  action: string;
  details?: string;
  tools?: string[];
  safetyWarning?: string;
}

export interface TroubleshootingGuide {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  symptoms: string[];
  possibleCauses: string[];
  steps: TroubleshootingStep[];
  estimatedTime: string;
  requiredSkillLevel: 'operator' | 'technician' | 'engineer' | 'specialist';
  sparePartsNeeded?: string[];
  preventiveMeasures?: string[];
}

export interface VesselClassEquipment {
  vesselClass: string;
  description: string;
  criticalSystems: string[];
  troubleshootingGuides: Record<string, TroubleshootingGuide[]>;
}

// ========================================
// FERRY PROPULSION TROUBLESHOOTING
// ========================================
export const FERRY_PROPULSION_TROUBLESHOOTING: VesselClassEquipment = {
  vesselClass: 'ferry',
  description: 'WSDOT Auto/Passenger Ferries - Propulsion & Power Systems',
  criticalSystems: [
    'Main Propulsion Engines',
    'Controllable Pitch Propellers',
    'Ship Service Generators',
    'Steering System',
    'Vehicle Ramp System',
    'Navigation & Radar',
  ],
  troubleshootingGuides: {
    'Main Engine': [
      {
        id: 'me-001',
        title: 'Main Engine Overheating',
        severity: 'critical',
        symptoms: [
          'Coolant temperature above 95°C',
          'Low power alarm',
          'Engine derate or shutdown',
          'High exhaust temperature',
        ],
        possibleCauses: [
          'Sea water pump failure',
          'Heat exchanger fouling',
          'Thermostat stuck closed',
          'Coolant level low',
          'Air in cooling system',
        ],
        steps: [
          { step: 1, action: 'Reduce engine load immediately' },
          { step: 2, action: 'Check coolant level in expansion tank', safetyWarning: 'Never open hot pressurized system' },
          { step: 3, action: 'Verify sea water pump operation', details: 'Check overboard discharge' },
          { step: 4, action: 'Inspect heat exchanger zincs', details: 'Replace if >50% depleted' },
          { step: 5, action: 'Test thermostat operation', tools: ['Infrared thermometer'] },
          { step: 6, action: 'Bleed air from cooling system' },
        ],
        estimatedTime: '2-6 hours',
        requiredSkillLevel: 'technician',
        sparePartsNeeded: ['Thermostat', 'Sea water pump impeller', 'Zinc anodes', 'Coolant'],
        preventiveMeasures: [
          'Daily coolant level checks',
          'Monthly zinc anode inspection',
          'Annual heat exchanger cleaning',
        ],
      },
      {
        id: 'me-002',
        title: 'Engine Vibration Anomaly',
        severity: 'warning',
        symptoms: [
          'Vibration levels above 8 mm/s',
          'Unusual harmonic patterns',
          'Bearing temperature rise',
          'Crankcase pressure increase',
        ],
        possibleCauses: [
          'Cylinder imbalance (fuel injection issue)',
          'Bearing wear or damage',
          'Crankshaft misalignment',
          'Turbocharger imbalance',
          'Engine mount deterioration',
        ],
        steps: [
          { step: 1, action: 'Record vibration readings at multiple points', tools: ['Vibration analyzer'] },
          { step: 2, action: 'Check fuel injection pressures across all cylinders', details: 'Compare to OEM specs' },
          { step: 3, action: 'Inspect engine mounts for deterioration', details: 'Check rubber condition and alignment' },
          { step: 4, action: 'Monitor bearing temperatures', tools: ['Infrared thermometer', 'Data logger'] },
          { step: 5, action: 'Conduct oil analysis', tools: ['Oil sampling kit'], details: 'Check for metal particles' },
        ],
        estimatedTime: '4-8 hours for diagnosis',
        requiredSkillLevel: 'engineer',
        sparePartsNeeded: ['Engine mounts', 'Bearing shells', 'Fuel injectors'],
        preventiveMeasures: [
          'Monthly vibration baseline monitoring',
          'Quarterly oil analysis',
          'Annual alignment check',
        ],
      },
    ],
    'Propulsion': [
      {
        id: 'cpp-001',
        title: 'Controllable Pitch Propeller Response Failure',
        severity: 'critical',
        symptoms: [
          'Propeller pitch not responding to commands',
          'Vessel unable to change speed or direction',
          'Hydraulic pressure alarm on CPP system',
          'Delayed or erratic pitch change',
        ],
        possibleCauses: [
          'Hydraulic oil leak in hub',
          'Control valve malfunction',
          'Feedback sensor failure',
          'Oil distribution box (OD box) failure',
          'Hydraulic pump failure',
        ],
        steps: [
          { step: 1, action: 'Switch to emergency propulsion control if available', safetyWarning: 'Notify bridge immediately' },
          { step: 2, action: 'Check hydraulic oil level in CPP system', details: 'Low level indicates leak' },
          { step: 3, action: 'Verify control signals reaching actuator', tools: ['Diagnostic laptop', 'Multimeter'] },
          { step: 4, action: 'Check OD box for external leaks' },
          { step: 5, action: 'Test hydraulic pump pressure output', details: 'Compare to rated pressure (typically 120-150 bar)' },
          { step: 6, action: 'Inspect pitch feedback sensor', tools: ['Calibration equipment'] },
        ],
        estimatedTime: '2-12 hours depending on failure',
        requiredSkillLevel: 'specialist',
        sparePartsNeeded: ['Hydraulic seals', 'Control valve', 'Feedback sensor', 'Hydraulic pump'],
        preventiveMeasures: [
          'Daily CPP system pressure checks',
          'Monthly oil level monitoring',
          'Annual OD box inspection',
        ],
      },
      {
        id: 'cpp-002',
        title: 'Propeller Cavitation / Vibration',
        severity: 'warning',
        symptoms: [
          'Vibration felt in stern area',
          'Noise from propeller area',
          'Reduced propulsion efficiency',
          'Higher fuel consumption for same speed',
        ],
        possibleCauses: [
          'Propeller blade damage or fouling',
          'Incorrect pitch setting for conditions',
          'Marine growth on hull/propeller',
          'Stern bearing wear',
        ],
        steps: [
          { step: 1, action: 'Reduce propeller speed and observe', details: 'Cavitation should reduce with speed' },
          { step: 2, action: 'Check stern tube bearing temperature', tools: ['Temperature probe'] },
          { step: 3, action: 'Schedule underwater inspection', details: 'Diver or ROV inspection of propeller' },
          { step: 4, action: 'Review recent operating profiles for overload conditions' },
        ],
        estimatedTime: '2-8 hours for diagnosis',
        requiredSkillLevel: 'engineer',
        sparePartsNeeded: ['Propeller (if blade damage)', 'Stern tube seals'],
      },
    ],
    'Vehicle Ramp': [
      {
        id: 'ramp-001',
        title: 'Vehicle Ramp Hydraulic Failure',
        severity: 'critical',
        symptoms: [
          'Ramp not moving on command',
          'Ramp drifting or settling',
          'Hydraulic oil leak visible',
          'Slow ramp operation',
        ],
        possibleCauses: [
          'Hydraulic cylinder seal failure',
          'Pump pressure loss',
          'Control valve stuck',
          'Hose or fitting failure',
          'Low hydraulic oil level',
        ],
        steps: [
          { step: 1, action: 'Secure ramp in current position', safetyWarning: 'Clear all personnel from under ramp' },
          { step: 2, action: 'Check hydraulic oil tank level', details: 'Low level indicates leak' },
          { step: 3, action: 'Inspect cylinders and hoses for visible leaks' },
          { step: 4, action: 'Check pump pressure at test port', details: 'Expected: 180-250 bar', tools: ['Hydraulic test gauge'] },
          { step: 5, action: 'Test control valves electrically', tools: ['Multimeter'] },
          { step: 6, action: 'Check for debris in control valve', safetyWarning: 'Lockout hydraulics before disassembly' },
        ],
        estimatedTime: '2-8 hours',
        requiredSkillLevel: 'technician',
        sparePartsNeeded: ['Hydraulic seals', 'Hoses', 'Control valve', 'Hydraulic filter'],
        preventiveMeasures: [
          'Daily visual inspection of hydraulic system',
          'Monthly filter changes',
          'Quarterly cylinder rod inspection',
        ],
      },
      {
        id: 'ramp-002',
        title: 'Ramp Alignment / Leveling Issues',
        severity: 'warning',
        symptoms: [
          'Ramp not level with dock apron',
          'Gap between ramp and dock',
          'Vehicle scraping on ramp transition',
          'Ramp chains slack or tight',
        ],
        possibleCauses: [
          'Tide/water level change',
          'Chain elongation from wear',
          'Hinge pin wear',
          'Terminal fender damage',
        ],
        steps: [
          { step: 1, action: 'Check tide level vs ramp position', details: 'Adjust for current tide' },
          { step: 2, action: 'Inspect ramp chain tension', details: 'Adjust chain dogs as needed' },
          { step: 3, action: 'Check hinge pin clearances', tools: ['Caliper', 'Feeler gauge'] },
          { step: 4, action: 'Inspect terminal fender/bumpers for damage' },
        ],
        estimatedTime: '1-4 hours',
        requiredSkillLevel: 'operator',
        sparePartsNeeded: ['Chain dogs', 'Hinge pins', 'Bushings'],
      },
    ],
    'Steering System': [
      {
        id: 'steer-001',
        title: 'Steering Gear Malfunction',
        severity: 'critical',
        symptoms: [
          'Steering not responding or slow',
          'Rudder not matching helm position',
          'Hydraulic pressure alarm',
          'Unusual noise from steering gear room',
        ],
        possibleCauses: [
          'Hydraulic pump failure',
          'Relief valve malfunction',
          'Rudder stock bearing wear',
          'Control system fault',
          'Air in hydraulic system',
        ],
        steps: [
          { step: 1, action: 'Switch to backup steering system immediately', safetyWarning: 'Inform bridge - vessel maneuverability compromised' },
          { step: 2, action: 'Check hydraulic oil level and condition' },
          { step: 3, action: 'Test backup pump operation', details: 'Ensure automatic changeover works' },
          { step: 4, action: 'Bleed air from steering hydraulic system' },
          { step: 5, action: 'Check rudder position feedback transmitter', tools: ['Multimeter', 'Diagnostic laptop'] },
          { step: 6, action: 'Inspect relief valve setting', details: 'Should be set per manufacturer spec' },
        ],
        estimatedTime: '2-6 hours',
        requiredSkillLevel: 'engineer',
        sparePartsNeeded: ['Hydraulic pump', 'Steering gear seals', 'Position sensors'],
        preventiveMeasures: [
          'Daily steering gear room inspection',
          'Weekly emergency steering drill',
          'Monthly hydraulic oil analysis',
        ],
      },
    ],
    'Navigation': [
      {
        id: 'nav-001',
        title: 'Radar System Failure',
        severity: 'critical',
        symptoms: [
          'No radar display or weak returns',
          'Reduced detection range',
          'False echoes or clutter',
          'Magnetron power output low',
        ],
        possibleCauses: [
          'Magnetron end of life',
          'Antenna motor failure',
          'Power supply issues',
          'Waveguide moisture ingress',
        ],
        steps: [
          { step: 1, action: 'Switch to backup radar if available' },
          { step: 2, action: 'Check power supply voltages', tools: ['Multimeter'] },
          { step: 3, action: 'Inspect antenna rotation', details: 'Check motor and bearing' },
          { step: 4, action: 'Test magnetron output', tools: ['RF power meter'], details: 'Replace if below 70% rated power' },
          { step: 5, action: 'Check waveguide connections for moisture', tools: ['Waveguide pressurization kit'] },
        ],
        estimatedTime: '2-8 hours',
        requiredSkillLevel: 'specialist',
        sparePartsNeeded: ['Magnetron', 'Antenna motor', 'Waveguide gaskets'],
        preventiveMeasures: [
          'Annual magnetron performance test',
          'Monthly antenna motor inspection',
          'Waveguide pressurization checks',
        ],
      },
    ],
    'Electrical': [
      {
        id: 'elec-001',
        title: 'Ship Service Generator Failure',
        severity: 'critical',
        symptoms: [
          'Blackout or partial power loss',
          'Voltage/frequency fluctuations',
          'Generator trips on protection',
          'Non-essential loads shed',
        ],
        possibleCauses: [
          'AVR (Automatic Voltage Regulator) failure',
          'Governor malfunction',
          'Exciter brushes worn',
          'Overload from connected loads',
          'Fuel supply interruption',
        ],
        steps: [
          { step: 1, action: 'Start standby generator and parallel', safetyWarning: 'Follow blackout recovery procedure' },
          { step: 2, action: 'Check generator protection relay for fault type' },
          { step: 3, action: 'Inspect AVR and voltage output', tools: ['Multimeter', 'Oscilloscope'] },
          { step: 4, action: 'Check exciter brush condition and commutator' },
          { step: 5, action: 'Review load balance and ensure no single overload' },
          { step: 6, action: 'Check fuel supply and fuel pressure to engine' },
        ],
        estimatedTime: '2-8 hours',
        requiredSkillLevel: 'engineer',
        sparePartsNeeded: ['AVR board', 'Exciter brushes', 'Voltage regulator', 'Fuel filters'],
        preventiveMeasures: [
          'Weekly generator load test',
          'Monthly brush inspection',
          'Quarterly AVR calibration check',
        ],
      },
    ],
  },
};

// ========================================
// FERRY PASSENGER SYSTEMS TROUBLESHOOTING
// ========================================
export const FERRY_PASSENGER_TROUBLESHOOTING: VesselClassEquipment = {
  vesselClass: 'ferry_passenger',
  description: 'WSDOT Ferry Passenger Comfort & Safety Systems',
  criticalSystems: [
    'HVAC System',
    'Public Address System',
    'Fire Detection & Suppression',
    'Life-Saving Equipment',
    'Passenger Elevators',
  ],
  troubleshootingGuides: {
    'HVAC': [
      {
        id: 'hvac-001',
        title: 'Passenger Cabin Temperature Issues',
        severity: 'warning',
        symptoms: [
          'Passenger complaints about temperature',
          'Uneven heating/cooling across decks',
          'HVAC compressor cycling frequently',
          'High power consumption from HVAC',
        ],
        possibleCauses: [
          'Refrigerant leak',
          'Dirty air filters or coils',
          'Thermostat malfunction',
          'Damper actuator failure',
          'Compressor efficiency decline',
        ],
        steps: [
          { step: 1, action: 'Check zone thermostat settings and readings' },
          { step: 2, action: 'Inspect air filters', details: 'Replace if dirty or clogged' },
          { step: 3, action: 'Check refrigerant pressures', tools: ['Refrigerant gauges'], details: 'Compare to subcooling/superheat targets' },
          { step: 4, action: 'Inspect damper actuators in affected zones' },
          { step: 5, action: 'Clean condenser and evaporator coils if needed' },
        ],
        estimatedTime: '2-4 hours',
        requiredSkillLevel: 'technician',
        sparePartsNeeded: ['Air filters', 'Damper actuators', 'Thermostat sensors', 'Refrigerant'],
      },
    ],
    'Fire Safety': [
      {
        id: 'fire-001',
        title: 'Fire Detection System False Alarms',
        severity: 'warning',
        symptoms: [
          'Repeated alarms from same zone',
          'Alarms during loading/unloading',
          'No visible smoke or fire detected',
        ],
        possibleCauses: [
          'Detector contamination (dust, salt spray)',
          'Vehicle exhaust in car deck area',
          'Detector sensitivity drift',
          'Wiring issues causing intermittent signals',
        ],
        steps: [
          { step: 1, action: 'Identify affected zone and detector', details: 'Check fire panel for zone identification' },
          { step: 2, action: 'Inspect detector for contamination', details: 'Clean with approved method' },
          { step: 3, action: 'Test detector per manufacturer procedure', tools: ['Detector test kit'] },
          { step: 4, action: 'Check wiring connections at detector and panel' },
          { step: 5, action: 'Adjust sensitivity if within allowable range', details: 'Refer to USCG approved settings' },
        ],
        estimatedTime: '1-3 hours',
        requiredSkillLevel: 'technician',
        sparePartsNeeded: ['Smoke detectors', 'Detector cleaning supplies'],
        preventiveMeasures: [
          'Quarterly detector cleaning schedule',
          'Annual detector replacement program',
          'Car deck ventilation optimization',
        ],
      },
    ],
  },
};

// ========================================
// HELPER FUNCTIONS
// ========================================

export function getTroubleshootingForVesselClass(vesselType: string): VesselClassEquipment | null {
  const normalizedType = vesselType.toLowerCase();
  
  if (normalizedType.includes('ferry') || normalizedType.includes('passenger')) {
    return FERRY_PROPULSION_TROUBLESHOOTING;
  }
  
  // Default to ferry troubleshooting since this is a WSDOT ferry system
  return FERRY_PROPULSION_TROUBLESHOOTING;
}

export function getTroubleshootingGuide(
  vesselType: string,
  equipmentType: string,
  symptom?: string
): TroubleshootingGuide[] {
  const vesselTroubleshooting = getTroubleshootingForVesselClass(vesselType);
  if (!vesselTroubleshooting) return [];
  
  // Find matching equipment category
  const normalizedEquipment = equipmentType.toLowerCase();
  let guides: TroubleshootingGuide[] = [];
  
  for (const [category, categoryGuides] of Object.entries(vesselTroubleshooting.troubleshootingGuides)) {
    if (normalizedEquipment.includes(category.toLowerCase()) || category.toLowerCase().includes(normalizedEquipment)) {
      guides = [...guides, ...categoryGuides];
    }
  }
  
  // Also check passenger systems
  for (const [category, categoryGuides] of Object.entries(FERRY_PASSENGER_TROUBLESHOOTING.troubleshootingGuides)) {
    if (normalizedEquipment.includes(category.toLowerCase()) || category.toLowerCase().includes(normalizedEquipment)) {
      guides = [...guides, ...categoryGuides];
    }
  }
  
  // Filter by symptom if provided
  if (symptom && guides.length > 0) {
    const symptomLower = symptom.toLowerCase();
    const filteredGuides = guides.filter(g => 
      g.symptoms.some(s => s.toLowerCase().includes(symptomLower)) ||
      g.title.toLowerCase().includes(symptomLower)
    );
    if (filteredGuides.length > 0) return filteredGuides;
  }
  
  return guides;
}

export function getSensorTroubleshooting(
  vesselType: string,
  sensorType: 'temperature' | 'vibration' | 'pressure' | 'power',
  severity: 'critical' | 'warning'
): { causes: string[]; actions: string[]; urgency: string } {
  const baseTroubleshooting: Record<string, { causes: string[]; actions: string[]; urgency: string }> = {
    temperature_critical: {
      causes: [
        'Cooling system failure',
        'Lubrication breakdown',
        'Excessive friction from worn components',
        'Overload conditions',
        'Blocked ventilation',
      ],
      actions: [
        'REDUCE LOAD OR STOP EQUIPMENT IMMEDIATELY',
        'Check cooling water/oil flow',
        'Inspect for lubrication failure',
        'Allow cool-down before inspection',
        'Check for blocked air intakes',
      ],
      urgency: 'Immediate action required - risk of permanent damage',
    },
    temperature_warning: {
      causes: [
        'Reduced cooling efficiency',
        'Partial blockage in cooling system',
        'Early-stage bearing wear',
        'Ambient temperature increase',
      ],
      actions: [
        'Monitor temperature trend closely',
        'Schedule cooling system inspection',
        'Check coolant/oil levels',
        'Plan maintenance within 7 days',
      ],
      urgency: 'Schedule inspection within 48 hours',
    },
    vibration_critical: {
      causes: [
        'Severe shaft misalignment',
        'Bearing failure in progress',
        'Unbalanced rotating component',
        'Structural looseness',
        'Propeller damage or cavitation',
      ],
      actions: [
        'REDUCE SPEED OR STOP IF SAFE',
        'Conduct emergency vibration analysis',
        'Check mounting bolts immediately',
        'Prepare for bearing replacement',
        'Do not restart without inspection',
      ],
      urgency: 'Stop and inspect immediately - failure imminent',
    },
    vibration_warning: {
      causes: [
        'Developing misalignment',
        'Early bearing wear',
        'Slight imbalance',
        'Loosening fasteners',
      ],
      actions: [
        'Schedule vibration analysis',
        'Check and re-torque mounting bolts',
        'Monitor trend for next 24 hours',
        'Plan alignment check',
      ],
      urgency: 'Schedule maintenance within 7-14 days',
    },
    pressure_critical: {
      causes: [
        'Pump failure',
        'Major leak in system',
        'Blockage in line',
        'Relief valve malfunction',
      ],
      actions: [
        'Check for visible leaks',
        'Verify pump operation',
        'Check filter/strainer condition',
        'Test relief valve settings',
      ],
      urgency: 'Investigate immediately',
    },
    pressure_warning: {
      causes: [
        'Partial blockage',
        'Filter nearing capacity',
        'Minor leak developing',
        'Pump wear',
      ],
      actions: [
        'Replace filters',
        'Check for small leaks',
        'Monitor trend',
        'Schedule pump inspection',
      ],
      urgency: 'Address within 24-48 hours',
    },
    power_critical: {
      causes: [
        'Major component degradation',
        'Electrical fault',
        'Multiple system failures',
        'Control system malfunction',
      ],
      actions: [
        'Review all connected systems',
        'Check electrical connections',
        'Conduct comprehensive diagnostic',
        'Prepare contingency plan',
      ],
      urgency: 'Full system review required',
    },
    power_warning: {
      causes: [
        'Gradual component wear',
        'Efficiency loss',
        'Minor electrical issues',
        'Calibration drift',
      ],
      actions: [
        'Schedule preventive maintenance',
        'Review operating parameters',
        'Check sensor calibration',
        'Update maintenance schedule',
      ],
      urgency: 'Plan maintenance within 14 days',
    },
  };
  
  const key = `${sensorType}_${severity}`;
  return baseTroubleshooting[key] || {
    causes: ['Unknown issue'],
    actions: ['Contact technical support'],
    urgency: 'Investigate as soon as possible',
  };
}
