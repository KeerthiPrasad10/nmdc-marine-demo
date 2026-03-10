import { v4 as uuidv4 } from 'uuid';
import { Vessel, VesselType, EquipmentStatus, EquipmentType, Position } from '../types';
import { WSDOT_FLEET, WSDOTVessel } from '../wsdot/fleet';

// Puget Sound operating area
const PUGET_SOUND = {
  center: { lat: 47.6, lng: -122.4 },
  bounds: {
    minLat: 47.0,
    maxLat: 48.8,
    minLng: -123.2,
    maxLng: -122.0,
  },
};

// Ferry names
const VESSEL_NAMES: Partial<Record<VesselType, string[]>> = {
  ferry: [
    'M/V Puyallup', 'M/V Tacoma', 'M/V Wenatchee', 'M/V Spokane',
    'M/V Walla Walla', 'M/V Kaleetan', 'M/V Yakima', 'M/V Elwha',
    'M/V Hyak', 'M/V Kitsap', 'M/V Cathlamet', 'M/V Chelan',
    'M/V Chetzemoka', 'M/V Kennewick', 'M/V Salish',
    'M/V Tokitae', 'M/V Samish', 'M/V Chimacum',
    'M/V Suquamish', 'M/V Tillikum',
  ],
};

// WSDOT Ferry Routes
const ROUTES = [
  'Seattle - Bainbridge Island',
  'Seattle - Bremerton',
  'Edmonds - Kingston',
  'Mukilteo - Clinton',
  'Fauntleroy - Vashon - Southworth',
  'Point Defiance - Tahlequah',
  'Anacortes - San Juan Islands',
  'Anacortes - Sidney BC',
  'Coupeville - Port Townsend',
];

const EQUIPMENT_TEMPLATES: Partial<Record<VesselType, { type: EquipmentType; name: string }[]>> = {
  ferry: [
    { type: 'engine', name: 'Main Engine' },
    { type: 'propulsion', name: 'Controllable Pitch Propellers' },
    { type: 'hydraulics', name: 'Vehicle Ramp System' },
    { type: 'electrical', name: 'Ship Service Generator' },
    { type: 'navigation', name: 'Navigation & Radar System' },
    { type: 'safety_systems', name: 'Fire Detection & Suppression' },
  ],
};

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEquipment(vesselType: VesselType): EquipmentStatus[] {
  const templates = EQUIPMENT_TEMPLATES[vesselType] || EQUIPMENT_TEMPLATES.ferry || [];
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
    lat: randomInRange(PUGET_SOUND.bounds.minLat, PUGET_SOUND.bounds.maxLat),
    lng: randomInRange(PUGET_SOUND.bounds.minLng, PUGET_SOUND.bounds.maxLng),
  };
}

export function generateVessel(type?: VesselType): Vessel {
  const vesselType: VesselType = type || 'ferry';
  const names = VESSEL_NAMES[vesselType] || VESSEL_NAMES.ferry || ['Unknown Vessel'];
  const equipment = generateEquipment(vesselType);
  const avgEquipmentHealth = equipment.reduce((sum, e) => sum + e.healthScore, 0) / equipment.length;
  
  const fuelLevel = randomInRange(25, 100);
  const speed = randomInRange(0, 18);
  
  const fuelConsumption = 200 * (0.5 + speed / 20);
  
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
      count: Math.floor(randomInRange(8, 25)),
      hoursOnDuty: Math.round(randomInRange(0, 12)),
      safetyScore: Math.round(randomInRange(85, 100)),
    },
    equipment,
    route: randomChoice(ROUTES),
    destination: Math.random() > 0.3 ? generatePosition() : null,
    lastUpdate: new Date(),
  };
}

/**
 * Generate the WSDOT ferry fleet based on real vessel data
 */
export function generateFleet(count: number = 15): Vessel[] {
  const vessels: Vessel[] = [];
  
  // Use WSDOT fleet as the basis for simulation
  WSDOT_FLEET.slice(0, count).forEach((wsdotVessel, index) => {
    const vesselType: VesselType = 'ferry';
    const equipment = generateEquipment(vesselType);
    const avgEquipmentHealth = equipment.reduce((sum, e) => sum + e.healthScore, 0) / equipment.length;
    
    const fuelLevel = randomInRange(35, 95);
    const speed = randomInRange(0, 18);
    
    const fuelConsumption = 200 * (0.5 + speed / 20);
    
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
      id: wsdotVessel.mmsi,
      name: wsdotVessel.name,
      type: vesselType,
      mmsi: wsdotVessel.mmsi,
      imo: undefined,
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
        count: wsdotVessel.crewCount || Math.floor(randomInRange(10, 25)),
        hoursOnDuty: Math.round(randomInRange(0, 12)),
        safetyScore: Math.round(randomInRange(88, 100)),
      },
      equipment,
      route: wsdotVessel.route || randomChoice(ROUTES),
      destination: Math.random() > 0.3 ? generatePosition() : null,
      lastUpdate: new Date(),
    });
  });
  
  return vessels;
}

// Keep legacy function for backwards compatibility
export function generateRandomFleet(count: number = 20): Vessel[] {
  const vessels: Vessel[] = [];
  
  for (let i = 0; i < count; i++) {
    vessels.push(generateVessel('ferry'));
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
  
  // Keep within Puget Sound bounds
  newLat = Math.max(PUGET_SOUND.bounds.minLat, Math.min(PUGET_SOUND.bounds.maxLat, newLat));
  newLng = Math.max(PUGET_SOUND.bounds.minLng, Math.min(PUGET_SOUND.bounds.maxLng, newLng));
  
  // Update fuel level
  const fuelUsed = (vessel.fuelConsumption / 3600) * deltaTime;
  const newFuelLevel = Math.max(0, vessel.fuelLevel - fuelUsed / 100);
  
  return {
    ...vessel,
    position: { lat: newLat, lng: newLng },
    fuelLevel: Math.round(newFuelLevel * 10) / 10,
    lastUpdate: new Date(),
  };
}
