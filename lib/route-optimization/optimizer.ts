/**
 * Maritime Route Optimizer
 * 
 * Calculates optimal voyage routes considering:
 * - Weather systems to avoid
 * - Ocean currents (simplified)
 * - Fuel efficiency
 * - Time optimization
 */

import {
  Coordinates,
  Waypoint,
  WeatherZone,
  Route,
  RouteSegment,
  RouteOptimizationResult,
  RouteOptimization,
  VesselForRouting,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const FUEL_COST_USD_PER_LITER = 0.85;
const EARTH_RADIUS_NM = 3440.065;

// ============================================================================
// Puget Sound Land Avoidance System
// Ferries must avoid crossing land - this includes:
// 1. Kitsap Peninsula
// 2. Whidbey Island and other islands
// 3. Routes through narrow channels and passages
// ============================================================================

interface CoastalWaypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  region: string;
}

// Key waypoints for ferry routing in Puget Sound
// These define safe ferry corridors that avoid land
const PUGET_SOUND_WAYPOINTS: CoastalWaypoint[] = [
  // Central Sound (Seattle-Bainbridge-Bremerton area)
  { id: 'seattle-terminal', name: 'Seattle Terminal', lat: 47.602, lng: -122.339, region: 'central_sound' },
  { id: 'mid-sound-seattle', name: 'Mid Sound Seattle', lat: 47.61, lng: -122.42, region: 'central_sound' },
  { id: 'bainbridge-approach', name: 'Bainbridge Approach', lat: 47.623, lng: -122.50, region: 'central_sound' },
  
  // North Sound (Edmonds-Kingston-Mukilteo-Clinton)
  { id: 'edmonds-terminal', name: 'Edmonds Terminal', lat: 47.814, lng: -122.384, region: 'north_sound' },
  { id: 'mid-sound-north', name: 'Mid Sound North', lat: 47.81, lng: -122.44, region: 'north_sound' },
  { id: 'kingston-approach', name: 'Kingston Approach', lat: 47.797, lng: -122.495, region: 'north_sound' },
  
  // South Sound (Fauntleroy-Vashon-Southworth)
  { id: 'fauntleroy-terminal', name: 'Fauntleroy Terminal', lat: 47.523, lng: -122.393, region: 'south_sound' },
  { id: 'vashon-approach', name: 'Vashon Approach', lat: 47.509, lng: -122.464, region: 'south_sound' },
  
  // Admiralty Inlet (Port Townsend-Coupeville)
  { id: 'port-townsend-terminal', name: 'Port Townsend', lat: 48.113, lng: -122.760, region: 'admiralty_inlet' },
  { id: 'mid-admiralty', name: 'Mid Admiralty', lat: 48.14, lng: -122.72, region: 'admiralty_inlet' },
  { id: 'coupeville-approach', name: 'Coupeville Approach', lat: 48.159, lng: -122.674, region: 'admiralty_inlet' },
  
  // San Juan Islands (Anacortes-Friday Harbor-Orcas-Lopez)
  { id: 'anacortes-terminal', name: 'Anacortes Terminal', lat: 48.507, lng: -122.678, region: 'san_juan' },
  { id: 'friday-harbor-approach', name: 'Friday Harbor', lat: 48.535, lng: -123.014, region: 'san_juan' },
];

/**
 * Check if a point is over land using simplified Puget Sound coastline data
 * 
 * GEOGRAPHY REMINDER:
 * - Puget Sound is a complex waterway with many peninsulas and islands
 * - Ferry routes generally follow established channels
 * - Simple bounding box approach for demo purposes
 */
function isPointOverLand(point: Coordinates): boolean {
  const { lat, lng } = point;
  
  // === KITSAP PENINSULA ===
  // Roughly between -122.7 and -122.5 lng, 47.3 to 47.8 lat
  if (lng >= -122.65 && lng <= -122.45) {
    if (lat >= 47.35 && lat <= 47.75) {
      // Interior of Kitsap Peninsula
      return true;
    }
  }
  
  // === SEATTLE / EAST SHORE ===
  // East of approximately -122.35 is generally land
  if (lng > -122.30 && lat >= 47.4 && lat <= 47.8) {
    return true; // Seattle metro area
  }
  
  // === WHIDBEY ISLAND (simplified) ===
  if (lng >= -122.75 && lng <= -122.55 && lat >= 48.0 && lat <= 48.4) {
    return true;
  }
  
  // === OLYMPIC PENINSULA (west side) ===
  if (lng < -122.85 && lat >= 47.5 && lat <= 48.2) {
    return true;
  }
  
  // === SAN JUAN ISLANDS (simplified - treat as navigable) ===
  // Ferry routes through San Juan Islands are established channels
  // Return false for this area to allow routing
  
  return false;
}

/**
 * Check if a route segment crosses land
 */
function doesRouteCrossLand(from: Coordinates, to: Coordinates, checkPoints: number = 20): boolean {
  // Check multiple points along the route
  for (let i = 0; i <= checkPoints; i++) {
    const fraction = i / checkPoints;
    const point: Coordinates = {
      lat: from.lat + (to.lat - from.lat) * fraction,
      lng: from.lng + (to.lng - from.lng) * fraction,
    };
    
    if (isPointOverLand(point)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a route needs coastal waypoints (crosses land or goes around peninsula)
 */
function needsCoastalRouting(origin: Coordinates, destination: Coordinates): boolean {
  // If both points are on different sides of land masses, need routing
  const originIsWest = origin.lng < -122.5;  // West of Puget Sound (Kitsap/Olympic side)
  const destIsWest = destination.lng < -122.5;
  
  // If one is on the west side and other on east, need coastal routing
  if (originIsWest !== destIsWest) {
    return true;
  }
  
  // Check if direct route would cross land
  if (doesRouteCrossLand(origin, destination)) {
    return true;
  }
  
  return false;
}

/**
 * Get the best channel waypoints for routing between two points
 * This ensures ferries stay in navigable waters and don't cross land
 */
function getCoastalWaypoints(origin: Coordinates, destination: Coordinates): Waypoint[] {
  if (!needsCoastalRouting(origin, destination)) {
    return [];
  }
  
  const waypoints: Waypoint[] = [];
  const originIsWest = origin.lng < -122.5;
  const destIsWest = destination.lng < -122.5;
  
  // Case 1: Cross-Sound routing (Seattle side to/from Kitsap/Olympic side)
  if (originIsWest !== destIsWest) {
    if (!originIsWest) {
      // Going from Seattle/east side to Kitsap/west side
      for (const wp of PUGET_SOUND_WAYPOINTS) {
        if (wp.region === 'puget_sound_central' || wp.region === 'straits_of_juan_de_fuca') {
          // Include if it helps the route
          if (wp.lat >= Math.min(origin.lat, destination.lat) - 0.2 &&
              wp.lat <= Math.max(origin.lat, destination.lat) + 0.2) {
            waypoints.push({
              id: `coastal-${wp.id}`,
              lat: wp.lat,
              lng: wp.lng,
              name: wp.name,
              type: 'coastal_waypoint' as any,
              notes: 'Ferry channel routing across Puget Sound',
            });
          }
        }
      }
    } else {
      // Going from Kitsap/west side to Seattle/east side
      const reversedWaypoints = [...PUGET_SOUND_WAYPOINTS].reverse();
      for (const wp of reversedWaypoints) {
        if (wp.region === 'puget_sound_central' || wp.region === 'puget_sound_south' || wp.region === 'puget_sound_north') {
          if (wp.lat >= Math.min(origin.lat, destination.lat) - 0.2 &&
              wp.lat <= Math.max(origin.lat, destination.lat) + 0.2) {
            waypoints.push({
              id: `coastal-${wp.id}`,
              lat: wp.lat,
              lng: wp.lng,
              name: wp.name,
              type: 'coastal_waypoint' as any,
              notes: 'Ferry channel routing across Puget Sound',
            });
          }
        }
      }
    }
    return waypoints;
  }
  
  // Case 2: Within the same side of Puget Sound - need to go around land (e.g., islands)
  // Find a navigable corridor that avoids land
  
  // Determine routing direction
  const goingNorthToSouth = origin.lat > destination.lat;
  const originInNorthSound = origin.lat > 47.8;
  const destInSouthSound = destination.lat < 47.5;
  
  // For routes from north Sound (San Juan Islands) to south Sound (Tacoma)
  // We need to route through the main channel
  if (originInNorthSound && destInSouthSound) {
    const midLat = (origin.lat + destination.lat) / 2;
    const midLng = (origin.lng + destination.lng) / 2;
    
    // Add waypoints that create a navigable arc through the Sound
    waypoints.push({
      id: 'coastal-channel-1',
      lat: origin.lat - 0.15,
      lng: Math.max(origin.lng, -122.45),
      name: 'Channel Waypoint North',
      type: 'coastal_waypoint' as any,
      notes: 'Channel routing through Puget Sound',
    });
    
    waypoints.push({
      id: 'coastal-channel-2',
      lat: midLat,
      lng: midLng,
      name: 'Mid-Sound Channel',
      type: 'coastal_waypoint' as any,
      notes: 'Main Puget Sound shipping channel',
    });
    
    waypoints.push({
      id: 'coastal-channel-3',
      lat: destination.lat + 0.15,
      lng: Math.max(destination.lng, -122.45),
      name: 'Channel Waypoint South',
      type: 'coastal_waypoint' as any,
      notes: 'Channel approach to destination',
    });
    
    return waypoints;
  }
  
  // For routes from south Sound to north Sound
  if (!originInNorthSound && destination.lat > 47.8) {
    const midLat = (origin.lat + destination.lat) / 2;
    const midLng = (origin.lng + destination.lng) / 2;
    
    waypoints.push({
      id: 'coastal-channel-1',
      lat: origin.lat + 0.15,
      lng: Math.max(origin.lng, -122.45),
      name: 'Channel Waypoint South',
      type: 'coastal_waypoint' as any,
      notes: 'Channel routing through Puget Sound',
    });
    
    waypoints.push({
      id: 'coastal-channel-2',
      lat: midLat,
      lng: midLng,
      name: 'Mid-Sound Channel',
      type: 'coastal_waypoint' as any,
      notes: 'Main Puget Sound shipping channel',
    });
    
    waypoints.push({
      id: 'coastal-channel-3',
      lat: destination.lat - 0.15,
      lng: Math.max(destination.lng, -122.45),
      name: 'Channel Waypoint North',
      type: 'coastal_waypoint' as any,
      notes: 'Channel approach to destination',
    });
    
    return waypoints;
  }
  
  // General case: Just add intermediate channel waypoints to avoid any land crossing
  // Find the best navigable path
  const relevantWaypoints = PUGET_SOUND_WAYPOINTS.filter(wp => {
    // Include waypoints that are between origin and destination
    const latInRange = wp.lat >= Math.min(origin.lat, destination.lat) - 0.5 &&
                       wp.lat <= Math.max(origin.lat, destination.lat) + 0.5;
    const lngInRange = wp.lng >= Math.min(origin.lng, destination.lng) - 0.5 &&
                       wp.lng <= Math.max(origin.lng, destination.lng) + 0.5;
    return latInRange || lngInRange;
  });
  
  // Sort by distance from origin
  relevantWaypoints.sort((a, b) => {
    const distA = Math.sqrt(Math.pow(a.lat - origin.lat, 2) + Math.pow(a.lng - origin.lng, 2));
    const distB = Math.sqrt(Math.pow(b.lat - origin.lat, 2) + Math.pow(b.lng - origin.lng, 2));
    return distA - distB;
  });
  
  for (const wp of relevantWaypoints) {
    // Check if adding this waypoint helps avoid land
    const currentLast = waypoints.length > 0 ? waypoints[waypoints.length - 1] : origin;
    if (!doesRouteCrossLand(currentLast, wp) && !doesRouteCrossLand(wp, destination)) {
      waypoints.push({
        id: `coastal-${wp.id}`,
        lat: wp.lat,
        lng: wp.lng,
        name: wp.name,
        type: 'coastal_waypoint' as any,
        notes: 'Channel routing waypoint',
      });
      
      // If we now have a clear path to destination, stop adding waypoints
      if (!doesRouteCrossLand(wp, destination)) {
        break;
      }
    }
  }
  
  return waypoints;
}

// Fuel consumption rates by vessel type (liters per nautical mile)
const FUEL_RATES: Record<string, number> = {
  ferry: 55,
  ferry_jumbo_mark_ii: 65,
  ferry_jumbo: 60,
  ferry_super: 50,
  ferry_issaquah_130: 45,
  ferry_olympic: 40,
  ferry_evergreen_state: 35,
  default: 50,
};

// ============================================================================
// Geographic Calculations
// ============================================================================

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function toDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistanceNm(from: Coordinates, to: Coordinates): number {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_NM * c;
}

/**
 * Calculate bearing from point A to point B
 */
export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x =
    Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
    Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  const bearing = Math.atan2(y, x);
  return (toDeg(bearing) + 360) % 360;
}

/**
 * Calculate a point at given distance and bearing from origin
 */
export function calculateDestinationPoint(
  origin: Coordinates,
  distanceNm: number,
  bearingDeg: number
): Coordinates {
  const bearing = toRad(bearingDeg);
  const angularDistance = distanceNm / EARTH_RADIUS_NM;
  
  const lat1 = toRad(origin.lat);
  const lng1 = toRad(origin.lng);
  
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
    Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
    Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
  );
  
  return {
    lat: toDeg(lat2),
    lng: toDeg(lng2),
  };
}

/**
 * Check if a point is within a circular zone
 */
function isPointInZone(point: Coordinates, zone: WeatherZone): boolean {
  const distance = calculateDistanceNm(point, zone.center);
  return distance <= zone.radiusNm;
}

/**
 * Check if a route segment intersects a weather zone
 */
function doesSegmentIntersectZone(
  from: Coordinates,
  to: Coordinates,
  zone: WeatherZone,
  checkPoints: number = 10
): boolean {
  // Check start and end points
  if (isPointInZone(from, zone) || isPointInZone(to, zone)) {
    return true;
  }
  
  // Check intermediate points along the segment
  const bearing = calculateBearing(from, to);
  const totalDistance = calculateDistanceNm(from, to);
  
  for (let i = 1; i < checkPoints; i++) {
    const fraction = i / checkPoints;
    const distance = totalDistance * fraction;
    const point = calculateDestinationPoint(from, distance, bearing);
    
    if (isPointInZone(point, zone)) {
      return true;
    }
  }
  
  return false;
}

// ============================================================================
// Route Generation
// ============================================================================

/**
 * Generate a direct route between two points
 * If the straight line crosses land, uses coastal waypoints for shortest VALID route
 */
function generateDirectRoute(
  vessel: VesselForRouting,
  origin: Coordinates,
  destination: Coordinates,
  originName: string,
  destinationName: string
): Route {
  const fuelRate = FUEL_RATES[vessel.type.toLowerCase()] || FUEL_RATES.default;
  const allWaypoints: Waypoint[] = [];
  
  // Start with origin
  const originWaypoint: Waypoint = {
    id: 'origin',
    ...origin,
    name: originName,
    type: 'origin',
    distanceFromPrevious: 0,
    cumulativeDistance: 0,
  };
  allWaypoints.push(originWaypoint);
  
  // If route crosses land, add coastal waypoints
  const coastalWaypoints = getCoastalWaypoints(origin, destination);
  if (coastalWaypoints.length > 0) {
    allWaypoints.push(...coastalWaypoints);
  }
  
  // Add destination
  const destinationWaypoint: Waypoint = {
    id: 'destination',
    ...destination,
    name: destinationName,
    type: 'destination',
  };
  allWaypoints.push(destinationWaypoint);
  
  // Calculate distances
  let cumulativeDistance = 0;
  for (let i = 1; i < allWaypoints.length; i++) {
    const dist = calculateDistanceNm(allWaypoints[i - 1], allWaypoints[i]);
    allWaypoints[i].distanceFromPrevious = dist;
    cumulativeDistance += dist;
    allWaypoints[i].cumulativeDistance = cumulativeDistance;
  }
  
  const totalDistance = cumulativeDistance;
  const duration = totalDistance / vessel.speed;
  const fuel = totalDistance * fuelRate;
  
  return {
    id: `route-direct-${Date.now()}`,
    vesselId: vessel.id,
    vesselName: vessel.name,
    origin: originWaypoint,
    destination: destinationWaypoint,
    waypoints: allWaypoints,
    totalDistanceNm: totalDistance,
    estimatedDurationHours: duration,
    estimatedFuelLiters: fuel,
    estimatedCostUSD: fuel * FUEL_COST_USD_PER_LITER,
    createdAt: new Date(),
    routeType: 'direct',
  };
}

/**
 * Calculate avoidance waypoints around a weather zone
 * Uses a simple perpendicular offset approach for reliable routing
 */
function calculateAvoidanceWaypoints(
  from: Coordinates,
  to: Coordinates,
  zone: WeatherZone
): Waypoint[] {
  const waypoints: Waypoint[] = [];
  
  // Add safety buffer to zone radius (25% buffer)
  const avoidanceRadius = zone.radiusNm * 1.25;
  
  // Calculate bearings
  const directBearing = calculateBearing(from, to);
  const bearingToZone = calculateBearing(from, zone.center);
  
  // Determine which side to go around
  // Check if zone is to the left or right of our direct path
  const bearingDiff = ((bearingToZone - directBearing) + 360) % 360;
  const zoneIsOnRight = bearingDiff > 0 && bearingDiff < 180;
  
  // Go around the opposite side - perpendicular offset from zone center
  // If zone is on right, we offset to the left (subtract 90 from direct bearing)
  // If zone is on left, we offset to the right (add 90 to direct bearing)
  const offsetBearing = zoneIsOnRight 
    ? (directBearing - 90 + 360) % 360  // Go left of the zone
    : (directBearing + 90) % 360;        // Go right of the zone
  
  // Create a single waypoint that's offset from the zone center
  // Position it perpendicular to the travel direction, at the avoidance radius
  const avoidancePoint = calculateDestinationPoint(
    zone.center,
    avoidanceRadius,
    offsetBearing
  );
  
  waypoints.push({
    id: `avoid-${zone.id}`,
    ...avoidancePoint,
    name: `Avoid ${zone.name || zone.type}`,
    type: 'weather_avoidance',
    notes: `Routing around ${zone.type}: ${zone.severity} severity`,
  });
  
  return waypoints;
}

/**
 * Generate an optimized route avoiding weather zones
 * Note: Coastal waypoints are already in the base route, this adds weather avoidance
 */
function generateOptimizedRoute(
  vessel: VesselForRouting,
  origin: Coordinates,
  destination: Coordinates,
  originName: string,
  destinationName: string,
  weatherZones: WeatherZone[]
): { route: Route; avoidedZones: WeatherZone[]; optimizations: RouteOptimization[] } {
  const avoidedZones: WeatherZone[] = [];
  const optimizations: RouteOptimization[] = [];
  const allWaypoints: Waypoint[] = [];
  
  // Start with origin
  const originWaypoint: Waypoint = {
    id: 'origin',
    ...origin,
    name: originName,
    type: 'origin',
    distanceFromPrevious: 0,
    cumulativeDistance: 0,
  };
  allWaypoints.push(originWaypoint);
  
  // Add coastal waypoints if route would cross land (same as direct route)
  const coastalWaypoints = getCoastalWaypoints(origin, destination);
  if (coastalWaypoints.length > 0) {
    allWaypoints.push(...coastalWaypoints);
  }
  
  // Determine starting point for weather checks
  let currentFrom = coastalWaypoints.length > 0 
    ? coastalWaypoints[coastalWaypoints.length - 1] 
    : origin;
  const activeZones = weatherZones.filter(z => 
    z.avoidanceRecommendation !== 'optional' &&
    doesSegmentIntersectZone(origin, destination, z)
  );
  
  // Sort zones by distance from origin
  activeZones.sort((a, b) => 
    calculateDistanceNm(origin, a.center) - calculateDistanceNm(origin, b.center)
  );
  
  for (const zone of activeZones) {
    // Check if current path to destination intersects this zone
    if (doesSegmentIntersectZone(currentFrom, destination, zone)) {
      // Calculate avoidance waypoints
      const avoidanceWaypoints = calculateAvoidanceWaypoints(currentFrom, destination, zone);
      allWaypoints.push(...avoidanceWaypoints);
      
      avoidedZones.push(zone);
      
      // Calculate the extra distance
      const directDistance = calculateDistanceNm(currentFrom, destination);
      let avoidanceDistance = 0;
      let prevPoint = currentFrom;
      for (const wp of avoidanceWaypoints) {
        avoidanceDistance += calculateDistanceNm(prevPoint, wp);
        prevPoint = wp;
      }
      avoidanceDistance += calculateDistanceNm(prevPoint, destination);
      
      const extraDistance = avoidanceDistance - directDistance;
      const fuelRate = FUEL_RATES[vessel.type.toLowerCase()] || FUEL_RATES.default;
      
      optimizations.push({
        id: `opt-avoid-${zone.id}`,
        type: 'weather_avoidance',
        description: `Avoid ${zone.name || zone.type} (${zone.severity})`,
        impact: {
          distanceChangeNm: extraDistance,
          timeChangeHours: extraDistance / vessel.speed,
          fuelChangeLiters: extraDistance * fuelRate,
          safetyBenefit: zone.severity === 'severe' 
            ? 'Avoids dangerous conditions' 
            : 'Reduces weather-related risks',
        },
        reasoning: `Route deviation of ${extraDistance.toFixed(1)}nm to avoid ${zone.type} with ${zone.windSpeedKnots || 'high'} knot winds and ${zone.waveHeightM || 'significant'} meter waves. ${zone.avoidanceRecommendation === 'mandatory' ? 'Mandatory avoidance required.' : 'Recommended for crew safety and cargo protection.'}`,
        affectedWaypoints: avoidanceWaypoints.map(w => w.id),
      });
      
      // Update current position for next zone check
      if (avoidanceWaypoints.length > 0) {
        currentFrom = avoidanceWaypoints[avoidanceWaypoints.length - 1];
      }
    }
  }
  
  // Add destination
  const destinationWaypoint: Waypoint = {
    id: 'destination',
    ...destination,
    name: destinationName,
    type: 'destination',
  };
  allWaypoints.push(destinationWaypoint);
  
  // Calculate distances for all waypoints
  let cumulativeDistance = 0;
  for (let i = 1; i < allWaypoints.length; i++) {
    const dist = calculateDistanceNm(allWaypoints[i - 1], allWaypoints[i]);
    allWaypoints[i].distanceFromPrevious = dist;
    cumulativeDistance += dist;
    allWaypoints[i].cumulativeDistance = cumulativeDistance;
  }
  
  const fuelRate = FUEL_RATES[vessel.type.toLowerCase()] || FUEL_RATES.default;
  const totalFuel = cumulativeDistance * fuelRate;
  const totalDuration = cumulativeDistance / vessel.speed;
  
  const route: Route = {
    id: `route-optimized-${Date.now()}`,
    vesselId: vessel.id,
    vesselName: vessel.name,
    origin: originWaypoint,
    destination: destinationWaypoint,
    waypoints: allWaypoints,
    totalDistanceNm: cumulativeDistance,
    estimatedDurationHours: totalDuration,
    estimatedFuelLiters: totalFuel,
    estimatedCostUSD: totalFuel * FUEL_COST_USD_PER_LITER,
    createdAt: new Date(),
    routeType: 'weather_routed',
  };
  
  return { route, avoidedZones, optimizations };
}

// ============================================================================
// Main Optimization Function
// ============================================================================

export interface OptimizeRouteParams {
  vessel: VesselForRouting;
  origin: Coordinates;
  originName: string;
  destination: Coordinates;
  destinationName: string;
  weatherZones?: WeatherZone[];
  preferences?: {
    prioritize: 'time' | 'fuel' | 'safety' | 'balanced';
  };
}

export function optimizeRoute(params: OptimizeRouteParams): RouteOptimizationResult {
  const {
    vessel,
    origin,
    originName,
    destination,
    destinationName,
    weatherZones = [],
    preferences = { prioritize: 'balanced' },
  } = params;
  
  // Generate direct route
  const originalRoute = generateDirectRoute(vessel, origin, destination, originName, destinationName);
  
  // Generate optimized route
  const { route: optimizedRoute, avoidedZones, optimizations } = generateOptimizedRoute(
    vessel,
    origin,
    destination,
    originName,
    destinationName,
    weatherZones
  );
  
  // Calculate summary
  const distanceDelta = originalRoute.totalDistanceNm - optimizedRoute.totalDistanceNm;
  const timeDelta = originalRoute.estimatedDurationHours - optimizedRoute.estimatedDurationHours;
  const fuelDelta = originalRoute.estimatedFuelLiters - optimizedRoute.estimatedFuelLiters;
  const costDelta = originalRoute.estimatedCostUSD - optimizedRoute.estimatedCostUSD;
  
  // Determine safety improvement
  let safetyImprovement: 'significant' | 'moderate' | 'minor' | 'none' = 'none';
  if (avoidedZones.some(z => z.severity === 'severe')) {
    safetyImprovement = 'significant';
  } else if (avoidedZones.some(z => z.severity === 'moderate')) {
    safetyImprovement = 'moderate';
  } else if (avoidedZones.length > 0) {
    safetyImprovement = 'minor';
  }
  
  // Check if coastal routing was required (route would cross land)
  const requiresCoastalRouting = needsCoastalRouting(origin, destination);
  
  // Determine recommendation
  let recommendation: 'use_optimized' | 'use_original' | 'review_required' = 'use_original';
  let reasoningText = '';
  
  if (avoidedZones.length === 0) {
    // No weather hazards - use direct route (which already includes coastal waypoints if needed)
    recommendation = 'use_original';
    if (requiresCoastalRouting) {
      reasoningText = `Route follows standard shipping lanes around the Kitsap Peninsula. No weather hazards detected. Distance: ${originalRoute.totalDistanceNm.toFixed(0)}nm.`;
    } else {
      reasoningText = 'No weather hazards detected on route. Direct route is optimal.';
    }
  } else if (safetyImprovement === 'significant') {
    recommendation = 'use_optimized';
    reasoningText = `Optimized route avoids ${avoidedZones.length} hazardous zone(s) including severe conditions. Additional ${Math.abs(distanceDelta).toFixed(1)}nm is justified for crew and vessel safety.`;
  } else if (preferences.prioritize === 'safety') {
    recommendation = 'use_optimized';
    reasoningText = `Safety-prioritized routing avoids ${avoidedZones.length} weather zone(s). ${Math.abs(distanceDelta).toFixed(1)}nm additional distance for improved safety margins.`;
  } else if (preferences.prioritize === 'time' && distanceDelta > 0) {
    recommendation = 'review_required';
    reasoningText = `Time-priority conflicts with weather avoidance. Direct route is ${Math.abs(distanceDelta).toFixed(1)}nm shorter but passes through weather. Manual review recommended.`;
  } else if (Math.abs(distanceDelta) < 10) {
    recommendation = 'use_optimized';
    reasoningText = `Minimal distance difference (${Math.abs(distanceDelta).toFixed(1)}nm) with improved safety. Optimized route recommended.`;
  } else {
    recommendation = 'review_required';
    reasoningText = `Trade-off between ${Math.abs(distanceDelta).toFixed(1)}nm extra distance and weather avoidance. Review based on weather severity and schedule flexibility.`;
  }
  
  // Calculate confidence
  let confidence = 80;
  if (weatherZones.length === 0) confidence = 95;
  else if (avoidedZones.length === 0) confidence = 90;
  else if (safetyImprovement === 'significant') confidence = 85;
  
  return {
    id: `opt-result-${Date.now()}`,
    timestamp: new Date(),
    vessel: {
      id: vessel.id,
      name: vessel.name,
      type: vessel.type,
      currentPosition: origin,
      speed: vessel.speed,
      fuelConsumptionRate: FUEL_RATES[vessel.type.toLowerCase()] || FUEL_RATES.default,
    },
    origin: originalRoute.origin,
    destination: originalRoute.destination,
    originalRoute,
    optimizedRoute,
    weatherZonesAvoided: avoidedZones,
    hazardsAvoided: [],
    optimizations,
    summary: {
      distanceDeltaNm: distanceDelta,
      timeDeltaHours: timeDelta,
      fuelDeltaLiters: fuelDelta,
      costDeltaUSD: costDelta,
      safetyImprovement,
    },
    recommendation,
    reasoningText,
    confidence,
  };
}

// ============================================================================
// Mock Weather Data Generator (for demo)
// ============================================================================

export function generateMockWeatherZones(
  origin: Coordinates,
  destination: Coordinates
): WeatherZone[] {
  const zones: WeatherZone[] = [];
  const now = new Date();
  
  // Calculate midpoint
  const midLat = (origin.lat + destination.lat) / 2;
  const midLng = (origin.lng + destination.lng) / 2;
  
  // Add a storm system near the midpoint (offset slightly)
  const routeDistance = calculateDistanceNm(origin, destination);
  
  if (routeDistance > 30) {
    // Add a storm that intersects the direct route
    zones.push({
      id: 'storm-1',
      type: 'storm',
      severity: 'severe',
      center: {
        lat: midLat + 0.1,
        lng: midLng - 0.1,
      },
      radiusNm: Math.min(25, routeDistance * 0.2),
      windSpeedKnots: 45,
      waveHeightM: 4.5,
      validFrom: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      validTo: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      name: 'Low Pressure System',
      avoidanceRecommendation: 'mandatory',
    });
  }
  
  if (routeDistance > 60) {
    // Add a high wind area
    zones.push({
      id: 'wind-1',
      type: 'high_wind',
      severity: 'moderate',
      center: {
        lat: origin.lat + (destination.lat - origin.lat) * 0.7,
        lng: origin.lng + (destination.lng - origin.lng) * 0.7 + 0.15,
      },
      radiusNm: 15,
      windSpeedKnots: 32,
      waveHeightM: 2.8,
      validFrom: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      validTo: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      name: 'Shamal Wind Advisory',
      avoidanceRecommendation: 'recommended',
    });
  }
  
  return zones;
}

// ============================================================================
// Formatting Helpers
// ============================================================================

export function formatDistance(nm: number): string {
  return `${nm.toFixed(1)} nm`;
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return `${days}d ${remainingHours}h`;
}

export function formatFuel(liters: number): string {
  if (liters >= 1000) return `${(liters / 1000).toFixed(1)}K L`;
  return `${liters.toFixed(0)} L`;
}

export function formatCurrency(usd: number): string {
  if (Math.abs(usd) >= 1000) return `$${(usd / 1000).toFixed(1)}K`;
  return `$${usd.toFixed(0)}`;
}

