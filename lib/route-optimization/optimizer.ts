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
// UAE & Arabian Gulf Land Avoidance System
// Ships must avoid crossing land - this includes:
// 1. UAE mainland (Abu Dhabi, Dubai emirates)
// 2. Qatar peninsula
// 3. Routes between Arabian Gulf and Gulf of Oman (around Musandam)
// ============================================================================

interface CoastalWaypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  region: 'western_gulf' | 'uae_coast' | 'northern_emirates' | 'strait_of_hormuz' | 'gulf_of_oman';
}

// Key waypoints for maritime routing in the Arabian Gulf
// These define safe offshore corridors that avoid land
const GULF_MARITIME_WAYPOINTS: CoastalWaypoint[] = [
  // Western Gulf offshore (for routes from Das Island, Arzanah, Ruwais area)
  { id: 'western-offshore-south', name: 'Western Gulf S', lat: 24.40, lng: 52.80, region: 'western_gulf' },
  { id: 'western-offshore-mid', name: 'Western Gulf M', lat: 25.00, lng: 53.00, region: 'western_gulf' },
  { id: 'western-offshore-north', name: 'Western Gulf N', lat: 25.50, lng: 53.50, region: 'western_gulf' },
  
  // UAE coast - offshore corridor (stays well offshore of Abu Dhabi/Dubai coast)
  { id: 'abu-dhabi-offshore', name: 'Abu Dhabi Offshore', lat: 24.60, lng: 54.00, region: 'uae_coast' },
  { id: 'central-offshore', name: 'Central Offshore', lat: 25.00, lng: 54.50, region: 'uae_coast' },
  { id: 'dubai-offshore', name: 'Dubai Offshore', lat: 25.30, lng: 55.00, region: 'uae_coast' },
  
  // Northern Emirates coast
  { id: 'sharjah-offshore', name: 'Sharjah Offshore', lat: 25.50, lng: 55.50, region: 'northern_emirates' },
  { id: 'rak-offshore', name: 'RAK Offshore', lat: 25.80, lng: 55.95, region: 'northern_emirates' },
  
  // Strait of Hormuz / Musandam
  { id: 'musandam-west', name: 'Musandam West', lat: 26.15, lng: 56.20, region: 'strait_of_hormuz' },
  { id: 'strait-hormuz', name: 'Strait of Hormuz', lat: 26.30, lng: 56.50, region: 'strait_of_hormuz' },
  { id: 'musandam-east', name: 'Musandam East', lat: 26.10, lng: 56.65, region: 'strait_of_hormuz' },
  
  // Gulf of Oman side (east coast)
  { id: 'khor-fakkan', name: 'Khor Fakkan Approach', lat: 25.40, lng: 56.40, region: 'gulf_of_oman' },
  { id: 'fujairah-approach', name: 'Fujairah Approach', lat: 25.15, lng: 56.40, region: 'gulf_of_oman' },
];

/**
 * Check if a point is over land using accurate coastline data
 * 
 * GEOGRAPHY REMINDER:
 * - The Persian Gulf is to the NORTH of UAE
 * - UAE mainland is to the SOUTH
 * - Points with lat GREATER than coast = WATER
 * - Points with lat LESS than coast but within UAE borders = LAND
 */
function isPointOverLand(point: Coordinates): boolean {
  const { lat, lng } = point;
  
  // === QATAR PENINSULA ===
  // Qatar extends north into the Gulf from lat ~24.5 to ~26.2, lng ~50.7 to ~51.7
  if (lng >= 50.5 && lng <= 51.8) {
    // Qatar mainland starts around lat 24.5 and extends north to ~26.2
    // The peninsula is roughly 51.0-51.6 lng
    if (lng >= 50.75 && lng <= 51.65) {
      if (lat >= 24.4 && lat <= 26.25) {
        return true; // On Qatar peninsula
      }
    }
  }
  
  // === UAE MAINLAND ===
  // The UAE coastline is complex. Let's define it more accurately.
  // Key coastal points (approximate):
  // - Ghuweifat border (west): 24.15°N, 51.5°E
  // - Ruwais: 24.1°N, 52.7°E
  // - Jebel Dhanna: 24.2°N, 52.6°E  
  // - Abu Dhabi coast: 24.35°N, 54.4°E
  // - Khalifa Port: 24.8°N, 54.65°E
  // - Dubai: 25.25°N, 55.3°E
  // - Sharjah: 25.35°N, 55.4°E
  
  // Define coastal latitude at different longitudes
  // Points SOUTH of this line (lower lat) and within UAE lng range = LAND
  function getCoastLatitude(longitude: number): number {
    // Piecewise linear approximation of UAE coastline
    if (longitude < 51.5) return 24.0; // West of UAE
    if (longitude < 52.5) return 24.0 + (longitude - 51.5) * 0.1; // Western border to Ruwais
    if (longitude < 53.5) return 24.1 + (longitude - 52.5) * 0.2; // Ruwais area
    if (longitude < 54.5) return 24.3 + (longitude - 53.5) * 0.3; // To Abu Dhabi
    if (longitude < 55.0) return 24.6 + (longitude - 54.5) * 0.8; // Abu Dhabi to Dubai approach
    if (longitude < 55.5) return 25.0 + (longitude - 55.0) * 0.6; // Dubai area
    if (longitude < 56.0) return 25.3 + (longitude - 55.5) * 0.3; // Sharjah/Northern Emirates
    return 25.5; // East coast
  }
  
  // Check if within UAE longitude range and south of coast
  if (lng >= 51.5 && lng <= 56.5) {
    const coastLat = getCoastLatitude(lng);
    const southernBorder = 22.5; // UAE southern desert border
    
    // Point is over land if it's between the coast and southern border
    if (lat < coastLat && lat > southernBorder) {
      // Additional check: make sure we're not in the Gulf waters that extend south
      // (e.g., areas around islands or bays)
      
      // Exception: Western offshore islands (Das, Arzanah, Zirku)
      // These are in the water even though they might be south of mainland coast
      if (lng < 54.0 && lat > 24.5) {
        // Western Gulf - this is open water with islands
        return false;
      }
      
      // Exception: Khalifa Port area (extends north into Gulf)
      if (lng >= 54.5 && lng <= 54.9 && lat >= 24.6 && lat <= 25.0) {
        return false; // Port/coastal waters
      }
      
      return true; // Over UAE mainland
    }
  }
  
  // === MUSANDAM PENINSULA (Oman) ===
  // Musandam extends north between UAE and Iran, blocking direct routes
  if (lng >= 56.0 && lng <= 56.6) {
    if (lat >= 25.5 && lat <= 26.4) {
      // Musandam peninsula area
      if (lat < 26.0 && lng < 56.3) {
        return true; // Over Musandam
      }
    }
  }
  
  // === SAUDI ARABIA / BAHRAIN coastline ===
  // Western Gulf - Saudi coast is around lat 25.5-27 at lng 49-50
  if (lng >= 49.0 && lng <= 50.5) {
    if (lat >= 25.0 && lat <= 27.5) {
      // Approximate Saudi/Bahrain coast
      const saudiCoastLat = 26.0 + (lng - 49.0) * 0.3;
      if (lat < saudiCoastLat && lat > 24.0) {
        return true;
      }
    }
  }
  
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
  // If both points are on the same side of the Strait of Hormuz, check for land crossing
  const originIsGulf = origin.lng < 56.0;
  const destIsGulf = destination.lng < 56.0;
  
  // If one is in Arabian Gulf and other in Gulf of Oman, need coastal routing
  if (originIsGulf !== destIsGulf) {
    return true;
  }
  
  // Check if direct route would cross land
  if (doesRouteCrossLand(origin, destination)) {
    return true;
  }
  
  return false;
}

/**
 * Get the best offshore waypoints for routing between two points
 * This ensures ships stay in navigable waters and don't cross land
 */
function getCoastalWaypoints(origin: Coordinates, destination: Coordinates): Waypoint[] {
  if (!needsCoastalRouting(origin, destination)) {
    return [];
  }
  
  const waypoints: Waypoint[] = [];
  const originIsGulf = origin.lng < 56.0;
  const destIsGulf = destination.lng < 56.0;
  
  // Case 1: Cross-gulf routing (Arabian Gulf to/from Gulf of Oman)
  if (originIsGulf !== destIsGulf) {
    if (originIsGulf) {
      // Going from Arabian Gulf to Gulf of Oman (east)
      for (const wp of GULF_MARITIME_WAYPOINTS) {
        if (wp.region === 'strait_of_hormuz' || wp.region === 'gulf_of_oman') {
          // Include if it helps the route
          if (wp.lat >= Math.min(origin.lat, destination.lat) - 1 &&
              wp.lat <= Math.max(origin.lat, destination.lat) + 1) {
            waypoints.push({
              id: `coastal-${wp.id}`,
              lat: wp.lat,
              lng: wp.lng,
              name: wp.name,
              type: 'coastal_waypoint' as any,
              notes: 'Coastal routing around UAE peninsula',
            });
          }
        }
      }
    } else {
      // Going from Gulf of Oman to Arabian Gulf (west)
      const reversedWaypoints = [...GULF_MARITIME_WAYPOINTS].reverse();
      for (const wp of reversedWaypoints) {
        if (wp.region === 'strait_of_hormuz' || wp.region === 'western_gulf' || wp.region === 'uae_coast') {
          if (wp.lat >= Math.min(origin.lat, destination.lat) - 1 &&
              wp.lat <= Math.max(origin.lat, destination.lat) + 1) {
            waypoints.push({
              id: `coastal-${wp.id}`,
              lat: wp.lat,
              lng: wp.lng,
              name: wp.name,
              type: 'coastal_waypoint' as any,
              notes: 'Coastal routing around UAE peninsula',
            });
          }
        }
      }
    }
    return waypoints;
  }
  
  // Case 2: Within Arabian Gulf - need to go around land (e.g., Arzanah to Dubai)
  // Find an offshore corridor that avoids land
  
  // Determine if we need to go north or stay offshore
  const goingEastToWest = origin.lng > destination.lng;
  const originInWesternGulf = origin.lng < 53.5;
  const destInEasternCoast = destination.lng > 54.5;
  
  // For routes from western offshore (Das, Arzanah) to eastern UAE (Dubai, Sharjah)
  // We need to go NORTH offshore to avoid the UAE mainland
  if (originInWesternGulf && destInEasternCoast) {
    // Need to go around the northern part of UAE
    // Find the appropriate offshore waypoints
    
    // First, go to a northern offshore point
    const northernLatitude = Math.max(origin.lat, destination.lat) + 0.5;
    const midLng = (origin.lng + destination.lng) / 2;
    
    // Add waypoints that create an offshore arc
    waypoints.push({
      id: 'coastal-north-arc-1',
      lat: origin.lat + 0.3,
      lng: origin.lng + 0.3,
      name: 'Offshore Waypoint 1',
      type: 'coastal_waypoint' as any,
      notes: 'Offshore routing to avoid UAE mainland',
    });
    
    waypoints.push({
      id: 'coastal-north-arc-2',
      lat: Math.min(northernLatitude, 25.5), // Stay in navigable waters
      lng: midLng,
      name: 'Northern Offshore',
      type: 'coastal_waypoint' as any,
      notes: 'Northern offshore corridor',
    });
    
    waypoints.push({
      id: 'coastal-north-arc-3',
      lat: destination.lat + 0.3,
      lng: destination.lng - 0.3,
      name: 'Offshore Waypoint 3',
      type: 'coastal_waypoint' as any,
      notes: 'Offshore approach to destination',
    });
    
    return waypoints;
  }
  
  // For routes from eastern UAE to western offshore
  if (!originInWesternGulf && destination.lng < 53.5) {
    // Reverse of above
    const northernLatitude = Math.max(origin.lat, destination.lat) + 0.5;
    const midLng = (origin.lng + destination.lng) / 2;
    
    waypoints.push({
      id: 'coastal-north-arc-1',
      lat: origin.lat + 0.3,
      lng: origin.lng - 0.3,
      name: 'Offshore Waypoint 1',
      type: 'coastal_waypoint' as any,
      notes: 'Offshore routing to avoid UAE mainland',
    });
    
    waypoints.push({
      id: 'coastal-north-arc-2',
      lat: Math.min(northernLatitude, 25.5),
      lng: midLng,
      name: 'Northern Offshore',
      type: 'coastal_waypoint' as any,
      notes: 'Northern offshore corridor',
    });
    
    waypoints.push({
      id: 'coastal-north-arc-3',
      lat: destination.lat + 0.3,
      lng: destination.lng + 0.3,
      name: 'Offshore Waypoint 3',
      type: 'coastal_waypoint' as any,
      notes: 'Offshore approach to destination',
    });
    
    return waypoints;
  }
  
  // General case: Just add intermediate offshore waypoints to avoid any land crossing
  // Find the best offshore path
  const relevantWaypoints = GULF_MARITIME_WAYPOINTS.filter(wp => {
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
        notes: 'Offshore routing waypoint',
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
  dredger: 85,
  'hopper dredger': 90,
  csd: 80,
  crane_barge: 45,
  supply_vessel: 35,
  supply: 35,
  tugboat: 25,
  tug: 25,
  survey_vessel: 20,
  survey: 20,
  'jack up': 0, // Towed or stationary
  'pipelay barge': 50,
  'derrick barge': 55,
  default: 40,
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
      reasoningText = `Route follows standard shipping lanes around the UAE peninsula. No weather hazards detected. Distance: ${originalRoute.totalDistanceNm.toFixed(0)}nm.`;
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

