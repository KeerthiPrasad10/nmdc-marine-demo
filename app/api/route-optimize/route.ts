import { NextRequest, NextResponse } from 'next/server';
import { RouteOptimizationRequest } from '@/lib/routes/types';
import { optimizeSingleRoute, optimizeMultiStopRoute, Stop } from '@/lib/routes/optimizer';
import { generateRoute } from '@/lib/routes/engine';

/**
 * Route Optimization API
 * 
 * POST /api/route-optimize
 * 
 * Supports two modes:
 * 1. Single route optimization: origin + destination with priority-based route selection
 * 2. Multi-stop optimization: origin + multiple stops with sequence optimization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Determine optimization mode
    const isMultiStop = body.stops && Array.isArray(body.stops) && body.stops.length > 0;
    
    if (isMultiStop) {
      // Multi-stop route optimization
      return handleMultiStopOptimization(body);
    } else {
      // Single route optimization
      return handleSingleRouteOptimization(body);
    }
  } catch (error) {
    console.error('Route optimization error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to optimize route' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle single route optimization (origin to destination)
 */
async function handleSingleRouteOptimization(body: {
  vesselId: string;
  vesselName?: string;
  vesselType?: string;
  origin: { lat: number; lng: number; name?: string };
  destination: { lat: number; lng: number; name?: string };
  priorities?: {
    time: number;
    fuel: number;
    cost: number;
    emissions: number;
    safety: number;
  };
  constraints?: {
    maxSpeed?: number;
    minSpeed?: number;
    deadline?: string;
  };
}) {
  const {
    vesselId,
    vesselName = 'Unknown Vessel',
    vesselType = 'supply_vessel',
    origin,
    destination,
    priorities = { time: 50, fuel: 50, cost: 50, emissions: 50, safety: 50 },
  } = body;

  // Validate required fields
  if (!vesselId) {
    return NextResponse.json(
      { success: false, error: 'vesselId is required' },
      { status: 400 }
    );
  }

  if (!origin?.lat || !origin?.lng) {
    return NextResponse.json(
      { success: false, error: 'origin with lat/lng is required' },
      { status: 400 }
    );
  }

  if (!destination?.lat || !destination?.lng) {
    return NextResponse.json(
      { success: false, error: 'destination with lat/lng is required' },
      { status: 400 }
    );
  }

  // Build optimization request
  const optimizationRequest: RouteOptimizationRequest = {
    vesselId,
    origin: {
      lat: origin.lat,
      lng: origin.lng,
      name: origin.name,
    },
    destination: {
      lat: destination.lat,
      lng: destination.lng,
      name: destination.name,
    },
    priorities,
    constraints: body.constraints ? {
      ...body.constraints,
      // Convert deadline string to Date if present
      deadline: body.constraints.deadline ? new Date(body.constraints.deadline) : undefined,
    } : {},
  };

  // Run optimization
  const result = await optimizeSingleRoute(
    optimizationRequest,
    vesselName,
    vesselType
  );

  return NextResponse.json({
    success: true,
    mode: 'single',
    result,
    generatedAt: new Date().toISOString(),
  });
}

/**
 * Handle multi-stop route optimization
 */
async function handleMultiStopOptimization(body: {
  vesselId: string;
  vesselName?: string;
  vesselType?: string;
  origin: { lat: number; lng: number; name?: string };
  stops: Array<{
    id?: string;
    name: string;
    lat: number;
    lng: number;
    priority?: number;
  }>;
  returnToOrigin?: boolean;
  priorities?: {
    distance: number;
    time: number;
    fuel: number;
  };
}) {
  const {
    vesselId,
    vesselName = 'Unknown Vessel',
    vesselType = 'supply_vessel',
    origin,
    stops,
    returnToOrigin = false,
    priorities,
  } = body;

  // Validate required fields
  if (!vesselId) {
    return NextResponse.json(
      { success: false, error: 'vesselId is required' },
      { status: 400 }
    );
  }

  if (!origin?.lat || !origin?.lng) {
    return NextResponse.json(
      { success: false, error: 'origin with lat/lng is required' },
      { status: 400 }
    );
  }

  if (!stops || stops.length === 0) {
    return NextResponse.json(
      { success: false, error: 'At least one stop is required for multi-stop optimization' },
      { status: 400 }
    );
  }

  // Convert to Stop format
  const originStop: Stop = {
    id: 'origin',
    name: origin.name || 'Origin',
    lat: origin.lat,
    lng: origin.lng,
  };

  const stopsList: Stop[] = stops.map((s, index) => ({
    id: s.id || `stop-${index}`,
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    priority: s.priority,
  }));

  // Run multi-stop optimization
  const result = await optimizeMultiStopRoute({
    vesselId,
    vesselName,
    vesselType,
    origin: originStop,
    stops: stopsList,
    returnToOrigin,
    priorities,
  });

  return NextResponse.json({
    success: true,
    mode: 'multi-stop',
    result,
    generatedAt: new Date().toISOString(),
  });
}

/**
 * GET /api/route-optimize
 * 
 * Quick route calculation without full optimization
 * Used for previewing routes on the map
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const fromLat = parseFloat(searchParams.get('from_lat') || '');
    const fromLng = parseFloat(searchParams.get('from_lng') || '');
    const toLat = parseFloat(searchParams.get('to_lat') || '');
    const toLng = parseFloat(searchParams.get('to_lng') || '');
    const vesselId = searchParams.get('vessel_id') || 'preview';
    const vesselType = searchParams.get('vessel_type') || 'supply_vessel';
    
    // Validate coordinates
    if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
      return NextResponse.json(
        { success: false, error: 'Valid from_lat, from_lng, to_lat, to_lng are required' },
        { status: 400 }
      );
    }
    
    // Generate a quick route preview
    const route = await generateRoute(
      vesselId,
      'Preview',
      vesselType,
      { lat: fromLat, lng: fromLng, name: searchParams.get('from_name') || undefined },
      { lat: toLat, lng: toLng, name: searchParams.get('to_name') || undefined }
    );
    
    return NextResponse.json({
      success: true,
      route,
      // Return simplified waypoints for map rendering
      waypoints: [
        { lat: route.origin.lat, lng: route.origin.lng },
        ...route.waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng })),
        { lat: route.destination.lat, lng: route.destination.lng },
      ],
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Route preview error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate route preview' 
      },
      { status: 500 }
    );
  }
}

