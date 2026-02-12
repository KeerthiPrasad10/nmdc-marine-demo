import {
  ProposedChange,
  ImpactItem,
  ImpactAnalysisResult,
  ImpactChainNode,
  ImpactSeverity,
  ImpactCategory,
  FleetState,
} from './types';

export function analyzeImpact(
  change: ProposedChange,
  fleetState: FleetState
): ImpactAnalysisResult {
  const upstreamImpacts = calculateUpstreamImpacts(change, fleetState);
  const downstreamImpacts = calculateDownstreamImpacts(change, fleetState);
  const lateralImpacts = calculateLateralImpacts(change, fleetState);
  
  const allImpacts = [...upstreamImpacts, ...downstreamImpacts, ...lateralImpacts];
  const impactChain = buildImpactChain(change, allImpacts, fleetState);
  
  const summary = {
    totalImpacts: allImpacts.length,
    criticalCount: allImpacts.filter(i => i.severity === 'critical').length,
    highCount: allImpacts.filter(i => i.severity === 'high').length,
    mediumCount: allImpacts.filter(i => i.severity === 'medium').length,
    lowCount: allImpacts.filter(i => i.severity === 'low').length,
    positiveCount: allImpacts.filter(i => i.severity === 'positive').length,
  };
  
  const financialSummary = calculateFinancialImpact(change, allImpacts, fleetState);
  const esgImpact = calculateESGImpact(change, allImpacts, fleetState);
  const operationalImpact = calculateOperationalImpact(change, allImpacts, fleetState);
  const recommendations = generateRecommendations(change, allImpacts, fleetState);
  const alternativeScenarios = generateAlternatives(change, fleetState);
  
  const overallRisk = determineOverallRisk(summary);
  const overallConfidence = calculateConfidence(allImpacts);
  
  return {
    id: `analysis-${Date.now()}`,
    change,
    timestamp: new Date(),
    overallRisk,
    overallConfidence,
    summary,
    upstreamImpacts,
    downstreamImpacts,
    lateralImpacts,
    impactChain,
    financialSummary,
    esgImpact,
    operationalImpact,
    recommendations,
    alternativeScenarios,
  };
}

function calculateUpstreamImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  switch (change.type) {
    case 'vessel_assignment':
    case 'schedule_change':
      impacts.push(...getSupplyChainImpacts(change, state));
      impacts.push(...getCrewImpacts(change, state, 'upstream'));
      impacts.push(...getMaintenanceImpacts(change, state, 'upstream'));
      impacts.push(...getPortImpacts(change, state));
      break;
      
    case 'fuel_switch':
      impacts.push(...getFuelSupplyImpacts(change, state));
      impacts.push(...getEquipmentCompatibilityImpacts(change, state));
      break;
      
    case 'maintenance_schedule':
      impacts.push(...getSparePartsImpacts(change, state));
      impacts.push(...getCrewImpacts(change, state, 'upstream'));
      break;
      
    case 'new_project':
      impacts.push(...getResourceAvailabilityImpacts(change, state));
      impacts.push(...getBudgetImpacts(change, state, 'upstream'));
      break;
  }
  
  return impacts;
}

function calculateDownstreamImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  switch (change.type) {
    case 'vessel_assignment':
    case 'schedule_change':
      impacts.push(...getProjectTimelineImpacts(change, state));
      impacts.push(...getClientImpacts(change, state));
      impacts.push(...getRevenueImpacts(change, state));
      impacts.push(...getComplianceImpacts(change, state));
      break;
      
    case 'fuel_switch':
      impacts.push(...getEmissionsImpacts(change, state));
      impacts.push(...getComplianceImpacts(change, state));
      impacts.push(...getCostImpacts(change, state));
      break;
      
    case 'maintenance_schedule':
      impacts.push(...getVesselAvailabilityImpacts(change, state));
      impacts.push(...getProjectTimelineImpacts(change, state));
      break;
      
    case 'project_delay':
      impacts.push(...getClientImpacts(change, state));
      impacts.push(...getPenaltyImpacts(change, state));
      impacts.push(...getCascadingProjectImpacts(change, state));
      break;
      
    case 'equipment_failure':
      impacts.push(...getSafetyImpacts(change, state));
      impacts.push(...getVesselAvailabilityImpacts(change, state));
      impacts.push(...getInsuranceImpacts(change, state));
      break;
  }
  
  impacts.push(...getESGScoreImpacts(change, state));
  
  return impacts;
}

function calculateLateralImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  const otherVessels = state.vessels.filter(
    v => !change.affectedVessels.includes(v.id)
  );
  
  if (change.type === 'vessel_assignment' || change.type === 'schedule_change') {
    for (const vessel of otherVessels.slice(0, 3)) {
      const projects = state.projects.filter(p => 
        p.assignedVessels.includes(vessel.id) &&
        change.affectedProjects.some(ap => 
          state.projects.find(proj => proj.id === ap)?.client === p.client
        )
      );
      
      if (projects.length > 0) {
        impacts.push({
          id: `lateral-vessel-${vessel.id}`,
          category: 'operations',
          direction: 'lateral',
          title: `${vessel.name} May Need Reallocation`,
          description: `Schedule changes may affect other vessels serving the same client`,
          severity: 'medium',
          timeframe: 'short_term',
          confidence: 0.65,
          affectedEntities: {
            vessels: [vessel.id],
            projects: projects.map(p => p.id),
          },
        });
      }
    }
  }
  
  return impacts;
}

function getSupplyChainImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  const criticalParts = state.supplyChain.spareParts.filter(
    p => p.quantity <= p.reorderPoint
  );
  
  if (criticalParts.length > 0) {
    impacts.push({
      id: 'supply-chain-parts-risk',
      category: 'supply_chain',
      direction: 'upstream',
      title: 'Spare Parts Availability Risk',
      description: `${criticalParts.length} critical spare parts below reorder point. Schedule change may accelerate need.`,
      severity: criticalParts.length > 2 ? 'high' : 'medium',
      quantitativeImpact: {
        metric: 'Parts at Risk',
        currentValue: criticalParts.length,
        projectedValue: criticalParts.length + 1,
        unit: 'items',
        percentChange: 100 / criticalParts.length,
      },
      timeframe: 'short_term',
      confidence: 0.75,
      mitigations: [
        'Expedite reorder for critical parts',
        'Identify alternative suppliers',
        'Check inter-vessel parts availability',
      ],
      affectedEntities: {
        vessels: change.affectedVessels,
      },
    });
  }
  
  return impacts;
}

function getCrewImpacts(change: ProposedChange, state: FleetState, direction: 'upstream' | 'downstream'): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  const affectedCrew = state.crew.filter(c => 
    c.vesselId && change.affectedVessels.includes(c.vesselId)
  );
  
  const crewOnLeave = affectedCrew.filter(c => c.availability === 'leave').length;
  const crewInTraining = affectedCrew.filter(c => c.availability === 'training').length;
  
  if (crewOnLeave > 0 || crewInTraining > 0) {
    impacts.push({
      id: 'crew-availability',
      category: 'crew',
      direction,
      title: 'Crew Availability Constraint',
      description: `${crewOnLeave} crew on leave, ${crewInTraining} in training. May require reassignment.`,
      severity: crewOnLeave > 3 ? 'high' : 'medium',
      quantitativeImpact: {
        metric: 'Crew Unavailable',
        currentValue: 0,
        projectedValue: crewOnLeave + crewInTraining,
        unit: 'personnel',
        percentChange: ((crewOnLeave + crewInTraining) / Math.max(affectedCrew.length, 1)) * 100,
      },
      timeframe: 'immediate',
      confidence: 0.9,
      mitigations: [
        'Request crew rotation from other vessels',
        'Extend current crew assignments',
        'Engage contract crew if certified',
      ],
      affectedEntities: {
        vessels: change.affectedVessels,
        crew: affectedCrew.map(c => c.id),
      },
    });
  }
  
  return impacts;
}

function getMaintenanceImpacts(change: ProposedChange, state: FleetState, direction: 'upstream' | 'downstream'): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  const upcomingMaint = state.maintenance.filter(m =>
    change.affectedVessels.includes(m.vesselId) &&
    m.scheduledDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );
  
  if (upcomingMaint.length > 0) {
    const critical = upcomingMaint.filter(m => m.priority === 'critical' || !m.canDefer);
    
    impacts.push({
      id: 'maintenance-conflict',
      category: 'maintenance',
      direction,
      title: 'Scheduled Maintenance Conflict',
      description: `${upcomingMaint.length} maintenance tasks scheduled in next 30 days. ${critical.length} cannot be deferred.`,
      severity: critical.length > 0 ? 'high' : 'medium',
      quantitativeImpact: {
        metric: 'Maintenance Tasks Affected',
        currentValue: 0,
        projectedValue: upcomingMaint.length,
        unit: 'tasks',
        percentChange: 100,
      },
      timeframe: 'short_term',
      confidence: 0.85,
      mitigations: [
        'Reschedule non-critical maintenance',
        'Coordinate with port for maintenance berth',
        'Pre-position spare parts and crew',
      ],
      affectedEntities: {
        vessels: [...new Set(upcomingMaint.map(m => m.vesselId))],
      },
    });
  }
  
  return impacts;
}

function getPortImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  const lowAvailPorts = state.supplyChain.portContracts.filter(
    p => p.berthAvailability < 0.3
  );
  
  if (lowAvailPorts.length > 0) {
    impacts.push({
      id: 'port-congestion',
      category: 'supply_chain',
      direction: 'upstream',
      title: 'Port Berth Availability Risk',
      description: `${lowAvailPorts.length} ports have limited berth availability. May cause delays.`,
      severity: 'medium',
      timeframe: 'short_term',
      confidence: 0.7,
      mitigations: [
        'Book berths in advance',
        'Consider alternative ports',
        'Adjust vessel arrival timing',
      ],
      affectedEntities: {
        ports: lowAvailPorts.map(p => p.portName),
        vessels: change.affectedVessels,
      },
    });
  }
  
  return impacts;
}

function getFuelSupplyImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  const newFuelType = change.parameters.newFuelType as string;
  
  const contracts = state.supplyChain.fuelContracts.filter(
    c => c.fuelType === newFuelType
  );
  
  if (contracts.length === 0) {
    impacts.push({
      id: 'fuel-contract-needed',
      category: 'supply_chain',
      direction: 'upstream',
      title: 'New Fuel Supply Contract Required',
      description: `No existing contracts for ${newFuelType}. Must establish new supply chain.`,
      severity: 'high',
      quantitativeImpact: {
        metric: 'Lead Time',
        currentValue: 0,
        projectedValue: 30,
        unit: 'days',
        percentChange: 100,
      },
      timeframe: 'medium_term',
      confidence: 0.9,
      mitigations: [
        'Initiate contract negotiations immediately',
        'Identify spot market suppliers',
        'Phase transition with mixed fuel operation',
      ],
      affectedEntities: {
        vessels: change.affectedVessels,
      },
    });
  }
  
  return impacts;
}

function getEquipmentCompatibilityImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  const newFuelType = change.parameters.newFuelType as string;
  
  if (newFuelType === 'LNG') {
    impacts.push({
      id: 'equipment-retrofit',
      category: 'maintenance',
      direction: 'upstream',
      title: 'Engine Retrofit Required',
      description: 'LNG conversion requires significant engine modifications and crew training.',
      severity: 'critical',
      quantitativeImpact: {
        metric: 'Retrofit Cost',
        currentValue: 0,
        projectedValue: 2500000,
        unit: 'USD',
        percentChange: 100,
      },
      timeframe: 'long_term',
      confidence: 0.95,
      mitigations: [
        'Phase conversion during scheduled dry-dock',
        'Explore dual-fuel options',
        'Evaluate lease vs. retrofit economics',
      ],
      affectedEntities: {
        vessels: change.affectedVessels,
      },
    });
  }
  
  return impacts;
}

function getSparePartsImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  return getSupplyChainImpacts(change, state);
}

function getResourceAvailabilityImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  const availableVessels = state.vessels.filter(
    v => v.status === 'operational' && !v.project
  );
  
  const requiredTypes = change.parameters.requiredVesselTypes as string[] || [];
  
  for (const type of requiredTypes) {
    const available = availableVessels.filter(v => v.type === type);
    if (available.length === 0) {
      impacts.push({
        id: `resource-${type}`,
        category: 'operations',
        direction: 'upstream',
        title: `No Available ${type} Vessels`,
        description: `All ${type} vessels currently assigned. Must reallocate or charter.`,
        severity: 'high',
        timeframe: 'immediate',
        confidence: 0.95,
        mitigations: [
          'Accelerate current project completions',
          'Charter external vessel',
          'Evaluate project phasing to free vessels',
        ],
        affectedEntities: {
          vessels: state.vessels.filter(v => v.type === type).map(v => v.id),
        },
      });
    }
  }
  
  return impacts;
}

function getBudgetImpacts(change: ProposedChange, state: FleetState, direction: 'upstream' | 'downstream'): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  const remaining = state.financials.monthlyBudget - state.financials.currentSpend;
  const requiredBudget = (change.parameters.estimatedCost as number) || 0;
  
  if (requiredBudget > remaining) {
    impacts.push({
      id: 'budget-overrun',
      category: 'finance',
      direction,
      title: 'Budget Allocation Required',
      description: `Proposed change requires additional ${((requiredBudget - remaining) / 1000).toFixed(0)}K beyond current budget.`,
      severity: 'high',
      quantitativeImpact: {
        metric: 'Additional Budget',
        currentValue: remaining,
        projectedValue: requiredBudget,
        unit: 'USD',
        percentChange: ((requiredBudget - remaining) / remaining) * 100,
      },
      timeframe: 'immediate',
      confidence: 0.85,
      mitigations: [
        'Request budget reallocation from contingency',
        'Phase project to spread costs',
        'Negotiate milestone-based payments',
      ],
      affectedEntities: {
        projects: change.affectedProjects,
      },
    });
  }
  
  return impacts;
}

function getProjectTimelineImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  for (const projectId of change.affectedProjects) {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) continue;
    
    const delayDays = (change.parameters.delayDays as number) || 
      Math.ceil(Math.random() * 14 + 3);
    
    const daysToDeadline = Math.ceil(
      (project.deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );
    
    const willMissDeadline = delayDays > daysToDeadline;
    
    impacts.push({
      id: `timeline-${projectId}`,
      category: 'operations',
      direction: 'downstream',
      title: `${project.name} Timeline Impact`,
      description: willMissDeadline 
        ? `Project will miss deadline by ${delayDays - daysToDeadline} days`
        : `Project delayed by ${delayDays} days but within deadline`,
      severity: willMissDeadline ? 'critical' : 'medium',
      quantitativeImpact: {
        metric: 'Schedule Delay',
        currentValue: 0,
        projectedValue: delayDays,
        unit: 'days',
        percentChange: (delayDays / Math.max(daysToDeadline, 1)) * 100,
      },
      timeframe: 'short_term',
      confidence: 0.8,
      mitigations: willMissDeadline ? [
        'Accelerate work with additional resources',
        'Negotiate deadline extension with client',
        'Deploy additional vessel support',
      ] : [
        'Monitor schedule closely',
        'Prepare contingency resources',
      ],
      affectedEntities: {
        projects: [projectId],
        clients: [project.client],
      },
    });
  }
  
  return impacts;
}

function getClientImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  const affectedClients = new Set<string>();
  for (const projectId of change.affectedProjects) {
    const project = state.projects.find(p => p.id === projectId);
    if (project) affectedClients.add(project.client);
  }
  
  if (affectedClients.size > 0) {
    impacts.push({
      id: 'client-communication',
      category: 'client_relations',
      direction: 'downstream',
      title: 'Client Communication Required',
      description: `${affectedClients.size} client(s) must be notified of schedule changes`,
      severity: 'medium',
      timeframe: 'immediate',
      confidence: 1.0,
      mitigations: [
        'Prepare impact assessment report for clients',
        'Schedule client meetings within 48 hours',
        'Propose mitigation measures',
      ],
      affectedEntities: {
        clients: Array.from(affectedClients),
        projects: change.affectedProjects,
      },
    });
  }
  
  return impacts;
}

function getRevenueImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  const affectedVessels = state.vessels.filter(v => 
    change.affectedVessels.includes(v.id)
  );
  
  const dailyRevenueLoss = affectedVessels.reduce((sum, v) => sum + v.dailyRevenue, 0);
  const delayDays = (change.parameters.delayDays as number) || 7;
  const totalLoss = dailyRevenueLoss * delayDays;
  
  if (totalLoss > 0) {
    impacts.push({
      id: 'revenue-impact',
      category: 'finance',
      direction: 'downstream',
      title: 'Revenue Impact',
      description: `Estimated revenue loss of $${(totalLoss / 1000).toFixed(0)}K over ${delayDays} days`,
      severity: totalLoss > 500000 ? 'high' : totalLoss > 100000 ? 'medium' : 'low',
      quantitativeImpact: {
        metric: 'Revenue Loss',
        currentValue: 0,
        projectedValue: totalLoss,
        unit: 'USD',
        percentChange: 100,
      },
      timeframe: 'short_term',
      confidence: 0.75,
      affectedEntities: {
        vessels: change.affectedVessels,
      },
    });
  }
  
  return impacts;
}

function getComplianceImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  const upcomingAudits = state.compliance.upcomingAudits.filter(
    a => a.date <= new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  );
  
  if (upcomingAudits.length > 0) {
    impacts.push({
      id: 'compliance-audit-risk',
      category: 'compliance',
      direction: 'downstream',
      title: 'Compliance Audit Consideration',
      description: `${upcomingAudits.length} audits scheduled in next 60 days. Changes may affect compliance posture.`,
      severity: 'medium',
      timeframe: 'medium_term',
      confidence: 0.7,
      mitigations: [
        'Review compliance documentation',
        'Pre-audit internal assessment',
        'Document change rationale thoroughly',
      ],
      affectedEntities: {
        vessels: change.affectedVessels,
      },
    });
  }
  
  if (state.compliance.imo2030Progress < 80) {
    impacts.push({
      id: 'imo2030-risk',
      category: 'compliance',
      direction: 'downstream',
      title: 'IMO 2030 Target Risk',
      description: `Current progress at ${state.compliance.imo2030Progress}%. Changes should support, not hinder, decarbonization goals.`,
      severity: state.compliance.imo2030Progress < 60 ? 'high' : 'medium',
      quantitativeImpact: {
        metric: 'IMO 2030 Progress',
        currentValue: state.compliance.imo2030Progress,
        projectedValue: state.compliance.imo2030Progress - 2,
        unit: '%',
        percentChange: -2,
      },
      timeframe: 'long_term',
      confidence: 0.6,
      affectedEntities: {
        vessels: change.affectedVessels,
      },
    });
  }
  
  return impacts;
}

function getEmissionsImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  const affectedVessels = state.vessels.filter(v => 
    change.affectedVessels.includes(v.id)
  );
  
  const currentDailyEmissions = affectedVessels.reduce((sum, v) => sum + v.emissionsPerDay, 0);
  
  let reductionFactor = 1.0;
  if (change.type === 'fuel_switch') {
    const newFuel = change.parameters.newFuelType as string;
    if (newFuel === 'LNG') reductionFactor = 0.75;
    else if (newFuel === 'MDO') reductionFactor = 0.9;
    else if (newFuel === 'Hybrid') reductionFactor = 0.8;
  }
  
  const projectedEmissions = currentDailyEmissions * reductionFactor;
  const annualReduction = (currentDailyEmissions - projectedEmissions) * 365;
  
  impacts.push({
    id: 'emissions-change',
    category: 'esg',
    direction: 'downstream',
    title: reductionFactor < 1 ? 'Emissions Reduction' : 'Emissions Impact',
    description: reductionFactor < 1 
      ? `Estimated ${((1 - reductionFactor) * 100).toFixed(0)}% reduction in daily emissions`
      : 'No significant emissions change expected',
    severity: reductionFactor < 1 ? 'positive' : 'low',
    quantitativeImpact: {
      metric: 'Annual CO2 Reduction',
      currentValue: currentDailyEmissions * 365,
      projectedValue: projectedEmissions * 365,
      unit: 'tonnes',
      percentChange: (reductionFactor - 1) * 100,
    },
    timeframe: 'medium_term',
    confidence: 0.85,
    affectedEntities: {
      vessels: change.affectedVessels,
    },
  });
  
  return impacts;
}

function getCostImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  if (change.type === 'fuel_switch') {
    const newFuel = change.parameters.newFuelType as string;
    const currentContract = state.supplyChain.fuelContracts[0];
    const newContract = state.supplyChain.fuelContracts.find(c => c.fuelType === newFuel);
    
    if (currentContract && newContract) {
      const priceDiff = newContract.pricePerUnit - currentContract.pricePerUnit;
      const annualCostChange = priceDiff * currentContract.minCommitment * 12;
      
      impacts.push({
        id: 'fuel-cost-change',
        category: 'finance',
        direction: 'downstream',
        title: annualCostChange > 0 ? 'Fuel Cost Increase' : 'Fuel Cost Savings',
        description: `Annual fuel cost ${annualCostChange > 0 ? 'increase' : 'savings'} of $${Math.abs(annualCostChange / 1000).toFixed(0)}K`,
        severity: annualCostChange > 500000 ? 'high' : annualCostChange > 0 ? 'medium' : 'positive',
        quantitativeImpact: {
          metric: 'Annual Fuel Cost',
          currentValue: currentContract.pricePerUnit * currentContract.minCommitment * 12,
          projectedValue: newContract.pricePerUnit * currentContract.minCommitment * 12,
          unit: 'USD',
          percentChange: (priceDiff / currentContract.pricePerUnit) * 100,
        },
        timeframe: 'medium_term',
        confidence: 0.8,
        affectedEntities: {
          vessels: change.affectedVessels,
        },
      });
    }
  }
  
  return impacts;
}

function getVesselAvailabilityImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  const downtime = (change.parameters.estimatedDowntime as number) || 
    (change.type === 'equipment_failure' ? 14 : 7);
  
  const affectedProjects = state.projects.filter(p =>
    p.assignedVessels.some(v => change.affectedVessels.includes(v))
  );
  
  impacts.push({
    id: 'vessel-availability',
    category: 'operations',
    direction: 'downstream',
    title: 'Vessel Availability Reduction',
    description: `${change.affectedVessels.length} vessel(s) unavailable for ~${downtime} days. ${affectedProjects.length} project(s) affected.`,
    severity: affectedProjects.some(p => p.priority === 'critical') ? 'critical' : 'high',
    quantitativeImpact: {
      metric: 'Vessel Days Lost',
      currentValue: 0,
      projectedValue: downtime * change.affectedVessels.length,
      unit: 'days',
      percentChange: 100,
    },
    timeframe: 'immediate',
    confidence: 0.9,
    mitigations: [
      'Identify backup vessels',
      'Prioritize critical project work',
      'Negotiate scope adjustments with clients',
    ],
    affectedEntities: {
      vessels: change.affectedVessels,
      projects: affectedProjects.map(p => p.id),
    },
  });
  
  return impacts;
}

function getPenaltyImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  let totalPenalty = 0;
  const delayDays = (change.parameters.delayDays as number) || 7;
  
  for (const projectId of change.affectedProjects) {
    const project = state.projects.find(p => p.id === projectId);
    if (project) {
      totalPenalty += project.penaltyPerDayDelay * delayDays;
    }
  }
  
  if (totalPenalty > 0) {
    impacts.push({
      id: 'delay-penalties',
      category: 'finance',
      direction: 'downstream',
      title: 'Contractual Delay Penalties',
      description: `Potential penalties of $${(totalPenalty / 1000).toFixed(0)}K for ${delayDays} day delay`,
      severity: totalPenalty > 200000 ? 'critical' : totalPenalty > 50000 ? 'high' : 'medium',
      quantitativeImpact: {
        metric: 'Penalty Amount',
        currentValue: 0,
        projectedValue: totalPenalty,
        unit: 'USD',
        percentChange: 100,
      },
      timeframe: 'short_term',
      confidence: 0.95,
      mitigations: [
        'Negotiate force majeure provisions',
        'Document cause of delay thoroughly',
        'Propose compensation alternatives',
      ],
      affectedEntities: {
        projects: change.affectedProjects,
      },
    });
  }
  
  return impacts;
}

function getCascadingProjectImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  const directlyAffected = change.affectedProjects;
  const indirectlyAffected = state.projects.filter(p =>
    !directlyAffected.includes(p.id) &&
    p.assignedVessels.some(v => 
      state.projects
        .filter(proj => directlyAffected.includes(proj.id))
        .some(proj => proj.assignedVessels.includes(v))
    )
  );
  
  if (indirectlyAffected.length > 0) {
    impacts.push({
      id: 'cascading-projects',
      category: 'operations',
      direction: 'downstream',
      title: 'Cascading Project Effects',
      description: `${indirectlyAffected.length} additional project(s) may be affected due to shared vessel resources`,
      severity: 'medium',
      timeframe: 'medium_term',
      confidence: 0.65,
      affectedEntities: {
        projects: indirectlyAffected.map(p => p.id),
        vessels: [...new Set(indirectlyAffected.flatMap(p => p.assignedVessels))],
      },
    });
  }
  
  return impacts;
}

function getSafetyImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  if (change.type === 'equipment_failure') {
    const severity = (change.parameters.severity as string) || 'medium';
    
    impacts.push({
      id: 'safety-assessment',
      category: 'safety',
      direction: 'downstream',
      title: 'Safety Assessment Required',
      description: 'Equipment failure requires immediate safety review and incident documentation',
      severity: severity === 'critical' ? 'critical' : 'high',
      timeframe: 'immediate',
      confidence: 1.0,
      mitigations: [
        'Conduct immediate safety stand-down',
        'Complete incident report within 24 hours',
        'Review similar equipment across fleet',
      ],
      affectedEntities: {
        vessels: change.affectedVessels,
        crew: state.crew.filter(c => c.vesselId && change.affectedVessels.includes(c.vesselId)).map(c => c.id),
      },
    });
  }
  
  return impacts;
}

function getInsuranceImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  if (change.type === 'equipment_failure') {
    const claimAmount = (change.parameters.estimatedDamage as number) || 100000;
    const premiumIncrease = claimAmount * 0.05;
    
    impacts.push({
      id: 'insurance-claim',
      category: 'finance',
      direction: 'downstream',
      title: 'Insurance Claim & Premium Impact',
      description: `Claim of ~$${(claimAmount / 1000).toFixed(0)}K may increase annual premium by ~$${(premiumIncrease / 1000).toFixed(0)}K`,
      severity: claimAmount > 500000 ? 'high' : 'medium',
      quantitativeImpact: {
        metric: 'Premium Increase',
        currentValue: state.financials.insurancePremiumBase,
        projectedValue: state.financials.insurancePremiumBase + premiumIncrease,
        unit: 'USD/year',
        percentChange: (premiumIncrease / state.financials.insurancePremiumBase) * 100,
      },
      timeframe: 'long_term',
      confidence: 0.7,
      mitigations: [
        'Document incident thoroughly',
        'Implement corrective actions',
        'Review coverage adequacy',
      ],
      affectedEntities: {
        vessels: change.affectedVessels,
      },
    });
  }
  
  return impacts;
}

function getESGScoreImpacts(change: ProposedChange, state: FleetState): ImpactItem[] {
  const impacts: ImpactItem[] = [];
  
  let scoreChange = 0;
  let description = '';
  
  switch (change.type) {
    case 'fuel_switch':
      const newFuel = change.parameters.newFuelType as string;
      if (newFuel === 'LNG') {
        scoreChange = 5;
        description = 'LNG transition improves environmental score';
      } else if (newFuel === 'Hybrid') {
        scoreChange = 3;
        description = 'Hybrid operation improves environmental score';
      }
      break;
      
    case 'equipment_failure':
      scoreChange = -2;
      description = 'Equipment incident negatively impacts governance score';
      break;
      
    case 'project_delay':
      scoreChange = -1;
      description = 'Project delays may affect stakeholder confidence';
      break;
  }
  
  if (scoreChange !== 0) {
    impacts.push({
      id: 'esg-score-impact',
      category: 'esg',
      direction: 'downstream',
      title: 'ESG Score Impact',
      description,
      severity: scoreChange > 0 ? 'positive' : scoreChange < -3 ? 'high' : 'medium',
      quantitativeImpact: {
        metric: 'ESG Score Change',
        currentValue: 75,
        projectedValue: 75 + scoreChange,
        unit: 'points',
        percentChange: (scoreChange / 75) * 100,
      },
      timeframe: 'medium_term',
      confidence: 0.7,
      affectedEntities: {
        vessels: change.affectedVessels,
      },
    });
  }
  
  return impacts;
}

function buildImpactChain(
  change: ProposedChange,
  impacts: ImpactItem[],
  state: FleetState
): ImpactChainNode[] {
  const rootImpacts = impacts.filter(i => !i.dependsOn || i.dependsOn.length === 0);
  
  const buildNode = (impact: ImpactItem, depth: number): ImpactChainNode => {
    const children = impacts
      .filter(i => i.dependsOn?.includes(impact.id))
      .map(i => buildNode(i, depth + 1));
    
    return {
      id: impact.id,
      impact,
      children,
      depth,
    };
  };
  
  return rootImpacts.map(i => buildNode(i, 0));
}

function calculateFinancialImpact(
  change: ProposedChange,
  impacts: ImpactItem[],
  state: FleetState
): ImpactAnalysisResult['financialSummary'] {
  let estimatedCostImpact = 0;
  let revenueImpact = 0;
  let carbonCreditImpact = 0;
  let insuranceImpact = 0;
  
  for (const impact of impacts) {
    if (impact.category === 'finance' && impact.quantitativeImpact) {
      if (impact.id.includes('revenue')) {
        revenueImpact -= impact.quantitativeImpact.projectedValue;
      } else if (impact.id.includes('penalty') || impact.id.includes('cost')) {
        estimatedCostImpact += impact.quantitativeImpact.projectedValue;
      } else if (impact.id.includes('insurance')) {
        insuranceImpact += impact.quantitativeImpact.projectedValue - impact.quantitativeImpact.currentValue;
      }
    }
  }
  
  const esgImpact = impacts.find(i => i.category === 'esg');
  if (esgImpact?.quantitativeImpact) {
    const co2Change = esgImpact.quantitativeImpact.projectedValue - esgImpact.quantitativeImpact.currentValue;
    carbonCreditImpact = co2Change * state.financials.carbonCreditPrice;
  }
  
  return {
    estimatedCostImpact,
    revenueImpact,
    carbonCreditImpact,
    insuranceImpact,
    totalFinancialImpact: estimatedCostImpact + Math.abs(revenueImpact) + carbonCreditImpact + insuranceImpact,
    currency: 'USD',
  };
}

function calculateESGImpact(
  change: ProposedChange,
  impacts: ImpactItem[],
  state: FleetState
): ImpactAnalysisResult['esgImpact'] {
  const emissionsImpact = impacts.find(i => i.id === 'emissions-change');
  const esgScoreImpact = impacts.find(i => i.id === 'esg-score-impact');
  const complianceImpact = impacts.find(i => i.category === 'compliance');
  
  return {
    co2Change: emissionsImpact?.quantitativeImpact?.percentChange || 0,
    noxChange: (emissionsImpact?.quantitativeImpact?.percentChange || 0) * 0.8,
    complianceRiskChange: complianceImpact ? 5 : 0,
    esgScoreChange: esgScoreImpact?.quantitativeImpact 
      ? esgScoreImpact.quantitativeImpact.projectedValue - esgScoreImpact.quantitativeImpact.currentValue 
      : 0,
  };
}

function calculateOperationalImpact(
  change: ProposedChange,
  impacts: ImpactItem[],
  state: FleetState
): ImpactAnalysisResult['operationalImpact'] {
  const timelineImpacts = impacts.filter(i => i.id.startsWith('timeline-'));
  const maintenanceImpact = impacts.find(i => i.category === 'maintenance');
  const availabilityImpact = impacts.find(i => i.id === 'vessel-availability');
  
  let totalDelayDays = 0;
  for (const impact of timelineImpacts) {
    if (impact.quantitativeImpact) {
      totalDelayDays += impact.quantitativeImpact.projectedValue;
    }
  }
  
  return {
    utilizationChange: availabilityImpact ? -5 : 0,
    scheduleDelayDays: totalDelayDays,
    affectedProjectCount: change.affectedProjects.length,
    maintenanceReschedules: maintenanceImpact?.quantitativeImpact?.projectedValue || 0,
  };
}

function generateRecommendations(
  change: ProposedChange,
  impacts: ImpactItem[],
  state: FleetState
): ImpactAnalysisResult['recommendations'] {
  const recommendations: ImpactAnalysisResult['recommendations'] = [];
  
  const criticalImpacts = impacts.filter(i => i.severity === 'critical');
  const highImpacts = impacts.filter(i => i.severity === 'high');
  
  for (const impact of criticalImpacts) {
    if (impact.mitigations?.[0]) {
      recommendations.push({
        priority: 'critical',
        action: impact.mitigations[0],
        rationale: `Addresses: ${impact.title}`,
        expectedBenefit: 'Risk reduction',
      });
    }
  }
  
  for (const impact of highImpacts.slice(0, 3)) {
    if (impact.mitigations?.[0]) {
      recommendations.push({
        priority: 'high',
        action: impact.mitigations[0],
        rationale: `Addresses: ${impact.title}`,
        expectedBenefit: 'Impact mitigation',
      });
    }
  }
  
  recommendations.push({
    priority: 'medium',
    action: 'Schedule stakeholder review meeting',
    rationale: 'Ensure alignment on change impacts',
    expectedBenefit: 'Improved coordination',
  });
  
  return recommendations;
}

function generateAlternatives(
  change: ProposedChange,
  state: FleetState
): ImpactAnalysisResult['alternativeScenarios'] {
  const alternatives: ImpactAnalysisResult['alternativeScenarios'] = [];
  
  alternatives.push({
    id: 'alt-phased',
    name: 'Phased Implementation',
    description: 'Implement change gradually over 3 phases',
    overallRisk: 'medium',
    financialImpact: -15,
  });
  
  alternatives.push({
    id: 'alt-accelerated',
    name: 'Accelerated Timeline',
    description: 'Complete change faster with additional resources',
    overallRisk: 'high',
    financialImpact: 25,
  });
  
  alternatives.push({
    id: 'alt-deferred',
    name: 'Defer to Next Quarter',
    description: 'Postpone change to reduce immediate impact',
    overallRisk: 'low',
    financialImpact: -5,
  });
  
  return alternatives;
}

function determineOverallRisk(summary: ImpactAnalysisResult['summary']): ImpactSeverity {
  if (summary.criticalCount > 0) return 'critical';
  if (summary.highCount > 2) return 'high';
  if (summary.highCount > 0 || summary.mediumCount > 3) return 'medium';
  if (summary.positiveCount > summary.lowCount) return 'positive';
  return 'low';
}

function calculateConfidence(impacts: ImpactItem[]): number {
  if (impacts.length === 0) return 0;
  const avgConfidence = impacts.reduce((sum, i) => sum + i.confidence, 0) / impacts.length;
  return Math.round(avgConfidence * 100) / 100;
}

export function generateMockFleetState(): FleetState {
  return {
    vessels: [
      { id: 'v1', name: 'Al Mirfa', type: 'dredger', status: 'operational', location: { lat: 24.5, lng: 54.0 }, healthScore: 85, fuelLevel: 72, crewCount: 45, dailyOperatingCost: 85000, dailyRevenue: 120000, emissionsPerDay: 45 },
      { id: 'v2', name: 'Al Hamra', type: 'dredger', status: 'operational', location: { lat: 24.6, lng: 54.1 }, healthScore: 78, fuelLevel: 65, crewCount: 42, dailyOperatingCost: 82000, dailyRevenue: 115000, emissionsPerDay: 42 },
      { id: 'v3', name: 'SEP-550', type: 'jack_up_barge', status: 'operational', project: 'ZADCO', location: { lat: 24.4, lng: 53.9 }, healthScore: 73, fuelLevel: 80, crewCount: 35, dailyOperatingCost: 65000, dailyRevenue: 95000, emissionsPerDay: 28 },
      { id: 'v4', name: 'PLB-648', type: 'pipe_lay_barge', status: 'maintenance', location: { lat: 24.3, lng: 54.2 }, healthScore: 60, fuelLevel: 45, crewCount: 50, dailyOperatingCost: 95000, dailyRevenue: 140000, emissionsPerDay: 55 },
    ],
    projects: [
      { id: 'p1', name: 'ZADCO Upper Zakum', client: 'ZADCO', status: 'active', priority: 'critical', progress: 45, budget: { allocated: 15000000, spent: 6750000 }, deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), assignedVessels: ['v1', 'v3'], dailyBurnRate: 150000, penaltyPerDayDelay: 50000 },
      { id: 'p2', name: 'ADNOC LNG Terminal', client: 'ADNOC', status: 'active', priority: 'high', progress: 30, budget: { allocated: 25000000, spent: 7500000 }, deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), assignedVessels: ['v2', 'v4'], dailyBurnRate: 200000, penaltyPerDayDelay: 75000 },
      { id: 'p3', name: 'Ras Al Khair Expansion', client: 'Saudi Aramco', status: 'planning', priority: 'medium', progress: 10, budget: { allocated: 8000000, spent: 800000 }, deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), assignedVessels: [], dailyBurnRate: 80000, penaltyPerDayDelay: 25000 },
    ],
    crew: [
      { id: 'c1', name: 'Ahmed Hassan', role: 'Captain', vesselId: 'v1', certifications: ['Master Mariner', 'STCW'], availability: 'assigned' },
      { id: 'c2', name: 'Mohammed Ali', role: 'Chief Engineer', vesselId: 'v1', certifications: ['Marine Engineering', 'STCW'], availability: 'assigned' },
      { id: 'c3', name: 'Youssef Ibrahim', role: 'Captain', vesselId: 'v2', certifications: ['Master Mariner', 'STCW'], availability: 'assigned' },
      { id: 'c4', name: 'Omar Khalid', role: 'First Officer', vesselId: 'v3', certifications: ['Officer of Watch', 'STCW'], availability: 'leave' },
      { id: 'c5', name: 'Khalid Saeed', role: 'Engineer', certifications: ['Marine Engineering'], availability: 'training' },
    ],
    maintenance: [
      { id: 'm1', vesselId: 'v1', type: 'Engine Overhaul', scheduledDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), estimatedDuration: 7, priority: 'high', canDefer: false },
      { id: 'm2', vesselId: 'v3', type: 'Crane Inspection', scheduledDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), estimatedDuration: 3, priority: 'medium', canDefer: true },
      { id: 'm3', vesselId: 'v2', type: 'Hull Cleaning', scheduledDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), estimatedDuration: 2, priority: 'low', canDefer: true },
    ],
    supplyChain: {
      spareParts: [
        { id: 'sp1', name: 'Main Engine Bearings', quantity: 4, reorderPoint: 5, leadTimeDays: 21 },
        { id: 'sp2', name: 'Hydraulic Pumps', quantity: 2, reorderPoint: 3, leadTimeDays: 14 },
        { id: 'sp3', name: 'Generator Parts Kit', quantity: 8, reorderPoint: 4, leadTimeDays: 7 },
      ],
      fuelContracts: [
        { id: 'fc1', fuelType: 'HFO', pricePerUnit: 450, minCommitment: 10000, expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
        { id: 'fc2', fuelType: 'MDO', pricePerUnit: 680, minCommitment: 5000, expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) },
        { id: 'fc3', fuelType: 'LNG', pricePerUnit: 520, minCommitment: 3000, expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000) },
      ],
      portContracts: [
        { id: 'pc1', portName: 'Abu Dhabi Port', berthAvailability: 0.7, dailyRate: 15000 },
        { id: 'pc2', portName: 'Jebel Ali', berthAvailability: 0.25, dailyRate: 18000 },
        { id: 'pc3', portName: 'Khalifa Port', berthAvailability: 0.85, dailyRate: 12000 },
      ],
    },
    compliance: {
      imo2030Progress: 65,
      ciiRatings: { v1: 'B', v2: 'C', v3: 'B', v4: 'C' },
      upcomingAudits: [
        { date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), type: 'ISM Audit' },
        { date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), type: 'CII Verification' },
      ],
      certificates: [
        { name: 'SOLAS', vesselId: 'v1', expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) },
        { name: 'ISM', vesselId: 'v2', expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      ],
    },
    financials: {
      monthlyBudget: 5000000,
      currentSpend: 3200000,
      carbonCreditBalance: 5000,
      carbonCreditPrice: 85,
      insurancePremiumBase: 2500000,
    },
  };
}






