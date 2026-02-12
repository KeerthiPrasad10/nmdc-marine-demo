/**
 * Route Optimizer - Multi-stop route optimization and sequencing
 * 
 * Implements algorithms to find optimal ordering of multiple destinations:
 * - Nearest Neighbor heuristic for initial solution
 * - 2-opt improvement for local optimization
 * - Distance matrix caching for efficiency
 */

import { getDatalasticClient, isDatalasticConfigured, calculateDistanceNm } from '@/lib/datalastic';
import { Route, Waypoint, RouteOptimizationRequest, RouteOptimizationResult } from './types';
import { generateRoute, generateAlternativeRoutes, compareRoutes, getRouteWeatherForecast, assessWeatherRisk, VESSEL_PROFILES } from './engine';

// ============================================================================
// Types
// ============================================================================

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  priority?: number; // Higher = more important to visit early
  timeWindowStart?: Date;
  timeWindowEnd?: Date;
}

export interface MultiStopOptimizationRequest {
  vesselId: string;
  vesselName: string;
  vesselType: string;
  origin: Stop;
  stops: Stop[];
  returnToOrigin?: boolean;
  priorities?: {
    distance: number; // 0-100
    time: number; // 0-100
    fuel: number; // 0-100
  };
}

export interface MultiStopOptimizationResult {
  optimizedOrder: Stop[];
  totalDistance: number;
  totalTime: number;
  totalFuel: number;
  routes: Route[];
  savings: {
    distanceSaved: number;
    timeSaved: number;
    fuelSaved: number;
    percentImprovement: number;
  };
}

// ============================================================================
// Distance Matrix
// ============================================================================

type DistanceMatrix = Map<string, Map<string, number>>;

/**
 * Build distance matrix between all stops using Datalastic sea routes
 * Falls back to great-circle distances if API unavailable
 */
async function buildDistanceMatrix(
  stops: Stop[],
  useSeaRoutes: boolean = true
): Promise<DistanceMatrix> {
  const matrix: DistanceMatrix = new Map();
  
  // Initialize matrix
  for (const stop of stops) {
    matrix.set(stop.id, new Map());
  }
  
  // Calculate distances between all pairs
  for (let i = 0; i < stops.length; i++) {
    for (let j = i + 1; j < stops.length; j++) {
      const from = stops[i];
      const to = stops[j];
      
      let distance: number;
      
      if (useSeaRoutes && isDatalasticConfigured()) {
        try {
          const client = getDatalasticClient();
          const response = await client.getSeaRouteByCoordinates(
            from.lat, from.lng, to.lat, to.lng
          );
          distance = response.data.distance;
        } catch {
          // Fallback to great-circle
          distance = calculateDistanceNm(from.lat, from.lng, to.lat, to.lng);
        }
      } else {
        distance = calculateDistanceNm(from.lat, from.lng, to.lat, to.lng);
      }
      
      // Matrix is symmetric
      matrix.get(from.id)!.set(to.id, distance);
      matrix.get(to.id)!.set(from.id, distance);
    }
    
    // Distance to self is 0
    matrix.get(stops[i].id)!.set(stops[i].id, 0);
  }
  
  return matrix;
}

/**
 * Get distance between two stops from the matrix
 */
function getDistance(matrix: DistanceMatrix, fromId: string, toId: string): number {
  return matrix.get(fromId)?.get(toId) ?? Infinity;
}

/**
 * Calculate total route distance for a given order
 */
function calculateTotalDistance(
  order: Stop[],
  matrix: DistanceMatrix,
  returnToOrigin: boolean = false
): number {
  let total = 0;
  
  for (let i = 0; i < order.length - 1; i++) {
    total += getDistance(matrix, order[i].id, order[i + 1].id);
  }
  
  if (returnToOrigin && order.length > 1) {
    total += getDistance(matrix, order[order.length - 1].id, order[0].id);
  }
  
  return total;
}

// ============================================================================
// Optimization Algorithms
// ============================================================================

/**
 * Nearest Neighbor Algorithm
 * Greedy approach: always go to the nearest unvisited stop
 */
function nearestNeighbor(
  origin: Stop,
  stops: Stop[],
  matrix: DistanceMatrix
): Stop[] {
  const result: Stop[] = [origin];
  const unvisited = new Set(stops.map(s => s.id));
  
  let current = origin;
  
  while (unvisited.size > 0) {
    let nearest: Stop | null = null;
    let nearestDist = Infinity;
    
    for (const stopId of unvisited) {
      const dist = getDistance(matrix, current.id, stopId);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = stops.find(s => s.id === stopId)!;
      }
    }
    
    if (nearest) {
      result.push(nearest);
      unvisited.delete(nearest.id);
      current = nearest;
    }
  }
  
  return result;
}

/**
 * 2-opt Improvement
 * Iteratively improves route by reversing segments
 */
function twoOptImprove(
  route: Stop[],
  matrix: DistanceMatrix,
  returnToOrigin: boolean
): Stop[] {
  let improved = true;
  let bestRoute = [...route];
  let bestDistance = calculateTotalDistance(bestRoute, matrix, returnToOrigin);
  
  while (improved) {
    improved = false;
    
    // Try all possible 2-opt swaps (keep origin fixed at position 0)
    for (let i = 1; i < bestRoute.length - 1; i++) {
      for (let j = i + 1; j < bestRoute.length; j++) {
        // Create new route by reversing segment between i and j
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, j + 1).reverse(),
          ...bestRoute.slice(j + 1),
        ];
        
        const newDistance = calculateTotalDistance(newRoute, matrix, returnToOrigin);
        
        if (newDistance < bestDistance) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }
  
  return bestRoute;
}

/**
 * Priority-aware optimization
 * Adjusts order to respect stop priorities while minimizing distance
 */
function applyPriorityConstraints(
  route: Stop[],
  matrix: DistanceMatrix
): Stop[] {
  // Separate origin from stops
  const origin = route[0];
  const stops = route.slice(1);
  
  // Sort stops by priority (higher first), then by distance from origin
  const prioritized = stops.sort((a, b) => {
    const priorityDiff = (b.priority || 0) - (a.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Same priority: prefer closer to origin
    const distA = getDistance(matrix, origin.id, a.id);
    const distB = getDistance(matrix, origin.id, b.id);
    return distA - distB;
  });
  
  return [origin, ...prioritized];
}

// ============================================================================
// Main Optimization Function
// ============================================================================

/**
 * Optimize multi-stop route order
 */
export async function optimizeMultiStopRoute(
  request: MultiStopOptimizationRequest
): Promise<MultiStopOptimizationResult> {
  const { origin, stops, returnToOrigin = false, vesselId, vesselName, vesselType } = request;
  
  // All stops including origin for distance matrix
  const allStops = [origin, ...stops];
  
  // Build distance matrix using sea routes
  console.log('[Optimizer] Building distance matrix for', allStops.length, 'stops');
  const matrix = await buildDistanceMatrix(allStops, true);
  
  // Calculate original (unoptimized) distance
  const originalOrder = [origin, ...stops];
  const originalDistance = calculateTotalDistance(originalOrder, matrix, returnToOrigin);
  
  // Step 1: Get initial solution using Nearest Neighbor
  const nnRoute = nearestNeighbor(origin, stops, matrix);
  
  // Step 2: Improve with 2-opt
  const optimizedRoute = twoOptImprove(nnRoute, matrix, returnToOrigin);
  
  // Step 3: Apply priority constraints if any stops have priorities
  const hasPriorities = stops.some(s => s.priority !== undefined);
  const finalOrder = hasPriorities
    ? applyPriorityConstraints(optimizedRoute, matrix)
    : optimizedRoute;
  
  // Calculate optimized distance
  const optimizedDistance = calculateTotalDistance(finalOrder, matrix, returnToOrigin);
  
  // Get vessel profile for time/fuel calculations
  const profile = VESSEL_PROFILES[vesselType] || VESSEL_PROFILES.default;
  
  // Calculate times
  const originalTime = originalDistance / profile.cruisingSpeed;
  const optimizedTime = optimizedDistance / profile.cruisingSpeed;
  
  // Calculate fuel
  const originalFuel = originalDistance * profile.fuelConsumptionRate;
  const optimizedFuel = optimizedDistance * profile.fuelConsumptionRate;
  
  // Generate actual routes between optimized stops
  const routes: Route[] = [];
  for (let i = 0; i < finalOrder.length - 1; i++) {
    const from = finalOrder[i];
    const to = finalOrder[i + 1];
    
    const route = await generateRoute(
      vesselId,
      vesselName,
      vesselType,
      { lat: from.lat, lng: from.lng, name: from.name },
      { lat: to.lat, lng: to.lng, name: to.name },
      { routeName: `Leg ${i + 1}: ${from.name} → ${to.name}` }
    );
    routes.push(route);
  }
  
  // Add return leg if requested
  if (returnToOrigin && finalOrder.length > 1) {
    const lastStop = finalOrder[finalOrder.length - 1];
    const returnRoute = await generateRoute(
      vesselId,
      vesselName,
      vesselType,
      { lat: lastStop.lat, lng: lastStop.lng, name: lastStop.name },
      { lat: origin.lat, lng: origin.lng, name: origin.name },
      { routeName: `Return: ${lastStop.name} → ${origin.name}` }
    );
    routes.push(returnRoute);
  }
  
  return {
    optimizedOrder: finalOrder,
    totalDistance: optimizedDistance,
    totalTime: optimizedTime,
    totalFuel: optimizedFuel,
    routes,
    savings: {
      distanceSaved: originalDistance - optimizedDistance,
      timeSaved: originalTime - optimizedTime,
      fuelSaved: originalFuel - optimizedFuel,
      percentImprovement: ((originalDistance - optimizedDistance) / originalDistance) * 100,
    },
  };
}

// ============================================================================
// Single Route Optimization (with priorities)
// ============================================================================

/**
 * Optimize a single route based on priorities
 * Returns recommended route with alternatives
 */
export async function optimizeSingleRoute(
  request: RouteOptimizationRequest,
  vesselName: string,
  vesselType: string
): Promise<RouteOptimizationResult> {
  const { vesselId, origin, destination, priorities } = request;
  
  // Generate alternative routes
  const alternatives = await generateAlternativeRoutes(
    vesselId,
    vesselName,
    vesselType,
    origin,
    destination
  );
  
  // Score routes based on priorities
  const scoreRoute = (route: Route): number => {
    let score = 0;
    
    // Normalize metrics for scoring (lower is better for all)
    const timeScore = 1 / (route.estimatedTime + 1);
    const fuelScore = 1 / (route.fuelConsumption + 1);
    const emissionsScore = 1 / (route.emissions.co2 + 1);
    const costScore = 1 / (route.cost + 1);
    const safetyScore = 1 / (route.weatherRisk + 1);
    
    score += timeScore * (priorities?.time || 50);
    score += fuelScore * (priorities?.fuel || 50);
    score += emissionsScore * (priorities?.emissions || 50);
    score += costScore * (priorities?.cost || 50);
    score += safetyScore * (priorities?.safety || 50);
    
    return score;
  };
  
  // Score all alternatives
  const scoredRoutes = [
    { route: alternatives.fastest, score: scoreRoute(alternatives.fastest) },
    { route: alternatives.economical, score: scoreRoute(alternatives.economical) },
    { route: alternatives.balanced, score: scoreRoute(alternatives.balanced) },
  ].sort((a, b) => b.score - a.score);
  
  const recommendedRoute = scoredRoutes[0].route;
  const alternativeRoutes = scoredRoutes.slice(1).map(s => s.route);
  
  // Get weather forecast along route
  const seaWaypoints = recommendedRoute.segments.flatMap(s => [
    { lat: s.from.lat, lon: s.from.lng },
    { lat: s.to.lat, lon: s.to.lng },
  ]);
  const weatherForecast = getRouteWeatherForecast(seaWaypoints);
  
  // Calculate comparison with direct route
  const directRoute = alternatives.balanced; // Use balanced as baseline
  const comparison = compareRoutes(recommendedRoute, directRoute);
  
  // Risk assessment
  const riskFactors: Array<{ factor: string; severity: 'low' | 'medium' | 'high'; description: string }> = [];
  
  // Check weather risks
  const highRiskSegments = recommendedRoute.segments.filter(s => s.weatherRisk > 60);
  if (highRiskSegments.length > 0) {
    riskFactors.push({
      factor: 'Weather',
      severity: highRiskSegments.some(s => s.weatherRisk > 80) ? 'high' : 'medium',
      description: `${highRiskSegments.length} segment(s) with elevated weather risk`,
    });
  }
  
  // Check fuel level requirements
  if (recommendedRoute.fuelConsumption > 5000) {
    riskFactors.push({
      factor: 'Fuel',
      severity: recommendedRoute.fuelConsumption > 10000 ? 'high' : 'medium',
      description: `High fuel consumption: ${Math.round(recommendedRoute.fuelConsumption)} liters required`,
    });
  }
  
  // Check voyage duration
  if (recommendedRoute.estimatedTime > 48) {
    riskFactors.push({
      factor: 'Duration',
      severity: recommendedRoute.estimatedTime > 72 ? 'high' : 'medium',
      description: `Long voyage: ${Math.round(recommendedRoute.estimatedTime)} hours`,
    });
  }
  
  const overallRisk = Math.round(
    riskFactors.reduce((sum, f) => {
      const severityScore = f.severity === 'high' ? 30 : f.severity === 'medium' ? 20 : 10;
      return sum + severityScore;
    }, 0) / Math.max(riskFactors.length, 1)
  );
  
  return {
    recommendedRoute,
    alternatives: alternativeRoutes,
    comparison: {
      vsDirectRoute: {
        distanceDiff: comparison.distanceDiff,
        timeDiff: comparison.timeDiff,
        fuelSavings: comparison.fuelSavings,
        emissionsSavings: comparison.emissionsSavings,
      },
    },
    weatherForecast,
    riskAssessment: {
      overallRisk: Math.min(overallRisk, 100),
      factors: riskFactors,
    },
  };
}













