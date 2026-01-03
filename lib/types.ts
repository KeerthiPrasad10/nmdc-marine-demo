// Core vessel types
export type VesselType = 'tugboat' | 'supply_vessel' | 'crane_barge' | 'dredger' | 'survey_vessel';
export type VesselStatus = 'operational' | 'maintenance' | 'idle' | 'alert';
export type AlertType = 'weather' | 'equipment' | 'fuel' | 'safety';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type MitigationPriority = 'immediate' | 'high' | 'medium' | 'low';
export type EquipmentType = 'engine' | 'hydraulics' | 'electrical' | 'navigation' | 'crane' | 'propulsion';

export interface Position {
  lat: number;
  lng: number;
}

export interface Emissions {
  co2: number;  // kg/hour
  nox: number;  // kg/hour
  sox: number;  // kg/hour
}

export interface CrewStatus {
  count: number;
  hoursOnDuty: number;
  safetyScore: number;  // 0-100
}

export interface EquipmentStatus {
  id: string;
  type: EquipmentType;
  name: string;
  healthScore: number;  // 0-100
  temperature: number;  // Celsius
  vibration: number;    // mm/s
  hoursOperated: number;
  lastMaintenance: Date;
  predictedFailure: Date | null;
  failureConfidence: number;  // 0-100
}

export interface Vessel {
  id: string;
  name: string;
  type: VesselType;
  mmsi?: string;      // Maritime Mobile Service Identity (for AIS)
  imo?: string;       // IMO vessel number
  position: Position;
  heading: number;    // degrees
  speed: number;      // knots
  status: VesselStatus;
  healthScore: number;
  fuelLevel: number;  // percentage
  fuelConsumption: number;  // liters/hour
  emissions: Emissions;
  crew: CrewStatus;
  equipment: EquipmentStatus[];
  project: string;
  destination: Position | null;
  lastUpdate: Date;
}

export interface WeatherCondition {
  windSpeed: number;      // knots
  windDirection: number;  // degrees
  waveHeight: number;     // meters
  visibility: number;     // nautical miles
  temperature: number;    // Celsius
  condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog';
  severity: 'normal' | 'advisory' | 'warning' | 'severe';
}

export interface Mitigation {
  id: string;
  action: string;
  priority: MitigationPriority;
  estimatedImpact: string;
  businessValue: string;
  timeToImplement: string;
  costEstimate: string;
}

export interface Alert {
  id: string;
  vesselId: string;
  vesselName: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  mitigations: Mitigation[];
}

export interface MaintenancePrediction {
  id: string;
  vesselId: string;
  vesselName: string;
  equipment: EquipmentStatus;
  predictedIssue: string;
  probability: number;
  daysUntilFailure: number;
  recommendedAction: string;
  priority: MitigationPriority;
  estimatedDowntime: string;
  estimatedCost: string;
}

export interface FleetMetrics {
  totalVessels: number;
  operationalVessels: number;
  maintenanceVessels: number;
  alertVessels: number;
  averageHealthScore: number;
  averageFuelLevel: number;
  totalEmissions: Emissions;
  activeAlerts: number;
  criticalAlerts: number;
  upcomingMaintenance: number;
}

export interface SimulationState {
  vessels: Map<string, Vessel>;
  alerts: Alert[];
  weather: WeatherCondition;
  lastUpdate: Date;
  simulationSpeed: number;  // 1 = real-time, higher = faster
}

export interface StreamEvent {
  type: 'vessel_update' | 'alert' | 'weather' | 'maintenance' | 'metrics';
  data: Vessel | Alert | WeatherCondition | MaintenancePrediction | FleetMetrics;
  timestamp: Date;
}

