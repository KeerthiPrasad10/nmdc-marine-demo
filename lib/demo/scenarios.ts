// Crisis Demo Scenario Types - WSDOT Ferry Operations

export interface DemoStep {
  id: string;
  phase: 'detection' | 'analysis' | 'prediction' | 'impact' | 'solution' | 'action';
  title: string;
  description: string;
  duration: number; // milliseconds
  data?: Record<string, unknown>;
  icon?: string;
}

export interface CrisisScenario {
  id: string;
  name: string;
  type: 'engine_failure' | 'storm_response' | 'fuel_crisis' | 'safety_incident' | 'schedule_optimization';
  description: string;
  vessel?: {
    id: string;
    name: string;
    type: string;
  };
  steps: DemoStep[];
  summary: {
    plannedCost: number;
    emergencyCost: number;
    savings: number;
    timeToResolve: string;
  };
}

// The "Wow Moment" - Engine Failure Prevention Scenario
export const engineFailureScenario: CrisisScenario = {
  id: 'scenario-engine-001',
  name: 'Engine Anomaly Detection',
  type: 'engine_failure',
  description: 'AI detects early warning signs in engine vibration patterns and deploys preventive measures before failure occurs.',
  vessel: {
    id: '366983000',
    name: 'M/V Puyallup',
    type: 'ferry',
  },
  steps: [
    {
      id: 'step-1',
      phase: 'detection',
      title: 'Anomaly Detection',
      description: 'Abnormal vibration signature detected on main engine cylinder #3. Pattern diverges 340% from baseline.',
      duration: 300,
      icon: '🔍',
      data: {
        vibration: 12.4,
        normalRange: '2.5-4.0 mm/s',
        confidence: 94,
      },
    },
    {
      id: 'step-2',
      phase: 'analysis',
      title: 'Pattern Analysis',
      description: 'Comparing against 10,847 historical failure patterns in knowledge base.',
      duration: 500,
      icon: '📊',
      data: {
        patternsAnalyzed: 10847,
        matchFound: 'Cylinder bearing degradation',
        matchConfidence: 89,
      },
    },
    {
      id: 'step-3',
      phase: 'prediction',
      title: 'Failure Prediction',
      description: 'Predicting cylinder failure within 6-14 hours with 87% confidence.',
      duration: 800,
      icon: '⚠️',
      data: {
        failureWindow: '6-14 hours',
        probability: 87,
        rootCause: 'Fuel contamination + worn injector',
      },
    },
    {
      id: 'step-4',
      phase: 'impact',
      title: 'Impact Assessment',
      description: 'Evaluating impact on Seattle-Bainbridge route and fleet operations.',
      duration: 700,
      icon: '💰',
      data: {
        routeAtRisk: 'Seattle - Bainbridge Island',
        potentialDelay: '4 sailings cancelled',
        emergencyRepairCost: 180000,
        revenueImpact: 95000,
        totalRisk: 275000,
      },
    },
    {
      id: 'step-5',
      phase: 'solution',
      title: 'Solution Generation',
      description: 'Generating optimal mitigation plan with resource reallocation.',
      duration: 1000,
      icon: '💡',
      data: {
        nearestTerminal: 'Eagle Harbor Maintenance (20 min)',
        sparePartsStatus: 'Available in warehouse',
        engineerETA: '2 hours',
        backupVessel: 'M/V Wenatchee',
        backupDelay: '45 minutes',
      },
    },
    {
      id: 'step-6',
      phase: 'action',
      title: 'Action Execution',
      description: 'Executing mitigation plan with automated notifications.',
      duration: 500,
      icon: '✅',
      data: {
        workOrderGenerated: true,
        captainNotified: true,
        opsManagerAlerted: true,
        maintenanceTeamDispatched: true,
        passengerNotificationDrafted: true,
        scheduleUpdated: true,
      },
    },
  ],
  summary: {
    plannedCost: 35000,
    emergencyCost: 275000,
    savings: 240000,
    timeToResolve: '3.0 seconds',
  },
};

// Storm Preparation Scenario
export const stormResponseScenario: CrisisScenario = {
  id: 'scenario-storm-001',
  name: 'Weather Risk Mitigation',
  type: 'storm_response',
  description: 'AI predicts severe weather 18 hours ahead and proactively adjusts ferry schedules for safety.',
  steps: [
    {
      id: 'step-1',
      phase: 'detection',
      title: 'Weather Alert Received',
      description: 'Pacific storm system approaching Puget Sound. Wind speeds 45+ knots expected in 18 hours.',
      duration: 400,
      icon: '🌀',
      data: {
        stormCategory: 'Windstorm',
        windSpeed: 45,
        waveHeight: 5.5,
        arrivalTime: '18 hours',
      },
    },
    {
      id: 'step-2',
      phase: 'analysis',
      title: 'Exposure Analysis',
      description: 'Identifying routes and vessels affected by storm path.',
      duration: 600,
      icon: '🗺️',
      data: {
        routesExposed: 6,
        vesselsAffected: 12,
        passengersImpacted: 15000,
      },
    },
    {
      id: 'step-3',
      phase: 'prediction',
      title: 'Impact Modeling',
      description: 'Modeling operational and financial impact across fleet.',
      duration: 700,
      icon: '📈',
      data: {
        suspensionDuration: '12-24 hours',
        sailingsCancelled: 48,
        revenueAtRisk: 450000,
      },
    },
    {
      id: 'step-4',
      phase: 'solution',
      title: 'Protection Plan',
      description: 'Generating fleet protection and passenger accommodation strategy.',
      duration: 800,
      icon: '🛡️',
      data: {
        safeTerminals: ['Seattle', 'Bainbridge', 'Bremerton'],
        vesselRelocations: 8,
        additionalSailings: 'Pre-storm surge schedule',
        passengerAlternatives: 'Bus bridge via I-5/SR-16',
      },
    },
    {
      id: 'step-5',
      phase: 'action',
      title: 'Coordinated Response',
      description: 'Executing synchronized fleet adjustment and notifications.',
      duration: 500,
      icon: '⛴️',
      data: {
        scheduleAdjustments: 12,
        passengersNotified: 15000,
        mediaAdvisoryIssued: true,
        emergencyProtocols: 'Activated',
      },
    },
  ],
  summary: {
    plannedCost: 65000,
    emergencyCost: 450000,
    savings: 385000,
    timeToResolve: '3.0 seconds',
  },
};

// Fuel Optimization Scenario
export const fuelCrisisScenario: CrisisScenario = {
  id: 'scenario-fuel-001',
  name: 'Proactive Fuel Management',
  type: 'fuel_crisis',
  description: 'AI predicts fuel depletion patterns and schedules optimal refueling before vessels reach critical levels.',
  steps: [
    {
      id: 'step-1',
      phase: 'detection',
      title: 'Low Fuel Detection',
      description: '4 vessels reporting fuel levels below 25%. Critical threshold reached.',
      duration: 300,
      icon: '⛽',
      data: {
        criticalVessels: 4,
        avgFuelLevel: 18,
        routesAtRisk: 3,
      },
    },
    {
      id: 'step-2',
      phase: 'analysis',
      title: 'Consumption Analysis',
      description: 'Analyzing burn rates and remaining operational windows.',
      duration: 500,
      icon: '📊',
      data: {
        avgBurnRate: '350 L/hr',
        hoursRemaining: '8-14 hours',
        urgentRefuel: 2,
      },
    },
    {
      id: 'step-3',
      phase: 'solution',
      title: 'Logistics Optimization',
      description: 'Optimizing refueling schedule across terminals.',
      duration: 700,
      icon: '🔄',
      data: {
        bunkersScheduled: 4,
        terminalsSelected: ['Seattle', 'Anacortes'],
        fuelSavings: 12500,
        transitOptimized: true,
      },
    },
    {
      id: 'step-4',
      phase: 'action',
      title: 'Coordinated Refueling',
      description: 'Executing optimized refueling plan with minimal service disruption.',
      duration: 500,
      icon: '✅',
      data: {
        ordersPlaced: 4,
        supplierConfirmed: true,
        scheduleUpdated: true,
        costsOptimized: 15,
      },
    },
  ],
  summary: {
    plannedCost: 95000,
    emergencyCost: 140000,
    savings: 45000,
    timeToResolve: '2.0 seconds',
  },
};

// Safety Prevention Scenario
export const safetyIncidentScenario: CrisisScenario = {
  id: 'scenario-safety-001',
  name: 'Fatigue Prevention',
  type: 'safety_incident',
  description: 'AI monitors crew work hours and proactively schedules rotations before fatigue risks emerge.',
  steps: [
    {
      id: 'step-1',
      phase: 'detection',
      title: 'Fatigue Monitoring',
      description: '6 crew members at 85%+ of allowed work hours. Safety protocols at risk.',
      duration: 400,
      icon: '😴',
      data: {
        crewAtRisk: 6,
        avgHoursWorked: 11.2,
        maxAllowed: 12,
        safetyScoreDrop: 15,
      },
    },
    {
      id: 'step-2',
      phase: 'analysis',
      title: 'Compliance Analysis',
      description: 'Checking MLC and USCG compliance requirements.',
      duration: 500,
      icon: '📋',
      data: {
        mlcCompliance: 'At Risk',
        uscgStatus: 'Warning',
        regulatoryExposure: 'Moderate',
      },
    },
    {
      id: 'step-3',
      phase: 'solution',
      title: 'Rotation Planning',
      description: 'Generating optimal crew rotation to maintain service.',
      duration: 600,
      icon: '👥',
      data: {
        rotationsNeeded: 3,
        backupCrewAvailable: 8,
        scheduledRelief: '4 hours',
      },
    },
    {
      id: 'step-4',
      phase: 'action',
      title: 'Relief Coordination',
      description: 'Coordinating crew changes with minimal service disruption.',
      duration: 400,
      icon: '✅',
      data: {
        reliefOrdered: true,
        transportArranged: true,
        scheduleOptimized: true,
        complianceRestored: true,
      },
    },
  ],
  summary: {
    plannedCost: 8500,
    emergencyCost: 95000,
    savings: 86500,
    timeToResolve: '1.9 seconds',
  },
};

// Schedule Optimization Scenario (replaces crane efficiency)
export const scheduleOptimizationScenario: CrisisScenario = {
  id: 'scenario-schedule-001',
  name: 'Schedule Optimization',
  type: 'schedule_optimization',
  description: 'AI analyzes ridership data, weather, and traffic patterns to optimize ferry schedules and improve on-time performance.',
  vessel: {
    id: '366982000',
    name: 'M/V Tacoma',
    type: 'ferry',
  },
  steps: [
    {
      id: 'step-1',
      phase: 'detection',
      title: 'Ridership Data Collection',
      description: 'Terminal sensors capturing real-time passenger counts, vehicle queues, and boarding times across all routes.',
      duration: 2000,
      icon: '📡',
      data: {
        terminalsMonitored: 20,
        dataPointsToday: 45000,
        camerasStreaming: 40,
        aiModelsRunning: 5,
      },
    },
    {
      id: 'step-2',
      phase: 'analysis',
      title: 'Demand Forecasting',
      description: 'AI predicting ridership demand for next 72 hours based on historical patterns, events, and weather.',
      duration: 2500,
      icon: '🔍',
      data: {
        predictedRiders: 48000,
        forecastAccuracy: 92,
        peakRoutes: 'Seattle-Bainbridge, Mukilteo-Clinton',
        surgeExpected: 'Friday evening +35%',
      },
    },
    {
      id: 'step-3',
      phase: 'prediction',
      title: 'Bottleneck Analysis',
      description: 'Identifying potential service bottlenecks and capacity constraints.',
      duration: 2500,
      icon: '📊',
      data: {
        currentOnTime: '87%',
        targetOnTime: '95%',
        efficiency: '82%',
        bottleneck: 'Vehicle loading delays at Colman Dock',
      },
    },
    {
      id: 'step-4',
      phase: 'impact',
      title: 'Revenue & Satisfaction Analysis',
      description: 'Modeling revenue impact and passenger satisfaction from schedule adjustments.',
      duration: 3000,
      icon: '💰',
      data: {
        revenueOpportunity: 125000,
        satisfactionIncrease: '+8%',
        waitTimeReduction: '-12 minutes avg',
        vehicleCapacityGain: '+15%',
      },
    },
    {
      id: 'step-5',
      phase: 'solution',
      title: 'Optimization Recommendations',
      description: 'Generating optimized sailing schedule and resource allocation.',
      duration: 3000,
      icon: '💡',
      data: {
        scheduleOptimization: '+12% on-time performance',
        additionalSailings: 4,
        vesselReassignments: 2,
        potentialSavings: '$18,000/day',
      },
    },
    {
      id: 'step-6',
      phase: 'action',
      title: 'Implementation',
      description: 'Pushing optimized schedule to operations and updating passenger information.',
      duration: 2000,
      icon: '✅',
      data: {
        scheduleUpdated: true,
        crewNotified: true,
        passengerAlertsEnabled: true,
        dashboardUpdated: true,
        reportGenerated: true,
      },
    },
  ],
  summary: {
    plannedCost: 15000,
    emergencyCost: 95000,
    savings: 80000,
    timeToResolve: '15 seconds',
  },
};

export const allScenarios: CrisisScenario[] = [
  engineFailureScenario,
  stormResponseScenario,
  fuelCrisisScenario,
  safetyIncidentScenario,
  scheduleOptimizationScenario,
];

export function getScenarioById(id: string): CrisisScenario | undefined {
  return allScenarios.find(s => s.id === id);
}
