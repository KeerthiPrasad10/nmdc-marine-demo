import { Project, VesselAssignment, ScheduleConflict, FleetMetrics } from './types';

// Generate mock projects
export function generateMockProjects(): Project[] {
  const now = new Date();
  
  return [
    {
      id: 'proj-001',
      name: 'Ruwais LNG Terminal Expansion',
      client: 'ADNOC',
      type: 'construction',
      status: 'active',
      priority: 'critical',
      location: { name: 'Ruwais, UAE', lat: 24.1, lng: 52.7 },
      schedule: {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        weatherWindow: {
          start: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          end: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
        },
      },
      requirements: {
        vesselTypes: ['crane_barge', 'supply_vessel'],
        crewCount: 45,
        equipment: ['Heavy lift crane', 'Dive support'],
      },
      assignedVessels: ['vessel-1', 'vessel-3'],
      progress: 35,
      budget: { allocated: 12500000, spent: 4375000, currency: 'USD' },
    },
    {
      id: 'proj-002',
      name: 'Palm Jumeirah Channel Dredging',
      client: 'Nakheel',
      type: 'dredging',
      status: 'active',
      priority: 'high',
      location: { name: 'Dubai, UAE', lat: 25.1, lng: 55.1 },
      schedule: {
        startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      },
      requirements: {
        vesselTypes: ['dredger'],
        crewCount: 25,
        equipment: ['Suction dredge', 'Survey equipment'],
      },
      assignedVessels: ['vessel-2'],
      progress: 55,
      budget: { allocated: 8500000, spent: 4675000, currency: 'USD' },
    },
    {
      id: 'proj-003',
      name: 'Offshore Platform Decommissioning',
      client: 'BP',
      type: 'decommissioning',
      status: 'planning',
      priority: 'medium',
      location: { name: 'Abu Dhabi Offshore', lat: 24.5, lng: 54.0 },
      schedule: {
        startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      },
      requirements: {
        vesselTypes: ['crane_barge', 'tugboat', 'supply_vessel'],
        crewCount: 60,
        equipment: ['Heavy lift crane', 'Cutting equipment', 'Dive support'],
      },
      assignedVessels: ['vessel-4', 'vessel-5'],
      progress: 0,
      budget: { allocated: 22000000, spent: 0, currency: 'USD' },
    },
    {
      id: 'proj-004',
      name: 'Submarine Cable Installation',
      client: 'Etisalat',
      type: 'installation',
      status: 'active',
      priority: 'high',
      location: { name: 'Fujairah, UAE', lat: 25.1, lng: 56.3 },
      schedule: {
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      },
      requirements: {
        vesselTypes: ['supply_vessel', 'survey_vessel'],
        crewCount: 30,
        equipment: ['Cable laying equipment', 'ROV'],
      },
      assignedVessels: ['vessel-6', 'vessel-7'],
      progress: 40,
      budget: { allocated: 5500000, spent: 2200000, currency: 'USD' },
    },
    {
      id: 'proj-005',
      name: 'Port Rashid Maintenance',
      client: 'DP World',
      type: 'maintenance',
      status: 'on-hold',
      priority: 'low',
      location: { name: 'Dubai, UAE', lat: 25.27, lng: 55.28 },
      schedule: {
        startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      },
      requirements: {
        vesselTypes: ['tugboat'],
        crewCount: 15,
        equipment: ['Standard marine equipment'],
      },
      assignedVessels: ['vessel-8'],
      progress: 0,
      budget: { allocated: 1200000, spent: 0, currency: 'USD' },
    },
    {
      id: 'proj-006',
      name: 'Seabed Survey - New Island',
      client: 'Government of Abu Dhabi',
      type: 'survey',
      status: 'active',
      priority: 'medium',
      location: { name: 'Al Saadiyat, UAE', lat: 24.55, lng: 54.43 },
      schedule: {
        startDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      },
      requirements: {
        vesselTypes: ['survey_vessel'],
        crewCount: 12,
        equipment: ['Multibeam sonar', 'GPS positioning'],
      },
      assignedVessels: ['vessel-9'],
      progress: 25,
      budget: { allocated: 850000, spent: 212500, currency: 'USD' },
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

// Generate schedule conflicts
export function generateMockConflicts(): ScheduleConflict[] {
  return [
    {
      id: 'conflict-001',
      type: 'weather_risk',
      severity: 'warning',
      affectedVessels: ['vessel-1', 'vessel-3'],
      affectedProjects: ['proj-001'],
      description: 'High wind advisory (35+ knots) forecasted for Ruwais area in 5 days',
      suggestedResolution: 'Accelerate current phase or prepare for 2-day standby',
    },
    {
      id: 'conflict-002',
      type: 'vessel_double_booking',
      severity: 'critical',
      affectedVessels: ['vessel-4'],
      affectedProjects: ['proj-003', 'proj-004'],
      description: 'NMDC Al Mirfa scheduled for two projects with overlapping dates',
      suggestedResolution: 'Reassign NMDC Yas Al Bahr to project 004 or delay project 003 by 5 days',
    },
    {
      id: 'conflict-003',
      type: 'crew_shortage',
      severity: 'warning',
      affectedVessels: ['vessel-2'],
      affectedProjects: ['proj-002'],
      description: '3 certified crane operators on leave during critical lift phase',
      suggestedResolution: 'Request temporary crew from NMDC Al Hudayriat or delay lift operations',
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
    activeProjects: 4,
    completedProjects: 12,
    upcomingMaintenance: 3,
    conflictCount: 2,
    revenuePerDay: 485000,
  };
}

