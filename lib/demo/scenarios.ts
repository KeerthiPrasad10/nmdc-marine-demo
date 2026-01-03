// Crisis Demo Scenario Types

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
  type: 'engine_failure' | 'storm_response' | 'fuel_crisis' | 'safety_incident';
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

// The "Wow Moment" - Engine Failure Scenario
export const engineFailureScenario: CrisisScenario = {
  id: 'scenario-engine-001',
  name: 'Critical Engine Anomaly',
  type: 'engine_failure',
  description: 'Vessel 7\'s main engine shows abnormal vibration. Watch the AI respond in real-time.',
  vessel: {
    id: 'vessel-7',
    name: 'NMDC Al Mirfa',
    type: 'crane_barge',
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
      description: 'Evaluating impact on Ruwais LNG Terminal project and fleet operations.',
      duration: 700,
      icon: '💰',
      data: {
        projectAtRisk: 'Ruwais LNG Terminal Expansion',
        potentialDelay: '2 days',
        emergencyRepairCost: 280000,
        delayPenalty: 150000,
        totalRisk: 430000,
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
        nearestPort: 'Fujairah (4 hours)',
        sparePartsStatus: 'Available in warehouse',
        engineerETA: '8 hours',
        backupVessel: 'NMDC Yas Al Bahr',
        backupDelay: '6 hours',
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
        clientNotificationDrafted: true,
        projectTimelineUpdated: true,
      },
    },
  ],
  summary: {
    plannedCost: 45000,
    emergencyCost: 430000,
    savings: 385000,
    timeToResolve: '3.0 seconds',
  },
};

// Storm Response Scenario
export const stormResponseScenario: CrisisScenario = {
  id: 'scenario-storm-001',
  name: 'Severe Weather Warning',
  type: 'storm_response',
  description: 'Tropical storm approaching Arabian Gulf. AI coordinates fleet-wide response.',
  steps: [
    {
      id: 'step-1',
      phase: 'detection',
      title: 'Weather Alert Received',
      description: 'Tropical Storm "Shaheen" approaching. Wind speeds 45+ knots expected in 18 hours.',
      duration: 400,
      icon: '🌀',
      data: {
        stormCategory: 'Tropical Storm',
        windSpeed: 45,
        waveHeight: 5.5,
        arrivalTime: '18 hours',
      },
    },
    {
      id: 'step-2',
      phase: 'analysis',
      title: 'Exposure Analysis',
      description: 'Identifying vessels and projects in storm path.',
      duration: 600,
      icon: '🗺️',
      data: {
        vesselsExposed: 8,
        projectsAtRisk: 3,
        crewOnsite: 245,
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
        standbyDuration: '36-48 hours',
        projectDelays: '2-4 days',
        revenueAtRisk: 1200000,
      },
    },
    {
      id: 'step-4',
      phase: 'solution',
      title: 'Protection Plan',
      description: 'Generating fleet protection and continuation strategy.',
      duration: 800,
      icon: '🛡️',
      data: {
        safePorts: ['Fujairah', 'Jebel Ali', 'Abu Dhabi'],
        vesselRelocations: 6,
        crewRotations: 3,
        equipmentSecured: true,
      },
    },
    {
      id: 'step-5',
      phase: 'action',
      title: 'Coordinated Response',
      description: 'Executing synchronized fleet movement and notifications.',
      duration: 500,
      icon: '🚢',
      data: {
        movementOrdersIssued: 6,
        clientsNotified: 3,
        insuranceDocumented: true,
        emergencyProtocols: 'Activated',
      },
    },
  ],
  summary: {
    plannedCost: 85000,
    emergencyCost: 1200000,
    savings: 1115000,
    timeToResolve: '3.0 seconds',
  },
};

// Fuel Crisis Scenario
export const fuelCrisisScenario: CrisisScenario = {
  id: 'scenario-fuel-001',
  name: 'Fleet Fuel Optimization',
  type: 'fuel_crisis',
  description: 'Multiple vessels reporting low fuel. AI optimizes refueling logistics.',
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
        operationsAtRisk: 3,
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
        avgBurnRate: '450 L/hr',
        hoursRemaining: '6-12 hours',
        urgentRefuel: 2,
      },
    },
    {
      id: 'step-3',
      phase: 'solution',
      title: 'Logistics Optimization',
      description: 'Optimizing refueling schedule across multiple ports.',
      duration: 700,
      icon: '🔄',
      data: {
        bunkersScheduled: 4,
        portsSelected: ['Fujairah', 'Jebel Ali'],
        fuelSavings: 12500,
        transitOptimized: true,
      },
    },
    {
      id: 'step-4',
      phase: 'action',
      title: 'Coordinated Refueling',
      description: 'Executing optimized refueling plan with minimal downtime.',
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
    plannedCost: 125000,
    emergencyCost: 175000,
    savings: 50000,
    timeToResolve: '2.0 seconds',
  },
};

// Safety Incident Scenario
export const safetyIncidentScenario: CrisisScenario = {
  id: 'scenario-safety-001',
  name: 'Crew Fatigue Alert',
  type: 'safety_incident',
  description: 'Multiple crew members approaching fatigue limits. AI ensures compliance.',
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
      description: 'Checking MLC and ISM Code compliance requirements.',
      duration: 500,
      icon: '📋',
      data: {
        mlcCompliance: 'At Risk',
        ismCodeStatus: 'Warning',
        regulatoryExposure: 'Moderate',
      },
    },
    {
      id: 'step-3',
      phase: 'solution',
      title: 'Rotation Planning',
      description: 'Generating optimal crew rotation to maintain operations.',
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
      description: 'Coordinating crew changes with minimal operational impact.',
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

export const allScenarios: CrisisScenario[] = [
  engineFailureScenario,
  stormResponseScenario,
  fuelCrisisScenario,
  safetyIncidentScenario,
];

export function getScenarioById(id: string): CrisisScenario | undefined {
  return allScenarios.find(s => s.id === id);
}

