/**
 * Grid Asset Simulation Orchestrator
 * 
 * Simulates real-time grid operations:
 * 1. Load cycling (diurnal demand patterns, peak/off-peak)
 * 2. Weather impact on grid assets (heat stress, storms, cold snaps)
 * 3. DGA gas trending and transformer degradation
 * 4. AI-driven grid insights and alerts
 */

import { EXELON_ASSETS } from '@/lib/exelon/fleet';
import { ASSET_ISSUES, getAssetIssueSummary } from '@/lib/asset-issues';
import { TRANSFORMER_HEALTH_DATA } from '@/lib/datasets/transformer-health';
import { getScenarioForAsset, DEMO_SCENARIOS } from '@/lib/demo-scenarios';

// ============================================================================
// TYPES
// ============================================================================

export interface GridSimulationState {
  isRunning: boolean;
  speedMultiplier: number;
  simulatedTime: Date;
  realStartTime: Date;
  tickCount: number;
  lastTickTime: number;
}

export interface GridAIInsight {
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

interface GridWeather {
  zone: string;
  condition: string;
  severity: string;
  temperature: number;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  heatIndex: number;
  stormRisk: number;
}

interface AssetSnapshot {
  assetTag: string;
  name: string;
  opCo: string;
  healthIndex: number;
  loadPercent: number;
  topOilTemp: number;
  hotSpotTemp: number;
  tdcg: number;
  moisture: number;
  status: string;
}

// ============================================================================
// STATE
// ============================================================================

let simulationState: GridSimulationState = {
  isRunning: false,
  speedMultiplier: 60,
  simulatedTime: new Date(),
  realStartTime: new Date(),
  tickCount: 0,
  lastTickTime: Date.now(),
};

let pendingInsights: GridAIInsight[] = [];
let assetSnapshots: AssetSnapshot[] = [];
let currentWeather: GridWeather | null = null;
let lastInsightGeneration = 0;
const INSIGHT_INTERVAL = 15000; // 15 seconds

// ============================================================================
// HELPERS
// ============================================================================

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// WEATHER SIMULATION (Mid-Atlantic US)
// ============================================================================

const WEATHER_ZONES = [
  { name: 'BGE Service Territory', baseTemp: 38, baseWind: 8, baseHumidity: 55 },
  { name: 'ComEd Chicago Metro', baseTemp: 32, baseWind: 12, baseHumidity: 50 },
  { name: 'PECO Philadelphia', baseTemp: 36, baseWind: 9, baseHumidity: 58 },
  { name: 'Pepco DC Metro', baseTemp: 40, baseWind: 7, baseHumidity: 60 },
  { name: 'ACE Atlantic Coast', baseTemp: 35, baseWind: 14, baseHumidity: 65 },
  { name: 'DPL Delaware Valley', baseTemp: 37, baseWind: 10, baseHumidity: 57 },
];

function simulateWeather(): GridWeather {
  const hour = simulationState.simulatedTime.getHours();
  const month = simulationState.simulatedTime.getMonth();
  const zone = WEATHER_ZONES[Math.floor(Math.random() * WEATHER_ZONES.length)];

  // Seasonal temperature adjustment (°F)
  const seasonalOffset = month >= 5 && month <= 8 ? 30 : month >= 11 || month <= 2 ? -20 : 5;
  // Diurnal variation
  const diurnalOffset = hour >= 12 && hour <= 16 ? 8 : hour >= 0 && hour <= 6 ? -5 : 0;

  const temperature = Math.round(zone.baseTemp + seasonalOffset + diurnalOffset + randomInRange(-3, 3));
  const windSpeed = Math.round(zone.baseWind + randomInRange(-4, 6));
  const humidity = Math.round(clamp(zone.baseHumidity + randomInRange(-10, 10), 20, 100));
  const heatIndex = temperature > 80 ? temperature + (humidity / 100) * 15 : temperature;

  // Storm risk
  let stormRisk = 0;
  let condition = 'clear';
  let severity = 'normal';

  if (Math.random() < 0.08) {
    condition = 'thunderstorm';
    stormRisk = randomInRange(0.6, 1.0);
    severity = 'severe';
  } else if (temperature > 95) {
    condition = 'extreme_heat';
    severity = 'warning';
    stormRisk = 0.2;
  } else if (temperature < 15) {
    condition = 'extreme_cold';
    severity = 'advisory';
    stormRisk = 0.1;
  } else if (windSpeed > 20) {
    condition = 'high_wind';
    severity = 'advisory';
    stormRisk = 0.3;
  } else if (Math.random() < 0.2) {
    condition = 'cloudy';
  }

  return {
    zone: zone.name,
    condition,
    severity,
    temperature,
    windSpeed,
    windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
    humidity,
    heatIndex: Math.round(heatIndex),
    stormRisk: Math.round(stormRisk * 100) / 100,
  };
}

// ============================================================================
// GRID ASSET SIMULATION
// ============================================================================

function initializeSnapshots(): void {
  assetSnapshots = EXELON_ASSETS.map(asset => {
    const record = TRANSFORMER_HEALTH_DATA.filter(r => r.assetTag === asset.assetTag).pop();
    const summary = getAssetIssueSummary(asset.assetTag);

    return {
      assetTag: asset.assetTag,
      name: asset.name,
      opCo: asset.opCo,
      healthIndex: record?.healthIndex ?? asset.healthIndex,
      loadPercent: record?.loadPercent ?? asset.loadFactor,
      topOilTemp: record?.topOilTemp ?? 65,
      hotSpotTemp: record?.windingHotSpot ?? 85,
      tdcg: record?.tdcg ?? 200,
      moisture: record?.moisture ?? 15,
      status: summary.hasCritical ? 'alarm' : asset.healthIndex < 50 ? 'watch' : 'normal',
    };
  });
}

function simulateLoadCycling(snapshot: AssetSnapshot, deltaHours: number, weather: GridWeather): AssetSnapshot {
  const hour = simulationState.simulatedTime.getHours();

  // Diurnal load pattern: 60% base, peaking at 100% around 3-6 PM
  let loadTarget: number;
  if (hour >= 15 && hour <= 18) {
    loadTarget = 85 + randomInRange(0, 15); // Peak hours
  } else if (hour >= 7 && hour <= 22) {
    loadTarget = 60 + randomInRange(0, 20); // Day hours
  } else {
    loadTarget = 40 + randomInRange(0, 15); // Night hours (valley)
  }

  // Heat increases demand (AC load)
  if (weather.temperature > 90) loadTarget += 10;
  if (weather.temperature > 100) loadTarget += 15;
  // Cold increases demand (heating)
  if (weather.temperature < 25) loadTarget += 8;

  // Smooth transition towards target
  const newLoad = clamp(
    snapshot.loadPercent + (loadTarget - snapshot.loadPercent) * 0.1 + randomInRange(-1, 1),
    20, 120
  );

  // Thermal follows load
  const ambientF = weather.temperature;
  const ambientC = (ambientF - 32) * 5 / 9;
  const topOilBase = ambientC + 25 + (newLoad / 100) * 30;
  const hotSpotBase = topOilBase + 10 + (newLoad / 100) * 15;

  const newTopOil = clamp(snapshot.topOilTemp + (topOilBase - snapshot.topOilTemp) * 0.05 + randomInRange(-0.3, 0.3), 30, 110);
  const newHotSpot = clamp(snapshot.hotSpotTemp + (hotSpotBase - snapshot.hotSpotTemp) * 0.05 + randomInRange(-0.5, 0.5), 40, 140);

  // DGA gas trending (very slow)
  const gasRate = snapshot.healthIndex < 50 ? 0.5 : snapshot.healthIndex < 70 ? 0.2 : 0.05;
  const newTDCG = clamp(snapshot.tdcg + randomInRange(-gasRate, gasRate * 2) * deltaHours, 50, 5000);

  // Moisture very slowly increases
  const newMoisture = clamp(snapshot.moisture + randomInRange(-0.01, 0.02) * deltaHours, 5, 60);

  // Health slowly degrades for unhealthy assets
  let healthDelta = 0;
  if (newHotSpot > 110) healthDelta -= 0.01 * deltaHours; // Thermal stress
  if (newTDCG > 1500) healthDelta -= 0.005 * deltaHours; // Gas trending
  if (newLoad > 100) healthDelta -= 0.008 * deltaHours; // Overload stress
  const newHealth = clamp(snapshot.healthIndex + healthDelta, 0, 100);

  // Update status
  let status = 'normal';
  if (newHealth < 30) status = 'critical';
  else if (newHealth < 50 || newTDCG > 1920) status = 'alarm';
  else if (newHealth < 70 || newTopOil > 85) status = 'watch';

  return {
    ...snapshot,
    loadPercent: Math.round(newLoad * 10) / 10,
    topOilTemp: Math.round(newTopOil * 10) / 10,
    hotSpotTemp: Math.round(newHotSpot * 10) / 10,
    tdcg: Math.round(newTDCG),
    moisture: Math.round(newMoisture * 10) / 10,
    healthIndex: Math.round(newHealth * 10) / 10,
    status,
  };
}

// ============================================================================
// INSIGHT GENERATION
// ============================================================================

function generateInsights(): GridAIInsight[] {
  const insights: GridAIInsight[] = [];
  const now = simulationState.simulatedTime;

  // Critical DGA trending
  const criticalDGA = assetSnapshots.filter(a => a.tdcg > 1500);
  if (criticalDGA.length > 0) {
    insights.push({
      id: `insight-dga-${Date.now()}`,
      type: 'alert',
      severity: criticalDGA.some(a => a.tdcg > 2000) ? 'critical' : 'warning',
      title: 'DGA Gas Trending Detected',
      description: `${criticalDGA.length} transformer(s) showing elevated dissolved gas levels. ${criticalDGA[0].name} TDCG at ${criticalDGA[0].tdcg} ppm exceeds IEEE C57.104 Condition 3 threshold.`,
      affectedAssets: criticalDGA.map(a => a.name),
      suggestedActions: [
        'Increase DGA sampling frequency to weekly for affected units',
        'Schedule oil reconditioning for transformers above 1500 ppm TDCG',
        'Evaluate de-loading critical units to reduce thermal stress',
      ],
      confidence: 0.92,
      timeframe: 'next 48 hours',
      createdAt: now.toISOString(),
    });
  }

  // Thermal stress
  const thermalStress = assetSnapshots.filter(a => a.hotSpotTemp > 100);
  if (thermalStress.length > 0) {
    insights.push({
      id: `insight-thermal-${Date.now()}`,
      type: 'forecast',
      severity: thermalStress.some(a => a.hotSpotTemp > 110) ? 'critical' : 'warning',
      title: 'Thermal Stress Advisory',
      description: `${thermalStress.length} unit(s) operating above 100°C hot spot temperature. Sustained operation reduces insulation life per IEEE C57.91 loading guide.`,
      affectedAssets: thermalStress.map(a => a.name),
      suggestedActions: [
        'Verify cooling system operation (fans, pumps, radiators)',
        'Evaluate load transfer to reduce loading on stressed units',
        'Check ambient temperature forecast — additional de-loading may be needed',
      ],
      confidence: 0.88,
      timeframe: 'next 4 hours',
      createdAt: now.toISOString(),
    });
  }

  // Weather impact
  if (currentWeather && currentWeather.severity !== 'normal') {
    const impactedCount = assetSnapshots.filter(a => a.loadPercent > 85).length;
    insights.push({
      id: `insight-weather-${Date.now()}`,
      type: 'forecast',
      severity: currentWeather.severity === 'severe' ? 'critical' : 'warning',
      title: `Weather Impact: ${currentWeather.condition.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
      description: `${currentWeather.zone} experiencing ${currentWeather.condition.replace('_', ' ')}. ${currentWeather.temperature}°F, ${currentWeather.windSpeed} mph winds. ${impactedCount} assets above 85% loading.`,
      affectedAssets: assetSnapshots.filter(a => a.loadPercent > 85).map(a => a.name).slice(0, 5),
      suggestedActions: [
        currentWeather.condition === 'thunderstorm'
          ? 'Pre-position line crews for storm response'
          : 'Monitor grid frequency and voltage stability',
        'Review N-1 contingency readiness',
        'Coordinate with PJM for emergency capacity if needed',
      ],
      confidence: 0.82,
      timeframe: 'next 2-6 hours',
      createdAt: now.toISOString(),
    });
  }

  // Maintenance recommendation
  const needsMaint = assetSnapshots.filter(a => a.healthIndex < 50);
  if (needsMaint.length > 0 && Math.random() < 0.3) {
    insights.push({
      id: `insight-maint-${Date.now()}`,
      type: 'recommendation',
      severity: 'info',
      title: 'Proactive Maintenance Window Available',
      description: `${needsMaint.length} transformers below 50% health index. Overnight low-load period (midnight–5 AM) offers optimal maintenance window with reduced customer impact.`,
      affectedAssets: needsMaint.map(a => a.name).slice(0, 4),
      suggestedActions: [
        'Schedule DGA oil sampling during next low-load period',
        'Prioritize units with TDCG > 1000 ppm for oil reconditioning',
        'Prepare spare transformer/mobile sub deployment plan',
      ],
      confidence: 0.85,
      timeframe: 'next maintenance window',
      createdAt: now.toISOString(),
    });
  }

  // Overload anomaly
  const overloaded = assetSnapshots.filter(a => a.loadPercent > 100);
  if (overloaded.length > 0) {
    insights.push({
      id: `insight-overload-${Date.now()}`,
      type: 'anomaly',
      severity: 'critical',
      title: 'Emergency Overload Detected',
      description: `${overloaded.length} transformer(s) operating above nameplate rating. ${overloaded[0].name} at ${overloaded[0].loadPercent.toFixed(0)}% of nameplate. Accelerated aging in progress.`,
      affectedAssets: overloaded.map(a => a.name),
      suggestedActions: [
        'Initiate emergency load transfer to adjacent feeders',
        'Engage emergency cooling (all fans and pumps)',
        'Prepare mobile substation for deployment',
      ],
      confidence: 0.95,
      timeframe: 'immediate',
      createdAt: now.toISOString(),
    });
  }

  // Hero scenario-driven insights: surface flagship narratives periodically
  if (insights.length < 2 && Math.random() < 0.6) {
    const scenarioPool = DEMO_SCENARIOS;
    const scenario = scenarioPool[Math.floor(Math.random() * scenarioPool.length)];
    const latestEvent = scenario.timeline[scenario.timeline.length - 1];
    insights.push({
      id: `insight-scenario-${scenario.id}-${Date.now()}`,
      type: 'recommendation',
      severity: scenario.severity === 'critical' ? 'critical' : 'warning',
      title: `📍 ${scenario.title}`,
      description: `${scenario.assetName} (${scenario.opCo}): ${scenario.subtitle}. ${scenario.outcome.costAvoided} in costs avoided, ${scenario.outcome.customersProtected.toLocaleString()} customers protected. View full scenario for timeline and resolution.`,
      affectedAssets: [scenario.assetName],
      suggestedActions: [
        `Review scenario: ${scenario.title}`,
        `Latest event: ${latestEvent.title}`,
        `Navigate to /scenarios for full narrative`,
      ],
      confidence: 0.98,
      timeframe: 'reference scenario',
      createdAt: now.toISOString(),
    });
  }

  return insights.slice(0, 4);
}

// ============================================================================
// PUBLIC API
// ============================================================================

export async function runSimulationTick(): Promise<{
  success: boolean;
  tickNumber: number;
  simulatedSeconds: number;
  assetsUpdated: number;
  insights: GridAIInsight[];
  error?: string;
}> {
  const now = Date.now();
  const realElapsed = (now - simulationState.lastTickTime) / 1000;
  const simulatedSeconds = realElapsed * simulationState.speedMultiplier;
  const simulatedHours = simulatedSeconds / 3600;

  simulationState.lastTickTime = now;
  simulationState.tickCount++;
  simulationState.simulatedTime = new Date(
    simulationState.simulatedTime.getTime() + simulatedSeconds * 1000
  );

  try {
    // Initialize snapshots if empty
    if (assetSnapshots.length === 0) initializeSnapshots();

    // Update weather periodically
    if (simulationState.tickCount % 3 === 0 || !currentWeather) {
      currentWeather = simulateWeather();
    }

    // Update each asset
    assetSnapshots = assetSnapshots.map(snapshot =>
      simulateLoadCycling(snapshot, simulatedHours, currentWeather!)
    );

    // Generate insights periodically
    let newInsights: GridAIInsight[] = [];
    if (now - lastInsightGeneration > INSIGHT_INTERVAL) {
      lastInsightGeneration = now;
      newInsights = generateInsights();
      pendingInsights = [...newInsights, ...pendingInsights].slice(0, 10);
    }

    return {
      success: true,
      tickNumber: simulationState.tickCount,
      simulatedSeconds,
      assetsUpdated: assetSnapshots.length,
      insights: newInsights,
    };
  } catch (error) {
    return {
      success: false,
      tickNumber: simulationState.tickCount,
      simulatedSeconds,
      assetsUpdated: 0,
      insights: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function getSimulationState(): GridSimulationState {
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
  if (assetSnapshots.length === 0) initializeSnapshots();
}

export function stopSimulation(): void {
  simulationState.isRunning = false;
}

export function getPendingInsights(): GridAIInsight[] {
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
  assetSnapshots = [];
  currentWeather = null;
  lastInsightGeneration = 0;
}

export function getAssetSnapshots(): AssetSnapshot[] {
  return assetSnapshots;
}

export function getGridWeather(): GridWeather | null {
  return currentWeather;
}

