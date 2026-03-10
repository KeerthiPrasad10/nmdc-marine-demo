export interface VesselProfile {
  id: string
  name: string
  type: 'ferry'
  subtype: string
  company: string

  specs: {
    lengthOverall: number
    breadth: number
    depth: number
    maxSpeed?: number
    grossTonnage?: number
    deadweight?: number
    accommodation?: number
    propulsion?: string
    powerInstalled?: number
    yearBuilt?: number
    yearRebuilt?: number
    flag?: string
    classNotation?: string
    passengerCapacity?: number
    vehicleCapacity?: number
  }

  systems: VesselSystem[]

  docs: {
    fleetPageUrl?: string
    investorPresentationUrl?: string
    integratedReportUrl?: string
    specsUrl?: string
    manualUrl?: string
    schematicUrl?: string
  }

  officialUrl: string
  imageUrl?: string

  description: string
  capabilities: string[]
}

export interface VesselSystem {
  id: string
  name: string
  category: 'propulsion' | 'hydraulic' | 'electrical' | 'navigation' | 'safety' | 'hvac' | 'passenger'
  components: SystemComponent[]
  maintenanceIntervalHours: number
  criticalityLevel: 'critical' | 'high' | 'medium' | 'low'
}

export interface SystemComponent {
  id: string
  name: string
  type: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  installDate?: string
  lastMaintenance?: string
  hoursOperated?: number
  failureModes: FailureMode[]
}

export interface FailureMode {
  mode: string
  symptoms: string[]
  causes: string[]
  effects: string[]
  mitigations: string[]
  mtbf?: number
}

function generateFerrySystems(vesselId: string, vesselClass: string): VesselSystem[] {
  const systems: VesselSystem[] = [
    {
      id: `${vesselId}-prop`,
      name: 'Main Propulsion System',
      category: 'propulsion',
      maintenanceIntervalHours: 4000,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-prop-engine`,
          name: vesselClass.includes('Olympic') ? 'Diesel-Electric Drive Motors' : 'Main Diesel Engines',
          type: vesselClass.includes('Olympic') ? 'Diesel-Electric Motor' : 'Diesel Engine',
          manufacturer: vesselClass.includes('Olympic') ? 'ABB' : 'Caterpillar',
          failureModes: [
            {
              mode: 'Overheating',
              symptoms: ['High coolant temperature', 'Reduced power output', 'Warning alarms'],
              causes: ['Coolant leak', 'Thermostat failure', 'Blocked heat exchanger'],
              effects: ['Engine shutdown', 'Reduced speed', 'Schedule delays'],
              mitigations: ['Check coolant levels daily', 'Inspect cooling system weekly'],
              mtbf: 8000,
            },
            {
              mode: 'Fuel injection failure',
              symptoms: ['Rough running', 'Black smoke', 'Power loss'],
              causes: ['Contaminated fuel', 'Injector wear', 'Fuel pump failure'],
              effects: ['Reduced efficiency', 'Schedule delays'],
              mitigations: ['Use quality marine fuel', 'Regular fuel filter changes'],
              mtbf: 6000,
        },
      ],
    },
    {
          id: `${vesselId}-prop-cpp`,
          name: 'Controllable Pitch Propellers',
          type: 'CPP System',
          manufacturer: 'Rolls-Royce',
          failureModes: [
            {
              mode: 'Hub seal failure',
              symptoms: ['Oil leak at hub', 'Pitch response sluggish', 'Oil consumption increase'],
              causes: ['Seal wear', 'Impact damage', 'Age degradation'],
              effects: ['Propulsion efficiency loss', 'Environmental concern'],
              mitigations: ['Regular oil level checks', 'Scheduled seal replacement'],
              mtbf: 12000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-steering`,
      name: 'Steering System',
      category: 'hydraulic',
      maintenanceIntervalHours: 2000,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-steering-rudder`,
          name: 'Rudder Actuators',
          type: 'Hydraulic Rudder System',
          manufacturer: 'Rolls-Royce',
          failureModes: [
            {
              mode: 'Hydraulic pump failure',
              symptoms: ['Steering response slow', 'Pressure fluctuation', 'Noise'],
              causes: ['Pump wear', 'Contaminated fluid', 'Seal failure'],
              effects: ['Reduced maneuverability', 'Potential loss of steering'],
              mitigations: ['Redundant steering pumps', 'Regular oil analysis'],
              mtbf: 10000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-ramp`,
      name: 'Vehicle Loading Ramp System',
      category: 'hydraulic',
      maintenanceIntervalHours: 1000,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-ramp-bow`,
          name: 'Bow Vehicle Ramp',
          type: 'Hydraulic Vehicle Ramp',
          failureModes: [
            {
              mode: 'Hydraulic cylinder seal failure',
              symptoms: ['Oil seepage', 'Ramp drift', 'Slow operation'],
              causes: ['Seal wear', 'Rod scoring', 'Contaminated fluid'],
              effects: ['Loading delays', 'Safety concern'],
              mitigations: ['Regular seal inspection', 'Cylinder rod protection'],
              mtbf: 5000,
            },
            {
              mode: 'Ramp hinge pin wear',
              symptoms: ['Ramp misalignment', 'Unusual noise', 'Vibration'],
              causes: ['Normal wear', 'Overload', 'Corrosion'],
              effects: ['Ramp positioning issues', 'Loading delays'],
              mitigations: ['Lubrication schedule', 'Pin clearance checks'],
              mtbf: 8000,
        },
      ],
    },
    {
          id: `${vesselId}-ramp-stern`,
          name: 'Stern Vehicle Ramp',
          type: 'Hydraulic Vehicle Ramp',
          failureModes: [
            {
              mode: 'Chain elongation',
              symptoms: ['Ramp leveling issues', 'Chain slack', 'Sprocket skip'],
              causes: ['Normal wear', 'Overload cycles'],
              effects: ['Ramp alignment problems'],
              mitigations: ['Chain tension monitoring', 'Regular measurement'],
              mtbf: 6000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-electrical`,
      name: 'Electrical & Generator System',
      category: 'electrical',
      maintenanceIntervalHours: 4000,
      criticalityLevel: 'high',
      components: [
        {
          id: `${vesselId}-gen`,
          name: 'Ship Service Generators',
          type: 'Diesel Generator',
          manufacturer: 'Caterpillar',
          failureModes: [
            {
              mode: 'AVR failure',
              symptoms: ['Voltage fluctuations', 'Unstable power', 'Equipment trips'],
              causes: ['Component aging', 'Overload', 'Moisture'],
              effects: ['Power quality issues', 'Passenger system outages'],
              mitigations: ['Regular testing', 'Load balancing', 'Spare AVR boards'],
              mtbf: 10000,
        },
      ],
    },
    {
          id: `${vesselId}-emergency-gen`,
          name: 'Emergency Generator',
          type: 'Emergency Diesel Generator',
          failureModes: [
            {
              mode: 'Auto-start failure',
              symptoms: ['Slow cranking', 'No start on test', 'Battery low'],
              causes: ['Battery degradation', 'Fuel supply issue', 'Starter motor wear'],
              effects: ['No emergency power backup', 'Safety compliance issue'],
              mitigations: ['Weekly auto-start tests', 'Battery replacement schedule'],
              mtbf: 15000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-nav`,
      name: 'Navigation & Communications',
      category: 'navigation',
      maintenanceIntervalHours: 8760,
      criticalityLevel: 'high',
      components: [
        {
          id: `${vesselId}-radar`,
          name: 'Marine Radar Systems',
          type: 'X-Band/S-Band Radar',
          manufacturer: 'Furuno',
          failureModes: [
            {
              mode: 'Magnetron degradation',
              symptoms: ['Reduced range', 'Weak targets', 'Signal dropout'],
              causes: ['Component aging', 'Power supply issues'],
              effects: ['Reduced navigation safety', 'USCG compliance risk'],
              mitigations: ['Annual magnetron testing', 'Planned replacement'],
              mtbf: 12000,
        },
      ],
    },
    {
          id: `${vesselId}-gps`,
          name: 'GPS/DGPS System',
          type: 'Positioning System',
          manufacturer: 'Trimble',
          failureModes: [
            {
              mode: 'Antenna cable degradation',
              symptoms: ['Position jumps', 'Signal-to-noise decline', 'Intermittent fix'],
              causes: ['UV damage', 'Moisture ingress', 'Connector corrosion'],
              effects: ['Navigation accuracy reduced'],
              mitigations: ['Annual cable inspection', 'Connector weatherproofing'],
              mtbf: 20000,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-safety`,
      name: 'Safety & Life-Saving Systems',
      category: 'safety',
      maintenanceIntervalHours: 2000,
      criticalityLevel: 'critical',
      components: [
        {
          id: `${vesselId}-fire`,
          name: 'Fire Detection & Suppression',
          type: 'Integrated Fire Safety System',
          failureModes: [
            {
              mode: 'Detector false alarm',
              symptoms: ['Spurious alarms', 'Passenger disruption'],
              causes: ['Contamination', 'Humidity', 'Age'],
              effects: ['Alarm fatigue', 'Delayed response to real events'],
              mitigations: ['Regular detector cleaning', 'Planned replacement'],
              mtbf: 25000,
            },
          ],
        },
        {
          id: `${vesselId}-liferaft`,
          name: 'Life Rafts & Rescue Equipment',
          type: 'SOLAS Life-Saving Appliances',
          failureModes: [
            {
              mode: 'HRU expiry',
              symptoms: ['Service date passed', 'Inspection overdue'],
              causes: ['Time-based degradation'],
              effects: ['USCG non-compliance', 'Safety risk'],
              mitigations: ['Tracking system', 'Annual service schedule'],
              mtbf: 17520,
            },
          ],
        },
      ],
    },
    {
      id: `${vesselId}-hvac`,
      name: 'Passenger HVAC System',
      category: 'hvac',
      maintenanceIntervalHours: 2000,
      criticalityLevel: 'medium',
      components: [
        {
          id: `${vesselId}-hvac-main`,
          name: 'Main Air Handling Units',
          type: 'Marine HVAC System',
          failureModes: [
            {
              mode: 'Compressor efficiency decline',
              symptoms: ['Reduced cooling', 'Longer cycle times', 'Higher current'],
              causes: ['Refrigerant leak', 'Compressor wear', 'Dirty coils'],
              effects: ['Passenger discomfort', 'Increased energy use'],
              mitigations: ['Regular coil cleaning', 'Refrigerant level checks'],
              mtbf: 8000,
            },
          ],
        },
      ],
    },
  ]

  return systems
}

export const VESSEL_PROFILES: Record<string, VesselProfile> = {
  'm-v-puyallup': {
    id: 'm-v-puyallup',
    name: 'M/V Puyallup',
    type: 'ferry',
    subtype: 'Jumbo Mark II Class Auto/Passenger Ferry',
    company: 'wsdot',
    specs: {
      lengthOverall: 140,
      breadth: 27,
      depth: 8,
      maxSpeed: 18,
      powerInstalled: 13000,
      yearBuilt: 1999,
      flag: 'USA',
      classNotation: 'ABS',
      passengerCapacity: 2500,
      vehicleCapacity: 202,
      propulsion: 'Diesel-Electric',
    },
    systems: generateFerrySystems('puyallup', 'Jumbo Mark II'),
    docs: {
      fleetPageUrl: 'https://wsdot.wa.gov/ferries/vesselwatch',
    },
    officialUrl: 'https://wsdot.wa.gov/travel/washington-state-ferries',
    description: 'Jumbo Mark II class ferry, the largest in the WSDOT fleet. Serves the busy Seattle-Bainbridge Island route.',
    capabilities: [
      '2,500 passenger capacity',
      '202 vehicle capacity',
      '35-minute crossing time',
      'Full galley and passenger amenities',
      'ADA accessible on all decks',
    ],
  },

  'm-v-tacoma': {
    id: 'm-v-tacoma',
    name: 'M/V Tacoma',
    type: 'ferry',
    subtype: 'Jumbo Mark II Class Auto/Passenger Ferry',
    company: 'wsdot',
    specs: {
      lengthOverall: 140,
      breadth: 27,
      depth: 8,
      maxSpeed: 18,
      powerInstalled: 13000,
      yearBuilt: 1997,
      flag: 'USA',
      classNotation: 'ABS',
      passengerCapacity: 2500,
      vehicleCapacity: 202,
      propulsion: 'Diesel-Electric',
    },
    systems: generateFerrySystems('tacoma', 'Jumbo Mark II'),
    docs: {
      fleetPageUrl: 'https://wsdot.wa.gov/ferries/vesselwatch',
    },
    officialUrl: 'https://wsdot.wa.gov/travel/washington-state-ferries',
    description: 'Jumbo Mark II class ferry serving Seattle-Bainbridge Island, one of the busiest routes in the system.',
    capabilities: [
      '2,500 passenger capacity',
      '202 vehicle capacity',
      'Diesel-electric propulsion',
      'Full passenger amenities',
    ],
  },

  'm-v-wenatchee': {
    id: 'm-v-wenatchee',
    name: 'M/V Wenatchee',
    type: 'ferry',
    subtype: 'Jumbo Mark II Class Auto/Passenger Ferry',
    company: 'wsdot',
    specs: {
      lengthOverall: 140,
      breadth: 27,
      depth: 8,
      maxSpeed: 18,
      powerInstalled: 13000,
      yearBuilt: 1998,
      flag: 'USA',
      classNotation: 'ABS',
      passengerCapacity: 2500,
      vehicleCapacity: 202,
      propulsion: 'Diesel-Electric',
    },
    systems: generateFerrySystems('wenatchee', 'Jumbo Mark II'),
    docs: {
      fleetPageUrl: 'https://wsdot.wa.gov/ferries/vesselwatch',
    },
    officialUrl: 'https://wsdot.wa.gov/travel/washington-state-ferries',
    description: 'Jumbo Mark II class ferry serving the Seattle-Bremerton route.',
    capabilities: [
      '2,500 passenger capacity',
      '202 vehicle capacity',
      '60-minute crossing time on Bremerton route',
      'Full galley service',
    ],
  },

  'm-v-spokane': {
    id: 'm-v-spokane',
    name: 'M/V Spokane',
    type: 'ferry',
    subtype: 'Jumbo Class Auto/Passenger Ferry',
    company: 'wsdot',
    specs: {
      lengthOverall: 134,
      breadth: 24,
      depth: 7,
      maxSpeed: 17,
      powerInstalled: 10000,
      yearBuilt: 1972,
      yearRebuilt: 2004,
      flag: 'USA',
      passengerCapacity: 2000,
      vehicleCapacity: 188,
      propulsion: 'Diesel',
    },
    systems: generateFerrySystems('spokane', 'Jumbo'),
    docs: {
      fleetPageUrl: 'https://wsdot.wa.gov/ferries/vesselwatch',
    },
    officialUrl: 'https://wsdot.wa.gov/travel/washington-state-ferries',
    description: 'Jumbo class ferry rebuilt in 2004, serving the Edmonds-Kingston route.',
    capabilities: [
      '2,000 passenger capacity',
      '188 vehicle capacity',
      '30-minute crossing time',
      'Rebuilt propulsion system',
    ],
  },

  'm-v-chetzemoka': {
    id: 'm-v-chetzemoka',
    name: 'M/V Chetzemoka',
    type: 'ferry',
    subtype: 'Olympic (Kwa-di Tabil) Class Auto/Passenger Ferry',
    company: 'wsdot',
    specs: {
      lengthOverall: 84,
      breadth: 19,
      depth: 5,
      maxSpeed: 15,
      powerInstalled: 4000,
      yearBuilt: 2010,
      flag: 'USA',
      passengerCapacity: 750,
      vehicleCapacity: 64,
      propulsion: 'Diesel-Electric',
    },
    systems: generateFerrySystems('chetzemoka', 'Olympic'),
    docs: {
      fleetPageUrl: 'https://wsdot.wa.gov/ferries/vesselwatch',
    },
    officialUrl: 'https://wsdot.wa.gov/travel/washington-state-ferries',
    description: 'Newest class of WSDOT ferry, featuring diesel-electric propulsion for improved efficiency.',
    capabilities: [
      '750 passenger capacity',
      '64 vehicle capacity',
      'Diesel-electric hybrid propulsion',
      'Modern emissions controls',
      'Improved fuel efficiency',
    ],
  },
}

export function getVesselProfileByName(name: string): VesselProfile | undefined {
  const normalizedName = name.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-')
  return VESSEL_PROFILES[normalizedName]
}

export function getProfilesByType(type: VesselProfile['type']): VesselProfile[] {
  return Object.values(VESSEL_PROFILES).filter(p => p.type === type)
}
