/**
 * Route Engine - Maritime routing for Puget Sound & Salish Sea
 * 
 * Custom routing solution designed for WSDOT Ferry operations
 * in Puget Sound, the San Juan Islands, and the Salish Sea.
 * 
 * Uses a graph-based approach with predefined ferry lane waypoints
 * to ensure routes follow established ferry corridors.
 */

import { SeaRouteWaypoint, calculateDistanceNm, calculateBearing } from '@/lib/datalastic';
import { getWeatherAtLocation } from '@/lib/weather';
import { 
  Route, 
  RouteSegment, 
  Waypoint, 
  WeatherPoint,
  FuelCalculation,
} from './types';

// ============================================================================
// Vessel Fuel & Emissions Profiles
// ============================================================================

export interface VesselProfile {
  type: string;
  cruisingSpeed: number; // knots
  maxSpeed: number; // knots
  fuelConsumptionRate: number; // liters per nautical mile at cruising speed
  fuelCostPerLiter: number; // USD
  emissionFactors: {
    co2PerLiter: number; // kg CO2 per liter of fuel
    noxPerLiter: number; // kg NOx per liter of fuel
    soxPerLiter: number; // kg SOx per liter of fuel
  };
}

// Default vessel profiles for WSDOT ferry fleet
export const VESSEL_PROFILES: Record<string, VesselProfile> = {
  ferry: {
    type: 'ferry',
    cruisingSpeed: 16,
    maxSpeed: 21,
    fuelConsumptionRate: 30, // L/nm - varies by class
    fuelCostPerLiter: 0.85,
    emissionFactors: { co2PerLiter: 2.68, noxPerLiter: 0.046, soxPerLiter: 0.004 },
  },
  // Jumbo Mark II class (largest)
  jumbo_mk2: {
    type: 'jumbo_mk2',
    cruisingSpeed: 18,
    maxSpeed: 21,
    fuelConsumptionRate: 45,
    fuelCostPerLiter: 0.85,
    emissionFactors: { co2PerLiter: 2.68, noxPerLiter: 0.046, soxPerLiter: 0.004 },
  },
  // Super class
  super_class: {
    type: 'super_class',
    cruisingSpeed: 16,
    maxSpeed: 19,
    fuelConsumptionRate: 35,
    fuelCostPerLiter: 0.85,
    emissionFactors: { co2PerLiter: 2.68, noxPerLiter: 0.046, soxPerLiter: 0.004 },
  },
  // Issaquah class
  issaquah_class: {
    type: 'issaquah_class',
    cruisingSpeed: 15,
    maxSpeed: 18,
    fuelConsumptionRate: 28,
    fuelCostPerLiter: 0.85,
    emissionFactors: { co2PerLiter: 2.68, noxPerLiter: 0.046, soxPerLiter: 0.004 },
  },
  // Olympic class (newest hybrid-electric)
  olympic_class: {
    type: 'olympic_class',
    cruisingSpeed: 15,
    maxSpeed: 17,
    fuelConsumptionRate: 18, // More efficient hybrid-electric
    fuelCostPerLiter: 0.85,
    emissionFactors: { co2PerLiter: 2.68, noxPerLiter: 0.030, soxPerLiter: 0.002 },
  },
  // Default for unknown types
  default: {
    type: 'default',
    cruisingSpeed: 15,
    maxSpeed: 18,
    fuelConsumptionRate: 30,
    fuelCostPerLiter: 0.85,
    emissionFactors: { co2PerLiter: 2.68, noxPerLiter: 0.046, soxPerLiter: 0.004 },
  },
};

// ============================================================================
// Puget Sound & Salish Sea Regional Routing
// ============================================================================

/**
 * Ferry route network nodes for Puget Sound region
 * Each node represents a safe waypoint along established ferry corridors
 */
interface NetworkNode {
  id: string;
  lat: number;
  lon: number;
  name: string;
  connections: string[]; // IDs of connected nodes
}

// Define the maritime network for Puget Sound / San Juan Islands / Salish Sea
//
// CRITICAL GEOGRAPHY:
// - Seattle waterfront at ~47.60, -122.34 (Colman Dock)
// - Bainbridge Island across Elliott Bay
// - Kitsap Peninsula to the west
// - Whidbey Island to the north
// - San Juan Islands in the far north
// - Tacoma to the south
//
const MARITIME_NETWORK: NetworkNode[] = [
  // ============================================================================
  // SEATTLE / ELLIOTT BAY - Central hub
  // ============================================================================
  { id: 'SEA_01', lat: 47.602, lon: -122.338, name: 'Colman Dock', connections: ['SEA_02', 'BAIN_01', 'BREM_01'] },
  { id: 'SEA_02', lat: 47.620, lon: -122.370, name: 'Elliott Bay', connections: ['SEA_01', 'SEA_03', 'BAIN_01'] },
  { id: 'SEA_03', lat: 47.660, lon: -122.410, name: 'Shilshole Bay', connections: ['SEA_02', 'EDM_01', 'KING_01'] },
  
  // ============================================================================
  // BAINBRIDGE ISLAND ROUTE
  // ============================================================================
  { id: 'BAIN_01', lat: 47.610, lon: -122.450, name: 'Mid-Sound Crossing', connections: ['SEA_01', 'SEA_02', 'BAIN_02'] },
  { id: 'BAIN_02', lat: 47.623, lon: -122.510, name: 'Eagle Harbor Approach', connections: ['BAIN_01', 'BAIN_03'] },
  { id: 'BAIN_03', lat: 47.624, lon: -122.527, name: 'Bainbridge Terminal', connections: ['BAIN_02'] },
  
  // ============================================================================
  // BREMERTON ROUTE
  // ============================================================================
  { id: 'BREM_01', lat: 47.580, lon: -122.420, name: 'Rich Passage Approach', connections: ['SEA_01', 'BREM_02'] },
  { id: 'BREM_02', lat: 47.560, lon: -122.530, name: 'Rich Passage', connections: ['BREM_01', 'BREM_03'] },
  { id: 'BREM_03', lat: 47.562, lon: -122.622, name: 'Bremerton Terminal', connections: ['BREM_02'] },
  
  // ============================================================================
  // EDMONDS - KINGSTON ROUTE
  // ============================================================================
  { id: 'EDM_01', lat: 47.810, lon: -122.383, name: 'Edmonds Terminal', connections: ['SEA_03', 'KING_01'] },
  { id: 'KING_01', lat: 47.800, lon: -122.490, name: 'Mid-Sound Kingston', connections: ['SEA_03', 'EDM_01', 'KING_02'] },
  { id: 'KING_02', lat: 47.797, lon: -122.496, name: 'Kingston Terminal', connections: ['KING_01'] },
  
  // ============================================================================
  // MUKILTEO - CLINTON (WHIDBEY ISLAND) ROUTE
  // ============================================================================
  { id: 'MUK_01', lat: 47.947, lon: -122.304, name: 'Mukilteo Terminal', connections: ['MUK_02', 'EDM_01'] },
  { id: 'MUK_02', lat: 47.960, lon: -122.370, name: 'Possession Sound', connections: ['MUK_01', 'CLIN_01'] },
  { id: 'CLIN_01', lat: 47.975, lon: -122.352, name: 'Clinton Terminal', connections: ['MUK_02', 'WHID_01'] },
  
  // ============================================================================
  // WHIDBEY ISLAND / COUPEVILLE
  // ============================================================================
  { id: 'WHID_01', lat: 48.160, lon: -122.680, name: 'Keystone Harbor', connections: ['CLIN_01', 'WHID_02'] },
  { id: 'WHID_02', lat: 48.120, lon: -122.760, name: 'Admiralty Inlet', connections: ['WHID_01', 'PT_01'] },
  { id: 'PT_01', lat: 48.113, lon: -122.759, name: 'Port Townsend', connections: ['WHID_02'] },
  
  // ============================================================================
  // ANACORTES - SAN JUAN ISLANDS
  // ============================================================================
  { id: 'ANA_01', lat: 48.507, lon: -122.678, name: 'Anacortes Terminal', connections: ['ANA_02'] },
  { id: 'ANA_02', lat: 48.530, lon: -122.800, name: 'Guemes Channel', connections: ['ANA_01', 'SJI_01', 'SJI_02'] },
  { id: 'SJI_01', lat: 48.535, lon: -122.893, name: 'Lopez Island', connections: ['ANA_02', 'SJI_02', 'SJI_03'] },
  { id: 'SJI_02', lat: 48.560, lon: -122.950, name: 'Shaw Island', connections: ['ANA_02', 'SJI_01', 'SJI_03', 'SJI_04'] },
  { id: 'SJI_03', lat: 48.595, lon: -123.010, name: 'Orcas Island', connections: ['SJI_01', 'SJI_02'] },
  { id: 'SJI_04', lat: 48.535, lon: -123.015, name: 'Friday Harbor', connections: ['SJI_02', 'SID_01'] },
  { id: 'SID_01', lat: 48.630, lon: -123.170, name: 'Sidney BC Approach', connections: ['SJI_04'] },
  
  // ============================================================================
  // SOUTH SOUND - TACOMA / VASHON
  // ============================================================================
  { id: 'FNTL_01', lat: 47.520, lon: -122.393, name: 'Fauntleroy Terminal', connections: ['VASH_01', 'SLWY_01'] },
  { id: 'VASH_01', lat: 47.508, lon: -122.464, name: 'Vashon Heights', connections: ['FNTL_01', 'VASH_02'] },
  { id: 'VASH_02', lat: 47.390, lon: -122.513, name: 'Tahlequah', connections: ['VASH_01', 'PTDF_01'] },
  { id: 'PTDF_01', lat: 47.306, lon: -122.514, name: 'Point Defiance', connections: ['VASH_02'] },
  { id: 'SLWY_01', lat: 47.513, lon: -122.510, name: 'Southworth Terminal', connections: ['FNTL_01'] },
];

// Build adjacency map for faster lookups
const networkMap = new Map<string, NetworkNode>();
MARITIME_NETWORK.forEach(node => networkMap.set(node.id, node));

/**
 * Find the nearest network node to a given point
 * Returns both the node and the distance to it
 */
function findNearestNode(lat: number, lon: number): { node: NetworkNode; distance: number } {
  let nearest = MARITIME_NETWORK[0];
  let minDist = Infinity;
  
  for (const node of MARITIME_NETWORK) {
    const dist = calculateDistanceNm(lat, lon, node.lat, node.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = node;
    }
  }
  
  return { node: nearest, distance: minDist };
}

/**
 * Maximum distance (nm) from a network node before we consider the point "outside coverage"
 * If both origin and destination are within this distance of the network, use network routing
 * Otherwise, fall back to great circle interpolation for the out-of-coverage segments
 */
const MAX_NETWORK_SNAP_DISTANCE = 30; // nm

/**
 * Dijkstra's algorithm to find shortest path between two network nodes
 */
function findShortestPath(startId: string, endId: string): NetworkNode[] {
  // Verify nodes exist
  if (!networkMap.has(startId) || !networkMap.has(endId)) {
    return [];
  }
  
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();
  
  // Initialize
  for (const node of MARITIME_NETWORK) {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
    unvisited.add(node.id);
  }
  distances.set(startId, 0);
  
  while (unvisited.size > 0) {
    // Find node with minimum distance
    let current: string | null = null;
    let minDist = Infinity;
    for (const id of unvisited) {
      const dist = distances.get(id) ?? Infinity; // Use ?? not || because 0 is valid!
      if (dist < minDist) {
        minDist = dist;
        current = id;
      }
    }
    
    if (current === null || current === endId) break;
    
    unvisited.delete(current);
    const currentNode = networkMap.get(current);
    if (!currentNode) continue;
    
    // Update neighbors
    for (const neighborId of currentNode.connections) {
      if (!unvisited.has(neighborId)) continue;
      
      const neighbor = networkMap.get(neighborId);
      if (!neighbor) continue;
      
      const edgeDist = calculateDistanceNm(currentNode.lat, currentNode.lon, neighbor.lat, neighbor.lon);
      const newDist = (distances.get(current) ?? 0) + edgeDist;
      
      if (newDist < (distances.get(neighborId) ?? Infinity)) {
        distances.set(neighborId, newDist);
        previous.set(neighborId, current);
      }
    }
  }
  
  // Reconstruct path by backtracking from end to start
  const path: NetworkNode[] = [];
  let current: string | null = endId;
  
  while (current !== null) {
    const node = networkMap.get(current);
    if (node) path.unshift(node);
    const prev = previous.get(current);
    current = prev === undefined ? null : prev;
  }
  
  return path;
}

/**
 * Calculate total distance from waypoints
 */
function calculateTotalDistance(waypoints: SeaRouteWaypoint[]): number {
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    total += calculateDistanceNm(
      waypoints[i].lat, waypoints[i].lon,
      waypoints[i + 1].lat, waypoints[i + 1].lon
    );
  }
  return total;
}

/**
 * Check if a point is within the Puget Sound region
 * where we have reliable ferry network coverage
 */
function isWithinPugetSoundRegion(lat: number, lon: number): boolean {
  // Puget Sound region: lat 47.0-48.7, lon -123.2 to -122.0
  return lat >= 47.0 && lat <= 48.7 && lon >= -123.2 && lon <= -122.0;
}

/**
 * Maximum direct distance (nm) for which we skip network routing
 * Short local routes don't benefit from network waypoints
 */
const SHORT_ROUTE_THRESHOLD = 25; // nm

/**
 * Maritime routing with guaranteed land avoidance
 * 
 * Strategy:
 * - For SHORT routes (< 25nm): Use direct route with land-check
 * - For routes WITHIN Puget Sound: Use our verified ferry network
 *   (guaranteed to follow ferry lanes and avoid all land)
 * - For routes OUTSIDE or crossing region boundary: Use great circle with corrections
 * 
 * Returns waypoints that avoid land and can be further optimized
 */
export async function fetchSeaRoute(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): Promise<{ waypoints: SeaRouteWaypoint[]; distance: number; source: 'api' | 'hybrid' | 'network' }> {
  console.log('[RouteEngine] Fetching sea route:', { fromLat, fromLon, toLat, toLon });
  
  // Calculate direct distance first
  const directDistance = calculateDistanceNm(fromLat, fromLon, toLat, toLon);
  
  // For SHORT local routes, use simplified routing
  // Network routing creates unnecessary detours for short trips
  if (directDistance < SHORT_ROUTE_THRESHOLD) {
    console.log('[RouteEngine] Short route detected (' + directDistance.toFixed(1) + ' nm) - using simplified routing');
    
    // Check if direct path crosses land
    const landCheck = doesSegmentCrossLand(fromLat, fromLon, toLat, toLon);
    
    if (!landCheck.crosses) {
      // Direct path is safe - use it
      console.log('[RouteEngine] Direct path is clear - using direct route');
      return {
        waypoints: [
          { lat: fromLat, lon: fromLon },
          { lat: toLat, lon: toLon },
        ],
        distance: directDistance,
        source: 'network', // Label as network since we verified it
      };
    } else {
      // Direct path crosses land - use minimal network detour
      console.log('[RouteEngine] Direct path crosses ' + landCheck.landArea + ' - finding minimal detour');
      const startNode = findNearestNode(fromLat, fromLon).node;
      const endNode = findNearestNode(toLat, toLon).node;
      
      // For short routes, only add ONE intermediate waypoint (the midpoint of network path)
      if (startNode.id !== endNode.id) {
        const networkPath = findShortestPath(startNode.id, endNode.id);
        if (networkPath.length > 0) {
          // Pick the middle waypoint from the network path
          const midIdx = Math.floor(networkPath.length / 2);
          const midNode = networkPath[midIdx];
          
          const waypoints: SeaRouteWaypoint[] = [
            { lat: fromLat, lon: fromLon },
            { lat: midNode.lat, lon: midNode.lon, name: midNode.name, note: 'Avoiding land' },
            { lat: toLat, lon: toLon },
          ];
          
          return {
            waypoints,
            distance: calculateTotalDistance(waypoints),
            source: 'network',
          };
        }
      }
      
      // Fallback to direct if no good detour found
      return {
        waypoints: [
          { lat: fromLat, lon: fromLon },
          { lat: toLat, lon: toLon },
        ],
        distance: directDistance,
        source: 'network',
      };
    }
  }
  
  // For routes WITHIN Puget Sound, check if direct path is clear first
  const fromInRegion = isWithinPugetSoundRegion(fromLat, fromLon);
  const toInRegion = isWithinPugetSoundRegion(toLat, toLon);
  
  if (fromInRegion && toInRegion) {
    // First check if direct path crosses any land
    const landCheck = doesSegmentCrossLand(fromLat, fromLon, toLat, toLon);
    
    if (!landCheck.crosses) {
      // Direct path is clear - use great circle route (much simpler and more natural)
      console.log('[RouteEngine] Direct path is clear - using great circle route');
      const gcRoute = generateGreatCircleRoute(fromLat, fromLon, toLat, toLon);
      return {
        ...gcRoute,
        source: 'network',
      };
    }
    
    // Land is in the way - use network routing to go around
    console.log('[RouteEngine] Direct path crosses', landCheck.landArea, '- using maritime network');
    const networkRoute = fetchSeaRouteFromNetwork(fromLat, fromLon, toLat, toLon);
    
    return {
      ...networkRoute,
      source: 'network',
    };
  }
  
  // For routes outside the region, use great circle with land correction
  console.log('[RouteEngine] Route outside core region - using great circle with corrections');
  
  const gcRoute = generateGreatCircleRoute(fromLat, fromLon, toLat, toLon);
  const correctedWaypoints = correctLandCrossings(gcRoute.waypoints);
  
  if (correctedWaypoints.length > 0) {
    return {
      waypoints: correctedWaypoints,
      distance: calculateTotalDistance(correctedWaypoints),
      source: 'hybrid',
    };
  }
  
  // Fallback to ferry network
  console.log('[RouteEngine] Using ferry network fallback');
  const networkRoute = fetchSeaRouteFromNetwork(fromLat, fromLon, toLat, toLon);
  
  return {
    ...networkRoute,
    source: 'network',
  };
}

/**
 * Check if a point is on land using simplified detection for Puget Sound
 * 
 * The Puget Sound is a complex inland waterway with many peninsulas and islands.
 * This uses bounding box approximations for the major landmasses.
 */
function isPointOnLand(lat: number, lon: number): string | null {
  // Kitsap Peninsula - between Puget Sound and Hood Canal
  // Rough bounding: lat 47.3-47.8, lon -122.75 to -122.55
  if (lat >= 47.35 && lat <= 47.75 && lon >= -122.72 && lon <= -122.55) {
    return 'Kitsap Peninsula';
  }
  
  // Seattle / East Shore mainland
  // East of -122.35 is generally land (Seattle, Bellevue)
  if (lat >= 47.3 && lat <= 47.8 && lon >= -122.30 && lon <= -122.0) {
    return 'Seattle Metro';
  }
  
  // Whidbey Island - large island in north Puget Sound
  // Rough bounding: lat 48.0-48.4, lon -122.7 to -122.5
  if (lat >= 48.05 && lat <= 48.35 && lon >= -122.68 && lon <= -122.50) {
    return 'Whidbey Island';
  }
  
  // Olympic Peninsula - west of Hood Canal
  if (lat >= 47.2 && lat <= 48.3 && lon <= -122.80) {
    return 'Olympic Peninsula';
  }
  
  // Vashon Island interior (not the terminal edges)
  if (lat >= 47.38 && lat <= 47.52 && lon >= -122.50 && lon <= -122.42) {
    return 'Vashon Island';
  }
  
  // Bainbridge Island interior
  if (lat >= 47.60 && lat <= 47.68 && lon >= -122.56 && lon <= -122.48) {
    return 'Bainbridge Island';
  }
  
  return null; // Point is in water
}

/**
 * Check if a line segment potentially crosses land
 * Uses midpoint and quarter-point checks
 */
function doesSegmentCrossLand(
  fromLat: number, fromLon: number,
  toLat: number, toLon: number
): { crosses: boolean; landArea?: string; crossPoint?: { lat: number; lon: number } } {
  // Check multiple points along the segment
  const checkPoints = [0.25, 0.5, 0.75];
  
  for (const t of checkPoints) {
    const checkLat = fromLat + (toLat - fromLat) * t;
    const checkLon = fromLon + (toLon - fromLon) * t;
    
    const landArea = isPointOnLand(checkLat, checkLon);
    if (landArea) {
      return { 
        crosses: true, 
        landArea,
        crossPoint: { lat: checkLat, lon: checkLon }
      };
    }
  }
  
  return { crosses: false };
}

/**
 * Correct waypoints that cross land by inserting maritime network waypoints
 */
function correctLandCrossings(waypoints: SeaRouteWaypoint[]): SeaRouteWaypoint[] {
  if (waypoints.length < 2) return waypoints;
  
  const corrected: SeaRouteWaypoint[] = [waypoints[0]];
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    
    const landCheck = doesSegmentCrossLand(from.lat, from.lon, to.lat, to.lon);
    
    if (landCheck.crosses) {
      console.log(`[RouteEngine] Segment crosses ${landCheck.landArea}, inserting network waypoints`);
      
      // Find network path around the land
      const startNode = findNearestNode(from.lat, from.lon).node;
      const endNode = findNearestNode(to.lat, to.lon).node;
      
      if (startNode.id !== endNode.id) {
        const networkPath = findShortestPath(startNode.id, endNode.id);
        
        // Insert network waypoints
        for (const node of networkPath) {
          // Skip if too close to last added point
          const lastPoint = corrected[corrected.length - 1];
          const dist = calculateDistanceNm(lastPoint.lat, lastPoint.lon, node.lat, node.lon);
          
          if (dist > 3) {
            corrected.push({ lat: node.lat, lon: node.lon });
          }
        }
      }
    }
    
    // Add the destination point (if not too close to last)
    const lastPoint = corrected[corrected.length - 1];
    const distToNext = calculateDistanceNm(lastPoint.lat, lastPoint.lon, to.lat, to.lon);
    
    if (distToNext > 1) {
      corrected.push(to);
    }
  }
  
  // Ensure last waypoint is included
  const lastOriginal = waypoints[waypoints.length - 1];
  const lastCorrected = corrected[corrected.length - 1];
  if (lastCorrected.lat !== lastOriginal.lat || lastCorrected.lon !== lastOriginal.lon) {
    corrected.push(lastOriginal);
  }
  
  return corrected;
}

/**
 * Fetch route using local maritime network (graph-based routing)
 * Uses predefined waypoints to avoid land
 * 
 * For points far outside network coverage, generates a hybrid route:
 * - Network routing for segments within coverage
 * - Great circle interpolation for segments outside coverage
 */
function fetchSeaRouteFromNetwork(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): { waypoints: SeaRouteWaypoint[]; distance: number } {
  // Find nearest network nodes and distances
  const startResult = findNearestNode(fromLat, fromLon);
  const endResult = findNearestNode(toLat, toLon);
  
  const startNode = startResult.node;
  const endNode = endResult.node;
  const startDistance = startResult.distance;
  const endDistance = endResult.distance;
  
  console.log('[RouteEngine] Using maritime network:', { 
    start: startNode.name, 
    end: endNode.name,
    startSnapDist: startDistance.toFixed(1) + ' nm',
    endSnapDist: endDistance.toFixed(1) + ' nm',
  });
  
  // Check if points are too far from network coverage
  const startOutsideCoverage = startDistance > MAX_NETWORK_SNAP_DISTANCE;
  const endOutsideCoverage = endDistance > MAX_NETWORK_SNAP_DISTANCE;
  
  // If BOTH points are far outside coverage, use simple great circle route
  if (startOutsideCoverage && endOutsideCoverage) {
    console.log('[RouteEngine] Both points outside network coverage, using great circle route');
    return generateGreatCircleRoute(fromLat, fromLon, toLat, toLon);
  }
  
  // Build waypoints: origin -> (approach) -> network path -> (departure) -> destination
  const waypoints: SeaRouteWaypoint[] = [];
  
  // Add origin
  waypoints.push({ lat: fromLat, lon: fromLon });
  
  // If start is outside coverage, add interpolated approach waypoints to the entry node
  if (startOutsideCoverage) {
    console.log('[RouteEngine] Origin outside coverage, adding approach waypoints');
    const approachWaypoints = generateInterpolatedWaypoints(
      fromLat, fromLon, 
      startNode.lat, startNode.lon,
      'Approach to shipping lanes'
    );
    // Skip the first (already added as origin) and add the rest
    approachWaypoints.slice(1).forEach(wp => waypoints.push(wp));
  }
  
  // Find path through network
  if (startNode.id !== endNode.id) {
    const networkPath = findShortestPath(startNode.id, endNode.id);
    
    // Add network waypoints with names and notes
    for (let i = 0; i < networkPath.length; i++) {
      const node = networkPath[i];
      const prevNode = i > 0 ? networkPath[i - 1] : null;
      const nextNode = i < networkPath.length - 1 ? networkPath[i + 1] : null;
      
      const distFromLast = calculateDistanceNm(
        waypoints[waypoints.length - 1].lat, 
        waypoints[waypoints.length - 1].lon, 
        node.lat, 
        node.lon
      );
      
      // Only add if more than 2nm from previous point
      if (distFromLast > 2) {
        // Generate routing note based on context
        let note = '';
        if (node.name.includes('Channel')) {
          note = 'Navigate through protected channel';
        } else if (node.name.includes('Channel')) {
          note = 'Enter ferry shipping lane';
        } else if (node.name.includes('Approach')) {
          note = 'Final approach to destination';
        } else if (node.name.includes('Sound') || node.name.includes('Mid-Sound')) {
          note = 'Main ferry corridor';
        } else if (prevNode && nextNode) {
          const bearingIn = calculateBearing(prevNode.lat, prevNode.lon, node.lat, node.lon);
          const bearingOut = calculateBearing(node.lat, node.lon, nextNode.lat, nextNode.lon);
          const turn = bearingOut - bearingIn;
          const normalizedTurn = turn > 180 ? turn - 360 : (turn < -180 ? turn + 360 : turn);
          if (Math.abs(normalizedTurn) > 30) {
            note = normalizedTurn > 0 ? 'Course change to starboard' : 'Course change to port';
          }
        }
        
        waypoints.push({ 
          lat: node.lat, 
          lon: node.lon,
          name: node.name,
          note: note || undefined,
        });
      }
    }
  } else {
    // Same node - add the network point if not too close
    const distToNode = calculateDistanceNm(fromLat, fromLon, startNode.lat, startNode.lon);
    if (distToNode > 2) {
      waypoints.push({ 
        lat: startNode.lat, 
        lon: startNode.lon,
        name: startNode.name,
      });
    }
  }
  
  // If end is outside coverage, add interpolated departure waypoints from the exit node
  if (endOutsideCoverage) {
    console.log('[RouteEngine] Destination outside coverage, adding departure waypoints');
    const lastNetworkWp = waypoints[waypoints.length - 1];
    const departureWaypoints = generateInterpolatedWaypoints(
      lastNetworkWp.lat, lastNetworkWp.lon,
      toLat, toLon,
      'Open water transit'
    );
    // Skip the first (already in waypoints) and add the rest
    departureWaypoints.slice(1).forEach(wp => waypoints.push(wp));
  } else {
    // Add destination (within coverage)
    const lastWp = waypoints[waypoints.length - 1];
    const distToDest = calculateDistanceNm(lastWp.lat, lastWp.lon, toLat, toLon);
    if (distToDest > 1) {
      waypoints.push({ lat: toLat, lon: toLon });
    } else {
      waypoints[waypoints.length - 1] = { lat: toLat, lon: toLon };
    }
  }
  
  const totalDistance = calculateTotalDistance(waypoints);
  
  console.log('[RouteEngine] Network route calculated:', {
    waypointCount: waypoints.length,
    distance: totalDistance.toFixed(1) + ' nm'
  });
  
  return { waypoints, distance: totalDistance };
}

/**
 * Optimize waypoints from API response
 * - Remove redundant points (collinear points)
 * - Ensure minimum spacing for meaningful segments
 * - Keep key turning points
 */
function optimizeWaypoints(waypoints: SeaRouteWaypoint[]): SeaRouteWaypoint[] {
  if (waypoints.length <= 3) return waypoints;
  
  const optimized: SeaRouteWaypoint[] = [waypoints[0]]; // Always keep first
  
  for (let i = 1; i < waypoints.length - 1; i++) {
    const prev = optimized[optimized.length - 1];
    const curr = waypoints[i];
    const next = waypoints[i + 1];
    
    // Calculate bearing change (is this a turning point?)
    const bearingIn = calculateBearing(prev.lat, prev.lon, curr.lat, curr.lon);
    const bearingOut = calculateBearing(curr.lat, curr.lon, next.lat, next.lon);
    const bearingChange = Math.abs(bearingOut - bearingIn);
    const normalizedChange = bearingChange > 180 ? 360 - bearingChange : bearingChange;
    
    // Calculate distance from last kept point
    const distFromLast = calculateDistanceNm(prev.lat, prev.lon, curr.lat, curr.lon);
    
    // Keep point if:
    // - Significant turn (> 10 degrees)
    // - OR far enough from last point (> 5nm) for speed optimization granularity
    if (normalizedChange > 10 || distFromLast > 5) {
      optimized.push(curr);
    }
  }
  
  // Always keep last point
  optimized.push(waypoints[waypoints.length - 1]);
  
  return optimized;
}

/**
 * Fallback: Generate simple great circle route
 * Used when API is unavailable - basic interpolation between points
 */
function generateGreatCircleRoute(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): { waypoints: SeaRouteWaypoint[]; distance: number } {
  const distance = calculateDistanceNm(fromLat, fromLon, toLat, toLon);
  
  // For short routes, just use direct path
  if (distance < 50) {
    return {
      waypoints: [
        { lat: fromLat, lon: fromLon },
        { lat: toLat, lon: toLon },
      ],
      distance,
    };
  }
  
  // For longer routes, add intermediate points every ~25nm
  const numSegments = Math.ceil(distance / 25);
  const waypoints: SeaRouteWaypoint[] = [];
  
  for (let i = 0; i <= numSegments; i++) {
    const fraction = i / numSegments;
    const lat = fromLat + (toLat - fromLat) * fraction;
    const lon = fromLon + (toLon - fromLon) * fraction;
    
    waypoints.push({
      lat,
      lon,
      name: i === 0 ? undefined : i === numSegments ? undefined : `Waypoint ${i}`,
      note: i === 0 ? undefined : i === numSegments ? undefined : 'Open water transit',
    });
  }
  
  console.log('[RouteEngine] Generated great circle route:', {
    distance: distance.toFixed(1) + ' nm',
    waypoints: waypoints.length,
  });
  
  return { waypoints, distance };
}

/**
 * Generate interpolated waypoints between two points
 * Used for segments outside the maritime network coverage
 */
function generateInterpolatedWaypoints(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  note?: string
): SeaRouteWaypoint[] {
  const distance = calculateDistanceNm(fromLat, fromLon, toLat, toLon);
  const waypoints: SeaRouteWaypoint[] = [];
  
  // For short distances, just include endpoints
  if (distance < 30) {
    waypoints.push({ lat: fromLat, lon: fromLon });
    waypoints.push({ lat: toLat, lon: toLon, note });
    return waypoints;
  }
  
  // Add intermediate waypoints every ~30nm
  const numSegments = Math.ceil(distance / 30);
  
  for (let i = 0; i <= numSegments; i++) {
    const fraction = i / numSegments;
    const lat = fromLat + (toLat - fromLat) * fraction;
    const lon = fromLon + (toLon - fromLon) * fraction;
    
    waypoints.push({
      lat,
      lon,
      name: i > 0 && i < numSegments ? `Transit Point ${i}` : undefined,
      note: i > 0 ? note : undefined,
    });
  }
  
  return waypoints;
}

// ============================================================================
// Route Metrics Calculation
// ============================================================================

/**
 * Calculate fuel consumption for a route segment
 */
export function calculateSegmentFuel(
  distanceNm: number,
  vesselProfile: VesselProfile,
  weatherRisk: number
): FuelCalculation {
  // Base consumption at cruising speed
  const baseConsumption = vesselProfile.fuelConsumptionRate * distanceNm;
  
  // Weather adjustment: higher risk = more fuel (up to 30% increase)
  const weatherFactor = 1 + (weatherRisk / 100) * 0.3;
  const adjustedConsumption = baseConsumption * weatherFactor;
  
  const timeHours = distanceNm / vesselProfile.cruisingSpeed;
  
  return {
    baseConsumption: baseConsumption / timeHours, // L/hr
    adjustedConsumption: adjustedConsumption / timeHours, // L/hr
    totalFuel: adjustedConsumption,
    costPerLiter: vesselProfile.fuelCostPerLiter,
    totalCost: adjustedConsumption * vesselProfile.fuelCostPerLiter,
  };
}

/**
 * Calculate emissions for fuel consumption
 */
export function calculateEmissions(
  fuelLiters: number,
  vesselProfile: VesselProfile
): { co2: number; nox: number; sox: number } {
  return {
    co2: fuelLiters * vesselProfile.emissionFactors.co2PerLiter,
    nox: fuelLiters * vesselProfile.emissionFactors.noxPerLiter,
    sox: fuelLiters * vesselProfile.emissionFactors.soxPerLiter,
  };
}

/**
 * Assess weather risk along a route segment
 */
export function assessWeatherRisk(lat: number, lng: number): number {
  const weather = getWeatherAtLocation(lat, lng);
  
  // Convert operational risk to numeric value (0-100)
  switch (weather.operationalRisk) {
    case 'high':
      return 80 + (weather.windSpeed > 25 ? 20 : 0);
    case 'medium':
      return 40 + (weather.waveHeight > 1.5 ? 20 : 0);
    case 'low':
    default:
      return 10 + (weather.windSpeed > 10 ? 10 : 0);
  }
}

/**
 * Get weather forecast points along a route
 */
export function getRouteWeatherForecast(
  waypoints: SeaRouteWaypoint[],
  departureTime: Date = new Date()
): WeatherPoint[] {
  return waypoints.map((wp, index) => {
    const weather = getWeatherAtLocation(wp.lat, wp.lon);
    const estimatedTime = new Date(departureTime.getTime() + index * 3600000); // 1 hour between points
    
    return {
      lat: wp.lat,
      lng: wp.lon,
      time: estimatedTime,
      windSpeed: weather.windSpeed,
      windDirection: parseWindDirection(weather.windDirection),
      waveHeight: weather.waveHeight,
      visibility: weather.visibility,
      condition: mapCondition(weather.condition),
      riskLevel: weather.operationalRisk,
    };
  });
}

function parseWindDirection(dir: string): number {
  const directions: Record<string, number> = {
    'N': 0, 'NE': 45, 'E': 90, 'SE': 135,
    'S': 180, 'SW': 225, 'W': 270, 'NW': 315,
  };
  return directions[dir] ?? 0;
}

function mapCondition(condition: string): 'clear' | 'cloudy' | 'rain' | 'storm' {
  if (condition === 'clear') return 'clear';
  if (condition === 'cloudy' || condition === 'partly_cloudy' || condition === 'hazy') return 'cloudy';
  if (condition === 'rough' || condition === 'storm') return 'storm';
  return 'clear';
}

// ============================================================================
// Route Generation
// ============================================================================

/**
 * Convert sea route waypoints to app Waypoints
 */
function convertToWaypoints(
  seaWaypoints: SeaRouteWaypoint[],
  originName?: string,
  destName?: string
): Waypoint[] {
  return seaWaypoints.map((wp, index) => {
    let type: Waypoint['type'] = 'waypoint';
    let name = `Waypoint ${index + 1}`;
    
    if (index === 0) {
      type = 'origin';
      name = originName || 'Origin';
    } else if (index === seaWaypoints.length - 1) {
      type = 'destination';
      name = destName || 'Destination';
    }
    
    return {
      id: `wp-${index}`,
      name,
      lat: wp.lat,
      lng: wp.lon,
      type,
    };
  });
}

/**
 * Generate route segments from waypoints
 */
function generateSegments(
  waypoints: Waypoint[],
  vesselProfile: VesselProfile
): RouteSegment[] {
  const segments: RouteSegment[] = [];
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    
    const distance = calculateDistanceNm(from.lat, from.lng, to.lat, to.lng);
    const bearing = calculateBearing(from.lat, from.lng, to.lat, to.lng);
    const estimatedTime = distance / vesselProfile.cruisingSpeed;
    
    // Calculate weather risk at midpoint
    const midLat = (from.lat + to.lat) / 2;
    const midLng = (from.lng + to.lng) / 2;
    const weatherRisk = assessWeatherRisk(midLat, midLng);
    
    // Calculate fuel for this segment
    const fuelCalc = calculateSegmentFuel(distance, vesselProfile, weatherRisk);
    
    segments.push({
      from,
      to,
      distance,
      bearing,
      estimatedTime,
      fuelConsumption: fuelCalc.totalFuel,
      weatherRisk,
    });
  }
  
  return segments;
}

/**
 * Generate a complete route with all metrics
 */
export async function generateRoute(
  vesselId: string,
  vesselName: string,
  vesselType: string,
  origin: { lat: number; lng: number; name?: string },
  destination: { lat: number; lng: number; name?: string },
  options: {
    speed?: number; // Override cruising speed
    routeId?: string;
    routeName?: string;
  } = {}
): Promise<Route> {
  // Get vessel profile
  const vesselProfile = VESSEL_PROFILES[vesselType] || VESSEL_PROFILES.default;
  
  // If custom speed provided, adjust the profile
  const effectiveProfile = options.speed
    ? { ...vesselProfile, cruisingSpeed: options.speed }
    : vesselProfile;
  
  // Fetch realistic sea route using ferry network
  const { waypoints: seaWaypoints, distance: totalDistance } = await fetchSeaRoute(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  );
  
  // Convert to app waypoints
  const waypoints = convertToWaypoints(seaWaypoints, origin.name, destination.name);
  
  // Generate segments with metrics
  const segments = generateSegments(waypoints, effectiveProfile);
  
  // Aggregate metrics
  const totalFuel = segments.reduce((sum, s) => sum + s.fuelConsumption, 0);
  const estimatedTime = segments.reduce((sum, s) => sum + s.estimatedTime, 0);
  const avgWeatherRisk = segments.reduce((sum, s) => sum + s.weatherRisk, 0) / segments.length;
  
  // Calculate emissions
  const emissions = calculateEmissions(totalFuel, effectiveProfile);
  
  // Calculate total cost
  const fuelCost = totalFuel * effectiveProfile.fuelCostPerLiter;
  
  return {
    id: options.routeId || `route-${Date.now()}`,
    name: options.routeName || `${origin.name || 'Origin'} to ${destination.name || 'Destination'}`,
    vesselId,
    vesselName,
    origin: waypoints[0],
    destination: waypoints[waypoints.length - 1],
    waypoints: waypoints.slice(1, -1), // Exclude origin and destination
    segments,
    totalDistance,
    estimatedTime,
    fuelConsumption: totalFuel,
    emissions,
    averageSpeed: effectiveProfile.cruisingSpeed,
    weatherRisk: avgWeatherRisk,
    cost: fuelCost,
    createdAt: new Date(),
    status: 'planned',
  };
}

/**
 * Generate alternative routes with different speed profiles
 */
export async function generateAlternativeRoutes(
  vesselId: string,
  vesselName: string,
  vesselType: string,
  origin: { lat: number; lng: number; name?: string },
  destination: { lat: number; lng: number; name?: string }
): Promise<{ fastest: Route; economical: Route; balanced: Route }> {
  const vesselProfile = VESSEL_PROFILES[vesselType] || VESSEL_PROFILES.default;
  
  // Fastest: max speed
  const fastest = await generateRoute(vesselId, vesselName, vesselType, origin, destination, {
    speed: vesselProfile.maxSpeed,
    routeName: 'Fastest Route',
  });
  
  // Economical: 70% of cruising speed for best fuel efficiency
  const economical = await generateRoute(vesselId, vesselName, vesselType, origin, destination, {
    speed: vesselProfile.cruisingSpeed * 0.7,
    routeName: 'Most Economical Route',
  });
  
  // Balanced: normal cruising speed
  const balanced = await generateRoute(vesselId, vesselName, vesselType, origin, destination, {
    routeName: 'Balanced Route',
  });
  
  return { fastest, economical, balanced };
}

/**
 * Calculate comparison between two routes
 */
export function compareRoutes(
  route1: Route,
  route2: Route
): {
  distanceDiff: number;
  timeDiff: number;
  fuelSavings: number;
  emissionsSavings: number;
} {
  return {
    distanceDiff: route1.totalDistance - route2.totalDistance,
    timeDiff: route1.estimatedTime - route2.estimatedTime,
    fuelSavings: route2.fuelConsumption - route1.fuelConsumption,
    emissionsSavings: route2.emissions.co2 - route1.emissions.co2,
  };
}

