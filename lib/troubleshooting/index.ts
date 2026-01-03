// Comprehensive troubleshooting knowledge base for maritime vessels
// Organized by vessel class and equipment type

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
// DREDGER TROUBLESHOOTING
// ========================================
export const DREDGER_TROUBLESHOOTING: VesselClassEquipment = {
  vesselClass: 'dredger',
  description: 'Trailing Suction Hopper Dredgers (TSHD) and Cutter Suction Dredgers (CSD)',
  criticalSystems: [
    'Dredge Pump System',
    'Draghead/Cutter System',
    'Hopper System',
    'Trailing Pipe System',
    'Main Propulsion',
    'Power Generation',
  ],
  troubleshootingGuides: {
    'Dredge Pump': [
      {
        id: 'dp-001',
        title: 'Dredge Pump Cavitation',
        severity: 'critical',
        symptoms: [
          'Loud crackling or rattling noise from pump',
          'Vibration levels above 8 mm/s',
          'Reduced discharge pressure',
          'Fluctuating flow rate',
          'Visible erosion on impeller',
        ],
        possibleCauses: [
          'Suction pipe air ingress',
          'Insufficient submergence of draghead',
          'Blocked suction grating',
          'Excessive pump speed for current conditions',
          'Worn impeller or wear rings',
        ],
        steps: [
          { step: 1, action: 'Reduce pump RPM by 10-15%', details: 'Gradually reduce to prevent sudden load changes' },
          { step: 2, action: 'Check draghead submergence', details: 'Ensure minimum 2m water cover above draghead' },
          { step: 3, action: 'Inspect suction line for air leaks', tools: ['Ultrasonic leak detector', 'Visual inspection'] },
          { step: 4, action: 'Clear any debris from suction grating', safetyWarning: 'Lock out pump before clearing' },
          { step: 5, action: 'Check wear ring clearances', details: 'Max clearance: 3mm. Replace if exceeded', tools: ['Feeler gauge'] },
          { step: 6, action: 'Inspect impeller for damage', details: 'Look for pitting, erosion, or cracks' },
        ],
        estimatedTime: '2-4 hours (inspection), 8-16 hours (impeller replacement)',
        requiredSkillLevel: 'technician',
        sparePartsNeeded: ['Wear rings', 'Impeller (if damaged)', 'Suction pipe gaskets'],
        preventiveMeasures: [
          'Maintain proper draghead depth',
          'Regular wear ring inspection every 500 hours',
          'Monitor pump curves for early degradation detection',
        ],
      },
      {
        id: 'dp-002',
        title: 'Dredge Pump Overheating',
        severity: 'critical',
        symptoms: [
          'Bearing temperature above 85°C',
          'Shaft seal leakage',
          'Reduced pump efficiency',
          'Unusual odor from pump area',
        ],
        possibleCauses: [
          'Insufficient cooling water flow',
          'Bearing lubrication failure',
          'Misalignment between pump and motor',
          'Damaged shaft seals',
          'Excessive wear causing friction',
        ],
        steps: [
          { step: 1, action: 'STOP PUMP IMMEDIATELY if temperature exceeds 95°C', safetyWarning: 'Risk of bearing seizure' },
          { step: 2, action: 'Check cooling water supply', details: 'Verify flow rate meets spec (typically 50+ L/min)' },
          { step: 3, action: 'Inspect bearing oil level and condition', tools: ['Oil sampling kit'] },
          { step: 4, action: 'Check shaft alignment', tools: ['Laser alignment tool'], details: 'Max misalignment: 0.05mm' },
          { step: 5, action: 'Inspect mechanical seals for wear', details: 'Replace if scoring visible' },
        ],
        estimatedTime: '4-8 hours',
        requiredSkillLevel: 'engineer',
        sparePartsNeeded: ['Mechanical seals', 'Bearings', 'Bearing oil'],
      },
    ],
    'Draghead': [
      {
        id: 'dh-001',
        title: 'Draghead Visor Stuck',
        severity: 'warning',
        symptoms: [
          'Visor not responding to hydraulic commands',
          'Reduced dredging efficiency',
          'Uneven material intake',
        ],
        possibleCauses: [
          'Hydraulic cylinder failure',
          'Debris jamming visor mechanism',
          'Worn visor hinge pins',
          'Hydraulic system air lock',
        ],
        steps: [
          { step: 1, action: 'Check hydraulic pressure at visor cylinder', details: 'Expected: 200-250 bar' },
          { step: 2, action: 'Bleed air from hydraulic lines' },
          { step: 3, action: 'Inspect visor for debris or rocks', safetyWarning: 'Ensure draghead is clear of seabed' },
          { step: 4, action: 'Check hinge pins and bushings for wear', tools: ['Caliper', 'Inspection camera'] },
          { step: 5, action: 'Test hydraulic cylinder stroke', details: 'Compare port vs starboard response' },
        ],
        estimatedTime: '2-6 hours',
        requiredSkillLevel: 'technician',
        sparePartsNeeded: ['Hydraulic seals', 'Hinge pins', 'Bushings'],
      },
      {
        id: 'dh-002',
        title: 'Excessive Draghead Wear',
        severity: 'warning',
        symptoms: [
          'Reduced suction efficiency',
          'Visible wear on draghead teeth',
          'Increased fuel consumption for same production',
          'Uneven wear patterns',
        ],
        possibleCauses: [
          'Operating in abrasive material (coral, rock)',
          'Incorrect draghead speed over ground',
          'Worn or missing wear plates',
          'Improper draghead angle',
        ],
        steps: [
          { step: 1, action: 'Measure remaining thickness of wear plates', details: 'Replace at 50% wear' },
          { step: 2, action: 'Inspect and replace worn teeth', tools: ['Torque wrench', 'Lifting equipment'] },
          { step: 3, action: 'Check draghead angle sensors', details: 'Calibrate if drift detected' },
          { step: 4, action: 'Review operating parameters', details: 'Speed over ground should be 1-2 knots for most materials' },
        ],
        estimatedTime: '8-24 hours (major rebuild)',
        requiredSkillLevel: 'technician',
        sparePartsNeeded: ['Wear plates', 'Draghead teeth', 'Cutting edges'],
      },
    ],
    'Hopper System': [
      {
        id: 'hs-001',
        title: 'Hopper Doors Not Closing',
        severity: 'critical',
        symptoms: [
          'Door position indicators show open',
          'Material loss during transit',
          'Hydraulic pressure drop',
        ],
        possibleCauses: [
          'Hydraulic cylinder failure',
          'Door seal damage',
          'Debris preventing closure',
          'Linkage or hinge damage',
        ],
        steps: [
          { step: 1, action: 'Check hydraulic pressure to door cylinders', details: 'Min 180 bar required' },
          { step: 2, action: 'Verify door position sensors are calibrated' },
          { step: 3, action: 'Inspect door seals for damage', details: 'ROV or diver inspection if in water' },
          { step: 4, action: 'Check for debris in door recess', safetyWarning: 'Lockout hydraulics before manual inspection' },
          { step: 5, action: 'Inspect cylinder rod and seals', tools: ['Inspection camera'] },
        ],
        estimatedTime: '2-8 hours',
        requiredSkillLevel: 'technician',
        sparePartsNeeded: ['Door seals', 'Hydraulic cylinder seals', 'Position sensors'],
      },
    ],
  },
};

// ========================================
// CRANE BARGE TROUBLESHOOTING
// ========================================
export const CRANE_BARGE_TROUBLESHOOTING: VesselClassEquipment = {
  vesselClass: 'crane_barge',
  description: 'Heavy Lift Crane Barges and Floating Cranes',
  criticalSystems: [
    'Main Crane System',
    'Slewing System',
    'Hoisting System',
    'Ballast System',
    'Positioning System (Spuds)',
    'Power Generation',
  ],
  troubleshootingGuides: {
    'Main Crane': [
      {
        id: 'mc-001',
        title: 'Crane Slewing Jerky/Uneven',
        severity: 'warning',
        symptoms: [
          'Jerky rotation movement',
          'Unusual noise during slewing',
          'Uneven slewing speed',
          'Vibration in crane structure',
        ],
        possibleCauses: [
          'Worn slew bearing teeth',
          'Low or contaminated slew gear oil',
          'Slew motor hydraulic issues',
          'Slew ring bolt loosening',
        ],
        steps: [
          { step: 1, action: 'Check slew ring bolt torque', details: 'Check 10% of bolts randomly', tools: ['Torque wrench'] },
          { step: 2, action: 'Inspect slew gear teeth for wear or damage', tools: ['Inspection light', 'Feeler gauge'] },
          { step: 3, action: 'Check slew gearbox oil level and quality', details: 'Oil should be clear, no metal particles' },
          { step: 4, action: 'Test slew motors individually', details: 'Compare response and pressure' },
          { step: 5, action: 'Grease slew bearing teeth', tools: ['Grease gun', 'Open gear lubricant'] },
        ],
        estimatedTime: '4-8 hours',
        requiredSkillLevel: 'technician',
        sparePartsNeeded: ['Slew gear lubricant', 'Slew ring bolts', 'Motor seals'],
        preventiveMeasures: [
          'Daily slew ring greasing during operations',
          'Monthly bolt torque check',
          'Quarterly oil analysis',
        ],
      },
      {
        id: 'mc-002',
        title: 'Crane Boom Luffing Failure',
        severity: 'critical',
        symptoms: [
          'Boom cannot be raised or lowered',
          'Boom drifts down slowly',
          'Hydraulic system warning alarms',
        ],
        possibleCauses: [
          'Luff cylinder seal failure',
          'Hydraulic pump failure',
          'Control valve malfunction',
          'Luff wire rope damage (for wire rope luffing)',
        ],
        steps: [
          { step: 1, action: 'SECURE LOAD IMMEDIATELY', safetyWarning: 'Do not leave suspended load unattended' },
          { step: 2, action: 'Check hydraulic oil level in tank', details: 'Should be above minimum mark' },
          { step: 3, action: 'Inspect luff cylinders for external leakage', tools: ['Flashlight', 'Clean rag'] },
          { step: 4, action: 'Check hydraulic pump pressure', details: 'Compare to rated pressure (typically 280-350 bar)' },
          { step: 5, action: 'Test control valve operation', tools: ['Multimeter', 'Hydraulic test gauge'] },
          { step: 6, action: 'For wire rope systems, inspect luff wire for broken strands', details: '6+ broken wires per lay = replace' },
        ],
        estimatedTime: '4-16 hours depending on failure',
        requiredSkillLevel: 'engineer',
        sparePartsNeeded: ['Cylinder seals', 'Control valve', 'Luff wire rope'],
      },
    ],
    'Hoisting System': [
      {
        id: 'hoist-001',
        title: 'Hoist Wire Rope Damage',
        severity: 'critical',
        symptoms: [
          'Visible broken wires',
          'Wire rope kinking or birdcaging',
          'Excessive wear on sheaves',
          'Drum spooling problems',
        ],
        possibleCauses: [
          'Overloading beyond SWL',
          'Shock loading',
          'Improper spooling on drum',
          'Sheave diameter too small',
          'Corrosion from marine environment',
        ],
        steps: [
          { step: 1, action: 'STOP LIFTING OPERATIONS', safetyWarning: 'Damaged wire rope = immediate hazard' },
          { step: 2, action: 'Inspect full length of wire rope', details: 'Look for broken wires, corrosion, deformation', tools: ['Wire rope gauge', 'Magnifying glass'] },
          { step: 3, action: 'Measure rope diameter', details: 'Replace if >10% reduction from nominal' },
          { step: 4, action: 'Check sheaves for wear grooves', details: 'Groove diameter should match rope size ±5%' },
          { step: 5, action: 'Inspect drum for scoring or damage' },
          { step: 6, action: 'Replace wire rope if discard criteria met' },
        ],
        estimatedTime: '8-24 hours for rope replacement',
        requiredSkillLevel: 'specialist',
        sparePartsNeeded: ['Wire rope (matched to specs)', 'Wire rope clips', 'Socketing materials'],
        preventiveMeasures: [
          'Weekly wire rope inspection',
          'Monthly lubrication',
          'Load testing after replacement',
        ],
      },
    ],
    'Ballast System': [
      {
        id: 'bal-001',
        title: 'Ballast Pump Failure',
        severity: 'critical',
        symptoms: [
          'Cannot transfer ballast',
          'Barge listing unexpectedly',
          'Pump motor tripping',
          'Unusual noise from ballast room',
        ],
        possibleCauses: [
          'Pump impeller blockage',
          'Motor electrical failure',
          'Valve stuck or damaged',
          'Sea chest clogged',
        ],
        steps: [
          { step: 1, action: 'Check pump motor electrical supply', tools: ['Multimeter', 'Clamp meter'] },
          { step: 2, action: 'Verify sea chest is clear', details: 'Check sea chest strainer' },
          { step: 3, action: 'Check all ballast valves in circuit', details: 'Ensure correct lineup' },
          { step: 4, action: 'Inspect pump impeller for blockage', safetyWarning: 'Lockout/tagout before opening pump' },
          { step: 5, action: 'Check motor bearings', details: 'Temperature should be <75°C during operation' },
        ],
        estimatedTime: '2-8 hours',
        requiredSkillLevel: 'technician',
        sparePartsNeeded: ['Pump seals', 'Impeller', 'Motor bearings'],
      },
    ],
  },
};

// ========================================
// TUGBOAT TROUBLESHOOTING
// ========================================
export const TUGBOAT_TROUBLESHOOTING: VesselClassEquipment = {
  vesselClass: 'tugboat',
  description: 'Harbor Tugs, ASD Tugs, and Escort Tugs',
  criticalSystems: [
    'Main Propulsion',
    'Azimuth Thrusters',
    'Towing Winch',
    'Fendering System',
    'Steering/Maneuvering',
    'Safety Systems',
  ],
  troubleshootingGuides: {
    'Azimuth Thrusters': [
      {
        id: 'az-001',
        title: 'Azimuth Thruster Not Responding',
        severity: 'critical',
        symptoms: [
          'Thruster fails to rotate',
          'Delayed response to helm',
          'Position feedback error',
          'Hydraulic system alarms',
        ],
        possibleCauses: [
          'Slew ring bearing failure',
          'Hydraulic motor failure',
          'Control system fault',
          'Feedback sensor malfunction',
        ],
        steps: [
          { step: 1, action: 'Switch to backup control mode if available' },
          { step: 2, action: 'Check hydraulic oil level and pressure', details: 'Min 200 bar for steering' },
          { step: 3, action: 'Verify position feedback sensor operation', tools: ['Multimeter', 'Diagnostic laptop'] },
          { step: 4, action: 'Inspect hydraulic hoses for leaks' },
          { step: 5, action: 'Check control system for fault codes', tools: ['OEM diagnostic software'] },
          { step: 6, action: 'If slew bearing suspected, check for abnormal play', tools: ['Dial indicator'] },
        ],
        estimatedTime: '2-24 hours depending on failure',
        requiredSkillLevel: 'specialist',
        sparePartsNeeded: ['Hydraulic motor', 'Position sensors', 'Control cards'],
      },
      {
        id: 'az-002',
        title: 'Excessive Thruster Vibration',
        severity: 'warning',
        symptoms: [
          'Vibration felt throughout vessel',
          'Noise from thruster area',
          'Reduced propulsion efficiency',
        ],
        possibleCauses: [
          'Propeller damage or fouling',
          'Gearbox bearing wear',
          'Shaft misalignment',
          'Cavitation damage',
        ],
        steps: [
          { step: 1, action: 'Reduce thruster speed and observe', details: 'Vibration should reduce with speed' },
          { step: 2, action: 'Inspect propeller for damage or fouling', details: 'Diver or drydock inspection' },
          { step: 3, action: 'Check gearbox oil for metal particles', tools: ['Oil sampling kit', 'Magnet'] },
          { step: 4, action: 'Measure bearing temperatures', details: 'Compare to baseline readings' },
          { step: 5, action: 'Conduct vibration analysis', tools: ['Vibration analyzer'] },
        ],
        estimatedTime: '2-8 hours for diagnosis',
        requiredSkillLevel: 'engineer',
        sparePartsNeeded: ['Propeller', 'Gearbox bearings', 'Shaft seals'],
      },
    ],
    'Towing Winch': [
      {
        id: 'tw-001',
        title: 'Winch Brake Slipping',
        severity: 'critical',
        symptoms: [
          'Tow line paying out under load',
          'Winch drum creeping',
          'Brake not holding set tension',
          'Burning smell from brake',
        ],
        possibleCauses: [
          'Brake lining worn',
          'Oil contamination on brake surface',
          'Brake spring fatigue',
          'Hydraulic brake system failure',
        ],
        steps: [
          { step: 1, action: 'REDUCE TOW TENSION IMMEDIATELY', safetyWarning: 'Risk of runaway line' },
          { step: 2, action: 'Engage secondary brake if available' },
          { step: 3, action: 'Inspect brake lining thickness', details: 'Replace if <3mm remaining' },
          { step: 4, action: 'Check for oil or grease on brake surfaces', details: 'Clean with approved solvent' },
          { step: 5, action: 'Test brake hydraulic pressure', details: 'Compare to manufacturer specs' },
          { step: 6, action: 'Check brake spring tension', tools: ['Spring tension gauge'] },
        ],
        estimatedTime: '4-12 hours',
        requiredSkillLevel: 'technician',
        sparePartsNeeded: ['Brake linings', 'Brake springs', 'Hydraulic seals'],
        preventiveMeasures: [
          'Weekly brake inspection',
          'Monthly brake lining measurement',
          'Keep brake surfaces clean and dry',
        ],
      },
    ],
    'Main Engine': [
      {
        id: 'me-001',
        title: 'Engine Overheating',
        severity: 'critical',
        symptoms: [
          'Coolant temperature above 95°C',
          'Low power alarm',
          'Engine derate or shutdown',
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
      },
    ],
  },
};

// ========================================
// SUPPLY VESSEL TROUBLESHOOTING
// ========================================
export const SUPPLY_VESSEL_TROUBLESHOOTING: VesselClassEquipment = {
  vesselClass: 'supply_vessel',
  description: 'Platform Supply Vessels (PSV) and Anchor Handling Vessels (AHTS)',
  criticalSystems: [
    'Dynamic Positioning (DP)',
    'Cargo Handling',
    'Deck Crane',
    'Thrusters',
    'Fire Fighting System',
    'Power Management',
  ],
  troubleshootingGuides: {
    'DP System': [
      {
        id: 'dp-001',
        title: 'DP Position Drift',
        severity: 'critical',
        symptoms: [
          'Vessel not holding position',
          'Frequent thruster activity',
          'Position reference warnings',
          'DP capability plot degrading',
        ],
        possibleCauses: [
          'Position reference system failure',
          'Wind sensor malfunction',
          'Thruster response degradation',
          'DP computer fault',
          'Gyrocompass error',
        ],
        steps: [
          { step: 1, action: 'Check position reference systems (DGPS, DGNSS)', tools: ['DP diagnostic screen'] },
          { step: 2, action: 'Verify wind sensor readings match actual conditions' },
          { step: 3, action: 'Test individual thruster response', details: 'Compare commanded vs actual thrust' },
          { step: 4, action: 'Check gyrocompass for drift', tools: ['DP console'] },
          { step: 5, action: 'Review DP event log for fault patterns' },
          { step: 6, action: 'Consider switching to backup DP computer' },
        ],
        estimatedTime: '1-4 hours for diagnosis',
        requiredSkillLevel: 'specialist',
        sparePartsNeeded: ['Position reference units', 'Wind sensors', 'Control cards'],
        preventiveMeasures: [
          'Daily DP trials',
          'Weekly sensor calibration check',
          'Annual DP survey',
        ],
      },
    ],
    'Cargo System': [
      {
        id: 'cs-001',
        title: 'Cargo Pump Not Priming',
        severity: 'warning',
        symptoms: [
          'Pump running but no flow',
          'Air in discharge line',
          'Pump cavitating',
        ],
        possibleCauses: [
          'Suction line air leak',
          'Foot valve stuck or damaged',
          'Pump seal allowing air ingress',
          'Tank level too low',
        ],
        steps: [
          { step: 1, action: 'Check tank level', details: 'Minimum 30cm above suction point' },
          { step: 2, action: 'Verify all suction valves are fully open' },
          { step: 3, action: 'Check suction line for air leaks', tools: ['Soapy water', 'Ultrasonic detector'] },
          { step: 4, action: 'Inspect foot valve operation', details: 'Should hold when pump stops' },
          { step: 5, action: 'Prime pump manually if possible' },
        ],
        estimatedTime: '1-3 hours',
        requiredSkillLevel: 'technician',
        sparePartsNeeded: ['Pump seals', 'Foot valve', 'Gaskets'],
      },
    ],
  },
};

// ========================================
// HELPER FUNCTIONS
// ========================================

export function getTroubleshootingForVesselClass(vesselType: string): VesselClassEquipment | null {
  const normalizedType = vesselType.toLowerCase();
  
  if (normalizedType.includes('dredger') || normalizedType.includes('hopper') || normalizedType === 'csd') {
    return DREDGER_TROUBLESHOOTING;
  }
  if (normalizedType.includes('crane') || normalizedType.includes('barge')) {
    return CRANE_BARGE_TROUBLESHOOTING;
  }
  if (normalizedType.includes('tug')) {
    return TUGBOAT_TROUBLESHOOTING;
  }
  if (normalizedType.includes('supply') || normalizedType.includes('support') || normalizedType.includes('survey')) {
    return SUPPLY_VESSEL_TROUBLESHOOTING;
  }
  
  return null;
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
        'Cavitation (for pumps)',
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

