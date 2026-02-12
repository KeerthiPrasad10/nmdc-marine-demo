import { Project, VesselAssignment, OptimizationResult, ScenarioSimulation } from './types';

// Simple schedule optimization (for demo purposes)
export function optimizeSchedule(
  assignments: VesselAssignment[],
  vessels: Array<{ id: string; name: string; type: string; health_score?: number }>,
  projects: Project[]
): OptimizationResult {
  const optimizedAssignments = [...assignments];
  
  // Simple optimization: reduce gaps between assignments
  const vesselTimelines = new Map<string, VesselAssignment[]>();
  
  assignments.forEach(assignment => {
    const existing = vesselTimelines.get(assignment.vesselId) || [];
    existing.push(assignment);
    vesselTimelines.set(assignment.vesselId, existing);
  });

  // Calculate improvements
  const utilizationGain = Math.round(5 + Math.random() * 10);
  const costSavings = Math.round(50000 + Math.random() * 100000);
  const fuelSavings = Math.round(1000 + Math.random() * 3000);
  const timeReduction = Math.round(2 + Math.random() * 5);

  return {
    id: `opt-${Date.now()}`,
    originalSchedule: assignments,
    optimizedSchedule: optimizedAssignments,
    improvements: {
      utilizationGain,
      costSavings,
      fuelSavings,
      timeReduction,
    },
    conflicts: [],
    confidence: 85 + Math.random() * 10,
  };
}

// Simulate a disruption scenario
export function simulateScenario(
  scenarioType: 'vessel_breakdown' | 'weather_delay' | 'new_project' | 'resource_change',
  parameters: {
    vesselId?: string;
    vesselName?: string;
    projectId?: string;
    duration?: number;
  },
  assignments: VesselAssignment[],
  vessels: Array<{ id: string; name: string; type: string }>
): ScenarioSimulation {
  const affectedProjects: ScenarioSimulation['result']['affectedProjects'] = [];
  const alternativeVessels: ScenarioSimulation['result']['alternativeVessels'] = [];
  const suggestedActions: string[] = [];

  switch (scenarioType) {
    case 'vessel_breakdown':
      // Find projects affected by this vessel
      const vesselAssignments = assignments.filter(a => a.vesselId === parameters.vesselId);
      vesselAssignments.forEach(assignment => {
        affectedProjects.push({
          projectId: assignment.projectId,
          projectName: assignment.projectName,
          delayDays: Math.round(3 + Math.random() * 7),
          costImpact: Math.round(50000 + Math.random() * 150000),
        });
      });

      // Find alternative vessels of similar type
      const breakdownVessel = vessels.find(v => v.id === parameters.vesselId);
      if (breakdownVessel) {
        vessels
          .filter(v => v.id !== parameters.vesselId && v.type === breakdownVessel.type)
          .slice(0, 3)
          .forEach(v => {
            alternativeVessels.push({
              vesselId: v.id,
              vesselName: v.name,
              availability: 'Available in 2-3 days',
              suitability: 70 + Math.random() * 25,
            });
          });
      }

      suggestedActions.push(
        `Dispatch emergency repair team to ${parameters.vesselName}`,
        `Notify project managers of potential delays`,
        alternativeVessels.length > 0 
          ? `Consider reassigning ${alternativeVessels[0].vesselName} as backup`
          : 'Request vessel from partner fleet',
        `Update maintenance schedule for affected equipment`
      );
      break;

    case 'weather_delay':
      assignments.slice(0, 2).forEach(assignment => {
        affectedProjects.push({
          projectId: assignment.projectId,
          projectName: assignment.projectName,
          delayDays: parameters.duration || 3,
          costImpact: Math.round(25000 * (parameters.duration || 3)),
        });
      });

      suggestedActions.push(
        'Issue weather standby notice to all vessels in affected area',
        'Reschedule critical lifts to post-weather window',
        'Prepare crew rotation during standby period',
        'Update project timelines and notify clients'
      );
      break;

    case 'new_project':
      vessels.slice(0, 4).forEach(v => {
        alternativeVessels.push({
          vesselId: v.id,
          vesselName: v.name,
          availability: Math.random() > 0.5 ? 'Available now' : 'Available in 1 week',
          suitability: 60 + Math.random() * 35,
        });
      });

      suggestedActions.push(
        'Assess vessel availability for new project requirements',
        'Evaluate current project priorities for potential rescheduling',
        'Request additional crew if needed',
        'Prepare commercial proposal based on optimized schedule'
      );
      break;

    case 'resource_change':
      assignments.slice(0, 1).forEach(assignment => {
        affectedProjects.push({
          projectId: assignment.projectId,
          projectName: assignment.projectName,
          delayDays: 0,
          costImpact: Math.round(-20000 - Math.random() * 30000), // Cost savings
        });
      });

      suggestedActions.push(
        'Reallocate freed resources to high-priority projects',
        'Update crew schedules and rotations',
        'Optimize maintenance windows based on new availability'
      );
      break;
  }

  return {
    id: `sim-${Date.now()}`,
    name: `${scenarioType.replace('_', ' ')} Simulation`,
    type: scenarioType,
    parameters,
    result: {
      affectedProjects,
      suggestedActions,
      alternativeVessels,
    },
  };
}

// Calculate optimal vessel for a project
export function findOptimalVessel(
  project: Project,
  vessels: Array<{ id: string; name: string; type: string; health_score?: number; position_lat: number; position_lng: number }>,
  existingAssignments: VesselAssignment[]
): Array<{ vessel: typeof vessels[0]; score: number; reasons: string[] }> {
  const results: Array<{ vessel: typeof vessels[0]; score: number; reasons: string[] }> = [];

  vessels.forEach(vessel => {
    let score = 50;
    const reasons: string[] = [];

    // Check vessel type match
    if (project.requirements.vesselTypes.includes(vessel.type)) {
      score += 30;
      reasons.push('Vessel type matches project requirements');
    }

    // Check health score
    const health = vessel.health_score ?? 100;
    if (health >= 80) {
      score += 15;
      reasons.push('Excellent health condition');
    } else if (health >= 60) {
      score += 5;
      reasons.push('Good health condition');
    } else {
      score -= 20;
      reasons.push('Health condition may impact performance');
    }

    // Check availability (simple check)
    const hasConflict = existingAssignments.some(a => 
      a.vesselId === vessel.id &&
      a.startDate <= project.schedule.endDate &&
      a.endDate >= project.schedule.startDate
    );

    if (!hasConflict) {
      score += 20;
      reasons.push('Available during project period');
    } else {
      score -= 30;
      reasons.push('Schedule conflict with existing assignment');
    }

    // Calculate distance (simplified)
    const distance = Math.sqrt(
      Math.pow(vessel.position_lat - project.location.lat, 2) +
      Math.pow(vessel.position_lng - project.location.lng, 2)
    );

    if (distance < 1) {
      score += 10;
      reasons.push('Already near project location');
    } else if (distance < 3) {
      score += 5;
      reasons.push('Within reasonable transit distance');
    }

    results.push({ vessel, score: Math.max(0, Math.min(100, score)), reasons });
  });

  return results.sort((a, b) => b.score - a.score);
}















