import {
  AssetEmissions,
  GridEmissionsSummary,
  ComplianceTarget,
  ESGScore,
  DecarbonizationPathway,
} from './types';
import { ASSET_ISSUES, getAssetIssueSummary } from '../asset-issues';
import { EXELON_ASSETS } from '../exelon/fleet';

// Generate asset emissions — connected to PM health
// Degraded equipment = higher losses and SF6 leakage
export function generateAssetEmissions(): AssetEmissions[] {
  return EXELON_ASSETS.map(asset => {
    // Base efficiency and loss characteristics by type
    const baseByType: Record<string, { efficiency: number; sf6kg: number; lossGWh: number }> = {
      power_transformer: { efficiency: 99.3, sf6kg: 0, lossGWh: 0.8 },
      distribution_transformer: { efficiency: 98.5, sf6kg: 0, lossGWh: 0.3 },
      substation: { efficiency: 99.0, sf6kg: 12, lossGWh: 1.2 }, // substations have SF6 breakers
    };
    const base = baseByType[asset.type] || baseByType.power_transformer;

    // Get health from asset issues
    const summary = getAssetIssueSummary(asset.assetTag);
    const healthFactor = summary.worstHealth / 100;

    // Degraded equipment → higher losses
    const degradationPenalty = 1 + (1 - healthFactor) * 0.4;
    const variance = 0.9 + Math.random() * 0.2;

    const efficiencyReduction = (1 - healthFactor) * 1.5; // up to 1.5% efficiency loss
    const efficiency = Math.max(96, base.efficiency - efficiencyReduction);
    const lineLossPct = (100 - efficiency) * degradationPenalty * variance;

    const energyDelivered = (asset.ratedMVA * asset.loadFactor / 100) * 720; // MWh per month (30 days × 24h)
    const gridLosses = energyDelivered * (lineLossPct / 100);

    // CO2 from grid losses (EPA eGRID average ~0.386 tonnes CO2 / MWh for PJM region)
    const co2PerMWh = 0.386;
    const co2 = gridLosses * co2PerMWh;

    // SF6 leakage (substations have SF6 breakers, transformers don't)
    const sf6Leakage = base.sf6kg > 0
      ? base.sf6kg * (0.5 + Math.random() * 0.5) * degradationPenalty
      : 0;

    return {
      assetTag: asset.assetTag,
      assetName: asset.name,
      assetType: asset.type,
      opCo: asset.opCo,
      period: 'monthly' as const,
      emissions: {
        co2: co2 * variance,
        sf6: sf6Leakage,
        gridLosses: gridLosses * variance,
        linelossPct: lineLossPct,
      },
      energyDelivered,
      peakLoadMW: asset.ratedMVA * (asset.loadFactor / 100) * (0.9 + Math.random() * 0.15),
      efficiency,
      benchmark: {
        fleetAverage: 98.8,
        industryAverage: 98.5,
        bestInClass: 99.5,
      },
      healthIndex: asset.healthIndex,
      sf6EquipmentCount: asset.type === 'substation' ? Math.floor(3 + Math.random() * 8) : 0,
      hasMaintenanceIssues: summary.issueCount > 0,
      maintenanceImpact: summary.hasCritical
        ? 'Critical equipment issues increasing grid losses by ~25%'
        : summary.hasHighPriority
        ? 'Equipment degradation increasing losses by ~15%'
        : summary.issueCount > 0
        ? 'Minor efficiency impact from pending maintenance'
        : 'Optimal equipment health',
      customersServed: asset.customersServed,
    };
  });
}

export function generateGridSummary(assetEmissions: AssetEmissions[]): GridEmissionsSummary {
  const summary = assetEmissions.reduce(
    (acc, a) => ({
      totalCO2: acc.totalCO2 + a.emissions.co2,
      totalSF6: acc.totalSF6 + a.emissions.sf6,
      totalGridLosses: acc.totalGridLosses + a.emissions.gridLosses,
      totalEfficiency: acc.totalEfficiency + a.efficiency,
      totalLineLoss: acc.totalLineLoss + a.emissions.linelossPct,
      totalCustomers: acc.totalCustomers + (a.customersServed || 0),
    }),
    { totalCO2: 0, totalSF6: 0, totalGridLosses: 0, totalEfficiency: 0, totalLineLoss: 0, totalCustomers: 0 }
  );

  const assetsWithIssues = assetEmissions.filter(a => a.hasMaintenanceIssues);
  const maintenanceEmissionsImpact = assetsWithIssues.length / assetEmissions.length * 12;

  const sorted = [...assetEmissions].sort((a, b) => b.efficiency - a.efficiency);
  const bestPerformer = sorted[0]?.assetName || 'N/A';
  const worstPerformer = sorted[sorted.length - 1]?.assetName || 'N/A';

  return {
    ...summary,
    avgEfficiency: summary.totalEfficiency / assetEmissions.length,
    avgLineLoss: summary.totalLineLoss / assetEmissions.length,
    assetCount: assetEmissions.length,
    period: 'This Month',
    trend: {
      co2Change: -3.2 + maintenanceEmissionsImpact + Math.random() * 4,
      sf6Change: -8 + Math.random() * 5,
      efficiencyChange: 0.2 + Math.random() * 0.3,
    },
    bestPerformer,
    worstPerformer,
    totalCustomersServed: summary.totalCustomers,
  };
}

// Compliance targets for utility grid
export function generateComplianceTargets(): ComplianceTarget[] {
  const now = new Date();

  let criticalCount = 0;
  let highCount = 0;
  Object.values(ASSET_ISSUES).forEach(ai => {
    ai.issues.forEach(issue => {
      if (issue.pmPrediction.priority === 'critical') criticalCount++;
      if (issue.pmPrediction.priority === 'high') highCount++;
    });
  });

  const reliabilityImpact = criticalCount > 2 ? 'at_risk' : highCount > 4 ? 'at_risk' : 'on_track';
  const sf6Impact = criticalCount > 3 ? 'behind' : criticalCount > 1 ? 'at_risk' : 'on_track';

  return [
    {
      id: 'nerc-reliability',
      name: 'NERC Reliability Standard',
      type: 'NERC_Reliability',
      targetValue: 99.97,
      currentValue: criticalCount > 2 ? 99.88 : highCount > 4 ? 99.92 : 99.95,
      unit: '% uptime',
      deadline: new Date(now.getFullYear() + 1, 0, 1),
      status: reliabilityImpact as 'on_track' | 'at_risk' | 'behind',
      description: `Maintain grid reliability above 99.97%. ${criticalCount + highCount} assets with PM issues affecting reliability.`,
    },
    {
      id: 'epa-sf6',
      name: 'EPA SF₆ Reporting & Reduction',
      type: 'EPA_SF6',
      targetValue: 1.0,
      currentValue: criticalCount > 3 ? 2.8 : criticalCount > 1 ? 1.8 : 1.2,
      unit: '% leak rate',
      deadline: new Date(now.getFullYear() + 1, 11, 31),
      status: sf6Impact as 'on_track' | 'at_risk' | 'behind',
      description: `Reduce SF₆ leak rate below 1.0%. ${criticalCount} critical equipment issues may increase leakage.`,
    },
    {
      id: 'il-ceja',
      name: 'IL CEJA Clean Energy (ComEd)',
      type: 'State_Clean_Energy',
      targetValue: 50,
      currentValue: 38,
      unit: '% clean energy by 2040',
      deadline: new Date(2040, 0, 1),
      status: 'on_track',
      description: 'Illinois Climate & Equitable Jobs Act: 50% clean energy by 2040, 100% by 2045',
    },
    {
      id: 'md-rps',
      name: 'MD Renewable Portfolio Standard (BGE)',
      type: 'State_RPS',
      targetValue: 50,
      currentValue: 32,
      unit: '% renewable by 2030',
      deadline: new Date(2030, 0, 1),
      status: 'at_risk',
      description: 'Maryland RPS requires 50% renewable energy by 2030',
    },
    {
      id: 'ieee-c57-health',
      name: 'IEEE C57.104 DGA Compliance',
      type: 'IEEE_C57',
      targetValue: 100,
      currentValue: criticalCount > 3 ? 72 : criticalCount > 1 ? 82 : 90,
      unit: '% assets in compliance',
      deadline: new Date(now.getFullYear(), 11, 31),
      status: criticalCount > 2 ? 'behind' : criticalCount > 0 ? 'at_risk' : 'on_track',
      description: `All transformers must meet IEEE C57.104 DGA gas limits. ${criticalCount} units exceeding limits.`,
    },
  ];
}

// ESG score adapted for utility grid
export function generateESGScore(): ESGScore {
  let criticalCount = 0;
  let totalHealthScore = 0;
  let assetCount = 0;

  Object.values(ASSET_ISSUES).forEach(ai => {
    assetCount++;
    ai.issues.forEach(issue => {
      if (issue.pmPrediction.priority === 'critical') criticalCount++;
      totalHealthScore += issue.healthScore;
    });
  });

  const avgHealth = assetCount > 0 ? totalHealthScore / (assetCount * 3) : 75;

  const envBaseScore = 74;
  const envPenalty = criticalCount * 2 + (75 - avgHealth) * 0.3;
  const environmentalScore = Math.max(55, Math.round(envBaseScore - envPenalty));

  const sf6Score = Math.max(50, Math.round(72 - criticalCount * 3));
  const gridEfficiencyScore = Math.max(55, Math.round(78 - criticalCount * 2));

  return {
    overall: Math.round((environmentalScore * 0.4 + 82 * 0.35 + 79 * 0.25)),
    environmental: {
      score: environmentalScore,
      factors: [
        { name: 'Grid Losses & Efficiency', score: gridEfficiencyScore, weight: 0.30 },
        { name: 'SF₆ Management', score: sf6Score, weight: 0.25 },
        { name: 'Renewable Integration', score: 68, weight: 0.20 },
        { name: 'Vegetation Management', score: 75, weight: 0.15 },
        { name: 'Oil Spill Prevention', score: 80, weight: 0.10 },
      ],
    },
    social: {
      score: 82,
      factors: [
        { name: 'Service Reliability (SAIDI)', score: criticalCount > 2 ? 78 : 86, weight: 0.30 },
        { name: 'Worker Safety (OSHA)', score: 88, weight: 0.25 },
        { name: 'Community Engagement', score: 79, weight: 0.20 },
        { name: 'Equity & Access', score: 82, weight: 0.15 },
        { name: 'Workforce Development', score: 76, weight: 0.10 },
      ],
    },
    governance: {
      score: 79,
      factors: [
        { name: 'NERC Compliance', score: criticalCount > 3 ? 82 : 90, weight: 0.30 },
        { name: 'Asset Risk Management', score: criticalCount > 2 ? 65 : 74, weight: 0.25 },
        { name: 'Rate Case Transparency', score: 78, weight: 0.20 },
        { name: 'Cybersecurity Posture', score: 84, weight: 0.15 },
        { name: 'Board Diversity', score: 72, weight: 0.10 },
      ],
    },
    trend: criticalCount > 2 ? 'declining' : 'improving',
    lastUpdated: new Date(),
  };
}

export function generateDecarbonizationPathway(): DecarbonizationPathway {
  let criticalCount = 0;
  Object.values(ASSET_ISSUES).forEach(ai => {
    ai.issues.forEach(issue => {
      if (issue.pmPrediction.priority === 'critical') criticalCount++;
    });
  });

  const urgentReplacement = criticalCount * 2000000; // transformer replacement cost

  return {
    id: 'pathway-exelon',
    name: 'Exelon Path to Clean 2050',
    phases: [
      {
        year: 2026,
        targetReduction: 15,
        initiatives: [
          'SF₆ breaker replacement program',
          criticalCount > 2 ? 'Emergency transformer fleet renewal' : 'Predictive maintenance AI rollout',
          'Grid loss reduction via reconductoring',
          'Vegetation management automation',
        ],
        investment: 180000000 + urgentReplacement,
        expectedSavings: 45000000,
      },
      {
        year: 2030,
        targetReduction: 40,
        initiatives: [
          'SF₆-free switchgear deployment (100% new installs)',
          'Advanced grid sensors & smart switches',
          'DER integration platform',
          'Battery storage co-location at substations',
        ],
        investment: 850000000,
        expectedSavings: 220000000,
      },
      {
        year: 2040,
        targetReduction: 70,
        initiatives: [
          'Full SF₆ fleet elimination',
          'Grid-scale energy storage deployment',
          'Hydrogen-ready infrastructure',
          'Advanced conductor upgrades system-wide',
        ],
        investment: 2200000000,
        expectedSavings: 680000000,
      },
      {
        year: 2050,
        targetReduction: 100,
        initiatives: [
          '100% clean energy delivery',
          'Carbon-neutral grid operations',
          'Net-zero Scope 1, 2, 3 emissions',
          'Circular economy for grid materials',
        ],
        investment: 1500000000,
        expectedSavings: 900000000,
      },
    ],
    totalInvestment: 4730000000 + urgentReplacement,
    totalSavings: 1845000000,
    paybackPeriod: 15,
    riskLevel: criticalCount > 3 ? 'high' : criticalCount > 1 ? 'medium' : 'low',
  };
}

// Monthly emissions trend — shows impact of maintenance issues on grid losses
export function generateEmissionsTrend(months: number = 12): Array<{
  month: string;
  co2: number;
  target: number;
  maintenanceImpact?: number;
}> {
  const data = [];
  const now = new Date();

  let criticalCount = 0;
  Object.values(ASSET_ISSUES).forEach(ai => {
    ai.issues.forEach(issue => {
      if (issue.pmPrediction.priority === 'critical') criticalCount++;
    });
  });

  const currentMaintenanceImpact = criticalCount * 12; // each critical issue adds ~12 tonnes CO2/month from increased losses

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });

    const baseEmissions = 320 - (months - i) * 2.5;
    const variance = Math.random() * 30 - 15;

    // Recent months show impact of equipment degradation
    const recentImpact = i < 3 ? currentMaintenanceImpact * (1 - i * 0.3) : 0;

    data.push({
      month: monthName,
      co2: baseEmissions + variance + recentImpact,
      target: 280 - (months - i) * 2,
      maintenanceImpact: recentImpact > 0 ? recentImpact : undefined,
    });
  }

  return data;
}

// ESG impact from maintenance health
export function getESGImpactFromMaintenance(): {
  totalEmissionsImpact: number;
  affectedAssets: Array<{
    assetName: string;
    equipmentIssue: string;
    estimatedExtraLosses: number;
    recommendation: string;
  }>;
  complianceRisk: 'low' | 'medium' | 'high';
  financialImpact: number;
} {
  const affectedAssets: Array<{
    assetName: string;
    equipmentIssue: string;
    estimatedExtraLosses: number;
    recommendation: string;
  }> = [];

  let totalExtraLosses = 0;
  let criticalCount = 0;

  Object.values(ASSET_ISSUES).forEach(assetIssues => {
    assetIssues.issues.forEach(issue => {
      if (issue.pmPrediction.priority === 'critical' || issue.pmPrediction.priority === 'high') {
        const healthPenalty = (100 - issue.healthScore) / 100;
        const estimatedExtraLosses = healthPenalty * 20; // MWh extra losses per month

        totalExtraLosses += estimatedExtraLosses;

        if (issue.pmPrediction.priority === 'critical') criticalCount++;

        affectedAssets.push({
          assetName: assetIssues.assetName,
          equipmentIssue: `${issue.componentName}: ${issue.pmPrediction.predictedIssue}`,
          estimatedExtraLosses,
          recommendation: issue.pmPrediction.recommendedAction,
        });
      }
    });
  });

  // Financial impact: value of lost energy + potential penalty costs
  const energyCostPerMWh = 65; // $/MWh average PJM wholesale
  const financialImpact = totalExtraLosses * energyCostPerMWh * 12; // annual

  return {
    totalEmissionsImpact: Math.round(totalExtraLosses * 0.386), // CO2 tonnes
    affectedAssets,
    complianceRisk: criticalCount > 3 ? 'high' : criticalCount > 1 ? 'medium' : 'low',
    financialImpact: Math.round(financialImpact),
  };
}
