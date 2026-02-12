export interface ComponentIssue {
  componentName: string
  category: string
  issue: string
  healthScore: number
  temperature?: number
  moisture?: number
  status: 'critical' | 'warning' | 'degraded'
  pmPrediction: {
    predictedIssue: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    warningSignals: string[]
    recommendedAction: string
    timeToFailure?: string
    confidence?: number
    customersAtRisk?: number
  }
}

export interface AssetIssues {
  assetTag: string
  assetName: string
  assetType: string
  opCo: string
  issues: ComponentIssue[]
}

export const ASSET_ISSUES: Record<string, AssetIssues> = {
  'BGE-TF-001': {
    assetTag: 'BGE-TF-001',
    assetName: 'Westport 230/115kV Auto-Transformer #1',
    assetType: 'power_transformer',
    opCo: 'BGE',
    issues: [
      {
        componentName: 'Winding Insulation',
        category: 'insulation',
        issue: 'DGA trending: elevated CO and CO2 indicating cellulose degradation',
        healthScore: 35,
        temperature: 98,
        moisture: 28,
        status: 'critical',
        pmPrediction: {
          predictedIssue: 'Winding insulation thermal degradation — accelerated aging',
          priority: 'critical',
          warningSignals: [
            'CO at 850 ppm (limit 500 ppm per IEEE C57.104)',
            'CO2/CO ratio indicates overheating > 200°C',
            'Furan analysis: 2-FAL at 2.8 mg/L (end-of-life threshold 4.0)',
            'Degree of polymerization estimated at 350 (new: 1000+)',
          ],
          recommendedAction: 'IMMEDIATE: Reduce loading to 75% of nameplate. Schedule replacement transformer procurement (18-24 month lead time). Deploy mobile substation as interim backup.',
          timeToFailure: '18-36 months under current loading',
          confidence: 92,
          customersAtRisk: 72000,
        },
      },
      {
        componentName: 'HV Bushings',
        category: 'bushing',
        issue: 'Power factor test trending upward — possible moisture ingress',
        healthScore: 48,
        temperature: 82,
        moisture: 22,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Bushing capacitance change indicating dielectric deterioration',
          priority: 'high',
          warningSignals: [
            'Power factor increased 15% over baseline',
            'Capacitance change of 3.2% (alarm at 5%)',
            'Thermal image shows asymmetric heating pattern',
            'Oil-impregnated paper bushings — original 1974 installation',
          ],
          recommendedAction: 'Order replacement RIP bushings. Schedule bushing replacement during planned outage within 6 months.',
          timeToFailure: '6-12 months',
          confidence: 85,
          customersAtRisk: 72000,
        },
      },
      {
        componentName: 'Cooling System',
        category: 'cooling',
        issue: 'Fan bank #2 reduced airflow — motor bearing wear',
        healthScore: 62,
        temperature: 72,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Cooling capacity degradation leading to thermal derating',
          priority: 'medium',
          warningSignals: [
            'Fan motor current draw increased 22%',
            'Vibration readings elevated on fan #2A and #2C',
            'Top-oil temperature 8°C above expected for current load',
          ],
          recommendedAction: 'Replace fan motors on bank #2 during next maintenance window. Monitor top-oil temperature closely.',
          timeToFailure: '3-6 months',
          confidence: 78,
          customersAtRisk: 72000,
        },
      },
    ],
  },

  'COMED-TF-001': {
    assetTag: 'COMED-TF-001',
    assetName: 'Crawford 345/138kV Auto-Transformer #1',
    assetType: 'power_transformer',
    opCo: 'ComEd',
    issues: [
      {
        componentName: 'Tap Changer (OLTC)',
        category: 'tap_changer',
        issue: 'Elevated contact resistance — carbon buildup on selector contacts',
        healthScore: 54,
        temperature: 88,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'OLTC contact failure causing voltage regulation loss',
          priority: 'high',
          warningSignals: [
            'DGA in OLTC compartment: C2H2 at 35 ppm (arcing)',
            'Contact resistance 40% above commissioning values',
            'Oil in OLTC compartment discolored and acidic',
            'Tap operations counter: 185,000 (overhaul at 200,000)',
          ],
          recommendedAction: 'Schedule OLTC overhaul during spring outage. Replace selector contacts, resistors, and oil in tap changer compartment.',
          timeToFailure: '~15,000 additional operations (~8 months)',
          confidence: 88,
          customersAtRisk: 85000,
        },
      },
      {
        componentName: 'Oil System',
        category: 'oil',
        issue: 'Increasing moisture content in transformer oil',
        healthScore: 61,
        moisture: 32,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Dielectric breakdown risk due to moisture in oil',
          priority: 'medium',
          warningSignals: [
            'Oil moisture at 32 ppm (limit 35 ppm for 345kV)',
            'Dielectric strength dropped to 38 kV (minimum 30 kV)',
            'Interfacial tension at 22 mN/m (new oil: 40+)',
            'Suspected gasket deterioration on main tank inspection cover',
          ],
          recommendedAction: 'Perform hot-oil filtration and vacuum dehydration. Inspect and replace gaskets on main tank.',
          timeToFailure: '6-9 months before dielectric failure risk',
          confidence: 82,
          customersAtRisk: 85000,
        },
      },
      {
        componentName: 'Winding Insulation',
        category: 'insulation',
        issue: 'Thermal imaging shows localized hot spot on HV winding',
        healthScore: 58,
        temperature: 105,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Winding hot spot accelerating paper aging',
          priority: 'medium',
          warningSignals: [
            'Hot-spot temperature 105°C at 78% load (design limit 110°C)',
            'Top-oil to hot-spot gradient 15°C above design',
            'Load growth trend suggests 90% loading by summer 2026',
          ],
          recommendedAction: 'Install fiber-optic hot-spot temperature sensors. Plan load transfer strategy for summer peak.',
          timeToFailure: '12-18 months if loading increases',
          confidence: 76,
          customersAtRisk: 85000,
        },
      },
    ],
  },

  'COMED-TF-004': {
    assetTag: 'COMED-TF-004',
    assetName: 'Electric Junction 345/138kV Transformer #3',
    assetType: 'power_transformer',
    opCo: 'ComEd',
    issues: [
      {
        componentName: 'Winding Insulation',
        category: 'insulation',
        issue: 'CRITICAL: DGA shows active arcing — C2H2 spike detected',
        healthScore: 28,
        temperature: 112,
        moisture: 45,
        status: 'critical',
        pmPrediction: {
          predictedIssue: 'Active internal arcing — imminent winding failure',
          priority: 'critical',
          warningSignals: [
            'C2H2 (acetylene) at 280 ppm — CRITICAL (limit 2 ppm)',
            'H2 at 2,400 ppm — CRITICAL (limit 700 ppm)',
            'TDCG rate of change: 150 ppm/day — RAPIDLY INCREASING',
            'Buchholz relay gas accumulation alarm active',
          ],
          recommendedAction: 'IMMEDIATE: De-energize transformer. Deploy mobile substation. This unit is in active failure mode. Do NOT re-energize.',
          timeToFailure: 'Days to weeks — failure imminent',
          confidence: 97,
          customersAtRisk: 65000,
        },
      },
      {
        componentName: 'HV Bushings',
        category: 'bushing',
        issue: 'Bushing oil level low — possible external leak',
        healthScore: 45,
        temperature: 78,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Bushing explosion risk if oil level drops further',
          priority: 'critical',
          warningSignals: [
            'Oil level gauge shows 60% (minimum 80%)',
            'Oil staining visible on bushing porcelain',
            'Temperature differential between phases: 12°C',
          ],
          recommendedAction: 'Include in immediate de-energization scope. Replace bushings as part of transformer replacement project.',
          timeToFailure: 'Concurrent with transformer failure risk',
          confidence: 90,
          customersAtRisk: 65000,
        },
      },
      {
        componentName: 'Oil System',
        category: 'oil',
        issue: 'Severe oil degradation — acidity and sludge formation',
        healthScore: 32,
        moisture: 52,
        status: 'critical',
        pmPrediction: {
          predictedIssue: 'Oil no longer providing adequate insulation and cooling',
          priority: 'critical',
          warningSignals: [
            'Oil acidity at 0.35 mg KOH/g (limit 0.20)',
            'Interfacial tension at 15 mN/m (condemn at 18)',
            'Visible sludge deposits on radiator internals',
            'Dielectric strength at 25 kV (minimum 30 kV)',
          ],
          recommendedAction: 'Oil is beyond reclamation. Full replacement required as part of transformer replacement scope.',
          timeToFailure: 'Contributing to active failure mode',
          confidence: 94,
          customersAtRisk: 65000,
        },
      },
    ],
  },

  'PEPCO-TF-001': {
    assetTag: 'PEPCO-TF-001',
    assetName: 'Benning Road 230/69kV Transformer #2',
    assetType: 'power_transformer',
    opCo: 'Pepco',
    issues: [
      {
        componentName: 'Tap Changer (OLTC)',
        category: 'tap_changer',
        issue: 'Tap changer oil DGA shows thermal fault',
        healthScore: 52,
        temperature: 94,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'OLTC thermal fault — hot contact or coking',
          priority: 'high',
          warningSignals: [
            'C2H4 at 120 ppm in tap changer oil (thermal fault)',
            'Tap changer oil temperature 15°C above normal',
            'Voltage regulation slow to respond',
            'Operations count: 210,000 (overhaul at 200,000 — overdue)',
          ],
          recommendedAction: 'Emergency OLTC overhaul. Procure contact assembly and diverter switch. Schedule 72-hour outage.',
          timeToFailure: '2-4 months',
          confidence: 87,
          customersAtRisk: 62000,
        },
      },
      {
        componentName: 'Winding Insulation',
        category: 'insulation',
        issue: 'Elevated furan levels indicating paper degradation',
        healthScore: 50,
        temperature: 92,
        moisture: 30,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Insulation system approaching end-of-life',
          priority: 'high',
          warningSignals: [
            '2-FAL at 3.2 mg/L (end-of-life threshold: 4.0)',
            'DP estimated at 280 (critical: 200)',
            'CO trending upward at 15 ppm/month',
          ],
          recommendedAction: 'Begin replacement procurement (18-24 month lead). Reduce loading. Deploy oil reclamation to extend life.',
          timeToFailure: '24-36 months at current degradation rate',
          confidence: 83,
          customersAtRisk: 62000,
        },
      },
      {
        componentName: 'Cooling System',
        category: 'cooling',
        issue: 'Radiator bank #1 blocked — reduced cooling efficiency',
        healthScore: 65,
        temperature: 76,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Summer de-rating if cooling not restored',
          priority: 'medium',
          warningSignals: [
            'Oil flow through radiator bank #1 reduced 40%',
            'Internal sludge accumulation suspected',
            'Top-oil temperature 6°C above expected',
          ],
          recommendedAction: 'Flush radiator bank #1. Consider oil reclamation to remove sludge.',
          timeToFailure: 'Before summer peak (June 2026)',
          confidence: 75,
          customersAtRisk: 62000,
        },
      },
    ],
  },

  'ACE-TF-001': {
    assetTag: 'ACE-TF-001',
    assetName: 'Cardiff 230/69kV Transformer #1',
    assetType: 'power_transformer',
    opCo: 'ACE',
    issues: [
      {
        componentName: 'Surge Arresters',
        category: 'protection',
        issue: 'Leakage current elevated on phase A arrester',
        healthScore: 64,
        temperature: 68,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Surge arrester failure leaving transformer unprotected',
          priority: 'high',
          warningSignals: [
            'Leakage current 2.5x baseline on phase A',
            'Surge counter: 847 operations (coastal lightning exposure)',
            'Thermal image shows 8°C differential vs phases B & C',
          ],
          recommendedAction: 'Replace phase A surge arrester. Order spare set for all three phases.',
          timeToFailure: 'Next significant lightning event = failure risk',
          confidence: 84,
          customersAtRisk: 52000,
        },
      },
      {
        componentName: 'Oil System',
        category: 'oil',
        issue: 'Coastal salt contamination accelerating oil degradation',
        healthScore: 60,
        moisture: 28,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Accelerated corrosive sulfur attack on conductors',
          priority: 'medium',
          warningSignals: [
            'Oil acidity at 0.18 mg KOH/g (trending toward 0.20 limit)',
            'Copper content in oil elevated (corrosive sulfur indicator)',
            'Coastal salt deposit on conservator breather',
          ],
          recommendedAction: 'Oil reclamation with passivator additive (DBDS treatment). Replace silica gel breather.',
          timeToFailure: '12-18 months',
          confidence: 77,
          customersAtRisk: 52000,
        },
      },
      {
        componentName: 'HV Bushings',
        category: 'bushing',
        issue: 'Salt contamination on bushing porcelain — flashover risk',
        healthScore: 68,
        temperature: 62,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'External flashover during wet/foggy conditions',
          priority: 'medium',
          warningSignals: [
            'Creepage distance below recommended for coastal environment',
            'Salt deposit visible on phase B bushing',
            'Partial discharge activity during fog events',
          ],
          recommendedAction: 'Schedule live-line washing. Plan bushing replacement with silicone-housed RIP bushings for coastal duty.',
          timeToFailure: 'Next major coastal fog/storm event',
          confidence: 73,
          customersAtRisk: 52000,
        },
      },
    ],
  },

  'PECO-TF-001': {
    assetTag: 'PECO-TF-001',
    assetName: 'Plymouth Meeting 230/69kV Transformer #1',
    assetType: 'power_transformer',
    opCo: 'PECO',
    issues: [
      {
        componentName: 'Winding Insulation',
        category: 'insulation',
        issue: 'DGA trending: thermal fault signature developing',
        healthScore: 58,
        temperature: 96,
        moisture: 25,
        status: 'warning',
        pmPrediction: {
          predictedIssue: 'Localized hot spot in LV winding — turn-to-turn insulation risk',
          priority: 'high',
          warningSignals: [
            'C2H4 at 85 ppm and rising (thermal fault gas)',
            'C2H4/C2H6 ratio indicates hot spot 300-700°C range',
            'Top-oil to winding gradient increasing',
            'Load growth from data center corridor increasing thermal stress',
          ],
          recommendedAction: 'Install fiber-optic hot-spot sensors. Commission thermal study. Plan capacity relief via new transformer in PECO Capacity Growth program.',
          timeToFailure: '12-24 months',
          confidence: 80,
          customersAtRisk: 55000,
        },
      },
      {
        componentName: 'Cooling System',
        category: 'cooling',
        issue: 'Oil pump #2 flow rate declining',
        healthScore: 70,
        temperature: 74,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Reduced oil circulation impacting cooling capacity',
          priority: 'medium',
          warningSignals: [
            'Pump #2 flow rate 15% below design',
            'Motor current slightly elevated',
            'Oil temperature differential across cooler increased',
          ],
          recommendedAction: 'Replace oil pump during next scheduled outage. Verify all cooler fans operational.',
          timeToFailure: '6-9 months',
          confidence: 74,
          customersAtRisk: 55000,
        },
      },
      {
        componentName: 'LV Bushings',
        category: 'bushing',
        issue: 'Hairline crack observed on 69kV bushing porcelain',
        healthScore: 66,
        temperature: 64,
        status: 'degraded',
        pmPrediction: {
          predictedIssue: 'Moisture ingress through crack leading to bushing failure',
          priority: 'medium',
          warningSignals: [
            'Visual crack on phase C 69kV bushing',
            'Power factor test shows slight increase',
            'No oil leakage yet but monitoring required',
          ],
          recommendedAction: 'Order replacement bushing. Schedule replacement during spring outage.',
          timeToFailure: '3-6 months',
          confidence: 71,
          customersAtRisk: 55000,
        },
      },
    ],
  },
}

export function getAssetIssues(assetTag: string): AssetIssues | null {
  return ASSET_ISSUES[assetTag] || null
}

export function hasAssetIssues(assetTag: string): boolean {
  return assetTag in ASSET_ISSUES
}

export interface AssetIssueSummary {
  issueCount: number
  worstPriority: 'critical' | 'high' | 'medium' | 'low' | null
  worstHealth: number
  hasHighPriority: boolean
  hasCritical: boolean
  totalCustomersAtRisk: number
}

export function getAssetIssueSummary(assetTag: string): AssetIssueSummary {
  const issues = getAssetIssues(assetTag)

  if (!issues || issues.issues.length === 0) {
    return {
      issueCount: 0,
      worstPriority: null,
      worstHealth: 100,
      hasHighPriority: false,
      hasCritical: false,
      totalCustomersAtRisk: 0,
    }
  }

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  let worstPriority: 'critical' | 'high' | 'medium' | 'low' = 'low'
  let worstHealth = 100
  let hasCritical = false
  let hasHighPriority = false
  let totalCustomersAtRisk = 0

  for (const issue of issues.issues) {
    const priority = issue.pmPrediction.priority
    if (priorityOrder[priority] < priorityOrder[worstPriority]) {
      worstPriority = priority
    }
    if (issue.healthScore < worstHealth) {
      worstHealth = issue.healthScore
    }
    if (priority === 'critical') hasCritical = true
    if (priority === 'critical' || priority === 'high') hasHighPriority = true
    totalCustomersAtRisk = Math.max(totalCustomersAtRisk, issue.pmPrediction.customersAtRisk ?? 0)
  }

  return {
    issueCount: issues.issues.length,
    worstPriority,
    worstHealth,
    hasHighPriority,
    hasCritical,
    totalCustomersAtRisk,
  }
}

