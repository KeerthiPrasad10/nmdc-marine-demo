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
// All coordinates use 3 decimal places for ~100m precision
const MARITIME_NETWORK: NetworkNode[] = [
  // Persian Gulf - Southern Lane (main UAE shipping lane, stays south of Qatar)
  { id: 'PG_S1', lat: 24.250, lon: 54.350, name: 'Abu Dhabi Offshore', connections: ['PG_S2', 'PG_C1'] },
  { id: 'PG_S2', lat: 24.050, lon: 53.500, name: 'West Abu Dhabi', connections: ['PG_S1', 'PG_S3', 'PG_C2'] },
  { id: 'PG_S3', lat: 24.000, lon: 52.600, name: 'Zirku Area', connections: ['PG_S2', 'PG_S4', 'PG_C2'] },
  { id: 'PG_S4', lat: 24.100, lon: 51.600, name: 'South Qatar', connections: ['PG_S3', 'PG_S5', 'PG_W1'] },
  { id: 'PG_S5', lat: 24.250, lon: 50.850, name: 'SW Qatar', connections: ['PG_S4', 'PG_W2'] },
  
  // Persian Gulf - Central Lane
  { id: 'PG_C1', lat: 25.050, lon: 54.750, name: 'Dubai Offshore', connections: ['PG_S1', 'PG_C2', 'PG_N1'] },
  { id: 'PG_C2', lat: 25.200, lon: 53.100, name: 'Central Gulf', connections: ['PG_S2', 'PG_S3', 'PG_C1', 'PG_C3'] },
  { id: 'PG_C3', lat: 25.500, lon: 52.100, name: 'Halul Area', connections: ['PG_C2', 'PG_W1', 'PG_N2'] },
  
  // Persian Gulf - Western Lane (Qatar/Bahrain/Saudi)
  { id: 'PG_W1', lat: 25.050, lon: 51.350, name: 'East Doha', connections: ['PG_S4', 'PG_C3', 'PG_W2', 'PG_W3'] },
  { id: 'PG_W2', lat: 25.550, lon: 50.550, name: 'West Doha', connections: ['PG_S5', 'PG_W1', 'PG_W3', 'PG_W4'] },
  { id: 'PG_W3', lat: 26.050, lon: 51.050, name: 'North Qatar', connections: ['PG_W1', 'PG_W2', 'PG_N2', 'PG_W4'] },
  { id: 'PG_W4', lat: 26.350, lon: 50.350, name: 'Bahrain East', connections: ['PG_W2', 'PG_W3', 'PG_W5'] },
  { id: 'PG_W5', lat: 26.750, lon: 50.050, name: 'Dammam Approach', connections: ['PG_W4', 'PG_NW1'] },
  
  // Persian Gulf - Northern Lane (toward Kuwait/Iraq)
  { id: 'PG_N1', lat: 25.850, lon: 55.050, name: 'Sharjah Offshore', connections: ['PG_C1', 'PG_N2', 'HORMUZ_S'] },
  { id: 'PG_N2', lat: 26.250, lon: 53.050, name: 'North Central Gulf', connections: ['PG_C3', 'PG_W3', 'PG_N1', 'PG_N3'] },
  { id: 'PG_N3', lat: 26.850, lon: 52.050, name: 'NE Gulf', connections: ['PG_N2', 'PG_NW1', 'PG_N4'] },
  { id: 'PG_N4', lat: 27.550, lon: 51.050, name: 'Iran South', connections: ['PG_N3', 'PG_NW1'] },
  
  // Persian Gulf - Northwest (Kuwait/Iraq)
  { id: 'PG_NW1', lat: 28.550, lon: 49.550, name: 'Kuwait Approach', connections: ['PG_W5', 'PG_N3', 'PG_N4', 'PG_NW2'] },
  { id: 'PG_NW2', lat: 29.550, lon: 48.550, name: 'Kuwait/Basra', connections: ['PG_NW1'] },
  
  // Strait of Hormuz
  { id: 'HORMUZ_S', lat: 26.050, lon: 56.050, name: 'Hormuz South', connections: ['PG_N1', 'HORMUZ_C'] },
  { id: 'HORMUZ_C', lat: 26.350, lon: 56.550, name: 'Hormuz Center', connections: ['HORMUZ_S', 'HORMUZ_N'] },
  { id: 'HORMUZ_N', lat: 26.550, lon: 57.050, name: 'Hormuz North', connections: ['HORMUZ_C', 'OMAN_N'] },
  
  // Gulf of Oman
  { id: 'OMAN_N', lat: 25.550, lon: 57.550, name: 'Fujairah Offshore', connections: ['HORMUZ_N', 'OMAN_C'] },
  { id: 'OMAN_C', lat: 24.550, lon: 58.550, name: 'Gulf of Oman Central', connections: ['OMAN_N', 'OMAN_S', 'OMAN_E'] },
  { id: 'OMAN_S', lat: 23.550, lon: 58.550, name: 'Muscat Offshore', connections: ['OMAN_C', 'OMAN_SE'] },
  { id: 'OMAN_E', lat: 24.050, lon: 60.050, name: 'East Gulf of Oman', connections: ['OMAN_C', 'OMAN_SE', 'ARAB_N'] },
  { id: 'OMAN_SE', lat: 22.550, lon: 60.050, name: 'Sur Offshore', connections: ['OMAN_S', 'OMAN_E', 'ARAB_N'] },
  
  // Arabian Sea
  { id: 'ARAB_N', lat: 21.050, lon: 62.050, name: 'North Arabian Sea', connections: ['OMAN_E', 'OMAN_SE', 'ARAB_C'] },
  { id: 'ARAB_C', lat: 19.050, lon: 60.050, name: 'Central Arabian Sea', connections: ['ARAB_N', 'ARAB_S'] },
  { id: 'ARAB_S', lat: 17.050, lon: 55.050, name: 'Salalah Offshore', connections: ['ARAB_C'] },
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

