/**
 * Route Engine - Maritime routing for Persian Gulf & Arabian Sea
 * 
 * Custom routing solution designed specifically for NMDC operations
 * in the Persian Gulf, Gulf of Oman, and Arabian Sea.
 * 
 * Uses a graph-based approach with predefined shipping lane waypoints
 * to ensure routes avoid all land masses (Qatar, Bahrain, UAE mainland,
 * Musandam, Iran coast, Oman).
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

// Default vessel profiles based on NMDC fleet types
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
// Dense network with waypoints every ~30-50nm for smooth routing
// All coordinates use 3 decimal places for ~100m precision
const MARITIME_NETWORK: NetworkNode[] = [
  // ============================================================================
  // UAE COAST - Abu Dhabi to Dubai offshore lane
  // ============================================================================
  { id: 'UAE_01', lat: 24.300, lon: 54.200, name: 'Abu Dhabi Approach', connections: ['UAE_02', 'UAE_03'] },
  { id: 'UAE_02', lat: 24.400, lon: 54.600, name: 'Abu Dhabi NE', connections: ['UAE_01', 'UAE_04'] },
  { id: 'UAE_03', lat: 24.150, lon: 53.800, name: 'Abu Dhabi SW', connections: ['UAE_01', 'UAE_05'] },
  { id: 'UAE_04', lat: 24.700, lon: 54.900, name: 'Jebel Ali Approach', connections: ['UAE_02', 'UAE_06', 'UAE_07'] },
  { id: 'UAE_05', lat: 24.050, lon: 53.300, name: 'Ruwais Offshore', connections: ['UAE_03', 'UAE_08'] },
  { id: 'UAE_06', lat: 25.100, lon: 55.200, name: 'Dubai Offshore', connections: ['UAE_04', 'UAE_09'] },
  { id: 'UAE_07', lat: 24.500, lon: 54.400, name: 'Das Island Area', connections: ['UAE_04', 'UAE_08', 'CENT_01'] },
  { id: 'UAE_08', lat: 24.200, lon: 53.000, name: 'Zirku Island Area', connections: ['UAE_05', 'UAE_07', 'CENT_02'] },
  { id: 'UAE_09', lat: 25.400, lon: 55.400, name: 'Sharjah Offshore', connections: ['UAE_06', 'UAE_10'] },
  { id: 'UAE_10', lat: 25.600, lon: 55.800, name: 'Ajman Offshore', connections: ['UAE_09', 'HORM_01'] },
  
  // ============================================================================
  // CENTRAL PERSIAN GULF - main shipping lanes
  // ============================================================================
  { id: 'CENT_01', lat: 24.800, lon: 53.800, name: 'Central Gulf 1', connections: ['UAE_07', 'CENT_02', 'CENT_03'] },
  { id: 'CENT_02', lat: 24.600, lon: 53.200, name: 'Central Gulf 2', connections: ['UAE_08', 'CENT_01', 'CENT_04'] },
  { id: 'CENT_03', lat: 25.200, lon: 53.400, name: 'Central Gulf 3', connections: ['CENT_01', 'CENT_05', 'IRAN_01'] },
  { id: 'CENT_04', lat: 24.400, lon: 52.600, name: 'Central Gulf 4', connections: ['CENT_02', 'CENT_05', 'SQAT_01'] },
  { id: 'CENT_05', lat: 25.000, lon: 52.800, name: 'Central Gulf 5', connections: ['CENT_03', 'CENT_04', 'CENT_06'] },
  { id: 'CENT_06', lat: 25.400, lon: 52.200, name: 'Halul Island Area', connections: ['CENT_05', 'QNOR_01', 'QEAS_01'] },
  
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
 */
function findNearestNode(lat: number, lon: number): NetworkNode {
  let nearest = MARITIME_NETWORK[0];
  let minDist = Infinity;
  
  for (const node of MARITIME_NETWORK) {
    const dist = calculateDistanceNm(lat, lon, node.lat, node.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = node;
    }
  }
  
  return nearest;
}

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
 * Fetch a realistic sea route using regional maritime network
 * Returns waypoints that follow shipping lanes and avoid land
 */
export async function fetchSeaRoute(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): Promise<{ waypoints: SeaRouteWaypoint[]; distance: number }> {
  console.log('[RouteEngine] Calculating regional sea route:', { fromLat, fromLon, toLat, toLon });
  
  // Find nearest network nodes
  const startNode = findNearestNode(fromLat, fromLon);
  const endNode = findNearestNode(toLat, toLon);
  
  console.log('[RouteEngine] Network nodes:', { 
    start: startNode.name, 
    end: endNode.name 
  });
  
  // Build waypoints: origin -> network path -> destination
  const waypoints: SeaRouteWaypoint[] = [];
  
  // Add origin
  waypoints.push({ lat: fromLat, lon: fromLon });
  
  // If start and end are different nodes, find path through network
  if (startNode.id !== endNode.id) {
    const networkPath = findShortestPath(startNode.id, endNode.id);
    
    // Add network waypoints (skip first if too close to origin)
    for (const node of networkPath) {
      const distFromLast = waypoints.length > 0 
        ? calculateDistanceNm(waypoints[waypoints.length - 1].lat, waypoints[waypoints.length - 1].lon, node.lat, node.lon)
        : Infinity;
      
      // Only add if more than 5nm from previous point
      if (distFromLast > 5) {
        waypoints.push({ lat: node.lat, lon: node.lon });
      }
    }
  } else {
    // Same node - just add the network point if not too close
    const distToNode = calculateDistanceNm(fromLat, fromLon, startNode.lat, startNode.lon);
    if (distToNode > 5) {
      waypoints.push({ lat: startNode.lat, lon: startNode.lon });
    }
  }
  
  // Add destination if not too close to last waypoint
  const lastWp = waypoints[waypoints.length - 1];
  const distToDest = calculateDistanceNm(lastWp.lat, lastWp.lon, toLat, toLon);
  if (distToDest > 5) {
    waypoints.push({ lat: toLat, lon: toLon });
  } else {
    // Replace last point with exact destination
    waypoints[waypoints.length - 1] = { lat: toLat, lon: toLon };
  }
  
  const totalDistance = calculateTotalDistance(waypoints);
  
  console.log('[RouteEngine] Route calculated:', {
    waypointCount: waypoints.length,
    distance: totalDistance.toFixed(1) + ' nm'
  });
  
  return { waypoints, distance: totalDistance };
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

