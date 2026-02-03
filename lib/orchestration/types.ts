// Fleet Orchestration Types

export interface Project {
  id: string;
  name: string;
  client: string;
  type: 'construction' | 'decommissioning' | 'installation' | 'maintenance' | 'dredging' | 'survey';
  status: 'planning' | 'active' | 'delayed' | 'completed' | 'on-hold';
  priority: 'critical' | 'high' | 'medium' | 'low';
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  schedule: {
    startDate: Date;
    endDate: Date;
    weatherWindow?: { start: Date; end: Date };
  };
  requirements: {
    vesselTypes: string[];
    crewCount: number;
    equipment: string[];
  };
  assignedVessels: string[];
  progress: number; // 0-100
  budget: {
    allocated: number;
    spent: number;
    currency: string;
  };
}

export interface VesselAssignment {
  id: string;
  vesselId: string;
  vesselName: string;
  projectId: string;
  projectName: string;
  startDate: Date;
  endDate: Date;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  utilization: number; // 0-100
}

export interface ScheduleConflict {
  id: string;
  type: 'vessel_double_booking' | 'crew_shortage' | 'equipment_unavailable' | 'weather_risk' | 'equipment_risk';
  severity: 'critical' | 'warning' | 'info';
  affectedVessels: string[];
  affectedProjects: string[];
  description: string;
  suggestedResolution: string;
}

export interface OptimizationResult {
  id: string;
  originalSchedule: VesselAssignment[];
  optimizedSchedule: VesselAssignment[];
  improvements: {
    utilizationGain: number;
    costSavings: number;
    fuelSavings: number;
    timeReduction: number;
  };
  conflicts: ScheduleConflict[];
  confidence: number;
}

export interface ScenarioSimulation {
  id: string;
  name: string;
  type: 'vessel_breakdown' | 'weather_delay' | 'new_project' | 'resource_change';
  parameters: Record<string, unknown>;
  result: {
    affectedProjects: Array<{
      projectId: string;
      projectName: string;
      delayDays: number;
      costImpact: number;
    }>;
    suggestedActions: string[];
    alternativeVessels: Array<{
      vesselId: string;
      vesselName: string;
      availability: string;
      suitability: number;
    }>;
  };
}

export interface FleetMetrics {
  totalVessels: number;
  activeVessels: number;
  utilization: number;
  activeProjects: number;
  completedProjects: number;
  upcomingMaintenance: number;
  conflictCount: number;
  revenuePerDay: number;
}











