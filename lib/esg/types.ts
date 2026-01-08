// ESG Intelligence Center Types

export interface EmissionsData {
  co2: number; // tonnes
  nox: number; // kg
  sox: number; // kg
  pm: number; // kg (particulate matter)
}

export interface VesselEmissions {
  vesselId: string;
  vesselName: string;
  vesselType: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  emissions: EmissionsData;
  fuelConsumed: number; // liters
  fuelType: 'HFO' | 'MDO' | 'LNG' | 'Hybrid';
  distance: number; // nautical miles
  operatingHours: number;
  efficiency: number; // grams CO2 per tonne-mile
  benchmark: {
    fleetAverage: number;
    industryAverage: number;
    bestInClass: number;
  };
}

export interface FleetEmissionsSummary {
  totalCO2: number;
  totalNOx: number;
  totalSOx: number;
  totalPM: number;
  totalFuel: number;
  avgEfficiency: number;
  vesselCount: number;
  period: string;
  trend: {
    co2Change: number; // percentage
    efficiencyChange: number;
  };
}

export interface ComplianceTarget {
  id: string;
  name: string;
  type: 'IMO2030' | 'IMO2050' | 'ETS' | 'CII' | 'EEXI' | 'Custom';
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: Date;
  status: 'on_track' | 'at_risk' | 'behind';
  description: string;
}

export interface CarbonCredit {
  id: string;
  type: 'offset' | 'allowance';
  amount: number; // tonnes CO2
  price: number; // USD per tonne
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



