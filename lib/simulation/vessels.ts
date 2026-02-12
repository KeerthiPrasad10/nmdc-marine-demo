// @ts-nocheck — legacy marine simulation
import { v4 as uuidv4 } from 'uuid';
import { Vessel, VesselType, EquipmentStatus, EquipmentType, Position } from '../types';
import { NMDC_FLEET as LEGACY_FLEET, NMDCVessel as LegacyVessel } from '../nmdc/fleet';

// UAE/Persian Gulf operating area
const UAE_WATERS = {
  center: { lat: 24.5, lng: 54.5 },
  bounds: {
    minLat: 23.5,
    maxLat: 26.5,
    minLng: 51.5,
    maxLng: 56.5,
  },
};

// Map legacy vessel types to simulation types
const LEGACY_TYPE_MAP: Record<LegacyVessel['type'], VesselType> = {
  dredger: 'dredger',
  hopper_dredger: 'dredger',
  csd: 'dredger',
  tug: 'tugboat',
  supply: 'supply_vessel',
  barge: 'crane_barge',
  survey: 'survey_vessel',
  pipelay_barge: 'pipelay_barge',
  jack_up: 'jack_up_barge',
  accommodation_barge: 'accommodation_barge',
  work_barge: 'work_barge',
  derrick_barge: 'crane_barge',
};

// Vessel names by type
const VESSEL_NAMES: Record<VesselType, string[]> = {
  dredger: ['Al Hamra', 'Al Khatem', 'Al Mirfa', 'Al Sadr', 'Al Yassat', 'Kattouf'],
  tugboat: ['Gulf Pioneer', 'Al Dhafra Tug', 'Harbor Force'],
  supply_vessel: ['Al Ain Supply', 'Gulf Supplier', 'Al Reem'],
  crane_barge: ['Heavy Lifter I', 'Heavy Lifter II', 'Heavy Lift Alpha'],
  survey_vessel: ['Gulf Surveyor', 'Al Dhafra Survey'],
  pipelay_barge: ['DLB 1600', 'Lay Barge Alpha', 'Pipelay Pioneer'],
  jack_up_barge: ['Shengli 7', 'Shengli 10', 'Jack Up Pioneer'],
  accommodation_barge: ['Floatel Alpha', 'Floatel Beta', 'Living Quarters 1'],
  work_barge: ['Work Barge A', 'Work Barge B', 'Utility 1'],
};

// Legacy Marine Active Projects
const PROJECTS = [
  'Ghasha Concession Development',
  'Abu Dhabi Ports Expansion',
  'Khalifa Port Extension',
  'Ruwais LNG Terminal',
  'Dubai Maritime City',
  'Fujairah Port Deepening',
  'Sir Bani Yas Island',
  'Al Raha Beach Development',
  'Saadiyat Island Marina',
  'ADNOC Offshore Support',
  'Hail & Ghasha Field Services',
  'Dalma Field Operations',
  'Seabed Mapping - Western Region',
];

const EQUIPMENT_TEMPLATES: Record<VesselType, { type: EquipmentType; name: string }[]> = {
  tugboat: [
    { type: 'engine', name: 'Main Engine' },
    { type: 'propulsion', name: 'Azimuth Thruster' },
    { type: 'hydraulics', name: 'Towing Winch' },
    { type: 'navigation', name: 'Navigation System' },
  ],
  supply_vessel: [
    { type: 'engine', name: 'Main Engine' },
    { type: 'propulsion', name: 'Propeller System' },
    { type: 'hydraulics', name: 'Cargo Crane' },
    { type: 'electrical', name: 'Power Generator' },
    { type: 'navigation', name: 'GPS & Radar' },
  ],
  crane_barge: [
    { type: 'engine', name: 'Auxiliary Engine' },
    { type: 'crane', name: 'Main Crane System' },
    { type: 'hydraulics', name: 'Crane Hydraulics' },
    { type: 'electrical', name: 'Power Distribution' },
    { type: 'navigation', name: 'Positioning System' },
  ],
  dredger: [
    { type: 'engine', name: 'Main Engine' },
    { type: 'hydraulics', name: 'Dredge Pump' },
    { type: 'propulsion', name: 'Cutter Head Drive' },
    { type: 'electrical', name: 'Control Systems' },
    { type: 'navigation', name: 'Survey Equipment' },
  ],
  survey_vessel: [
    { type: 'engine', name: 'Main Engine' },
    { type: 'propulsion', name: 'Dynamic Positioning' },
    { type: 'electrical', name: 'Survey Electronics' },
    { type: 'navigation', name: 'Multibeam Sonar' },
  ],
  pipelay_barge: [
    { type: 'engine', name: 'Power Plant' },
    { type: 'crane', name: 'Pipe Tensioner' },
    { type: 'hydraulics', name: 'S-Lay System' },
    { type: 'electrical', name: 'Welding Station' },
    { type: 'navigation', name: 'DP System' },
  ],
  jack_up_barge: [
    { type: 'engine', name: 'Jacking System' },
    { type: 'crane', name: 'Main Crane' },
    { type: 'hydraulics', name: 'Leg Hydraulics' },
    { type: 'electrical', name: 'Power Generation' },
    { type: 'navigation', name: 'Positioning System' },
  ],
  accommodation_barge: [
    { type: 'engine', name: 'Power Generator' },
    { type: 'electrical', name: 'HVAC System' },
    { type: 'hydraulics', name: 'Gangway System' },
    { type: 'navigation', name: 'Safety Systems' },
  ],
  work_barge: [
    { type: 'engine', name: 'Auxiliary Engine' },
    { type: 'crane', name: 'Deck Crane' },
    { type: 'hydraulics', name: 'Winch System' },
    { type: 'electrical', name: 'Power Supply' },
  ],
};

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEquipment(vesselType: VesselType): EquipmentStatus[] {
  const templates = EQUIPMENT_TEMPLATES[vesselType];
  return templates.map((template) => {
    const hoursOperated = randomInRange(500, 15000);
    const healthScore = Math.max(20, 100 - (hoursOperated / 200) + randomInRange(-15, 15));
    const hasPredictedFailure = healthScore < 60 && Math.random() > 0.5;
    
    return {
      id: uuidv4(),
      type: template.type,
      name: template.name,
      healthScore: Math.round(healthScore),
      temperature: randomInRange(45, 95),
      vibration: randomInRange(0.5, 8),
      hoursOperated: Math.round(hoursOperated),
      lastMaintenance: new Date(Date.now() - randomInRange(7, 180) * 24 * 60 * 60 * 1000),
      predictedFailure: hasPredictedFailure 
        ? new Date(Date.now() + randomInRange(1, 30) * 24 * 60 * 60 * 1000)
        : null,
      failureConfidence: hasPredictedFailure ? Math.round(randomInRange(60, 95)) : 0,
    };
  });
}

function generatePosition(): Position {
  return {
    lat: randomInRange(UAE_WATERS.bounds.minLat, UAE_WATERS.bounds.maxLat),
    lng: randomInRange(UAE_WATERS.bounds.minLng, UAE_WATERS.bounds.maxLng),
  };
}

export function generateVessel(type?: VesselType): Vessel {
  const vesselType = type || randomChoice(Object.keys(VESSEL_NAMES) as VesselType[]);
  const names = VESSEL_NAMES[vesselType];
  const equipment = generateEquipment(vesselType);
  const avgEquipmentHealth = equipment.reduce((sum, e) => sum + e.healthScore, 0) / equipment.length;
  
  const fuelLevel = randomInRange(25, 100);
  const speed = vesselType === 'crane_barge' ? randomInRange(0, 3) : randomInRange(0, 15);
  
  // Base fuel consumption varies by vessel type
  const baseFuelConsumption: Record<VesselType, number> = {
    tugboat: 150,
    supply_vessel: 250,
    crane_barge: 80,
    dredger: 400,
    survey_vessel: 120,
    pipelay_barge: 350,
    jack_up_barge: 200,
    accommodation_barge: 100,
    work_barge: 80,
  };
  
  const fuelConsumption = baseFuelConsumption[vesselType] * (0.5 + speed / 20);
  
  // Calculate emissions based on fuel consumption
  const co2 = fuelConsumption * 2.68; // kg CO2 per liter diesel
  const nox = fuelConsumption * 0.05;
  const sox = fuelConsumption * 0.002;
  
  const statuses: ('operational' | 'maintenance' | 'idle')[] = ['operational', 'operational', 'operational', 'idle', 'maintenance'];
  let status = randomChoice(statuses);
  
  // If equipment health is very low, vessel might be in maintenance
  if (avgEquipmentHealth < 40) {
    status = 'maintenance';
  }
  
  return {
    id: uuidv4(),
    name: randomChoice(names),
    type: vesselType,
    position: generatePosition(),
    heading: randomInRange(0, 360),
    speed: status === 'operational' ? speed : 0,
    status,
    healthScore: Math.round(avgEquipmentHealth),
    fuelLevel: Math.round(fuelLevel),
    fuelConsumption: Math.round(fuelConsumption),
    emissions: {
      co2: Math.round(co2 * 10) / 10,
      nox: Math.round(nox * 100) / 100,
      sox: Math.round(sox * 1000) / 1000,
    },
    crew: {
      count: Math.floor(randomInRange(5, 25)),
      hoursOnDuty: Math.round(randomInRange(0, 12)),
      safetyScore: Math.round(randomInRange(85, 100)),
    },
    equipment,
    project: randomChoice(PROJECTS),
    destination: Math.random() > 0.3 ? generatePosition() : null,
    lastUpdate: new Date(),
  };
}

/**
 * Generate the legacy marine fleet based on real vessel data
 * Uses vessel names, types, crew counts, and project assignments
 */
export function generateFleet(count: number = 15): Vessel[] {
  const vessels: Vessel[] = [];
  
  // Use legacy fleet as the basis for simulation
  LEGACY_FLEET.slice(0, count).forEach((legacyVessel, index) => {
    const vesselType = LEGACY_TYPE_MAP[legacyVessel.type];
    const equipment = generateEquipment(vesselType);
    const avgEquipmentHealth = equipment.reduce((sum, e) => sum + e.healthScore, 0) / equipment.length;
    
    const fuelLevel = randomInRange(35, 95);
    const speed = legacyVessel.type === 'barge' ? randomInRange(0, 2) : randomInRange(0, 12);
    
    // Base fuel consumption varies by vessel type
    const baseFuelConsumption: Record<VesselType, number> = {
      tugboat: 150,
      supply_vessel: 250,
      crane_barge: 80,
      dredger: 400,
      survey_vessel: 120,
      pipelay_barge: 350,
      jack_up_barge: 200,
      accommodation_barge: 100,
      work_barge: 80,
    };
    
    const fuelConsumption = baseFuelConsumption[vesselType] * (0.5 + speed / 20);
    
    // Calculate emissions based on fuel consumption
    const co2 = fuelConsumption * 2.68;
    const nox = fuelConsumption * 0.05;
    const sox = fuelConsumption * 0.002;
    
    const statuses: ('operational' | 'maintenance' | 'idle')[] = ['operational', 'operational', 'operational', 'idle', 'maintenance'];
    let status = statuses[index % statuses.length];
    
    if (avgEquipmentHealth < 40) {
      status = 'maintenance';
    }
    
    vessels.push({
      id: legacyVessel.mmsi, // Use MMSI as ID for correlation with live data
      name: legacyVessel.name,
      type: vesselType,
      mmsi: legacyVessel.mmsi,
      imo: legacyVessel.imo,
      position: generatePosition(),
      heading: randomInRange(0, 360),
      speed: status === 'operational' ? speed : 0,
      status,
      healthScore: Math.round(avgEquipmentHealth),
      fuelLevel: Math.round(fuelLevel),
      fuelConsumption: Math.round(fuelConsumption),
      emissions: {
        co2: Math.round(co2 * 10) / 10,
        nox: Math.round(nox * 100) / 100,
        sox: Math.round(sox * 1000) / 1000,
      },
      crew: {
        count: legacyVessel.crewCount || Math.floor(randomInRange(10, 25)),
        hoursOnDuty: Math.round(randomInRange(0, 12)),
        safetyScore: Math.round(randomInRange(88, 100)),
      },
      equipment,
      project: legacyVessel.project || randomChoice(PROJECTS),
      destination: Math.random() > 0.3 ? generatePosition() : null,
      lastUpdate: new Date(),
    });
  });
  
  return vessels;
}

// Keep legacy function for backwards compatibility
export function generateRandomFleet(count: number = 20): Vessel[] {
  const vessels: Vessel[] = [];
  const typeDistribution: VesselType[] = [
    'tugboat', 'tugboat', 'tugboat', 'tugboat',
    'supply_vessel', 'supply_vessel', 'supply_vessel',
    'crane_barge', 'crane_barge',
    'dredger', 'dredger', 'dredger',
    'survey_vessel', 'survey_vessel',
  ];
  
  for (let i = 0; i < count; i++) {
    const type = typeDistribution[i % typeDistribution.length];
    vessels.push(generateVessel(type));
  }
  
  const nameCount: Record<string, number> = {};
  vessels.forEach((vessel) => {
    if (nameCount[vessel.name]) {
      nameCount[vessel.name]++;
      vessel.name = `${vessel.name} ${nameCount[vessel.name]}`;
    } else {
      nameCount[vessel.name] = 1;
    }
  });
  
  return vessels;
}

export function updateVesselPosition(vessel: Vessel, deltaTime: number): Vessel {
  if (vessel.status !== 'operational' || vessel.speed === 0) {
    return { ...vessel, lastUpdate: new Date() };
  }
  
  // Convert speed from knots to degrees/second (approximate)
  const speedDegPerSec = (vessel.speed * 1.852) / 111000;
  const distance = speedDegPerSec * deltaTime;
  
  // Move towards destination or random direction
  let newLat = vessel.position.lat;
  let newLng = vessel.position.lng;
  
  if (vessel.destination) {
    const dLat = vessel.destination.lat - vessel.position.lat;
    const dLng = vessel.destination.lng - vessel.position.lng;
    const angle = Math.atan2(dLng, dLat);
    
    newLat += Math.cos(angle) * distance;
    newLng += Math.sin(angle) * distance;
    
    // Update heading
    vessel.heading = (angle * 180 / Math.PI + 360) % 360;
    
    // Check if reached destination
    const distToDestination = Math.sqrt(dLat * dLat + dLng * dLng);
    if (distToDestination < 0.01) {
      vessel.destination = null;
    }
  } else {
    // Random slight heading change
    vessel.heading = (vessel.heading + randomInRange(-5, 5) + 360) % 360;
    const radians = vessel.heading * Math.PI / 180;
    newLat += Math.cos(radians) * distance;
    newLng += Math.sin(radians) * distance;
  }
  
  // Keep within bounds
  newLat = Math.max(UAE_WATERS.bounds.minLat, Math.min(UAE_WATERS.bounds.maxLat, newLat));
  newLng = Math.max(UAE_WATERS.bounds.minLng, Math.min(UAE_WATERS.bounds.maxLng, newLng));
  
  // Update fuel level
  const fuelUsed = (vessel.fuelConsumption / 3600) * deltaTime; // liters per second
  const newFuelLevel = Math.max(0, vessel.fuelLevel - fuelUsed / 100);
  
  return {
    ...vessel,
    position: { lat: newLat, lng: newLng },
    fuelLevel: Math.round(newFuelLevel * 10) / 10,
    lastUpdate: new Date(),
  };
}

