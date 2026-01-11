/**
 * Route Optimization Types
 * 
 * For actual maritime voyage route planning:
 * - Waypoint-based routing
 * - Weather avoidance
 * - Before/after route comparison
 */

// ============================================================================
// Geographic Types
// ============================================================================

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Waypoint extends Coordinates {
  id: string;
  name?: string;
  type: 'origin' | 'destination' | 'weather_avoidance' | 'traffic_separation' | 'fuel_stop' | 'waypoint';
  eta?: Date;
  distanceFromPrevious?: number; // nm
  cumulativeDistance?: number; // nm
  notes?: string;
}

// ============================================================================
// Weather & Hazard Types
// ============================================================================

export interface WeatherZone {
  id: string;
  type: 'storm' | 'high_wind' | 'fog' | 'high_seas' | 'sandstorm';
  severity: 'severe' | 'moderate' | 'advisory';
  center: Coordinates;
  radiusNm: number;
  windSpeedKnots?: number;
  waveHeightM?: number;
  validFrom: Date;
  validTo: Date;
  name?: string;
  avoidanceRecommendation: 'mandatory' | 'recommended' | 'optional';
}

export interface HazardZone {
  id?: string;
  type: 'shallow_water' | 'restricted_area' | 'traffic_separation' | 'eca_zone' | 'piracy_risk' | 'land_proximity' | 'land_mass';
  polygon?: Coordinates[]; // Boundary points (optional for simple hazards)
  name: string;
  restriction?: string;
  description?: string; // Human-readable explanation
}

// ============================================================================
// Route Types
// ============================================================================

export interface Route {
  id: string;
  vesselId: string;
  vesselName: string;
  origin: Waypoint;
  destination: Waypoint;
  waypoints: Waypoint[];
  
  // Metrics
  totalDistanceNm: number;
  estimatedDurationHours: number;
  estimatedFuelLiters: number;
  estimatedCostUSD: number;
  
  // Metadata
  createdAt: Date;
  routeType: 'direct' | 'optimized' | 'weather_routed' | 'custom';
}

export interface RouteSegment {
  from: Waypoint;
  to: Waypoint;
  distanceNm: number;
  bearing: number; // degrees
  estimatedHours: number;
  fuelLiters: number;
  conditions?: {
    weather: 'favorable' | 'moderate' | 'challenging';
    seaState: number; // 0-9 Douglas scale
    notes?: string;
  };
}

// ============================================================================
// Route Optimization Result
// ============================================================================

export interface RouteOptimizationResult {
  id: string;
  timestamp: Date;
  
  // Vessel info
  vessel: {
    id: string;
    name: string;
    type: string;
    currentPosition: Coordinates;
    speed: number; // knots
    fuelConsumptionRate: number; // liters per nm
  };
  
  // Origin and destination
  origin: Waypoint;
  destination: Waypoint;
  
  // The two routes to compare
  originalRoute: Route;
  optimizedRoute: Route;
  
  // What we're avoiding/optimizing for
  weatherZonesAvoided: WeatherZone[];
  hazardsAvoided: HazardZone[];
  
  // Optimization details
  optimizations: RouteOptimization[];
  
  // Summary
  summary: {
    distanceDeltaNm: number; // positive = original longer, negative = optimized longer
    timeDeltaHours: number;
    fuelDeltaLiters: number;
    costDeltaUSD: number;
    safetyImprovement: 'significant' | 'moderate' | 'minor' | 'none';
    safetyReasoning?: string; // Explanation of why safety improved
  };
  
  // Recommendation
  recommendation: 'use_optimized' | 'use_original' | 'review_required';
  reasoningText: string;
  
  confidence: number; // 0-100
}

export interface RouteOptimization {
  id: string;
  type: 'weather_avoidance' | 'current_riding' | 'fuel_optimization' | 'time_optimization' | 'safety';
  description: string;
  impact: {
    distanceChangeNm: number;
    timeChangeHours: number;
    fuelChangeLiters: number;
    safetyBenefit?: string;
  };
  reasoning: string;
  affectedWaypoints: string[]; // waypoint IDs
}

// ============================================================================
// Vessel Types for Route Planning
// ============================================================================

export interface VesselForRouting {
  id: string;
  name: string;
  type: string;
  currentPosition: Coordinates;
  destination?: Coordinates;
  destinationName?: string;
  speed: number; // knots
  maxSpeed: number;
  economicSpeed: number; // most fuel-efficient speed
  fuelConsumptionRate: number; // liters per nm at economic speed
  fuelCapacity: number;
  currentFuelLevel: number; // percentage
  draft: number; // meters
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface OptimizeRouteRequest {
  vesselId: string;
  origin: Coordinates;
  destination: Coordinates;
  departureTime?: Date;
  preferences?: {
    prioritize: 'time' | 'fuel' | 'safety' | 'balanced';
    maxDeviationNm?: number;
    avoidECAZones?: boolean;
  };
}

export interface OptimizeRouteResponse {
  success: boolean;
  result?: RouteOptimizationResult;
  error?: string;
}

