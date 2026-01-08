import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Route } from '@/lib/routes/types';

// Type assertion helper for routes table (not in generated types yet)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routesTable = () => supabase.from('routes' as any);

/**
 * Routes API - CRUD operations for saved routes
 * 
 * GET /api/routes - List all routes or filter by vessel
 * POST /api/routes - Create a new route
 * PUT /api/routes - Update a route
 * DELETE /api/routes - Delete a route
 */

// In-memory storage for routes when Supabase is not configured
const inMemoryRoutes: Map<string, Route> = new Map();

// ============================================================================
// GET - List routes
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vesselId = searchParams.get('vessel_id');
    const status = searchParams.get('status');
    const routeId = searchParams.get('id');

    // If specific route ID requested
    if (routeId) {
      return getRouteById(routeId);
    }

    // List routes with optional filters
    if (isSupabaseConfigured) {
      let query = routesTable()
        .select('*')
        .order('created_at', { ascending: false });

      if (vesselId) {
        query = query.eq('vessel_id', vesselId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching routes:', error);
        throw error;
      }

      return NextResponse.json({
        success: true,
        routes: data || [],
        count: data?.length || 0,
      });
    } else {
      // Use in-memory storage
      let routes = Array.from(inMemoryRoutes.values());

      if (vesselId) {
        routes = routes.filter(r => r.vesselId === vesselId);
      }

      if (status) {
        routes = routes.filter(r => r.status === status);
      }

      // Sort by createdAt descending
      routes.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({
        success: true,
        routes,
        count: routes.length,
        source: 'memory',
      });
    }
  } catch (error) {
    console.error('Routes GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch routes' },
      { status: 500 }
    );
  }
}

async function getRouteById(routeId: string) {
  if (isSupabaseConfigured) {
    const { data, error } = await routesTable()
      .select('*')
      .eq('id', routeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Route not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, route: data });
  } else {
    const route = inMemoryRoutes.get(routeId);
    if (!route) {
      return NextResponse.json(
        { success: false, error: 'Route not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, route });
  }
}

// ============================================================================
// POST - Create route
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const route: Route = body.route || body;

    // Validate required fields
    if (!route.vesselId) {
      return NextResponse.json(
        { success: false, error: 'vesselId is required' },
        { status: 400 }
      );
    }

    if (!route.origin || !route.destination) {
      return NextResponse.json(
        { success: false, error: 'origin and destination are required' },
        { status: 400 }
      );
    }

    // Ensure ID and timestamps
    const routeToSave = {
      ...route,
      id: route.id || `route-${Date.now()}`,
      createdAt: route.createdAt || new Date(),
      status: route.status || 'planned',
    };

    if (isSupabaseConfigured) {
      // Convert to database format
      const dbRoute = {
        id: routeToSave.id,
        vessel_id: routeToSave.vesselId,
        name: routeToSave.name,
        origin: routeToSave.origin,
        destination: routeToSave.destination,
        waypoints: routeToSave.waypoints,
        segments: routeToSave.segments,
        total_distance: routeToSave.totalDistance,
        estimated_time: routeToSave.estimatedTime,
        fuel_consumption: routeToSave.fuelConsumption,
        emissions: routeToSave.emissions,
        average_speed: routeToSave.averageSpeed,
        weather_risk: routeToSave.weatherRisk,
        cost: routeToSave.cost,
        status: routeToSave.status,
        created_at: routeToSave.createdAt,
      };

      const { data, error } = await routesTable()
        .insert(dbRoute)
        .select()
        .single();

      if (error) {
        console.error('Error creating route:', error);
        throw error;
      }

      return NextResponse.json({
        success: true,
        route: data,
        message: 'Route created successfully',
      });
    } else {
      // Use in-memory storage
      inMemoryRoutes.set(routeToSave.id, routeToSave);

      return NextResponse.json({
        success: true,
        route: routeToSave,
        message: 'Route created successfully',
        source: 'memory',
      });
    }
  } catch (error) {
    console.error('Routes POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create route' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update route
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Route id is required' },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured) {
      // Convert updates to database format
      const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.waypoints !== undefined) dbUpdates.waypoints = updates.waypoints;
      if (updates.segments !== undefined) dbUpdates.segments = updates.segments;
      if (updates.totalDistance !== undefined) dbUpdates.total_distance = updates.totalDistance;
      if (updates.estimatedTime !== undefined) dbUpdates.estimated_time = updates.estimatedTime;
      if (updates.fuelConsumption !== undefined) dbUpdates.fuel_consumption = updates.fuelConsumption;
      if (updates.emissions !== undefined) dbUpdates.emissions = updates.emissions;
      if (updates.weatherRisk !== undefined) dbUpdates.weather_risk = updates.weatherRisk;
      if (updates.cost !== undefined) dbUpdates.cost = updates.cost;

      const { data, error } = await routesTable()
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Route not found' },
            { status: 404 }
          );
        }
        throw error;
      }

      return NextResponse.json({
        success: true,
        route: data,
        message: 'Route updated successfully',
      });
    } else {
      // Use in-memory storage
      const existingRoute = inMemoryRoutes.get(id);
      if (!existingRoute) {
        return NextResponse.json(
          { success: false, error: 'Route not found' },
          { status: 404 }
        );
      }

      const updatedRoute = { ...existingRoute, ...updates };
      inMemoryRoutes.set(id, updatedRoute);

      return NextResponse.json({
        success: true,
        route: updatedRoute,
        message: 'Route updated successfully',
        source: 'memory',
      });
    }
  } catch (error) {
    console.error('Routes PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update route' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete route
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Route id is required' },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured) {
      const { error } = await routesTable()
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: 'Route deleted successfully',
      });
    } else {
      // Use in-memory storage
      const existed = inMemoryRoutes.has(id);
      inMemoryRoutes.delete(id);

      return NextResponse.json({
        success: true,
        message: existed ? 'Route deleted successfully' : 'Route not found',
        source: 'memory',
      });
    }
  } catch (error) {
    console.error('Routes DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete route' },
      { status: 500 }
    );
  }
}

