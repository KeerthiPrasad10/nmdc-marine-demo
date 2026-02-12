// Mock data for Transformer IoT Dashboard

import {
  TransformerAsset,
  TransformerSensor,
  TransformerMetrics,
  ThermalProfile,
  DGAReading,
  LoadEvent,
  AlarmEvent,
} from './types';
import { TRANSFORMER_HEALTH_DATA } from '@/lib/datasets/transformer-health';
import { EXELON_ASSETS } from '@/lib/exelon/fleet';

// Use BGE-TF-001 as the default monitored transformer (most interesting data — trending critical)
const DEFAULT_ASSET_TAG = 'BGE-TF-001';

function getLatestHealthRecord(assetTag: string) {
  const records = TRANSFORMER_HEALTH_DATA.filter(r => r.assetTag === assetTag);
  return records.length > 0 ? records[records.length - 1] : null;
}

function getFleetAsset(assetTag: string) {
  return EXELON_ASSETS.find(a => a.assetTag === assetTag);
}

// Generate realistic transformer sensor data from Kaggle dataset
export function generateSensorData(assetTag: string = DEFAULT_ASSET_TAG): TransformerSensor[] {
  const now = new Date();
  const record = getLatestHealthRecord(assetTag);
  if (!record) return [];

  return [
    {
      id: 'sensor-topoil',
      name: 'Top Oil Temperature',
      type: 'thermal',
      unit: '°C',
      value: record.topOilTemp + (Math.random() - 0.5) * 2,
      minValue: 0,
      maxValue: 120,
      normalRange: { min: 40, max: 85 },
      status: record.topOilTemp > 85 ? 'critical' : record.topOilTemp > 75 ? 'warning' : 'normal',
      lastUpdated: now,
    },
    {
      id: 'sensor-hotspot',
      name: 'Winding Hot Spot',
      type: 'thermal',
      unit: '°C',
      value: record.windingHotSpot + (Math.random() - 0.5) * 3,
      minValue: 0,
      maxValue: 140,
      normalRange: { min: 50, max: 105 },
      status: record.windingHotSpot > 110 ? 'critical' : record.windingHotSpot > 95 ? 'warning' : 'normal',
      lastUpdated: now,
    },
    {
      id: 'sensor-load',
      name: 'Load (MVA)',
      type: 'load',
      unit: 'MVA',
      value: +(record.loadPercent * 2).toFixed(1), // Assume 200MVA nameplate
      minValue: 0,
      maxValue: 240,
      normalRange: { min: 0, max: 200 },
      status: record.loadPercent > 100 ? 'critical' : record.loadPercent > 85 ? 'warning' : 'normal',
      lastUpdated: now,
    },
    {
      id: 'sensor-tdcg',
      name: 'Total Combustible Gas',
      type: 'dga',
      unit: 'ppm',
      value: record.tdcg + Math.floor((Math.random() - 0.3) * 20),
      minValue: 0,
      maxValue: 5000,
      normalRange: { min: 0, max: 720 },
      status: record.tdcg > 1920 ? 'critical' : record.tdcg > 720 ? 'warning' : 'normal',
      lastUpdated: now,
    },
    {
      id: 'sensor-moisture',
      name: 'Oil Moisture',
      type: 'oil',
      unit: 'ppm',
      value: record.moisture + (Math.random() - 0.5) * 2,
      minValue: 0,
      maxValue: 60,
      normalRange: { min: 0, max: 25 },
      status: record.moisture > 35 ? 'critical' : record.moisture > 25 ? 'warning' : 'normal',
      lastUpdated: now,
    },
    {
      id: 'sensor-dielectric',
      name: 'Dielectric Strength',
      type: 'oil',
      unit: 'kV',
      value: record.dielectricStrength + (Math.random() - 0.5),
      minValue: 0,
      maxValue: 70,
      normalRange: { min: 35, max: 70 },
      status: record.dielectricStrength < 28 ? 'critical' : record.dielectricStrength < 35 ? 'warning' : 'normal',
      lastUpdated: now,
    },
  ];
}

// DGA interpretation using Duval Triangle simplified
function interpretDGA(h2: number, c2h2: number, c2h4: number, ch4: number): { interpretation: string; faultType: DGAReading['faultType'] } {
  if (c2h2 > 100) return { interpretation: 'High-energy arcing — immediate investigation required', faultType: 'arcing' };
  if (c2h2 > 20) return { interpretation: 'Low-energy arcing / discharge', faultType: 'electrical_low' };
  if (c2h4 > 200 && ch4 > 100) return { interpretation: 'Thermal fault > 700°C (Duval D1)', faultType: 'thermal_high' };
  if (c2h4 > 100) return { interpretation: 'Thermal fault 300–700°C (Duval T2)', faultType: 'thermal_low' };
  if (h2 > 300 && c2h2 < 5) return { interpretation: 'Partial discharge in oil or paper', faultType: 'partial_discharge' };
  if (h2 > 150) return { interpretation: 'Corona or low-energy PD', faultType: 'partial_discharge' };
  if (ch4 > 50 || c2h4 > 30) return { interpretation: 'Mild thermal stress — monitor closely', faultType: 'thermal_low' };
  return { interpretation: 'Normal — no significant fault gases detected', faultType: 'normal' };
}

export function generateLatestDGA(assetTag: string = DEFAULT_ASSET_TAG): DGAReading {
  const record = getLatestHealthRecord(assetTag);
  if (!record) {
    return {
      timestamp: new Date(),
      h2: 20, ch4: 10, c2h2: 0, c2h4: 5, c2h6: 3, co: 100, co2: 1500, tdcg: 138,
      ...interpretDGA(20, 0, 5, 10),
    };
  }
  const interp = interpretDGA(record.h2, record.c2h2, record.c2h4, record.ch4);
  return {
    timestamp: new Date(record.timestamp),
    h2: record.h2,
    ch4: record.ch4,
    c2h2: record.c2h2,
    c2h4: record.c2h4,
    c2h6: record.c2h6,
    co: record.co,
    co2: record.co2,
    tdcg: record.tdcg,
    ...interp,
  };
}

export function generateDGAHistory(assetTag: string = DEFAULT_ASSET_TAG): DGAReading[] {
  const records = TRANSFORMER_HEALTH_DATA.filter(r => r.assetTag === assetTag);
  return records.map(r => {
    const interp = interpretDGA(r.h2, r.c2h2, r.c2h4, r.ch4);
    return {
      timestamp: new Date(r.timestamp),
      h2: r.h2, ch4: r.ch4, c2h2: r.c2h2, c2h4: r.c2h4, c2h6: r.c2h6,
      co: r.co, co2: r.co2, tdcg: r.tdcg,
      ...interp,
    };
  });
}

export function generateThermalProfile(assetTag: string = DEFAULT_ASSET_TAG): ThermalProfile {
  const record = getLatestHealthRecord(assetTag);
  const load = record ? record.loadPercent / 100 : 0.65;
  const topOil = record ? record.topOilTemp : 65;
  const hotSpot = record ? record.windingHotSpot : 85;
  const ambient = record ? record.ambientTemp : 15;

  return {
    topOilTemp: topOil,
    bottomOilTemp: topOil - 12 - Math.random() * 3,
    windingHotSpot: hotSpot,
    ambientTemp: ambient,
    loadFactor: load,
    coolingMode: load > 0.8 ? 'ONAF' : 'ONAN',
    fansRunning: load > 0.8 ? 4 : load > 0.6 ? 2 : 0,
    pumpsRunning: load > 0.9 ? 2 : load > 0.7 ? 1 : 0,
  };
}

export function generateMetrics(assetTag: string = DEFAULT_ASSET_TAG): TransformerMetrics {
  const record = getLatestHealthRecord(assetTag);
  if (!record) {
    return {
      loadFactor: 65, peakLoadToday: 140, avgLoadToday: 120,
      nameplateRating: 200, topOilTemp: 65, hotSpotTemp: 85,
      oilLevel: 95, moisture: 15, tdcg: 300, healthIndex: 75,
      dgaScore: 80, operatingHours: 150000, lastDGASample: new Date(),
      tapPosition: 5,
    };
  }
  return {
    loadFactor: record.loadPercent,
    peakLoadToday: +(record.loadPercent * 2.2).toFixed(1),
    avgLoadToday: +(record.loadPercent * 1.8).toFixed(1),
    nameplateRating: 200,
    topOilTemp: record.topOilTemp,
    hotSpotTemp: record.windingHotSpot,
    oilLevel: Math.max(88, 100 - record.moisture * 0.3),
    moisture: record.moisture,
    tdcg: record.tdcg,
    healthIndex: record.healthIndex,
    dgaScore: Math.max(0, 100 - (record.tdcg / 50)),
    operatingHours: (new Date().getFullYear() - 1974) * 8760 * 0.85,
    lastDGASample: new Date(record.timestamp),
    tapPosition: 3 + Math.floor(Math.random() * 5),
  };
}

export function generateTransformerAsset(assetTag: string = DEFAULT_ASSET_TAG): TransformerAsset {
  const asset = getFleetAsset(assetTag);
  const record = getLatestHealthRecord(assetTag);

  return {
    id: assetTag,
    name: asset?.name || 'Unknown Transformer',
    manufacturer: 'Westinghouse / ABB',
    rating: asset?.ratedMVA ? `${asset.voltageClassKV}kV, ${asset.ratedMVA}MVA` : '230/115kV, 200MVA',
    yearInstalled: asset?.yearInstalled || 1974,
    location: asset?.substationName || 'Unknown',
    opCo: asset?.opCo || 'BGE',
    assetTag,
    status: record && record.healthIndex < 30 ? 'faulted' : 'energized',
    sensors: generateSensorData(assetTag),
    metrics: generateMetrics(assetTag),
    thermal: generateThermalProfile(assetTag),
    latestDGA: generateLatestDGA(assetTag),
    lastMaintenance: new Date(Date.now() - 90 * 24 * 60 * 60000),
    nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60000),
  };
}

// Load events — simulate switching, peak loads, fault clearing
const LOAD_EVENT_DESCRIPTIONS = [
  'Normal load cycle — morning ramp-up',
  'Peak demand — HVAC load surge',
  'Switching operation — tie breaker closed',
  'Fault clearing — downstream breaker trip',
  'Load transfer from adjacent feeder',
  'Capacitor bank switching',
  'Thunderstorm-driven load swing',
  'Cold weather morning peak',
];

const LOAD_WARNINGS = [
  'Top oil temperature exceeded 80°C limit',
  'Hot spot temperature approaching thermal limit',
  'TDCG rate of rise > 30 ppm/day — investigate',
  'Load exceeding nameplate rating — emergency overload',
  'Oil level low — check for leak',
  'Cooling fans failed to start on Stage 2 command',
  'Bushing capacitance deviation > 5% from baseline',
  'Tap changer contact resistance elevated',
];

export function generateRecentLoadEvents(count: number = 10, assetTag: string = DEFAULT_ASSET_TAG): LoadEvent[] {
  const events: LoadEvent[] = [];
  const now = new Date();
  const record = getLatestHealthRecord(assetTag);
  const baseLoad = record ? record.loadPercent : 70;

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - (i + 1) * 15 * 60000);
    const duration = 300 + Math.floor(Math.random() * 600);
    const isPeak = Math.random() > 0.7;
    const isFault = Math.random() > 0.9;
    const loadPercent = isPeak ? baseLoad + 15 + Math.random() * 15 : baseLoad - 10 + Math.random() * 20;
    const loadMVA = +(loadPercent * 2).toFixed(1); // 200 MVA nameplate

    const hasWarnings = loadPercent > 85 || isFault || Math.random() > 0.7;
    const warningCount = hasWarnings ? 1 + Math.floor(Math.random() * 2) : 0;
    const warnings: string[] = [];

    if (hasWarnings) {
      const used = new Set<number>();
      for (let w = 0; w < warningCount; w++) {
        let idx = Math.floor(Math.random() * LOAD_WARNINGS.length);
        while (used.has(idx)) idx = Math.floor(Math.random() * LOAD_WARNINGS.length);
        used.add(idx);
        warnings.push(LOAD_WARNINGS[idx]);
      }
    }

    events.push({
      id: `load-${Date.now()}-${i}`,
      timestamp,
      endTime: new Date(timestamp.getTime() + duration * 1000),
      duration,
      loadMVA,
      loadPercent: +loadPercent.toFixed(1),
      eventType: isFault ? 'fault_clearing' : isPeak ? 'peak' : 'normal',
      topOilTemp: (record?.topOilTemp || 70) + (isPeak ? 5 : 0) + (Math.random() - 0.5) * 3,
      hotSpotTemp: (record?.windingHotSpot || 90) + (isPeak ? 8 : 0) + (Math.random() - 0.5) * 4,
      description: LOAD_EVENT_DESCRIPTIONS[Math.floor(Math.random() * LOAD_EVENT_DESCRIPTIONS.length)],
      dgaChange: Math.random() > 0.5 ? {
        gasName: ['H₂', 'CH₄', 'C₂H₂', 'C₂H₄', 'CO'][Math.floor(Math.random() * 5)],
        before: 200 + Math.floor(Math.random() * 300),
        after: 220 + Math.floor(Math.random() * 350),
        changePercent: +(2 + Math.random() * 12).toFixed(1),
      } : undefined,
      warnings,
    });
  }

  return events;
}

export function generateAlarmEvents(loadEvents?: LoadEvent[], assetTag: string = DEFAULT_ASSET_TAG): AlarmEvent[] {
  const now = new Date();
  const record = getLatestHealthRecord(assetTag);
  const alarms: AlarmEvent[] = [];

  // Generate alarms from load events with warnings
  if (loadEvents) {
    loadEvents.forEach((event, idx) => {
      if (event.warnings.length > 0 && idx < 4) {
        event.warnings.forEach((warning, wIdx) => {
          let type: AlarmEvent['type'] = 'thermal_alarm';
          let severity: AlarmEvent['severity'] = 'warning';

          if (warning.includes('TDCG') || warning.includes('gas')) {
            type = 'dga_alarm';
            severity = 'alarm';
          } else if (warning.includes('temperature') || warning.includes('Hot spot') || warning.includes('Top oil')) {
            type = 'thermal_alarm';
            severity = event.loadPercent > 95 ? 'alarm' : 'warning';
          } else if (warning.includes('Bushing')) {
            type = 'bushing_alarm';
            severity = 'alarm';
          } else if (warning.includes('Tap changer')) {
            type = 'tap_changer';
            severity = 'warning';
          } else if (warning.includes('Cooling')) {
            type = 'cooling_failure';
            severity = 'alarm';
          } else if (warning.includes('Oil level')) {
            type = 'oil_alarm';
            severity = 'warning';
          }

          alarms.push({
            id: `alarm-${event.id}-${wIdx}`,
            type,
            severity,
            description: warning,
            timestamp: event.timestamp,
            resolved: event.eventType !== 'fault_clearing',
            aiRecommendation: getTransformerRecommendation(warning),
            relatedLoadEventId: event.id,
          });
        });
      }
    });
  }

  // Add DGA trending alarm if TDCG is high
  if (record && record.tdcg > 1000) {
    alarms.unshift({
      id: 'alarm-dga-trend',
      type: 'dga_alarm',
      severity: record.tdcg > 2000 ? 'trip' : 'alarm',
      description: `TDCG trending — ${record.tdcg} ppm (IEEE C57.104 Condition ${record.tdcg > 1920 ? '4' : '3'})`,
      timestamp: new Date(now.getTime() - 2 * 60 * 60000),
      parameter: 'TDCG',
      value: record.tdcg,
      threshold: 1920,
      resolved: false,
      aiRecommendation: record.tdcg > 2000
        ? 'Immediate de-load recommended. Schedule emergency oil sample and DGA analysis within 24 hours.'
        : 'Increase DGA sampling frequency to weekly. Consider de-loading to 80% of nameplate during peak hours.',
    });
  }

  return alarms.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8);
}

function getTransformerRecommendation(warning: string): string {
  if (warning.includes('TDCG') || warning.includes('gas')) {
    return 'Increase DGA sampling frequency. Investigate rate of change per IEEE C57.104.';
  }
  if (warning.includes('temperature') || warning.includes('Hot spot')) {
    return 'Verify cooling system operation. Consider de-loading if sustained above limit.';
  }
  if (warning.includes('Bushing')) {
    return 'Schedule bushing power factor test. Compare with baseline capacitance values.';
  }
  if (warning.includes('Cooling') || warning.includes('fan')) {
    return 'Dispatch maintenance crew to inspect cooling fans and control circuits.';
  }
  if (warning.includes('Oil level')) {
    return 'Inspect transformer and radiators for oil leaks. Check conservator level.';
  }
  if (warning.includes('Tap changer')) {
    return 'Schedule tap changer inspection. Review contact resistance trend.';
  }
  return 'Review operating parameters and compare with historical baseline.';
}

// Real-time sensor value updates
export function updateSensorValue(sensor: TransformerSensor): TransformerSensor {
  const variation = (sensor.maxValue - sensor.minValue) * 0.01;
  let newValue = sensor.value + (Math.random() - 0.5) * variation;
  newValue = Math.max(sensor.minValue, Math.min(sensor.maxValue, newValue));

  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (sensor.type === 'oil' && sensor.name.includes('Dielectric')) {
    // Lower is worse for dielectric strength
    if (newValue < sensor.normalRange.min * 0.8) status = 'critical';
    else if (newValue < sensor.normalRange.min) status = 'warning';
  } else {
    if (newValue < sensor.normalRange.min || newValue > sensor.normalRange.max) {
      const deviation = Math.max(
        sensor.normalRange.min - newValue,
        newValue - sensor.normalRange.max
      );
      const range = sensor.normalRange.max - sensor.normalRange.min;
      status = deviation > range * 0.3 ? 'critical' : 'warning';
    }
  }

  return { ...sensor, value: newValue, status, lastUpdated: new Date() };
}

