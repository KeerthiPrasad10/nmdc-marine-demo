import { Project, VesselAssignment, ScheduleConflict, FleetMetrics } from './types';

// Generate mock projects - ALIGNED with lib/nmdc/projects.ts PROJECT_SITES
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

  // If no vessels, return empty
  if (vessels.length === 0) return assignments;

  // Assign projects to actual vessels (distribute across fleet)
  projects.forEach((project, projectIndex) => {
    // Assign 1-2 vessels per project
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

  // Add some maintenance blocks for vessels that don't have many assignments
  const assignmentCounts = new Map<string, number>();
  assignments.forEach(a => {
    assignmentCounts.set(a.vesselId, (assignmentCounts.get(a.vesselId) || 0) + 1);
  });
  
  // Find vessels with fewer assignments and add maintenance
  vessels.forEach((vessel, i) => {
    if ((assignmentCounts.get(vessel.id) || 0) < 2 && i < 5) {
      assignments.push({
        id: `maint-${vessel.id}`,
        vesselId: vessel.id,
        vesselName: vessel.name,
        projectId: 'maintenance',
        projectName: 'Scheduled Maintenance',
        startDate: new Date(now.getTime() + (20 + i * 10) * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + (25 + i * 10) * 24 * 60 * 60 * 1000),
        status: 'scheduled',
        utilization: 0,
      });
    }
  });

  return assignments;
}

// Generate schedule conflicts - uses actual vessel names and project IDs
export function generateMockConflicts(): ScheduleConflict[] {
  return [
    {
      id: 'conflict-001',
      type: 'equipment_risk',
      severity: 'critical',
      affectedVessels: ['470339000'], // DLB-750
      affectedProjects: ['proj-adnoc-001'],
      description: 'DLB-750 Tensioner System at 58% health - risk to ADNOC Pipeline project',
      suggestedResolution: 'Schedule preventive maintenance before weather window or assign DLB-1000 as backup',
    },
    {
      id: 'conflict-002',
      type: 'weather_risk',
      severity: 'warning',
      affectedVessels: ['470339000', '471026000', '470284000'], // DLB-750, DELMA 2000, DLB-1000
      affectedProjects: ['proj-adnoc-001'],
      description: 'High wind advisory (35+ knots) forecasted for Ruwais offshore area in 5 days',
      suggestedResolution: 'Accelerate current pipe-lay phase or prepare for 2-day standby',
    },
    {
      id: 'conflict-003',
      type: 'equipment_risk',
      severity: 'warning',
      affectedVessels: ['470114000'], // SEP-550
      affectedProjects: ['proj-zakum'],
      description: 'SEP-550 Jacking System at 64% health - potential impact on Zakum hook-up schedule',
      suggestedResolution: 'Complete accumulator service during next jacking cycle transition',
    },
  ];
}

// Generate fleet metrics
export function generateFleetMetrics(vessels: Array<{ id: string; status: string }>): FleetMetrics {
  const activeVessels = vessels.filter(v => v.status === 'operational').length;
  
  return {
    totalVessels: vessels.length,
    activeVessels,
    utilization: Math.round((activeVessels / vessels.length) * 100),
    activeProjects: 4, // ADNOC Pipeline, Zakum Hook-up, Khalifa Port, Das Island
    completedProjects: 12,
    upcomingMaintenance: 8, // Vessels with equipment issues
    conflictCount: 3,
    revenuePerDay: 850000, // ~$850K/day for major offshore projects
  };
}

