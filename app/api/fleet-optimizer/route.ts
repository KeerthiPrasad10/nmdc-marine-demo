import { NextRequest, NextResponse } from 'next/server';
import {
  optimizeFleet,
  VesselPosition,
  ProjectLocation,
  FleetOptimizationResult,
} from '@/lib/orchestration/fleet-optimizer';
import { VesselAssignment } from '@/lib/orchestration/types';

interface RequestBody {
  vessels: Array<{
    id: string;
    name: string;
    type: string;
    lat: number;
    lng: number;
    speed?: number;
  }>;
  projects: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    requiredVesselTypes: string[];
    priority: 'critical' | 'high' | 'medium' | 'low';
    startDate: string;
    endDate: string;
  }>;
  assignments: Array<{
    id: string;
    vesselId: string;
    vesselName: string;
    projectId: string;
    projectName: string;
    startDate: string;
    endDate: string;
    status: string;
    utilization: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { vessels, projects, assignments } = body;

    // Convert to optimizer input format
    const vesselPositions: VesselPosition[] = vessels.map((v) => ({
      id: v.id,
      name: v.name,
      type: v.type,
      lat: v.lat,
      lng: v.lng,
      speed: v.speed || 10,
      fuelConsumptionRate: getFuelRate(v.type),
    }));

    const projectLocations: ProjectLocation[] = projects.map((p) => ({
      id: p.id,
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      requiredVesselTypes: p.requiredVesselTypes,
      priority: p.priority,
      startDate: new Date(p.startDate),
      endDate: new Date(p.endDate),
    }));

    const vesselAssignments: VesselAssignment[] = assignments.map((a) => ({
      id: a.id,
      vesselId: a.vesselId,
      vesselName: a.vesselName,
      projectId: a.projectId,
      projectName: a.projectName,
      startDate: new Date(a.startDate),
      endDate: new Date(a.endDate),
      status: a.status as 'scheduled' | 'active' | 'completed' | 'cancelled',
      utilization: a.utilization,
    }));

    // Run the optimizer
    const result: FleetOptimizationResult = optimizeFleet({
      vessels: vesselPositions,
      projects: projectLocations,
      currentAssignments: vesselAssignments,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Fleet optimizer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to optimize fleet' },
      { status: 500 }
    );
  }
}

function getFuelRate(vesselType: string): number {
  // Ferry fuel consumption rates by class (liters per nautical mile)
  const rates: Record<string, number> = {
    ferry: 65,
    jumbo_mark_ii: 80,
    jumbo: 70,
    super: 55,
    issaquah_130: 50,
    olympic: 45,
    evergreen_state: 40,
  };
  return rates[vesselType] || 65;
}









