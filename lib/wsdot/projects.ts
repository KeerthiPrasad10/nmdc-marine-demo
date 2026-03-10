// WSDOT Ferry Route Operations Data
// Compatible interface with the old projects module for pages that depend on it

import { getWSDOTVesselByMMSI } from '@/lib/wsdot/fleet';
import { FERRY_ROUTES, FERRY_TERMINALS } from '@/lib/wsdot/routes';

export interface ProjectSite {
  id: string;
  name: string;
  client: string;
  type: 'passenger_service' | 'vehicle_service' | 'maintenance' | 'emergency_response' | 'route_expansion';
  status: 'active' | 'completed' | 'planned' | 'on_hold';
  location: {
    lat: number;
    lng: number;
    area: string;
  };
  description: string;
  startDate: string;
  endDate?: string;
  progress?: number;
  assignedVessels: string[]; // MMSIs
  scope?: {
    routeLength?: string;
    travelTime?: string;
    area?: string;
  };
  value?: string;
}

export const PROJECT_SITES: ProjectSite[] = [
  {
    id: 'route-sea-bi',
    name: 'Seattle - Bainbridge Island Service',
    client: 'WSDOT Ferries Division',
    type: 'passenger_service',
    status: 'active',
    location: {
      lat: 47.6130,
      lng: -122.4246,
      area: 'Elliott Bay, Puget Sound',
    },
    description: 'Primary cross-Sound ferry service connecting downtown Seattle (Colman Dock) to Bainbridge Island. Highest ridership route in the system.',
    startDate: '2024-01-01',
    progress: 100,
    assignedVessels: ['366709770', '366709780', '366709790'],
    scope: {
      routeLength: '7.3 nm',
      travelTime: '35 minutes',
    },
    value: '$48M annual operating budget',
  },
  {
    id: 'route-sea-br',
    name: 'Seattle - Bremerton Service',
    client: 'WSDOT Ferries Division',
    type: 'passenger_service',
    status: 'active',
    location: {
      lat: 47.5820,
      lng: -122.4815,
      area: 'Puget Sound Central',
    },
    description: 'Long-haul cross-Sound route connecting Seattle to the naval city of Bremerton. Scenic route with views of the Olympic Mountains.',
    startDate: '2024-01-01',
    progress: 100,
    assignedVessels: ['366709790', '366709820'],
    scope: {
      routeLength: '14.5 nm',
      travelTime: '60 minutes',
    },
    value: '$35M annual operating budget',
  },
  {
    id: 'route-ed-ki',
    name: 'Edmonds - Kingston Service',
    client: 'WSDOT Ferries Division',
    type: 'vehicle_service',
    status: 'active',
    location: {
      lat: 47.8050,
      lng: -122.4393,
      area: 'North Sound',
    },
    description: 'Critical north-Sound vehicle crossing connecting Snohomish County to the Kitsap Peninsula. Key commuter and commercial route.',
    startDate: '2024-01-01',
    progress: 100,
    assignedVessels: ['366709810', '366709830'],
    scope: {
      routeLength: '5.7 nm',
      travelTime: '30 minutes',
    },
    value: '$28M annual operating budget',
  },
  {
    id: 'route-mu-cl',
    name: 'Mukilteo - Clinton Service',
    client: 'WSDOT Ferries Division',
    type: 'vehicle_service',
    status: 'active',
    location: {
      lat: 47.9615,
      lng: -122.3267,
      area: 'Whidbey Island Gateway',
    },
    description: 'Gateway to Whidbey Island from the mainland. High-frequency service with short crossing time.',
    startDate: '2024-01-01',
    progress: 100,
    assignedVessels: ['366709880', '366709950'],
    scope: {
      routeLength: '3.9 nm',
      travelTime: '20 minutes',
    },
    value: '$22M annual operating budget',
  },
  {
    id: 'route-fvs',
    name: 'Fauntleroy - Vashon - Southworth Triangle',
    client: 'WSDOT Ferries Division',
    type: 'passenger_service',
    status: 'active',
    location: {
      lat: 47.5110,
      lng: -122.4520,
      area: 'Vashon Island, South Sound',
    },
    description: 'Triangle route serving Vashon Island and Kitsap Peninsula from West Seattle. Complex three-terminal scheduling.',
    startDate: '2024-01-01',
    progress: 100,
    assignedVessels: ['366709840', '366709850', '366709870', '366709960', '366709970'],
    scope: {
      routeLength: '4.8 nm per leg',
      travelTime: '25 minutes',
    },
    value: '$32M annual operating budget',
  },
  {
    id: 'route-pd-ta',
    name: 'Point Defiance - Tahlequah Service',
    client: 'WSDOT Ferries Division',
    type: 'vehicle_service',
    status: 'active',
    location: {
      lat: 47.3196,
      lng: -122.5107,
      area: 'South Vashon, Tacoma',
    },
    description: 'Short crossing connecting Tacoma to the southern tip of Vashon Island. Shortest route in the system.',
    startDate: '2024-01-01',
    progress: 100,
    assignedVessels: ['366709830', '366709920'],
    scope: {
      routeLength: '1.6 nm',
      travelTime: '15 minutes',
    },
    value: '$12M annual operating budget',
  },
  {
    id: 'route-an-sj',
    name: 'Anacortes - San Juan Islands Service',
    client: 'WSDOT Ferries Division',
    type: 'passenger_service',
    status: 'active',
    location: {
      lat: 48.5500,
      lng: -122.9400,
      area: 'San Juan Islands',
    },
    description: 'Multi-stop scenic route through the San Juan Islands archipelago. Serves Lopez, Shaw, Orcas, and San Juan Islands.',
    startDate: '2024-01-01',
    progress: 100,
    assignedVessels: ['366709860', '366709900', '366709930'],
    scope: {
      routeLength: '22.0 nm',
      travelTime: '75 minutes (full route)',
    },
    value: '$42M annual operating budget',
  },
  {
    id: 'route-co-pt',
    name: 'Coupeville - Port Townsend Service',
    client: 'WSDOT Ferries Division',
    type: 'vehicle_service',
    status: 'active',
    location: {
      lat: 48.1363,
      lng: -122.7576,
      area: 'Admiralty Inlet',
    },
    description: 'Connects Whidbey Island to the Olympic Peninsula across Admiralty Inlet. Subject to weather-related disruptions.',
    startDate: '2024-01-01',
    progress: 100,
    assignedVessels: ['366709910', '366709940'],
    scope: {
      routeLength: '4.2 nm',
      travelTime: '30 minutes',
    },
    value: '$15M annual operating budget',
  },
  {
    id: 'proj-terminal-upgrade',
    name: 'Colman Dock Terminal Modernization',
    client: 'WSDOT Capital Program',
    type: 'maintenance',
    status: 'active',
    location: {
      lat: 47.6023,
      lng: -122.3387,
      area: 'Seattle Waterfront',
    },
    description: 'Major seismic retrofit and modernization of the Colman Dock terminal in downtown Seattle. Includes new passenger waiting areas and vehicle staging.',
    startDate: '2023-06-01',
    endDate: '2025-12-31',
    progress: 72,
    assignedVessels: [],
    scope: {
      area: '45,000 sq ft terminal',
    },
    value: '$350M capital investment',
  },
  {
    id: 'proj-hybrid-conversion',
    name: 'Hybrid-Electric Ferry Conversion Program',
    client: 'WSDOT Green Initiative',
    type: 'route_expansion',
    status: 'planned',
    location: {
      lat: 47.5618,
      lng: -122.6244,
      area: 'Eagle Harbor Maintenance Facility',
    },
    description: 'Conversion of Olympic-class vessels to hybrid-electric propulsion. Part of WSDOT goal to achieve zero-emissions fleet by 2040.',
    startDate: '2025-03-01',
    endDate: '2027-12-31',
    progress: 15,
    assignedVessels: ['366709910', '366709920', '366709930', '366709940', '366709950'],
    scope: {
      area: '5 vessels',
    },
    value: '$180M program budget',
  },
];

export function getActiveProjects(): ProjectSite[] {
  return PROJECT_SITES.filter(p => p.status === 'active');
}

export function getProjectById(id: string): ProjectSite | undefined {
  return PROJECT_SITES.find(p => p.id === id);
}

export function getProjectsByVessel(mmsi: string): ProjectSite[] {
  return PROJECT_SITES.filter(p => p.assignedVessels.includes(mmsi));
}

export function getProjectStats() {
  const active = PROJECT_SITES.filter(p => p.status === 'active').length;
  const completed = PROJECT_SITES.filter(p => p.status === 'completed').length;
  const planned = PROJECT_SITES.filter(p => p.status === 'planned').length;
  const onHold = PROJECT_SITES.filter(p => p.status === 'on_hold').length;
  const totalVesselsAssigned = new Set(PROJECT_SITES.flatMap(p => p.assignedVessels)).size;

  const activeProjects = PROJECT_SITES.filter(p => p.status === 'active');
  const avgProgress = activeProjects.length > 0
    ? Math.round(activeProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / activeProjects.length)
    : 0;

  return {
    active,
    completed,
    planned,
    onHold,
    total: PROJECT_SITES.length,
    totalVesselsAssigned,
    avgProgress,
  };
}

export const PROJECT_TYPE_CONFIG: Record<ProjectSite['type'], { label: string; color: string; icon: string }> = {
  passenger_service: { label: 'Passenger Service', color: '#3b82f6', icon: '⛴️' },
  vehicle_service: { label: 'Vehicle Service', color: '#10b981', icon: '🚗' },
  maintenance: { label: 'Maintenance', color: '#f97316', icon: '🔧' },
  emergency_response: { label: 'Emergency Response', color: '#ef4444', icon: '🚨' },
  route_expansion: { label: 'Route Expansion', color: '#8b5cf6', icon: '🗺️' },
};

export const PROJECT_STATUS_CONFIG: Record<ProjectSite['status'], { label: string; color: string }> = {
  active: { label: 'Active', color: '#22c55e' },
  completed: { label: 'Completed', color: '#3b82f6' },
  planned: { label: 'Planned', color: '#a855f7' },
  on_hold: { label: 'On Hold', color: '#f97316' },
};

export interface ProjectRisk {
  project: ProjectSite;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: string[];
  recommendation: string;
}

export function getProjectRisk(project: ProjectSite): ProjectRisk {
  let riskScore = 0;
  const factors: string[] = [];

  // Check weather exposure
  if (project.location.area.includes('Admiralty Inlet') || project.location.area.includes('San Juan')) {
    riskScore += 25;
    factors.push('High weather exposure area');
  }

  // Check vessel assignment gaps
  if (project.assignedVessels.length === 0 && project.status === 'active') {
    riskScore += 30;
    factors.push('No vessels assigned');
  } else if (project.assignedVessels.length === 1) {
    riskScore += 15;
    factors.push('Single vessel coverage - no backup');
  }

  // Check progress
  if (project.progress !== undefined && project.progress < 50 && project.status === 'active') {
    riskScore += 10;
    factors.push('Below expected progress');
  }

  // Check for old vessels
  const oldVessels = project.assignedVessels.filter(mmsi => {
    const vessel = getWSDOTVesselByMMSI(mmsi);
    return vessel && vessel.specs?.yearBuilt && vessel.specs.yearBuilt < 1980;
  });
  if (oldVessels.length > 0) {
    riskScore += 20;
    factors.push(`${oldVessels.length} vessel(s) older than 45 years`);
  }

  let riskLevel: ProjectRisk['riskLevel'] = 'low';
  if (riskScore >= 60) riskLevel = 'critical';
  else if (riskScore >= 40) riskLevel = 'high';
  else if (riskScore >= 20) riskLevel = 'medium';

  return {
    project,
    riskLevel,
    riskScore,
    factors: factors.length > 0 ? factors : ['Operating within normal parameters'],
    recommendation: riskScore >= 40
      ? 'Review vessel assignments and schedule contingency plans'
      : 'Continue monitoring',
  };
}

export function getProjectsAtRisk(): ProjectRisk[] {
  return PROJECT_SITES
    .map(getProjectRisk)
    .filter(r => r.riskLevel !== 'low')
    .sort((a, b) => b.riskScore - a.riskScore);
}

