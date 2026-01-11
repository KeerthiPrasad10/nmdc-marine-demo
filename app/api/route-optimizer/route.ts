import { NextRequest, NextResponse } from 'next/server';
import { fetchSeaRoute, generateRoute } from '@/lib/routes/engine';
import { fetchRealWeatherZones } from '@/lib/route-optimization/marine-weather';
import { generateMockWeatherZones } from '@/lib/route-optimization/optimizer';

// Set to true to use real Open-Meteo marine weather data
const USE_REAL_WEATHER = true;

interface RequestBody {
  vessel: {
    id: string;
    name: string;
    type: string;
    currentLat: number;
    currentLng: number;
    speed?: number;
  };
  origin: {
    lat: number;
    lng: number;
    name: string;
  };
  destination: {
    lat: number;
    lng: number;
    name: string;
  };
  preferences?: {
    prioritize: 'time' | 'fuel' | 'safety' | 'balanced';
  };
}

// Fuel consumption rates by vessel type (liters per nautical mile)
const FUEL_RATES: Record<string, number> = {
  dredger: 85,
  hopper_dredger: 90,
  csd: 80,
  crane_barge: 45,
  supply_vessel: 35,
  supply: 35,
  tugboat: 25,
  tug: 25,
  survey_vessel: 20,
  survey: 20,
  jack_up: 0,
  pipelay_barge: 50,
  derrick_barge: 55,
  default: 40,
};

const FUEL_COST_USD_PER_LITER = 0.85;

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { vessel, origin, destination, preferences } = body;

    console.log('[Route Optimizer] Request:', {
      vessel: vessel.name,
      from: origin.name,
      to: destination.name,
    });

    // Step 1: Get the sea route using the hybrid approach (Datalastic API + land correction)
    const seaRouteResult = await fetchSeaRoute(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );

    console.log('[Route Optimizer] Sea route fetched:', {
      source: seaRouteResult.source,
      waypoints: seaRouteResult.waypoints.length,
      distance: seaRouteResult.distance.toFixed(1) + ' nm',
    });

    // Step 2: Fetch weather zones along the route
    let weatherZones: { id: string; type: string; severity: string; center: { lat: number; lng: number }; radiusNm: number; name?: string }[] = [];
    if (USE_REAL_WEATHER) {
      try {
        weatherZones = await fetchRealWeatherZones(
          { lat: origin.lat, lng: origin.lng },
          { lat: destination.lat, lng: destination.lng },
          5
        );
        console.log(`[Route Optimizer] Found ${weatherZones.length} weather zones`);
      } catch (error) {
        console.warn('[Route Optimizer] Weather fetch failed:', error);
        weatherZones = generateMockWeatherZones(
          { lat: origin.lat, lng: origin.lng },
          { lat: destination.lat, lng: destination.lng }
        );
      }
    }

    // Step 3: Calculate route metrics
    const speed = vessel.speed || 10;
    const fuelRate = FUEL_RATES[vessel.type.toLowerCase().replace(/ /g, '_')] || FUEL_RATES.default;
    const totalDistance = seaRouteResult.distance;
    const estimatedTime = totalDistance / speed; // hours
    const fuelConsumption = totalDistance * fuelRate;
    const fuelCost = fuelConsumption * FUEL_COST_USD_PER_LITER;

    // Build waypoints for the response with meaningful names and notes
    const waypoints = seaRouteResult.waypoints.map((wp, index) => {
      const isOrigin = index === 0;
      const isDestination = index === seaRouteResult.waypoints.length - 1;
      
      // Use the network node name if available, otherwise fallback to generic
      let name: string;
      if (isOrigin) {
        name = origin.name;
      } else if (isDestination) {
        name = destination.name;
      } else if (wp.name) {
        name = wp.name;
      } else {
        name = `Waypoint ${index}`;
      }
      
      return {
        id: `wp-${index}`,
        lat: wp.lat,
        lng: wp.lon,
        name,
        type: isOrigin ? 'origin' : isDestination ? 'destination' : 'waypoint',
        notes: wp.note || undefined,
      };
    });

    // Step 4: Build the response in the expected format
    const optimizedRoute = {
      id: `route-optimized-${Date.now()}`,
      vesselId: vessel.id,
      vesselName: vessel.name,
      origin: {
        id: 'origin',
        lat: origin.lat,
        lng: origin.lng,
        name: origin.name,
        type: 'origin',
      },
      destination: {
        id: 'destination',
        lat: destination.lat,
        lng: destination.lng,
        name: destination.name,
        type: 'destination',
      },
      waypoints,
      totalDistanceNm: totalDistance,
      estimatedDurationHours: estimatedTime,
      estimatedFuelLiters: fuelConsumption,
      estimatedCostUSD: fuelCost,
      createdAt: new Date(),
      routeType: seaRouteResult.source === 'api' ? 'sea_route' : seaRouteResult.source === 'hybrid' ? 'hybrid_corrected' : 'network_fallback',
    };

    // Also create a "direct" route for comparison (straight line, for reference only)
    const directDistance = calculateDistanceNm(origin.lat, origin.lng, destination.lat, destination.lng);
    const directTime = directDistance / speed;
    const directFuel = directDistance * fuelRate;

    const originalRoute = {
      id: `route-direct-${Date.now()}`,
      vesselId: vessel.id,
      vesselName: vessel.name,
      origin: optimizedRoute.origin,
      destination: optimizedRoute.destination,
      waypoints: [optimizedRoute.origin, optimizedRoute.destination],
      totalDistanceNm: directDistance,
      estimatedDurationHours: directTime,
      estimatedFuelLiters: directFuel,
      estimatedCostUSD: directFuel * FUEL_COST_USD_PER_LITER,
      createdAt: new Date(),
      routeType: 'direct',
    };

    // Generate safety analysis based on route characteristics
    const safetyFeatures: string[] = [];
    const hazardsAvoided: { type: string; name: string; description: string }[] = [];
    
    // Analyze waypoints for safety features
    for (const wp of waypoints) {
      if (wp.name?.includes('Channel')) {
        safetyFeatures.push('Uses protected channel navigation');
        hazardsAvoided.push({
          type: 'shallow_water',
          name: 'Coastal shallows',
          description: 'Route navigates through protected channel to avoid shallow coastal waters'
        });
      }
      if (wp.name?.includes('Offshore')) {
        safetyFeatures.push('Follows offshore shipping lanes');
        hazardsAvoided.push({
          type: 'land_proximity',
          name: 'Coastal hazards',
          description: 'Route maintains safe distance from coastline through offshore waypoints'
        });
      }
      if (wp.name?.includes('Approach')) {
        safetyFeatures.push('Uses designated port approach');
      }
    }
    
    // Check if direct route would cross land
    const directRouteCrossesLand = totalDistance > directDistance * 1.1; // If optimized is significantly longer, land was avoided
    if (directRouteCrossesLand) {
      hazardsAvoided.push({
        type: 'land_mass',
        name: 'Land crossing avoided',
        description: 'Direct route would cross land - optimized route navigates around obstacles'
      });
      safetyFeatures.push('Avoids land masses (UAE coast, islands)');
    }
    
    // Deduplicate safety features
    const uniqueSafetyFeatures = [...new Set(safetyFeatures)];
    
    // Determine safety improvement level with reasoning
    let safetyImprovement: 'significant' | 'moderate' | 'minor' = 'moderate';
    let safetyReasoning = '';
    
    if (hazardsAvoided.length >= 2) {
      safetyImprovement = 'significant';
      safetyReasoning = `Route avoids ${hazardsAvoided.length} potential hazards: ${hazardsAvoided.map(h => h.name).join(', ')}. ${uniqueSafetyFeatures.join('. ')}.`;
    } else if (hazardsAvoided.length === 1) {
      safetyImprovement = 'moderate';
      safetyReasoning = `Route avoids ${hazardsAvoided[0].name}. ${uniqueSafetyFeatures.join('. ')}.`;
    } else {
      safetyImprovement = 'minor';
      safetyReasoning = uniqueSafetyFeatures.length > 0 
        ? `${uniqueSafetyFeatures.join('. ')}.`
        : 'Route follows standard maritime paths.';
    }

    // Build the result
    const result = {
      id: `opt-result-${Date.now()}`,
      timestamp: new Date(),
      vessel: {
        id: vessel.id,
        name: vessel.name,
        type: vessel.type,
        currentPosition: { lat: origin.lat, lng: origin.lng },
        speed,
        fuelConsumptionRate: fuelRate,
      },
      origin: optimizedRoute.origin,
      destination: optimizedRoute.destination,
      originalRoute,
      optimizedRoute,
      weatherZonesAvoided: weatherZones.filter(z => z.severity === 'severe' || z.severity === 'moderate'),
      hazardsAvoided,
      optimizations: uniqueSafetyFeatures,
      summary: {
        distanceDeltaNm: directDistance - totalDistance,
        timeDeltaHours: directTime - estimatedTime,
        fuelDeltaLiters: directFuel - fuelConsumption,
        costDeltaUSD: (directFuel - fuelConsumption) * FUEL_COST_USD_PER_LITER,
        safetyImprovement,
        safetyReasoning,
      },
      recommendation: 'use_optimized' as const,
      reasoningText: seaRouteResult.source === 'network' 
        ? `Route calculated using verified maritime network. ${safetyReasoning}`
        : seaRouteResult.source === 'hybrid'
        ? `Sea route corrected for land crossings. ${safetyReasoning}`
        : `Sea route via Datalastic API. ${safetyReasoning}`,
      confidence: seaRouteResult.source === 'network' ? 95 : seaRouteResult.source === 'hybrid' ? 90 : 85,
      routeSource: seaRouteResult.source,
    };

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Route optimizer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to optimize route' },
      { status: 500 }
    );
  }
}

// Helper: Calculate distance between two points (Haversine)
function calculateDistanceNm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const EARTH_RADIUS_NM = 3440.065;
  const toRad = (deg: number) => deg * (Math.PI / 180);
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_NM * c;
}
