import { NextResponse } from 'next/server';
import {
  runSimulationTick,
  getSimulationState,
  setSimulationSpeed,
  startSimulation,
  stopSimulation,
  getPendingInsights,
  clearInsights,
  resetSimulation,
} from '@/lib/simulation/grid-orchestrator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/simulation
 * 
 * Query parameters:
 * - action: 'status' | 'tick' | 'setSpeed' | 'insights' | 'clearInsights' | 'reset'
 * - speed: number (for setSpeed action)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';
  const speed = parseInt(searchParams.get('speed') || '60', 10);

  try {
    switch (action) {
      case 'status': {
        const state = getSimulationState();
        const insights = getPendingInsights();
        return NextResponse.json({
          success: true,
          state,
          insightCount: insights.length,
        });
      }

      case 'tick': {
        // Set speed before running tick
        setSimulationSpeed(speed);
        const result = await runSimulationTick();
        return NextResponse.json(result);
      }

      case 'setSpeed': {
        setSimulationSpeed(speed);
        return NextResponse.json({
          success: true,
          message: `Simulation speed set to ${speed}x`,
          speed,
        });
      }

      case 'insights': {
        const insights = getPendingInsights();
        return NextResponse.json({
          success: true,
          insights,
          count: insights.length,
        });
      }

      case 'clearInsights': {
        clearInsights();
        return NextResponse.json({
          success: true,
          message: 'Insights cleared',
        });
      }

      case 'reset': {
        resetSimulation();
        return NextResponse.json({
          success: true,
          message: 'Simulation reset',
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Simulation API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Simulation error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/simulation - Start simulation
 */
export async function POST() {
  startSimulation();
  return NextResponse.json({
    success: true,
    message: 'Simulation started',
    state: getSimulationState(),
  });
}

/**
 * DELETE /api/simulation - Stop simulation
 */
export async function DELETE() {
  stopSimulation();
  return NextResponse.json({
    success: true,
    message: 'Simulation stopped',
    state: getSimulationState(),
  });
}
