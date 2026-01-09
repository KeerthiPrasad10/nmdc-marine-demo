/**
 * Route Engine - Core route calculation using Searoute.js
 * 
 * Provides realistic maritime routing that avoids land, with integrated
 * fuel consumption, emissions, and weather risk calculations.
 * 
 * Uses searoute-ts library for proper maritime routing that follows
 * shipping lanes and navigates around landmasses.
 */

import { seaRoute } from 'searoute-ts';
import type { Feature, Point, LineString } from 'geojson';
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
// Route Fetching using Searoute.js
// ============================================================================

/**
 * Create a GeoJSON Point Feature for searoute-ts
 */
function createGeoJSONPoint(lon: number, lat: number): Feature<Point> {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: [lon, lat], // GeoJSON uses [longitude, latitude]
    },
  };
}

/**
 * Fetch a realistic sea route using searoute-ts library
 * Returns waypoints that follow shipping lanes and avoid land
 */
export async function fetchSeaRoute(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): Promise<{ waypoints: SeaRouteWaypoint[]; distance: number }> {
  console.log('[RouteEngine] Calculating sea route with searoute-ts:', { fromLat, fromLon, toLat, toLon });

  try {
    // Create GeoJSON Point features for origin and destination
    const origin = createGeoJSONPoint(fromLon, fromLat);
    const destination = createGeoJSONPoint(toLon, toLat);
    
    // Calculate route using searoute-ts (returns nautical miles by default)
    const routeResult = seaRoute(origin, destination, 'nm') as Feature<LineString>;
    
    if (!routeResult || !routeResult.geometry || !routeResult.geometry.coordinates) {
      console.warn('[RouteEngine] Searoute returned no result, using fallback');
      return generateFallbackRoute(fromLat, fromLon, toLat, toLon);
    }
    
    // Extract coordinates from the LineString result
    // GeoJSON coordinates are [lon, lat], we need {lat, lon}
    const coordinates = routeResult.geometry.coordinates;
    const waypoints: SeaRouteWaypoint[] = coordinates.map(coord => ({
      lat: coord[1],
      lon: coord[0],
    }));
    
    // Get distance from properties (searoute-ts adds length property)
    const distance = (routeResult.properties?.length as number) || 
      calculateTotalDistance(waypoints);
    
    console.log('[RouteEngine] Sea route calculated:', {
      distance: distance.toFixed(1),
      waypointCount: waypoints.length,
    });
    
    return { waypoints, distance };
  } catch (error) {
    console.error('[RouteEngine] Searoute calculation failed:', error);
    console.error('[RouteEngine] Error details:', error instanceof Error ? error.message : String(error));
    // Fallback to basic route
    return generateFallbackRoute(fromLat, fromLon, toLat, toLon);
  }
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
 * Safe offshore latitude for routing in the Persian Gulf
 * Routes that would cross land should arc through this latitude
 */
const SAFE_OFFSHORE_LAT = 24.0; // South of most landmasses, in open water

/**
 * Check if a point is likely over land (simplified for UAE/Gulf region)
 * Uses a polygon-based approach for key landmasses
 */
function isOverLand(lat: number, lon: number): boolean {
  // Qatar peninsula (major obstacle in the Gulf)
  if (lat >= 24.4 && lat <= 26.2 && lon >= 50.7 && lon <= 51.7) {
    return true;
  }
  
  // Bahrain
  if (lat >= 25.8 && lat <= 26.3 && lon >= 50.3 && lon <= 50.8) {
    return true;
  }
  
  // UAE mainland - Abu Dhabi emirate coast
  // The coast runs roughly from (24.0, 51.5) to (24.5, 54.5)
  if (lat >= 23.5 && lat <= 25.5 && lon >= 53.5 && lon <= 56.5) {
    // Simplified UAE coastal boundary
    // Coast is roughly at lon = 54.0 to 54.5 depending on latitude
    const coastLon = 54.0 + (lat - 24.0) * 0.3;
    if (lon > coastLon) {
      return true;
    }
  }
  
  // Dubai and northern emirates
  if (lat >= 25.0 && lat <= 25.8 && lon >= 55.0 && lon <= 56.0) {
    if (lon > 55.2) return true;
  }
  
  // Musandam peninsula (Oman)
  if (lat >= 25.8 && lat <= 26.5 && lon >= 56.0 && lon <= 56.6) {
    return true;
  }
  
  // Iranian coast (northern Gulf)
  if (lat >= 26.5 && lat <= 30.0 && lon >= 51.0 && lon <= 56.5) {
    // Rough southern Iran coast - land is north of ~27.0 lat
    if (lat > 27.0) return true;
  }
  
  // Saudi Arabia eastern coast
  if (lat >= 24.0 && lat <= 28.0 && lon >= 49.0 && lon <= 50.5) {
    if (lon < 50.0) return true;
  }
  
  return false;
}

/**
 * Check if a route path crosses land by sampling multiple points
 */
function doesRouteCrossLand(fromLat: number, fromLon: number, toLat: number, toLon: number): boolean {
  // Check 10 points along the route
  for (let i = 1; i < 10; i++) {
    const t = i / 10;
    const lat = fromLat + (toLat - fromLat) * t;
    const lon = fromLon + (toLon - fromLon) * t;
    if (isOverLand(lat, lon)) {
      return true;
    }
  }
  return false;
}

/**
 * Generate a fallback route when Datalastic is unavailable
 * Creates intermediate waypoints that avoid cutting across land
 * Uses a simple arc approach: if direct path crosses land, route through safe offshore latitude
 */
function generateFallbackRoute(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): { waypoints: SeaRouteWaypoint[]; distance: number } {
  const waypoints: SeaRouteWaypoint[] = [];
  
  // Start point
  waypoints.push({ lat: fromLat, lon: fromLon });
  
  // Check if direct path would cross land by sampling multiple points
  const crossesLand = doesRouteCrossLand(fromLat, fromLon, toLat, toLon);
  
  console.log('[RouteEngine] Generating fallback route:', { fromLat, fromLon, toLat, toLon, crossesLand });
  
  if (crossesLand) {
    // Route needs to go around land using offshore arc
    console.log('[RouteEngine] Direct path crosses land, generating offshore arc');
    
    // Create an arc that goes through safe offshore waters
    // The arc goes south into open Persian Gulf waters
    const midLon = (fromLon + toLon) / 2;
    
    // Calculate how much to arc south based on how far the route spans
    const lonSpan = Math.abs(toLon - fromLon);
    const arcDepth = Math.min(1.5, lonSpan * 0.3); // Arc south by up to 1.5 degrees
    
    // Generate arc waypoints
    const numArcPoints = 4;
    for (let i = 1; i <= numArcPoints; i++) {
      const t = i / (numArcPoints + 1);
      
      // Linear interpolation for longitude
      const lon = fromLon + (toLon - fromLon) * t;
      
      // Arc south in the middle of the route
      const arcFactor = Math.sin(t * Math.PI);
      const baseLat = fromLat + (toLat - fromLat) * t;
      const lat = Math.min(baseLat, SAFE_OFFSHORE_LAT + arcFactor * 0.5);
      
      // Make sure the arc stays south of UAE coast
      const safeLat = Math.min(baseLat - arcDepth * arcFactor, lat);
      
      waypoints.push({ lat: safeLat, lon });
    }
  } else {
    // Direct path is over water - add intermediate points along a gentle curve
    const distance = calculateDistanceNm(fromLat, fromLon, toLat, toLon);
    const numPoints = Math.max(2, Math.ceil(distance / 40));
    
    for (let i = 1; i < numPoints; i++) {
      const t = i / numPoints;
      // Add a slight offshore curve (south/west = more offshore in UAE)
      const curveFactor = Math.sin(t * Math.PI) * 0.05;
      const lat = fromLat + (toLat - fromLat) * t - curveFactor;
      const lon = fromLon + (toLon - fromLon) * t - curveFactor;
      waypoints.push({ lat, lon });
    }
  }
  
  // End point
  waypoints.push({ lat: toLat, lon: toLon });
  
  // Calculate total distance
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistance += calculateDistanceNm(
      waypoints[i].lat, waypoints[i].lon,
      waypoints[i + 1].lat, waypoints[i + 1].lon
    );
  }
  
  console.log('[RouteEngine] Generated fallback route with', waypoints.length, 'waypoints, distance:', totalDistance.toFixed(1), 'nm');
  
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

