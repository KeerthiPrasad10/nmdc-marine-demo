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
  const rates: Record<string, number> = {
    dredger: 85,
    crane_barge: 45,
    supply_vessel: 35,
    tugboat: 25,
    survey_vessel: 20,
    barge: 0,
  };
  return rates[vesselType] || 40;
}












