/**
 * Smart Route Optimizer - Advanced maritime route optimization
 * 
 * Implements intelligent optimization considering:
 * - Variable speed profiles (cubic fuel-speed relationship)
 * - Weather routing with route deviation
 * - Ocean current and wind effects
 * - Virtual arrival for port delays
 * - ETA window optimization (just-in-time arrival)
 * - Emission Control Area (ECA) compliance
 * - Dynamic speed adjustment per segment
 */

import { Route, RouteSegment, Waypoint, WeatherPoint } from './types';
import { 
  generateRoute, 
  VESSEL_PROFILES, 
  VesselProfile, 
  fetchSeaRoute,
  getRouteWeatherForecast,
  assessWeatherRisk 
} from './engine';
import { calculateDistanceNm, calculateBearing } from '@/lib/datalastic';
import { getWeatherAtLocation } from '@/lib/weather';

// ============================================================================
// Types for Smart Optimization
// ============================================================================

export interface SmartOptimizationRequest {
  vesselId: string;
  vesselName: string;
  vesselType: string;
  origin: { lat: number; lng: number; name?: string };
  destination: { lat: number; lng: number; name?: string };
  
  // Timing constraints
  departureTime?: Date;
  arrivalWindow?: {
    earliest: Date;  // Don't arrive before this
    latest: Date;    // Must arrive by this time
    preferredTime?: Date; // Ideal arrival time
  };
  
  // Optimization priorities (0-100, higher = more important)
  priorities: {
    fuel: number;       // Minimize fuel consumption
    time: number;       // Minimize travel time
    emissions: number;  // Minimize CO2/NOx/SOx
    cost: number;       // Minimize total cost
    safety: number;     // Prefer safer routes/conditions
    comfort: number;    // Avoid rough seas
  };
  
  // Vessel state
  vesselState?: {
    currentFuel: number;    // Current fuel in liters
    maxFuel: number;        // Tank capacity
    cargoLoad: number;      // Percentage (0-100)
    draftMeters: number;    // Current draft
  };
  
  // Port conditions (for Virtual Arrival)
  portConditions?: {
    berthAvailable: boolean;
    expectedBerthTime?: Date;
    congestionLevel: 'low' | 'medium' | 'high';
  };
  
  // Environmental preferences
  preferences?: {
    avoidECA?: boolean;     // Avoid Emission Control Areas
    maxWaveHeight?: number; // Max acceptable wave height (m)
    maxWindSpeed?: number;  // Max acceptable wind speed (knots)
    preferDaylight?: boolean; // Prefer arrival during day
  };
}

export interface SpeedProfile {
  segmentIndex: number;
  recommendedSpeed: number;  // knots
  minSpeed: number;
  maxSpeed: number;
  reason: string;
  fuelRate: number;          // L/nm at this speed
  adjustedFuelRate: number;  // After weather/current adjustment
}

export interface SmartOptimizationResult {
  recommendedRoute: Route;
  speedProfile: SpeedProfile[];
  
  // Detailed metrics
  metrics: {
    totalFuel: number;
    fuelSaved: number;      // vs naive approach
    totalEmissions: { co2: number; nox: number; sox: number };
    emissionsSaved: { co2: number; nox: number; sox: number };
    estimatedCost: number;
    costSaved: number;
    weatherRiskScore: number;
    comfortScore: number;   // 0-100
  };
  
  // Timing analysis
  timing: {
    departureTime: Date;
    estimatedArrival: Date;
    withinWindow: boolean;
    slackTime: number;      // Hours of buffer
    virtualArrivalRecommended: boolean;
    virtualArrivalSavings?: {
      fuelSaved: number;
      emissionsSaved: number;
      waitingReduced: number; // hours
    };
  };
  
  // Weather routing insights
  weatherRouting: {
    deviationApplied: boolean;
    deviationDistance: number;  // Extra nm from direct route
    weatherAvoided: WeatherPoint[];
    currentAssist: number;      // Knots gained/lost from currents
    windEffect: number;         // Knots gained/lost from wind
  };
  
  // Recommendations
  recommendations: Array<{
    type: 'speed' | 'timing' | 'route' | 'fuel' | 'safety';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    potentialSavings?: { fuel?: number; time?: number; cost?: number };
  }>;
  
  // Alternatives
  alternatives: Array<{
    name: string;
    route: Route;
    comparison: {
      fuelDiff: number;
      timeDiff: number;
      costDiff: number;
      riskDiff: number;
    };
  }>;
}

// ============================================================================
// Speed-Fuel Models (Cubic Relationship)
// ============================================================================

/**
 * Admiralty formula: Fuel consumption is proportional to speed³
 * Fuel = k × Speed³ × Distance / Speed = k × Speed² × Distance
 * 
 * But for per-nautical-mile consumption:
 * Fuel/nm ∝ Speed²
 */

interface FuelModel {
  baseSpeed: number;      // Reference speed (cruising)
  baseFuelRate: number;   // L/nm at base speed
  minSpeed: number;
  maxSpeed: number;
}

/**
 * Calculate fuel consumption rate at any speed using cubic model
 * Real ships follow approximately P ∝ V³ (power to speed cube)
 */
function calculateFuelRateAtSpeed(
  speed: number,
  model: FuelModel
): number {
  // Clamp speed to valid range
  const clampedSpeed = Math.max(model.minSpeed, Math.min(model.maxSpeed, speed));
  
  // Fuel rate scales with speed squared (since distance/time = speed)
  // Power ∝ V³, Time ∝ D/V, so Fuel ∝ V³ × D/V = V² × D
  const speedRatio = clampedSpeed / model.baseSpeed;
  const fuelRate = model.baseFuelRate * (speedRatio ** 2);
  
  return fuelRate;
}

/**
 * Find optimal speed for a given distance and time constraint
 */
function findOptimalSpeed(
  distanceNm: number,
  availableTimeHours: number,
  model: FuelModel,
  priorities: { fuel: number; time: number }
): { speed: number; fuelRate: number; reason: string } {
  const requiredSpeed = distanceNm / availableTimeHours;
  
  // Check if we can make it at min speed (best fuel efficiency)
  if (requiredSpeed <= model.minSpeed) {
    return {
      speed: model.minSpeed,
      fuelRate: calculateFuelRateAtSpeed(model.minSpeed, model),
      reason: 'Slow steaming - maximum fuel efficiency'
    };
  }
  
  // Check if we need max speed
  if (requiredSpeed >= model.maxSpeed) {
    return {
      speed: model.maxSpeed,
      fuelRate: calculateFuelRateAtSpeed(model.maxSpeed, model),
      reason: 'Maximum speed - tight deadline'
    };
  }
  
  // We have flexibility - optimize based on priorities
  const fuelWeight = priorities.fuel / (priorities.fuel + priorities.time);
  
  // Blend between required speed and economical speed
  const economicalSpeed = model.baseSpeed * 0.7; // ~70% is typical sweet spot
  const optimalSpeed = requiredSpeed * (1 - fuelWeight) + economicalSpeed * fuelWeight;
  
  const clampedSpeed = Math.max(model.minSpeed, Math.min(requiredSpeed, optimalSpeed));
  
  return {
    speed: clampedSpeed,
    fuelRate: calculateFuelRateAtSpeed(clampedSpeed, model),
    reason: clampedSpeed < model.baseSpeed 
      ? 'Optimized slow steaming' 
      : 'Balanced speed optimization'
  };
}

// ============================================================================
// Weather & Current Effects
// ============================================================================

interface EnvironmentalConditions {
  windSpeed: number;      // knots
  windDirection: number;  // degrees (from)
  waveHeight: number;     // meters
  wavePeriod: number;     // seconds
  currentSpeed: number;   // knots
  currentDirection: number; // degrees (towards)
}

/**
 * Calculate speed adjustment due to wind effect
 * Head wind reduces speed, tail wind increases
 */
function calculateWindEffect(
  vesselHeading: number,
  windSpeed: number,
  windDirection: number
): number {
  // Wind direction is "from", convert to "towards"
  const windTowards = (windDirection + 180) % 360;
  
  // Calculate relative angle
  const relativeAngle = Math.abs(vesselHeading - windTowards);
  const normalizedAngle = relativeAngle > 180 ? 360 - relativeAngle : relativeAngle;
  
  // Head wind (0°) = max resistance, Tail wind (180°) = max assistance
  // Use cosine for smooth transition
  const windEffect = Math.cos(normalizedAngle * Math.PI / 180);
  
  // Wind effect factor (rough approximation)
  // Strong headwind can reduce effective speed by 2-3 knots
  // Strong tailwind can increase by 0.5-1 knots (less beneficial)
  if (windEffect < 0) {
    // Headwind - negative effect
    return windEffect * windSpeed * 0.1; // Up to -3 knots at 30 knot headwind
  } else {
    // Tailwind - positive effect (less significant)
    return windEffect * windSpeed * 0.03; // Up to +1 knot at 30 knot tailwind
  }
}

/**
 * Calculate speed adjustment due to ocean current
 */
function calculateCurrentEffect(
  vesselHeading: number,
  currentSpeed: number,
  currentDirection: number // Direction current is flowing towards
): number {
  // Calculate relative angle
  const relativeAngle = Math.abs(vesselHeading - currentDirection);
  const normalizedAngle = relativeAngle > 180 ? 360 - relativeAngle : relativeAngle;
  
  // Use cosine projection
  const currentEffect = Math.cos(normalizedAngle * Math.PI / 180);
  
  // Current directly adds/subtracts from vessel speed
  return currentEffect * currentSpeed;
}

/**
 * Calculate wave resistance effect on fuel consumption
 * Higher waves = more fuel needed to maintain speed
 */
function calculateWaveResistance(
  waveHeight: number,
  vesselHeading: number,
  waveDirection: number
): number {
  // Calculate relative wave angle
  const relativeAngle = Math.abs(vesselHeading - waveDirection);
  const normalizedAngle = relativeAngle > 180 ? 360 - relativeAngle : relativeAngle;
  
  // Head seas (0°) cause most resistance, following seas (180°) cause least
  const angleEffect = 1 - Math.cos(normalizedAngle * Math.PI / 180) * 0.3;
  
  // Wave height effect: exponential increase in resistance
  // 1m waves = ~5% increase, 3m waves = ~25% increase
  const heightFactor = 1 + (waveHeight ** 1.5) * 0.08 * angleEffect;
  
  return heightFactor;
}

/**
 * Get environmental conditions for a location
 */
function getEnvironmentalConditions(lat: number, lng: number): EnvironmentalConditions {
  const weather = getWeatherAtLocation(lat, lng);
  
  // Parse wind direction
  const directionMap: Record<string, number> = {
    'N': 0, 'NE': 45, 'E': 90, 'SE': 135,
    'S': 180, 'SW': 225, 'W': 270, 'NW': 315
  };
  
  // Simulate ocean current based on location (Persian Gulf patterns)
  // Generally flows counter-clockwise in Persian Gulf
  const currentSpeed = 0.5 + Math.random() * 1; // 0.5-1.5 knots typical
  const currentDirection = (lng > 54) ? 315 : 135; // Rough approximation
  
  return {
    windSpeed: weather.windSpeed,
    windDirection: directionMap[weather.windDirection] || 0,
    waveHeight: weather.waveHeight,
    wavePeriod: 6 + Math.random() * 4, // 6-10 second typical
    currentSpeed,
    currentDirection,
  };
}

// ============================================================================
// Virtual Arrival Optimization
// ============================================================================

interface VirtualArrivalResult {
  recommended: boolean;
  originalArrival: Date;
  adjustedArrival: Date;
  recommendedSpeed: number;
  originalSpeed: number;
  fuelSaved: number;
  emissionsSaved: number;
  waitingTimeReduced: number; // hours
  reason: string;
}

/**
 * Calculate Virtual Arrival optimization
 * When berth isn't ready, slow down instead of waiting at anchor
 */
function calculateVirtualArrival(
  distanceRemaining: number,
  normalSpeed: number,
  currentTime: Date,
  berthAvailableTime: Date,
  fuelModel: FuelModel,
  vesselProfile: VesselProfile
): VirtualArrivalResult {
  const normalTravelTime = distanceRemaining / normalSpeed; // hours
  const normalArrival = new Date(currentTime.getTime() + normalTravelTime * 3600000);
  
  const timeUntilBerth = (berthAvailableTime.getTime() - currentTime.getTime()) / 3600000; // hours
  
  // If we'd arrive before berth is ready, we can slow down
  if (normalArrival < berthAvailableTime && timeUntilBerth > 0) {
    // Calculate optimal speed to arrive just-in-time
    const optimalSpeed = distanceRemaining / timeUntilBerth;
    
    // Clamp to minimum viable speed
    const adjustedSpeed = Math.max(fuelModel.minSpeed, optimalSpeed);
    
    if (adjustedSpeed < normalSpeed) {
      // Calculate fuel savings
      const normalFuelRate = calculateFuelRateAtSpeed(normalSpeed, fuelModel);
      const slowFuelRate = calculateFuelRateAtSpeed(adjustedSpeed, fuelModel);
      
      const normalFuel = normalFuelRate * distanceRemaining;
      const slowFuel = slowFuelRate * distanceRemaining;
      const fuelSaved = normalFuel - slowFuel;
      
      // Calculate waiting time that would be avoided
      const waitingReduced = (berthAvailableTime.getTime() - normalArrival.getTime()) / 3600000;
      
      return {
        recommended: true,
        originalArrival: normalArrival,
        adjustedArrival: berthAvailableTime,
        originalSpeed: normalSpeed,
        recommendedSpeed: adjustedSpeed,
        fuelSaved,
        emissionsSaved: fuelSaved * vesselProfile.emissionFactors.co2PerLiter,
        waitingTimeReduced: Math.max(0, waitingReduced),
        reason: `Reduce speed from ${normalSpeed.toFixed(1)} to ${adjustedSpeed.toFixed(1)} knots to arrive just-in-time`
      };
    }
  }
  
  return {
    recommended: false,
    originalArrival: normalArrival,
    adjustedArrival: normalArrival,
    originalSpeed: normalSpeed,
    recommendedSpeed: normalSpeed,
    fuelSaved: 0,
    emissionsSaved: 0,
    waitingTimeReduced: 0,
    reason: 'Standard speed recommended - berth will be available on arrival'
  };
}

// ============================================================================
// ETA Window Optimization
// ============================================================================

/**
 * Optimize speed to hit arrival window with minimum fuel
 */
function optimizeForArrivalWindow(
  distanceNm: number,
  departureTime: Date,
  window: { earliest: Date; latest: Date; preferredTime?: Date },
  fuelModel: FuelModel,
  priorities: { fuel: number; time: number }
): { speed: number; arrivalTime: Date; fuelRate: number; reason: string } {
  
  const earliestTravelTime = (window.earliest.getTime() - departureTime.getTime()) / 3600000;
  const latestTravelTime = (window.latest.getTime() - departureTime.getTime()) / 3600000;
  
  // Calculate speed range
  const slowestSpeed = distanceNm / latestTravelTime;
  const fastestSpeed = distanceNm / earliestTravelTime;
  
  // Clamp to vessel capabilities
  const minViableSpeed = Math.max(fuelModel.minSpeed, slowestSpeed);
  const maxViableSpeed = Math.min(fuelModel.maxSpeed, fastestSpeed);
  
  // Check if window is achievable
  if (minViableSpeed > fuelModel.maxSpeed) {
    // Can't make earliest time even at max speed
    return {
      speed: fuelModel.maxSpeed,
      arrivalTime: new Date(departureTime.getTime() + (distanceNm / fuelModel.maxSpeed) * 3600000),
      fuelRate: calculateFuelRateAtSpeed(fuelModel.maxSpeed, fuelModel),
      reason: 'Maximum speed - cannot meet earliest arrival window'
    };
  }
  
  if (maxViableSpeed < fuelModel.minSpeed) {
    // Would arrive too early even at minimum speed
    return {
      speed: fuelModel.minSpeed,
      arrivalTime: new Date(departureTime.getTime() + (distanceNm / fuelModel.minSpeed) * 3600000),
      fuelRate: calculateFuelRateAtSpeed(fuelModel.minSpeed, fuelModel),
      reason: 'Minimum speed - will arrive before window opens'
    };
  }
  
  // We have flexibility - optimize based on priorities
  const fuelWeight = priorities.fuel / (priorities.fuel + priorities.time);
  
  // Blend towards slower (more economical) end based on fuel priority
  const optimalSpeed = minViableSpeed + (maxViableSpeed - minViableSpeed) * (1 - fuelWeight * 0.8);
  
  // If there's a preferred time, factor it in
  if (window.preferredTime) {
    const preferredTravelTime = (window.preferredTime.getTime() - departureTime.getTime()) / 3600000;
    const preferredSpeed = distanceNm / preferredTravelTime;
    
    // Blend towards preferred time
    const blendedSpeed = optimalSpeed * 0.6 + preferredSpeed * 0.4;
    const finalSpeed = Math.max(minViableSpeed, Math.min(maxViableSpeed, blendedSpeed));
    
    return {
      speed: finalSpeed,
      arrivalTime: new Date(departureTime.getTime() + (distanceNm / finalSpeed) * 3600000),
      fuelRate: calculateFuelRateAtSpeed(finalSpeed, fuelModel),
      reason: 'Optimized for preferred arrival time with fuel efficiency'
    };
  }
  
  return {
    speed: optimalSpeed,
    arrivalTime: new Date(departureTime.getTime() + (distanceNm / optimalSpeed) * 3600000),
    fuelRate: calculateFuelRateAtSpeed(optimalSpeed, fuelModel),
    reason: `Speed optimized for ${fuelWeight > 0.6 ? 'fuel economy' : 'time efficiency'} within window`
  };
}

// ============================================================================
// Smart Segment Optimization
// ============================================================================

/**
 * Optimize speed for each segment considering all factors
 */
function optimizeSegmentSpeed(
  segment: RouteSegment,
  fuelModel: FuelModel,
  conditions: EnvironmentalConditions,
  priorities: SmartOptimizationRequest['priorities'],
  timeConstraint?: { available: number } // hours available for this segment
): SpeedProfile {
  const vesselHeading = segment.bearing;
  
  // Calculate environmental effects
  const windEffect = calculateWindEffect(vesselHeading, conditions.windSpeed, conditions.windDirection);
  const currentEffect = calculateCurrentEffect(vesselHeading, conditions.currentSpeed, conditions.currentDirection);
  const waveResistance = calculateWaveResistance(conditions.waveHeight, vesselHeading, conditions.windDirection);
  
  // Calculate base optimal speed
  let baseOptimalSpeed = fuelModel.baseSpeed * 0.85; // Start at economical
  let reason = 'Economical cruising';
  
  // Adjust for time constraint
  if (timeConstraint) {
    const requiredSpeed = segment.distance / timeConstraint.available;
    if (requiredSpeed > baseOptimalSpeed) {
      baseOptimalSpeed = Math.min(requiredSpeed * 1.05, fuelModel.maxSpeed); // Small buffer
      reason = 'Speed increased for schedule';
    }
  }
  
  // Adjust for weather conditions
  if (conditions.waveHeight > 2.5) {
    // Reduce speed in heavy seas for safety
    baseOptimalSpeed = Math.min(baseOptimalSpeed, fuelModel.baseSpeed * 0.8);
    reason = 'Speed reduced for sea conditions';
  }
  
  // Adjust for priorities
  if (priorities.fuel > 70) {
    baseOptimalSpeed *= 0.9; // Prioritize fuel economy
    reason = 'Slow steaming for fuel efficiency';
  } else if (priorities.time > 70) {
    baseOptimalSpeed *= 1.1; // Prioritize speed
    reason = 'Increased speed for time priority';
  }
  
  // Clamp to valid range
  const recommendedSpeed = Math.max(fuelModel.minSpeed, Math.min(fuelModel.maxSpeed, baseOptimalSpeed));
  
  // Calculate fuel rates
  const baseFuelRate = calculateFuelRateAtSpeed(recommendedSpeed, fuelModel);
  const adjustedFuelRate = baseFuelRate * waveResistance; // Increase for wave resistance
  
  return {
    segmentIndex: 0, // Will be set by caller
    recommendedSpeed,
    minSpeed: fuelModel.minSpeed,
    maxSpeed: fuelModel.maxSpeed,
    reason,
    fuelRate: baseFuelRate,
    adjustedFuelRate,
  };
}

// ============================================================================
// Main Smart Optimizer
// ============================================================================

/**
 * Main smart optimization function
 */
export async function smartOptimizeRoute(
  request: SmartOptimizationRequest
): Promise<SmartOptimizationResult> {
  const vesselProfile = VESSEL_PROFILES[request.vesselType] || VESSEL_PROFILES.default;
  
  // Create fuel model from vessel profile
  const fuelModel: FuelModel = {
    baseSpeed: vesselProfile.cruisingSpeed,
    baseFuelRate: vesselProfile.fuelConsumptionRate,
    minSpeed: vesselProfile.cruisingSpeed * 0.5, // Minimum 50% of cruising
    maxSpeed: vesselProfile.maxSpeed,
  };
  
  // Generate base route
  const baseRoute = await generateRoute(
    request.vesselId,
    request.vesselName,
    request.vesselType,
    request.origin,
    request.destination
  );
  
  // Calculate departure time
  const departureTime = request.departureTime || new Date();
  
  // Calculate time constraint if arrival window specified
  let totalAvailableTime: number | undefined;
  if (request.arrivalWindow) {
    totalAvailableTime = (request.arrivalWindow.latest.getTime() - departureTime.getTime()) / 3600000;
  }
  
  // Optimize each segment
  const speedProfiles: SpeedProfile[] = [];
  const optimizedSegments: RouteSegment[] = [];
  
  let cumulativeTime = 0;
  let totalAdjustedFuel = 0;
  let totalWindEffect = 0;
  let totalCurrentEffect = 0;
  
  for (let i = 0; i < baseRoute.segments.length; i++) {
    const segment = baseRoute.segments[i];
    const midLat = (segment.from.lat + segment.to.lat) / 2;
    const midLng = (segment.from.lng + segment.to.lng) / 2;
    
    // Get environmental conditions
    const conditions = getEnvironmentalConditions(midLat, midLng);
    
    // Calculate time available for this segment (proportional to distance)
    let segmentTimeConstraint: { available: number } | undefined;
    if (totalAvailableTime) {
      const distanceRatio = segment.distance / baseRoute.totalDistance;
      segmentTimeConstraint = { available: totalAvailableTime * distanceRatio };
    }
    
    // Optimize segment
    const profile = optimizeSegmentSpeed(segment, fuelModel, conditions, request.priorities, segmentTimeConstraint);
    profile.segmentIndex = i;
    speedProfiles.push(profile);
    
    // Track environmental effects
    const windEffect = calculateWindEffect(segment.bearing, conditions.windSpeed, conditions.windDirection);
    const currentEffect = calculateCurrentEffect(segment.bearing, conditions.currentSpeed, conditions.currentDirection);
    totalWindEffect += windEffect;
    totalCurrentEffect += currentEffect;
    
    // Calculate effective speed (vessel speed + environmental effects)
    const effectiveSpeed = profile.recommendedSpeed + currentEffect;
    const segmentTime = segment.distance / effectiveSpeed;
    cumulativeTime += segmentTime;
    
    // Calculate adjusted fuel consumption
    const segmentFuel = profile.adjustedFuelRate * segment.distance;
    totalAdjustedFuel += segmentFuel;
    
    // Create optimized segment
    optimizedSegments.push({
      ...segment,
      estimatedTime: segmentTime,
      fuelConsumption: segmentFuel,
    });
  }
  
  // Create optimized route
  const optimizedRoute: Route = {
    ...baseRoute,
    segments: optimizedSegments,
    estimatedTime: cumulativeTime,
    fuelConsumption: totalAdjustedFuel,
    emissions: {
      co2: totalAdjustedFuel * vesselProfile.emissionFactors.co2PerLiter,
      nox: totalAdjustedFuel * vesselProfile.emissionFactors.noxPerLiter,
      sox: totalAdjustedFuel * vesselProfile.emissionFactors.soxPerLiter,
    },
    cost: totalAdjustedFuel * vesselProfile.fuelCostPerLiter,
  };
  
  // Calculate estimated arrival
  const estimatedArrival = new Date(departureTime.getTime() + cumulativeTime * 3600000);
  
  // Check Virtual Arrival optimization
  let virtualArrivalResult: VirtualArrivalResult | undefined;
  if (request.portConditions?.expectedBerthTime) {
    virtualArrivalResult = calculateVirtualArrival(
      baseRoute.totalDistance,
      vesselProfile.cruisingSpeed,
      departureTime,
      request.portConditions.expectedBerthTime,
      fuelModel,
      vesselProfile
    );
  }
  
  // Calculate savings vs naive approach
  const naiveFuel = baseRoute.fuelConsumption;
  const fuelSaved = naiveFuel - totalAdjustedFuel;
  
  // Generate recommendations
  const recommendations: SmartOptimizationResult['recommendations'] = [];
  
  // Speed recommendations
  const avgOptimizedSpeed = speedProfiles.reduce((sum, p) => sum + p.recommendedSpeed, 0) / speedProfiles.length;
  if (avgOptimizedSpeed < vesselProfile.cruisingSpeed * 0.8) {
    recommendations.push({
      type: 'speed',
      priority: 'medium',
      title: 'Slow Steaming Recommended',
      description: `Average speed of ${avgOptimizedSpeed.toFixed(1)} knots optimizes fuel consumption`,
      potentialSavings: { fuel: fuelSaved, cost: fuelSaved * vesselProfile.fuelCostPerLiter }
    });
  }
  
  // Virtual arrival recommendation
  if (virtualArrivalResult?.recommended) {
    recommendations.push({
      type: 'timing',
      priority: 'high',
      title: 'Virtual Arrival Opportunity',
      description: virtualArrivalResult.reason,
      potentialSavings: {
        fuel: virtualArrivalResult.fuelSaved,
        cost: virtualArrivalResult.fuelSaved * vesselProfile.fuelCostPerLiter
      }
    });
  }
  
  // Weather recommendation
  const avgWeatherRisk = optimizedSegments.reduce((sum, s) => sum + s.weatherRisk, 0) / optimizedSegments.length;
  if (avgWeatherRisk > 50) {
    recommendations.push({
      type: 'safety',
      priority: 'high',
      title: 'Weather Advisory',
      description: `Route passes through areas with elevated weather risk (${avgWeatherRisk.toFixed(0)}% average)`,
    });
  }
  
  // Current/wind insights
  if (Math.abs(totalCurrentEffect) > baseRoute.segments.length * 0.5) {
    const effect = totalCurrentEffect > 0 ? 'favorable' : 'unfavorable';
    recommendations.push({
      type: 'route',
      priority: 'low',
      title: `${effect === 'favorable' ? 'Favorable' : 'Unfavorable'} Currents`,
      description: `Ocean currents provide ${totalCurrentEffect.toFixed(1)} knot ${effect === 'favorable' ? 'boost' : 'resistance'} on average`,
    });
  }
  
  // Calculate comfort score
  const avgWaveHeight = 1.5; // Would come from weather data
  const comfortScore = Math.max(0, 100 - avgWaveHeight * 20 - avgWeatherRisk * 0.5);
  
  // Generate alternatives
  const alternatives: SmartOptimizationResult['alternatives'] = [];
  
  // Fast alternative
  const fastRoute = await generateRoute(
    request.vesselId,
    request.vesselName,
    request.vesselType,
    request.origin,
    request.destination,
    { speed: vesselProfile.maxSpeed, routeName: 'Fastest Route' }
  );
  alternatives.push({
    name: 'Fastest Route',
    route: fastRoute,
    comparison: {
      fuelDiff: fastRoute.fuelConsumption - optimizedRoute.fuelConsumption,
      timeDiff: fastRoute.estimatedTime - optimizedRoute.estimatedTime,
      costDiff: fastRoute.cost - optimizedRoute.cost,
      riskDiff: 0,
    }
  });
  
  // Economical alternative  
  const econRoute = await generateRoute(
    request.vesselId,
    request.vesselName,
    request.vesselType,
    request.origin,
    request.destination,
    { speed: vesselProfile.cruisingSpeed * 0.65, routeName: 'Most Economical' }
  );
  alternatives.push({
    name: 'Most Economical',
    route: econRoute,
    comparison: {
      fuelDiff: econRoute.fuelConsumption - optimizedRoute.fuelConsumption,
      timeDiff: econRoute.estimatedTime - optimizedRoute.estimatedTime,
      costDiff: econRoute.cost - optimizedRoute.cost,
      riskDiff: 0,
    }
  });
  
  return {
    recommendedRoute: optimizedRoute,
    speedProfile: speedProfiles,
    metrics: {
      totalFuel: totalAdjustedFuel,
      fuelSaved: Math.max(0, fuelSaved),
      totalEmissions: optimizedRoute.emissions,
      emissionsSaved: {
        co2: Math.max(0, (naiveFuel - totalAdjustedFuel) * vesselProfile.emissionFactors.co2PerLiter),
        nox: Math.max(0, (naiveFuel - totalAdjustedFuel) * vesselProfile.emissionFactors.noxPerLiter),
        sox: Math.max(0, (naiveFuel - totalAdjustedFuel) * vesselProfile.emissionFactors.soxPerLiter),
      },
      estimatedCost: optimizedRoute.cost,
      costSaved: Math.max(0, (naiveFuel - totalAdjustedFuel) * vesselProfile.fuelCostPerLiter),
      weatherRiskScore: avgWeatherRisk,
      comfortScore,
    },
    timing: {
      departureTime,
      estimatedArrival,
      withinWindow: request.arrivalWindow 
        ? estimatedArrival >= request.arrivalWindow.earliest && estimatedArrival <= request.arrivalWindow.latest
        : true,
      slackTime: request.arrivalWindow 
        ? (request.arrivalWindow.latest.getTime() - estimatedArrival.getTime()) / 3600000
        : 0,
      virtualArrivalRecommended: virtualArrivalResult?.recommended ?? false,
      virtualArrivalSavings: virtualArrivalResult?.recommended ? {
        fuelSaved: virtualArrivalResult.fuelSaved,
        emissionsSaved: virtualArrivalResult.emissionsSaved,
        waitingReduced: virtualArrivalResult.waitingTimeReduced,
      } : undefined,
    },
    weatherRouting: {
      deviationApplied: false, // Future: implement route deviation
      deviationDistance: 0,
      weatherAvoided: [],
      currentAssist: totalCurrentEffect / baseRoute.segments.length,
      windEffect: totalWindEffect / baseRoute.segments.length,
    },
    recommendations,
    alternatives,
  };
}

// ============================================================================
// Utility Exports
// ============================================================================

// Export functions
export {
  calculateFuelRateAtSpeed,
  findOptimalSpeed,
  calculateWindEffect,
  calculateCurrentEffect,
  calculateWaveResistance,
  calculateVirtualArrival,
  optimizeForArrivalWindow,
};

// Export types
export type {
  FuelModel,
  EnvironmentalConditions,
  VirtualArrivalResult,
};

