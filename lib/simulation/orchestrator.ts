/**
 * AI-Powered Simulation Orchestrator
 * 
 * This module provides a centralized, AI-driven simulation engine that:
 * 1. Manages vessel movements, fuel consumption, and equipment degradation
 * 2. Generates realistic weather patterns
 * 3. Creates AI-driven events and anomalies
 * 4. Produces intelligent alerts with mitigation recommendations
 * 5. Maintains simulation state and timing
 */

import { createClient } from '@supabase/supabase-js';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

// Initialize clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================================
// TYPES
// ============================================================================

export interface SimulationState {
  isRunning: boolean;
  speedMultiplier: number;
  simulatedTime: Date;
  realStartTime: Date;
  tickCount: number;
  lastTickTime: number;
}

export interface AIInsight {
  id: string;
  type: 'forecast' | 'alert' | 'recommendation' | 'anomaly';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affectedAssets: string[];
  suggestedActions: string[];
  confidence: number;
  timeframe?: string;
  createdAt: string;
}

export interface SimulationEvent {
  type: 'EQUIPMENT_FAILURE' | 'WEATHER_CHANGE' | 'FUEL_CRITICAL' | 'COLLISION_RISK' | 'MAINTENANCE_DUE' | 'ANOMALY_DETECTED';
  severity: 'info' | 'warning' | 'critical';
  vesselId?: string;
  assetId?: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

interface Vessel {
  id: string;
  name: string;
  type: string;
  status: string;
  position_lat: number;
  position_lng: number;
  heading: number;
  speed: number;
  fuel_level: number;
  health_score: number;
  hull_fouling_idx: number;
  lube_oil_ferro_ppm: number;
  rope_health_score: number;
  thruster_vibration: number;
  op_mode: string;
  fuel_rate_tph: number;
  project?: string;
}

// ============================================================================
// SIMULATION STATE (In-memory)
// ============================================================================

let simulationState: SimulationState = {
  isRunning: false,
  speedMultiplier: 60,
  simulatedTime: new Date(),
  realStartTime: new Date(),
  tickCount: 0,
  lastTickTime: Date.now(),
};

let pendingInsights: AIInsight[] = [];
let lastAIAnalysisTime = 0;
const AI_ANALYSIS_INTERVAL = 30000; // Run AI analysis every 30 seconds

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// UAE/Persian Gulf WATER boundaries (avoiding land)
// These coordinates are specifically in the Persian Gulf and Gulf of Oman
const BOUNDS = {
  lat: { min: 24.2, max: 26.2 },
  lng: { min: 52.5, max: 56.0 },
};

// Key water locations for spawning vessels
const WATER_ZONES = [
  { name: 'Abu Dhabi Port', lat: 24.45, lng: 54.37 },
  { name: 'Dubai Port', lat: 25.27, lng: 55.28 },
  { name: 'Jebel Ali', lat: 25.02, lng: 55.03 },
  { name: 'Fujairah', lat: 25.13, lng: 56.35 },
  { name: 'Das Island', lat: 25.15, lng: 52.87 },
  { name: 'Zirku Island', lat: 24.88, lng: 53.07 },
  { name: 'Mubarraz', lat: 24.23, lng: 53.35 },
  { name: 'Offshore Field 1', lat: 24.8, lng: 53.5 },
  { name: 'Offshore Field 2', lat: 25.5, lng: 54.2 },
  { name: 'Offshore Field 3', lat: 24.6, lng: 54.8 },
];

// Weather zones with characteristics
const WEATHER_ZONES = [
  { name: 'Abu Dhabi Coastal', lat: 24.4, lng: 54.4, baseTemp: 32, baseWind: 12, baseWave: 0.8 },
  { name: 'Dubai Maritime', lat: 25.2, lng: 55.3, baseTemp: 33, baseWind: 15, baseWave: 1.0 },
  { name: 'Fujairah Open Sea', lat: 25.1, lng: 56.3, baseTemp: 30, baseWind: 18, baseWave: 1.5 },
  { name: 'Das Island Offshore', lat: 25.1, lng: 52.9, baseTemp: 31, baseWind: 20, baseWave: 1.8 },
  { name: 'Ruwais Industrial', lat: 24.1, lng: 52.7, baseTemp: 34, baseWind: 14, baseWave: 0.6 },
];

// ============================================================================
// VESSEL SIMULATION
// ============================================================================

function simulateVesselMovement(vessel: Vessel, deltaSeconds: number): Partial<Vessel> {
  const speed = vessel.speed ?? 0;
  const heading = vessel.heading ?? 0;
  const posLat = vessel.position_lat ?? 24.8;
  const posLng = vessel.position_lng ?? 54.0;
  const opMode = vessel.op_mode ?? 'IDLE';
  
  // Skip stationary vessels
  if (speed <= 0 || opMode === 'MAINT' || vessel.status === 'maintenance') {
    return {};
  }

  // Calculate distance traveled (nautical miles to degrees)
  const speedKmH = speed * 1.852;
  const distanceKm = (speedKmH * deltaSeconds) / 3600;
  const distanceDegrees = distanceKm / 111;

  // Calculate new position
  const headingRad = (heading * Math.PI) / 180;
  let newLat = posLat + distanceDegrees * Math.cos(headingRad);
  let newLng = posLng + distanceDegrees * Math.sin(headingRad);
  let newHeading = heading + randomInRange(-2, 2);

  // Bounce off boundaries
  if (newLat < BOUNDS.lat.min || newLat > BOUNDS.lat.max) {
    newHeading = 180 - newHeading;
    newLat = clamp(newLat, BOUNDS.lat.min, BOUNDS.lat.max);
  }
  if (newLng < BOUNDS.lng.min || newLng > BOUNDS.lng.max) {
    newHeading = -newHeading;
    newLng = clamp(newLng, BOUNDS.lng.min, BOUNDS.lng.max);
  }

  newHeading = ((newHeading % 360) + 360) % 360;

  return {
    position_lat: newLat,
    position_lng: newLng,
    heading: newHeading,
  };
}

function simulateFuelConsumption(vessel: Vessel, deltaSeconds: number): Partial<Vessel> {
  // Base fuel consumption rate (tons per hour)
  let fuelRate = vessel.fuel_rate_tph ?? 0.5;

  // Adjust for hull fouling (up to 30% penalty at max fouling)
  const foulingPenalty = 1 + (vessel.hull_fouling_idx ?? 0) * 0.03;
  fuelRate *= foulingPenalty;

  // Adjust for speed (quadratic relationship)
  const speedFactor = Math.pow((vessel.speed ?? 0) / 8, 2);
  fuelRate *= Math.max(0.3, speedFactor);

  // Calculate fuel consumed
  const fuelTonsUsed = (fuelRate * deltaSeconds) / 3600;
  const fuelPercentUsed = (fuelTonsUsed / 1000) * 100;

  let newFuelLevel = Math.max(0, (vessel.fuel_level ?? 100) - fuelPercentUsed);

  // Auto-refuel when critically low (simulates returning to port)
  if (newFuelLevel < 10 && Math.random() < 0.3) {
    newFuelLevel = randomInRange(70, 95);
  }

  return { fuel_level: newFuelLevel };
}

function simulateEquipmentDegradation(vessel: Vessel, deltaSeconds: number): Partial<Vessel> {
  const hoursFactor = deltaSeconds / 3600;

  // Use default values if fields don't exist in database
  const currentHullFouling = vessel.hull_fouling_idx ?? 2;
  const currentLubeOil = vessel.lube_oil_ferro_ppm ?? 20;
  const currentRopeHealth = vessel.rope_health_score ?? 95;
  const currentOpMode = vessel.op_mode ?? 'IDLE';

  // Hull fouling - slow increase
  const newHullFouling = clamp(
    currentHullFouling + randomInRange(0, 0.005 * hoursFactor),
    0,
    10
  );

  // Lube oil contamination - gradual increase with occasional spikes
  let lubeOilIncrease = randomInRange(0, 0.3 * hoursFactor);
  if (Math.random() < 0.01) lubeOilIncrease *= 5; // Occasional spike
  const newLubeOil = clamp(currentLubeOil + lubeOilIncrease, 0, 100);

  // Rope health - gradual decrease for working vessels
  let ropeDecrease = 0;
  if (currentOpMode === 'WORK') {
    ropeDecrease = randomInRange(0, 0.05 * hoursFactor);
  }
  const newRopeHealth = clamp(currentRopeHealth - ropeDecrease, 50, 100);

  // Thruster vibration - fluctuates based on load
  const baseVibration = currentOpMode === 'WORK' ? 4 : 2;
  const newVibration = clamp(
    baseVibration + randomInRange(-0.5, 0.5),
    0,
    10
  );

  // Calculate overall health score
  const healthFactors = [
    (10 - newHullFouling) / 10,
    (100 - newLubeOil) / 100,
    newRopeHealth / 100,
    (10 - newVibration) / 10,
  ];
  const newHealthScore = Math.round(
    healthFactors.reduce((a, b) => a + b, 0) / healthFactors.length * 100
  );

  // Only return fields that exist in the database schema
  // The orchestrator will try to update these, but DB will ignore non-existent columns
  return {
    health_score: newHealthScore,
  };
}

// ============================================================================
// WEATHER SIMULATION
// ============================================================================

function simulateWeather(): Record<string, unknown> {
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour > 20;
  
  // Select a random zone for weather generation
  const zone = WEATHER_ZONES[Math.floor(Math.random() * WEATHER_ZONES.length)];

  // Time-based variations
  const tempVariation = isNight ? -5 : randomInRange(-2, 3);
  const windVariation = isNight ? 0.8 : 1;

  // Generate weather conditions
  const conditions = ['clear', 'cloudy', 'partly_cloudy', 'overcast'];
  const weights = isNight ? [0.6, 0.2, 0.15, 0.05] : [0.4, 0.25, 0.25, 0.1];
  let condition = 'clear';
  const rand = Math.random();
  let cumWeight = 0;
  for (let i = 0; i < conditions.length; i++) {
    cumWeight += weights[i];
    if (rand < cumWeight) {
      condition = conditions[i];
      break;
    }
  }

  // Occasional adverse weather
  let severity = 'normal';
  if (Math.random() < 0.05) {
    condition = Math.random() < 0.7 ? 'rain' : 'storm';
    severity = condition === 'storm' ? 'severe' : 'advisory';
  }

  const windSpeed = Math.round((zone.baseWind + randomInRange(-5, 8)) * windVariation);
  const waveHeight = Math.round((zone.baseWave + randomInRange(-0.3, 0.5)) * 10) / 10;

  return {
    zone: zone.name,
    condition,
    severity,
    temperature: Math.round(zone.baseTemp + tempVariation),
    wind_speed: windSpeed,
    wind_direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
    wave_height: Math.max(0.2, waveHeight),
    visibility: condition === 'storm' ? randomInRange(0.5, 2) : condition === 'fog' ? randomInRange(0.2, 1) : randomInRange(8, 15),
    updated_at: new Date().toISOString(),
  };
}

// ============================================================================
// AI ANALYSIS & INSIGHTS
// ============================================================================

async function runAIAnalysis(vessels: Vessel[]): Promise<AIInsight[]> {
  // Detect issues programmatically first
  const issues: { type: string; severity: string; vessels: string[]; data: unknown }[] = [];

  // Fuel issues
  const lowFuel = vessels.filter(v => v.fuel_level < 30);
  if (lowFuel.length > 0) {
    issues.push({
      type: 'LOW_FUEL',
      severity: lowFuel.some(v => v.fuel_level < 15) ? 'critical' : 'warning',
      vessels: lowFuel.map(v => v.name),
      data: lowFuel.map(v => ({ name: v.name, fuel: Math.round(v.fuel_level) })),
    });
  }

  // Health issues
  const lowHealth = vessels.filter(v => v.health_score < 70);
  if (lowHealth.length > 0) {
    issues.push({
      type: 'EQUIPMENT_DEGRADATION',
      severity: lowHealth.some(v => v.health_score < 60) ? 'critical' : 'warning',
      vessels: lowHealth.map(v => v.name),
      data: lowHealth.map(v => ({
        name: v.name,
        health: v.health_score,
        fouling: v.hull_fouling_idx?.toFixed(1),
        lubeOil: v.lube_oil_ferro_ppm?.toFixed(0),
      })),
    });
  }

  // High fouling
  const highFouling = vessels.filter(v => v.hull_fouling_idx > 5);
  if (highFouling.length > 0) {
    issues.push({
      type: 'HULL_FOULING',
      severity: 'warning',
      vessels: highFouling.map(v => v.name),
      data: highFouling.map(v => ({
        name: v.name,
        fouling: v.hull_fouling_idx?.toFixed(1),
        fuelPenalty: `+${Math.round(v.hull_fouling_idx * 3)}%`,
      })),
    });
  }

  if (issues.length === 0) {
    return [];
  }

  // Use AI to generate insights
  try {
    const prompt = `You are an AI fleet monitoring system. Generate actionable insights from these detected issues:

${JSON.stringify(issues, null, 2)}

Return a JSON array of 2-4 insights. Each insight must have:
- id: "insight-{timestamp}-{index}"
- type: "forecast" | "alert" | "recommendation" | "anomaly"  
- severity: "info" | "warning" | "critical"
- title: actionable title (max 50 chars)
- description: 2 sentences explaining the issue and impact
- affectedAssets: array of vessel names
- suggestedActions: 2-3 specific mitigation steps
- confidence: 0.75-0.95
- timeframe: when action needed (e.g., "next 2 hours")

Focus on:
1. Safety-critical issues first
2. Fuel consumption forecasts
3. Maintenance recommendations
4. Operational efficiency

Return ONLY valid JSON array.`;

    const result = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt,
    });

    const jsonMatch = result.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const insights = JSON.parse(jsonMatch[0]) as AIInsight[];
      return insights.map((insight, i) => ({
        ...insight,
        id: `insight-${Date.now()}-${i}`,
        createdAt: new Date().toISOString(),
      }));
    }
  } catch (error) {
    console.error('AI analysis error:', error);
  }

  // Fallback: generate basic insights from issues
  return issues.slice(0, 3).map((issue, i) => ({
    id: `insight-${Date.now()}-${i}`,
    type: 'alert' as const,
    severity: issue.severity as 'warning' | 'critical',
    title: issue.type.replace(/_/g, ' ').toLowerCase(),
    description: `Detected ${issue.type.toLowerCase().replace(/_/g, ' ')} affecting ${issue.vessels.length} vessel(s). Immediate attention recommended.`,
    affectedAssets: issue.vessels,
    suggestedActions: ['Review affected vessels', 'Schedule maintenance', 'Monitor closely'],
    confidence: 0.85,
    createdAt: new Date().toISOString(),
  }));
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

export async function runSimulationTick(): Promise<{
  success: boolean;
  tickNumber: number;
  simulatedSeconds: number;
  vesselsUpdated: number;
  insights: AIInsight[];
  error?: string;
}> {
  const now = Date.now();
  const realElapsed = (now - simulationState.lastTickTime) / 1000;
  const simulatedSeconds = realElapsed * simulationState.speedMultiplier;

  simulationState.lastTickTime = now;
  simulationState.tickCount++;
  simulationState.simulatedTime = new Date(
    simulationState.simulatedTime.getTime() + simulatedSeconds * 1000
  );

  try {
    // Fetch all vessels
    const { data: vessels, error: fetchError } = await supabase
      .from('vessels')
      .select('*');

    if (fetchError || !vessels) {
      throw new Error(`Failed to fetch vessels: ${fetchError?.message}`);
    }

    // Update each vessel
    const updates = vessels.map((vessel: Vessel) => {
      const movement = simulateVesselMovement(vessel, simulatedSeconds);
      const fuel = simulateFuelConsumption(vessel, simulatedSeconds);
      const equipment = simulateEquipmentDegradation(vessel, simulatedSeconds);

      return {
        id: vessel.id,
        ...movement,
        ...fuel,
        ...equipment,
        updated_at: new Date().toISOString(),
      };
    });

    // Batch update vessels
    for (const update of updates) {
      await supabase.from('vessels').update(update).eq('id', update.id);
    }

    // Update weather periodically
    if (simulationState.tickCount % 5 === 0) {
      const weather = simulateWeather();
      await supabase.from('weather').update(weather).eq('id', 1);
    }

    // Run AI analysis periodically
    let newInsights: AIInsight[] = [];
    if (now - lastAIAnalysisTime > AI_ANALYSIS_INTERVAL) {
      lastAIAnalysisTime = now;
      newInsights = await runAIAnalysis(vessels as Vessel[]);
      pendingInsights = [...newInsights, ...pendingInsights].slice(0, 10);
    }

    return {
      success: true,
      tickNumber: simulationState.tickCount,
      simulatedSeconds,
      vesselsUpdated: vessels.length,
      insights: newInsights,
    };
  } catch (error) {
    return {
      success: false,
      tickNumber: simulationState.tickCount,
      simulatedSeconds,
      vesselsUpdated: 0,
      insights: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function getSimulationState(): SimulationState {
  return { ...simulationState };
}

export function setSimulationSpeed(speed: number): void {
  simulationState.speedMultiplier = Math.max(1, Math.min(3600, speed));
  simulationState.lastTickTime = Date.now();
}

export function startSimulation(): void {
  simulationState.isRunning = true;
  simulationState.realStartTime = new Date();
  simulationState.simulatedTime = new Date();
  simulationState.lastTickTime = Date.now();
}

export function stopSimulation(): void {
  simulationState.isRunning = false;
}

export function getPendingInsights(): AIInsight[] {
  return pendingInsights;
}

export function clearInsights(): void {
  pendingInsights = [];
}

export function resetSimulation(): void {
  simulationState = {
    isRunning: false,
    speedMultiplier: 60,
    simulatedTime: new Date(),
    realStartTime: new Date(),
    tickCount: 0,
    lastTickTime: Date.now(),
  };
  pendingInsights = [];
  lastAIAnalysisTime = 0;
}

