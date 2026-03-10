/**
 * Maritime Industry Types - Regulations, Fuel, and Predictive Maintenance
 * Adapted for WSDOT Ferry Operations in Puget Sound
 * Based on USCG regulations, SOLAS, and ISO 55000 standards
 */

// ============================================================================
// FUEL TYPES & REGULATIONS
// ============================================================================

export type FuelType =
  | 'ULSD'       // Ultra Low Sulfur Diesel (15 ppm sulfur) - Primary ferry fuel
  | 'MGO'        // Marine Gas Oil (0.1% sulfur) - Distillate fuel
  | 'MDO'        // Marine Diesel Oil
  | 'BIODIESEL'  // B20 biodiesel blend
  | 'DIESEL_ELECTRIC'; // Diesel-electric hybrid

export interface FuelSpecification {
  type: FuelType;
  sulfurContent: number;  // Percentage (e.g., 0.0015 for 15 ppm)
  density: number;        // kg/m³
  viscosity: number;      // cSt at 50°C
  flashPoint: number;     // °C
  co2Factor: number;      // kg CO2 per kg fuel
  noxFactor: number;      // g NOx per kWh
  soxFactor: number;      // g SOx per kg fuel (based on sulfur content)
  costPerGallon: number;  // USD per gallon
}

export const FUEL_SPECIFICATIONS: Record<FuelType, FuelSpecification> = {
  ULSD: {
    type: 'ULSD',
    sulfurContent: 0.0015,
    density: 845,
    viscosity: 3.5,
    flashPoint: 52,
    co2Factor: 3.206,
    noxFactor: 13.2,
    soxFactor: 0.03,
    costPerGallon: 3.85,
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
    costPerGallon: 4.20,
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
    costPerGallon: 3.50,
  },
  BIODIESEL: {
    type: 'BIODIESEL',
    sulfurContent: 0.0,
    density: 880,
    viscosity: 4.5,
    flashPoint: 100,
    co2Factor: 0.5,
    noxFactor: 12.0,
    soxFactor: 0.0,
    costPerGallon: 4.50,
  },
  DIESEL_ELECTRIC: {
    type: 'DIESEL_ELECTRIC',
    sulfurContent: 0.0015,
    density: 845,
    viscosity: 3.5,
    flashPoint: 52,
    co2Factor: 2.4,    // Lower due to electric efficiency
    noxFactor: 9.0,
    soxFactor: 0.02,
    costPerGallon: 3.85,
  },
};

// ============================================================================
// REGULATORY COMPLIANCE
// ============================================================================

export type RegulationType =
  | 'USCG_COI'            // USCG Certificate of Inspection
  | 'USCG_SUBCHAPTER_H'   // USCG Subchapter H (Passenger Vessels)
  | 'USCG_SUBCHAPTER_K'   // USCG Subchapter K (Small Passenger Vessels)
  | 'SOLAS'               // Safety of Life at Sea
  | 'ADA_COMPLIANCE'      // Americans with Disabilities Act
  | 'EPA_TIER_4'          // EPA Tier 4 engine emissions
  | 'WA_DOE'              // Washington Dept of Ecology
  | 'WSDOT_SAFETY'        // WSDOT ferry safety standards
  | 'ABS_CLASS'           // American Bureau of Shipping classification
  | 'ISM_CODE'            // International Safety Management
  | 'MARPOL_ANNEX_VI';    // Air pollution prevention

export type ComplianceStatus = 'compliant' | 'warning' | 'non_compliant' | 'pending_inspection';

export interface ComplianceRecord {
  regulation: RegulationType;
  status: ComplianceStatus;
  lastInspection: Date;
  nextInspection: Date;
  certificateExpiry: Date;
  notes?: string;
}

export interface EmissionLimits {
  zone: 'PUGET_SOUND' | 'WA_COASTAL' | 'US_ECA';
  maxSulfurPercent: number;
  maxNoxTier: 1 | 2 | 3 | 4;
  description: string;
}

export const EMISSION_ZONES: Record<string, EmissionLimits> = {
  PUGET_SOUND: {
    zone: 'PUGET_SOUND',
    maxSulfurPercent: 0.0015,
    maxNoxTier: 4,
    description: 'Puget Sound - EPA Tier 4 / ULSD required',
  },
  WA_COASTAL: {
    zone: 'WA_COASTAL',
    maxSulfurPercent: 0.1,
    maxNoxTier: 3,
    description: 'Washington coastal waters - US ECA standards',
  },
  US_ECA: {
    zone: 'US_ECA',
    maxSulfurPercent: 0.1,
    maxNoxTier: 3,
    description: 'US Emission Control Area - 200nm from coast',
  },
};

// ============================================================================
// PREDICTIVE MAINTENANCE (PdM) MODELS - Ferry Specific
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
  | 'propeller_fouling'
  // Hull & structure
  | 'hull_fouling'
  | 'corrosion'
  | 'fatigue_cracking'
  // Ferry-specific: Hydraulic ramp systems
  | 'ramp_cylinder_seal'
  | 'ramp_hinge_wear'
  | 'ramp_chain_elongation'
  // Ferry-specific: Passenger systems
  | 'hvac_compressor_decline'
  | 'fire_detection_fault'
  // Electrical
  | 'generator_winding'
  | 'avr_failure'
  | 'auto_start_failure'
  | 'switchboard_failure'
  // Navigation
  | 'radar_magnetron'
  | 'gps_antenna_degradation'
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
    applicableEquipment: ['engine', 'propulsion', 'hydraulics'],
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
    applicableEquipment: ['propulsion'],
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
    applicableEquipment: ['propulsion', 'hydraulics'],
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
    applicableEquipment: ['propulsion'],
    mtbf: 20000,
    degradationRate: 0.35,
    warningThreshold: 60,
    criticalThreshold: 30,
    leadTime: 21,
    costOfFailure: 250000,
    plannedMaintenanceCost: 50000,
    sensorIndicators: ['vibration', 'oil_analysis', 'temperature'],
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
  hull_fouling: {
    mode: 'hull_fouling',
    applicableEquipment: ['hull'],
    mtbf: 4000,
    degradationRate: 1.5,
    warningThreshold: 80,
    criticalThreshold: 50,
    leadTime: 30,
    costOfFailure: 50000,
    plannedMaintenanceCost: 15000,
    sensorIndicators: ['fuel_consumption', 'speed_loss', 'visual_inspection'],
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
    applicableEquipment: ['structure', 'hull', 'ramp'],
    mtbf: 40000,
    degradationRate: 0.18,
    warningThreshold: 55,
    criticalThreshold: 25,
    leadTime: 45,
    costOfFailure: 750000,
    plannedMaintenanceCost: 150000,
    sensorIndicators: ['strain_gauge', 'ultrasonic', 'visual_inspection'],
  },
  // Ferry-specific: Vehicle loading ramp systems
  ramp_cylinder_seal: {
    mode: 'ramp_cylinder_seal',
    applicableEquipment: ['hydraulics', 'ramp'],
    mtbf: 5000,
    degradationRate: 1.2,
    warningThreshold: 65,
    criticalThreshold: 35,
    leadTime: 7,
    costOfFailure: 45000,
    plannedMaintenanceCost: 8000,
    sensorIndicators: ['oil_seepage', 'ramp_drift', 'cycle_time'],
  },
  ramp_hinge_wear: {
    mode: 'ramp_hinge_wear',
    applicableEquipment: ['ramp', 'structure'],
    mtbf: 8000,
    degradationRate: 0.8,
    warningThreshold: 60,
    criticalThreshold: 30,
    leadTime: 14,
    costOfFailure: 65000,
    plannedMaintenanceCost: 15000,
    sensorIndicators: ['vibration', 'alignment', 'noise'],
  },
  ramp_chain_elongation: {
    mode: 'ramp_chain_elongation',
    applicableEquipment: ['ramp'],
    mtbf: 6000,
    degradationRate: 1.0,
    warningThreshold: 70,
    criticalThreshold: 40,
    leadTime: 10,
    costOfFailure: 35000,
    plannedMaintenanceCost: 6000,
    sensorIndicators: ['chain_tension', 'chain_measurement', 'sprocket_wear'],
  },
  // Ferry-specific: Passenger comfort systems
  hvac_compressor_decline: {
    mode: 'hvac_compressor_decline',
    applicableEquipment: ['hvac', 'electrical'],
    mtbf: 8000,
    degradationRate: 0.8,
    warningThreshold: 70,
    criticalThreshold: 40,
    leadTime: 14,
    costOfFailure: 20000,
    plannedMaintenanceCost: 4000,
    sensorIndicators: ['current_draw', 'cycle_time', 'refrigerant_level'],
  },
  fire_detection_fault: {
    mode: 'fire_detection_fault',
    applicableEquipment: ['safety_systems'],
    mtbf: 25000,
    degradationRate: 0.3,
    warningThreshold: 80,
    criticalThreshold: 50,
    leadTime: 30,
    costOfFailure: 10000,
    plannedMaintenanceCost: 1500,
    sensorIndicators: ['false_alarm_rate', 'detector_sensitivity', 'circuit_test'],
  },
  // Electrical systems
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
  avr_failure: {
    mode: 'avr_failure',
    applicableEquipment: ['electrical'],
    mtbf: 10000,
    degradationRate: 0.7,
    warningThreshold: 65,
    criticalThreshold: 35,
    leadTime: 10,
    costOfFailure: 30000,
    plannedMaintenanceCost: 5000,
    sensorIndicators: ['voltage_stability', 'power_quality', 'load_balance'],
  },
  auto_start_failure: {
    mode: 'auto_start_failure',
    applicableEquipment: ['electrical', 'safety_systems'],
    mtbf: 15000,
    degradationRate: 0.5,
    warningThreshold: 70,
    criticalThreshold: 40,
    leadTime: 7,
    costOfFailure: 25000,
    plannedMaintenanceCost: 3000,
    sensorIndicators: ['battery_voltage', 'crank_speed', 'fuel_pressure'],
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
  // Navigation
  radar_magnetron: {
    mode: 'radar_magnetron',
    applicableEquipment: ['navigation'],
    mtbf: 12000,
    degradationRate: 0.6,
    warningThreshold: 65,
    criticalThreshold: 35,
    leadTime: 14,
    costOfFailure: 15000,
    plannedMaintenanceCost: 5000,
    sensorIndicators: ['radar_range', 'signal_strength', 'magnetron_current'],
  },
  gps_antenna_degradation: {
    mode: 'gps_antenna_degradation',
    applicableEquipment: ['navigation'],
    mtbf: 20000,
    degradationRate: 0.35,
    warningThreshold: 70,
    criticalThreshold: 40,
    leadTime: 21,
    costOfFailure: 8000,
    plannedMaintenanceCost: 2000,
    sensorIndicators: ['signal_to_noise', 'position_accuracy', 'fix_quality'],
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
// WSDOT FERRY FLEET PROFILE (for detailed PdM)
// ============================================================================

export type WSDOTFerryClass =
  | 'jumbo_mark_ii'
  | 'jumbo'
  | 'super'
  | 'issaquah_130'
  | 'olympic'
  | 'evergreen_state';

export interface WSDOTFerryProfile {
  name: string;
  class: WSDOTFerryClass;
  yearBuilt: number;
  yearRebuilt?: number;
  lengthOverall: number;  // meters
  beam: number;           // meters
  displacement: number;   // metric tons
  passengerCapacity: number;
  vehicleCapacity: number;
  mainEngines: { type: string; power: number; count: number }; // kW
  fuelCapacity: number;   // gallons
  primaryFuel: FuelType;
  crewCapacity: number;
  route?: string;
  specificEquipment: string[];
  pdmFocus: FailureMode[];
}

export const WSDOT_FERRY_PROFILES: WSDOTFerryProfile[] = [
  {
    name: 'M/V Puyallup',
    class: 'jumbo_mark_ii',
    yearBuilt: 1999,
    lengthOverall: 140,
    beam: 27,
    displacement: 5950,
    passengerCapacity: 2500,
    vehicleCapacity: 202,
    mainEngines: { type: 'EMD 16-710G7C', power: 4850, count: 4 },
    fuelCapacity: 50000,
    primaryFuel: 'DIESEL_ELECTRIC',
    crewCapacity: 18,
    route: 'Seattle - Bainbridge Island',
    specificEquipment: ['bow_ramp', 'stern_ramp', 'passenger_elevator', 'vehicle_deck_ventilation'],
    pdmFocus: ['ramp_cylinder_seal', 'generator_winding', 'hvac_compressor_decline', 'hull_fouling'],
  },
  {
    name: 'M/V Tacoma',
    class: 'jumbo_mark_ii',
    yearBuilt: 1997,
    lengthOverall: 140,
    beam: 27,
    displacement: 5950,
    passengerCapacity: 2500,
    vehicleCapacity: 202,
    mainEngines: { type: 'EMD 16-710G7C', power: 4850, count: 4 },
    fuelCapacity: 50000,
    primaryFuel: 'DIESEL_ELECTRIC',
    crewCapacity: 18,
    route: 'Seattle - Bainbridge Island',
    specificEquipment: ['bow_ramp', 'stern_ramp', 'passenger_elevator', 'galley_systems'],
    pdmFocus: ['ramp_hinge_wear', 'avr_failure', 'bearing_wear', 'propeller_fouling'],
  },
  {
    name: 'M/V Wenatchee',
    class: 'jumbo_mark_ii',
    yearBuilt: 1998,
    lengthOverall: 140,
    beam: 27,
    displacement: 5950,
    passengerCapacity: 2500,
    vehicleCapacity: 202,
    mainEngines: { type: 'EMD 16-710G7C', power: 4850, count: 4 },
    fuelCapacity: 50000,
    primaryFuel: 'DIESEL_ELECTRIC',
    crewCapacity: 18,
    route: 'Seattle - Bremerton',
    specificEquipment: ['bow_ramp', 'stern_ramp', 'elevator', 'fire_suppression'],
    pdmFocus: ['cooling_system_failure', 'ramp_chain_elongation', 'shaft_misalignment', 'fire_detection_fault'],
  },
  {
    name: 'M/V Spokane',
    class: 'jumbo',
    yearBuilt: 1972,
    yearRebuilt: 2004,
    lengthOverall: 134,
    beam: 24,
    displacement: 5000,
    passengerCapacity: 2000,
    vehicleCapacity: 188,
    mainEngines: { type: 'EMD 16-645E7B', power: 3730, count: 4 },
    fuelCapacity: 42000,
    primaryFuel: 'ULSD',
    crewCapacity: 16,
    route: 'Edmonds - Kingston',
    specificEquipment: ['bow_ramp', 'stern_ramp', 'vehicle_deck_fire_system'],
    pdmFocus: ['fatigue_cracking', 'lube_oil_degradation', 'ramp_cylinder_seal', 'corrosion'],
  },
  {
    name: 'M/V Chetzemoka',
    class: 'olympic',
    yearBuilt: 2010,
    lengthOverall: 84,
    beam: 19,
    displacement: 1820,
    passengerCapacity: 750,
    vehicleCapacity: 64,
    mainEngines: { type: 'Cummins QSK60', power: 1864, count: 2 },
    fuelCapacity: 18000,
    primaryFuel: 'DIESEL_ELECTRIC',
    crewCapacity: 10,
    route: 'Coupeville - Port Townsend',
    specificEquipment: ['bow_ramp', 'stern_ramp', 'emission_controls'],
    pdmFocus: ['fuel_injector_fouling', 'auto_start_failure', 'gps_antenna_degradation', 'seal_leakage'],
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
