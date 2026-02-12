/**
 * Hero Demo Scenarios for Exelon GridIQ
 * 
 * Three flagship narratives that showcase the platform's value:
 * 
 * 1. Aging Transformer — BGE Westport 230/115kV (1974, HI=38)
 *    A 52-year-old transformer approaching end of life. DGA trending shows
 *    accelerating thermal degradation. Platform detects the pattern 6 months
 *    before catastrophic failure and orchestrates proactive replacement.
 * 
 * 2. DGA Trending Alert — ComEd Electric Junction 345/138kV (1985, HI=44)
 *    Online DGA monitoring detects sudden acetylene spike indicating arcing.
 *    AI classifies fault using Duval Triangle, recommends immediate de-loading
 *    and oil sampling. Prevents catastrophic failure saving $12M in damages.
 * 
 * 3. Avoided Outage — Heat Wave + Peak Load
 *    Summer heat wave drives transformer loading to 105% of nameplate.
 *    Platform detects risk 4 hours ahead, orchestrates load transfer to
 *    adjacent feeders, deploys mobile substation, achieves zero customer impact.
 */

// ============================================================================
// SCENARIO 1: Aging Transformer Approaching End of Life
// ============================================================================

export interface DecisionOption {
  label: string;
  description: string;
  pros: string[];
  cons: string[];
  financialImpact: { label: string; value: string; trend: 'positive' | 'negative' | 'neutral' };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  customerImpact: string;
  timeline: string;
}

export interface DecisionSupport {
  summary: string;
  urgency: 'immediate' | 'within_24h' | 'within_week' | 'within_month';
  confidenceScore: number;
  approveOption: DecisionOption;
  deferOption: DecisionOption;
  keyRisks: string[];
}

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  assetTag: string;
  assetName: string;
  opCo: string;
  category: 'aging_asset' | 'dga_alert' | 'avoided_outage';
  severity: 'critical' | 'high' | 'medium';
  timeline: ScenarioEvent[];
  outcome: ScenarioOutcome;
  metrics: ScenarioMetric[];
  decisionSupport: DecisionSupport;
}

export interface ScenarioEvent {
  id: string;
  timestamp: string;
  type: 'detection' | 'analysis' | 'recommendation' | 'action' | 'resolution';
  title: string;
  description: string;
  icon: string; // lucide icon name
  data?: Record<string, unknown>;
}

export interface ScenarioOutcome {
  title: string;
  description: string;
  costAvoided: string;
  customersProtected: number;
  outageHoursAvoided: number;
}

export interface ScenarioMetric {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  context: string;
}

// ============================================================================

export const DEMO_SCENARIOS: DemoScenario[] = [
  // ---- Scenario 1: Aging Transformer ----
  {
    id: 'aging-transformer',
    title: 'Aging Transformer Lifecycle Management',
    subtitle: 'Proactive replacement prevents catastrophic failure',
    description: 'The Westport 230/115kV Auto-Transformer #1 has been in service since 1974 — over 50 years. Health index trending shows accelerating degradation. DGA analysis reveals thermal faulting consistent with winding insulation breakdown. GridIQ detected the pattern 6 months before projected failure and orchestrated a proactive replacement during a planned maintenance window.',
    assetTag: 'BGE-TF-001',
    assetName: 'Westport 230/115kV Auto-Transformer #1',
    opCo: 'BGE',
    category: 'aging_asset',
    severity: 'critical',
    timeline: [
      {
        id: 'at-1',
        timestamp: '2025-06-15T08:30:00Z',
        type: 'detection',
        title: 'Health Index Decline Detected',
        description: 'AI monitoring detected a 12-point health index decline over 90 days (50 → 38). Rate of decline is 3× the fleet average for this asset class.',
        icon: 'TrendingDown',
        data: { healthIndex: 38, previousHI: 50, declineRate: '12 points / 90 days' },
      },
      {
        id: 'at-2',
        timestamp: '2025-06-15T09:15:00Z',
        type: 'analysis',
        title: 'DGA Trend Analysis — IEEE C57.104',
        description: 'Dissolved gas analysis shows TDCG at 1,920 ppm (Condition 3). Hydrogen trending indicates thermal degradation. Duval Triangle analysis classifies fault as T2 (thermal fault 300-700°C). Moisture at 38 ppm — above IEC limit.',
        icon: 'Activity',
        data: { tdcg: 1920, h2: 285, c2h4: 142, moisture: 38, condition: 'Condition 3', faultType: 'T2 Thermal' },
      },
      {
        id: 'at-3',
        timestamp: '2025-06-15T10:00:00Z',
        type: 'analysis',
        title: 'Remaining Life Estimation',
        description: 'Based on DGA gas rate trending and IEEE C57.91 thermal aging model, estimated remaining life is 8-14 months. Furan analysis (2-FAL at 2.8 mg/L) confirms advanced cellulose degradation. Degree of polymerization estimated at 310 (critical threshold: 200).',
        icon: 'Clock',
        data: { remainingLifeMonths: '8-14', dpEstimate: 310, furanLevel: 2.8 },
      },
      {
        id: 'at-4',
        timestamp: '2025-06-15T11:30:00Z',
        type: 'recommendation',
        title: 'AI Recommendation: Proactive Replacement',
        description: 'GridIQ recommends scheduling replacement during the October maintenance window. Replacement transformer (GE 336 MVA) is available in inventory at the Calvert Cliffs spare pool. Estimated project timeline: 6 weeks including site prep, installation, and commissioning.',
        icon: 'Lightbulb',
        data: { replacementAvailable: true, estimatedTimeline: '6 weeks', maintenanceWindow: 'October 2025' },
      },
      {
        id: 'at-5',
        timestamp: '2025-10-06T07:00:00Z',
        type: 'action',
        title: 'Replacement Initiated',
        description: 'De-energized Westport Transformer #1. Load transferred to #2 and adjacent substations via SCADA automation. Replacement transformer mobilized from Calvert Cliffs spare pool.',
        icon: 'Wrench',
        data: { loadTransferred: '336 MVA', customerImpact: 0 },
      },
      {
        id: 'at-6',
        timestamp: '2025-11-17T14:00:00Z',
        type: 'resolution',
        title: 'Replacement Complete — Zero Customer Impact',
        description: 'New transformer energized and synchronized. Health index: 98. All protection and monitoring systems verified. Post-mortem of retired unit confirmed advanced winding insulation failure — estimated 3-4 months from catastrophic failure.',
        icon: 'CheckCircle',
        data: { newHealthIndex: 98, postMortemResult: 'Confirmed 3-4 months from failure' },
      },
    ],
    outcome: {
      title: 'Catastrophic Failure Prevented',
      description: 'Proactive replacement during planned maintenance window avoided an in-service failure that would have resulted in 8-12 hour outage, potential oil spill, and $8-15M in emergency replacement costs plus liability.',
      costAvoided: '$12.5M',
      customersProtected: 85000,
      outageHoursAvoided: 10,
    },
    metrics: [
      { label: 'Health Index', value: '38 → 98', trend: 'up', context: 'New transformer installed' },
      { label: 'DGA TDCG', value: '1,920 → 45 ppm', trend: 'down', context: 'IEEE C57.104 Condition 1' },
      { label: 'Customer Impact', value: 'Zero', trend: 'stable', context: 'Planned maintenance window' },
      { label: 'Cost Avoided', value: '$12.5M', trend: 'down', context: 'Emergency replacement + liability' },
    ],
    decisionSupport: {
      summary: 'AI recommends proactive replacement of 52-year-old transformer during planned October maintenance window. Spare unit available at Calvert Cliffs. 6-week project timeline with zero planned customer impact.',
      urgency: 'within_month',
      confidenceScore: 94,
      approveOption: {
        label: 'Approve Proactive Replacement',
        description: 'Schedule replacement during October planned maintenance window using available spare from Calvert Cliffs pool.',
        pros: [
          'Eliminates catastrophic failure risk (est. 3-4 months remaining)',
          'Zero customer impact — planned maintenance window',
          'Spare transformer already in inventory (no 12-18 month lead time)',
          'Avoids $8-15M emergency replacement + environmental liability',
          'New unit raises health index from 38 to 98',
        ],
        cons: [
          'Capital expenditure: $2.1M for replacement + installation',
          '6-week project ties up field crew resources',
          'Adjacent units carry additional load during swap period',
        ],
        financialImpact: { label: 'Net Savings', value: '$10.4M', trend: 'positive' },
        riskLevel: 'low',
        customerImpact: 'Zero — load transferred to #2 and adjacent substations',
        timeline: '6 weeks (October maintenance window)',
      },
      deferOption: {
        label: 'Defer — Continue Monitoring',
        description: 'Increase DGA sampling to monthly. Continue operating with enhanced monitoring and reduced loading.',
        pros: [
          'Defers $2.1M capital expenditure',
          'No crew mobilization required now',
        ],
        cons: [
          'Remaining life estimated 8-14 months — failure window approaching',
          'In-service failure risk: 8-12 hour outage, 85,000 customers affected',
          'Emergency replacement cost: $8-15M + environmental cleanup',
          'Oil spill liability and regulatory exposure',
          'No spare available if emergency occurs (12-18 month lead time)',
        ],
        financialImpact: { label: 'Failure Risk Exposure', value: '$12.5M', trend: 'negative' },
        riskLevel: 'critical',
        customerImpact: '85,000 customers at risk of 8-12 hour unplanned outage',
        timeline: 'Monitoring continues — failure projected within 8-14 months',
      },
      keyRisks: [
        'DP at 310 — approaching irreversible threshold of 200',
        'TDCG at 1,920 ppm — IEEE C57.104 Condition 3',
        'Furan at 2.8 mg/L confirms advanced cellulose degradation',
        'Rate of HI decline 3× fleet average',
      ],
    },
  },

  // ---- Scenario 2: DGA Trending Alert with Arcing Detection ----
  {
    id: 'dga-trending-alert',
    title: 'DGA Arcing Detection — Emergency De-loading',
    subtitle: 'AI detects acetylene spike indicating internal arcing',
    description: 'Online DGA monitoring at ComEd Electric Junction detected a sudden acetylene (C₂H₂) spike from 2 ppm to 28 ppm in 72 hours — a critical indicator of internal arcing. GridIQ\'s AI classified the fault using Duval Triangle analysis as D1 (low-energy discharge) and recommended immediate de-loading. Emergency response prevented catastrophic tank failure.',
    assetTag: 'COMED-TF-004',
    assetName: 'Electric Junction 345/138kV Transformer #3',
    opCo: 'ComEd',
    category: 'dga_alert',
    severity: 'critical',
    timeline: [
      {
        id: 'dga-1',
        timestamp: '2025-08-12T02:15:00Z',
        type: 'detection',
        title: 'Acetylene Spike Detected',
        description: 'Online DGA monitor triggered critical alert: Acetylene (C₂H₂) at 28 ppm, up from 2 ppm baseline. Rate of rise: 8.7 ppm/day. This exceeds IEEE C57.104 Table 4 threshold for Rate of Gas Generation.',
        icon: 'AlertTriangle',
        data: { c2h2: 28, baseline: 2, rateOfRise: '8.7 ppm/day', threshold: 'IEEE C57.104 Table 4 exceeded' },
      },
      {
        id: 'dga-2',
        timestamp: '2025-08-12T02:17:00Z',
        type: 'analysis',
        title: 'Duval Triangle Fault Classification',
        description: 'AI performed real-time Duval Triangle analysis: %CH₄=15%, %C₂H₄=32%, %C₂H₂=53%. Classification: D1 (Low Energy Discharge / Sparking). Likely cause: Loose connection in tap changer or lead connection inside tank.',
        icon: 'Activity',
        data: { classification: 'D1 - Low Energy Discharge', ch4Pct: 15, c2h4Pct: 32, c2h2Pct: 53 },
      },
      {
        id: 'dga-3',
        timestamp: '2025-08-12T02:20:00Z',
        type: 'recommendation',
        title: 'Emergency De-loading Recommended',
        description: 'GridIQ issued Emergency Recommendation: Reduce loading to 60% of nameplate immediately. Active arcing under load can escalate to tank failure. Load transfer plan generated automatically — shift 180 MVA to Transformer #4 and McCook Substation.',
        icon: 'Zap',
        data: { targetLoad: '60%', loadToTransfer: '180 MVA', transferTargets: ['Transformer #4', 'McCook Sub'] },
      },
      {
        id: 'dga-4',
        timestamp: '2025-08-12T02:35:00Z',
        type: 'action',
        title: 'Emergency Load Transfer Executed',
        description: 'System operator executed SCADA-automated load transfer. Transformer #3 de-loaded from 92% to 55% of nameplate. Adjacent units absorbed transferred load within capacity limits. Zero customer impact.',
        icon: 'Shield',
        data: { loadBefore: '92%', loadAfter: '55%', customerImpact: 0 },
      },
      {
        id: 'dga-5',
        timestamp: '2025-08-12T06:00:00Z',
        type: 'action',
        title: 'Emergency Oil Sample and Internal Inspection',
        description: 'Field crew collected oil samples confirming elevated acetylene. Internal inspection via borescope revealed loose bolted connection on Phase B high-voltage lead. Carbon tracking visible on insulating barrier.',
        icon: 'Search',
        data: { findingType: 'Loose bolted HV lead connection', phase: 'B', carbonTracking: true },
      },
      {
        id: 'dga-6',
        timestamp: '2025-08-15T16:00:00Z',
        type: 'resolution',
        title: 'Repair Complete — Full Capacity Restored',
        description: 'Connection re-torqued, insulating barrier replaced, oil treated. Post-repair DGA: C₂H₂ declining at 1.2 ppm/day. Transformer returned to full load. Health index improved from 44 to 62 after repair.',
        icon: 'CheckCircle',
        data: { newHealthIndex: 62, c2h2PostRepair: 12, loadRestored: '100%' },
      },
    ],
    outcome: {
      title: 'Tank Failure Prevented — $15M Cost Avoidance',
      description: 'Without AI-driven DGA monitoring, the arcing condition would have progressed to tank failure within 1-2 weeks under normal loading. The repair cost $85K vs. emergency replacement cost of $15M+, with 12-18 month lead time for a new 345kV transformer.',
      costAvoided: '$15M',
      customersProtected: 120000,
      outageHoursAvoided: 48,
    },
    metrics: [
      { label: 'Detection Time', value: '2 minutes', trend: 'down', context: 'Online DGA vs quarterly manual sampling' },
      { label: 'Repair Cost', value: '$85K', trend: 'down', context: 'vs $15M emergency replacement' },
      { label: 'Response Time', value: '20 min', trend: 'down', context: 'From alert to de-loading complete' },
      { label: 'Customer Impact', value: 'Zero', trend: 'stable', context: 'Seamless load transfer' },
    ],
    decisionSupport: {
      summary: 'Active arcing detected inside transformer tank. AI recommends immediate de-loading to 60% nameplate and emergency oil sampling. Arcing under load can escalate to tank rupture within hours.',
      urgency: 'immediate',
      confidenceScore: 97,
      approveOption: {
        label: 'Approve Emergency De-loading',
        description: 'Immediately reduce loading to 60% of nameplate via SCADA. Transfer 180 MVA to Transformer #4 and McCook Substation. Dispatch crew for emergency oil sample.',
        pros: [
          'Eliminates arcing escalation risk immediately',
          'Load transfer achievable within 15 minutes via SCADA',
          'Adjacent units have capacity headroom for transferred load',
          'Oil sample confirms diagnosis — enables targeted repair ($85K)',
          'Prevents catastrophic tank failure ($15M+ replacement)',
        ],
        cons: [
          'Adjacent units operate at higher loading temporarily',
          'Emergency crew dispatch during off-hours (overtime cost ~$12K)',
          'Transformer at reduced capacity until repair completed',
        ],
        financialImpact: { label: 'Net Savings', value: '$14.9M', trend: 'positive' },
        riskLevel: 'low',
        customerImpact: 'Zero — seamless SCADA load transfer to adjacent assets',
        timeline: 'De-loading: 15 min · Oil sample: 4 hours · Repair: 3 days',
      },
      deferOption: {
        label: 'Defer — Monitor Only',
        description: 'Continue operating at current loading. Increase DGA sampling frequency and monitor acetylene trend.',
        pros: [
          'No immediate operational disruption',
          'Avoids overtime crew costs',
        ],
        cons: [
          'Acetylene rising at 8.7 ppm/day — active arcing condition',
          'Tank rupture risk under continued loading (1-2 weeks)',
          'Tank failure: $15M replacement + 12-18 month lead time',
          'Fire/explosion risk to field personnel and adjacent equipment',
          '120,000 customers at risk of prolonged outage (48+ hours)',
          'Environmental contamination from oil release',
        ],
        financialImpact: { label: 'Failure Risk Exposure', value: '$15M+', trend: 'negative' },
        riskLevel: 'critical',
        customerImpact: '120,000 customers at risk of 48-hour outage',
        timeline: 'Projected escalation to tank failure: 1-2 weeks at current load',
      },
      keyRisks: [
        'C₂H₂ at 28 ppm — 14× baseline, rising 8.7 ppm/day',
        'Duval Triangle: D1 discharge — can escalate to D2 under load',
        'Tank rupture risk if arcing continues under full load',
        'Fire/explosion hazard — proximity to adjacent equipment',
      ],
    },
  },

  // ---- Scenario 3: Avoided Outage During Heat Wave ----
  {
    id: 'avoided-outage',
    title: 'Heat Wave Outage Prevention',
    subtitle: 'Predictive loading analysis prevents 65,000-customer outage',
    description: 'During a July heat wave across the PECO service territory, GridIQ\'s AI predicted that three transformers would exceed emergency overload limits by 3 PM based on temperature forecasts and historical load patterns. The platform orchestrated pre-emptive load transfers and mobile substation deployment, achieving zero customer outages during peak demand.',
    assetTag: 'PECO-TF-001',
    assetName: 'Plymouth Meeting 230/69kV Transformer Bank',
    opCo: 'PECO',
    category: 'avoided_outage',
    severity: 'high',
    timeline: [
      {
        id: 'ao-1',
        timestamp: '2025-07-18T06:00:00Z',
        type: 'detection',
        title: 'Heat Wave Load Forecast Generated',
        description: 'AI load forecasting model predicts 3 transformers will exceed 100% nameplate by 3 PM. Temperature forecast: 104°F with heat index 112°F. Historical correlation shows 98th percentile loading conditions.',
        icon: 'Thermometer',
        data: { forecastPeak: '104°F', heatIndex: '112°F', assetsAtRisk: 3, peakTimeEstimate: '3:00 PM' },
      },
      {
        id: 'ao-2',
        timestamp: '2025-07-18T07:30:00Z',
        type: 'analysis',
        title: 'N-1 Contingency Analysis',
        description: 'Automated N-1 contingency analysis identifies that loss of any one of the three at-risk transformers would cascade to adjacent units, potentially affecting 65,000+ customers across Montgomery and Delaware counties.',
        icon: 'Network',
        data: { customersAtRisk: 65000, cascadeRisk: true, counties: ['Montgomery', 'Delaware'] },
      },
      {
        id: 'ao-3',
        timestamp: '2025-07-18T08:00:00Z',
        type: 'recommendation',
        title: 'Pre-emptive Mitigation Plan Generated',
        description: 'GridIQ generated a 3-part mitigation plan: (1) Pre-position mobile substation at Plymouth Meeting by 11 AM, (2) Execute load transfer of 45 MVA from Plymouth Meeting to Norristown by 1 PM, (3) Activate demand response program for 12 MW of industrial load.',
        icon: 'Lightbulb',
        data: { mobileSubDeployTime: '11:00 AM', loadTransfer: '45 MVA', demandResponse: '12 MW' },
      },
      {
        id: 'ao-4',
        timestamp: '2025-07-18T10:45:00Z',
        type: 'action',
        title: 'Mobile Substation Deployed',
        description: 'Mobile 69kV, 30 MVA substation connected at Plymouth Meeting. Provides N-1 backup capacity. All protection coordination verified. Crew completing final commissioning checks.',
        icon: 'Truck',
        data: { mobileSubRating: '30 MVA', location: 'Plymouth Meeting', status: 'Commissioned' },
      },
      {
        id: 'ao-5',
        timestamp: '2025-07-18T12:45:00Z',
        type: 'action',
        title: 'Load Transfer Executed at Peak-1',
        description: 'Executed 45 MVA load transfer from Plymouth Meeting to Norristown Substation. Plymouth Meeting loading reduced from projected 102% to 87% of nameplate. Demand response activated — 12 MW of industrial load curtailed.',
        icon: 'ArrowRightLeft',
        data: { loadBefore: '102%', loadAfter: '87%', demandResponseActivated: true },
      },
      {
        id: 'ao-6',
        timestamp: '2025-07-18T18:00:00Z',
        type: 'resolution',
        title: 'Peak Demand Passed — Zero Outages',
        description: 'Peak demand occurred at 3:15 PM. Maximum loading across all transformers: 93%. All 65,000 customers maintained service. Mobile substation stood by without activation needed. Load transfers reversed by 8 PM as temperatures declined.',
        icon: 'CheckCircle',
        data: { peakLoad: '93%', customerOutages: 0, peakTime: '3:15 PM' },
      },
    ],
    outcome: {
      title: 'Blue-Sky Uptime Maintained — 65,000 Customers Protected',
      description: 'Without predictive analytics and pre-emptive mitigation, the heat wave would have caused emergency overload on 3 transformers with cascading outage risk. The automated response prevented an estimated 65,000-customer outage lasting 4-8 hours, supporting Exelon\'s 100% blue-sky uptime goal.',
      costAvoided: '$4.2M',
      customersProtected: 65000,
      outageHoursAvoided: 6,
    },
    metrics: [
      { label: 'Forecast Accuracy', value: '97%', trend: 'up', context: 'Peak load predicted 9 hours ahead' },
      { label: 'Customers Protected', value: '65,000', trend: 'up', context: 'Zero outages during peak' },
      { label: 'Peak Loading', value: '93%', trend: 'down', context: 'vs 102% without intervention' },
      { label: 'Response Lead Time', value: '9 hours', trend: 'up', context: 'Pre-emptive vs reactive' },
    ],
    decisionSupport: {
      summary: 'AI forecasts 3 transformers will exceed 100% nameplate at 3 PM due to heat wave. 3-part mitigation plan: mobile substation, load transfer, and demand response. 9-hour lead time available for pre-emptive action.',
      urgency: 'within_24h',
      confidenceScore: 92,
      approveOption: {
        label: 'Approve Mitigation Plan',
        description: 'Execute 3-part pre-emptive plan: (1) Deploy mobile sub by 11 AM, (2) Transfer 45 MVA by 1 PM, (3) Activate 12 MW demand response.',
        pros: [
          '9-hour lead time — ample for pre-positioning resources',
          'Mobile substation available and pre-staged at depot',
          'Load transfer reduces Plymouth Meeting from 102% to 87%',
          'Demand response contracts pre-negotiated — 12 MW industrial',
          'Protects 65,000 customers with zero service interruption',
          'Supports Exelon 100% blue-sky uptime commitment',
        ],
        cons: [
          'Mobile substation deployment cost: ~$45K/day',
          'Demand response activation cost: ~$18K (12 MW × $1,500/MW)',
          'Crew overtime for mobile sub setup and monitoring: ~$8K',
          'Industrial customers experience voluntary curtailment',
        ],
        financialImpact: { label: 'Net Savings', value: '$4.1M', trend: 'positive' },
        riskLevel: 'low',
        customerImpact: 'Zero outages — 65,000 customers fully protected',
        timeline: 'Mobile sub: 11 AM · Load transfer: 1 PM · Peak passes: ~6 PM',
      },
      deferOption: {
        label: 'Defer — Rely on Existing Capacity',
        description: 'No pre-emptive action. Monitor loading in real-time and react if emergency overload occurs.',
        pros: [
          'No upfront mobilization costs',
          'Forecast could be wrong — heat wave may not materialize',
        ],
        cons: [
          '97% forecast confidence — conditions very likely to exceed limits',
          'Emergency overload on 3 transformers accelerates aging',
          'N-1 contingency fails — loss of one unit cascades to 65,000 customers',
          'Reactive response time insufficient at peak (2 hours vs 9 hours pre-emptive)',
          'Customer outage liability: $4.2M (SAIDI/SAIFI penalties + claims)',
          'Regulatory exposure from avoidable outage during predicted event',
        ],
        financialImpact: { label: 'Outage Risk Exposure', value: '$4.2M', trend: 'negative' },
        riskLevel: 'high',
        customerImpact: '65,000 customers at risk of 4-8 hour cascading outage',
        timeline: 'Peak at 3 PM — no time for pre-positioning if deferred',
      },
      keyRisks: [
        'Forecast: 104°F / heat index 112°F — 98th percentile conditions',
        'N-1 contingency failure: loss of 1 unit cascades across territory',
        'Emergency overload accelerates transformer aging by 20-40×',
        'Reactive response too slow at peak — 2 hours vs 9 hours lead time',
      ],
    },
  },
];

// ============================================================================
// Helper functions
// ============================================================================

export function getScenarioById(id: string): DemoScenario | undefined {
  return DEMO_SCENARIOS.find(s => s.id === id);
}

export function getScenariosByCategory(category: DemoScenario['category']): DemoScenario[] {
  return DEMO_SCENARIOS.filter(s => s.category === category);
}

export function getScenarioForAsset(assetTag: string): DemoScenario | undefined {
  return DEMO_SCENARIOS.find(s => s.assetTag === assetTag);
}

export function getAllScenarioSummaries() {
  return DEMO_SCENARIOS.map(s => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    assetName: s.assetName,
    opCo: s.opCo,
    category: s.category,
    severity: s.severity,
    costAvoided: s.outcome.costAvoided,
    customersProtected: s.outcome.customersProtected,
  }));
}

