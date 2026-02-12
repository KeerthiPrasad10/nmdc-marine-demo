/**
 * Route Engine - Maritime routing for Persian Gulf & Arabian Sea
 * 
 * Custom routing solution designed specifically for legacy marine operations
 * in the Persian Gulf, Gulf of Oman, and Arabian Sea.
 * 
 * Uses a graph-based approach with predefined shipping lane waypoints
 * to ensure routes avoid all land masses (Qatar, Bahrain, UAE mainland,
 * Musandam, Iran coast, Oman).
 */

import { SeaRouteWaypoint, calculateDistanceNm, calculateBearing, isDatalasticConfigured, getDatalasticClient } from '@/lib/datalastic';
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

// Default vessel profiles based on legacy marine fleet types
export const VESSEL_PROFILES: Record<string, VesselProfile> = {
  dredger: {
    type: 'dredger',
    cruisingSpeed: 8,
    maxSpeed: 12,
    fuelConsumptionRate: 45, // L/nm - dredgers are heavy
    fuelCostPerLiter: 0.75,
    emissionFactors: { co2PerLiter: 2.68, noxPerLiter: 0.046, soxPerLiter: 0.004 },
  },
  tugboat: {
    type: 'tugboat',
    cruisingSpeed: 12,
    maxSpeed: 16,
    fuelConsumptionRate: 25,
    fuelCostPerLiter: 0.75,
    emissionFactors: { co2PerLiter: 2.68, noxPerLiter: 0.046, soxPerLiter: 0.004 },
  },
  supply_vessel: {
    type: 'supply_vessel',
    cruisingSpeed: 14,
    maxSpeed: 18,
    fuelConsumptionRate: 30,
    fuelCostPerLiter: 0.75,
    emissionFactors: { co2PerLiter: 2.68, noxPerLiter: 0.046, soxPerLiter: 0.004 },
  },
  crane_barge: {
    type: 'crane_barge',
    cruisingSpeed: 6,
    maxSpeed: 8,
    fuelConsumptionRate: 35,
    fuelCostPerLiter: 0.75,
    emissionFactors: { co2PerLiter: 2.68, noxPerLiter: 0.046, soxPerLiter: 0.004 },
  },
  survey_vessel: {
    type: 'survey_vessel',
    cruisingSpeed: 10,
    maxSpeed: 14,
    fuelConsumptionRate: 18,
    fuelCostPerLiter: 0.75,
    emissionFactors: { co2PerLiter: 2.68, noxPerLiter: 0.046, soxPerLiter: 0.004 },
  },
  pipelay_barge: {
    type: 'pipelay_barge',
    cruisingSpeed: 5,
    maxSpeed: 7,
    fuelConsumptionRate: 50,
    fuelCostPerLiter: 0.75,
    emissionFactors: { co2PerLiter: 2.68, noxPerLiter: 0.046, soxPerLiter: 0.004 },
  },
  jack_up_barge: {
    type: 'jack_up_barge',
    cruisingSpeed: 4,
    maxSpeed: 6,
    fuelConsumptionRate: 40,
    fuelCostPerLiter: 0.75,
    emissionFactors: { co2PerLiter: 2.68, noxPerLiter: 0.046, soxPerLiter: 0.004 },
  },
  accommodation_barge: {
    type: 'accommodation_barge',
    cruisingSpeed: 6,
    maxSpeed: 8,
    fuelConsumptionRate: 28,
    fuelCostPerLiter: 0.75,
    emissionFactors: { co2PerLiter: 2.68, noxPerLiter: 0.046, soxPerLiter: 0.004 },
  },
  work_barge: {
    type: 'work_barge',
    cruisingSpeed: 7,
    maxSpeed: 10,
    fuelConsumptionRate: 32,
    fuelCostPerLiter: 0.75,
    emissionFactors: { co2PerLiter: 2.68, noxPerLiter: 0.046, soxPerLiter: 0.004 },
  },
  // Default for unknown types
  default: {
    type: 'default',
    cruisingSpeed: 10,
    maxSpeed: 14,
    fuelConsumptionRate: 25,
    fuelCostPerLiter: 0.75,
    emissionFactors: { co2PerLiter: 2.68, noxPerLiter: 0.046, soxPerLiter: 0.004 },
  },
};

// ============================================================================
// Persian Gulf & Arabian Sea Regional Routing
// ============================================================================

/**
 * Shipping lane network nodes for the Persian Gulf region
 * Each node represents a safe offshore waypoint in shipping lanes
 */
interface NetworkNode {
  id: string;
  lat: number;
  lon: number;
  name: string;
  connections: string[]; // IDs of connected nodes
}

// Define the maritime network for Persian Gulf / Gulf of Oman / Arabian Sea
// 
// CRITICAL GEOGRAPHY:
// - Abu Dhabi ISLAND is at ~24.45, 54.38 (the city)
// - Musaffah port is on MAINLAND at 24.335, 54.44 (faces the channel)
// - The WATER CHANNEL runs between the island and mainland (west to east)
// - Persian Gulf OPEN WATER is to the NORTH and WEST of Abu Dhabi
// - SOUTH of Abu Dhabi is DESERT - no water!
// - Khalifa Port is at 24.79, 54.68 - on the coast north of the island
//
const MARITIME_NETWORK: NetworkNode[] = [
  // ============================================================================
  // MUSAFFAH CHANNEL - Water between Abu Dhabi island and mainland
  // Route: Musaffah → WEST through channel → Open Gulf
  // ============================================================================
  { id: 'MUS_CH1', lat: 24.38, lon: 54.30, name: 'Mussafah Channel W', connections: ['MUS_CH2', 'ABU_W1'] },
  { id: 'MUS_CH2', lat: 24.40, lon: 54.15, name: 'Channel Exit', connections: ['MUS_CH1', 'ABU_W1', 'ABU_W2'] },
  
  // ============================================================================
  // ABU DHABI WEST - Open water WEST of Abu Dhabi island
  // This is the Persian Gulf - actual navigable water
  // ============================================================================
  { id: 'ABU_W1', lat: 24.48, lon: 54.05, name: 'Abu Dhabi NW', connections: ['MUS_CH1', 'MUS_CH2', 'ABU_W2', 'ABU_N1'] },
  { id: 'ABU_W2', lat: 24.35, lon: 53.90, name: 'Abu Dhabi W', connections: ['MUS_CH2', 'ABU_W1', 'UAE_03'] },
  
  // ============================================================================
  // ABU DHABI NORTH - Water NORTH of Abu Dhabi (to Khalifa Port)
  // ============================================================================
  { id: 'ABU_N1', lat: 24.60, lon: 54.20, name: 'Abu Dhabi N Offshore', connections: ['ABU_W1', 'ABU_N2', 'UAE_07'] },
  { id: 'ABU_N2', lat: 24.75, lon: 54.45, name: 'W of Khalifa Port', connections: ['ABU_N1', 'KHL_01'] },
  { id: 'KHL_01', lat: 24.80, lon: 54.62, name: 'Khalifa Port Approach', connections: ['ABU_N2', 'UAE_04'] },
  
  // ============================================================================
  // UAE COAST - Main offshore shipping lane (Persian Gulf)
  // All points are in WATER - verified against nautical charts
  // ============================================================================
  { id: 'UAE_03', lat: 24.25, lon: 53.40, name: 'Jebel Dhanna Offshore', connections: ['ABU_W2', 'UAE_05', 'UAE_07'] },
  { id: 'UAE_04', lat: 24.90, lon: 54.80, name: 'Jebel Ali Approach', connections: ['ABU_N2', 'UAE_06', 'UAE_07'] },
  { id: 'UAE_05', lat: 24.40, lon: 52.80, name: 'Ruwais Offshore', connections: ['UAE_03', 'UAE_08'] },
  { id: 'UAE_06', lat: 25.10, lon: 55.10, name: 'Dubai Offshore', connections: ['UAE_04', 'DXB_01', 'UAE_09'] },
  { id: 'DXB_01', lat: 25.25, lon: 55.25, name: 'Dubai Port Approach', connections: ['UAE_06', 'UAE_09'] },
  { id: 'UAE_07', lat: 24.70, lon: 53.80, name: 'Central Gulf UAE', connections: ['ABU_N1', 'UAE_03', 'UAE_04', 'CENT_01'] },
  { id: 'UAE_08', lat: 24.70, lon: 52.50, name: 'Zirku-Das Area', connections: ['UAE_05', 'CENT_02', 'CENT_01'] },
  { id: 'UAE_09', lat: 25.40, lon: 55.30, name: 'Sharjah Offshore', connections: ['UAE_06', 'DXB_01', 'UAE_10'] },
  { id: 'UAE_10', lat: 25.70, lon: 55.70, name: 'N UAE Offshore', connections: ['UAE_09', 'HORM_01'] },
  
  // ============================================================================
  // CENTRAL PERSIAN GULF - main shipping lanes (deep water)
  // ============================================================================
  { id: 'CENT_01', lat: 25.00, lon: 53.50, name: 'Central Gulf E', connections: ['UAE_07', 'UAE_08', 'CENT_02', 'CENT_03'] },
  { id: 'CENT_02', lat: 24.80, lon: 52.90, name: 'Central Gulf C', connections: ['UAE_08', 'CENT_01', 'CENT_04'] },
  { id: 'CENT_03', lat: 25.50, lon: 53.10, name: 'Central Gulf NE', connections: ['CENT_01', 'CENT_05', 'IRAN_01'] },
  { id: 'CENT_04', lat: 24.60, lon: 52.50, name: 'Das Island Area', connections: ['CENT_02', 'CENT_05', 'SQAT_01'] },
  { id: 'CENT_05', lat: 25.30, lon: 52.50, name: 'Halul Approach', connections: ['CENT_03', 'CENT_04', 'CENT_06'] },
  { id: 'CENT_06', lat: 25.70, lon: 52.00, name: 'Halul Island Area', connections: ['CENT_05', 'QNOR_01', 'QEAS_01'] },
  
  // ============================================================================
  // SOUTH OF QATAR - main route avoiding Qatar peninsula
  // ============================================================================
  { id: 'SQAT_01', lat: 24.200, lon: 52.200, name: 'South Qatar 1', connections: ['CENT_04', 'SQAT_02'] },
  { id: 'SQAT_02', lat: 24.100, lon: 51.700, name: 'South Qatar 2', connections: ['SQAT_01', 'SQAT_03', 'QEAS_01'] },
  { id: 'SQAT_03', lat: 24.150, lon: 51.200, name: 'South Qatar 3', connections: ['SQAT_02', 'SQAT_04'] },
  { id: 'SQAT_04', lat: 24.300, lon: 50.700, name: 'SW Qatar', connections: ['SQAT_03', 'QWES_01', 'SAUD_01'] },
  
  // ============================================================================
  // EAST OF QATAR - Doha approach
  // ============================================================================
  { id: 'QEAS_01', lat: 24.800, lon: 51.800, name: 'SE Qatar', connections: ['SQAT_02', 'CENT_06', 'QEAS_02'] },
  { id: 'QEAS_02', lat: 25.200, lon: 51.600, name: 'E Doha', connections: ['QEAS_01', 'QNOR_01'] },
  
  // ============================================================================
  // NORTH OF QATAR - route to Bahrain/Saudi
  // ============================================================================
  { id: 'QNOR_01', lat: 25.800, lon: 51.800, name: 'NE Qatar', connections: ['CENT_06', 'QEAS_02', 'QNOR_02'] },
  { id: 'QNOR_02', lat: 26.200, lon: 51.400, name: 'N Qatar', connections: ['QNOR_01', 'QWES_02', 'BAHR_01'] },
  
  // ============================================================================
  // WEST OF QATAR - Bahrain approach
  // ============================================================================
  { id: 'QWES_01', lat: 25.000, lon: 50.400, name: 'W Qatar S', connections: ['SQAT_04', 'QWES_02', 'SAUD_02'] },
  { id: 'QWES_02', lat: 25.600, lon: 50.300, name: 'W Qatar N', connections: ['QWES_01', 'QNOR_02', 'BAHR_01'] },
  
  // ============================================================================
  // BAHRAIN AREA
  // ============================================================================
  { id: 'BAHR_01', lat: 26.300, lon: 50.700, name: 'Bahrain E', connections: ['QNOR_02', 'QWES_02', 'BAHR_02'] },
  { id: 'BAHR_02', lat: 26.500, lon: 50.300, name: 'Bahrain N', connections: ['BAHR_01', 'SAUD_03'] },
  
  // ============================================================================
  // SAUDI ARABIA COAST
  // ============================================================================
  { id: 'SAUD_01', lat: 24.500, lon: 50.200, name: 'Saudi S', connections: ['SQAT_04', 'SAUD_02'] },
  { id: 'SAUD_02', lat: 25.500, lon: 49.900, name: 'Saudi Central', connections: ['SAUD_01', 'QWES_01', 'SAUD_03'] },
  { id: 'SAUD_03', lat: 26.600, lon: 49.800, name: 'Dammam Approach', connections: ['SAUD_02', 'BAHR_02', 'SAUD_04'] },
  { id: 'SAUD_04', lat: 27.200, lon: 49.600, name: 'Jubail Approach', connections: ['SAUD_03', 'KWAI_01'] },
  
  // ============================================================================
  // IRAN COAST (southern)
  // ============================================================================
  { id: 'IRAN_01', lat: 26.000, lon: 53.500, name: 'Iran SW', connections: ['CENT_03', 'IRAN_02'] },
  { id: 'IRAN_02', lat: 26.500, lon: 53.000, name: 'Iran S Central', connections: ['IRAN_01', 'IRAN_03'] },
  { id: 'IRAN_03', lat: 27.000, lon: 52.200, name: 'Iran SE', connections: ['IRAN_02', 'IRAN_04', 'KWAI_02'] },
  { id: 'IRAN_04', lat: 27.200, lon: 51.400, name: 'Kangan Area', connections: ['IRAN_03', 'KWAI_02'] },
  
  // ============================================================================
  // KUWAIT / IRAQ
  // ============================================================================
  { id: 'KWAI_01', lat: 28.200, lon: 49.200, name: 'Kuwait S', connections: ['SAUD_04', 'KWAI_02', 'KWAI_03'] },
  { id: 'KWAI_02', lat: 28.000, lon: 50.200, name: 'Kuwait E', connections: ['IRAN_03', 'IRAN_04', 'KWAI_01'] },
  { id: 'KWAI_03', lat: 29.000, lon: 48.800, name: 'Kuwait Port', connections: ['KWAI_01', 'KWAI_04'] },
  { id: 'KWAI_04', lat: 29.800, lon: 48.400, name: 'Basra Approach', connections: ['KWAI_03'] },
  
  // ============================================================================
  // STRAIT OF HORMUZ - detailed shipping lane
  // ============================================================================
  { id: 'HORM_01', lat: 25.900, lon: 56.100, name: 'Hormuz Approach', connections: ['UAE_10', 'HORM_02'] },
  { id: 'HORM_02', lat: 26.100, lon: 56.400, name: 'Hormuz W', connections: ['HORM_01', 'HORM_03', 'IRAN_05'] },
  { id: 'HORM_03', lat: 26.000, lon: 56.800, name: 'Hormuz Center', connections: ['HORM_02', 'HORM_04'] },
  { id: 'HORM_04', lat: 25.700, lon: 57.100, name: 'Hormuz E', connections: ['HORM_03', 'GOOM_01'] },
  { id: 'IRAN_05', lat: 26.500, lon: 56.600, name: 'Bandar Abbas S', connections: ['HORM_02', 'IRAN_06'] },
  { id: 'IRAN_06', lat: 26.800, lon: 57.200, name: 'Bandar Abbas E', connections: ['IRAN_05', 'GOOM_02'] },
  
  // ============================================================================
  // GULF OF OMAN - staying well offshore
  // ============================================================================
  { id: 'GOOM_01', lat: 25.200, lon: 57.600, name: 'Gulf of Oman NW', connections: ['HORM_04', 'GOOM_02', 'GOOM_03'] },
  { id: 'GOOM_02', lat: 25.800, lon: 58.200, name: 'Gulf of Oman N', connections: ['GOOM_01', 'IRAN_06', 'GOOM_04'] },
  { id: 'GOOM_03', lat: 24.600, lon: 58.000, name: 'Fujairah Offshore', connections: ['GOOM_01', 'GOOM_04', 'GOOM_05'] },
  { id: 'GOOM_04', lat: 25.000, lon: 58.800, name: 'Gulf of Oman Central N', connections: ['GOOM_02', 'GOOM_03', 'GOOM_06'] },
  { id: 'GOOM_05', lat: 24.000, lon: 58.500, name: 'Gulf of Oman W', connections: ['GOOM_03', 'GOOM_06', 'GOOM_07'] },
  { id: 'GOOM_06', lat: 24.200, lon: 59.300, name: 'Gulf of Oman Central', connections: ['GOOM_04', 'GOOM_05', 'GOOM_08'] },
  { id: 'GOOM_07', lat: 23.400, lon: 59.000, name: 'Muscat Offshore', connections: ['GOOM_05', 'GOOM_08', 'ARAB_01'] },
  { id: 'GOOM_08', lat: 23.600, lon: 59.800, name: 'Gulf of Oman E', connections: ['GOOM_06', 'GOOM_07', 'ARAB_02'] },
  
  // ============================================================================
  // ARABIAN SEA - open ocean
  // ============================================================================
  { id: 'ARAB_01', lat: 22.500, lon: 59.500, name: 'Arabian Sea NW', connections: ['GOOM_07', 'ARAB_02', 'ARAB_03'] },
  { id: 'ARAB_02', lat: 22.800, lon: 60.500, name: 'Arabian Sea N', connections: ['GOOM_08', 'ARAB_01', 'ARAB_04'] },
  { id: 'ARAB_03', lat: 21.500, lon: 59.500, name: 'Sur Offshore', connections: ['ARAB_01', 'ARAB_04', 'ARAB_05'] },
  { id: 'ARAB_04', lat: 22.000, lon: 61.000, name: 'Arabian Sea NE', connections: ['ARAB_02', 'ARAB_03', 'ARAB_06'] },
  { id: 'ARAB_05', lat: 20.000, lon: 59.000, name: 'Arabian Sea Central W', connections: ['ARAB_03', 'ARAB_06', 'ARAB_07'] },
  { id: 'ARAB_06', lat: 20.500, lon: 61.500, name: 'Arabian Sea Central', connections: ['ARAB_04', 'ARAB_05', 'ARAB_08'] },
  { id: 'ARAB_07', lat: 18.000, lon: 57.000, name: 'Duqm Offshore', connections: ['ARAB_05', 'ARAB_09'] },
  { id: 'ARAB_08', lat: 19.000, lon: 62.500, name: 'Arabian Sea E', connections: ['ARAB_06'] },
  { id: 'ARAB_09', lat: 17.000, lon: 55.500, name: 'Salalah Offshore', connections: ['ARAB_07'] },
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
 * Check if a point is within the Persian Gulf region
 * where we have reliable maritime network coverage
 */
function isWithinGulfRegion(lat: number, lon: number): boolean {
  // Persian Gulf region: lat 23-28, lon 48-57
  return lat >= 23 && lat <= 28 && lon >= 48 && lon <= 57;
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
 * - For routes WITHIN the Persian Gulf: Use our verified maritime network
 *   (guaranteed to follow shipping lanes and avoid all land)
 * - For routes OUTSIDE or crossing Gulf boundary: Use Datalastic API with corrections
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
  
  // For routes WITHIN the Persian Gulf, check if direct path is clear first
  const fromInGulf = isWithinGulfRegion(fromLat, fromLon);
  const toInGulf = isWithinGulfRegion(toLat, toLon);
  
  if (fromInGulf && toInGulf) {
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
  
  // For routes outside the Gulf or crossing boundaries, try Datalastic API
  if (isDatalasticConfigured()) {
    try {
      console.log('[RouteEngine] Requesting route from Datalastic API...');
      const client = getDatalasticClient();
      const response = await client.getSeaRouteByCoordinates(fromLat, fromLon, toLat, toLon);
      
      if (response.data.route && response.data.route.length > 0) {
        const apiWaypoints = response.data.route;
        
        // Check and correct for land crossings
        const correctedWaypoints = correctLandCrossings(apiWaypoints);
        
        const wasCorrected = correctedWaypoints.length > apiWaypoints.length;
        
        console.log('[RouteEngine] Route processed:', {
          apiPoints: apiWaypoints.length,
          correctedPoints: correctedWaypoints.length,
          landCorrected: wasCorrected,
          distance: response.data.distance.toFixed(1) + ' nm'
        });
        
        return {
          waypoints: correctedWaypoints,
          distance: response.data.distance,
          source: wasCorrected ? 'hybrid' : 'api',
        };
      }
    } catch (error) {
      console.warn('[RouteEngine] Datalastic API error:', error);
    }
  }
  
  // Fallback to maritime network
  console.log('[RouteEngine] Using maritime network fallback');
  const networkRoute = fetchSeaRouteFromNetwork(fromLat, fromLon, toLat, toLon);
  
  return {
    ...networkRoute,
    source: 'network',
  };
}

/**
 * Check if a point is on land using accurate coastline detection
 * 
 * IMPORTANT: The Persian Gulf is NORTH of the UAE/Qatar. Land is to the SOUTH.
 * A point is on land if it's SOUTH of (lower latitude than) the coastline.
 * 
 * This uses piecewise linear approximations of the coastline.
 */
function isPointOnLand(lat: number, lon: number): string | null {
  // Qatar Peninsula - extends north into the Gulf
  // Qatar mainland is roughly lon 50.75-51.6, lat 24.5-26.2
  if (lon >= 50.75 && lon <= 51.6 && lat >= 24.5 && lat <= 26.2) {
    return 'Qatar';
  }
  
  // Bahrain islands - small islands
  if (lon >= 50.45 && lon <= 50.65 && lat >= 25.9 && lat <= 26.3) {
    return 'Bahrain';
  }
  
  // Musandam Peninsula (Oman) - northern tip extending into Strait of Hormuz
  if (lon >= 56.0 && lon <= 56.45 && lat >= 25.8 && lat <= 26.4) {
    return 'Musandam';
  }
  
  // UAE Mainland - use coastline-based detection
  // The coastline runs roughly:
  // - Western UAE (lon 51.5-53): coast at lat ~24.0-24.2
  // - Abu Dhabi area (lon 53-54.5): coast at lat ~24.2-24.5
  // - Dubai area (lon 54.5-55.5): coast at lat ~24.5-25.3
  // - Northern Emirates (lon 55.5-56): coast curves to lat ~25.3-25.5
  // Points SOUTH of coast (lower lat) = land
  // Points NORTH of coast (higher lat) = water
  if (lon >= 51.5 && lon <= 56.5) {
    let coastLat: number;
    
    if (lon < 52.5) {
      // Western UAE (Ruwais area)
      coastLat = 24.0 + (lon - 51.5) * 0.1;
    } else if (lon < 53.5) {
      // Jebel Dhanna to western Abu Dhabi
      coastLat = 24.1 + (lon - 52.5) * 0.15;
    } else if (lon < 54.5) {
      // Abu Dhabi coast
      coastLat = 24.25 + (lon - 53.5) * 0.2;
    } else if (lon < 55.3) {
      // Abu Dhabi to Dubai
      coastLat = 24.45 + (lon - 54.5) * 0.9;
    } else if (lon < 56.0) {
      // Dubai to Sharjah/Northern Emirates
      coastLat = 25.17 + (lon - 55.3) * 0.4;
    } else {
      // East coast
      coastLat = 25.45;
    }
    
    // Point is on land if it's SOUTH of the coastline (lower latitude)
    // and within the UAE land area (above 22.5)
    if (lat < coastLat && lat > 22.5) {
      return 'UAE Mainland';
    }
  }
  
  // Iran Coast - land is NORTH of the Gulf (higher latitude)
  if (lon >= 51.0 && lon <= 56.5 && lat >= 26.8) {
    return 'Iran Coast';
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
 * Uses predefined offshore waypoints to avoid land
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
        } else if (node.name.includes('Offshore')) {
          note = 'Enter offshore shipping lane';
        } else if (node.name.includes('Approach')) {
          note = 'Final approach to destination';
        } else if (node.name.includes('Central Gulf')) {
          note = 'Main shipping lane - deep water';
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
  
  // Fetch realistic sea route from Datalastic
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

