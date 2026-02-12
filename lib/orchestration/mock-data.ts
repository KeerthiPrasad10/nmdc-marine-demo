import { Project, VesselAssignment, ScheduleConflict, FleetMetrics } from './types';
import { getVesselIssues, VESSEL_ISSUES, VesselIssues } from '../vessel-issues';
import { getNMDCVesselByMMSI as getLegacyVesselByMMSI } from '../nmdc/fleet';

// Generate mock projects - ALIGNED with legacy marine project sites
// Uses actual vessel MMSIs to match vessels with equipment issues
export function generateMockProjects(): Project[] {
  const now = new Date();
  
  return [
    {
      id: 'proj-adnoc-001',
      name: 'ADNOC Offshore Pipeline Installation',
      client: 'ADNOC',
      type: 'construction',
      status: 'active',
      priority: 'critical',
      location: { name: 'Ruwais Offshore, Abu Dhabi', lat: 24.1, lng: 52.7 },
      schedule: {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        weatherWindow: {
          start: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          end: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
        },
      },
      requirements: {
        vesselTypes: ['pipelay_barge', 'derrick_barge'],
        crewCount: 300,
        equipment: ['Tensioner system', 'Stinger', 'Heavy lift crane'],
      },
      assignedVessels: ['470339000', '471026000', '470284000'], // DLB-750, DELMA 2000, DLB-1000
      progress: 35,
      budget: { allocated: 125000000, spent: 43750000, currency: 'USD' },
    },
    {
      id: 'proj-zakum',
      name: 'Upper Zakum Platform Hook-up',
      client: 'ZADCO',
      type: 'construction',
      status: 'active',
      priority: 'high',
      location: { name: 'Upper Zakum Field', lat: 24.85, lng: 53.45 },
      schedule: {
        startDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      },
      requirements: {
        vesselTypes: ['jack_up'],
        crewCount: 260,
        equipment: ['Jacking system', 'Crane', 'Welding equipment'],
      },
      assignedVessels: ['470114000', '470426000', '470395000'], // SEP-550, SEP-650, SEP-750
      progress: 42,
      budget: { allocated: 76000000, spent: 31920000, currency: 'USD' },
    },
    {
      id: 'proj-001',
      name: 'Khalifa Port Expansion Phase 3',
      client: 'Abu Dhabi Ports',
      type: 'dredging',
      status: 'active',
      priority: 'high',
      location: { name: 'Khalifa Port, Abu Dhabi', lat: 24.8, lng: 54.6 },
      schedule: {
        startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
      },
      requirements: {
        vesselTypes: ['dredger'],
        crewCount: 80,
        equipment: ['Suction dredge', 'Survey equipment'],
      },
      assignedVessels: ['470563000', '471072000'], // AL SADR, ARZANA
      progress: 35,
      budget: { allocated: 230000000, spent: 80500000, currency: 'USD' },
    },
    {
      id: 'proj-006',
      name: 'Das Island Support Base',
      client: 'ADNOC Offshore',
      type: 'construction',
      status: 'active',
      priority: 'medium',
      location: { name: 'Das Island', lat: 25.15, lng: 52.87 },
      schedule: {
        startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
      requirements: {
        vesselTypes: ['supply_vessel', 'tug'],
        crewCount: 45,
        equipment: ['Standard marine equipment'],
      },
      assignedVessels: ['470927000', '470337000'], // UMM SHAIF, NPCC SAADIYAT
      progress: 75,
      budget: { allocated: 40000000, spent: 30000000, currency: 'USD' },
    },
  ];
}

// Generate vessel assignments for Gantt chart
// Now dynamically assigns projects to actual vessels passed in
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
    
    // Find the most critical issue for this vessel
    const criticalIssue = vesselIssues.issues.find(i => i.pmPrediction.priority === 'critical');
    const highIssue = vesselIssues.issues.find(i => i.pmPrediction.priority === 'high');
    const mainIssue = criticalIssue || highIssue;
    
    if (mainIssue) {
      // Calculate maintenance window based on time to failure
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
  
  // Generate conflicts from actual vessel issues
  Object.entries(VESSEL_ISSUES).forEach(([mmsi, vesselIssues]) => {
    const vessel = getLegacyVesselByMMSI(mmsi);
    if (!vessel) return;
    
    vesselIssues.issues.forEach((issue, index) => {
      if (issue.pmPrediction.priority === 'critical' || issue.pmPrediction.priority === 'high') {
        // Map vessel to project
        const projectMapping: Record<string, string> = {
          '470339000': 'proj-adnoc-001', // DLB-750
          '471026000': 'proj-adnoc-001', // DELMA 2000
          '470284000': 'proj-adnoc-001', // DLB-1000
          '470285000': 'proj-adnoc-001', // PLB-648
          '470114000': 'proj-zakum',     // SEP-550
          '470426000': 'proj-zakum',     // SEP-650
          '470395000': 'proj-zakum',     // SEP-750
          '470340000': 'proj-zakum',     // SEP-450
          '470927000': 'proj-006',       // UMM SHAIF
          '470337000': 'proj-006',       // NPCC SAADIYAT
          '470642000': 'proj-006',       // NPCC YAS
          '470212000': 'proj-adnoc-001', // DLS-4200
        };
        
        const projectId = projectMapping[mmsi] || 'proj-001';
        
        conflicts.push({
          id: `conflict-${mmsi}-${index}`,
          type: 'equipment_risk',
          severity: issue.pmPrediction.priority === 'critical' ? 'critical' : 'warning',
          affectedVessels: [mmsi],
          affectedProjects: [projectId],
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
    affectedVessels: ['470339000', '471026000', '470284000'], // DLB-750, DELMA 2000, DLB-1000
    affectedProjects: ['proj-adnoc-001'],
    description: 'High wind advisory (35+ knots) forecasted for Ruwais offshore area in 5 days',
    suggestedResolution: 'Accelerate current pipe-lay phase or prepare for 2-day standby',
  });
  
  // Sort: critical first, then by vessel name
  return conflicts.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (b.severity === 'critical' && a.severity !== 'critical') return 1;
    return 0;
  });
}

// Generate fleet metrics - now includes PM issue counts
export function generateFleetMetrics(vessels: Array<{ id: string; status: string }>): FleetMetrics {
  const activeVessels = vessels.filter(v => v.status === 'operational').length;
  
  // Count vessels with PM issues
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
    activeProjects: 4, // ADNOC Pipeline, Zakum Hook-up, Khalifa Port, Das Island
    completedProjects: 12,
    upcomingMaintenance: criticalIssueCount + highIssueCount, // Based on actual PM issues
    conflictCount: criticalIssueCount + Math.floor(highIssueCount / 2) + 1, // +1 for weather
    revenuePerDay: 850000, // ~$850K/day for major offshore projects
  };
}

// NEW: Get maintenance schedule summary for a vessel based on PM issues
export function getVesselMaintenanceSchedule(mmsi: string): {
  vesselName: string;
  criticalItems: number;
  highPriorityItems: number;
  nextMaintenanceDate: Date | null;
  estimatedDowntime: number; // days
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
      totalDowntime += 7; // Critical items need longer maintenance
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

// NEW: Get project risk assessment based on assigned vessel PM issues
export function getProjectRiskFromPM(projectId: string, assignedVesselMMSIs: string[]): {
  overallRisk: 'critical' | 'high' | 'medium' | 'low';
  vesselRisks: Array<{
    vesselName: string;
    mmsi: string;
    worstIssue: string;
    healthScore: number;
    impactOnProject: string;
  }>;
  totalDowntimeRisk: number; // estimated days at risk
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
    
    // Find worst issue for this vessel
    const worstIssue = vesselIssues.issues.reduce((worst, current) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
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
        ? 'May cause project delay of 7+ days'
        : worstIssue.pmPrediction.priority === 'high'
        ? 'Potential 3-5 day impact if unaddressed'
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
