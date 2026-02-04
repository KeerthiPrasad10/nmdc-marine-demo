import {
  VesselEmissions,
  FleetEmissionsSummary,
  ComplianceTarget,
  ESGScore,
  DecarbonizationPathway,
} from './types';
import { getVesselIssues, VESSEL_ISSUES, getVesselIssueSummary } from '../vessel-issues';

// Generate vessel emissions - NOW CONNECTED TO PM HEALTH
// Degraded equipment = higher emissions due to inefficiency
export function generateVesselEmissions(vessels: Array<{ id: string; name: string; type: string }>): VesselEmissions[] {
  return vessels.map(vessel => {
    const baseEmissions = {
      crane_barge: { co2: 45, nox: 850, sox: 120, pm: 25 },
      dredger: { co2: 62, nox: 1100, sox: 160, pm: 35 },
      supply_vessel: { co2: 28, nox: 520, sox: 75, pm: 15 },
      survey_vessel: { co2: 18, nox: 340, sox: 48, pm: 10 },
      tugboat: { co2: 22, nox: 410, sox: 58, pm: 12 },
      pipelay_barge: { co2: 52, nox: 920, sox: 135, pm: 28 },
      derrick_barge: { co2: 58, nox: 1020, sox: 150, pm: 32 },
      jack_up: { co2: 48, nox: 880, sox: 128, pm: 26 },
    };

    const base = baseEmissions[vessel.type as keyof typeof baseEmissions] || baseEmissions.supply_vessel;
    
    // Get vessel health from PM issues
    const vesselSummary = getVesselIssueSummary(vessel.id);
    const healthFactor = vesselSummary.worstHealth / 100;
    
    // Degraded equipment = higher emissions (inverse relationship)
    // 100% health = 1.0x emissions, 50% health = 1.25x emissions
    const degradationPenalty = 1 + (1 - healthFactor) * 0.5;
    
    // Base variance + degradation penalty
    const variance = (0.85 + Math.random() * 0.3) * degradationPenalty;

    const emissions = {
      co2: base.co2 * variance,
      nox: base.nox * variance,
      sox: base.sox * variance,
      pm: base.pm * variance,
    };

    const fuelConsumed = emissions.co2 * 1000 / 2.68; // ~2.68 kg CO2 per liter
    
    // Efficiency is worse for vessels with issues
    const baseEfficiency = 15 + Math.random() * 15;
    const efficiency = baseEfficiency * degradationPenalty;
    
    // CII rating based on efficiency and health
    let ciiRating: 'A' | 'B' | 'C' | 'D' | 'E' = 'C';
    if (efficiency < 18 && healthFactor > 0.7) ciiRating = 'A';
    else if (efficiency < 22 && healthFactor > 0.6) ciiRating = 'B';
    else if (efficiency < 28) ciiRating = 'C';
    else if (efficiency < 35) ciiRating = 'D';
    else ciiRating = 'E';

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
      ciiRating,
      etsEligible: vessel.type === 'supply_vessel' || vessel.type === 'dredger',
      // NEW: Link to PM issues
      healthScore: vesselSummary.worstHealth,
      hasMaintenanceIssues: vesselSummary.issueCount > 0,
      maintenanceImpact: vesselSummary.hasCritical 
        ? 'Critical equipment issues increasing emissions by ~25%'
        : vesselSummary.hasHighPriority
        ? 'Equipment degradation increasing emissions by ~15%'
        : vesselSummary.issueCount > 0
        ? 'Minor efficiency impact from pending maintenance'
        : 'Optimal equipment health',
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
  
  // Calculate how much emissions are elevated due to PM issues
  const vesselsWithIssues = vesselEmissions.filter(v => (v as VesselEmissions & { hasMaintenanceIssues?: boolean }).hasMaintenanceIssues);
  const emissionsImpactFromMaintenance = vesselsWithIssues.length / vesselEmissions.length * 15; // ~15% impact

  // Determine best/worst performers
  const sorted = [...vesselEmissions].sort((a, b) => a.efficiency - b.efficiency);
  const bestPerformer = sorted[0]?.vesselName || 'N/A';
  const worstPerformer = sorted[sorted.length - 1]?.vesselName || 'N/A';

  return {
    ...summary,
    avgEfficiency: summary.totalEfficiency / vesselEmissions.length,
    vesselCount: vesselEmissions.length,
    period: 'This Month',
    trend: {
      co2Change: -5 + emissionsImpactFromMaintenance + Math.random() * 5,
      efficiencyChange: -3 + Math.random() * 8,
    },
    bestPerformer,
    worstPerformer,
  };
}

// Generate compliance targets - NOW CONNECTED TO PM HEALTH
export function generateComplianceTargets(): ComplianceTarget[] {
  const now = new Date();
  
  // Calculate fleet-wide health impact on compliance
  let criticalCount = 0;
  let highCount = 0;
  Object.values(VESSEL_ISSUES).forEach(vi => {
    vi.issues.forEach(issue => {
      if (issue.pmPrediction.priority === 'critical') criticalCount++;
      if (issue.pmPrediction.priority === 'high') highCount++;
    });
  });
  
  // Equipment issues affect CII compliance
  const ciiImpact = criticalCount > 2 ? 'at_risk' : highCount > 4 ? 'at_risk' : 'on_track';
  const eexiImpact = criticalCount > 3 ? 'behind' : criticalCount > 1 ? 'at_risk' : 'on_track';
  
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
      currentValue: criticalCount > 2 ? 68 : highCount > 4 ? 74 : 78,
      unit: 'Score (A-E)',
      deadline: new Date(now.getFullYear() + 1, 0, 1),
      status: ciiImpact as 'on_track' | 'at_risk' | 'behind',
      description: `Maintain fleet average CII rating of B or better. ${criticalCount + highCount} vessels with PM issues affecting efficiency.`,
    },
    {
      id: 'eexi-2023',
      name: 'EEXI Compliance',
      type: 'EEXI',
      targetValue: 100,
      currentValue: criticalCount > 3 ? 82 : criticalCount > 1 ? 88 : 92,
      unit: '% fleet compliant',
      deadline: new Date(now.getFullYear(), 11, 31),
      status: eexiImpact as 'on_track' | 'at_risk' | 'behind',
      description: `All vessels must meet EEXI requirements. ${criticalCount} critical equipment issues may impact compliance.`,
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

// Generate ESG score - NOW CONNECTED TO PM HEALTH
export function generateESGScore(): ESGScore {
  // Calculate health impact on environmental score
  let criticalCount = 0;
  let totalHealthScore = 0;
  let vesselCount = 0;
  
  Object.values(VESSEL_ISSUES).forEach(vi => {
    vesselCount++;
    vi.issues.forEach(issue => {
      if (issue.pmPrediction.priority === 'critical') criticalCount++;
      totalHealthScore += issue.healthScore;
    });
  });
  
  const avgHealth = vesselCount > 0 ? totalHealthScore / (vesselCount * 3) : 75; // 3 issues per vessel
  
  // Environmental score affected by equipment health
  const envBaseScore = 72;
  const envPenalty = criticalCount * 2 + (75 - avgHealth) * 0.3;
  const environmentalScore = Math.max(55, Math.round(envBaseScore - envPenalty));
  
  // Carbon emissions factor affected by equipment efficiency
  const carbonScore = Math.max(50, Math.round(68 - criticalCount * 3));
  const fuelEfficiencyScore = Math.max(55, Math.round(75 - criticalCount * 2));
  
  return {
    overall: Math.round((environmentalScore * 0.4 + 81 * 0.35 + 78 * 0.25)),
    environmental: {
      score: environmentalScore,
      factors: [
        { name: 'Carbon Emissions', score: carbonScore, weight: 0.35 },
        { name: 'Fuel Efficiency', score: fuelEfficiencyScore, weight: 0.25 },
        { name: 'Waste Management', score: 82, weight: 0.15 },
        { name: 'Biodiversity Impact', score: 70, weight: 0.15 },
        { name: 'Water Usage', score: 78, weight: 0.10 },
      ],
    },
    social: {
      score: 81,
      factors: [
        { name: 'Crew Safety', score: criticalCount > 2 ? 82 : 88, weight: 0.30 },
        { name: 'Training & Development', score: 79, weight: 0.25 },
        { name: 'Work-Life Balance', score: 75, weight: 0.20 },
        { name: 'Diversity & Inclusion', score: 82, weight: 0.15 },
        { name: 'Community Engagement', score: 78, weight: 0.10 },
      ],
    },
    governance: {
      score: 78,
      factors: [
        { name: 'Regulatory Compliance', score: criticalCount > 3 ? 85 : 92, weight: 0.30 },
        { name: 'Risk Management', score: criticalCount > 2 ? 68 : 75, weight: 0.25 },
        { name: 'Transparency', score: 72, weight: 0.20 },
        { name: 'Ethics & Integrity', score: 85, weight: 0.15 },
        { name: 'Data Security', score: 68, weight: 0.10 },
      ],
    },
    trend: criticalCount > 2 ? 'declining' : 'improving',
    lastUpdated: new Date(),
  };
}

export function generateDecarbonizationPathway(): DecarbonizationPathway {
  // Calculate investment needs based on current equipment health
  let criticalCount = 0;
  Object.values(VESSEL_ISSUES).forEach(vi => {
    vi.issues.forEach(issue => {
      if (issue.pmPrediction.priority === 'critical') criticalCount++;
    });
  });
  
  // More critical issues = higher near-term investment needed
  const urgentMaintenanceInvestment = criticalCount * 500000;
  
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
          criticalCount > 2 ? 'Critical equipment overhaul' : 'Predictive maintenance rollout',
        ],
        investment: 5000000 + urgentMaintenanceInvestment,
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
    totalInvestment: 255000000 + urgentMaintenanceInvestment,
    totalSavings: 120500000,
    paybackPeriod: 12,
    riskLevel: criticalCount > 3 ? 'high' : criticalCount > 1 ? 'medium' : 'low',
  };
}

// Monthly emissions trend data - shows impact of maintenance issues
export function generateEmissionsTrend(months: number = 12): Array<{
  month: string;
  co2: number;
  target: number;
  maintenanceImpact?: number;
}> {
  const data = [];
  const now = new Date();
  
  // Calculate current maintenance impact
  let criticalCount = 0;
  Object.values(VESSEL_ISSUES).forEach(vi => {
    vi.issues.forEach(issue => {
      if (issue.pmPrediction.priority === 'critical') criticalCount++;
    });
  });
  
  const currentMaintenanceImpact = criticalCount * 8; // Each critical issue adds ~8 tonnes CO2/month
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    
    // Simulate declining emissions trend with recent spike from equipment issues
    const baseEmissions = 450 - (months - i) * 3;
    const variance = Math.random() * 40 - 20;
    
    // Recent months show impact of equipment degradation
    const recentImpact = i < 3 ? currentMaintenanceImpact * (1 - i * 0.3) : 0;
    
    data.push({
      month: monthName,
      co2: baseEmissions + variance + recentImpact,
      target: 400 - (months - i) * 2.5,
      maintenanceImpact: recentImpact > 0 ? recentImpact : undefined,
    });
  }
  
  return data;
}

// NEW: Get ESG impact summary from PM issues
export function getESGImpactFromMaintenance(): {
  totalEmissionsImpact: number; // additional tonnes CO2 from degraded equipment
  affectedVessels: Array<{
    vesselName: string;
    equipmentIssue: string;
    estimatedExtraEmissions: number;
    recommendation: string;
  }>;
  complianceRisk: 'low' | 'medium' | 'high';
  financialImpact: number; // estimated cost of carbon penalties
} {
  const affectedVessels: Array<{
    vesselName: string;
    equipmentIssue: string;
    estimatedExtraEmissions: number;
    recommendation: string;
  }> = [];
  
  let totalExtraEmissions = 0;
  let criticalCount = 0;
  
  Object.values(VESSEL_ISSUES).forEach(vesselIssues => {
    vesselIssues.issues.forEach(issue => {
      if (issue.pmPrediction.priority === 'critical' || issue.pmPrediction.priority === 'high') {
        // Estimate extra emissions from degraded equipment
        // Lower health = higher emissions (inverse relationship)
        const healthPenalty = (100 - issue.healthScore) / 100;
        const estimatedExtraEmissions = healthPenalty * 15; // Up to 15 tonnes extra per month
        
        totalExtraEmissions += estimatedExtraEmissions;
        
        if (issue.pmPrediction.priority === 'critical') criticalCount++;
        
        affectedVessels.push({
          vesselName: vesselIssues.vesselName,
          equipmentIssue: `${issue.equipmentName}: ${issue.pmPrediction.predictedIssue}`,
          estimatedExtraEmissions,
          recommendation: issue.pmPrediction.recommendedAction,
        });
      }
    });
  });
  
  // Calculate financial impact (EU ETS carbon price ~$80-100/tonne)
  const carbonPrice = 90; // USD per tonne
  const financialImpact = totalExtraEmissions * carbonPrice * 12; // Annual impact
  
  return {
    totalEmissionsImpact: Math.round(totalExtraEmissions),
    affectedVessels,
    complianceRisk: criticalCount > 3 ? 'high' : criticalCount > 1 ? 'medium' : 'low',
    financialImpact: Math.round(financialImpact),
  };
}
