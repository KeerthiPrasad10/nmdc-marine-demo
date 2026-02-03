// NMDC Project Sites Data

export interface ProjectSite {
  id: string;
  name: string;
  client: string;
  type: 'dredging' | 'reclamation' | 'marine_construction' | 'coastal_protection' | 'port_development';
  status: 'active' | 'completed' | 'planned' | 'on_hold';
  location: {
    lat: number;
    lng: number;
    area: string;
  };
  description: string;
  startDate: string;
  endDate?: string;
  progress?: number; // 0-100
  assignedVessels: string[]; // MMSIs
  scope?: {
    dredgeVolume?: string; // e.g., "5 million m³"
    area?: string; // e.g., "250 hectares"
    depth?: string; // e.g., "-14m CD"
  };
  value?: string; // Contract value
}

export const PROJECT_SITES: ProjectSite[] = [
  {
    id: 'proj-adnoc-001',
    name: 'ADNOC Offshore Pipeline Installation',
    client: 'ADNOC',
    type: 'marine_construction',
    status: 'active',
    location: {
      lat: 24.1108,
      lng: 52.7306,
      area: 'Ruwais Offshore, Abu Dhabi',
    },
    description: 'Critical offshore pipeline installation for ADNOC gas export facility. 48km subsea pipeline from Ruwais terminal to offshore platform. Weather window critical.',
    startDate: '2025-11-01',
    endDate: '2026-04-30',
    progress: 35,
    assignedVessels: ['470339000', '471026000', '470284000'], // DLB-750, DELMA 2000, DLB-1000
    scope: {
      area: '48 km pipeline',
      depth: '-45m',
    },
    value: 'AED 460M ($125M)',
  },
  {
    id: 'proj-001',
    name: 'Khalifa Port Expansion Phase 3',
    client: 'Abu Dhabi Ports',
    type: 'port_development',
    status: 'active',
    location: {
      lat: 24.8095,
      lng: 54.6458,
      area: 'Khalifa Port, Abu Dhabi',
    },
    description: 'Capital dredging and quay wall construction for the third phase expansion of Khalifa Port, including deepening of approach channel to -18m CD.',
    startDate: '2024-03-01',
    endDate: '2026-06-30',
    progress: 35,
    assignedVessels: ['470563000', '471072000', '470678000'], // AL SADR, ARZANA, BARRACUDA
    scope: {
      dredgeVolume: '12 million m³',
      depth: '-18m CD',
    },
    value: 'AED 850M',
  },
  {
    id: 'proj-002',
    name: 'Jubail Island Development',
    client: 'Jubail Island Investment Company',
    type: 'reclamation',
    status: 'active',
    location: {
      lat: 24.5847,
      lng: 54.4982,
      area: 'Jubail Island, Abu Dhabi',
    },
    description: 'Marine works for the development of Jubail Island, including land reclamation, beach nourishment, and channel dredging for marina access.',
    startDate: '2024-01-15',
    endDate: '2025-12-31',
    progress: 62,
    assignedVessels: ['470624000', '470806000'], // GHASHA, AL YASSAT
    scope: {
      dredgeVolume: '8.5 million m³',
      area: '180 hectares',
    },
    value: 'AED 420M',
  },
  {
    id: 'proj-003',
    name: 'Ras Al Khaimah Coastal Protection',
    client: 'RAK Municipality',
    type: 'coastal_protection',
    status: 'active',
    location: {
      lat: 25.7895,
      lng: 55.9432,
      area: 'Ras Al Khaimah',
    },
    description: 'Coastal protection works including rock revetment, beach nourishment, and groyne construction along 12km of coastline.',
    startDate: '2024-06-01',
    endDate: '2025-08-31',
    progress: 28,
    assignedVessels: ['470646000', '471018000'], // INCHCAPE 5, AL MIRFA
    scope: {
      area: '12 km coastline',
      dredgeVolume: '2.5 million m³',
    },
    value: 'AED 180M',
  },
  {
    id: 'proj-004',
    name: 'Ruwais Industrial Zone - Channel Maintenance',
    client: 'ADNOC',
    type: 'dredging',
    status: 'active',
    location: {
      lat: 24.1108,
      lng: 52.7306,
      area: 'Ruwais, Abu Dhabi',
    },
    description: 'Maintenance dredging of the approach channel and turning basin at Ruwais Industrial Zone to maintain design depths for VLCC access.',
    startDate: '2025-01-10',
    progress: 15,
    assignedVessels: ['470593000', '470922000'], // KHALEEJ BAY, AL JABER XII
    scope: {
      dredgeVolume: '3.2 million m³',
      depth: '-22m CD',
    },
    value: 'AED 95M',
  },
  {
    id: 'proj-005',
    name: 'Saadiyat Island - Cultural District Marina',
    client: 'Tourism Development & Investment Company',
    type: 'marine_construction',
    status: 'planned',
    location: {
      lat: 24.5369,
      lng: 54.4345,
      area: 'Saadiyat Island, Abu Dhabi',
    },
    description: 'Construction of a new marina facility adjacent to the Cultural District, including dredging, breakwater construction, and floating pontoons installation.',
    startDate: '2025-04-01',
    endDate: '2027-03-31',
    progress: 0,
    assignedVessels: [],
    scope: {
      dredgeVolume: '1.8 million m³',
      area: '45 hectares',
      depth: '-6m CD',
    },
    value: 'AED 280M',
  },
  {
    id: 'proj-006',
    name: 'Das Island - Offshore Support Base',
    client: 'ADNOC Offshore',
    type: 'port_development',
    status: 'active',
    location: {
      lat: 25.1522,
      lng: 52.8731,
      area: 'Das Island',
    },
    description: 'Expansion of offshore support facilities at Das Island including new berths, dredging works, and shore protection.',
    startDate: '2024-09-01',
    endDate: '2025-11-30',
    progress: 45,
    assignedVessels: ['470510000', '470805000'], // AL HAMRA, MARAWAH
    scope: {
      dredgeVolume: '1.5 million m³',
      depth: '-12m CD',
    },
    value: 'AED 150M',
  },
  {
    id: 'proj-zakum',
    name: 'Upper Zakum Platform Hook-up',
    client: 'ZADCO',
    type: 'marine_construction',
    status: 'active',
    location: {
      lat: 24.85,
      lng: 53.45,
      area: 'Upper Zakum Field',
    },
    description: 'Platform hook-up and commissioning works for Upper Zakum oil field expansion. Jack-up operations for equipment installation and tie-ins.',
    startDate: '2025-10-01',
    endDate: '2026-03-31',
    progress: 42,
    assignedVessels: ['470114000', '470426000', '470395000'], // SEP-550, SEP-650, SEP-750
    scope: {
      area: '3 platforms',
      depth: '-35m',
    },
    value: 'AED 280M ($76M)',
  },
  {
    id: 'proj-007',
    name: 'Fujairah Port - East Container Terminal',
    client: 'Fujairah Ports',
    type: 'port_development',
    status: 'completed',
    location: {
      lat: 25.1264,
      lng: 56.3428,
      area: 'Fujairah',
    },
    description: 'Capital dredging for the new East Container Terminal at Port of Fujairah, including approach channel and turning basin.',
    startDate: '2023-02-01',
    endDate: '2024-10-15',
    progress: 100,
    assignedVessels: [],
    scope: {
      dredgeVolume: '6.8 million m³',
      depth: '-16m CD',
    },
    value: 'AED 320M',
  },
];

// Get all active projects
export function getActiveProjects(): ProjectSite[] {
  return PROJECT_SITES.filter(p => p.status === 'active');
}

// Get project by ID
export function getProjectById(id: string): ProjectSite | undefined {
  return PROJECT_SITES.find(p => p.id === id);
}

// Get projects by vessel MMSI
export function getProjectsByVessel(mmsi: string): ProjectSite[] {
  return PROJECT_SITES.filter(p => p.assignedVessels.includes(mmsi));
}

// Get project statistics
export function getProjectStats() {
  const active = PROJECT_SITES.filter(p => p.status === 'active');
  const completed = PROJECT_SITES.filter(p => p.status === 'completed');
  const planned = PROJECT_SITES.filter(p => p.status === 'planned');
  
  const totalValue = PROJECT_SITES
    .filter(p => p.value)
    .reduce((sum, p) => {
      const match = p.value?.match(/[\d.]+/);
      return sum + (match ? parseFloat(match[0]) : 0);
    }, 0);

  return {
    total: PROJECT_SITES.length,
    active: active.length,
    completed: completed.length,
    planned: planned.length,
    totalValue: `AED ${totalValue.toLocaleString()}M`,
    avgProgress: Math.round(
      active.reduce((sum, p) => sum + (p.progress || 0), 0) / (active.length || 1)
    ),
  };
}

// Type labels and colors
export const PROJECT_TYPE_CONFIG: Record<ProjectSite['type'], { label: string; color: string; icon: string }> = {
  dredging: { label: 'Dredging', color: '#f97316', icon: '⚓' },
  reclamation: { label: 'Land Reclamation', color: '#22c55e', icon: '🏝️' },
  marine_construction: { label: 'Marine Construction', color: '#3b82f6', icon: '🏗️' },
  coastal_protection: { label: 'Coastal Protection', color: '#06b6d4', icon: '🌊' },
  port_development: { label: 'Port Development', color: '#a855f7', icon: '🚢' },
};

export const PROJECT_STATUS_CONFIG: Record<ProjectSite['status'], { label: string; color: string }> = {
  active: { label: 'Active', color: '#22c55e' },
  completed: { label: 'Completed', color: '#6b7280' },
  planned: { label: 'Planned', color: '#3b82f6' },
  on_hold: { label: 'On Hold', color: '#f59e0b' },
};

// Project risk assessment based on vessel health
import { getVesselIssueSummary } from '@/lib/vessel-issues';
import { getNMDCVesselByMMSI } from '@/lib/nmdc/fleet';

export interface ProjectRisk {
  project: ProjectSite;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'none';
  healthScore: number;
  vesselIssues: Array<{
    vesselName: string;
    mmsi: string;
    issueCount: number;
    worstHealth: number;
    hasCritical: boolean;
  }>;
  impactSummary: string;
  clientImpact: string;
  financialRisk: string;
}

export function getProjectRisk(project: ProjectSite): ProjectRisk {
  const vesselIssues: ProjectRisk['vesselIssues'] = [];
  let minHealth = 100;
  let totalIssues = 0;
  let hasCriticalIssue = false;

  for (const mmsi of project.assignedVessels) {
    const vessel = getNMDCVesselByMMSI(mmsi);
    const issueSummary = getVesselIssueSummary(mmsi);
    
    if (issueSummary.issueCount > 0) {
      vesselIssues.push({
        vesselName: vessel?.name || mmsi,
        mmsi,
        issueCount: issueSummary.issueCount,
        worstHealth: issueSummary.worstHealth || 100,
        hasCritical: issueSummary.hasCritical,
      });
      
      if (issueSummary.worstHealth && issueSummary.worstHealth < minHealth) {
        minHealth = issueSummary.worstHealth;
      }
      totalIssues += issueSummary.issueCount;
      if (issueSummary.hasCritical) hasCriticalIssue = true;
    }
  }

  // Determine risk level
  let riskLevel: ProjectRisk['riskLevel'] = 'none';
  if (hasCriticalIssue || minHealth < 60) riskLevel = 'critical';
  else if (totalIssues > 3 || minHealth < 70) riskLevel = 'high';
  else if (totalIssues > 0 || minHealth < 80) riskLevel = 'medium';
  else if (minHealth < 90) riskLevel = 'low';

  // Generate impact summaries
  const impactSummary = vesselIssues.length > 0
    ? `${vesselIssues.length} vessel${vesselIssues.length > 1 ? 's' : ''} with ${totalIssues} equipment issue${totalIssues > 1 ? 's' : ''}`
    : 'All systems operational';

  const clientImpact = riskLevel === 'critical' 
    ? `Potential ${Math.ceil(Math.random() * 5 + 3)}-day delay, client notification required`
    : riskLevel === 'high'
    ? `Schedule at risk, proactive client update recommended`
    : riskLevel === 'medium'
    ? `Minor impact possible, monitoring recommended`
    : 'On track';

  const projectValue = project.value ? parseFloat(project.value.replace(/[^\d.]/g, '')) : 0;
  const financialRisk = riskLevel === 'critical'
    ? `$${(projectValue * 0.05).toFixed(1)}M+ at risk (penalties/delays)`
    : riskLevel === 'high'
    ? `$${(projectValue * 0.02).toFixed(1)}M exposure`
    : 'Minimal';

  return {
    project,
    riskLevel,
    healthScore: minHealth,
    vesselIssues,
    impactSummary,
    clientImpact,
    financialRisk,
  };
}

export function getProjectsAtRisk(): ProjectRisk[] {
  return PROJECT_SITES
    .filter(p => p.status === 'active')
    .map(getProjectRisk)
    .filter(r => r.riskLevel !== 'none')
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
      return order[a.riskLevel] - order[b.riskLevel];
    });
}











