/**
 * NMDC Fleet Configuration
 * 
 * National Marine Dredging Company - UAE's leading marine contractor
 * Specialized in dredging, marine construction, and offshore services
 * 
 * This module contains NMDC's vessel fleet data for demo purposes.
 * Real-time positions are fetched from Datalastic API using MMSI numbers.
 */

export interface NMDCVessel {
  mmsi: string;
  name: string;
  imo?: string;
  type: 'dredger' | 'hopper_dredger' | 'csd' | 'tug' | 'supply' | 'barge' | 'survey';
  subType: string;
  project?: string;
  captain?: string;
  crewCount?: number;
  specs?: {
    length?: number;
    breadth?: number;
    dredgingDepth?: number;
    pumpPower?: string;
    yearBuilt?: number;
  };
}

/**
 * NMDC Fleet - UAE Dredging & Offshore Vessels
 * MMSIs verified against Datalastic API (country_iso: AE, type: dredger/offshore)
 */
export const NMDC_FLEET: NMDCVessel[] = [
  // === TRAILING SUCTION HOPPER DREDGERS ===
  {
    mmsi: '470624000',
    name: 'GHASHA',
    imo: '9880958',
    type: 'hopper_dredger',
    subType: 'Trailing Suction Hopper Dredger',
    project: 'Ghasha Concession Development',
    captain: 'Capt. Ahmed Al Mazrouei',
    crewCount: 28,
    specs: {
      length: 115,
      breadth: 22,
      dredgingDepth: 35,
      pumpPower: '5,500 kW',
      yearBuilt: 2020,
    },
  },
  {
    mmsi: '471072000',
    name: 'ARZANA',
    imo: '9817028',
    type: 'hopper_dredger',
    subType: 'Trailing Suction Hopper Dredger',
    project: 'Abu Dhabi Ports Expansion',
    captain: 'Capt. Mohammed Al Ketbi',
    crewCount: 26,
    specs: {
      length: 108,
      breadth: 20,
      dredgingDepth: 30,
      pumpPower: '4,800 kW',
      yearBuilt: 2018,
    },
  },
  
  // === CUTTER SUCTION DREDGERS ===
  {
    mmsi: '470563000',
    name: 'AL SADR',
    imo: '8639546',
    type: 'csd',
    subType: 'Cutter Suction Dredger',
    project: 'Khalifa Port Extension',
    captain: 'Capt. Rashid Al Shamsi',
    crewCount: 24,
    specs: {
      length: 85,
      breadth: 16,
      dredgingDepth: 25,
      pumpPower: '3,200 kW',
      yearBuilt: 1986,
    },
  },
  {
    mmsi: '471018000',
    name: 'AL MIRFA',
    imo: '8639534',
    type: 'csd',
    subType: 'Cutter Suction Dredger',
    project: 'Ruwais LNG Terminal',
    captain: 'Capt. Hassan Al Dhaheri',
    crewCount: 22,
    specs: {
      length: 82,
      breadth: 15,
      dredgingDepth: 22,
      pumpPower: '2,800 kW',
      yearBuilt: 1986,
    },
  },
  
  // === DREDGERS & WORK VESSELS ===
  {
    mmsi: '470510000',
    name: 'AL HAMRA',
    type: 'dredger',
    subType: 'Grab Dredger',
    project: 'Dubai Maritime City',
    captain: 'Capt. Khalid Al Mansouri',
    crewCount: 18,
  },
  {
    mmsi: '470593000',
    name: 'KHALEEJ BAY',
    type: 'dredger',
    subType: 'Backhoe Dredger',
    project: 'Fujairah Port Deepening',
    captain: 'Capt. Salem Al Qubaisi',
    crewCount: 16,
  },
  {
    mmsi: '470805000',
    name: 'MARAWAH',
    type: 'dredger',
    subType: 'Self-Propelled Split Hopper Barge',
    project: 'Sir Bani Yas Island',
    captain: 'Capt. Omar Al Zaabi',
    crewCount: 14,
  },
  {
    mmsi: '470806000',
    name: 'AL YASSAT',
    type: 'dredger',
    subType: 'Split Hopper Barge',
    project: 'Al Raha Beach Development',
    captain: 'Capt. Faisal Al Nuaimi',
    crewCount: 12,
  },
  {
    mmsi: '470818000',
    name: 'SHARK BAY',
    imo: '9231913',
    type: 'tug',
    subType: 'Anchor Handling Tug',
    project: 'Fleet Support',
    captain: 'Capt. Youssef Al Balushi',
    crewCount: 10,
  },
  {
    mmsi: '470817000',
    name: 'JANANAH',
    type: 'dredger',
    subType: 'Trailing Suction Hopper Dredger',
    project: 'Saadiyat Island Marina',
    captain: 'Capt. Ibrahim Al Ameri',
    crewCount: 20,
  },
  
  // === TUGS ===
  {
    mmsi: '470922000',
    name: 'AL JABER XII',
    imo: '9352808',
    type: 'tug',
    subType: 'Harbor Tug',
    project: 'Fleet Support - Abu Dhabi',
    captain: 'Capt. Hamad Al Shamisi',
    crewCount: 8,
  },
  
  // === SUPPLY & SUPPORT VESSELS ===
  {
    mmsi: '470869000',
    name: 'AL GHALLAN',
    imo: '8750041',
    type: 'supply',
    subType: 'Offshore Supply Ship',
    project: 'ADNOC Offshore Support',
    captain: 'Capt. Nasser Al Marzouqi',
    crewCount: 16,
  },
  {
    mmsi: '470678000',
    name: 'BARRACUDA',
    imo: '8129137',
    type: 'supply',
    subType: 'Offshore Supply Ship',
    project: 'Hail & Ghasha Field Services',
    captain: 'Capt. Waleed Al Suwaidi',
    crewCount: 14,
  },
  {
    mmsi: '470646000',
    name: 'INCHCAPE 5',
    imo: '8948595',
    type: 'supply',
    subType: 'Offshore Supply Ship',
    project: 'Dalma Field Operations',
    captain: 'Capt. Majid Al Remeithi',
    crewCount: 14,
  },
  
  // === SURVEY VESSEL ===
  {
    mmsi: '470442000',
    name: 'UNIQUE SURVEYOR 1',
    type: 'survey',
    subType: 'Hydrographic Survey Vessel',
    project: 'Seabed Mapping - Western Region',
    captain: 'Capt. Tarek Al Hashimi',
    crewCount: 10,
  },
];

/**
 * Get vessel type display color
 */
export function getNMDCVesselColor(type: NMDCVessel['type']): string {
  const colors: Record<NMDCVessel['type'], string> = {
    dredger: '#f97316',      // Orange
    hopper_dredger: '#ef4444', // Red
    csd: '#a855f7',          // Purple
    tug: '#10b981',          // Green
    supply: '#3b82f6',       // Blue
    barge: '#f59e0b',        // Amber
    survey: '#06b6d4',       // Cyan
  };
  return colors[type] || '#9ca3af';
}

/**
 * Get vessel type display name
 */
export function getNMDCVesselTypeName(type: NMDCVessel['type']): string {
  const names: Record<NMDCVessel['type'], string> = {
    dredger: 'Dredger',
    hopper_dredger: 'Hopper Dredger',
    csd: 'Cutter Suction Dredger',
    tug: 'Tug',
    supply: 'Supply Vessel',
    barge: 'Barge',
    survey: 'Survey Vessel',
  };
  return names[type] || type;
}

/**
 * Get all MMSI numbers for bulk API request
 */
export function getNMDCFleetMMSIs(): string[] {
  return NMDC_FLEET.map(v => v.mmsi);
}

/**
 * Find vessel config by MMSI
 */
export function getNMDCVesselByMMSI(mmsi: string): NMDCVessel | undefined {
  return NMDC_FLEET.find(v => v.mmsi === mmsi);
}

/**
 * Active projects summary
 */
export function getNMDCActiveProjects(): { project: string; vessels: NMDCVessel[] }[] {
  const projectMap = new Map<string, NMDCVessel[]>();
  
  NMDC_FLEET.forEach(vessel => {
    if (vessel.project) {
      const existing = projectMap.get(vessel.project) || [];
      existing.push(vessel);
      projectMap.set(vessel.project, existing);
    }
  });
  
  return Array.from(projectMap.entries())
    .map(([project, vessels]) => ({ project, vessels }))
    .sort((a, b) => b.vessels.length - a.vessels.length);
}

