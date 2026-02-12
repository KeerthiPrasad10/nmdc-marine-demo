// Transformer IoT Types and Interfaces

export interface TransformerSensor {
  id: string;
  name: string;
  type: 'dga' | 'thermal' | 'load' | 'oil' | 'electrical' | 'environmental';
  unit: string;
  value: number;
  minValue: number;
  maxValue: number;
  normalRange: { min: number; max: number };
  status: 'normal' | 'warning' | 'critical';
  lastUpdated: Date;
}

export interface DGAReading {
  timestamp: Date;
  h2: number;
  ch4: number;
  c2h2: number;
  c2h4: number;
  c2h6: number;
  co: number;
  co2: number;
  tdcg: number;
  interpretation: string; // Duval Triangle / Rogers Ratio diagnosis
  faultType: 'normal' | 'thermal_low' | 'thermal_high' | 'electrical_low' | 'electrical_high' | 'partial_discharge' | 'arcing';
}

export interface ThermalProfile {
  topOilTemp: number;
  bottomOilTemp: number;
  windingHotSpot: number;
  ambientTemp: number;
  loadFactor: number; // 0-1
  coolingMode: 'ONAN' | 'ONAF' | 'OFAF' | 'ODAF';
  fansRunning: number;
  pumpsRunning: number;
}

export interface LoadEvent {
  id: string;
  timestamp: Date;
  endTime?: Date;
  duration: number; // seconds
  loadMVA: number;
  loadPercent: number;
  eventType: 'normal' | 'peak' | 'overload' | 'switching' | 'fault_clearing';
  topOilTemp: number;
  hotSpotTemp: number;
  description: string;
  dgaChange?: {
    gasName: string;
    before: number;
    after: number;
    changePercent: number;
  };
  warnings: string[];
}

export interface AlarmEvent {
  id: string;
  type: 'dga_alarm' | 'thermal_alarm' | 'electrical_fault' | 'oil_alarm' | 'bushing_alarm' | 'tap_changer' | 'cooling_failure';
  severity: 'info' | 'warning' | 'alarm' | 'trip';
  description: string;
  timestamp: Date;
  parameter?: string;
  value?: number;
  threshold?: number;
  resolved: boolean;
  aiRecommendation?: string;
  relatedLoadEventId?: string;
}

export interface TransformerMetrics {
  loadFactor: number; // current load as % of nameplate
  peakLoadToday: number; // MVA
  avgLoadToday: number; // MVA
  nameplateRating: number; // MVA
  topOilTemp: number; // °C
  hotSpotTemp: number; // °C
  oilLevel: number; // % of normal
  moisture: number; // ppm
  tdcg: number; // Total Dissolved Combustible Gas
  healthIndex: number; // 0-100
  dgaScore: number; // 0-100 (100 = healthy)
  operatingHours: number;
  lastDGASample: Date;
  tapPosition: number;
}

export interface TransformerAsset {
  id: string;
  name: string;
  manufacturer: string;
  rating: string; // e.g. "230/115kV, 200MVA"
  yearInstalled: number;
  location: string;
  opCo: string;
  assetTag: string;
  status: 'energized' | 'de-energized' | 'maintenance' | 'faulted';
  sensors: TransformerSensor[];
  metrics: TransformerMetrics;
  thermal: ThermalProfile;
  latestDGA: DGAReading;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

export interface TransformerIoTDashboardData {
  transformer: TransformerAsset;
  recentLoadEvents: LoadEvent[];
  alarmEvents: AlarmEvent[];
  dgaHistory: DGAReading[];
}

