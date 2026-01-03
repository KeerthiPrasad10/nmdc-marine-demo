/**
 * Enhanced Real-time simulation engine with PdM correlations
 * Updates Supabase in real-time to trigger UI updates
 * 
 * Key correlations modeled:
 * - Fouling ↑ → fuel ↑
 * - Lube-oil metals ↑ → risk ↑
 * - Rope health ↓ → triggers ROPE_ALERT
 * - Pipeline DAS_EVENT → raises leak risk
 * - RSSI/latency variations across operational modes
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// UAE/Persian Gulf operating area with weather zones
const UAE_WATERS = {
  center: { lat: 24.5, lng: 54.5 },
  bounds: {
    minLat: 23.5,
    maxLat: 26.5,
    minLng: 51.5,
    maxLng: 56.5,
  },
};

// Weather zones with different characteristics
interface WeatherZone {
  name: string;
  center: { lat: number; lng: number };
  radius: number;
  baseConditions: {
    windSpeed: [number, number];
    waveHeight: [number, number];
    visibility: [number, number];
    temperature: [number, number];
  };
}

const WEATHER_ZONES: WeatherZone[] = [
  {
    name: 'Abu Dhabi Coastal',
    center: { lat: 24.5, lng: 54.4 },
    radius: 0.5,
    baseConditions: {
      windSpeed: [8, 18],
      waveHeight: [0.5, 1.5],
      visibility: [8, 15],
      temperature: [30, 38],
    },
  },
  {
    name: 'Dubai Maritime',
    center: { lat: 25.2, lng: 55.3 },
    radius: 0.4,
    baseConditions: {
      windSpeed: [10, 22],
      waveHeight: [0.8, 2.0],
      visibility: [6, 12],
      temperature: [28, 36],
    },
  },
  {
    name: 'Fujairah Open Sea',
    center: { lat: 25.1, lng: 56.3 },
    radius: 0.6,
    baseConditions: {
      windSpeed: [12, 28],
      waveHeight: [1.0, 3.0],
      visibility: [5, 10],
      temperature: [26, 34],
    },
  },
  {
    name: 'Das Island Offshore',
    center: { lat: 25.1, lng: 52.9 },
    radius: 0.5,
    baseConditions: {
      windSpeed: [15, 30],
      waveHeight: [1.5, 3.5],
      visibility: [4, 8],
      temperature: [28, 35],
    },
  },
  {
    name: 'Ruwais Industrial',
    center: { lat: 24.1, lng: 52.7 },
    radius: 0.4,
    baseConditions: {
      windSpeed: [10, 20],
      waveHeight: [0.6, 1.8],
      visibility: [6, 12],
      temperature: [32, 42],
    },
  },
];

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
}

function getWeatherZone(lat: number, lng: number): WeatherZone {
  let closestZone = WEATHER_ZONES[0];
  let closestDistance = Infinity;
  
  for (const zone of WEATHER_ZONES) {
    const distance = getDistance(lat, lng, zone.center.lat, zone.center.lng);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestZone = zone;
    }
  }
  
  return closestZone;
}

// Generate weather for a specific location
function generateLocationWeather(lat: number, lng: number): {
  condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog';
  severity: 'normal' | 'advisory' | 'warning' | 'severe';
  wind_speed: number;
  wind_direction: number;
  wave_height: number;
  visibility: number;
  temperature: number;
} {
  const zone = getWeatherZone(lat, lng);
  const base = zone.baseConditions;
  
  const timeOfDay = new Date().getHours();
  const isNight = timeOfDay < 6 || timeOfDay > 18;
  
  let windSpeed = randomInRange(base.windSpeed[0], base.windSpeed[1]);
  let waveHeight = randomInRange(base.waveHeight[0], base.waveHeight[1]);
  let visibility = randomInRange(base.visibility[0], base.visibility[1]);
  let temperature = randomInRange(base.temperature[0], base.temperature[1]);
  
  if (isNight) {
    temperature -= 5;
    windSpeed *= 0.8;
  }
  
  let condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog' = 'clear';
  let severity: 'normal' | 'advisory' | 'warning' | 'severe' = 'normal';
  
  const eventRoll = Math.random();
  if (eventRoll < 0.02) {
    condition = 'storm';
    severity = 'severe';
    windSpeed = randomInRange(35, 50);
    waveHeight = randomInRange(3.5, 6);
    visibility = randomInRange(1, 3);
  } else if (eventRoll < 0.05) {
    condition = 'rain';
    severity = 'warning';
    windSpeed = randomInRange(20, 30);
    waveHeight = randomInRange(2, 3.5);
    visibility = randomInRange(3, 6);
  } else if (eventRoll < 0.08) {
    if (timeOfDay >= 4 && timeOfDay <= 8) {
      condition = 'fog';
      severity = 'advisory';
      visibility = randomInRange(0.5, 2);
    }
  } else if (eventRoll < 0.15) {
    condition = 'cloudy';
  }
  
  if (severity === 'normal') {
    if (windSpeed > 25 || waveHeight > 2.5) {
      severity = 'warning';
    } else if (windSpeed > 15 || waveHeight > 1.5 || visibility < 5) {
      severity = 'advisory';
    }
  }
  
  return {
    condition,
    severity,
    wind_speed: Math.round(windSpeed * 10) / 10,
    wind_direction: Math.round(randomInRange(0, 360)),
    wave_height: Math.round(waveHeight * 10) / 10,
    visibility: Math.round(visibility * 10) / 10,
    temperature: Math.round(temperature),
  };
}

// Calculate PdM correlations for a vessel
function calculatePdMSignals(vessel: {
  hull_fouling_idx: number;
  lube_oil_ferro_ppm: number;
  rope_health_score: number;
  thruster_vibration_mm_s: number;
  engine_load_pct: number;
  fuel_rate_tph: number;
  op_mode: string;
}) {
  // Hull fouling increases fuel consumption (up to 30% for heavy fouling)
  const foulingFuelImpact = 1 + (vessel.hull_fouling_idx / 10) * 0.3;
  const adjustedFuelRate = vessel.fuel_rate_tph * foulingFuelImpact;
  
  // Lube oil iron content increases failure risk
  const lubeOilRiskFactor = Math.min(100, vessel.lube_oil_ferro_ppm / 80 * 100);
  
  // Vibration increases with load and wear
  const vibrationIncrease = vessel.engine_load_pct > 70 ? randomInRange(0, 0.5) : 0;
  const newVibration = vessel.thruster_vibration_mm_s + vibrationIncrease;
  
  // AI anomaly score based on multiple signals
  const anomalyFactors = [
    vessel.hull_fouling_idx / 10,
    lubeOilRiskFactor / 100,
    (100 - vessel.rope_health_score) / 100,
    newVibration / 10,
  ];
  const aiAnomalyScore = 0.3 + (anomalyFactors.reduce((a, b) => a + b, 0) / anomalyFactors.length) * 0.4;
  
  // Predicted failure risk
  const failureRisk = Math.min(100, lubeOilRiskFactor * 0.4 + (newVibration / 10) * 30 + (vessel.hull_fouling_idx / 10) * 20);
  
  // Safety state
  let safetyState: 'GREEN' | 'AMBER' | 'RED' = 'GREEN';
  if (failureRisk > 50 || vessel.rope_health_score < 60) {
    safetyState = 'RED';
  } else if (failureRisk > 25 || vessel.rope_health_score < 80) {
    safetyState = 'AMBER';
  }
  
  // Detect events
  let event: string | null = null;
  if (vessel.rope_health_score < 70 && Math.random() < 0.1) {
    event = 'ROPE_ALERT';
  } else if (newVibration > 7 && Math.random() < 0.1) {
    event = 'HIGH_VIBRATION';
  } else if (vessel.lube_oil_ferro_ppm > 60 && Math.random() < 0.1) {
    event = 'LUBE_OIL_CONTAMINATION';
  }
  
  return {
    adjustedFuelRate: Math.round(adjustedFuelRate * 1000) / 1000,
    newVibration: Math.round(newVibration * 10) / 10,
    aiAnomalyScore: Math.round(aiAnomalyScore * 100) / 100,
    failureRisk: Math.round(failureRisk),
    safetyState,
    event,
  };
}

// Calculate connectivity based on operational mode and location
function calculateConnectivity(opMode: string, lat: number, lng: number) {
  // Base connectivity varies by mode
  let baseRssi = -45;
  let baseLatency = 100;
  
  switch (opMode) {
    case 'TRANSIT':
      baseRssi = -55;
      baseLatency = 150;
      break;
    case 'WORK':
      baseRssi = -50;
      baseLatency = 120;
      break;
    case 'IDLE':
    case 'STANDBY':
      baseRssi = -40;
      baseLatency = 80;
      break;
    case 'MAINT':
      baseRssi = -35;
      baseLatency = 60;
      break;
  }
  
  // Distance from shore affects connectivity
  const distanceFromShore = getDistance(lat, lng, 24.45, 54.38);
  const distanceImpact = distanceFromShore * 5;
  
  return {
    rssi: Math.round(baseRssi - distanceImpact - randomInRange(0, 10)),
    latency: Math.round(baseLatency + distanceImpact * 20 + randomInRange(0, 50)),
  };
}

// Update vessel position and simulate movement
async function updateVesselPosition(vessel: {
  id: string;
  position_lat: number;
  position_lng: number;
  heading: number;
  speed: number;
  status: string;
  fuel_level: number;
  fuel_consumption: number;
  op_mode: string;
  hull_fouling_idx: number;
  lube_oil_ferro_ppm: number;
  rope_health_score: number;
  thruster_vibration_mm_s: number;
  engine_load_pct: number;
  fuel_rate_tph: number;
}): Promise<Record<string, unknown>> {
  // Calculate real elapsed time since last tick and apply speed multiplier
  const currentTime = Date.now();
  const realElapsed = (currentTime - lastTickTime) / 1000; // Real seconds elapsed
  const deltaTimeSeconds = Math.min(realElapsed * simulationSpeedMultiplier, 3600); // Cap at 1 hour per tick for stability
  
  // Calculate new position if moving
  let newLat = vessel.position_lat;
  let newLng = vessel.position_lng;
  let newHeading = vessel.heading;
  
  if (vessel.status === 'operational' && vessel.speed > 0) {
    const speedDegPerSec = (vessel.speed * 1.852) / 111000;
    const distance = speedDegPerSec * deltaTimeSeconds;
    
    newHeading = (vessel.heading + randomInRange(-3, 3) + 360) % 360;
    const radians = newHeading * Math.PI / 180;
    newLat = vessel.position_lat + Math.cos(radians) * distance;
    newLng = vessel.position_lng + Math.sin(radians) * distance;
    
    // Keep within bounds
    newLat = Math.max(UAE_WATERS.bounds.minLat, Math.min(UAE_WATERS.bounds.maxLat, newLat));
    newLng = Math.max(UAE_WATERS.bounds.minLng, Math.min(UAE_WATERS.bounds.maxLng, newLng));
    
    // Bounce off boundaries
    if (newLat === UAE_WATERS.bounds.minLat || newLat === UAE_WATERS.bounds.maxLat) {
      newHeading = (360 - newHeading) % 360;
    }
    if (newLng === UAE_WATERS.bounds.minLng || newLng === UAE_WATERS.bounds.maxLng) {
      newHeading = (180 - newHeading + 360) % 360;
    }
  }
  
  // Get weather at new location
  const weather = generateLocationWeather(newLat, newLng);
  
  // Calculate PdM signals with correlations
  const pdm = calculatePdMSignals(vessel);
  
  // Calculate connectivity
  const connectivity = calculateConnectivity(vessel.op_mode, newLat, newLng);
  
  // Gradual degradation of health signals - scale by simulated time
  // Base rates are per 5 seconds of real-time, scale by deltaTime
  const degradationScale = deltaTimeSeconds / 5;
  const newHullFouling = Math.min(10, vessel.hull_fouling_idx + randomInRange(0, 0.01 * degradationScale));
  const newLubeOilFerro = Math.min(100, vessel.lube_oil_ferro_ppm + randomInRange(0, 0.5 * degradationScale));
  const newRopeHealth = Math.max(50, vessel.rope_health_score - randomInRange(0, 0.1 * degradationScale));
  
  // Update fuel level - realistic consumption scaled for visibility
  // adjustedFuelRate is in tons per hour (tph), typically 0.3-2.0 tph
  // vessel.fuel_level is percentage (0-100)
  // 
  // For demo visibility: fuel drains at a rate where you can see changes,
  // but vessels don't empty instantly. Target: lose ~0.5% per simulated hour.
  // At 60x speed, that's about 0.5% per minute of real time.
  // A full tank lasts ~200 simulated hours (~3+ hours at 60x)
  //
  const hoursElapsed = deltaTimeSeconds / 3600;
  // Base consumption: 0.5% per hour, modified by fuel rate
  // Normalize fuel_rate_tph (typically 0.3-2.0) to a multiplier (0.5-2.0)
  const consumptionMultiplier = 0.5 + (pdm.adjustedFuelRate / 2);
  const fuelPercentUsed = 0.5 * consumptionMultiplier * hoursElapsed;
  
  // If fuel is very low, simulate refueling (return to port behavior)
  let newFuelLevel = vessel.fuel_level - fuelPercentUsed;
  if (newFuelLevel < 15 && Math.random() < 0.3) {
    // 30% chance to "refuel" when low - simulates returning to port
    newFuelLevel = randomInRange(70, 95);
  } else if (newFuelLevel <= 0) {
    // If completely empty, always refuel on next tick
    newFuelLevel = randomInRange(60, 90);
  }
  newFuelLevel = Math.max(0, newFuelLevel);
  
  // Update operational mode based on speed and status
  let newOpMode = vessel.op_mode;
  if (vessel.status === 'operational') {
    if (vessel.speed > 2) {
      newOpMode = 'TRANSIT';
    } else if (vessel.speed > 0) {
      newOpMode = 'WORK';
    } else {
      newOpMode = 'IDLE';
    }
  } else if (vessel.status === 'maintenance') {
    newOpMode = 'MAINT';
  }
  
  return {
    position_lat: Math.round(newLat * 10000) / 10000,
    position_lng: Math.round(newLng * 10000) / 10000,
    heading: Math.round(newHeading),
    fuel_level: Math.round(newFuelLevel * 10) / 10,
    op_mode: newOpMode,
    wave_height_m: weather.wave_height,
    wind_speed_kn: weather.wind_speed,
    ambient_temp_c: weather.temperature,
    hull_fouling_idx: Math.round(newHullFouling * 100) / 100,
    lube_oil_ferro_ppm: Math.round(newLubeOilFerro),
    rope_health_score: Math.round(newRopeHealth),
    thruster_vibration_mm_s: pdm.newVibration,
    fuel_rate_tph: pdm.adjustedFuelRate,
    emission_co2_tph: Math.round(pdm.adjustedFuelRate * 3.114 * 100) / 100,
    connect_rssi_dbm: connectivity.rssi,
    sat_latency_ms: connectivity.latency,
    ai_anomaly_score: pdm.aiAnomalyScore,
    predicted_failure_risk_pct: pdm.failureRisk,
    safety_state: pdm.safetyState,
    updated_at: new Date().toISOString(),
  };
}

// Update offshore assets (pipelines, compressors)
async function updateOffshoreAssets(): Promise<number> {
  const { data: assets, error } = await supabase
    .from('offshore_assets')
    .select('*');
  
  if (error || !assets) return 0;
  
  let updated = 0;
  
  for (const asset of assets) {
    const updates: Record<string, unknown> = {};
    
    // Weather at location
    const weather = generateLocationWeather(asset.position_lat, asset.position_lng);
    updates.wave_height_m = weather.wave_height;
    updates.wind_speed_kn = weather.wind_speed;
    updates.ambient_temp_c = weather.temperature;
    
    // Connectivity
    const connectivity = calculateConnectivity(asset.op_mode, asset.position_lat, asset.position_lng);
    updates.connect_rssi_dbm = connectivity.rssi;
    updates.sat_latency_ms = connectivity.latency;
    
    if (asset.asset_subtype === 'Subsea Pipeline') {
      // Pipeline-specific updates
      // Slight pressure variations
      if (asset.pipe_pressure_bar) {
        updates.pipe_pressure_bar = Math.round((asset.pipe_pressure_bar + randomInRange(-2, 2)) * 10) / 10;
      }
      // Temperature variations
      if (asset.pipe_temp_c) {
        updates.pipe_temp_c = Math.round((asset.pipe_temp_c + randomInRange(-1, 1)) * 10) / 10;
      }
      // Flow variations (only if online)
      if (asset.op_mode === 'ONLINE' && asset.pipe_flow_kbd) {
        updates.pipe_flow_kbd = Math.round((asset.pipe_flow_kbd + randomInRange(-10, 10)) * 10) / 10;
      }
      
      // DAS event detection (rare)
      if (Math.random() < 0.005) {
        updates.das_event_flag = true;
        updates.leak_risk_pct = Math.min(100, (asset.leak_risk_pct || 0) + 15);
        updates.safety_state = 'AMBER';
      } else if (asset.das_event_flag && Math.random() < 0.3) {
        // Clear event
        updates.das_event_flag = false;
        updates.leak_risk_pct = Math.max(0, (asset.leak_risk_pct || 0) - 5);
        if ((asset.leak_risk_pct || 0) < 20) {
          updates.safety_state = 'GREEN';
        }
      }
    } else if (asset.asset_subtype === 'Platform Compressor') {
      // Compressor-specific updates
      if (asset.op_mode === 'ONLINE') {
        // Vibration variations
        updates.machine_vibration_mm_s = Math.round((asset.machine_vibration_mm_s + randomInRange(-0.3, 0.3)) * 10) / 10;
        updates.machine_vibration_mm_s = Math.max(2, Math.min(12, updates.machine_vibration_mm_s as number));
        
        // Load variations
        updates.compressor_load_pct = Math.round(asset.compressor_load_pct + randomInRange(-3, 3));
        updates.compressor_load_pct = Math.max(40, Math.min(95, updates.compressor_load_pct as number));
        
        // Pressure based on load
        if (asset.discharge_pressure_bar) {
          const loadFactor = (updates.compressor_load_pct as number) / 80;
          updates.discharge_pressure_bar = Math.round(asset.discharge_pressure_bar * loadFactor);
        }
        
        // Health degrades with high vibration
        if ((updates.machine_vibration_mm_s as number) > 6) {
          updates.health_score = Math.max(50, (asset.health_score || 100) - randomInRange(0, 0.5));
          updates.ai_anomaly_score = Math.min(0.9, (asset.ai_anomaly_score || 0.5) + 0.02);
        }
        
        // Safety state
        if ((updates.machine_vibration_mm_s as number) > 8 || (asset.health_score || 100) < 60) {
          updates.safety_state = 'RED';
          updates.predicted_failure_risk_pct = Math.min(100, (asset.predicted_failure_risk_pct || 0) + 5);
        } else if ((updates.machine_vibration_mm_s as number) > 6 || (asset.health_score || 100) < 80) {
          updates.safety_state = 'AMBER';
        }
      }
    }
    
    updates.updated_at = new Date().toISOString();
    
    await supabase
      .from('offshore_assets')
      .update(updates)
      .eq('id', asset.id);
    
    updated++;
  }
  
  return updated;
}

// Record time-series data point
async function recordTimeSeries(vesselId: string, vessel: Record<string, unknown>): Promise<void> {
  // Only record every ~30 seconds to avoid flooding the database
  if (Math.random() > 0.15) return;
  
  await supabase.from('asset_timeseries').insert({
    vessel_id: vesselId,
    asset_name: vessel.name as string,
    asset_type: 'Vessel',
    asset_subtype: vessel.asset_subtype as string,
    lat: vessel.position_lat as number,
    lng: vessel.position_lng as number,
    speed_kn: vessel.speed as number,
    heading_deg: vessel.heading as number,
    op_mode: vessel.op_mode as string,
    dp_mode: vessel.dp_mode as boolean,
    engine_load_pct: vessel.engine_load_pct as number,
    fuel_type: vessel.fuel_type as string,
    fuel_rate_tph: vessel.fuel_rate_tph as number,
    emission_co2_tph: vessel.emission_co2_tph as number,
    hull_fouling_idx: vessel.hull_fouling_idx as number,
    thruster_vibration_mm_s: vessel.thruster_vibration_mm_s as number,
    rope_health_score: vessel.rope_health_score as number,
    lube_oil_visc_cst_40c: vessel.lube_oil_visc_cst_40c as number,
    lube_oil_ferro_ppm: vessel.lube_oil_ferro_ppm as number,
    wave_height_m: vessel.wave_height_m as number,
    wind_speed_kn: vessel.wind_speed_kn as number,
    ambient_temp_c: vessel.ambient_temp_c as number,
    connect_rssi_dbm: vessel.connect_rssi_dbm as number,
    sat_latency_ms: vessel.sat_latency_ms as number,
    ai_anomaly_score: vessel.ai_anomaly_score as number,
    predicted_failure_risk_pct: vessel.predicted_failure_risk_pct as number,
    safety_state: vessel.safety_state as string,
  });
}

// Main simulation tick
export async function runSimulationTick(): Promise<{
  vesselsUpdated: number;
  offshoreAssetsUpdated: number;
  weatherUpdated: boolean;
  simulationSpeed: number;
  simulatedTimeElapsed: number;
  error?: string;
}> {
  try {
    // Calculate simulated time
    const currentTime = Date.now();
    const realElapsed = (currentTime - lastTickTime) / 1000;
    const simulatedElapsed = realElapsed * simulationSpeedMultiplier;
    
    // Fetch all vessels with new fields
    const { data: vessels, error: fetchError } = await supabase
      .from('vessels')
      .select('*');
    
    if (fetchError) {
      throw new Error(`Failed to fetch vessels: ${fetchError.message}`);
    }
    
    if (!vessels || vessels.length === 0) {
      lastTickTime = currentTime;
      return { vesselsUpdated: 0, offshoreAssetsUpdated: 0, weatherUpdated: false, simulationSpeed: simulationSpeedMultiplier, simulatedTimeElapsed: 0 };
    }
    
    // Update each vessel
    for (const vessel of vessels) {
      const updates = await updateVesselPosition(vessel);
      
      await supabase
        .from('vessels')
        .update(updates)
        .eq('id', vessel.id);
      
      // Record time-series data
      await recordTimeSeries(vessel.id, { ...vessel, ...updates });
    }
    
    // Update offshore assets
    const offshoreUpdated = await updateOffshoreAssets();
    
    // Calculate fleet center for weather
    const avgLat = vessels.reduce((sum, v) => sum + v.position_lat, 0) / vessels.length;
    const avgLng = vessels.reduce((sum, v) => sum + v.position_lng, 0) / vessels.length;
    
    // Update weather
    const weather = generateLocationWeather(avgLat, avgLng);
    const { error: weatherError } = await supabase
      .from('weather')
      .update({
        ...weather,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (await supabase.from('weather').select('id').limit(1).single()).data?.id);
    
    // Update lastTickTime for next calculation
    lastTickTime = currentTime;
    
    return {
      vesselsUpdated: vessels.length,
      offshoreAssetsUpdated: offshoreUpdated,
      weatherUpdated: !weatherError,
      simulationSpeed: simulationSpeedMultiplier,
      simulatedTimeElapsed: simulatedElapsed,
    };
  } catch (error) {
    console.error('Simulation tick error:', error);
    lastTickTime = Date.now();
    return {
      vesselsUpdated: 0,
      offshoreAssetsUpdated: 0,
      weatherUpdated: false,
      simulationSpeed: simulationSpeedMultiplier,
      simulatedTimeElapsed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Simulation control
let simulationInterval: NodeJS.Timeout | null = null;
let simulationSpeedMultiplier: number = 60; // Default to 60x (1 min/sec) for visible changes
let lastTickTime: number = Date.now();

export function setSimulationSpeed(speed: number): void {
  simulationSpeedMultiplier = Math.max(1, Math.min(3600, speed)); // Clamp between 1x and 3600x (1 hour/sec max)
  // Reset lastTickTime to prevent large jumps when changing speed
  lastTickTime = Date.now();
  console.log(`Simulation speed set to ${simulationSpeedMultiplier}x`);
}

export function getSimulationSpeed(): number {
  return simulationSpeedMultiplier;
}

export function startSimulation(intervalMs: number = 5000): void {
  if (simulationInterval) {
    console.log('Simulation already running');
    return;
  }
  
  lastTickTime = Date.now();
  console.log(`Starting enhanced real-time simulation (interval: ${intervalMs}ms, speed: ${simulationSpeedMultiplier}x)`);
  simulationInterval = setInterval(async () => {
    const result = await runSimulationTick();
    console.log(`Simulation tick: ${result.vesselsUpdated} vessels, ${result.offshoreAssetsUpdated} offshore assets updated`);
  }, intervalMs);
}

export function stopSimulation(): void {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('Simulation stopped');
  }
}

export function isSimulationRunning(): boolean {
  return simulationInterval !== null;
}
