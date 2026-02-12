// Legacy Marine Project Sites Data

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

// Legacy marine energy vessels available for project assignment:
// - 470212000: DLS-4200 (Derrick Lay Semi-Submersible)
// - 471026000: DELMA 2000 (Pipelay Crane Vessel)  
// - 470285000: PLB-648 (Pipelay Barge)
// - 470339000: DLB-750 (Pipelay Barge - Side Lay)
// - 470284000: DLB-1000 (Pipelay Barge)
// - 470340000: SEP-450 (Self-Elevating Platform)
// - 470114000: SEP-550 (Self-Elevating Platform)
// - 470426000: SEP-650 (Self-Elevating Platform)
// - 470395000: SEP-750 (Self-Elevating Platform)
// - 470927000: UMM SHAIF (DP3 Offshore Support & Cable Lay)
// - 470337000: NPCC SAADIYAT (Tug/AHTS)
// - 470642000: NPCC YAS (Tug/AHTS)

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
    name: 'Hail & Ghasha Gas Development',
    client: 'ADNOC Gas',
    type: 'marine_construction',
    status: 'active',
    location: {
      lat: 24.8095,
      lng: 52.6458,
      area: 'Hail & Ghasha Fields',
    },
    description: 'Offshore EPC for sour gas gathering pipelines and platform tie-ins. Heavy lift operations for module installation at multiple wellhead platforms.',
    startDate: '2024-03-01',
    endDate: '2026-06-30',
    progress: 35,
    assignedVessels: ['470212000', '470285000', '470927000'], // DLS-4200, PLB-648, UMM SHAIF
    scope: {
      area: '32 km pipeline + 4 platforms',
      depth: '-35m',
    },
    value: 'AED 850M',
  },
  {
    id: 'proj-002',
    name: 'Umm Lulu Platform Maintenance',
    client: 'ADNOC Offshore',
    type: 'marine_construction',
    status: 'active',
    location: {
      lat: 24.5847,
      lng: 53.4982,
      area: 'Umm Lulu Field',
    },
    description: 'Platform maintenance and upgrade works at Umm Lulu oil field. Jack-up operations for equipment replacement and structural repairs.',
    startDate: '2024-01-15',
    endDate: '2025-12-31',
    progress: 62,
    assignedVessels: ['470340000', '470337000', '470642000'], // SEP-450, NPCC SAADIYAT, NPCC YAS
    scope: {
      area: '2 platforms',
      depth: '-28m',
    },
    value: 'AED 420M',
  },
  {
    id: 'proj-003',
    name: 'Das Island Flowline Replacement',
    client: 'ADNOC Gas Processing',
    type: 'marine_construction',
    status: 'active',
    location: {
      lat: 25.1522,
      lng: 52.8731,
      area: 'Das Island',
    },
    description: 'Replacement of aging subsea flowlines at Das Island LNG facility. Includes pipeline removal and new installation with corrosion-resistant coating.',
    startDate: '2024-06-01',
    endDate: '2025-08-31',
    progress: 28,
    assignedVessels: ['470285000', '470339000'], // PLB-648, DLB-750
    scope: {
      area: '18 km pipeline',
      depth: '-22m',
    },
    value: 'AED 180M',
  },
  {
    id: 'proj-004',
    name: 'Nasr Field Subsea Expansion',
    client: 'ADNOC Offshore',
    type: 'marine_construction',
    status: 'active',
    location: {
      lat: 24.3108,
      lng: 53.1306,
      area: 'Nasr Field',
    },
    description: 'Subsea infrastructure installation for Nasr field capacity expansion. Includes subsea manifolds, umbilicals, and tie-back pipelines.',
    startDate: '2025-01-10',
    progress: 15,
    assignedVessels: ['470284000', '470927000'], // DLB-1000, UMM SHAIF
    scope: {
      area: '24 km pipeline + 3 manifolds',
      depth: '-40m',
    },
    value: 'AED 195M',
  },
  {
    id: 'proj-005',
    name: 'Lower Zakum Artificial Islands',
    client: 'ADNOC Onshore',
    type: 'marine_construction',
    status: 'planned',
    location: {
      lat: 24.5369,
      lng: 53.4345,
      area: 'Lower Zakum Field',
    },
    description: 'Offshore EPC support for artificial islands development. Heavy lift installation of processing modules and pipeline tie-ins.',
    startDate: '2025-04-01',
    endDate: '2027-03-31',
    progress: 0,
    assignedVessels: [],
    scope: {
      area: '4 artificial islands',
      depth: '-15m',
    },
    value: 'AED 580M',
  },
  {
    id: 'proj-006',
    name: 'Satah Al Razboot (SARB) Hook-up',
    client: 'ADNOC Offshore',
    type: 'marine_construction',
    status: 'active',
    location: {
      lat: 24.4522,
      lng: 53.2731,
      area: 'SARB Field',
    },
    description: 'Platform hook-up and commissioning for SARB offshore complex. Jack-up operations for module installation and pipeline tie-ins.',
    startDate: '2024-09-01',
    endDate: '2025-11-30',
    progress: 45,
    assignedVessels: ['470114000', '470426000'], // SEP-550, SEP-650
    scope: {
      area: '2 platforms',
      depth: '-32m',
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
    assignedVessels: ['470395000', '470340000', '470337000'], // SEP-750, SEP-450, NPCC SAADIYAT
    scope: {
      area: '3 platforms',
      depth: '-35m',
    },
    value: 'AED 280M ($76M)',
  },
  {
    id: 'proj-007',
    name: 'Bu Hasa Pipeline Extension',
    client: 'ADNOC Onshore',
    type: 'marine_construction',
    status: 'completed',
    location: {
      lat: 23.5264,
      lng: 53.3428,
      area: 'Bu Hasa Field',
    },
    description: 'Onshore/offshore pipeline extension from Bu Hasa field to coastal processing facility. Completed ahead of schedule.',
    startDate: '2023-02-01',
    endDate: '2024-10-15',
    progress: 100,
    assignedVessels: [],
    scope: {
      area: '65 km pipeline',
      depth: '-12m',
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

  // Determine risk level - stricter thresholds for meaningful alerts
  // Only flag projects with truly critical situations (targeting ~3 projects)
  let riskLevel: ProjectRisk['riskLevel'] = 'none';
  if (hasCriticalIssue && minHealth < 53) riskLevel = 'critical';
  else if (hasCriticalIssue && minHealth < 57) riskLevel = 'high';
  else if (totalIssues >= 6 && minHealth < 60) riskLevel = 'medium';
  else if (totalIssues >= 5 && minHealth < 65) riskLevel = 'low';

  // Generate impact summaries
  const impactSummary = vesselIssues.length > 0
    ? `${vesselIssues.length} vessel${vesselIssues.length > 1 ? 's' : ''} with ${totalIssues} equipment issue${totalIssues > 1 ? 's' : ''}`
    : 'All systems operational';

  // Deterministic delay based on health
  const delayDays = Math.ceil((100 - minHealth) / 10) + 3;
  const clientImpact = riskLevel === 'critical' 
    ? `Potential ${delayDays}-day delay, client notification required`
    : riskLevel === 'high'
    ? `Schedule at risk, proactive client update recommended`
    : riskLevel === 'medium'
    ? `Minor impact possible, monitoring recommended`
    : 'On track';

  // Parse project value - extract first number only (before any parentheses)
  const valueMatch = project.value?.match(/[\d.]+/);
  const projectValue = valueMatch ? parseFloat(valueMatch[0]) : 0;
  
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
    .filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high')
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
      return order[a.riskLevel] - order[b.riskLevel];
    });
}











