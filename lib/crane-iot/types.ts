// Crane IoT Types and Interfaces

export interface CraneSensor {
  id: string;
  name: string;
  type: 'load' | 'vibration' | 'angle' | 'speed' | 'proximity' | 'gps' | 'accelerometer';
  unit: string;
  value: number;
  minValue: number;
  maxValue: number;
  normalRange: { min: number; max: number };
  status: 'normal' | 'warning' | 'critical';
  lastUpdated: Date;
}

export interface SafetyScoreBreakdown {
  loadControl: number;      // Load swing, stability (0-100)
  speedCompliance: number;  // Hoist/swing speed within limits (0-100)
  zoneSafety: number;       // Exclusion zone compliance (0-100)
  riggingQuality: number;   // Tagline, sling condition (0-100)
  communication: number;    // Operator-spotter coordination (0-100)
}

export interface LiftCycle {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  loadWeight: number; // kg
  itemClassification: string;
  pickupLocation: { x: number; y: number; z: number };
  dropLocation: { x: number; y: number; z: number };
  pickupZone: string;  // Human-readable zone name
  dropZone: string;    // Human-readable zone name
  operatorId: string;
  status: 'in_progress' | 'completed' | 'aborted';
  safetyScore: number;
  safetyBreakdown: SafetyScoreBreakdown;  // Detailed breakdown
  aiConfidence: number;
  warnings: string[];
}

export interface MaterialItem {
  id: string;
  classification: string;
  category: 'steel' | 'concrete' | 'pipe' | 'equipment' | 'container' | 'aggregate' | 'other';
  weight: number; // kg
  dimensions?: { length: number; width: number; height: number };
  color?: string;
  detectedAt: Date;
  confidence: number;
  imageUrl?: string;
}

export interface CraneMetrics {
  utilizationRate: number; // percentage
  totalLifts: number;
  completedLifts: number;
  avgCycleTime: number; // seconds
  avgLoadWeight: number; // kg
  totalTonnage: number; // tons moved
  productionRate: number; // lifts per hour
  efficiency: number; // percentage
  idleTime: number; // minutes
  operatingHours: number;
  fuelConsumption?: number;
}

export interface SafetyEvent {
  id: string;
  type: 'near_miss' | 'unsafe_behavior' | 'zone_violation' | 'overload' | 'speed_violation' | 'fatigue_warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  location?: { x: number; y: number };
  workerId?: string;
  resolved: boolean;
  aiRecommendation?: string;
  imageUrl?: string;
  // Link to specific lift cycle
  liftId?: string;
  liftDetails?: {
    itemClassification: string;
    loadWeight: number;
    pickupZone: string;
    dropZone: string;
  };
}

export interface CameraFeed {
  id: string;
  name: string;
  location: string;
  streamUrl?: string;
  thumbnailUrl?: string;
  isActive: boolean;
  resolution: string;
  aiEnabled: boolean;
  detections: number;
  lastDetection?: Date;
}

export interface CraneOperator {
  id: string;
  name: string;
  certificationLevel: 'junior' | 'senior' | 'master';
  totalLifts: number;
  safetyScore: number;
  avgEfficiency: number;
  hoursOnDuty: number;
  isFatigued: boolean;
}

export interface AIInsight {
  id: string;
  type: 'optimization' | 'safety' | 'maintenance' | 'scheduling' | 'productivity';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  potentialSavings?: number;
  potentialTimeGain?: number; // hours
  confidence: number;
  timestamp: Date;
  actionable: boolean;
}

export interface CraneAsset {
  id: string;
  name: string;
  model: string;
  capacity: number; // tons
  location: string;
  project: string;
  vessel?: {
    mmsi: string;
    name: string;
    type: string;
  };
  status: 'operational' | 'maintenance' | 'idle' | 'offline';
  sensors: CraneSensor[];
  cameras: CameraFeed[];
  metrics: CraneMetrics;
  operator?: CraneOperator;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

export interface ProductionTarget {
  daily: number;
  weekly: number;
  monthly: number;
  currentDaily: number;
  currentWeekly: number;
  currentMonthly: number;
}

export interface CraneDashboardData {
  crane: CraneAsset;
  recentLifts: LiftCycle[];
  recentItems: MaterialItem[];
  safetyEvents: SafetyEvent[];
  aiInsights: AIInsight[];
  productionTarget: ProductionTarget;
}


