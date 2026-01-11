/**
 * Real Fleet Optimization Engine
 * 
 * This module provides transparent, explainable fleet optimization with:
 * - Actual distance/fuel/time calculations
 * - Before/after comparison
 * - Clear reasoning for each optimization decision
 */

import { Project, VesselAssignment } from './types';

// ============================================================================
// Types
// ============================================================================

export interface VesselPosition {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  speed: number; // knots
  fuelConsumptionRate: number; // liters per nautical mile
}

export interface ProjectLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  requiredVesselTypes: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  startDate: Date;
  endDate: Date;
}

export interface RouteSegment {
  from: { name: string; lat: number; lng: number };
  to: { name: string; lat: number; lng: number };
  distanceNm: number;
  estimatedHours: number;
  fuelLiters: number;
}

export interface VesselSchedule {
  vesselId: string;
  vesselName: string;
  vesselType: string;
  assignments: {
    projectId: string;
    projectName: string;
    location: { lat: number; lng: number };
    startDate: Date;
    endDate: Date;
  }[];
  totalTransitDistanceNm: number;
  totalTransitHours: number;
  totalFuelLiters: number;
  idleDays: number;
  routes: RouteSegment[];
}

export interface OptimizationChange {
  type: 'reassign' | 'resequence' | 'swap' | 'consolidate';
  description: string;
  reasoning: string;
  impact: {
    distanceSavedNm: number;
    fuelSavedLiters: number;
    timeSavedHours: number;
    costSavedUSD: number;
  };
  affectedVessels: string[];
  before: {
    vessel: string;
    sequence: string[];
    totalDistanceNm: number;
  }[];
  after: {
    vessel: string;
    sequence: string[];
    totalDistanceNm: number;
  }[];
}

export interface FleetOptimizationResult {
  id: string;
  timestamp: Date;
  
  // Original state
  originalSchedules: VesselSchedule[];
  originalMetrics: {
    totalFleetDistanceNm: number;
    totalFleetFuelLiters: number;
    totalFleetTransitHours: number;
    totalIdleDays: number;
    averageUtilization: number;
  };
  
  // Optimized state
  optimizedSchedules: VesselSchedule[];
  optimizedMetrics: {
    totalFleetDistanceNm: number;
    totalFleetFuelLiters: number;
    totalFleetTransitHours: number;
    totalIdleDays: number;
    averageUtilization: number;
  };
  
  // Changes made
  changes: OptimizationChange[];
  
  // Summary
  summary: {
    totalDistanceSavedNm: number;
    totalFuelSavedLiters: number;
    totalTimeSavedHours: number;
    totalCostSavedUSD: number;
    utilizationGainPercent: number;
  };
  
  // Confidence
  confidence: number;
  warnings: string[];
}

// ============================================================================
// Constants
// ============================================================================

const FUEL_COST_USD_PER_LITER = 0.85; // Marine diesel
const AVERAGE_VESSEL_SPEED_KNOTS = 10;
const DAILY_OPERATING_COST_USD = 15000; // Average for offshore vessels

// Fuel consumption rates by vessel type (liters per nautical mile)
const FUEL_CONSUMPTION_RATES: Record<string, number> = {
  dredger: 85,
  crane_barge: 45,
  supply_vessel: 35,
  tugboat: 25,
  survey_vessel: 20,
  barge: 0, // Towed
  default: 40,
};

// ============================================================================
// Distance Calculations
// ============================================================================

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in nautical miles
 */
export function calculateDistanceNm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate transit time in hours
 */
export function calculateTransitHours(distanceNm: number, speedKnots: number = AVERAGE_VESSEL_SPEED_KNOTS): number {
  return distanceNm / speedKnots;
}

/**
 * Calculate fuel consumption in liters
 */
export function calculateFuelConsumption(distanceNm: number, vesselType: string): number {
  const rate = FUEL_CONSUMPTION_RATES[vesselType] || FUEL_CONSUMPTION_RATES.default;
  return distanceNm * rate;
}

// ============================================================================
// Schedule Analysis
// ============================================================================

/**
 * Analyze a vessel's schedule and calculate transit requirements
 */
export function analyzeVesselSchedule(
  vessel: VesselPosition,
  assignments: Array<{
    projectId: string;
    projectName: string;
    location: { lat: number; lng: number };
    startDate: Date;
    endDate: Date;
  }>
): VesselSchedule {
  const routes: RouteSegment[] = [];
  let totalTransitDistanceNm = 0;
  let totalTransitHours = 0;
  let totalFuelLiters = 0;
  let idleDays = 0;

  // Sort assignments by start date
  const sortedAssignments = [...assignments].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );

  // Calculate from vessel's current position to first assignment
  if (sortedAssignments.length > 0) {
    const first = sortedAssignments[0];
    const distanceToFirst = calculateDistanceNm(
      vessel.lat,
      vessel.lng,
      first.location.lat,
      first.location.lng
    );

    if (distanceToFirst > 1) { // Only count if > 1nm
      const hours = calculateTransitHours(distanceToFirst, vessel.speed);
      const fuel = calculateFuelConsumption(distanceToFirst, vessel.type);

      routes.push({
        from: { name: `${vessel.name} (current)`, lat: vessel.lat, lng: vessel.lng },
        to: { name: first.projectName, lat: first.location.lat, lng: first.location.lng },
        distanceNm: distanceToFirst,
        estimatedHours: hours,
        fuelLiters: fuel,
      });

      totalTransitDistanceNm += distanceToFirst;
      totalTransitHours += hours;
      totalFuelLiters += fuel;
    }
  }

  // Calculate inter-project transits
  for (let i = 0; i < sortedAssignments.length - 1; i++) {
    const current = sortedAssignments[i];
    const next = sortedAssignments[i + 1];

    // Calculate idle time between projects
    const gapDays = (next.startDate.getTime() - current.endDate.getTime()) / (1000 * 60 * 60 * 24);
    if (gapDays > 0) {
      idleDays += gapDays;
    }

    // Calculate transit distance
    const distance = calculateDistanceNm(
      current.location.lat,
      current.location.lng,
      next.location.lat,
      next.location.lng
    );

    if (distance > 1) { // Only count if > 1nm
      const hours = calculateTransitHours(distance, vessel.speed);
      const fuel = calculateFuelConsumption(distance, vessel.type);

      routes.push({
        from: { name: current.projectName, lat: current.location.lat, lng: current.location.lng },
        to: { name: next.projectName, lat: next.location.lat, lng: next.location.lng },
        distanceNm: distance,
        estimatedHours: hours,
        fuelLiters: fuel,
      });

      totalTransitDistanceNm += distance;
      totalTransitHours += hours;
      totalFuelLiters += fuel;
    }
  }

  return {
    vesselId: vessel.id,
    vesselName: vessel.name,
    vesselType: vessel.type,
    assignments: sortedAssignments,
    totalTransitDistanceNm,
    totalTransitHours,
    totalFuelLiters,
    idleDays,
    routes,
  };
}

// ============================================================================
// Optimization Algorithms
// ============================================================================

/**
 * Calculate the total route distance for a sequence of locations
 */
function calculateTotalRouteDistance(
  startLat: number,
  startLng: number,
  locations: Array<{ lat: number; lng: number }>
): number {
  if (locations.length === 0) return 0;

  let total = calculateDistanceNm(startLat, startLng, locations[0].lat, locations[0].lng);

  for (let i = 0; i < locations.length - 1; i++) {
    total += calculateDistanceNm(
      locations[i].lat,
      locations[i].lng,
      locations[i + 1].lat,
      locations[i + 1].lng
    );
  }

  return total;
}

/**
 * Find the optimal sequence of projects using nearest neighbor heuristic
 * This is a greedy approach to the Traveling Salesman Problem
 */
function optimizeSequenceNearestNeighbor(
  startLat: number,
  startLng: number,
  projects: Array<{ id: string; name: string; lat: number; lng: number }>
): Array<{ id: string; name: string; lat: number; lng: number }> {
  if (projects.length <= 1) return projects;

  const result: typeof projects = [];
  const remaining = [...projects];
  let currentLat = startLat;
  let currentLng = startLng;

  while (remaining.length > 0) {
    // Find nearest unvisited project
    let nearestIdx = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = calculateDistanceNm(currentLat, currentLng, remaining[i].lat, remaining[i].lng);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIdx = i;
      }
    }

    const nearest = remaining.splice(nearestIdx, 1)[0];
    result.push(nearest);
    currentLat = nearest.lat;
    currentLng = nearest.lng;
  }

  return result;
}

/**
 * Try 2-opt improvement on a route
 */
function improve2Opt(
  startLat: number,
  startLng: number,
  locations: Array<{ id: string; name: string; lat: number; lng: number }>
): Array<{ id: string; name: string; lat: number; lng: number }> {
  if (locations.length <= 2) return locations;

  let improved = true;
  let route = [...locations];
  let bestDistance = calculateTotalRouteDistance(startLat, startLng, route);

  while (improved) {
    improved = false;

    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        // Reverse the segment between i and j
        const newRoute = [
          ...route.slice(0, i),
          ...route.slice(i, j + 1).reverse(),
          ...route.slice(j + 1),
        ];

        const newDistance = calculateTotalRouteDistance(startLat, startLng, newRoute);

        if (newDistance < bestDistance) {
          route = newRoute;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }

  return route;
}

/**
 * Score a vessel's suitability for a project
 */
function scoreVesselForProject(
  vessel: VesselPosition,
  project: ProjectLocation,
  existingAssignments: Array<{ vesselId: string; startDate: Date; endDate: Date }>
): { score: number; reasons: string[] } {
  let score = 50;
  const reasons: string[] = [];

  // Type match (highest weight)
  if (project.requiredVesselTypes.includes(vessel.type)) {
    score += 30;
    reasons.push(`Type match: ${vessel.type}`);
  } else {
    score -= 40;
    reasons.push(`Type mismatch: needs ${project.requiredVesselTypes.join('/')}, has ${vessel.type}`);
  }

  // Distance from vessel to project (closer is better)
  const distance = calculateDistanceNm(vessel.lat, vessel.lng, project.lat, project.lng);
  if (distance < 20) {
    score += 20;
    reasons.push(`Nearby: ${distance.toFixed(0)}nm transit`);
  } else if (distance < 50) {
    score += 10;
    reasons.push(`Moderate distance: ${distance.toFixed(0)}nm transit`);
  } else if (distance > 150) {
    score -= 15;
    reasons.push(`Far: ${distance.toFixed(0)}nm transit`);
  }

  // Check for schedule conflicts
  const hasConflict = existingAssignments.some(
    (a) =>
      a.vesselId === vessel.id &&
      a.startDate <= project.endDate &&
      a.endDate >= project.startDate
  );

  if (hasConflict) {
    score -= 50;
    reasons.push('Schedule conflict exists');
  } else {
    score += 10;
    reasons.push('Available during project period');
  }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

// ============================================================================
// Main Optimization Function
// ============================================================================

export interface OptimizationInput {
  vessels: VesselPosition[];
  projects: ProjectLocation[];
  currentAssignments: VesselAssignment[];
}

export function optimizeFleet(input: OptimizationInput): FleetOptimizationResult {
  const { vessels, projects, currentAssignments } = input;
  const changes: OptimizationChange[] = [];
  const warnings: string[] = [];

  // Build vessel schedule lookup
  const vesselAssignments = new Map<string, Array<{
    projectId: string;
    projectName: string;
    location: { lat: number; lng: number };
    startDate: Date;
    endDate: Date;
  }>>();

  // Initialize empty arrays for all vessels
  vessels.forEach((v) => vesselAssignments.set(v.id, []));

  // Populate with current assignments
  currentAssignments.forEach((a) => {
    const project = projects.find((p) => p.id === a.projectId);
    if (project && vesselAssignments.has(a.vesselId)) {
      vesselAssignments.get(a.vesselId)!.push({
        projectId: a.projectId,
        projectName: a.projectName,
        location: { lat: project.lat, lng: project.lng },
        startDate: new Date(a.startDate),
        endDate: new Date(a.endDate),
      });
    }
  });

  // Analyze original schedules
  const originalSchedules: VesselSchedule[] = vessels.map((v) =>
    analyzeVesselSchedule(v, vesselAssignments.get(v.id) || [])
  );

  // Calculate original metrics
  const originalMetrics = {
    totalFleetDistanceNm: originalSchedules.reduce((sum, s) => sum + s.totalTransitDistanceNm, 0),
    totalFleetFuelLiters: originalSchedules.reduce((sum, s) => sum + s.totalFuelLiters, 0),
    totalFleetTransitHours: originalSchedules.reduce((sum, s) => sum + s.totalTransitHours, 0),
    totalIdleDays: originalSchedules.reduce((sum, s) => sum + s.idleDays, 0),
    averageUtilization: calculateAverageUtilization(originalSchedules),
  };

  // ========================================
  // OPTIMIZATION 1: Resequence assignments to minimize transit
  // ========================================
  
  const optimizedAssignments = new Map<string, Array<{
    projectId: string;
    projectName: string;
    location: { lat: number; lng: number };
    startDate: Date;
    endDate: Date;
  }>>();

  vessels.forEach((vessel) => {
    const assignments = vesselAssignments.get(vessel.id) || [];
    if (assignments.length <= 1) {
      optimizedAssignments.set(vessel.id, assignments);
      return;
    }

    // Get project locations
    const projectLocs = assignments.map((a) => ({
      id: a.projectId,
      name: a.projectName,
      lat: a.location.lat,
      lng: a.location.lng,
    }));

    // Calculate original distance
    const originalDistance = calculateTotalRouteDistance(
      vessel.lat,
      vessel.lng,
      projectLocs
    );

    // Optimize sequence
    const optimizedLocs = optimizeSequenceNearestNeighbor(vessel.lat, vessel.lng, projectLocs);
    const improvedLocs = improve2Opt(vessel.lat, vessel.lng, optimizedLocs);

    const optimizedDistance = calculateTotalRouteDistance(
      vessel.lat,
      vessel.lng,
      improvedLocs
    );

    // Only record change if there's actual improvement
    if (optimizedDistance < originalDistance - 5) { // At least 5nm savings
      const distanceSaved = originalDistance - optimizedDistance;
      const fuelSaved = calculateFuelConsumption(distanceSaved, vessel.type);
      const timeSaved = calculateTransitHours(distanceSaved, vessel.speed);
      const costSaved = fuelSaved * FUEL_COST_USD_PER_LITER;

      changes.push({
        type: 'resequence',
        description: `Reorder ${vessel.name} project sequence`,
        reasoning: `By visiting projects in optimal order based on proximity, transit distance reduced from ${originalDistance.toFixed(0)}nm to ${optimizedDistance.toFixed(0)}nm.`,
        impact: {
          distanceSavedNm: distanceSaved,
          fuelSavedLiters: fuelSaved,
          timeSavedHours: timeSaved,
          costSavedUSD: costSaved,
        },
        affectedVessels: [vessel.id],
        before: [{
          vessel: vessel.name,
          sequence: projectLocs.map((p) => p.name),
          totalDistanceNm: originalDistance,
        }],
        after: [{
          vessel: vessel.name,
          sequence: improvedLocs.map((p) => p.name),
          totalDistanceNm: optimizedDistance,
        }],
      });
    }

    // Rebuild assignments in optimized order
    const reorderedAssignments = improvedLocs.map((loc) => {
      const orig = assignments.find((a) => a.projectId === loc.id)!;
      return orig;
    });

    optimizedAssignments.set(vessel.id, reorderedAssignments);
  });

  // ========================================
  // OPTIMIZATION 2: Vessel-Project Reassignment
  // ========================================

  // Find projects that could be better served by a different vessel
  projects.forEach((project) => {
    const currentlyAssigned = currentAssignments
      .filter((a) => a.projectId === project.id)
      .map((a) => vessels.find((v) => v.id === a.vesselId))
      .filter(Boolean) as VesselPosition[];

    if (currentlyAssigned.length === 0) return;

    // Score all vessels for this project
    const vesselScores = vessels.map((v) => ({
      vessel: v,
      ...scoreVesselForProject(v, project, currentAssignments),
    }));

    const bestVessel = vesselScores
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)[0];

    const currentVessel = currentlyAssigned[0];
    const currentScore = vesselScores.find((s) => s.vessel.id === currentVessel.id);

    // If there's a significantly better option
    if (bestVessel && currentScore && bestVessel.score > currentScore.score + 20) {
      // Calculate improvement
      const currentDistance = calculateDistanceNm(
        currentVessel.lat,
        currentVessel.lng,
        project.lat,
        project.lng
      );
      const newDistance = calculateDistanceNm(
        bestVessel.vessel.lat,
        bestVessel.vessel.lng,
        project.lat,
        project.lng
      );

      if (newDistance < currentDistance - 10) {
        const distanceSaved = currentDistance - newDistance;
        // Calculate actual fuel savings: old fuel usage - new fuel usage
        const oldFuelUsage = calculateFuelConsumption(currentDistance, currentVessel.type);
        const newFuelUsage = calculateFuelConsumption(newDistance, bestVessel.vessel.type);
        const fuelSaved = oldFuelUsage - newFuelUsage;
        const timeSaved = calculateTransitHours(currentDistance, currentVessel.speed) - 
                          calculateTransitHours(newDistance, bestVessel.vessel.speed);

        changes.push({
          type: 'reassign',
          description: `Reassign ${project.name} from ${currentVessel.name} to ${bestVessel.vessel.name}`,
          reasoning: `${bestVessel.vessel.name} is ${distanceSaved.toFixed(0)}nm closer and scores ${bestVessel.score} vs ${currentScore.score}. Reasons: ${bestVessel.reasons.join('; ')}`,
          impact: {
            distanceSavedNm: distanceSaved,
            fuelSavedLiters: Math.max(0, fuelSaved), // Only show positive savings
            timeSavedHours: Math.max(0, timeSaved),
            costSavedUSD: Math.max(0, fuelSaved) * FUEL_COST_USD_PER_LITER,
          },
          affectedVessels: [currentVessel.id, bestVessel.vessel.id],
          before: [{
            vessel: currentVessel.name,
            sequence: [project.name],
            totalDistanceNm: currentDistance,
          }],
          after: [{
            vessel: bestVessel.vessel.name,
            sequence: [project.name],
            totalDistanceNm: newDistance,
          }],
        });

        // Apply the reassignment
        const oldAssignments = optimizedAssignments.get(currentVessel.id) || [];
        optimizedAssignments.set(
          currentVessel.id,
          oldAssignments.filter((a) => a.projectId !== project.id)
        );

        const newAssignments = optimizedAssignments.get(bestVessel.vessel.id) || [];
        const movedAssignment = oldAssignments.find((a) => a.projectId === project.id);
        if (movedAssignment) {
          newAssignments.push(movedAssignment);
          optimizedAssignments.set(bestVessel.vessel.id, newAssignments);
        }
      }
    }
  });

  // Analyze optimized schedules
  const optimizedSchedules: VesselSchedule[] = vessels.map((v) =>
    analyzeVesselSchedule(v, optimizedAssignments.get(v.id) || [])
  );

  // Calculate optimized metrics
  const optimizedMetrics = {
    totalFleetDistanceNm: optimizedSchedules.reduce((sum, s) => sum + s.totalTransitDistanceNm, 0),
    totalFleetFuelLiters: optimizedSchedules.reduce((sum, s) => sum + s.totalFuelLiters, 0),
    totalFleetTransitHours: optimizedSchedules.reduce((sum, s) => sum + s.totalTransitHours, 0),
    totalIdleDays: optimizedSchedules.reduce((sum, s) => sum + s.idleDays, 0),
    averageUtilization: calculateAverageUtilization(optimizedSchedules),
  };

  // Calculate summary
  const summary = {
    totalDistanceSavedNm: originalMetrics.totalFleetDistanceNm - optimizedMetrics.totalFleetDistanceNm,
    totalFuelSavedLiters: originalMetrics.totalFleetFuelLiters - optimizedMetrics.totalFleetFuelLiters,
    totalTimeSavedHours: originalMetrics.totalFleetTransitHours - optimizedMetrics.totalFleetTransitHours,
    totalCostSavedUSD: (originalMetrics.totalFleetFuelLiters - optimizedMetrics.totalFleetFuelLiters) * FUEL_COST_USD_PER_LITER,
    utilizationGainPercent: optimizedMetrics.averageUtilization - originalMetrics.averageUtilization,
  };

  // Add warnings if needed
  if (changes.length === 0) {
    warnings.push('Current schedule is already near-optimal. No significant improvements found.');
  }

  if (summary.totalDistanceSavedNm < 10) {
    warnings.push('Savings are minimal. Schedule may already be well-optimized.');
  }

  return {
    id: `opt-${Date.now()}`,
    timestamp: new Date(),
    originalSchedules,
    originalMetrics,
    optimizedSchedules,
    optimizedMetrics,
    changes,
    summary,
    confidence: calculateConfidence(changes, summary),
    warnings,
  };
}

/**
 * Calculate average utilization across fleet
 */
function calculateAverageUtilization(schedules: VesselSchedule[]): number {
  if (schedules.length === 0) return 0;

  const now = new Date();
  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const periodDays = 30;

  let totalAssignedDays = 0;

  schedules.forEach((schedule) => {
    schedule.assignments.forEach((assignment) => {
      const start = Math.max(assignment.startDate.getTime(), now.getTime());
      const end = Math.min(assignment.endDate.getTime(), thirtyDaysAhead.getTime());
      if (end > start) {
        totalAssignedDays += (end - start) / (1000 * 60 * 60 * 24);
      }
    });
  });

  const maxPossibleDays = schedules.length * periodDays;
  return (totalAssignedDays / maxPossibleDays) * 100;
}

/**
 * Calculate confidence score for optimization
 */
function calculateConfidence(changes: OptimizationChange[], summary: { totalDistanceSavedNm: number; totalCostSavedUSD: number }): number {
  let confidence = 70;

  // More changes = more opportunity = higher confidence
  if (changes.length >= 3) confidence += 10;
  else if (changes.length >= 1) confidence += 5;

  // Significant savings = higher confidence
  if (summary.totalDistanceSavedNm > 100) confidence += 10;
  else if (summary.totalDistanceSavedNm > 50) confidence += 5;

  // Cost savings validation
  if (summary.totalCostSavedUSD > 5000) confidence += 5;

  return Math.min(95, confidence);
}

// ============================================================================
// Formatting Helpers
// ============================================================================

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return `${days}d ${remainingHours}h`;
}

export function formatCurrency(usd: number): string {
  if (usd >= 1000000) return `$${(usd / 1000000).toFixed(1)}M`;
  if (usd >= 1000) return `$${(usd / 1000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

export function formatDistance(nm: number): string {
  if (nm >= 100) return `${nm.toFixed(0)} nm`;
  return `${nm.toFixed(1)} nm`;
}

export function formatFuel(liters: number): string {
  if (liters >= 1000) return `${(liters / 1000).toFixed(1)}K L`;
  return `${liters.toFixed(0)} L`;
}

