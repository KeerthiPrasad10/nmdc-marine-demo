/**
 * Maritime Industry Types - Regulations, Fuel, and Predictive Maintenance
 * Based on IMO MARPOL, IGF Code, and ISO 55000 standards
 */

// ============================================================================
// FUEL TYPES & REGULATIONS
// ============================================================================

export type FuelType = 
  | 'VLSFO'     // Very Low Sulfur Fuel Oil (0.5% sulfur) - Global standard since 2020
  | 'ULSFO'     // Ultra Low Sulfur Fuel Oil (0.1% sulfur) - For ECAs
  | 'MGO'       // Marine Gas Oil (0.1% sulfur) - Distillate fuel
  | 'MDO'       // Marine Diesel Oil
  | 'HFO'       // Heavy Fuel Oil (3.5% sulfur) - Legacy, restricted use
  | 'LNG'       // Liquefied Natural Gas - Low emission alternative
  | 'METHANOL'  // Alternative fuel
  | 'BIOFUEL';  // Sustainable marine biofuel

export interface FuelSpecification {
  type: FuelType;
  sulfurContent: number;  // Percentage (e.g., 0.5 for 0.5%)
  density: number;        // kg/m³
  viscosity: number;      // cSt at 50°C
  flashPoint: number;     // °C
  co2Factor: number;      // kg CO2 per kg fuel
  noxFactor: number;      // g NOx per kWh
  soxFactor: number;      // g SOx per kg fuel (based on sulfur content)
  costPerTon: number;     // USD per metric ton
}

export const FUEL_SPECIFICATIONS: Record<FuelType, FuelSpecification> = {
  VLSFO: {
    type: 'VLSFO',
    sulfurContent: 0.5,
    density: 960,
    viscosity: 380,
    flashPoint: 60,
    co2Factor: 3.114,
    noxFactor: 14.4,
    soxFactor: 10.0,
    costPerTon: 550,
  },
  ULSFO: {
    type: 'ULSFO',
    sulfurContent: 0.1,
    density: 890,
    viscosity: 180,
    flashPoint: 60,
    co2Factor: 3.114,
    noxFactor: 13.2,
    soxFactor: 2.0,
    costPerTon: 620,
  },
  MGO: {
    type: 'MGO',
    sulfurContent: 0.1,
    density: 855,
    viscosity: 4.5,
    flashPoint: 60,
    co2Factor: 3.206,
    noxFactor: 13.2,
    soxFactor: 2.0,
    costPerTon: 680,
  },
  MDO: {
    type: 'MDO',
    sulfurContent: 0.5,
    density: 880,
    viscosity: 11,
    flashPoint: 60,
    co2Factor: 3.206,
    noxFactor: 14.4,
    soxFactor: 10.0,
    costPerTon: 600,
  },
  HFO: {
    type: 'HFO',
    sulfurContent: 3.5,
    density: 991,
    viscosity: 700,
    flashPoint: 60,
    co2Factor: 3.114,
    noxFactor: 18.1,
    soxFactor: 70.0,
    costPerTon: 380,
  },
  LNG: {
    type: 'LNG',
    sulfurContent: 0.0,
    density: 450,
    viscosity: 0.2,
    flashPoint: -162,
    co2Factor: 2.750,
    noxFactor: 1.3,
    soxFactor: 0.0,
    costPerTon: 720,
  },
  METHANOL: {
    type: 'METHANOL',
    sulfurContent: 0.0,
    density: 796,
    viscosity: 0.6,
    flashPoint: 11,
    co2Factor: 1.375,
    noxFactor: 3.0,
    soxFactor: 0.0,
    costPerTon: 450,
  },
  BIOFUEL: {
    type: 'BIOFUEL',
    sulfurContent: 0.0,
    density: 880,
    viscosity: 4.5,
    flashPoint: 100,
    co2Factor: 0.5, // Lifecycle emissions much lower
    noxFactor: 12.0,
    soxFactor: 0.0,
    costPerTon: 950,
  },
};

// ============================================================================
// REGULATORY COMPLIANCE
// ============================================================================

export type RegulationType =
  | 'MARPOL_ANNEX_VI'     // Air pollution prevention
  | 'MARPOL_ANNEX_I'      // Oil pollution prevention
  | 'MARPOL_ANNEX_IV'     // Sewage pollution prevention
  | 'MARPOL_ANNEX_V'      // Garbage pollution prevention
  | 'ISM_CODE'            // International Safety Management
  | 'ISPS_CODE'           // Ship Security
  | 'MLC_2006'            // Maritime Labour Convention
  | 'IGF_CODE'            // Gas fuel safety
  | 'SOLAS'               // Safety of Life at Sea
  | 'CII_RATING'          // Carbon Intensity Indicator
  | 'EEXI'                // Energy Efficiency Existing Ship Index
  | 'UAE_FTA'             // UAE Federal Transport Authority
  | 'ADPC';               // Abu Dhabi Ports Company

export type ComplianceStatus = 'compliant' | 'warning' | 'non_compliant' | 'pending_inspection';

export interface ComplianceRecord {
  regulation: RegulationType;
  status: ComplianceStatus;
  lastInspection: Date;
  nextInspection: Date;
  certificateExpiry: Date;
  notes?: string;
  ciiRating?: 'A' | 'B' | 'C' | 'D' | 'E'; // For CII specifically
}

export interface EmissionLimits {
  zone: 'GLOBAL' | 'ECA' | 'UAE_COASTAL';
  maxSulfurPercent: number;
  maxNoxTier: 1 | 2 | 3;
  description: string;
}

export const EMISSION_ZONES: Record<string, EmissionLimits> = {
  GLOBAL: {
    zone: 'GLOBAL',
    maxSulfurPercent: 0.5,
    maxNoxTier: 2,
    description: 'Global IMO 2020 sulfur cap',
  },
  UAE_COASTAL: {
    zone: 'UAE_COASTAL',
    maxSulfurPercent: 0.5,
    maxNoxTier: 2,
    description: 'UAE territorial waters - MARPOL Annex VI',
  },
  PERSIAN_GULF: {
    zone: 'GLOBAL',
    maxSulfurPercent: 0.5,
    maxNoxTier: 2,
    description: 'Persian Gulf - Proposed SECA status under review',
  },
};

// ============================================================================
// PREDICTIVE MAINTENANCE (PdM) MODELS
// ============================================================================

export type FailureMode =
  // Engine failures
  | 'bearing_wear'
  | 'piston_ring_wear'
  | 'fuel_injector_fouling'
  | 'turbocharger_failure'
  | 'cooling_system_failure'
  | 'lube_oil_degradation'
  // Propulsion failures
  | 'cavitation_damage'
  | 'shaft_misalignment'
  | 'seal_leakage'
  | 'gearbox_wear'
  | 'thruster_bearing_wear'
  // Hull & structure
  | 'hull_fouling'
  | 'propeller_fouling'
  | 'corrosion'
  | 'fatigue_cracking'
  // Dredger specific
  | 'cutter_motor_bearing'
  | 'spud_embedment'
  | 'dredge_pump_wear'
  | 'suction_pipe_wear'
  // Crane & lifting
  | 'wire_rope_fatigue'
  | 'crane_boom_fatigue'
  | 'hydraulic_leak'
  | 'winch_brake_wear'
  // Electrical
  | 'generator_winding'
  | 'switchboard_failure'
  | 'sensor_drift';

export interface FailureModeProfile {
  mode: FailureMode;
  applicableEquipment: string[];
  mtbf: number;              // Mean Time Between Failures (hours)
  degradationRate: number;   // Health loss per 100 operating hours
  warningThreshold: number;  // Health score to trigger warning
  criticalThreshold: number; // Health score to trigger critical alert
  leadTime: number;          // Days of warning before failure
  costOfFailure: number;     // USD
  plannedMaintenanceCost: number; // USD
  sensorIndicators: string[];
}

export const FAILURE_MODE_PROFILES: Record<FailureMode, FailureModeProfile> = {
  bearing_wear: {
    mode: 'bearing_wear',
    applicableEquipment: ['engine', 'propulsion', 'crane', 'hydraulics'],
    mtbf: 15000,
    degradationRate: 0.5,
    warningThreshold: 60,
    criticalThreshold: 30,
    leadTime: 14,
    costOfFailure: 75000,
    plannedMaintenanceCost: 12000,
    sensorIndicators: ['vibration', 'temperature', 'acoustic'],
  },
  piston_ring_wear: {
    mode: 'piston_ring_wear',
    applicableEquipment: ['engine'],
    mtbf: 20000,
    degradationRate: 0.3,
    warningThreshold: 65,
    criticalThreshold: 35,
    leadTime: 21,
    costOfFailure: 150000,
    plannedMaintenanceCost: 45000,
    sensorIndicators: ['oil_analysis', 'compression', 'exhaust_temp'],
  },
  fuel_injector_fouling: {
    mode: 'fuel_injector_fouling',
    applicableEquipment: ['engine'],
    mtbf: 8000,
    degradationRate: 0.8,
    warningThreshold: 70,
    criticalThreshold: 40,
    leadTime: 7,
    costOfFailure: 25000,
    plannedMaintenanceCost: 5000,
    sensorIndicators: ['fuel_consumption', 'exhaust_temp', 'power_output'],
  },
  turbocharger_failure: {
    mode: 'turbocharger_failure',
    applicableEquipment: ['engine'],
    mtbf: 25000,
    degradationRate: 0.25,
    warningThreshold: 55,
    criticalThreshold: 25,
    leadTime: 28,
    costOfFailure: 200000,
    plannedMaintenanceCost: 60000,
    sensorIndicators: ['vibration', 'rpm', 'boost_pressure', 'temperature'],
  },
  cooling_system_failure: {
    mode: 'cooling_system_failure',
    applicableEquipment: ['engine', 'electrical'],
    mtbf: 12000,
    degradationRate: 0.6,
    warningThreshold: 65,
    criticalThreshold: 35,
    leadTime: 10,
    costOfFailure: 35000,
    plannedMaintenanceCost: 8000,
    sensorIndicators: ['temperature', 'coolant_level', 'flow_rate'],
  },
  lube_oil_degradation: {
    mode: 'lube_oil_degradation',
    applicableEquipment: ['engine', 'gearbox', 'hydraulics'],
    mtbf: 2000,
    degradationRate: 2.5,
    warningThreshold: 75,
    criticalThreshold: 50,
    leadTime: 5,
    costOfFailure: 15000,
    plannedMaintenanceCost: 2000,
    sensorIndicators: ['oil_analysis', 'viscosity', 'particle_count'],
  },
  cavitation_damage: {
    mode: 'cavitation_damage',
    applicableEquipment: ['propulsion', 'pump'],
    mtbf: 18000,
    degradationRate: 0.4,
    warningThreshold: 60,
    criticalThreshold: 30,
    leadTime: 21,
    costOfFailure: 120000,
    plannedMaintenanceCost: 35000,
    sensorIndicators: ['vibration', 'acoustic', 'pressure_fluctuation'],
  },
  shaft_misalignment: {
    mode: 'shaft_misalignment',
    applicableEquipment: ['propulsion', 'engine'],
    mtbf: 30000,
    degradationRate: 0.2,
    warningThreshold: 55,
    criticalThreshold: 25,
    leadTime: 30,
    costOfFailure: 180000,
    plannedMaintenanceCost: 25000,
    sensorIndicators: ['vibration', 'temperature', 'torque'],
  },
  seal_leakage: {
    mode: 'seal_leakage',
    applicableEquipment: ['propulsion', 'hydraulics', 'pump'],
    mtbf: 10000,
    degradationRate: 0.7,
    warningThreshold: 70,
    criticalThreshold: 40,
    leadTime: 7,
    costOfFailure: 40000,
    plannedMaintenanceCost: 6000,
    sensorIndicators: ['oil_level', 'pressure', 'visual_inspection'],
  },
  gearbox_wear: {
    mode: 'gearbox_wear',
    applicableEquipment: ['propulsion', 'winch'],
    mtbf: 20000,
    degradationRate: 0.35,
    warningThreshold: 60,
    criticalThreshold: 30,
    leadTime: 21,
    costOfFailure: 250000,
    plannedMaintenanceCost: 50000,
    sensorIndicators: ['vibration', 'oil_analysis', 'temperature'],
  },
  thruster_bearing_wear: {
    mode: 'thruster_bearing_wear',
    applicableEquipment: ['propulsion'],
    mtbf: 12000,
    degradationRate: 0.6,
    warningThreshold: 60,
    criticalThreshold: 30,
    leadTime: 14,
    costOfFailure: 95000,
    plannedMaintenanceCost: 22000,
    sensorIndicators: ['vibration', 'acoustic', 'temperature'],
  },
  hull_fouling: {
    mode: 'hull_fouling',
    applicableEquipment: ['hull'],
    mtbf: 4000,
    degradationRate: 1.5,
    warningThreshold: 80,
    criticalThreshold: 50,
    leadTime: 30,
    costOfFailure: 50000, // Increased fuel consumption
    plannedMaintenanceCost: 15000,
    sensorIndicators: ['fuel_consumption', 'speed_loss', 'visual_inspection'],
  },
  propeller_fouling: {
    mode: 'propeller_fouling',
    applicableEquipment: ['propulsion'],
    mtbf: 3000,
    degradationRate: 2.0,
    warningThreshold: 75,
    criticalThreshold: 45,
    leadTime: 14,
    costOfFailure: 30000,
    plannedMaintenanceCost: 8000,
    sensorIndicators: ['fuel_consumption', 'vibration', 'rpm_torque_ratio'],
  },
  corrosion: {
    mode: 'corrosion',
    applicableEquipment: ['hull', 'structure', 'piping'],
    mtbf: 50000,
    degradationRate: 0.15,
    warningThreshold: 60,
    criticalThreshold: 30,
    leadTime: 60,
    costOfFailure: 500000,
    plannedMaintenanceCost: 100000,
    sensorIndicators: ['thickness_gauge', 'visual_inspection', 'potential'],
  },
  fatigue_cracking: {
    mode: 'fatigue_cracking',
    applicableEquipment: ['structure', 'crane', 'hull'],
    mtbf: 40000,
    degradationRate: 0.18,
    warningThreshold: 55,
    criticalThreshold: 25,
    leadTime: 45,
    costOfFailure: 750000,
    plannedMaintenanceCost: 150000,
    sensorIndicators: ['strain_gauge', 'ultrasonic', 'visual_inspection'],
  },
  cutter_motor_bearing: {
    mode: 'cutter_motor_bearing',
    applicableEquipment: ['dredging'],
    mtbf: 8000,
    degradationRate: 0.9,
    warningThreshold: 65,
    criticalThreshold: 35,
    leadTime: 10,
    costOfFailure: 85000,
    plannedMaintenanceCost: 18000,
    sensorIndicators: ['vibration', 'temperature', 'current_draw'],
  },
  spud_embedment: {
    mode: 'spud_embedment',
    applicableEquipment: ['dredging'],
    mtbf: 5000,
    degradationRate: 1.2,
    warningThreshold: 70,
    criticalThreshold: 40,
    leadTime: 7,
    costOfFailure: 120000,
    plannedMaintenanceCost: 25000,
    sensorIndicators: ['force_sensor', 'position', 'soil_analysis'],
  },
  dredge_pump_wear: {
    mode: 'dredge_pump_wear',
    applicableEquipment: ['dredging', 'pump'],
    mtbf: 6000,
    degradationRate: 1.0,
    warningThreshold: 65,
    criticalThreshold: 35,
    leadTime: 14,
    costOfFailure: 95000,
    plannedMaintenanceCost: 20000,
    sensorIndicators: ['flow_rate', 'pressure', 'vibration', 'power_draw'],
  },
  suction_pipe_wear: {
    mode: 'suction_pipe_wear',
    applicableEquipment: ['dredging'],
    mtbf: 4000,
    degradationRate: 1.5,
    warningThreshold: 70,
    criticalThreshold: 40,
    leadTime: 10,
    costOfFailure: 45000,
    plannedMaintenanceCost: 12000,
    sensorIndicators: ['thickness_gauge', 'flow_rate', 'visual_inspection'],
  },
  wire_rope_fatigue: {
    mode: 'wire_rope_fatigue',
    applicableEquipment: ['crane', 'winch'],
    mtbf: 10000,
    degradationRate: 0.7,
    warningThreshold: 65,
    criticalThreshold: 35,
    leadTime: 14,
    costOfFailure: 65000,
    plannedMaintenanceCost: 8000,
    sensorIndicators: ['visual_ai', 'load_cycles', 'diameter_measurement'],
  },
  crane_boom_fatigue: {
    mode: 'crane_boom_fatigue',
    applicableEquipment: ['crane'],
    mtbf: 35000,
    degradationRate: 0.2,
    warningThreshold: 55,
    criticalThreshold: 25,
    leadTime: 30,
    costOfFailure: 500000,
    plannedMaintenanceCost: 80000,
    sensorIndicators: ['strain_gauge', 'load_cycles', 'crack_detection'],
  },
  hydraulic_leak: {
    mode: 'hydraulic_leak',
    applicableEquipment: ['hydraulics', 'crane', 'winch'],
    mtbf: 6000,
    degradationRate: 1.0,
    warningThreshold: 75,
    criticalThreshold: 45,
    leadTime: 5,
    costOfFailure: 25000,
    plannedMaintenanceCost: 4000,
    sensorIndicators: ['oil_level', 'pressure', 'visual_inspection'],
  },
  winch_brake_wear: {
    mode: 'winch_brake_wear',
    applicableEquipment: ['winch', 'crane'],
    mtbf: 8000,
    degradationRate: 0.8,
    warningThreshold: 60,
    criticalThreshold: 30,
    leadTime: 10,
    costOfFailure: 55000,
    plannedMaintenanceCost: 10000,
    sensorIndicators: ['brake_temp', 'stopping_distance', 'pad_thickness'],
  },
  generator_winding: {
    mode: 'generator_winding',
    applicableEquipment: ['electrical'],
    mtbf: 30000,
    degradationRate: 0.25,
    warningThreshold: 55,
    criticalThreshold: 25,
    leadTime: 30,
    costOfFailure: 180000,
    plannedMaintenanceCost: 35000,
    sensorIndicators: ['insulation_resistance', 'temperature', 'partial_discharge'],
  },
  switchboard_failure: {
    mode: 'switchboard_failure',
    applicableEquipment: ['electrical'],
    mtbf: 40000,
    degradationRate: 0.18,
    warningThreshold: 60,
    criticalThreshold: 30,
    leadTime: 21,
    costOfFailure: 120000,
    plannedMaintenanceCost: 25000,
    sensorIndicators: ['thermal_imaging', 'partial_discharge', 'current_imbalance'],
  },
  sensor_drift: {
    mode: 'sensor_drift',
    applicableEquipment: ['navigation', 'monitoring'],
    mtbf: 15000,
    degradationRate: 0.5,
    warningThreshold: 70,
    criticalThreshold: 40,
    leadTime: 7,
    costOfFailure: 15000,
    plannedMaintenanceCost: 2000,
    sensorIndicators: ['calibration_check', 'reference_comparison'],
  },
};

// ============================================================================
// LEGACY MARINE VESSEL FLEET
// ============================================================================

export type LegacyVesselClass =
  | 'heavy_duty_csd'      // Al Sadr, Al Yassat, Al Khatem, Al Hamra, Al Mirfa, Kattouf
  | 'derrick_barge'       // Heavy lift derrick barges
  | 'hopper_dredger'      // Trailing suction hopper dredgers
  | 'auxiliary_tug'       // Harbor and ocean tugs
  | 'supply_vessel'       // Platform supply vessels
  | 'survey_vessel'       // Hydrographic survey vessels
  | 'crane_barge'         // Floating cranes
  | 'accommodation_barge'; // Floatels

export interface LegacyVesselProfile {
  name: string;
  class: LegacyVesselClass;
  imoNumber: string;
  yearBuilt: number;
  grossTonnage: number;
  lengthOverall: number;  // meters
  beam: number;           // meters
  draft: number;          // meters
  mainEngines: { type: string; power: number; count: number }; // kW
  fuelCapacity: number;   // cubic meters
  primaryFuel: FuelType;
  crewCapacity: number;
  dpClass?: 1 | 2 | 3;    // Dynamic Positioning class
  project?: string;
  specificEquipment: string[];  // Equipment types for PdM focus
  pdmFocus: FailureMode[];      // Key failure modes to monitor
}

export const LEGACY_MARINE_FLEET: LegacyVesselProfile[] = [
  // Heavy Duty Cutter Suction Dredgers
  {
    name: 'Al Sadr',
    class: 'heavy_duty_csd',
    imoNumber: '9234567',
    yearBuilt: 2008,
    grossTonnage: 8500,
    lengthOverall: 142,
    beam: 28,
    draft: 5.2,
    mainEngines: { type: 'Caterpillar 3516C', power: 2350, count: 4 },
    fuelCapacity: 850,
    primaryFuel: 'VLSFO',
    crewCapacity: 35,
    dpClass: 2,
    project: 'Khalifa Port Expansion',
    specificEquipment: ['cutter_head', 'dredge_pump', 'spud_system', 'suction_pipe'],
    pdmFocus: ['cutter_motor_bearing', 'spud_embedment', 'dredge_pump_wear', 'hull_fouling'],
  },
  {
    name: 'Al Yassat',
    class: 'heavy_duty_csd',
    imoNumber: '9234568',
    yearBuilt: 2010,
    grossTonnage: 9200,
    lengthOverall: 148,
    beam: 30,
    draft: 5.5,
    mainEngines: { type: 'MAN 9L32/44CR', power: 4500, count: 3 },
    fuelCapacity: 920,
    primaryFuel: 'VLSFO',
    crewCapacity: 38,
    dpClass: 2,
    project: 'Ruwais Channel Deepening',
    specificEquipment: ['cutter_head', 'dredge_pump', 'spud_system', 'ladder_gantry'],
    pdmFocus: ['cutter_motor_bearing', 'dredge_pump_wear', 'suction_pipe_wear', 'hydraulic_leak'],
  },
  {
    name: 'Al Khatem',
    class: 'heavy_duty_csd',
    imoNumber: '9234569',
    yearBuilt: 2012,
    grossTonnage: 10500,
    lengthOverall: 155,
    beam: 32,
    draft: 5.8,
    mainEngines: { type: 'Wärtsilä 8L32', power: 4000, count: 4 },
    fuelCapacity: 1100,
    primaryFuel: 'MGO',
    crewCapacity: 42,
    dpClass: 2,
    project: 'Das Island Dredging',
    specificEquipment: ['cutter_head', 'dredge_pump', 'spud_system', 'discharge_line'],
    pdmFocus: ['cutter_motor_bearing', 'spud_embedment', 'bearing_wear', 'lube_oil_degradation'],
  },
  {
    name: 'Al Hamra',
    class: 'heavy_duty_csd',
    imoNumber: '9234570',
    yearBuilt: 2015,
    grossTonnage: 11200,
    lengthOverall: 160,
    beam: 33,
    draft: 6.0,
    mainEngines: { type: 'Caterpillar 3516E', power: 2650, count: 4 },
    fuelCapacity: 1200,
    primaryFuel: 'VLSFO',
    crewCapacity: 40,
    dpClass: 2,
    project: 'Abu Dhabi Port Expansion',
    specificEquipment: ['cutter_head', 'dredge_pump', 'ladder_system', 'spud_carrier'],
    pdmFocus: ['dredge_pump_wear', 'hull_fouling', 'cooling_system_failure', 'shaft_misalignment'],
  },
  {
    name: 'Al Mirfa',
    class: 'heavy_duty_csd',
    imoNumber: '9234571',
    yearBuilt: 2018,
    grossTonnage: 12000,
    lengthOverall: 165,
    beam: 34,
    draft: 6.2,
    mainEngines: { type: 'MAN 12V32/44CR', power: 6000, count: 2 },
    fuelCapacity: 1350,
    primaryFuel: 'MGO',
    crewCapacity: 45,
    dpClass: 2,
    project: 'Fujairah Offshore Project',
    specificEquipment: ['cutter_head', 'submerged_pump', 'spud_system', 'monitoring_system'],
    pdmFocus: ['cutter_motor_bearing', 'cavitation_damage', 'spud_embedment', 'sensor_drift'],
  },
  {
    name: 'Kattouf',
    class: 'heavy_duty_csd',
    imoNumber: '9234572',
    yearBuilt: 2020,
    grossTonnage: 13500,
    lengthOverall: 170,
    beam: 36,
    draft: 6.5,
    mainEngines: { type: 'Wärtsilä 9L46F', power: 9450, count: 2 },
    fuelCapacity: 1500,
    primaryFuel: 'LNG',
    crewCapacity: 48,
    dpClass: 3,
    project: 'Ras Al Khaimah Development',
    specificEquipment: ['cutter_head', 'submerged_pump', 'dp_system', 'emission_scrubber'],
    pdmFocus: ['thruster_bearing_wear', 'dredge_pump_wear', 'turbocharger_failure', 'propeller_fouling'],
  },
  
  // Derrick Barges
  {
    name: 'Heavy Lifter I',
    class: 'derrick_barge',
    imoNumber: '9345678',
    yearBuilt: 2005,
    grossTonnage: 15000,
    lengthOverall: 120,
    beam: 45,
    draft: 4.5,
    mainEngines: { type: 'Caterpillar 3512C', power: 1500, count: 4 },
    fuelCapacity: 600,
    primaryFuel: 'VLSFO',
    crewCapacity: 80,
    project: 'Offshore Platform Installation',
    specificEquipment: ['main_crane', 'auxiliary_crane', 'anchor_winches', 'ballast_system'],
    pdmFocus: ['wire_rope_fatigue', 'crane_boom_fatigue', 'winch_brake_wear', 'hydraulic_leak'],
  },
  {
    name: 'Heavy Lifter II',
    class: 'derrick_barge',
    imoNumber: '9345679',
    yearBuilt: 2012,
    grossTonnage: 22000,
    lengthOverall: 140,
    beam: 52,
    draft: 5.0,
    mainEngines: { type: 'MAN 8L32/44CR', power: 3600, count: 3 },
    fuelCapacity: 800,
    primaryFuel: 'MGO',
    crewCapacity: 100,
    project: 'ADNOC Offshore Module',
    specificEquipment: ['revolving_crane', 'heavy_lift_system', 'dp_thrusters', 'accommodation'],
    pdmFocus: ['crane_boom_fatigue', 'fatigue_cracking', 'wire_rope_fatigue', 'generator_winding'],
  },
  
  // Hopper Dredgers
  {
    name: 'Gulf Hopper',
    class: 'hopper_dredger',
    imoNumber: '9456789',
    yearBuilt: 2016,
    grossTonnage: 8000,
    lengthOverall: 110,
    beam: 22,
    draft: 7.5,
    mainEngines: { type: 'Wärtsilä 6L32', power: 3000, count: 2 },
    fuelCapacity: 500,
    primaryFuel: 'VLSFO',
    crewCapacity: 28,
    project: 'Dubai Channel Maintenance',
    specificEquipment: ['draghead', 'suction_tube', 'hopper', 'discharge_pump'],
    pdmFocus: ['hull_fouling', 'propeller_fouling', 'dredge_pump_wear', 'bearing_wear'],
  },
  
  // Auxiliary Tugs
  {
    name: 'Al Dhafra Tug',
    class: 'auxiliary_tug',
    imoNumber: '9567890',
    yearBuilt: 2019,
    grossTonnage: 850,
    lengthOverall: 38,
    beam: 12,
    draft: 5.5,
    mainEngines: { type: 'Caterpillar 3516C', power: 2350, count: 2 },
    fuelCapacity: 180,
    primaryFuel: 'MGO',
    crewCapacity: 12,
    project: 'Port Operations',
    specificEquipment: ['azimuth_thruster', 'towing_winch', 'fifi_system'],
    pdmFocus: ['thruster_bearing_wear', 'propeller_fouling', 'hydraulic_leak', 'bearing_wear'],
  },
  {
    name: 'Gulf Pioneer',
    class: 'auxiliary_tug',
    imoNumber: '9567891',
    yearBuilt: 2020,
    grossTonnage: 920,
    lengthOverall: 40,
    beam: 13,
    draft: 5.8,
    mainEngines: { type: 'MAN 6L27/38', power: 2000, count: 2 },
    fuelCapacity: 200,
    primaryFuel: 'MGO',
    crewCapacity: 14,
    dpClass: 1,
    project: 'Offshore Support',
    specificEquipment: ['azimuth_thruster', 'anchor_handling_winch', 'towing_pins'],
    pdmFocus: ['hull_fouling', 'shaft_misalignment', 'gearbox_wear', 'cooling_system_failure'],
  },
  
  // Survey Vessels
  {
    name: 'Ocean Explorer',
    class: 'survey_vessel',
    imoNumber: '9678901',
    yearBuilt: 2021,
    grossTonnage: 1200,
    lengthOverall: 55,
    beam: 14,
    draft: 4.2,
    mainEngines: { type: 'Caterpillar C32', power: 1081, count: 2 },
    fuelCapacity: 120,
    primaryFuel: 'MGO',
    crewCapacity: 22,
    dpClass: 2,
    project: 'Hydrographic Survey',
    specificEquipment: ['multibeam_sonar', 'side_scan_sonar', 'svp_system', 'gnss_rtk'],
    pdmFocus: ['sensor_drift', 'thruster_bearing_wear', 'generator_winding', 'hull_fouling'],
  },
  {
    name: 'Deep Scanner',
    class: 'survey_vessel',
    imoNumber: '9678902',
    yearBuilt: 2022,
    grossTonnage: 1500,
    lengthOverall: 62,
    beam: 15,
    draft: 4.5,
    mainEngines: { type: 'Wärtsilä 6L20', power: 1200, count: 2 },
    fuelCapacity: 150,
    primaryFuel: 'BIOFUEL',
    crewCapacity: 25,
    dpClass: 2,
    project: 'Subsea Pipeline Survey',
    specificEquipment: ['rov_system', 'multibeam_sonar', 'das_dts_fiber', 'usbl_positioning'],
    pdmFocus: ['sensor_drift', 'switchboard_failure', 'hydraulic_leak', 'propeller_fouling'],
  },
];

// ============================================================================
// ISO 55000 ASSET MANAGEMENT
// ============================================================================

export interface AssetLifecycleMetrics {
  vesselId: string;
  acquisitionCost: number;
  currentBookValue: number;
  annualDepreciation: number;
  maintenanceCostYTD: number;
  fuelCostYTD: number;
  utilizationRate: number;      // Percentage of time in operation
  availabilityRate: number;     // Percentage of time available (not in maintenance)
  mtbf: number;                 // Mean Time Between Failures (hours)
  mttr: number;                 // Mean Time To Repair (hours)
  remainingUsefulLife: number;  // Estimated years
  riskScore: number;            // 0-100, based on condition and criticality
}

export interface MaintenanceSchedule {
  vesselId: string;
  equipmentId: string;
  scheduledDate: Date;
  maintenanceType: 'routine' | 'condition_based' | 'predictive' | 'corrective';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number;    // Hours
  estimatedCost: number;        // USD
  requiredParts: string[];
  requiredCertifications: string[];
  riskOfDeferral: string;
}

export interface DigitalTwinState {
  vesselId: string;
  timestamp: Date;
  position: { lat: number; lng: number };
  speed: number;
  heading: number;
  fuelLevel: number;
  fuelConsumptionRate: number;
  emissions: {
    co2: number;
    nox: number;
    sox: number;
    pm: number;  // Particulate matter
  };
  equipmentStates: {
    equipmentId: string;
    healthScore: number;
    temperature: number;
    vibration: number;
    pressure?: number;
    flowRate?: number;
    currentDraw?: number;
    predictedFailure?: {
      mode: FailureMode;
      probability: number;
      timeToFailure: number; // Hours
      recommendedAction: string;
    };
  }[];
  weatherAtLocation: {
    condition: string;
    windSpeed: number;
    waveHeight: number;
    visibility: number;
  };
  complianceStatus: ComplianceRecord[];
}

