import { Project, VesselAssignment, ScheduleConflict, FleetMetrics } from './types';
import { getVesselIssues, VESSEL_ISSUES } from '../vessel-issues';
import { WSDOT_FLEET } from '../wsdot/fleet';

// Helper to find WSDOT vessel by MMSI
function getWSDOTVesselByMMSI(mmsi: string) {
  return WSDOT_FLEET.find(v => v.mmsi === mmsi);
}

// Generate mock projects (routes/service areas for WSDOT ferries)
export function generateMockProjects(): Project[] {
  const now = new Date();
  
  return [
    {
      id: 'route-seattle-bainbridge',
      name: 'Seattle - Bainbridge Island Route',
      client: 'WSDOT',
      type: 'construction', // reuse type for route service
      status: 'active',
      priority: 'critical',
      location: { name: 'Puget Sound Central', lat: 47.62, lng: -122.50 },
      schedule: {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date(now.getFullYear(), 11, 31),
        weatherWindow: {
          start: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          end: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
        },
      },
      requirements: {
        vesselTypes: ['ferry'],
        crewCount: 50,
        equipment: ['Vehicle ramp', 'Passenger facilities'],
      },
      assignedVessels: ['366983000', '366982000', '366981000'], // Puyallup, Tacoma, Wenatchee
      progress: 75,
      budget: { allocated: 12000000, spent: 9000000, currency: 'USD' },
    },
    {
      id: 'route-mukilteo-clinton',
      name: 'Mukilteo - Clinton Route',
      client: 'WSDOT',
      type: 'construction',
      status: 'active',
      priority: 'high',
      location: { name: 'Whidbey Island Crossing', lat: 47.95, lng: -122.35 },
      schedule: {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date(now.getFullYear(), 11, 31),
      },
      requirements: {
        vesselTypes: ['ferry'],
        crewCount: 30,
        equipment: ['Vehicle ramp', 'Navigation systems'],
      },
      assignedVessels: ['366979000', '366978000'], // Tokitae, Chetzemoka
      progress: 68,
      budget: { allocated: 8000000, spent: 5440000, currency: 'USD' },
    },
    {
      id: 'route-anacortes-sji',
      name: 'Anacortes - San Juan Islands Route',
      client: 'WSDOT',
      type: 'construction',
      status: 'active',
      priority: 'high',
      location: { name: 'San Juan Islands', lat: 48.53, lng: -123.01 },
      schedule: {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date(now.getFullYear(), 11, 31),
      },
      requirements: {
        vesselTypes: ['ferry'],
        crewCount: 60,
        equipment: ['Vehicle ramp', 'Extended navigation'],
      },
      assignedVessels: ['366980000', '366977000'], // Samish, Chelan
      progress: 55,
      budget: { allocated: 15000000, spent: 8250000, currency: 'USD' },
    },
    {
      id: 'route-pt-defiance',
      name: 'Point Defiance - Tahlequah Route',
      client: 'WSDOT',
      type: 'construction',
      status: 'active',
      priority: 'medium',
      location: { name: 'South Sound', lat: 47.30, lng: -122.52 },
      schedule: {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date(now.getFullYear(), 11, 31),
      },
      requirements: {
        vesselTypes: ['ferry'],
        crewCount: 20,
        equipment: ['Vehicle ramp'],
      },
      assignedVessels: ['366976000'], // Steilacoom II (placeholder)
      progress: 80,
      budget: { allocated: 4000000, spent: 3200000, currency: 'USD' },
    },
  ];
}

// Generate vessel assignments for Gantt chart
export function generateMockAssignments(projects: Project[], vessels: Array<{ id: string; name: string }>): VesselAssignment[] {
  const assignments: VesselAssignment[] = [];
  const now = new Date();

  if (vessels.length === 0) return assignments;

  projects.forEach((project, projectIndex) => {
    const numVessels = project.priority === 'critical' ? 2 : 1;
    
    for (let i = 0; i < numVessels && i < vessels.length; i++) {
      const vesselIndex = (projectIndex * 2 + i) % vessels.length;
      const vessel = vessels[vesselIndex];
      
      assignments.push({
        id: `assign-${project.id}-${vessel.id}`,
        vesselId: vessel.id,
        vesselName: vessel.name,
        projectId: project.id,
        projectName: project.name,
        startDate: project.schedule.startDate,
        endDate: project.schedule.endDate,
        status: project.status === 'active' ? 'active' : 
                project.status === 'completed' ? 'completed' : 'scheduled',
        utilization: project.status === 'active' ? 75 + Math.random() * 20 : 
                     project.status === 'planning' ? 0 : 85,
      });
    }
  });

  // Add maintenance blocks DRIVEN by actual PM issues
  Object.entries(VESSEL_ISSUES).forEach(([mmsi, vesselIssues]) => {
    const vessel = vessels.find(v => v.id === mmsi);
    if (!vessel) return;
    
    const criticalIssue = vesselIssues.issues.find(i => i.pmPrediction.priority === 'critical');
    const highIssue = vesselIssues.issues.find(i => i.pmPrediction.priority === 'high');
    const mainIssue = criticalIssue || highIssue;
    
    if (mainIssue) {
      const daysUntilMaintenance = mainIssue.pmPrediction.priority === 'critical' ? 5 : 15;
      const maintenanceDuration = mainIssue.pmPrediction.priority === 'critical' ? 7 : 5;
      
      assignments.push({
        id: `maint-${mmsi}-${mainIssue.equipmentName.toLowerCase().replace(/\s+/g, '-')}`,
        vesselId: mmsi,
        vesselName: vessel.name,
        projectId: 'maintenance',
        projectName: `PM: ${mainIssue.equipmentName}`,
        startDate: new Date(now.getTime() + daysUntilMaintenance * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + (daysUntilMaintenance + maintenanceDuration) * 24 * 60 * 60 * 1000),
        status: 'scheduled',
        utilization: 0,
      });
    }
  });

  return assignments;
}

// Generate schedule conflicts - DRIVEN by actual PM issues
export function generateMockConflicts(): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  
  Object.entries(VESSEL_ISSUES).forEach(([mmsi, vesselIssues]) => {
    const vessel = getWSDOTVesselByMMSI(mmsi);
    if (!vessel) return;
    
    vesselIssues.issues.forEach((issue, index) => {
      if (issue.pmPrediction.priority === 'critical' || issue.pmPrediction.priority === 'high') {
        // Map vessel to route
        const routeMapping: Record<string, string> = {
          '366983000': 'route-seattle-bainbridge',
          '366982000': 'route-seattle-bainbridge',
          '366981000': 'route-seattle-bainbridge',
          '366979000': 'route-mukilteo-clinton',
          '366978000': 'route-mukilteo-clinton',
          '366980000': 'route-anacortes-sji',
          '366977000': 'route-anacortes-sji',
          '366976000': 'route-pt-defiance',
        };
        
        const routeId = routeMapping[mmsi] || 'route-seattle-bainbridge';
        
        conflicts.push({
          id: `conflict-${mmsi}-${index}`,
          type: 'equipment_risk',
          severity: issue.pmPrediction.priority === 'critical' ? 'critical' : 'warning',
          affectedVessels: [mmsi],
          affectedProjects: [routeId],
          description: `${vessel.name} ${issue.equipmentName} at ${issue.healthScore}% health - ${issue.pmPrediction.predictedIssue}`,
          suggestedResolution: issue.pmPrediction.recommendedAction,
        });
      }
    });
  });
  
  // Add weather risk conflict
  conflicts.push({
    id: 'conflict-weather-001',
    type: 'weather_risk',
    severity: 'warning',
    affectedVessels: ['366983000', '366982000', '366981000'],
    affectedProjects: ['route-seattle-bainbridge'],
    description: 'High wind advisory (35+ knots) forecasted for central Puget Sound in 3 days',
    suggestedResolution: 'Prepare contingency schedule and notify passengers of potential delays',
  });
  
  return conflicts.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (b.severity === 'critical' && a.severity !== 'critical') return 1;
    return 0;
  });
}

// Generate fleet metrics
export function generateFleetMetrics(vessels: Array<{ id: string; status: string }>): FleetMetrics {
  const activeVessels = vessels.filter(v => v.status === 'operational').length;
  
  let criticalIssueCount = 0;
  let highIssueCount = 0;
  
  Object.values(VESSEL_ISSUES).forEach(vesselIssues => {
    vesselIssues.issues.forEach(issue => {
      if (issue.pmPrediction.priority === 'critical') criticalIssueCount++;
      if (issue.pmPrediction.priority === 'high') highIssueCount++;
    });
  });
  
  return {
    totalVessels: vessels.length,
    activeVessels,
    utilization: Math.round((activeVessels / vessels.length) * 100),
    activeProjects: 4, // 4 active routes
    completedProjects: 0,
    upcomingMaintenance: criticalIssueCount + highIssueCount,
    conflictCount: criticalIssueCount + Math.floor(highIssueCount / 2) + 1,
    revenuePerDay: 650000, // ~$650K/day for ferry operations
  };
}

// Get maintenance schedule summary for a vessel based on PM issues
export function getVesselMaintenanceSchedule(mmsi: string): {
  vesselName: string;
  criticalItems: number;
  highPriorityItems: number;
  nextMaintenanceDate: Date | null;
  estimatedDowntime: number;
  issues: Array<{
    equipment: string;
    priority: string;
    timeToFailure: string;
    recommendation: string;
  }>;
} | null {
  const vesselIssues = getVesselIssues(mmsi);
  if (!vesselIssues) return null;
  
  const now = new Date();
  let criticalItems = 0;
  let highPriorityItems = 0;
  let earliestMaintenance: Date | null = null;
  let totalDowntime = 0;
  
  const issues = vesselIssues.issues.map(issue => {
    if (issue.pmPrediction.priority === 'critical') {
      criticalItems++;
      totalDowntime += 7;
      if (!earliestMaintenance) {
        earliestMaintenance = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      }
    } else if (issue.pmPrediction.priority === 'high') {
      highPriorityItems++;
      totalDowntime += 5;
      if (!earliestMaintenance) {
        earliestMaintenance = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      }
    } else {
      totalDowntime += 2;
    }
    
    return {
      equipment: issue.equipmentName,
      priority: issue.pmPrediction.priority,
      timeToFailure: issue.pmPrediction.timeToFailure || 'Unknown',
      recommendation: issue.pmPrediction.recommendedAction,
    };
  });
  
  return {
    vesselName: vesselIssues.vesselName,
    criticalItems,
    highPriorityItems,
    nextMaintenanceDate: earliestMaintenance,
    estimatedDowntime: totalDowntime,
    issues,
  };
}

// Get route risk assessment based on assigned vessel PM issues
export function getProjectRiskFromPM(projectId: string, assignedVesselMMSIs: string[]): {
  overallRisk: 'critical' | 'high' | 'medium' | 'low';
  vesselRisks: Array<{
    vesselName: string;
    mmsi: string;
    worstIssue: string;
    healthScore: number;
    impactOnProject: string;
  }>;
  totalDowntimeRisk: number;
  recommendations: string[];
} {
  const vesselRisks: Array<{
    vesselName: string;
    mmsi: string;
    worstIssue: string;
    healthScore: number;
    impactOnProject: string;
  }> = [];
  
  let hasCritical = false;
  let hasHigh = false;
  let totalDowntimeRisk = 0;
  const recommendations: string[] = [];
  
  assignedVesselMMSIs.forEach(mmsi => {
    const vesselIssues = getVesselIssues(mmsi);
    if (!vesselIssues) return;
    
    const worstIssue = vesselIssues.issues.reduce((worst, current) => {
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[current.pmPrediction.priority] < priorityOrder[worst.pmPrediction.priority]) {
        return current;
      }
      return worst;
    }, vesselIssues.issues[0]);
    
    if (worstIssue.pmPrediction.priority === 'critical') {
      hasCritical = true;
      totalDowntimeRisk += 7;
      recommendations.push(`URGENT: ${vesselIssues.vesselName} - ${worstIssue.pmPrediction.recommendedAction}`);
    } else if (worstIssue.pmPrediction.priority === 'high') {
      hasHigh = true;
      totalDowntimeRisk += 5;
      recommendations.push(`HIGH: ${vesselIssues.vesselName} - ${worstIssue.pmPrediction.recommendedAction}`);
    }
    
    vesselRisks.push({
      vesselName: vesselIssues.vesselName,
      mmsi,
      worstIssue: worstIssue.pmPrediction.predictedIssue,
      healthScore: worstIssue.healthScore,
      impactOnProject: worstIssue.pmPrediction.priority === 'critical' 
        ? 'May cause route service disruption for 7+ days'
        : worstIssue.pmPrediction.priority === 'high'
        ? 'Potential 3-5 day service reduction if unaddressed'
        : 'Minimal impact with scheduled maintenance',
    });
  });
  
  return {
    overallRisk: hasCritical ? 'critical' : hasHigh ? 'high' : 'medium',
    vesselRisks,
    totalDowntimeRisk,
    recommendations,
  };
}