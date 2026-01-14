import {
  VesselEmissions,
  FleetEmissionsSummary,
  ComplianceTarget,
  ESGScore,
  DecarbonizationPathway,
} from './types';

export function generateVesselEmissions(vessels: Array<{ id: string; name: string; type: string }>): VesselEmissions[] {
  return vessels.map(vessel => {
    const baseEmissions = {
      crane_barge: { co2: 45, nox: 850, sox: 120, pm: 25 },
      dredger: { co2: 62, nox: 1100, sox: 160, pm: 35 },
      supply_vessel: { co2: 28, nox: 520, sox: 75, pm: 15 },
      survey_vessel: { co2: 18, nox: 340, sox: 48, pm: 10 },
      tugboat: { co2: 22, nox: 410, sox: 58, pm: 12 },
    };

    const base = baseEmissions[vessel.type as keyof typeof baseEmissions] || baseEmissions.supply_vessel;
    const variance = 0.8 + Math.random() * 0.4;

    const emissions = {
      co2: base.co2 * variance,
      nox: base.nox * variance,
      sox: base.sox * variance,
      pm: base.pm * variance,
    };

    const fuelConsumed = emissions.co2 * 1000 / 2.68; // ~2.68 kg CO2 per liter
    const efficiency = 15 + Math.random() * 20;

    return {
      vesselId: vessel.id,
      vesselName: vessel.name,
      vesselType: vessel.type,
      period: 'monthly',
      emissions,
      fuelConsumed,
      fuelType: Math.random() > 0.7 ? 'LNG' : Math.random() > 0.5 ? 'MDO' : 'HFO',
      distance: 800 + Math.random() * 1500,
      operatingHours: 400 + Math.random() * 300,
      efficiency,
      benchmark: {
        fleetAverage: 22,
        industryAverage: 28,
        bestInClass: 12,
      },
    };
  });
}

export function generateFleetSummary(vesselEmissions: VesselEmissions[]): FleetEmissionsSummary {
  const summary = vesselEmissions.reduce(
    (acc, v) => ({
      totalCO2: acc.totalCO2 + v.emissions.co2,
      totalNOx: acc.totalNOx + v.emissions.nox,
      totalSOx: acc.totalSOx + v.emissions.sox,
      totalPM: acc.totalPM + v.emissions.pm,
      totalFuel: acc.totalFuel + v.fuelConsumed,
      totalEfficiency: acc.totalEfficiency + v.efficiency,
    }),
    { totalCO2: 0, totalNOx: 0, totalSOx: 0, totalPM: 0, totalFuel: 0, totalEfficiency: 0 }
  );

  return {
    ...summary,
    avgEfficiency: summary.totalEfficiency / vesselEmissions.length,
    vesselCount: vesselEmissions.length,
    period: 'This Month',
    trend: {
      co2Change: -5 + Math.random() * 10,
      efficiencyChange: -3 + Math.random() * 8,
    },
  };
}

export function generateComplianceTargets(): ComplianceTarget[] {
  const now = new Date();
  
  return [
    {
      id: 'imo-2030',
      name: 'IMO 2030 Target',
      type: 'IMO2030',
      targetValue: 40,
      currentValue: 28,
      unit: '% reduction from 2008',
      deadline: new Date(2030, 0, 1),
      status: 'on_track',
      description: 'Reduce carbon intensity by 40% by 2030',
    },
    {
      id: 'imo-2050',
      name: 'IMO 2050 Target',
      type: 'IMO2050',
      targetValue: 70,
      currentValue: 28,
      unit: '% reduction from 2008',
      deadline: new Date(2050, 0, 1),
      status: 'on_track',
      description: 'Reduce total GHG emissions by 70% by 2050',
    },
    {
      id: 'cii-2024',
      name: 'CII Rating',
      type: 'CII',
      targetValue: 85,
      currentValue: 78,
      unit: 'Score (A-E)',
      deadline: new Date(now.getFullYear() + 1, 0, 1),
      status: 'at_risk',
      description: 'Maintain fleet average CII rating of B or better',
    },
    {
      id: 'eexi-2023',
      name: 'EEXI Compliance',
      type: 'EEXI',
      targetValue: 100,
      currentValue: 92,
      unit: '% fleet compliant',
      deadline: new Date(now.getFullYear(), 11, 31),
      status: 'at_risk',
      description: 'All vessels must meet EEXI requirements',
    },
    {
      id: 'eu-ets',
      name: 'EU ETS Preparation',
      type: 'ETS',
      targetValue: 100,
      currentValue: 85,
      unit: '% readiness',
      deadline: new Date(2024, 0, 1),
      status: 'on_track',
      description: 'Prepare for EU Emissions Trading System inclusion',
    },
  ];
}

export function generateESGScore(): ESGScore {
  return {
    overall: 76,
    environmental: {
      score: 72,
      factors: [
        { name: 'Carbon Emissions', score: 68, weight: 0.35 },
        { name: 'Fuel Efficiency', score: 75, weight: 0.25 },
        { name: 'Waste Management', score: 82, weight: 0.15 },
        { name: 'Biodiversity Impact', score: 70, weight: 0.15 },
        { name: 'Water Usage', score: 78, weight: 0.10 },
      ],
    },
    social: {
      score: 81,
      factors: [
        { name: 'Crew Safety', score: 88, weight: 0.30 },
        { name: 'Training & Development', score: 79, weight: 0.25 },
        { name: 'Work-Life Balance', score: 75, weight: 0.20 },
        { name: 'Diversity & Inclusion', score: 82, weight: 0.15 },
        { name: 'Community Engagement', score: 78, weight: 0.10 },
      ],
    },
    governance: {
      score: 78,
      factors: [
        { name: 'Regulatory Compliance', score: 92, weight: 0.30 },
        { name: 'Risk Management', score: 75, weight: 0.25 },
        { name: 'Transparency', score: 72, weight: 0.20 },
        { name: 'Ethics & Integrity', score: 85, weight: 0.15 },
        { name: 'Data Security', score: 68, weight: 0.10 },
      ],
    },
    trend: 'improving',
    lastUpdated: new Date(),
  };
}

export function generateDecarbonizationPathway(): DecarbonizationPathway {
  return {
    id: 'pathway-main',
    name: 'NMDC Net Zero 2050',
    phases: [
      {
        year: 2025,
        targetReduction: 15,
        initiatives: [
          'Fleet speed optimization',
          'Shore power connections',
          'Hull coating upgrades',
        ],
        investment: 5000000,
        expectedSavings: 2500000,
      },
      {
        year: 2030,
        targetReduction: 40,
        initiatives: [
          'LNG fuel conversion (5 vessels)',
          'Battery hybrid systems',
          'AI route optimization',
        ],
        investment: 45000000,
        expectedSavings: 18000000,
      },
      {
        year: 2040,
        targetReduction: 70,
        initiatives: [
          'Ammonia/methanol fuel adoption',
          'New green vessel acquisitions',
          'Carbon capture systems',
        ],
        investment: 120000000,
        expectedSavings: 55000000,
      },
      {
        year: 2050,
        targetReduction: 100,
        initiatives: [
          'Full fleet zero-emission',
          'Hydrogen fuel cells',
          'Carbon offset programs',
        ],
        investment: 85000000,
        expectedSavings: 45000000,
      },
    ],
    totalInvestment: 255000000,
    totalSavings: 120500000,
    paybackPeriod: 12,
    riskLevel: 'medium',
  };
}

// Monthly emissions trend data
export function generateEmissionsTrend(months: number = 12): Array<{
  month: string;
  co2: number;
  target: number;
}> {
  const data = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    
    // Simulate declining emissions trend
    const baseEmissions = 450 - (months - i) * 3;
    const variance = Math.random() * 40 - 20;
    
    data.push({
      month: monthName,
      co2: baseEmissions + variance,
      target: 400 - (months - i) * 2.5,
    });
  }
  
  return data;
}





