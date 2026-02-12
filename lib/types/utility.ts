export type FailureMode =
  | 'winding_insulation_degradation'
  | 'bushing_failure'
  | 'tap_changer_wear'
  | 'oil_degradation'
  | 'cooling_fan_failure'
  | 'partial_discharge'
  | 'dga_thermal_fault'
  | 'dga_electrical_fault'
  | 'dga_arcing'
  | 'moisture_ingress'
  | 'corrosive_sulfur'
  | 'overload_aging'
  | 'lightning_damage'
  | 'gasket_leak'
  | 'ct_saturation'
  | 'breaker_trip_coil_failure'
  | 'sf6_leak'
  | 'relay_misoperation'

export interface FailureModeProfile {
  mode: FailureMode
  applicableComponents: string[]
  mtbf: number
  degradationRate: number
  warningThreshold: number
  criticalThreshold: number
  leadTime: number
  costOfFailure: number
  plannedMaintenanceCost: number
  sensorIndicators: string[]
  customersImpacted: number
}

export const FAILURE_MODE_PROFILES: Record<FailureMode, FailureModeProfile> = {
  winding_insulation_degradation: {
    mode: 'winding_insulation_degradation',
    applicableComponents: ['winding', 'oil_system'],
    mtbf: 175000,
    degradationRate: 0.03,
    warningThreshold: 60,
    criticalThreshold: 30,
    leadTime: 180,
    costOfFailure: 5000000,
    plannedMaintenanceCost: 250000,
    sensorIndicators: ['dga_co', 'dga_co2', 'oil_moisture', 'power_factor', 'furan_analysis'],
    customersImpacted: 25000,
  },
  bushing_failure: {
    mode: 'bushing_failure',
    applicableComponents: ['bushing'],
    mtbf: 200000,
    degradationRate: 0.02,
    warningThreshold: 55,
    criticalThreshold: 25,
    leadTime: 90,
    costOfFailure: 3000000,
    plannedMaintenanceCost: 150000,
    sensorIndicators: ['bushing_capacitance', 'power_factor', 'partial_discharge', 'thermal_image'],
    customersImpacted: 25000,
  },
  tap_changer_wear: {
    mode: 'tap_changer_wear',
    applicableComponents: ['tap_changer'],
    mtbf: 80000,
    degradationRate: 0.08,
    warningThreshold: 65,
    criticalThreshold: 35,
    leadTime: 60,
    costOfFailure: 800000,
    plannedMaintenanceCost: 120000,
    sensorIndicators: ['tap_changer_ops_count', 'contact_resistance', 'oil_dga', 'motor_current'],
    customersImpacted: 25000,
  },
  oil_degradation: {
    mode: 'oil_degradation',
    applicableComponents: ['oil_system', 'winding'],
    mtbf: 50000,
    degradationRate: 0.12,
    warningThreshold: 70,
    criticalThreshold: 40,
    leadTime: 30,
    costOfFailure: 400000,
    plannedMaintenanceCost: 50000,
    sensorIndicators: ['oil_moisture', 'oil_acidity', 'dielectric_strength', 'color', 'interfacial_tension'],
    customersImpacted: 25000,
  },
  cooling_fan_failure: {
    mode: 'cooling_fan_failure',
    applicableComponents: ['cooling_system'],
    mtbf: 30000,
    degradationRate: 0.2,
    warningThreshold: 70,
    criticalThreshold: 40,
    leadTime: 14,
    costOfFailure: 150000,
    plannedMaintenanceCost: 15000,
    sensorIndicators: ['fan_motor_current', 'vibration', 'temperature_rise', 'oil_temperature'],
    customersImpacted: 25000,
  },
  partial_discharge: {
    mode: 'partial_discharge',
    applicableComponents: ['winding', 'bushing'],
    mtbf: 150000,
    degradationRate: 0.04,
    warningThreshold: 55,
    criticalThreshold: 25,
    leadTime: 120,
    costOfFailure: 4000000,
    plannedMaintenanceCost: 300000,
    sensorIndicators: ['pd_sensor', 'uhf_sensor', 'acoustic_emission', 'dga_h2', 'dga_c2h2'],
    customersImpacted: 25000,
  },
  dga_thermal_fault: {
    mode: 'dga_thermal_fault',
    applicableComponents: ['winding', 'tap_changer', 'oil_system'],
    mtbf: 100000,
    degradationRate: 0.06,
    warningThreshold: 60,
    criticalThreshold: 30,
    leadTime: 90,
    costOfFailure: 2500000,
    plannedMaintenanceCost: 200000,
    sensorIndicators: ['dga_c2h4', 'dga_c2h6', 'dga_ch4', 'hot_spot_temperature'],
    customersImpacted: 25000,
  },
  dga_electrical_fault: {
    mode: 'dga_electrical_fault',
    applicableComponents: ['winding', 'bushing'],
    mtbf: 120000,
    degradationRate: 0.05,
    warningThreshold: 55,
    criticalThreshold: 25,
    leadTime: 60,
    costOfFailure: 4500000,
    plannedMaintenanceCost: 350000,
    sensorIndicators: ['dga_h2', 'dga_c2h2', 'partial_discharge', 'power_factor'],
    customersImpacted: 25000,
  },
  dga_arcing: {
    mode: 'dga_arcing',
    applicableComponents: ['winding', 'tap_changer'],
    mtbf: 180000,
    degradationRate: 0.03,
    warningThreshold: 50,
    criticalThreshold: 20,
    leadTime: 30,
    costOfFailure: 6000000,
    plannedMaintenanceCost: 500000,
    sensorIndicators: ['dga_c2h2', 'dga_h2', 'trip_history', 'fault_current'],
    customersImpacted: 25000,
  },
  moisture_ingress: {
    mode: 'moisture_ingress',
    applicableComponents: ['oil_system', 'winding', 'bushing'],
    mtbf: 60000,
    degradationRate: 0.1,
    warningThreshold: 65,
    criticalThreshold: 35,
    leadTime: 45,
    costOfFailure: 1200000,
    plannedMaintenanceCost: 80000,
    sensorIndicators: ['oil_moisture', 'dielectric_strength', 'power_factor', 'gasket_inspection'],
    customersImpacted: 25000,
  },
  corrosive_sulfur: {
    mode: 'corrosive_sulfur',
    applicableComponents: ['oil_system', 'winding'],
    mtbf: 90000,
    degradationRate: 0.07,
    warningThreshold: 60,
    criticalThreshold: 30,
    leadTime: 120,
    costOfFailure: 3500000,
    plannedMaintenanceCost: 200000,
    sensorIndicators: ['oil_sulfur_content', 'copper_strip_test', 'dga_trends'],
    customersImpacted: 25000,
  },
  overload_aging: {
    mode: 'overload_aging',
    applicableComponents: ['winding', 'oil_system', 'cooling_system'],
    mtbf: 40000,
    degradationRate: 0.15,
    warningThreshold: 70,
    criticalThreshold: 40,
    leadTime: 60,
    costOfFailure: 2000000,
    plannedMaintenanceCost: 100000,
    sensorIndicators: ['load_current', 'hot_spot_temperature', 'top_oil_temperature', 'furan_analysis'],
    customersImpacted: 25000,
  },
  lightning_damage: {
    mode: 'lightning_damage',
    applicableComponents: ['bushing', 'surge_arrester', 'winding'],
    mtbf: 250000,
    degradationRate: 0.02,
    warningThreshold: 50,
    criticalThreshold: 20,
    leadTime: 7,
    costOfFailure: 3000000,
    plannedMaintenanceCost: 100000,
    sensorIndicators: ['surge_counter', 'arrester_leakage_current', 'bushing_power_factor'],
    customersImpacted: 25000,
  },
  gasket_leak: {
    mode: 'gasket_leak',
    applicableComponents: ['oil_system'],
    mtbf: 35000,
    degradationRate: 0.18,
    warningThreshold: 75,
    criticalThreshold: 45,
    leadTime: 21,
    costOfFailure: 200000,
    plannedMaintenanceCost: 25000,
    sensorIndicators: ['oil_level', 'visual_inspection', 'pressure_gauge'],
    customersImpacted: 5000,
  },
  ct_saturation: {
    mode: 'ct_saturation',
    applicableComponents: ['current_transformer'],
    mtbf: 100000,
    degradationRate: 0.06,
    warningThreshold: 60,
    criticalThreshold: 30,
    leadTime: 30,
    costOfFailure: 500000,
    plannedMaintenanceCost: 75000,
    sensorIndicators: ['ct_ratio_test', 'burden_measurement', 'excitation_curve'],
    customersImpacted: 15000,
  },
  breaker_trip_coil_failure: {
    mode: 'breaker_trip_coil_failure',
    applicableComponents: ['breaker'],
    mtbf: 50000,
    degradationRate: 0.12,
    warningThreshold: 65,
    criticalThreshold: 35,
    leadTime: 14,
    costOfFailure: 1500000,
    plannedMaintenanceCost: 50000,
    sensorIndicators: ['coil_resistance', 'trip_time', 'dc_voltage', 'contact_travel'],
    customersImpacted: 20000,
  },
  sf6_leak: {
    mode: 'sf6_leak',
    applicableComponents: ['breaker'],
    mtbf: 80000,
    degradationRate: 0.08,
    warningThreshold: 70,
    criticalThreshold: 40,
    leadTime: 30,
    costOfFailure: 600000,
    plannedMaintenanceCost: 80000,
    sensorIndicators: ['sf6_pressure', 'sf6_density', 'leak_detection', 'temperature_compensation'],
    customersImpacted: 20000,
  },
  relay_misoperation: {
    mode: 'relay_misoperation',
    applicableComponents: ['relay'],
    mtbf: 60000,
    degradationRate: 0.1,
    warningThreshold: 65,
    criticalThreshold: 35,
    leadTime: 14,
    costOfFailure: 800000,
    plannedMaintenanceCost: 30000,
    sensorIndicators: ['relay_event_log', 'settings_audit', 'trip_test', 'communication_status'],
    customersImpacted: 15000,
  },
}

export type ComplianceStandard =
  | 'IEEE_C57_104'
  | 'IEEE_C57_106'
  | 'IEEE_C57_125'
  | 'NERC_FAC_003'
  | 'NERC_TPL'
  | 'NESC'
  | 'OSHA_1910'
  | 'EPA_SF6'

export type ComplianceStatus = 'compliant' | 'warning' | 'non_compliant' | 'pending_inspection'

export interface ComplianceRecord {
  standard: ComplianceStandard
  status: ComplianceStatus
  lastAudit: Date
  nextAudit: Date
  notes?: string
}

export interface DGAReading {
  timestamp: Date
  h2: number
  ch4: number
  c2h2: number
  c2h4: number
  c2h6: number
  co: number
  co2: number
  o2: number
  n2: number
  tdcg: number
  moisture: number
  acidity: number
  dielectricStrength: number
}

export interface TransformerProfile {
  assetTag: string
  name: string
  manufacturer: string
  model: string
  serialNumber: string
  yearManufactured: number
  yearInstalled: number
  voltageClassKV: number
  ratedMVA: number
  coolingType: 'ONAN' | 'ONAF' | 'OFAF' | 'ODAF'
  oilVolumeLiters: number
  weight: number
  tapChangerType: 'OLTC' | 'DETC' | 'none'
  tapRange?: string
  bushingType: string
  opCo: string
  substationName: string
  circuitId: string
  customersDownstream: number
  criticality: 'critical' | 'major' | 'standard'
  failureModes: FailureMode[]
}

export interface ExelonOpCo {
  id: string
  name: string
  abbreviation: string
  serviceTerritory: string
  states: string[]
  customersElectric: number
  customersGas: number
  headquartersCity: string
  centerLat: number
  centerLng: number
}

export const EXELON_OPCOS: ExelonOpCo[] = [
  {
    id: 'comed',
    name: 'Commonwealth Edison',
    abbreviation: 'ComEd',
    serviceTerritory: 'Northern Illinois',
    states: ['IL'],
    customersElectric: 4000000,
    customersGas: 0,
    headquartersCity: 'Chicago',
    centerLat: 41.8781,
    centerLng: -87.6298,
  },
  {
    id: 'peco',
    name: 'PECO Energy Company',
    abbreviation: 'PECO',
    serviceTerritory: 'Southeastern Pennsylvania',
    states: ['PA'],
    customersElectric: 1600000,
    customersGas: 532000,
    headquartersCity: 'Philadelphia',
    centerLat: 39.9526,
    centerLng: -75.1652,
  },
  {
    id: 'bge',
    name: 'Baltimore Gas and Electric',
    abbreviation: 'BGE',
    serviceTerritory: 'Central Maryland',
    states: ['MD'],
    customersElectric: 1300000,
    customersGas: 700000,
    headquartersCity: 'Baltimore',
    centerLat: 39.2904,
    centerLng: -76.6122,
  },
  {
    id: 'pepco',
    name: 'Potomac Electric Power Company',
    abbreviation: 'Pepco',
    serviceTerritory: 'Washington D.C. and suburban Maryland',
    states: ['DC', 'MD'],
    customersElectric: 900000,
    customersGas: 0,
    headquartersCity: 'Washington',
    centerLat: 38.9072,
    centerLng: -77.0369,
  },
  {
    id: 'dpl',
    name: 'Delmarva Power & Light',
    abbreviation: 'DPL',
    serviceTerritory: 'Delaware and Eastern Shore of Maryland',
    states: ['DE', 'MD'],
    customersElectric: 561500,
    customersGas: 140000,
    headquartersCity: 'Wilmington',
    centerLat: 39.7391,
    centerLng: -75.5398,
  },
  {
    id: 'ace',
    name: 'Atlantic City Electric',
    abbreviation: 'ACE',
    serviceTerritory: 'Southern New Jersey',
    states: ['NJ'],
    customersElectric: 572000,
    customersGas: 0,
    headquartersCity: 'Atlantic City',
    centerLat: 39.3643,
    centerLng: -74.4229,
  },
]

export interface AssetLifecycleMetrics {
  assetId: string
  replacementCost: number
  currentBookValue: number
  annualDepreciation: number
  maintenanceCostYTD: number
  outageMinutesYTD: number
  utilizationRate: number
  availabilityRate: number
  mtbf: number
  mttr: number
  remainingUsefulLife: number
  riskScore: number
  ageYears: number
}

export interface MaintenanceSchedule {
  assetId: string
  componentId: string
  scheduledDate: Date
  maintenanceType: 'routine' | 'condition_based' | 'predictive' | 'corrective' | 'emergency'
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedDuration: number
  estimatedCost: number
  requiredParts: string[]
  requiredCertifications: string[]
  riskOfDeferral: string
  customersAtRisk: number
}

