// ESG Intelligence Center Types — Utility Grid Context

export interface EmissionsData {
  co2: number; // tonnes — from grid losses and SF6
  sf6: number; // kg — sulfur hexafluoride leakage
  gridLosses: number; // MWh lost in transmission/distribution
  linelossPct: number; // percentage of energy lost
}

export interface AssetEmissions {
  assetTag: string;
  assetName: string;
  assetType: string;
  opCo: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  emissions: EmissionsData;
  energyDelivered: number; // MWh
  peakLoadMW: number;
  efficiency: number; // % — transformer / substation efficiency
  benchmark: {
    fleetAverage: number;
    industryAverage: number;
    bestInClass: number;
  };
  healthIndex: number;
  sf6EquipmentCount?: number; // # of SF6 breakers at substation
  hasMaintenanceIssues?: boolean;
  maintenanceImpact?: string;
  customersServed?: number;
}

export interface GridEmissionsSummary {
  totalCO2: number;
  totalSF6: number; // kg
  totalGridLosses: number; // MWh
  avgEfficiency: number; // %
  avgLineLoss: number; // %
  assetCount: number;
  period: string;
  trend: {
    co2Change: number; // percentage
    sf6Change: number;
    efficiencyChange: number;
  };
  bestPerformer?: string;
  worstPerformer?: string;
  totalCustomersServed: number;
}

export interface ComplianceTarget {
  id: string;
  name: string;
  type: 'NERC_Reliability' | 'EPA_SF6' | 'State_RPS' | 'State_Clean_Energy' | 'IEEE_C57' | 'Custom';
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: Date;
  status: 'on_track' | 'at_risk' | 'behind';
  description: string;
}

export interface CarbonCredit {
  id: string;
  type: 'offset' | 'allowance' | 'REC';
  amount: number; // tonnes CO2 or MWh for REC
  price: number; // USD per unit
  source: string;
  expiryDate: Date;
  status: 'available' | 'used' | 'expired';
}

export interface ESGScore {
  overall: number; // 0-100
  environmental: {
    score: number;
    factors: Array<{ name: string; score: number; weight: number }>;
  };
  social: {
    score: number;
    factors: Array<{ name: string; score: number; weight: number }>;
  };
  governance: {
    score: number;
    factors: Array<{ name: string; score: number; weight: number }>;
  };
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

export interface DecarbonizationPathway {
  id: string;
  name: string;
  phases: Array<{
    year: number;
    targetReduction: number;
    initiatives: string[];
    investment: number;
    expectedSavings: number;
  }>;
  totalInvestment: number;
  totalSavings: number;
  paybackPeriod: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ESGReport {
  id: string;
  type: 'GRI' | 'SASB' | 'TCFD' | 'CDP' | 'Custom';
  period: string;
  generatedAt: Date;
  status: 'draft' | 'final';
  sections: Array<{
    name: string;
    completed: boolean;
    data: Record<string, unknown>;
  }>;
}
