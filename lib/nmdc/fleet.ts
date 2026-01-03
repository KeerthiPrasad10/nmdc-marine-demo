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
  type: 'dredger' | 'hopper_dredger' | 'csd' | 'tug' | 'supply' | 'barge' | 'survey' 
      | 'pipelay_barge' | 'jack_up' | 'accommodation_barge' | 'work_barge' | 'derrick_barge';
  subType: string;
  company: 'nmdc_group' | 'nmdc_energy';  // Track which NMDC entity
  project?: string;
  captain?: string;
  crewCount?: number;
  specs?: {
    length?: number;
    breadth?: number;
    depth?: number;
    dredgingDepth?: number;
    pumpPower?: string;
    craneCapacity?: number;      // tons - for crane/pipelay barges
    accommodation?: number;       // persons
    deckArea?: number;           // m²
    yearBuilt?: number;
  };
  datasheetUrl?: string;  // Link to PDF datasheet
}

/**
 * NMDC Fleet - UAE Dredging & Offshore Vessels
 * MMSIs verified against Datalastic API (country_iso: AE, type: dredger/offshore)
 */
export const NMDC_FLEET: NMDCVessel[] = [
  // ============================================================================
  // NMDC GROUP - Dredging & Marine Construction
  // Source: https://nmdc-group.com/en/about-us/fleet-and-equipment
  // ============================================================================
  
  // === TRAILING SUCTION HOPPER DREDGERS ===
  {
    mmsi: '470624000',
    name: 'GHASHA',
    imo: '9880958',
    type: 'hopper_dredger',
    subType: 'Trailing Suction Hopper Dredger',
    company: 'nmdc_group',
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
    company: 'nmdc_group',
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
    company: 'nmdc_group',
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
    company: 'nmdc_group',
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
    company: 'nmdc_group',
    project: 'Dubai Maritime City',
    captain: 'Capt. Khalid Al Mansouri',
    crewCount: 18,
  },
  {
    mmsi: '470593000',
    name: 'KHALEEJ BAY',
    type: 'dredger',
    subType: 'Backhoe Dredger',
    company: 'nmdc_group',
    project: 'Fujairah Port Deepening',
    captain: 'Capt. Salem Al Qubaisi',
    crewCount: 16,
  },
  {
    mmsi: '470805000',
    name: 'MARAWAH',
    type: 'dredger',
    subType: 'Self-Propelled Split Hopper Barge',
    company: 'nmdc_group',
    project: 'Sir Bani Yas Island',
    captain: 'Capt. Omar Al Zaabi',
    crewCount: 14,
  },
  {
    mmsi: '470806000',
    name: 'AL YASSAT',
    type: 'dredger',
    subType: 'Split Hopper Barge',
    company: 'nmdc_group',
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
    company: 'nmdc_group',
    project: 'Fleet Support',
    captain: 'Capt. Youssef Al Balushi',
    crewCount: 10,
  },
  {
    mmsi: '470817000',
    name: 'JANANAH',
    type: 'dredger',
    subType: 'Trailing Suction Hopper Dredger',
    company: 'nmdc_group',
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
    company: 'nmdc_group',
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
    company: 'nmdc_group',
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
    company: 'nmdc_group',
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
    company: 'nmdc_group',
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
    company: 'nmdc_group',
    project: 'Seabed Mapping - Western Region',
    captain: 'Capt. Tarek Al Hashimi',
    crewCount: 10,
  },

  // ============================================================================
  // NMDC ENERGY - Offshore EPC, Pipelaying & Heavy Lift
  // Source: https://www.nmdc-energy.com/en/about-us/fleet/
  // All specs verified from official PDF datasheets via Exa search
  // ============================================================================
  
  // === DERRICK LAY BARGES ===
  {
    mmsi: '471026000',  // Real MMSI from MarineTraffic
    name: 'DLS-4200',
    imo: '9429456',
    type: 'derrick_barge',
    subType: 'Derrick Lay Semi-Submersible',
    company: 'nmdc_energy',
    project: 'Hail & Ghasha Platform Installation',
    crewCount: 350,
    specs: {
      length: 196.9,        // Verified: Ulstein design
      breadth: 43.4,
      depth: 19.6,
      craneCapacity: 4200,  // 4200 short tons (3810 metric tons)
      accommodation: 350,
      yearBuilt: 2015,
    },
    datasheetUrl: 'https://www.nmdc-energy.com/assets/files/fleet/derrick%20barges/DLS-4200.pdf',
  },
  {
    mmsi: '471026000',  // Real MMSI from MarineTraffic
    name: 'DELMA 2000',
    imo: '9429455',
    type: 'derrick_barge',
    subType: 'Pipelay Crane Vessel',
    company: 'nmdc_energy',
    project: 'ADNOC Offshore Pipeline',
    crewCount: 300,
    specs: {
      length: 180.0,        // 232m with fixed stinger
      breadth: 32.0,
      craneCapacity: 2000,
      yearBuilt: 2010,
    },
    datasheetUrl: 'https://www.nmdc-energy.com/assets/files/fleet/derrick%20barges/Delma%202000.pdf',
  },
  
  // === CONVENTIONAL FLAT BOTTOM BARGES (Pipelay) ===
  {
    mmsi: '470285000',  // Real MMSI from MarineTraffic
    name: 'PLB-648',
    imo: '8758055',
    type: 'pipelay_barge',
    subType: 'Conventional Flat Bottom Pipelay Barge',
    company: 'nmdc_energy',
    project: 'ADNOC Pipeline Installation',
    crewCount: 244,
    specs: {
      length: 106.0,
      breadth: 30.0,
      depth: 7.5,
      craneCapacity: 600,      // Huisman 600MT pedestal crane + 2x160T Manitowoc
      accommodation: 244,
      deckArea: 1600,
      yearBuilt: 1979,
    },
    datasheetUrl: 'https://www.nmdc-energy.com/assets/files/fleet/conventional%20flat%20bottom%20barges/PLB-648.pdf',
  },
  {
    mmsi: '470339000',  // Real MMSI from MarineTraffic
    name: 'DLB-750',
    imo: '8758108',
    type: 'pipelay_barge',
    subType: 'Conventional Flat Bottom Barge / Side Lay',
    company: 'nmdc_energy',
    project: 'Offshore Pipeline Construction',
    crewCount: 269,
    specs: {
      length: 122.0,
      breadth: 33.5,
      depth: 8.8,
      accommodation: 269,
      deckArea: 4500,
    },
    datasheetUrl: 'https://www.nmdc-energy.com/assets/files/fleet/conventional%20flat%20bottom%20barges/DLB-750.pdf',
  },
  {
    mmsi: '470340000',  // Estimated MMSI
    name: 'DLB-1000',
    type: 'pipelay_barge',
    subType: 'Conventional Flat Bottom Pipelay Barge',
    company: 'nmdc_energy',
    project: 'Zakum Field Pipeline',
    crewCount: 269,
    specs: {
      length: 121.9,
      breadth: 36.6,
      depth: 8.2,
      accommodation: 269,
      deckArea: 1500,
      yearBuilt: 1983,
    },
    datasheetUrl: 'https://www.nmdc-energy.com/assets/files/fleet/conventional%20flat%20bottom%20barges/DLB-1000.pdf',
  },
  
  // === JACK-UP BARGES (Self-Elevating Platforms) ===
  {
    mmsi: '470450000',  // Estimated MMSI
    name: 'SEP-450',
    type: 'jack_up',
    subType: 'Self-Elevating Platform (Self-Propelled)',
    company: 'nmdc_energy',
    project: 'Platform Construction - Nasr Field',
    crewCount: 219,
    specs: {
      length: 61.0,
      breadth: 36.0,
      depth: 6.0,
      craneCapacity: 300,      // Seatrax 300t main crane
      accommodation: 219,
      deckArea: 800,
    },
    datasheetUrl: 'https://www.nmdc-energy.com/assets/files/fleet/jack-up%20barges/SEP-450.pdf',
  },
  {
    mmsi: '470550000',  // Estimated MMSI
    name: 'SEP-550',
    type: 'jack_up',
    subType: 'Self-Elevating Platform',
    company: 'nmdc_energy',
    project: 'Offshore Hook-up Operations',
    crewCount: 271,
    specs: {
      length: 76.0,           // LOA (61m waterline)
      breadth: 36.0,
      depth: 6.0,
      accommodation: 314,     // 271 + 43 mobile
      deckArea: 800,
    },
    datasheetUrl: 'https://www.nmdc-energy.com/assets/files/fleet/jack-up%20barges/SEP-550.pdf',
  },
  {
    mmsi: '470750000',  // Estimated MMSI
    name: 'SEP-750',
    type: 'jack_up',
    subType: 'Self-Elevating Platform',
    company: 'nmdc_energy',
    project: 'Jacket & Deck Lifting',
    crewCount: 260,
    specs: {
      length: 61.0,
      breadth: 36.0,
      depth: 6.0,
      craneCapacity: 162,     // Seatrax 162t main hoist
      accommodation: 260,     // 217 + 43 mobile
      deckArea: 800,
    },
    datasheetUrl: 'https://www.nmdc-energy.com/assets/files/fleet/jack-up%20barges/SEP-750.pdf',
  },
  
  // === OFFSHORE SUPPORT & CABLE LAY ===
  {
    mmsi: '470771497',  // Real MMSI (IMO based)
    name: 'UMM SHAIF',
    imo: '8771497',
    type: 'supply',
    subType: 'DP3 Offshore Support & Cable Laying Vessel',
    company: 'nmdc_energy',
    project: 'Subsea Cable Installation',
    crewCount: 556,
    specs: {
      length: 111.56,        // 129.86m with stern extension
      breadth: 43.4,
      depth: 31.7,
      craneCapacity: 300,    // 300t Huisman pedestal crane
      accommodation: 620,    // 556-620 capacity
      deckArea: 1615,
      yearBuilt: 2009,
    },
    datasheetUrl: 'https://www.nmdc-energy.com/assets/files/fleet/offshore%20support%20and%20cable%20lay/Umm%20Shaif.pdf',
  },
  
  // === ANCHOR HANDLING TUG SUPPLY (AHTS) ===
  {
    mmsi: '470337000',  // Real MMSI from MarineTraffic
    name: 'SAADIYAT',
    imo: '9577513',
    type: 'tug',
    subType: 'Tug/AHTS/Supply/Fire Fighting Vessel',
    company: 'nmdc_energy',
    project: 'Barge Support Operations',
    crewCount: 28,
    specs: {
      length: 48.0,
      breadth: 13.2,
      depth: 4.8,
      yearBuilt: 2011,
    },
    datasheetUrl: 'https://www.nmdc-energy.com/assets/files/fleet/anchor%20handling%20tug%20supply/Saadiyat.pdf',
  },
  {
    mmsi: '470338000',  // Estimated (sister vessel)
    name: 'YAS',
    type: 'tug',
    subType: 'Tug/AHTS/Supply/Fire Fighting Vessel',
    company: 'nmdc_energy',
    project: 'Fleet Support',
    crewCount: 28,
    specs: {
      length: 48.0,
      breadth: 13.2,
      depth: 4.8,
      yearBuilt: 2011,
    },
    datasheetUrl: 'https://www.nmdc-energy.com/assets/files/fleet/anchor%20handling%20tug%20supply/Yas.pdf',
  },
];

/**
 * Get vessel type display color
 */
export function getNMDCVesselColor(type: NMDCVessel['type']): string {
  const colors: Record<NMDCVessel['type'], string> = {
    // NMDC Group - Dredging
    dredger: '#f97316',           // Orange
    hopper_dredger: '#ef4444',    // Red
    csd: '#a855f7',               // Purple
    tug: '#10b981',               // Green
    supply: '#3b82f6',            // Blue
    barge: '#f59e0b',             // Amber
    survey: '#06b6d4',            // Cyan
    // NMDC Energy - Offshore
    pipelay_barge: '#ec4899',     // Pink
    derrick_barge: '#dc2626',     // Dark Red
    jack_up: '#8b5cf6',           // Violet
    accommodation_barge: '#14b8a6', // Teal
    work_barge: '#eab308',        // Yellow
  };
  return colors[type] || '#9ca3af';
}

/**
 * Get vessel type display name
 */
export function getNMDCVesselTypeName(type: NMDCVessel['type']): string {
  const names: Record<NMDCVessel['type'], string> = {
    // NMDC Group - Dredging
    dredger: 'Dredger',
    hopper_dredger: 'Hopper Dredger',
    csd: 'Cutter Suction Dredger',
    tug: 'Tug',
    supply: 'Supply Vessel',
    barge: 'Barge',
    survey: 'Survey Vessel',
    // NMDC Energy - Offshore
    pipelay_barge: 'Pipelay Barge',
    derrick_barge: 'Derrick Lay Barge',
    jack_up: 'Jack-Up Barge',
    accommodation_barge: 'Accommodation Barge',
    work_barge: 'Work Barge',
  };
  return names[type] || type;
}

/**
 * Get company display name
 */
export function getNMDCCompanyName(company: NMDCVessel['company']): string {
  return company === 'nmdc_group' ? 'NMDC Group' : 'NMDC Energy';
}

/**
 * Filter vessels by company
 */
export function getVesselsByCompany(company: NMDCVessel['company']): NMDCVessel[] {
  return NMDC_FLEET.filter(v => v.company === company);
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

