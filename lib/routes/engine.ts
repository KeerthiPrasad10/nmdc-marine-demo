/**
 * Route Engine - Core route calculation using Datalastic Sea Routes API
 * 
 * Provides realistic maritime routing that avoids land, with integrated
 * fuel consumption, emissions, and weather risk calculations.
 */

import { getDatalasticClient, isDatalasticConfigured, SeaRouteWaypoint, calculateDistanceNm, calculateBearing } from '@/lib/datalastic';
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
// Route Fetching from Datalastic
// ============================================================================

/**
 * Fetch a realistic sea route from Datalastic API
 * Returns waypoints that follow shipping lanes and avoid land
 */
export async function fetchSeaRoute(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): Promise<{ waypoints: SeaRouteWaypoint[]; distance: number }> {
  if (!isDatalasticConfigured()) {
    // Fallback: generate a simple great-circle approximation
    console.warn('[RouteEngine] Datalastic not configured, using fallback route');
    return generateFallbackRoute(fromLat, fromLon, toLat, toLon);
  }

  try {
    const client = getDatalasticClient();
    const response = await client.getSeaRouteByCoordinates(fromLat, fromLon, toLat, toLon);
    
    return {
      waypoints: response.data.route,
      distance: response.data.distance,
    };
  } catch (error) {
    console.error('[RouteEngine] Failed to fetch sea route:', error);
    // Fallback to simple route
    return generateFallbackRoute(fromLat, fromLon, toLat, toLon);
  }
}

/**
 * Generate a fallback route when Datalastic is unavailable
 * Creates intermediate waypoints along a great-circle path
 */
function generateFallbackRoute(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): { waypoints: SeaRouteWaypoint[]; distance: number } {
  const distance = calculateDistanceNm(fromLat, fromLon, toLat, toLon);
  
  // Generate intermediate points (one every ~20nm or at least 3 total)
  const numPoints = Math.max(3, Math.ceil(distance / 20));
  const waypoints: SeaRouteWaypoint[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    waypoints.push({
      lat: fromLat + (toLat - fromLat) * t,
      lon: fromLon + (toLon - fromLon) * t,
    });
  }
  
  return { waypoints, distance };
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

