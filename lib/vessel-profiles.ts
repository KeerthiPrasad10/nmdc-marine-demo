// Legacy Fleet Vessel Profiles with specifications and documentation links
// Data sourced from official resources.
// For detailed fleet information, refer to the Investor Presentations and Integrated Reports.

export interface VesselProfile {
  id: string;
  name: string;
  type: 'dredger' | 'tugboat' | 'supply_vessel' | 'crane_barge' | 'survey_vessel' 
      | 'pipelay_barge' | 'derrick_barge' | 'jack_up_barge' | 'accommodation_barge' | 'work_barge';
  subtype: string;
  company: 'legacy_marine_group' | 'legacy_marine_energy';
  
  // Specifications
  specs: {
    lengthOverall: number; // meters
    breadth: number; // meters
    depth: number; // meters
    dredgingDepth?: number; // meters (for dredgers)
    maxSpeed?: number; // knots
    grossTonnage?: number; // GT
    deadweight?: number; // DWT
    craneCapacity?: number; // tons (for crane barges)
    accommodation?: number; // persons
    propulsion?: string;
    powerInstalled?: number; // kW
    yearBuilt?: number;
    flag?: string;
    classNotation?: string;
  };
  
  // Equipment systems for PdM
  systems: VesselSystem[];
  
  // Documentation
  docs: {
    fleetPageUrl?: string;
    investorPresentationUrl?: string;
    integratedReportUrl?: string;
    specsUrl?: string;
    manualUrl?: string;
    schematicUrl?: string;
  };
  
  // Official page
  officialUrl: string;
  imageUrl?: string;
  
  // Description
  description: string;
  capabilities: string[];
}

export interface VesselSystem {
  id: string;
  name: string;
  category: 'propulsion' | 'hydraulic' | 'electrical' | 'dredging' | 'crane' | 'navigation' | 'safety' | 'hvac';
  components: SystemComponent[];
  maintenanceIntervalHours: number;
  criticalityLevel: 'critical' | 'high' | 'medium' | 'low';
}

export interface SystemComponent {
  id: string;
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installDate?: string;
  lastMaintenance?: string;
  hoursOperated?: number;
  failureModes: FailureMode[];
}

export interface FailureMode {
  mode: string;
  symptoms: string[];
  causes: string[];
  effects: string[];
  mitigations: string[];
  mtbf?: number; // Mean Time Between Failures (hours)
}

// Legacy Marine Dredging & Marine Fleet
export const VESSEL_PROFILES: Record<string, VesselProfile> = {
  // ============================================================================
  // Legacy Marine Group - Dredging & Marine Construction
  // ============================================================================
  
  // Heavy Duty Cutter Suction Dredgers
  'al-hamra': {
    id: 'al-hamra',
    name: 'Al Hamra',
    type: 'dredger',
    subtype: 'Heavy Duty Cutter Suction Dredger (CSD)',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 89.0,
      breadth: 18.0,
      depth: 5.0,
      dredgingDepth: 18.0,
      powerInstalled: 12500,
      yearBuilt: 2008,
      flag: 'UAE',
      classNotation: 'Bureau Veritas',
    },
    systems: generateDredgerSystems('al-hamra'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Heavy duty cutter suction dredger capable of dredging in challenging soil conditions including rock and coral.',
    capabilities: [
      'Rock dredging',
      'Coral excavation',
      'Deep water operations up to 18m',
      'High production rates',
      'Operates in exposed conditions',
    ],
  },
  
  'al-khatem': {
    id: 'al-khatem',
    name: 'Al Khatem',
    type: 'dredger',
    subtype: 'Heavy Duty Cutter Suction Dredger (CSD)',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 89.0,
      breadth: 18.0,
      depth: 4.7,
      dredgingDepth: 18.0,
      powerInstalled: 12000,
      yearBuilt: 2006,
      flag: 'UAE',
      classNotation: 'Lloyd\'s Register',
    },
    systems: generateDredgerSystems('al-khatem'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Heavy duty CSD with proven track record in major reclamation and infrastructure projects.',
    capabilities: [
      'Capital dredging',
      'Maintenance dredging',
      'Land reclamation',
      'Rock and hard soil dredging',
    ],
  },
  
  'al-mirfa': {
    id: 'al-mirfa',
    name: 'Al Mirfa',
    type: 'dredger',
    subtype: 'Heavy Duty Cutter Suction Dredger (CSD)',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 85.0,
      breadth: 17.0,
      depth: 4.5,
      dredgingDepth: 16.0,
      powerInstalled: 11000,
      yearBuilt: 2010,
      flag: 'UAE',
      classNotation: 'Bureau Veritas',
    },
    systems: generateDredgerSystems('al-mirfa'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Modern CSD designed for efficient operation in UAE waters with advanced control systems.',
    capabilities: [
      'High production dredging',
      'Channel deepening',
      'Port development',
      'Offshore reclamation',
    ],
  },
  
  'al-sadr': {
    id: 'al-sadr',
    name: 'Al Sadr',
    type: 'dredger',
    subtype: 'Cutter Suction Dredger (CSD)',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 75.0,
      breadth: 14.0,
      depth: 4.0,
      dredgingDepth: 15.0,
      powerInstalled: 8500,
      yearBuilt: 2004,
      flag: 'UAE',
    },
    systems: generateDredgerSystems('al-sadr'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Versatile CSD suitable for a variety of dredging operations in the Gulf region.',
    capabilities: [
      'Channel dredging',
      'Beach nourishment',
      'Marina development',
      'Medium depth operations',
    ],
  },
  
  'al-yassat': {
    id: 'al-yassat',
    name: 'Al Yassat',
    type: 'dredger',
    subtype: 'Cutter Suction Dredger (CSD)',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 70.0,
      breadth: 13.0,
      depth: 3.8,
      dredgingDepth: 14.0,
      powerInstalled: 7500,
      yearBuilt: 2005,
      flag: 'UAE',
    },
    systems: generateDredgerSystems('al-yassat'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Medium-sized CSD with excellent maneuverability for confined area dredging.',
    capabilities: [
      'Confined area dredging',
      'Harbor maintenance',
      'Shallow water operations',
      'Quick mobilization',
    ],
  },
  
  'kattouf': {
    id: 'kattouf',
    name: 'Kattouf',
    type: 'dredger',
    subtype: 'Heavy Duty Cutter Suction Dredger (CSD)',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 92.0,
      breadth: 19.0,
      depth: 5.2,
      dredgingDepth: 20.0,
      powerInstalled: 14000,
      yearBuilt: 2012,
      flag: 'UAE',
      classNotation: 'DNV GL',
    },
    systems: generateDredgerSystems('kattouf'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'One of the most powerful CSDs in the legacy marine fleet, capable of deepest dredging operations.',
    capabilities: [
      'Ultra-deep dredging up to 20m',
      'Heavy rock cutting',
      'High capacity pumping',
      'Long distance discharge',
    ],
  },
  
  // Hopper Dredgers
  'gulf-hopper': {
    id: 'gulf-hopper',
    name: 'Gulf Hopper',
    type: 'dredger',
    subtype: 'Trailing Suction Hopper Dredger (TSHD)',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 95.0,
      breadth: 18.0,
      depth: 6.5,
      dredgingDepth: 25.0,
      maxSpeed: 12,
      grossTonnage: 4500,
      powerInstalled: 8000,
      yearBuilt: 2009,
      flag: 'UAE',
    },
    systems: generateHopperSystems('gulf-hopper'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Self-propelled hopper dredger for maintenance dredging and sand supply operations.',
    capabilities: [
      'Trailing suction dredging',
      'Rainbow discharge',
      'Bottom door discharge',
      'Pump ashore operations',
      'Long distance transport',
    ],
  },
  
  // Crane Barges / Heavy Lift
  'heavy-lifter-i': {
    id: 'heavy-lifter-i',
    name: 'Heavy Lifter I',
    type: 'crane_barge',
    subtype: 'Heavy Lift Crane Barge',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 120.0,
      breadth: 36.0,
      depth: 8.0,
      craneCapacity: 2000,
      accommodation: 80,
      powerInstalled: 6000,
      yearBuilt: 2011,
      flag: 'UAE',
    },
    systems: generateCraneBargeSystems('heavy-lifter-i'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Heavy lift crane barge capable of lifting major offshore structures and modules.',
    capabilities: [
      'Heavy lift operations up to 2000T',
      'Platform installation',
      'Jacket lifting',
      'Module installation',
      'Decommissioning support',
    ],
  },
  
  'heavy-lifter-ii': {
    id: 'heavy-lifter-ii',
    name: 'Heavy Lifter II',
    type: 'crane_barge',
    subtype: 'Derrick Lay Barge',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 196.9,
      breadth: 43.4,
      depth: 19.6,
      craneCapacity: 4200,
      accommodation: 350,
      powerInstalled: 25000,
      yearBuilt: 2015,
      flag: 'UAE',
      classNotation: 'ABS',
    },
    systems: generateCraneBargeSystems('heavy-lifter-ii'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Major derrick and pipelay barge - one of the largest in the Middle East region.',
    capabilities: [
      'Heavy lift up to 4200T',
      'S-Lay pipelaying',
      'Platform topsides installation',
      'Offshore construction',
      'Complex heavy lifts',
    ],
  },
  
  'heavy-lift-alpha': {
    id: 'heavy-lift-alpha',
    name: 'Heavy Lift Alpha',
    type: 'crane_barge',
    subtype: 'Sheerleg Crane Barge',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 85.0,
      breadth: 28.0,
      depth: 5.5,
      craneCapacity: 800,
      accommodation: 45,
      yearBuilt: 2007,
      flag: 'UAE',
    },
    systems: generateCraneBargeSystems('heavy-lift-alpha'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Versatile sheerleg crane barge for medium-heavy lift operations.',
    capabilities: [
      'Medium-heavy lifts up to 800T',
      'Subsea installations',
      'Jacket installations',
      'Salvage operations',
    ],
  },
  
  // Support Vessels
  'gulf-pioneer': {
    id: 'gulf-pioneer',
    name: 'Gulf Pioneer',
    type: 'tugboat',
    subtype: 'Anchor Handling Tug Supply (AHTS)',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 65.0,
      breadth: 15.0,
      depth: 6.5,
      maxSpeed: 14,
      grossTonnage: 1800,
      deadweight: 1200,
      powerInstalled: 8000,
      yearBuilt: 2010,
      flag: 'UAE',
    },
    systems: generateTugSystems('gulf-pioneer'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Powerful AHTS vessel for anchor handling and towing operations.',
    capabilities: [
      'Anchor handling',
      'Rig towing',
      'Supply duties',
      'Firefighting Class 1',
      'Offshore support',
    ],
  },
  
  'al-dhafra-tug': {
    id: 'al-dhafra-tug',
    name: 'Al Dhafra Tug',
    type: 'tugboat',
    subtype: 'Harbor Tug',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 32.0,
      breadth: 10.0,
      depth: 4.5,
      maxSpeed: 12,
      grossTonnage: 450,
      powerInstalled: 3500,
      yearBuilt: 2008,
      flag: 'UAE',
    },
    systems: generateTugSystems('al-dhafra-tug'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Compact harbor tug for port operations and dredger support.',
    capabilities: [
      'Ship handling',
      'Dredger support',
      'Barge towing',
      'Harbor operations',
    ],
  },
  
  'harbor-force': {
    id: 'harbor-force',
    name: 'Harbor Force',
    type: 'tugboat',
    subtype: 'Harbor Tug',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 28.0,
      breadth: 9.0,
      depth: 4.0,
      maxSpeed: 11,
      grossTonnage: 380,
      powerInstalled: 3000,
      yearBuilt: 2012,
      flag: 'UAE',
    },
    systems: generateTugSystems('harbor-force'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Modern harbor tug with excellent maneuverability.',
    capabilities: [
      'Ship berthing assistance',
      'Barge positioning',
      'General towing',
      'Emergency response',
    ],
  },
  
  'sea-guardian': {
    id: 'sea-guardian',
    name: 'Sea Guardian',
    type: 'tugboat',
    subtype: 'Emergency Response Tug',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 45.0,
      breadth: 12.0,
      depth: 5.0,
      maxSpeed: 15,
      grossTonnage: 800,
      powerInstalled: 5500,
      yearBuilt: 2014,
      flag: 'UAE',
    },
    systems: generateTugSystems('sea-guardian'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Fast emergency response and standby vessel with firefighting capabilities.',
    capabilities: [
      'Emergency response',
      'Firefighting FiFi 1',
      'Oil spill response',
      'Standby duties',
      'Fast transit',
    ],
  },
  
  // Supply Vessels
  'gulf-provider': {
    id: 'gulf-provider',
    name: 'Gulf Provider',
    type: 'supply_vessel',
    subtype: 'Platform Supply Vessel (PSV)',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 72.0,
      breadth: 16.0,
      depth: 6.8,
      maxSpeed: 13,
      grossTonnage: 2800,
      deadweight: 3200,
      accommodation: 24,
      powerInstalled: 5400,
      yearBuilt: 2011,
      flag: 'UAE',
    },
    systems: generateSupplyVesselSystems('gulf-provider'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Modern PSV for offshore platform supply and support operations.',
    capabilities: [
      'Deck cargo transport',
      'Bulk cargo (mud, cement, water)',
      'DP2 capable',
      'Platform supply',
    ],
  },
  
  'marine-supplier-i': {
    id: 'marine-supplier-i',
    name: 'Marine Supplier I',
    type: 'supply_vessel',
    subtype: 'Platform Supply Vessel (PSV)',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 68.0,
      breadth: 15.0,
      depth: 6.2,
      maxSpeed: 12,
      grossTonnage: 2400,
      deadweight: 2800,
      accommodation: 20,
      powerInstalled: 4800,
      yearBuilt: 2009,
      flag: 'UAE',
    },
    systems: generateSupplyVesselSystems('marine-supplier-i'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Reliable PSV for regular offshore supply runs.',
    capabilities: [
      'General supply duties',
      'Fuel transfer',
      'Fresh water supply',
      'Equipment transport',
    ],
  },
  
  'offshore-express': {
    id: 'offshore-express',
    name: 'Offshore Express',
    type: 'supply_vessel',
    subtype: 'Fast Supply Vessel (FSV)',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 55.0,
      breadth: 12.0,
      depth: 4.5,
      maxSpeed: 18,
      grossTonnage: 1200,
      deadweight: 800,
      accommodation: 18,
      powerInstalled: 6000,
      yearBuilt: 2013,
      flag: 'UAE',
    },
    systems: generateSupplyVesselSystems('offshore-express'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'High-speed supply vessel for urgent offshore deliveries.',
    capabilities: [
      'Fast cargo delivery',
      'Personnel transfer',
      'Urgent supply runs',
      'High speed transit',
    ],
  },
  
  // Survey Vessels
  'marine-scanner': {
    id: 'marine-scanner',
    name: 'Marine Scanner',
    type: 'survey_vessel',
    subtype: 'Hydrographic Survey Vessel',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 42.0,
      breadth: 10.0,
      depth: 3.5,
      maxSpeed: 12,
      grossTonnage: 450,
      accommodation: 20,
      powerInstalled: 2000,
      yearBuilt: 2015,
      flag: 'UAE',
    },
    systems: generateSurveyVesselSystems('marine-scanner'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Advanced hydrographic survey vessel with multibeam capabilities.',
    capabilities: [
      'Multibeam bathymetry',
      'Side scan sonar',
      'Sub-bottom profiling',
      'Positioning surveys',
      'Pre/post dredge surveys',
    ],
  },
  
  'deep-scanner': {
    id: 'deep-scanner',
    name: 'Deep Scanner',
    type: 'survey_vessel',
    subtype: 'Geophysical Survey Vessel',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 55.0,
      breadth: 12.0,
      depth: 4.2,
      maxSpeed: 11,
      grossTonnage: 750,
      accommodation: 25,
      powerInstalled: 2800,
      yearBuilt: 2012,
      flag: 'UAE',
    },
    systems: generateSurveyVesselSystems('deep-scanner'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Deep water capable survey vessel for geophysical and pipeline surveys.',
    capabilities: [
      'Deep water surveys',
      'Pipeline inspection',
      'ROV operations',
      'Geophysical surveys',
      'Environmental monitoring',
    ],
  },
  
  'ocean-explorer': {
    id: 'ocean-explorer',
    name: 'Ocean Explorer',
    type: 'survey_vessel',
    subtype: 'Multi-Purpose Survey Vessel',
    company: 'legacy_marine_group',
    specs: {
      lengthOverall: 48.0,
      breadth: 11.0,
      depth: 3.8,
      maxSpeed: 10,
      grossTonnage: 550,
      accommodation: 22,
      powerInstalled: 2200,
      yearBuilt: 2010,
      flag: 'UAE',
    },
    systems: generateSurveyVesselSystems('ocean-explorer'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine/fleet',
      investorPresentationUrl: 'https://example.com/legacy-marine/investor-presentation.pdf',
      integratedReportUrl: 'https://example.com/legacy-marine/integrated-report-2023.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine/fleet',
    description: 'Versatile survey vessel for various offshore survey operations.',
    capabilities: [
      'Hydrographic surveys',
      'Positioning',
      'Environmental sampling',
      'Light construction support',
    ],
  },
  
  // ============================================================================
  // Legacy Marine Energy - Offshore EPC, Pipelaying & Heavy Lift
  // Source: https://example.com/legacy-marine-energy/fleet/
  // Specs verified from official PDF datasheets via Exa search
  // ============================================================================
  
  // Derrick Lay Barges
  'dls-4200': {
    id: 'dls-4200',
    name: 'DLS-4200',
    type: 'derrick_barge',
    subtype: 'Derrick Lay Semi-Submersible',
    company: 'legacy_marine_energy',
    specs: {
      lengthOverall: 196.9,   // Verified from Ulstein design docs
      breadth: 43.4,
      depth: 19.6,
      craneCapacity: 4200,    // 4200 short tons (3810 metric tons)
      accommodation: 350,
      powerInstalled: 25000,
      yearBuilt: 2015,
      flag: 'UAE',
      classNotation: 'ABS',
    },
    systems: generateCraneBargeSystems('dls-4200'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
      specsUrl: 'https://example.com/legacy-marine-energy/assets/files/fleet/derrick%20barges/DLS-4200.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
    description: 'Major derrick and pipelay vessel - one of the largest in the Middle East. 10-point mooring, pipes up to 66" diameter, water depth 10-2000m.',
    capabilities: [
      'Heavy lift up to 4200 short tons',
      'S-Lay pipelaying up to 66" diameter',
      'Platform topsides installation',
      'Jacket installation',
      'Deep water operations (10-2000m)',
      '10-point mooring system',
    ],
  },
  
  'delma-2000': {
    id: 'delma-2000',
    name: 'DELMA 2000',
    type: 'derrick_barge',
    subtype: 'Pipelay Crane Vessel',
    company: 'legacy_marine_energy',
    specs: {
      lengthOverall: 180.0,   // 232m with fixed stinger
      breadth: 32.0,
      depth: 15.0,
      craneCapacity: 2000,
      accommodation: 300,
      yearBuilt: 2010,
      flag: 'UAE',
    },
    systems: generateCraneBargeSystems('delma-2000'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
      specsUrl: 'https://example.com/legacy-marine-energy/assets/files/fleet/derrick%20barges/Delma%202000.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
    description: 'Major pipelay crane vessel with 2000T lift capacity. IMO: 9429455.',
    capabilities: [
      'Heavy lift up to 2000T',
      'S-Lay pipelaying',
      'Platform installation',
      'Offshore construction',
    ],
  },
  
  // Pipelay Barges (Conventional Flat Bottom)
  'plb-648': {
    id: 'plb-648',
    name: 'PLB-648',
    type: 'pipelay_barge',
    subtype: 'Conventional Flat Bottom Pipelay Barge',
    company: 'legacy_marine_energy',
    specs: {
      lengthOverall: 106.0,
      breadth: 30.0,
      depth: 7.5,
      craneCapacity: 600,     // Huisman 600MT + 2x160T Manitowoc
      accommodation: 244,
      powerInstalled: 4170,
      yearBuilt: 1979,
      flag: 'UAE',
      classNotation: 'ABS Maltese Cross A1',
    },
    systems: generatePipelayBargeSystems('plb-648'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
      specsUrl: 'https://example.com/legacy-marine-energy/assets/files/fleet/conventional%20flat%20bottom%20barges/PLB-648.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
    description: 'Conventional flat bottom pipelay barge with Huisman 600MT pedestal crane. Pipes 6"-48". IMO: 8758055.',
    capabilities: [
      'Heavy lift up to 600T',
      'Pipe laying 6" to 48" diameter',
      'Flexible & cable lay',
      '8-point mooring system',
      'Helideck (Bell 212 certified)',
    ],
  },
  
  'dlb-750': {
    id: 'dlb-750',
    name: 'DLB-750',
    type: 'pipelay_barge',
    subtype: 'Conventional Flat Bottom Barge / Side Lay',
    company: 'legacy_marine_energy',
    specs: {
      lengthOverall: 122.0,
      breadth: 33.5,
      depth: 8.8,
      accommodation: 269,
      flag: 'UAE',
      classNotation: 'ABS A1 (E)',
    },
    systems: generatePipelayBargeSystems('dlb-750'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
      specsUrl: 'https://example.com/legacy-marine-energy/assets/files/fleet/conventional%20flat%20bottom%20barges/DLB-750.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
    description: 'Side lay pipelay barge with 4500m² deck area. Pipes 4"-60". IMO: 8758108.',
    capabilities: [
      'Pipe laying 4" to 60" diameter',
      '10-point mooring system',
      'Tensioners: 2x125MT',
      'Helideck (Sikorski S61)',
    ],
  },
  
  'dlb-1000': {
    id: 'dlb-1000',
    name: 'DLB-1000',
    type: 'pipelay_barge',
    subtype: 'Conventional Flat Bottom Pipelay Barge',
    company: 'legacy_marine_energy',
    specs: {
      lengthOverall: 121.9,
      breadth: 36.6,
      depth: 8.2,
      accommodation: 269,
      yearBuilt: 1983,
      flag: 'UAE',
      classNotation: 'ABS Maltese Cross 100 A1',
    },
    systems: generatePipelayBargeSystems('dlb-1000'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
      specsUrl: 'https://example.com/legacy-marine-energy/assets/files/fleet/conventional%20flat%20bottom%20barges/DLB-1000.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
    description: 'Pipelay barge built by Daewoo. Derrick crane CLYDE 52-DE-230-30-15.',
    capabilities: [
      'Heavy lift',
      'Pipe laying',
      'Flexible & cable lay',
      '8-point mooring',
    ],
  },
  
  // Jack-Up Barges (Self-Elevating Platforms)
  'sep-450': {
    id: 'sep-450',
    name: 'SEP-450',
    type: 'jack_up_barge',
    subtype: 'Self-Elevating Platform (Self-Propelled)',
    company: 'legacy_marine_energy',
    specs: {
      lengthOverall: 61.0,
      breadth: 36.0,
      depth: 6.0,
      craneCapacity: 300,     // Seatrax 300t main crane
      accommodation: 219,
      powerInstalled: 5620,   // 4x1405kW
      flag: 'UAE',
      classNotation: 'ABS+A1 Self Elevating Unit +AMS +ACCU',
    },
    systems: generateJackUpSystems('sep-450'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
      specsUrl: 'https://example.com/legacy-marine-energy/assets/files/fleet/jack-up%20barges/SEP-450.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
    description: 'Self-propelled jack-up with 4 triangular legs (94.2m). Helideck for Sikorsky S61N.',
    capabilities: [
      'Self-propelled',
      'Self-elevating platform',
      'Crane operations 300T',
      'Hook up operations',
      'Jacket & deck lifting',
    ],
  },
  
  'sep-550': {
    id: 'sep-550',
    name: 'SEP-550',
    type: 'jack_up_barge',
    subtype: 'Self-Elevating Platform',
    company: 'legacy_marine_energy',
    specs: {
      lengthOverall: 76.0,    // 61m waterline
      breadth: 36.0,
      depth: 6.0,
      accommodation: 314,     // 271 + 43 mobile
      flag: 'UAE',
      classNotation: 'ABS+A1 Self-Elevation Unit',
    },
    systems: generateJackUpSystems('sep-550'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
      specsUrl: 'https://example.com/legacy-marine-energy/assets/files/fleet/jack-up%20barges/SEP-550.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
    description: 'Jack-up with 4 triangular legs (66.6m). 800m² deck area.',
    capabilities: [
      'Self-elevating platform',
      'Hook up operations',
      'Sleepers & mattress installation',
      'Jacket & deck lifting',
    ],
  },
  
  'sep-650': {
    id: 'sep-650',
    name: 'SEP-650',
    type: 'jack_up_barge',
    subtype: 'Self-Elevating Platform',
    company: 'legacy_marine_energy',
    specs: {
      lengthOverall: 80.0,
      breadth: 36.0,
      depth: 6.0,
      accommodation: 260,
      flag: 'UAE',
      classNotation: 'ABS+A1 Self Elevating Unit',
    },
    systems: generateJackUpSystems('sep-650'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
    },
    officialUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
    description: 'Jack-up with 4 triangular legs. Self-propelled platform for offshore operations.',
    capabilities: [
      'Self-elevating platform',
      'Crane operations',
      'Hook up operations',
      'Jacket installation',
    ],
  },
  
  'sep-750': {
    id: 'sep-750',
    name: 'SEP-750',
    type: 'jack_up_barge',
    subtype: 'Self-Elevating Platform',
    company: 'legacy_marine_energy',
    specs: {
      lengthOverall: 61.0,
      breadth: 36.0,
      depth: 6.0,
      craneCapacity: 162,     // Seatrax 162t main hoist
      accommodation: 260,     // 217 + 43 mobile
      powerInstalled: 4140,   // 3x1380kW
      flag: 'UAE',
      classNotation: 'ABS+A1 Self Elevating Unit',
    },
    systems: generateJackUpSystems('sep-750'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
      specsUrl: 'https://example.com/legacy-marine-energy/assets/files/fleet/jack-up%20barges/SEP-750.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
    description: 'Jack-up with 4 triangular legs (66.6m). CAP437 helideck. 800m² deck, 10T/m² capacity.',
    capabilities: [
      'Self-elevating platform',
      'Crane operations 162T',
      'Hook up operations',
      'Drilling & demolishing',
    ],
  },
  
  // Offshore Support & Cable Lay
  'umm-shaif': {
    id: 'umm-shaif',
    name: 'UMM SHAIF',
    type: 'supply_vessel',
    subtype: 'DP3 Offshore Support & Cable Laying Vessel',
    company: 'legacy_marine_energy',
    specs: {
      lengthOverall: 111.56,  // 129.86m with stern extension
      breadth: 43.4,
      depth: 31.7,
      craneCapacity: 300,     // 300t Huisman pedestal crane
      accommodation: 620,     // 556-620 capacity
      powerInstalled: 5280,
      yearBuilt: 2009,
      flag: 'UAE',
      classNotation: 'ABS +A1, Accommodation Barge, +AMS-NP, +DPS-3',
    },
    systems: generateSupplyVesselSystems('umm-shaif'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
      specsUrl: 'https://example.com/legacy-marine-energy/assets/files/fleet/offshore%20support%20and%20cable%20lay/Umm%20Shaif.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
    description: 'DP3 cable laying vessel with 5000mt carousel. IMO: 8771497. 7200kW thruster power.',
    capabilities: [
      'DP3 positioning',
      'Cable laying (5000mt carousel)',
      '300T crane',
      'Accommodation for 620 POB',
      'Deck area 1615m²',
    ],
  },
  
  // AHTS Vessels
  'saadiyat': {
    id: 'saadiyat',
    name: 'SAADIYAT',
    type: 'tugboat',
    subtype: 'Tug/AHTS/Supply/Fire Fighting Vessel',
    company: 'legacy_marine_energy',
    specs: {
      lengthOverall: 48.0,
      breadth: 13.2,
      depth: 4.8,
      accommodation: 28,
      powerInstalled: 4480,   // 2x3004 HP
      yearBuilt: 2011,
      flag: 'UAE',
      classNotation: 'Bureau Veritas',
    },
    systems: generateTugSystems('saadiyat'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
      specsUrl: 'https://example.com/legacy-marine-energy/assets/files/fleet/anchor%20handling%20tug%20supply/Saadiyat.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
    description: 'AHTS vessel with 75T bollard pull. IMO: 9577513. Fire fighting capable.',
    capabilities: [
      'Anchor handling (200T capacity)',
      'Towing (75T bollard pull)',
      'Supply duties (180T deck cargo)',
      'Fire fighting',
    ],
  },
  
  'yas': {
    id: 'yas',
    name: 'YAS',
    type: 'tugboat',
    subtype: 'Tug/AHTS/Supply/Fire Fighting Vessel',
    company: 'legacy_marine_energy',
    specs: {
      lengthOverall: 48.0,
      breadth: 13.2,
      depth: 4.8,
      accommodation: 28,
      yearBuilt: 2011,
      flag: 'UAE',
      classNotation: 'Bureau Veritas',
    },
    systems: generateTugSystems('yas'),
    docs: {
      fleetPageUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
      specsUrl: 'https://example.com/legacy-marine-energy/assets/files/fleet/anchor%20handling%20tug%20supply/Yas.pdf',
    },
    officialUrl: 'https://example.com/legacy-marine-energy/en/about-us/fleet/',
    description: 'Sister vessel to SAADIYAT. AHTS with 75T bollard pull.',
    capabilities: [
      'Anchor handling (200T capacity)',
      'Towing (75T bollard pull)',
      'Supply duties',
      'Fire fighting',
    ],
  },
};

// Helper functions to generate system data for each vessel type
function generateDredgerSystems(vesselId: string): VesselSystem[] {
  return [
    {
      id: `${vesselId}-prop`,
      name: 'Main Propulsion System',
      category: 'propulsion',
      maintenanceIntervalHours: 4000,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-prop-engine`,
          name: 'Main Diesel Engines',
          type: 'Diesel Engine',
          manufacturer: 'Caterpillar',
          failureModes: [
            {
              mode: 'Overheating',
              symptoms: ['High coolant temperature', 'Reduced power output', 'Warning alarms'],
              causes: ['Coolant leak', 'Thermostat failure', 'Blocked radiator'],
              effects: ['Engine shutdown', 'Reduced dredging capacity'],
              mitigations: ['Check coolant levels daily', 'Inspect cooling system weekly'],
              mtbf: 8000,
            },
            {
              mode: 'Fuel injection failure',
              symptoms: ['Rough running', 'Black smoke', 'Power loss'],
              causes: ['Contaminated fuel', 'Injector wear', 'Fuel pump failure'],
              effects: ['Reduced efficiency', 'Potential engine damage'],
              mitigations: ['Use quality fuel', 'Regular fuel filter changes'],
              mtbf: 6000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-cutter`,
      name: 'Cutter Head System',
      category: 'dredging',
      maintenanceIntervalHours: 500,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-cutter-head`,
          name: 'Cutter Head',
          type: 'Rotating Cutter',
          manufacturer: 'IHC',
          failureModes: [
            {
              mode: 'Tooth wear',
              symptoms: ['Reduced production', 'Increased power consumption', 'Vibration'],
              causes: ['Abrasive soil conditions', 'Hard rock cutting', 'Normal wear'],
              effects: ['Production loss', 'Increased fuel consumption'],
              mitigations: ['Regular tooth inspection', 'Replace worn teeth promptly'],
              mtbf: 200,
            },
            {
              mode: 'Gearbox failure',
              symptoms: ['Unusual noise', 'Oil leakage', 'Temperature rise'],
              causes: ['Bearing failure', 'Gear wear', 'Oil degradation'],
              effects: ['Complete cutter failure', 'Extended downtime'],
              mitigations: ['Oil analysis', 'Vibration monitoring', 'Temperature monitoring'],
              mtbf: 4000,
            },
          ],
        },
        {
          id: `${vesselId}-cutter-motor`,
          name: 'Cutter Motor',
          type: 'Hydraulic Motor',
          manufacturer: 'Rexroth',
          failureModes: [
            {
              mode: 'Hydraulic seal failure',
              symptoms: ['Oil leakage', 'Pressure loss', 'Reduced torque'],
              causes: ['Seal wear', 'Contaminated oil', 'Overheating'],
              effects: ['Cutter performance degradation'],
              mitigations: ['Regular seal inspection', 'Maintain oil quality'],
              mtbf: 3000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-pump`,
      name: 'Dredge Pump System',
      category: 'dredging',
      maintenanceIntervalHours: 2000,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-pump-main`,
          name: 'Main Dredge Pump',
          type: 'Centrifugal Pump',
          manufacturer: 'Warman',
          failureModes: [
            {
              mode: 'Impeller wear',
              symptoms: ['Reduced flow rate', 'Increased power consumption', 'Vibration'],
              causes: ['Abrasive material', 'High solids concentration'],
              effects: ['Reduced dredging production'],
              mitigations: ['Monitor production rates', 'Regular impeller inspection'],
              mtbf: 1500,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-hydraulic`,
      name: 'Hydraulic System',
      category: 'hydraulic',
      maintenanceIntervalHours: 2000,
      criticalityLevel: 'high',
      components: [
        {
          id: `${vesselId}-hyd-pump`,
          name: 'Main Hydraulic Pumps',
          type: 'Piston Pump',
          manufacturer: 'Rexroth',
          failureModes: [
            {
              mode: 'Pump cavitation',
              symptoms: ['Noise', 'Vibration', 'Overheating'],
              causes: ['Air in system', 'Blocked suction', 'Low oil level'],
              effects: ['Pump damage', 'System failure'],
              mitigations: ['Check oil levels', 'Inspect suction lines'],
              mtbf: 5000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-winch`,
      name: 'Anchor Winch System',
      category: 'dredging',
      maintenanceIntervalHours: 1000,
      criticalityLevel: 'high',
      components: [
        {
          id: `${vesselId}-winch-main`,
          name: 'Anchor Winches',
          type: 'Hydraulic Winch',
          manufacturer: 'Huisman',
          failureModes: [
            {
              mode: 'Brake failure',
              symptoms: ['Brake slippage', 'Overheating', 'Unusual noise'],
              causes: ['Brake pad wear', 'Hydraulic failure', 'Overload'],
              effects: ['Anchor control loss', 'Safety hazard'],
              mitigations: ['Daily brake checks', 'Regular pad inspection'],
              mtbf: 2000,
            },
            {
              mode: 'Wire rope damage',
              symptoms: ['Visible wire breaks', 'Corrosion', 'Kinking'],
              causes: ['Overloading', 'Fatigue', 'Environmental exposure'],
              effects: ['Rope failure risk', 'Operational restrictions'],
              mitigations: ['Regular rope inspection', 'Lubrication', 'Load monitoring'],
              mtbf: 3000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-electrical`,
      name: 'Electrical System',
      category: 'electrical',
      maintenanceIntervalHours: 4000,
      criticalityLevel: 'high',
      components: [
        {
          id: `${vesselId}-gen`,
          name: 'Generators',
          type: 'Diesel Generator',
          manufacturer: 'Caterpillar',
          failureModes: [
            {
              mode: 'AVR failure',
              symptoms: ['Voltage fluctuations', 'Unstable power'],
              causes: ['Component aging', 'Overload'],
              effects: ['Power quality issues', 'Equipment damage'],
              mitigations: ['Regular testing', 'Load balancing'],
              mtbf: 10000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-nav`,
      name: 'Navigation & Positioning',
      category: 'navigation',
      maintenanceIntervalHours: 8760,
      criticalityLevel: 'medium',
      components: [
        {
          id: `${vesselId}-dgps`,
          name: 'DGPS System',
          type: 'Positioning System',
          manufacturer: 'Trimble',
          failureModes: [
            {
              mode: 'Signal loss',
              symptoms: ['Position drift', 'No fix', 'Accuracy degradation'],
              causes: ['Antenna issue', 'Interference', 'Satellite visibility'],
              effects: ['Dredging accuracy affected'],
              mitigations: ['Backup positioning', 'Regular calibration'],
              mtbf: 15000,
            },
          ],
        },
      ],
    },
  ];
}

function generateHopperSystems(vesselId: string): VesselSystem[] {
  const baseSystems = generateDredgerSystems(vesselId);
  // Add hopper-specific systems
  baseSystems.push({
    id: `${vesselId}-hopper`,
    name: 'Hopper & Discharge System',
    category: 'dredging',
    maintenanceIntervalHours: 2000,
    criticalityLevel: 'critical',
    components: [
      {
        id: `${vesselId}-hopper-doors`,
        name: 'Bottom Doors',
        type: 'Hydraulic Doors',
        failureModes: [
          {
            mode: 'Door seal failure',
            symptoms: ['Leakage', 'Incomplete closure'],
            causes: ['Seal wear', 'Debris', 'Mechanical damage'],
            effects: ['Cargo loss', 'Draft issues'],
            mitigations: ['Regular inspection', 'Seal replacement'],
            mtbf: 3000,
          },
        ],
      },
      {
        id: `${vesselId}-draghead`,
        name: 'Trailing Draghead',
        type: 'Suction Draghead',
        failureModes: [
          {
            mode: 'Visor wear',
            symptoms: ['Reduced suction efficiency', 'Increased power'],
            causes: ['Abrasive seabed', 'Rock contact'],
            effects: ['Production loss'],
            mitigations: ['Regular inspection', 'Visor replacement'],
            mtbf: 1000,
          },
        ],
      },
    ],
  });
  return baseSystems;
}

function generateCraneBargeSystems(vesselId: string): VesselSystem[] {
  return [
    {
      id: `${vesselId}-crane`,
      name: 'Main Crane System',
      category: 'crane',
      maintenanceIntervalHours: 500,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-crane-main`,
          name: 'Main Crane',
          type: 'Heavy Lift Crane',
          manufacturer: 'Huisman',
          failureModes: [
            {
              mode: 'Hoist wire failure',
              symptoms: ['Wire breaks visible', 'Unusual noise', 'Vibration'],
              causes: ['Fatigue', 'Overload', 'Corrosion'],
              effects: ['Lifting capacity restriction', 'Safety hazard'],
              mitigations: ['MPI inspection', 'Load monitoring', 'Wire lubrication'],
              mtbf: 2000,
            },
            {
              mode: 'Slewing bearing failure',
              symptoms: ['Grinding noise', 'Uneven rotation', 'Vibration'],
              causes: ['Bearing wear', 'Overload', 'Lubrication failure'],
              effects: ['Crane operation restricted'],
              mitigations: ['Regular greasing', 'Bearing monitoring', 'Load control'],
              mtbf: 20000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-ballast`,
      name: 'Ballast System',
      category: 'hydraulic',
      maintenanceIntervalHours: 2000,
      criticalityLevel: 'high',
      components: [
        {
          id: `${vesselId}-ballast-pumps`,
          name: 'Ballast Pumps',
          type: 'Centrifugal Pump',
          failureModes: [
            {
              mode: 'Pump failure',
              symptoms: ['No flow', 'Cavitation', 'Motor trip'],
              causes: ['Seal failure', 'Impeller damage', 'Motor failure'],
              effects: ['Cannot ballast/deballast', 'Stability issues'],
              mitigations: ['Redundant pumps', 'Regular testing'],
              mtbf: 8000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-mooring`,
      name: 'Mooring System',
      category: 'safety',
      maintenanceIntervalHours: 1000,
      criticalityLevel: 'high',
      components: [
        {
          id: `${vesselId}-mooring-winches`,
          name: 'Mooring Winches',
          type: 'Hydraulic Winch',
          failureModes: [
            {
              mode: 'Brake failure',
              symptoms: ['Brake slip', 'Overheating'],
              causes: ['Pad wear', 'Hydraulic issue'],
              effects: ['Mooring safety compromised'],
              mitigations: ['Daily checks', 'Regular maintenance'],
              mtbf: 4000,
            },
          ],
        },
      ],
    },
  ];
}

function generateJackUpSystems(vesselId: string): VesselSystem[] {
  return [
    {
      id: `${vesselId}-jacking`,
      name: 'Jacking System',
      category: 'hydraulic',
      maintenanceIntervalHours: 250,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-jacking-motors`,
          name: 'Jacking Motors',
          type: 'Hydraulic Motor',
          manufacturer: 'Bosch Rexroth',
          failureModes: [
            {
              mode: 'Pinion gear wear',
              symptoms: ['Increased jacking time', 'Gear noise', 'Vibration'],
              causes: ['Normal wear', 'Misalignment', 'Overload'],
              effects: ['Slower jacking operations', 'Safety concerns'],
              mitigations: ['Regular gear inspection', 'Alignment checks'],
              mtbf: 5000,
            },
            {
              mode: 'Hydraulic motor failure',
              symptoms: ['No movement', 'Pressure loss', 'Overheating'],
              causes: ['Seal failure', 'Contaminated fluid', 'Bearing wear'],
              effects: ['Unable to jack up/down'],
              mitigations: ['Oil analysis', 'Filter maintenance'],
              mtbf: 8000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-legs`,
      name: 'Leg System',
      category: 'safety',
      maintenanceIntervalHours: 500,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-leg-structure`,
          name: 'Leg Structure',
          type: 'Lattice Legs',
          failureModes: [
            {
              mode: 'Structural fatigue',
              symptoms: ['Crack indications', 'Corrosion spots'],
              causes: ['Cyclic loading', 'Environmental exposure'],
              effects: ['Structural integrity concerns'],
              mitigations: ['Regular NDT inspection', 'Corrosion protection'],
              mtbf: 50000,
            },
          ],
        },
        {
          id: `${vesselId}-spud-cans`,
          name: 'Spud Cans',
          type: 'Foundation',
          failureModes: [
            {
              mode: 'Spud can damage',
              symptoms: ['Uneven settlement', 'Tilting'],
              causes: ['Seabed conditions', 'Overload'],
              effects: ['Platform stability issues'],
              mitigations: ['Seabed survey', 'Load monitoring'],
              mtbf: 20000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-crane`,
      name: 'Main Crane System',
      category: 'crane',
      maintenanceIntervalHours: 500,
      criticalityLevel: 'high',
      components: [
        {
          id: `${vesselId}-crane-main`,
          name: 'Main Crane',
          type: 'Pedestal Crane',
          failureModes: [
            {
              mode: 'Wire rope fatigue',
              symptoms: ['Broken wires', 'Strand distortion'],
              causes: ['Cyclic loading', 'Sheave wear'],
              effects: ['Lifting restriction'],
              mitigations: ['Regular MPI', 'Sheave inspection'],
              mtbf: 3000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-power`,
      name: 'Power Generation',
      category: 'electrical',
      maintenanceIntervalHours: 2000,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-generators`,
          name: 'Main Generators',
          type: 'Diesel Generator',
          failureModes: [
            {
              mode: 'Generator bearing failure',
              symptoms: ['High temperature', 'Vibration', 'Noise'],
              causes: ['Bearing wear', 'Misalignment'],
              effects: ['Power outage risk'],
              mitigations: ['Vibration monitoring', 'Temperature monitoring'],
              mtbf: 15000,
            },
          ],
        },
      ],
    },
  ];
}

function generatePipelayBargeSystems(vesselId: string): VesselSystem[] {
  return [
    {
      id: `${vesselId}-tensioner`,
      name: 'Tensioner System',
      category: 'hydraulic',
      maintenanceIntervalHours: 500,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-tensioner-tracks`,
          name: 'Tensioner Tracks',
          type: 'Track Tensioner',
          manufacturer: 'Huisman',
          failureModes: [
            {
              mode: 'Track pad wear',
              symptoms: ['Reduced grip', 'Slippage', 'Uneven pressure'],
              causes: ['Normal wear', 'Abrasive pipe coating'],
              effects: ['Pipe slippage risk', 'Lay tension issues'],
              mitigations: ['Regular pad inspection', 'Pressure monitoring'],
              mtbf: 2000,
            },
            {
              mode: 'Hydraulic cylinder leak',
              symptoms: ['Pressure drop', 'Oil seepage', 'Uneven clamping'],
              causes: ['Seal wear', 'Contaminated fluid'],
              effects: ['Tensioner malfunction'],
              mitigations: ['Seal inspection', 'Fluid analysis'],
              mtbf: 4000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-stinger`,
      name: 'Stinger System',
      category: 'hydraulic',
      maintenanceIntervalHours: 1000,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-stinger-structure`,
          name: 'Stinger Structure',
          type: 'Articulated Stinger',
          failureModes: [
            {
              mode: 'Hinge pin wear',
              symptoms: ['Play in joints', 'Alignment issues'],
              causes: ['Cyclic loading', 'Corrosion'],
              effects: ['Pipe overbend risk'],
              mitigations: ['Regular inspection', 'Pin replacement'],
              mtbf: 5000,
            },
            {
              mode: 'Roller wear',
              symptoms: ['Pipe coating damage', 'Increased friction'],
              causes: ['Normal wear', 'Pipe movement'],
              effects: ['Pipe damage risk'],
              mitigations: ['Roller inspection', 'Replacement schedule'],
              mtbf: 3000,
            },
          ],
        },
        {
          id: `${vesselId}-stinger-hydraulics`,
          name: 'Stinger Hydraulics',
          type: 'Hydraulic Cylinders',
          failureModes: [
            {
              mode: 'Cylinder seal failure',
              symptoms: ['Oil leak', 'Position drift', 'Pressure loss'],
              causes: ['Seal degradation', 'Rod damage'],
              effects: ['Stinger angle control loss'],
              mitigations: ['Seal replacement', 'Rod inspection'],
              mtbf: 6000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-crane`,
      name: 'Main Crane System',
      category: 'crane',
      maintenanceIntervalHours: 500,
      criticalityLevel: 'high',
      components: [
        {
          id: `${vesselId}-crane-main`,
          name: 'Main Crane',
          type: 'Derrick Crane',
          failureModes: [
            {
              mode: 'Slew bearing wear',
              symptoms: ['Grinding noise', 'Rotation resistance'],
              causes: ['Bearing wear', 'Lubrication failure'],
              effects: ['Crane operation restricted'],
              mitigations: ['Greasing schedule', 'Bearing monitoring'],
              mtbf: 15000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-mooring`,
      name: 'Mooring System',
      category: 'safety',
      maintenanceIntervalHours: 1000,
      criticalityLevel: 'high',
      components: [
        {
          id: `${vesselId}-mooring-winches`,
          name: 'Mooring Winches',
          type: 'Anchor Handling Winch',
          failureModes: [
            {
              mode: 'Brake failure',
              symptoms: ['Brake slip', 'Overheating'],
              causes: ['Pad wear', 'Hydraulic issue'],
              effects: ['Mooring safety compromised'],
              mitigations: ['Daily brake tests', 'Pad inspection'],
              mtbf: 4000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-ballast`,
      name: 'Ballast System',
      category: 'hydraulic',
      maintenanceIntervalHours: 2000,
      criticalityLevel: 'high',
      components: [
        {
          id: `${vesselId}-ballast-pumps`,
          name: 'Ballast Pumps',
          type: 'Centrifugal Pump',
          failureModes: [
            {
              mode: 'Pump seal failure',
              symptoms: ['Leakage', 'Pressure drop'],
              causes: ['Seal wear', 'Cavitation'],
              effects: ['Ballast operation affected'],
              mitigations: ['Seal inspection', 'Vibration monitoring'],
              mtbf: 8000,
            },
          ],
        },
      ],
    },
  ];
}

function generateTugSystems(vesselId: string): VesselSystem[] {
  return [
    {
      id: `${vesselId}-prop`,
      name: 'Propulsion System',
      category: 'propulsion',
      maintenanceIntervalHours: 4000,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-engines`,
          name: 'Main Engines',
          type: 'Diesel Engine',
          manufacturer: 'Caterpillar',
          failureModes: [
            {
              mode: 'Turbocharger failure',
              symptoms: ['Black smoke', 'Power loss', 'High exhaust temps'],
              causes: ['Bearing failure', 'Foreign object damage', 'Oil starvation'],
              effects: ['Reduced power', 'Mission abort'],
              mitigations: ['Oil analysis', 'Regular inspection'],
              mtbf: 12000,
            },
          ],
        },
        {
          id: `${vesselId}-azimuth`,
          name: 'Azimuth Thrusters',
          type: 'Z-Drive',
          manufacturer: 'Rolls-Royce',
          failureModes: [
            {
              mode: 'Steering failure',
              symptoms: ['Slow response', 'Unusual noise', 'Hydraulic leak'],
              causes: ['Hydraulic failure', 'Mechanical wear'],
              effects: ['Loss of maneuverability'],
              mitigations: ['Regular testing', 'Hydraulic oil analysis'],
              mtbf: 8000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-towing`,
      name: 'Towing Equipment',
      category: 'safety',
      maintenanceIntervalHours: 500,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-tow-winch`,
          name: 'Towing Winch',
          type: 'Hydraulic Winch',
          failureModes: [
            {
              mode: 'Brake failure',
              symptoms: ['Line slip', 'Overheating'],
              causes: ['Pad wear', 'Hydraulic leak'],
              effects: ['Tow line failure risk'],
              mitigations: ['Daily brake tests', 'Regular inspection'],
              mtbf: 3000,
            },
          ],
        },
        {
          id: `${vesselId}-tow-hook`,
          name: 'Towing Hook',
          type: 'Quick Release Hook',
          failureModes: [
            {
              mode: 'Release mechanism failure',
              symptoms: ['Sticking', 'Slow release'],
              causes: ['Corrosion', 'Mechanical wear'],
              effects: ['Safety hazard', 'Cannot release tow'],
              mitigations: ['Regular testing', 'Lubrication'],
              mtbf: 5000,
            },
          ],
        },
      ],
    },
  ];
}

function generateSupplyVesselSystems(vesselId: string): VesselSystem[] {
  return [
    {
      id: `${vesselId}-prop`,
      name: 'Propulsion System',
      category: 'propulsion',
      maintenanceIntervalHours: 4000,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-engines`,
          name: 'Main Engines',
          type: 'Diesel Engine',
          manufacturer: 'Wärtsilä',
          failureModes: [
            {
              mode: 'Cooling system failure',
              symptoms: ['High temperatures', 'Alarms', 'Power reduction'],
              causes: ['Pump failure', 'Blocked coolers', 'Thermostat failure'],
              effects: ['Engine shutdown', 'Mission abort'],
              mitigations: ['Temperature monitoring', 'Regular maintenance'],
              mtbf: 10000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-dp`,
      name: 'DP System',
      category: 'navigation',
      maintenanceIntervalHours: 4000,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-dp-computer`,
          name: 'DP Computer',
          type: 'Control System',
          manufacturer: 'Kongsberg',
          failureModes: [
            {
              mode: 'Position reference failure',
              symptoms: ['Position drift', 'Alarms'],
              causes: ['Sensor failure', 'Signal loss'],
              effects: ['DP degradation', 'Manual control required'],
              mitigations: ['Redundant references', 'Regular testing'],
              mtbf: 15000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-cargo`,
      name: 'Cargo Handling',
      category: 'hydraulic',
      maintenanceIntervalHours: 2000,
      criticalityLevel: 'medium',
      components: [
        {
          id: `${vesselId}-cargo-crane`,
          name: 'Deck Crane',
          type: 'Knuckle Boom Crane',
          failureModes: [
            {
              mode: 'Hydraulic leak',
              symptoms: ['Oil visible', 'Slow operation', 'Jerky movements'],
              causes: ['Hose failure', 'Seal wear', 'Connection failure'],
              effects: ['Reduced lifting capacity'],
              mitigations: ['Regular inspection', 'Hose replacement program'],
              mtbf: 5000,
            },
          ],
        },
      ],
    },
  ];
}

function generateSurveyVesselSystems(vesselId: string): VesselSystem[] {
  return [
    {
      id: `${vesselId}-prop`,
      name: 'Propulsion System',
      category: 'propulsion',
      maintenanceIntervalHours: 4000,
      criticalityLevel: 'high',
      components: [
        {
          id: `${vesselId}-engines`,
          name: 'Main Engines',
          type: 'Diesel Engine',
          failureModes: [
            {
              mode: 'Vibration increase',
              symptoms: ['Noticeable vibration', 'Noise', 'Survey data quality impact'],
              causes: ['Alignment issue', 'Bearing wear', 'Propeller damage'],
              effects: ['Survey quality degradation'],
              mitigations: ['Vibration monitoring', 'Regular alignment checks'],
              mtbf: 8000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-survey`,
      name: 'Survey Equipment',
      category: 'navigation',
      maintenanceIntervalHours: 2000,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-mbes`,
          name: 'Multibeam Echosounder',
          type: 'Survey Sonar',
          manufacturer: 'Kongsberg',
          failureModes: [
            {
              mode: 'Transducer failure',
              symptoms: ['Data gaps', 'Noise in data', 'Sector dropout'],
              causes: ['Transducer damage', 'Cable fault', 'Processing unit failure'],
              effects: ['Survey cannot continue'],
              mitigations: ['Regular testing', 'Spare transducers'],
              mtbf: 10000,
            },
          ],
        },
        {
          id: `${vesselId}-sss`,
          name: 'Side Scan Sonar',
          type: 'Towed Sonar',
          failureModes: [
            {
              mode: 'Cable damage',
              symptoms: ['Data loss', 'Noise', 'No signal'],
              causes: ['Abrasion', 'Snag', 'Fatigue'],
              effects: ['Survey interrupted'],
              mitigations: ['Cable inspection', 'Careful handling'],
              mtbf: 3000,
            },
          ],
        },
        {
          id: `${vesselId}-positioning`,
          name: 'USBL System',
          type: 'Underwater Positioning',
          manufacturer: 'Sonardyne',
          failureModes: [
            {
              mode: 'Acoustic interference',
              symptoms: ['Position jumps', 'Dropouts'],
              causes: ['Noise sources', 'Multipath', 'Calibration drift'],
              effects: ['Position accuracy degraded'],
              mitigations: ['Noise survey', 'Regular calibration'],
              mtbf: 8000,
            },
          ],
        },
      ],
    },
  ];
}

// Get vessel profile by database vessel name
export function getVesselProfileByName(name: string): VesselProfile | undefined {
  const normalizedName = name.toLowerCase().replace(/\s+/g, '-');
  return VESSEL_PROFILES[normalizedName];
}

// Get all profiles for a vessel type
export function getProfilesByType(type: VesselProfile['type']): VesselProfile[] {
  return Object.values(VESSEL_PROFILES).filter(p => p.type === type);
}

