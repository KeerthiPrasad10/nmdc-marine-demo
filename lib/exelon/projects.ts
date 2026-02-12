export interface GridProgram {
  id: string
  name: string
  sponsor: string
  type: 'grid_modernization' | 'storm_hardening' | 'transformer_replacement' | 'capacity_expansion' | 'smart_grid' | 'vegetation_management'
  status: 'active' | 'completed' | 'planned' | 'on_hold'
  location: {
    lat: number
    lng: number
    area: string
  }
  description: string
  startDate: string
  endDate?: string
  progress?: number
  assignedAssets: string[]
  scope?: {
    milesOfLine?: string
    substationsUpgraded?: number
    transformersReplaced?: number
    smartMetersDeployed?: number
  }
  budget?: string
  customersImpacted: number
}

export const PROGRAM_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  grid_modernization: { label: 'Grid Modernization', color: '#3b82f6' },
  storm_hardening: { label: 'Storm Hardening', color: '#f59e0b' },
  transformer_replacement: { label: 'Transformer Replacement', color: '#ef4444' },
  capacity_expansion: { label: 'Capacity Expansion', color: '#10b981' },
  smart_grid: { label: 'Smart Grid', color: '#8b5cf6' },
  vegetation_management: { label: 'Vegetation Management', color: '#6b7280' },
}

export const PROGRAM_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: '#10b981' },
  completed: { label: 'Completed', color: '#3b82f6' },
  planned: { label: 'Planned', color: '#f59e0b' },
  on_hold: { label: 'On Hold', color: '#6b7280' },
}

export const GRID_PROGRAMS: GridProgram[] = [
  {
    id: 'prog-comed-001',
    name: 'ComEd Smart Grid 2.0',
    sponsor: 'ComEd',
    type: 'grid_modernization',
    status: 'active',
    location: {
      lat: 41.8781,
      lng: -87.6298,
      area: 'Northern Illinois',
    },
    description: 'Comprehensive grid modernization program deploying advanced distribution management system (ADMS), fault location isolation and service restoration (FLISR), and automated switching across the ComEd territory.',
    startDate: '2024-06-01',
    endDate: '2027-12-31',
    progress: 35,
    assignedAssets: ['COMED-TF-001', 'COMED-SS-001', 'COMED-TF-004'],
    scope: {
      substationsUpgraded: 85,
      smartMetersDeployed: 500000,
      milesOfLine: '4,200 miles',
    },
    budget: '$2.6B',
    customersImpacted: 4000000,
  },
  {
    id: 'prog-bge-001',
    name: 'BGE Critical Transformer Replacement',
    sponsor: 'BGE',
    type: 'transformer_replacement',
    status: 'active',
    location: {
      lat: 39.2904,
      lng: -76.6122,
      area: 'Central Maryland',
    },
    description: 'Emergency replacement program for aging power transformers exceeding 45 years of service with health index below 50%. Westport 230/115kV auto-transformer is priority #1 with 18-month lead time for replacement unit.',
    startDate: '2025-01-15',
    endDate: '2027-06-30',
    progress: 12,
    assignedAssets: ['BGE-TF-001', 'BGE-TF-003'],
    scope: {
      transformersReplaced: 8,
    },
    budget: '$180M',
    customersImpacted: 192000,
  },
  {
    id: 'prog-pepco-001',
    name: 'Pepco DC Underground Reliability',
    sponsor: 'Pepco',
    type: 'storm_hardening',
    status: 'active',
    location: {
      lat: 38.9072,
      lng: -77.0369,
      area: 'Washington D.C.',
    },
    description: 'Hardening the underground distribution network serving the National Capital area. Replacing aging cable, upgrading network protectors, and installing advanced monitoring at critical substations.',
    startDate: '2024-09-01',
    endDate: '2026-12-31',
    progress: 40,
    assignedAssets: ['PEPCO-TF-001', 'PEPCO-SS-001'],
    scope: {
      substationsUpgraded: 12,
      milesOfLine: '320 miles underground cable',
    },
    budget: '$450M',
    customersImpacted: 900000,
  },
  {
    id: 'prog-ace-001',
    name: 'ACE Coastal Storm Hardening',
    sponsor: 'ACE',
    type: 'storm_hardening',
    status: 'active',
    location: {
      lat: 39.3643,
      lng: -74.4229,
      area: 'Southern New Jersey Coast',
    },
    description: 'Post-Sandy resilience program: elevating substations in flood zones, installing submersible transformers, and hardening coastal transmission corridors against hurricane-force winds.',
    startDate: '2025-03-01',
    endDate: '2027-09-30',
    progress: 22,
    assignedAssets: ['ACE-TF-001', 'ACE-SS-001'],
    scope: {
      substationsUpgraded: 6,
      milesOfLine: '180 miles',
    },
    budget: '$290M',
    customersImpacted: 572000,
  },
  {
    id: 'prog-peco-001',
    name: 'PECO Capacity Growth — Data Center Corridor',
    sponsor: 'PECO',
    type: 'capacity_expansion',
    status: 'planned',
    location: {
      lat: 40.1020,
      lng: -75.2740,
      area: 'Montgomery County, PA',
    },
    description: 'New transmission capacity to serve hyperscale data center demand along the I-476 corridor. Includes new 230kV line, two new substations, and transformer upgrades at Plymouth Meeting.',
    startDate: '2026-01-15',
    endDate: '2028-12-31',
    progress: 5,
    assignedAssets: ['PECO-TF-001'],
    scope: {
      substationsUpgraded: 3,
      transformersReplaced: 2,
      milesOfLine: '45 miles 230kV',
    },
    budget: '$520M',
    customersImpacted: 55000,
  },
  {
    id: 'prog-dpl-001',
    name: 'Delmarva Smart Grid Automation',
    sponsor: 'DPL',
    type: 'smart_grid',
    status: 'active',
    location: {
      lat: 39.7391,
      lng: -75.5398,
      area: 'Delaware & Eastern Shore MD',
    },
    description: 'Deploying SCADA upgrades, automated reclosers, and intelligent electronic devices (IEDs) across the Delmarva territory to reduce SAIDI by 25%.',
    startDate: '2025-02-01',
    endDate: '2027-03-31',
    progress: 28,
    assignedAssets: ['DPL-TF-001', 'DPL-TF-002'],
    scope: {
      substationsUpgraded: 15,
      smartMetersDeployed: 200000,
    },
    budget: '$175M',
    customersImpacted: 561500,
  },
]

export function getProgramStats() {
  const active = GRID_PROGRAMS.filter(p => p.status === 'active').length
  const planned = GRID_PROGRAMS.filter(p => p.status === 'planned').length
  const totalBudget = GRID_PROGRAMS.reduce((sum, p) => {
    const match = p.budget?.match(/\$([\d.]+)([BM])/)
    if (!match) return sum
    const val = parseFloat(match[1])
    return sum + (match[2] === 'B' ? val * 1000 : val)
  }, 0)

  return {
    total: GRID_PROGRAMS.length,
    active,
    planned,
    totalBudgetM: totalBudget,
    totalCustomersImpacted: GRID_PROGRAMS.reduce((sum, p) => sum + p.customersImpacted, 0),
  }
}

export function getProgramsByAsset(assetTag: string): GridProgram[] {
  return GRID_PROGRAMS.filter(p => p.assignedAssets.includes(assetTag))
}

export function getProgramsAtRisk(): GridProgram[] {
  return GRID_PROGRAMS.filter(p => p.status === 'active' && (p.progress ?? 0) < 20)
}

