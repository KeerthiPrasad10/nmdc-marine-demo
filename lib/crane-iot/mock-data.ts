// Mock data for Crane IoT Dashboard

import {
  CraneAsset,
  CraneSensor,
  CameraFeed,
  LiftCycle,
  MaterialItem,
  SafetyEvent,
  AIInsight,
  CraneMetrics,
  CraneOperator,
  ProductionTarget,
} from './types';

// Shared state for consistent numbers across components
const DAILY_TARGET = 100;
const CURRENT_DAILY = 67; // Use same value everywhere

// Generate realistic sensor data
export function generateSensorData(): CraneSensor[] {
  const now = new Date();
  return [
    {
      id: 'sensor-load-1',
      name: 'Hook Load Cell',
      type: 'load',
      unit: 'kg',
      value: 2450 + Math.random() * 100,
      minValue: 0,
      maxValue: 5000,
      normalRange: { min: 0, max: 4000 },
      status: 'normal',
      lastUpdated: now,
    },
    {
      id: 'sensor-angle-1',
      name: 'Boom Angle',
      type: 'angle',
      unit: '°',
      value: 45 + Math.random() * 5,
      minValue: 0,
      maxValue: 85,
      normalRange: { min: 15, max: 75 },
      status: 'normal',
      lastUpdated: now,
    },
    {
      id: 'sensor-speed-1',
      name: 'Hoist Speed',
      type: 'speed',
      unit: 'm/min',
      value: 12 + Math.random() * 3,
      minValue: 0,
      maxValue: 25,
      normalRange: { min: 0, max: 20 },
      status: 'normal',
      lastUpdated: now,
    },
    {
      id: 'sensor-vib-1',
      name: 'Motor Vibration',
      type: 'vibration',
      unit: 'mm/s',
      value: 2.1 + Math.random() * 0.5,
      minValue: 0,
      maxValue: 10,
      normalRange: { min: 0, max: 4.5 },
      status: 'normal',
      lastUpdated: now,
    },
    {
      id: 'sensor-prox-1',
      name: 'Proximity Alert',
      type: 'proximity',
      unit: 'm',
      value: 8.5 + Math.random() * 2,
      minValue: 0,
      maxValue: 50,
      normalRange: { min: 3, max: 50 },
      status: 'normal',
      lastUpdated: now,
    },
    {
      id: 'sensor-accel-1',
      name: 'Swing Acceleration',
      type: 'accelerometer',
      unit: 'm/s²',
      value: 0.3 + Math.random() * 0.2,
      minValue: 0,
      maxValue: 2,
      normalRange: { min: 0, max: 0.8 },
      status: 'normal',
      lastUpdated: now,
    },
  ];
}

export function generateCameras(): CameraFeed[] {
  return [
    {
      id: 'cam-hook-1',
      name: 'Hook Camera',
      location: 'Crane Hook',
      isActive: true,
      resolution: '4K',
      aiEnabled: true,
      detections: 847,
      lastDetection: new Date(),
    },
    {
      id: 'cam-boom-1',
      name: 'Boom Tip Camera',
      location: 'Boom End',
      isActive: true,
      resolution: '1080p',
      aiEnabled: true,
      detections: 234,
      lastDetection: new Date(),
    },
    {
      id: 'cam-cabin-1',
      name: 'Operator Cabin',
      location: 'Control Cabin',
      isActive: true,
      resolution: '1080p',
      aiEnabled: false,
      detections: 0,
    },
    {
      id: 'cam-ground-1',
      name: 'Ground Level',
      location: 'Base Area',
      isActive: true,
      resolution: '4K',
      aiEnabled: true,
      detections: 1205,
      lastDetection: new Date(),
    },
  ];
}

const ITEM_CLASSIFICATIONS = [
  { classification: 'Steel I-Beam', category: 'steel' as const },
  { classification: 'Concrete Block', category: 'concrete' as const },
  { classification: 'Steel Pipe Section', category: 'pipe' as const },
  { classification: 'Generator Unit', category: 'equipment' as const },
  { classification: 'Shipping Container', category: 'container' as const },
  { classification: 'Aggregate Bucket', category: 'aggregate' as const },
  { classification: 'Steel Plate', category: 'steel' as const },
  { classification: 'Transformer', category: 'equipment' as const },
];

// Realistic warning types for crane operations
const LIFT_WARNINGS = [
  'Load swing exceeding 5° threshold during transit',
  'Proximity alert: Worker detected within 3m exclusion zone',
  'Hoist speed exceeded recommended limit by 12%',
  'Load approach angle suboptimal - consider repositioning',
  'Wind speed elevated (15 knots) - proceed with caution',
  'Boom angle approaching maximum rated capacity',
  'Tagline tension inconsistent - check rigging',
  'Load rotation detected during lift',
  'Ground personnel not maintaining safe distance',
  'Communication delay between spotter and operator',
];

// Named zones for crane operations (more meaningful than raw coordinates)
const PICKUP_ZONES = [
  'Storage Area A',
  'Storage Area B',
  'Material Staging',
  'Pipe Rack',
  'Supply Barge',
  'Equipment Yard',
  'Container Stack',
];

const DROP_ZONES = [
  'Platform Deck Level 1',
  'Platform Deck Level 2',
  'Module Installation Area',
  'Jacket Structure',
  'Topside Assembly',
  'Pipe Support Bay',
  'Equipment Foundation',
];

export function generateRecentLifts(count: number = 10): LiftCycle[] {
  const lifts: LiftCycle[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const startTime = new Date(now.getTime() - (i + 1) * 5 * 60000);
    const duration = 90 + Math.floor(Math.random() * 120);
    const item = ITEM_CLASSIFICATIONS[Math.floor(Math.random() * ITEM_CLASSIFICATIONS.length)];
    
    // Generate warnings - 40% of lifts have at least one warning
    const hasWarnings = Math.random() > 0.6;
    const warningCount = hasWarnings ? 1 + Math.floor(Math.random() * 2) : 0;
    const warnings: string[] = [];
    
    if (hasWarnings) {
      const usedIndexes = new Set<number>();
      for (let w = 0; w < warningCount; w++) {
        let idx = Math.floor(Math.random() * LIFT_WARNINGS.length);
        while (usedIndexes.has(idx)) {
          idx = Math.floor(Math.random() * LIFT_WARNINGS.length);
        }
        usedIndexes.add(idx);
        warnings.push(LIFT_WARNINGS[idx]);
      }
    }
    
    // Generate safety breakdown - scores inversely correlated with warnings
    const generateScore = (hasIssue: boolean) => {
      const base = hasIssue ? 65 : 85;
      return Math.min(100, base + Math.floor(Math.random() * 20));
    };
    
    // Determine which factors are affected by warnings
    const hasLoadIssue = warnings.some(w => w.includes('swing') || w.includes('rotation'));
    const hasSpeedIssue = warnings.some(w => w.includes('speed') || w.includes('Hoist'));
    const hasZoneIssue = warnings.some(w => w.includes('zone') || w.includes('distance') || w.includes('Proximity'));
    const hasRiggingIssue = warnings.some(w => w.includes('Tagline') || w.includes('rigging') || w.includes('angle'));
    const hasCommIssue = warnings.some(w => w.includes('Communication') || w.includes('spotter'));
    
    const safetyBreakdown = {
      loadControl: generateScore(hasLoadIssue),
      speedCompliance: generateScore(hasSpeedIssue),
      zoneSafety: generateScore(hasZoneIssue),
      riggingQuality: generateScore(hasRiggingIssue),
      communication: generateScore(hasCommIssue),
    };
    
    // Overall safety score is weighted average
    const safetyScore = Math.round(
      (safetyBreakdown.loadControl * 0.25 +
       safetyBreakdown.speedCompliance * 0.2 +
       safetyBreakdown.zoneSafety * 0.25 +
       safetyBreakdown.riggingQuality * 0.15 +
       safetyBreakdown.communication * 0.15)
    );
    
    lifts.push({
      id: `lift-${Date.now()}-${i}`,
      startTime,
      endTime: new Date(startTime.getTime() + duration * 1000),
      duration,
      loadWeight: 500 + Math.floor(Math.random() * 3500),
      itemClassification: item.classification,
      pickupLocation: { x: Math.random() * 20, y: 0, z: Math.random() * 30 },
      dropLocation: { x: 15 + Math.random() * 25, y: 0, z: Math.random() * 30 },
      pickupZone: PICKUP_ZONES[Math.floor(Math.random() * PICKUP_ZONES.length)],
      dropZone: DROP_ZONES[Math.floor(Math.random() * DROP_ZONES.length)],
      operatorId: ['op-001', 'op-002', 'op-003'][Math.floor(Math.random() * 3)],
      status: i === 0 ? 'in_progress' : 'completed',
      safetyScore,
      safetyBreakdown,
      aiConfidence: 88 + Math.floor(Math.random() * 12),
      warnings,
    });
  }
  
  return lifts;
}

export function generateRecentItems(count: number = 8): MaterialItem[] {
  const items: MaterialItem[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const itemType = ITEM_CLASSIFICATIONS[Math.floor(Math.random() * ITEM_CLASSIFICATIONS.length)];
    items.push({
      id: `item-${Date.now()}-${i}`,
      classification: itemType.classification,
      category: itemType.category,
      weight: 300 + Math.floor(Math.random() * 4000),
      dimensions: {
        length: 2 + Math.random() * 8,
        width: 0.5 + Math.random() * 3,
        height: 0.3 + Math.random() * 2,
      },
      detectedAt: new Date(now.getTime() - i * 3 * 60000),
      confidence: 85 + Math.floor(Math.random() * 15),
    });
  }
  
  return items;
}

export function generateSafetyEvents(lifts?: LiftCycle[]): SafetyEvent[] {
  const now = new Date();
  
  // If we have lifts with warnings, generate events from those
  const eventsFromLifts: SafetyEvent[] = [];
  if (lifts) {
    lifts.forEach((lift, index) => {
      if (lift.warnings.length > 0 && index < 4) { // Only take first 4 lifts with warnings
        lift.warnings.forEach((warning, wIndex) => {
          // Map warning text to event type
          let type: SafetyEvent['type'] = 'unsafe_behavior';
          let severity: SafetyEvent['severity'] = 'medium';
          
          if (warning.includes('swing') || warning.includes('rotation')) {
            type = 'near_miss';
            severity = 'high';
          } else if (warning.includes('zone') || warning.includes('distance') || warning.includes('Proximity')) {
            type = 'zone_violation';
            severity = 'medium';
          } else if (warning.includes('speed') || warning.includes('Hoist')) {
            type = 'speed_violation';
            severity = 'low';
          } else if (warning.includes('Tagline') || warning.includes('rigging')) {
            type = 'unsafe_behavior';
            severity = 'medium';
          } else if (warning.includes('Communication')) {
            type = 'unsafe_behavior';
            severity = 'low';
          }
          
          eventsFromLifts.push({
            id: `safety-lift-${lift.id}-${wIndex}`,
            type,
            severity,
            description: warning,
            timestamp: lift.startTime,
            resolved: lift.status === 'completed',
            aiRecommendation: getRecommendation(warning),
            liftId: lift.id,
            liftDetails: {
              itemClassification: lift.itemClassification,
              loadWeight: lift.loadWeight,
              pickupZone: lift.pickupZone,
              dropZone: lift.dropZone,
            },
          });
        });
      }
    });
  }
  
  // Add some general events not tied to specific lifts
  const generalEvents: SafetyEvent[] = [
    {
      id: 'safety-general-1',
      type: 'fatigue_warning',
      severity: 'medium',
      description: 'Operator approaching maximum continuous operation time',
      timestamp: new Date(now.getTime() - 30 * 60000),
      workerId: 'op-001',
      resolved: false,
      aiRecommendation: 'Schedule operator rotation within 45 minutes',
    },
  ];
  
  // Combine and sort by timestamp (most recent first)
  return [...eventsFromLifts, ...generalEvents]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 6); // Limit to 6 events
}

// Helper function for AI recommendations
function getRecommendation(warning: string): string {
  if (warning.includes('swing') || warning.includes('rotation')) {
    return 'Review tagline usage procedures with rigging team';
  } else if (warning.includes('zone') || warning.includes('distance')) {
    return 'Implement visual and audio warning system for zone boundaries';
  } else if (warning.includes('speed') || warning.includes('Hoist')) {
    return 'Adjust speed limiter settings and review operator training';
  } else if (warning.includes('Tagline') || warning.includes('rigging') || warning.includes('angle')) {
    return 'Verify rigging configuration before next lift';
  } else if (warning.includes('Wind')) {
    return 'Monitor weather conditions and pause operations if wind exceeds 20 knots';
  } else if (warning.includes('Communication')) {
    return 'Check radio equipment and establish backup communication protocol';
  }
  return 'Review safety procedures with crew';
}

export function generateAIInsights(): AIInsight[] {
  return [
    {
      id: 'insight-1',
      type: 'optimization',
      priority: 'high',
      title: 'Optimal Lift Sequencing Available',
      description: 'AI analysis shows current lift sequence can be optimized by reordering material staging',
      recommendation: 'Resequence next 12 lifts to reduce total cycle time by 18%',
      potentialSavings: 4500,
      potentialTimeGain: 2.5,
      confidence: 92,
      timestamp: new Date(),
      actionable: true,
    },
    {
      id: 'insight-2',
      type: 'productivity',
      priority: 'medium',
      title: 'Production Rate Below Target',
      description: 'Current production rate is 12% below daily target due to extended idle periods',
      recommendation: 'Coordinate with ground crew to pre-stage materials and reduce hook wait time',
      potentialTimeGain: 1.8,
      confidence: 88,
      timestamp: new Date(),
      actionable: true,
    },
    {
      id: 'insight-3',
      type: 'safety',
      priority: 'high',
      title: 'Pattern of Near-Zone Violations',
      description: 'AI detected recurring pattern of workers approaching exclusion zone during specific lift types',
      recommendation: 'Implement additional visual barriers for heavy lift operations',
      confidence: 94,
      timestamp: new Date(),
      actionable: true,
    },
    {
      id: 'insight-4',
      type: 'maintenance',
      priority: 'medium',
      title: 'Predictive Maintenance Alert',
      description: 'Hoist motor vibration pattern indicates potential bearing wear within 120 operating hours',
      recommendation: 'Schedule preventive bearing inspection during next planned maintenance window',
      potentialSavings: 15000,
      confidence: 86,
      timestamp: new Date(),
      actionable: true,
    },
    {
      id: 'insight-5',
      type: 'scheduling',
      priority: 'low',
      title: 'Weather Window Optimization',
      description: 'Forecast shows ideal lifting conditions tomorrow 0600-1400',
      recommendation: 'Consider scheduling heavy lift operations during this window',
      potentialTimeGain: 3,
      confidence: 78,
      timestamp: new Date(),
      actionable: true,
    },
  ];
}

export function generateMetrics(): CraneMetrics {
  return {
    utilizationRate: 72 + Math.random() * 10,
    totalLifts: DAILY_TARGET,
    completedLifts: CURRENT_DAILY,
    avgCycleTime: 124,
    avgLoadWeight: 1850,
    totalTonnage: 1558,
    productionRate: 8.2 + Math.random() * 1.5,
    efficiency: 78 + Math.random() * 8,
    idleTime: 45 + Math.floor(Math.random() * 20),
    operatingHours: 6.5,
    fuelConsumption: 142,
  };
}

export function generateOperator(): CraneOperator {
  return {
    id: 'op-001',
    name: 'Ahmed Al Rashid',
    certificationLevel: 'senior',
    totalLifts: 12847,
    safetyScore: 94,
    avgEfficiency: 86,
    hoursOnDuty: 5.5,
    isFatigued: false,
  };
}

export function generateProductionTarget(): ProductionTarget {
  return {
    daily: DAILY_TARGET,
    weekly: 600,
    monthly: 2400,
    currentDaily: CURRENT_DAILY,
    currentWeekly: 423,
    currentMonthly: 1847,
  };
}

export function generateCraneAsset(): CraneAsset {
  return {
    id: 'crane-legacy-001',
    name: 'DELMA 2000 - Main Crane',
    model: 'Huisman 2000T Mast Crane',
    capacity: 2000,
    location: 'Ruwais - ADNOC Offshore Pipeline',
    project: 'ADNOC Offshore Pipeline Installation',
    vessel: {
      mmsi: '471026000',
      name: 'DELMA 2000',
      type: 'Pipelay Crane Vessel',
    },
    status: 'operational',
    sensors: generateSensorData(),
    cameras: generateCameras(),
    metrics: generateMetrics(),
    operator: generateOperator(),
    lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60000),
    nextMaintenance: new Date(Date.now() + 14 * 24 * 60 * 60000),
  };
}

// Function to simulate real-time sensor updates
export function updateSensorValue(sensor: CraneSensor): CraneSensor {
  const variation = (sensor.maxValue - sensor.minValue) * 0.02;
  let newValue = sensor.value + (Math.random() - 0.5) * variation;
  newValue = Math.max(sensor.minValue, Math.min(sensor.maxValue, newValue));
  
  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (newValue < sensor.normalRange.min || newValue > sensor.normalRange.max) {
    const deviation = Math.max(
      sensor.normalRange.min - newValue,
      newValue - sensor.normalRange.max
    );
    const range = sensor.normalRange.max - sensor.normalRange.min;
    status = deviation > range * 0.3 ? 'critical' : 'warning';
  }
  
  return {
    ...sensor,
    value: newValue,
    status,
    lastUpdated: new Date(),
  };
}


