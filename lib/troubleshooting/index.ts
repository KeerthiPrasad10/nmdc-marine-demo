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
// POWER TRANSFORMER TROUBLESHOOTING
// ========================================
export const TRANSFORMER_TROUBLESHOOTING: VesselClassEquipment = {
  vesselClass: 'transformer',
  description: 'Power Transformers, Distribution Transformers, and Substation Equipment',
  criticalSystems: [
    'Winding & Core',
    'Bushing System',
    'Tap Changer',
    'Cooling System',
    'Oil System',
    'Protection & Controls',
  ],
  troubleshootingGuides: {
    'DGA Analysis': [
      {
        id: 'dga-001',
        title: 'Elevated Dissolved Gas Levels (DGA Exceedance)',
        severity: 'critical',
        symptoms: [
          'Hydrogen (H₂) > 500 ppm',
          'Acetylene (C₂H₂) > 2 ppm',
          'Ethylene (C₂H₄) > 150 ppm',
          'Methane (CH₄) > 400 ppm',
          'TDCG increasing > 30 ppm/day',
        ],
        possibleCauses: [
          'Partial discharge in winding insulation',
          'Hot spot in core or winding (overheating)',
          'Arcing at loose connection or bad contact',
          'Cellulose degradation from thermal aging',
          'Oil degradation or contamination',
        ],
        steps: [
          { step: 1, action: 'Increase DGA sampling frequency to daily', details: 'Track rate of gas generation per IEEE C57.104' },
          { step: 2, action: 'Perform Duval Triangle analysis', details: 'Classify fault type: PD, T1/T2/T3, D1/D2' },
          { step: 3, action: 'Check load profile for recent overloads', details: 'Correlate gas generation with load events' },
          { step: 4, action: 'Perform turns ratio and winding resistance tests', tools: ['TTR tester', 'Micro-ohmmeter'] },
          { step: 5, action: 'Schedule infrared thermography of external connections' },
          { step: 6, action: 'If acetylene detected, consider de-energizing for internal inspection', safetyWarning: 'Acetylene indicates arcing - immediate risk assessment required' },
        ],
        estimatedTime: '2-8 hours (testing), 1-4 weeks (if internal inspection needed)',
        requiredSkillLevel: 'engineer',
        sparePartsNeeded: ['Oil sample kits', 'Filter elements', 'Desiccant'],
        preventiveMeasures: [
          'Regular DGA sampling per IEEE C57.104 schedule',
          'Maintain oil quality with routine filtering',
          'Monitor online DGA sensor trends',
        ],
      },
      {
        id: 'dga-002',
        title: 'Rising CO/CO₂ Ratio – Cellulose Degradation',
        severity: 'warning',
        symptoms: [
          'CO/CO₂ ratio > 10',
          'Furan compounds detected in oil',
          'Degree of polymerization (DP) declining',
          'Paper insulation aging accelerating',
        ],
        possibleCauses: [
          'Sustained overtemperature operation',
          'Hot spot on core clamping or leads',
          'Loss of cooling capacity',
          'Excessive loading over time',
        ],
        steps: [
          { step: 1, action: 'Perform furan analysis on oil sample', details: 'Correlate 2-FAL level with insulation condition' },
          { step: 2, action: 'Review loading history for sustained overloads' },
          { step: 3, action: 'Check cooling system effectiveness', details: 'Verify fan operation, radiator condition, oil pump flow' },
          { step: 4, action: 'Estimate remaining insulation life', details: 'Use IEC 60076-7 thermal aging model' },
          { step: 5, action: 'Consider load management strategy', details: 'Reduce peak loading to extend life' },
        ],
        estimatedTime: '4-8 hours (assessment)',
        requiredSkillLevel: 'specialist',
        sparePartsNeeded: ['Oil filter cartridges', 'Desiccant breather elements'],
      },
    ],
    'Bushing': [
      {
        id: 'bush-001',
        title: 'Bushing Power Factor Increase',
        severity: 'warning',
        symptoms: [
          'Power factor > 0.5%',
          'Capacitance change > 5%',
          'Oil leakage at bushing base',
          'Discoloration of porcelain',
        ],
        possibleCauses: [
          'Moisture ingress into bushing condenser',
          'Internal partial discharge',
          'Deteriorating condenser layers',
          'Cracked porcelain allowing contamination',
        ],
        steps: [
          { step: 1, action: 'Perform Doble/power factor test', tools: ['Doble M4000', 'Power factor test set'], details: 'Compare against nameplate values' },
          { step: 2, action: 'Check oil level in bushing sight glass' },
          { step: 3, action: 'Inspect porcelain for cracks or contamination' },
          { step: 4, action: 'Perform infrared scan of bushing connections', tools: ['IR camera'] },
          { step: 5, action: 'If power factor exceeds limits, plan bushing replacement', safetyWarning: 'Bushing failure can cause tank rupture and fire' },
        ],
        estimatedTime: '4-8 hours (testing), 2-5 days (replacement)',
        requiredSkillLevel: 'engineer',
        sparePartsNeeded: ['Replacement bushing', 'Gaskets', 'Transformer oil'],
        preventiveMeasures: [
          'Annual power factor testing',
          'Monthly visual inspection',
          'Online bushing monitoring system',
        ],
      },
    ],
    'Tap Changer': [
      {
        id: 'tc-001',
        title: 'OLTC Contact Wear / High Transition Resistance',
        severity: 'warning',
        symptoms: [
          'DGA shows elevated gases in OLTC compartment',
          'Voltage regulation inconsistency',
          'Audible click without tap position change',
          'Increased transition time',
        ],
        possibleCauses: [
          'Contact erosion from arcing',
          'Carbon buildup on contacts',
          'Worn selector switch contacts',
          'Oil contamination in OLTC compartment',
        ],
        steps: [
          { step: 1, action: 'Check tap position indicator matches actual position' },
          { step: 2, action: 'Perform DGA on OLTC compartment oil separately', details: 'Separate from main tank DGA' },
          { step: 3, action: 'Measure contact resistance at each tap position', tools: ['DCRM tester'] },
          { step: 4, action: 'Inspect contacts for pitting and erosion', safetyWarning: 'De-energize and ground before opening OLTC' },
          { step: 5, action: 'Change OLTC oil and filter if contaminated' },
        ],
        estimatedTime: '8-16 hours',
        requiredSkillLevel: 'specialist',
        sparePartsNeeded: ['Arcing contacts', 'Selector contacts', 'OLTC oil', 'Gaskets'],
        preventiveMeasures: [
          'Count tap operations and service at OEM intervals',
          'Regular OLTC oil analysis',
          'Monitor transition time trends',
        ],
      },
    ],
    'Cooling System': [
      {
        id: 'cool-001',
        title: 'Cooling Fan Failure / Inadequate Cooling',
        severity: 'critical',
        symptoms: [
          'Top oil temperature exceeding alarm threshold (>85°C)',
          'Winding hot-spot temperature exceeding limit',
          'Fan not running or running at reduced speed',
          'ONAN/ONAF stage not activating',
        ],
        possibleCauses: [
          'Fan motor failure',
          'Control relay malfunction',
          'Temperature sensor fault giving false reading',
          'Blocked radiator fins (debris, birds)',
          'Oil pump failure (forced-oil cooled units)',
        ],
        steps: [
          { step: 1, action: 'Verify fan motor power supply', tools: ['Multimeter'], details: 'Check fuses and contactors' },
          { step: 2, action: 'Test temperature control relays and setpoints' },
          { step: 3, action: 'Inspect radiator fins for blockage', details: 'Clean with compressed air or water wash' },
          { step: 4, action: 'Check oil pump operation (if applicable)', details: 'Verify oil flow indicator shows movement' },
          { step: 5, action: 'If unable to restore cooling, reduce load to ONAN rating', safetyWarning: 'Sustained overtemperature causes insulation damage' },
        ],
        estimatedTime: '2-8 hours',
        requiredSkillLevel: 'technician',
        sparePartsNeeded: ['Fan motors', 'Control relays', 'Temperature gauges', 'Oil pumps'],
        preventiveMeasures: [
          'Monthly fan operation check',
          'Annual radiator cleaning',
          'Test all cooling stages during seasonal checks',
        ],
      },
    ],
    'Oil System': [
      {
        id: 'oil-001',
        title: 'Oil Leak / Low Oil Level',
        severity: 'critical',
        symptoms: [
          'Visible oil stain below transformer',
          'Oil level gauge below minimum mark',
          'Buchholz relay gas alarm or trip',
          'Conservator tank level dropping',
        ],
        possibleCauses: [
          'Gasket deterioration',
          'Weld fatigue crack',
          'Radiator valve leak',
          'Bushing gasket failure',
          'Drain valve not fully closed',
        ],
        steps: [
          { step: 1, action: 'Locate the source of the leak', tools: ['UV dye kit', 'Visual inspection'] },
          { step: 2, action: 'Check Buchholz relay for accumulated gas', details: 'Collect gas sample for analysis' },
          { step: 3, action: 'Monitor oil level trend', details: 'If dropping rapidly, prepare for de-energization' },
          { step: 4, action: 'Temporary patch if minor leak', details: 'Use approved sealant compound for emergency repair' },
          { step: 5, action: 'Schedule outage for permanent repair', safetyWarning: 'Low oil level exposes live parts - flash-over risk' },
        ],
        estimatedTime: '2-48 hours depending on severity',
        requiredSkillLevel: 'technician',
        sparePartsNeeded: ['Gaskets', 'Transformer oil', 'Sealant compound', 'Drain valve'],
      },
    ],
    'Winding': [
      {
        id: 'wnd-001',
        title: 'Winding Insulation Degradation',
        severity: 'critical',
        symptoms: [
          'Low insulation resistance / power factor increase',
          'DGA indicating thermal fault (ethylene, CO)',
          'Winding resistance imbalance between phases',
          'Reduced megger test values',
        ],
        possibleCauses: [
          'Thermal aging from sustained overloading',
          'Moisture ingress into insulation',
          'Partial discharge activity eroding insulation',
          'Manufacturing defect',
        ],
        steps: [
          { step: 1, action: 'Perform insulation resistance test (megger)', tools: ['Megger / Insulation tester'], details: 'Min 5kV test, compare to baseline' },
          { step: 2, action: 'Measure winding resistance all phases', tools: ['Micro-ohmmeter'], details: 'Phase imbalance > 2% indicates issue' },
          { step: 3, action: 'Perform frequency response analysis (FRA)', details: 'Compare against factory fingerprint' },
          { step: 4, action: 'Check moisture content of oil', details: 'Correlate with insulation condition' },
          { step: 5, action: 'Assess remaining life based on DGA + furans + DP' },
          { step: 6, action: 'If severe, plan transformer replacement', safetyWarning: 'Winding failure can result in explosion and fire' },
        ],
        estimatedTime: '8-24 hours (full diagnostic)',
        requiredSkillLevel: 'specialist',
        sparePartsNeeded: ['Replacement transformer (long lead - 12-24 months)'],
        preventiveMeasures: [
          'Manage loading within nameplate rating',
          'Maintain oil quality and moisture levels',
          'Regular insulation testing per NETA schedule',
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
  
  // Grid / utility asset types
  if (normalizedType.includes('transformer') || normalizedType.includes('substation') || normalizedType.includes('circuit_breaker') || normalizedType.includes('feeder') || normalizedType.includes('grid')) {
    return TRANSFORMER_TROUBLESHOOTING;
  }
  
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
  
  // Default to transformer for Exelon demo
  return TRANSFORMER_TROUBLESHOOTING;
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















