export type ChangeType = 
  | 'vessel_assignment'
  | 'schedule_change'
  | 'maintenance_schedule'
  | 'route_change'
  | 'fuel_switch'
  | 'crew_reassignment'
  | 'project_delay'
  | 'weather_event'
  | 'equipment_failure'
  | 'new_project'
  | 'vessel_acquisition'
  | 'vessel_disposal';

export type ImpactSeverity = 'critical' | 'high' | 'medium' | 'low' | 'positive';
export type ImpactDirection = 'upstream' | 'downstream' | 'lateral';

export interface ProposedChange {
  id: string;
  type: ChangeType;
  title: string;
  description: string;
  effectiveDate: Date;
  affectedVessels: string[];
  affectedProjects: string[];
  parameters: Record<string, unknown>;
}

export interface ImpactItem {
  id: string;
  category: ImpactCategory;
  direction: ImpactDirection;
  title: string;
  description: string;
  severity: ImpactSeverity;
  quantitativeImpact?: {
    metric: string;
    currentValue: number;
    projectedValue: number;
    unit: string;
    percentChange: number;
  };
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  confidence: number;
  mitigations?: string[];
  dependsOn?: string[];
  affectedEntities: {
    vessels?: string[];
    projects?: string[];
    crew?: string[];
    equipment?: string[];
    ports?: string[];
    clients?: string[];
  };
}

export type ImpactCategory =
  | 'operations'
  | 'finance'
  | 'esg'
  | 'compliance'
  | 'safety'
  | 'crew'
  | 'maintenance'
  | 'supply_chain'
  | 'client_relations'
  | 'regulatory';

export interface ImpactChainNode {
  id: string;
  impact: ImpactItem;
  children: ImpactChainNode[];
  depth: number;
}

export interface ImpactAnalysisResult {
  id: string;
  change: ProposedChange;
  timestamp: Date;
  overallRisk: ImpactSeverity;
  overallConfidence: number;
  
  summary: {
    totalImpacts: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    positiveCount: number;
  };
  
  upstreamImpacts: ImpactItem[];
  downstreamImpacts: ImpactItem[];
  lateralImpacts: ImpactItem[];
  
  impactChain: ImpactChainNode[];
  
  financialSummary: {
    estimatedCostImpact: number;
    revenueImpact: number;
    carbonCreditImpact: number;
    insuranceImpact: number;
    totalFinancialImpact: number;
    currency: string;
  };
  
  esgImpact: {
    co2Change: number;
    noxChange: number;
    complianceRiskChange: number;
    esgScoreChange: number;
  };
  
  operationalImpact: {
    utilizationChange: number;
    scheduleDelayDays: number;
    affectedProjectCount: number;
    maintenanceReschedules: number;
  };
  
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
    expectedBenefit: string;
  }>;
  
  alternativeScenarios?: Array<{
    id: string;
    name: string;
    description: string;
    overallRisk: ImpactSeverity;
    financialImpact: number;
  }>;
}

export interface FleetState {
  vessels: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    project?: string;
    location: { lat: number; lng: number };
    healthScore: number;
    fuelLevel: number;
    crewCount: number;
    nextMaintenance?: Date;
    dailyOperatingCost: number;
    dailyRevenue: number;
    emissionsPerDay: number;
  }>;
  
  projects: Array<{
    id: string;
    name: string;
    client: string;
    status: string;
    priority: string;
    progress: number;
    budget: { allocated: number; spent: number };
    deadline: Date;
    assignedVessels: string[];
    dailyBurnRate: number;
    penaltyPerDayDelay: number;
  }>;
  
  crew: Array<{
    id: string;
    name: string;
    role: string;
    vesselId?: string;
    certifications: string[];
    availability: 'available' | 'assigned' | 'leave' | 'training';
  }>;
  
  maintenance: Array<{
    id: string;
    vesselId: string;
    type: string;
    scheduledDate: Date;
    estimatedDuration: number;
    priority: string;
    canDefer: boolean;
  }>;
  
  supplyChain: {
    spareParts: Array<{
      id: string;
      name: string;
      quantity: number;
      reorderPoint: number;
      leadTimeDays: number;
    }>;
    fuelContracts: Array<{
      id: string;
      fuelType: string;
      pricePerUnit: number;
      minCommitment: number;
      expiryDate: Date;
    }>;
    portContracts: Array<{
      id: string;
      portName: string;
      berthAvailability: number;
      dailyRate: number;
    }>;
  };
  
  compliance: {
    imo2030Progress: number;
    ciiRatings: Record<string, string>;
    upcomingAudits: Array<{ date: Date; type: string }>;
    certificates: Array<{ name: string; vesselId: string; expiryDate: Date }>;
  };
  
  financials: {
    monthlyBudget: number;
    currentSpend: number;
    carbonCreditBalance: number;
    carbonCreditPrice: number;
    insurancePremiumBase: number;
  };
}

export interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  type: 'optimization' | 'risk' | 'growth' | 'sustainability';
  changes: ProposedChange[];
  isActive: boolean;
}






