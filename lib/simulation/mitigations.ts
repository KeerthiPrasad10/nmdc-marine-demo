// @ts-nocheck — legacy marine simulation
import { v4 as uuidv4 } from 'uuid';
import { Alert, Mitigation, Vessel, WeatherCondition, AlertType, AlertSeverity } from '../types';

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const WEATHER_MITIGATIONS: Mitigation[] = [
  {
    id: '',
    action: 'Redirect vessel to nearest safe harbor immediately',
    priority: 'immediate',
    estimatedImpact: 'Prevents potential vessel damage and crew safety incidents',
    businessValue: 'Avoids $500K+ in potential damage and liability claims',
    timeToImplement: '30 minutes - 2 hours',
    costEstimate: '$5,000 - $10,000 (fuel, schedule delay)',
  },
  {
    id: '',
    action: 'Reduce vessel speed to 50% and maintain heading into waves',
    priority: 'high',
    estimatedImpact: 'Minimizes stress on hull and equipment during adverse conditions',
    businessValue: 'Reduces wear and prevents $50K-100K in potential repairs',
    timeToImplement: 'Immediate',
    costEstimate: '$2,000 - $5,000 (schedule impact)',
  },
  {
    id: '',
    action: 'Delay departure until weather conditions improve',
    priority: 'high',
    estimatedImpact: 'Ensures safe operations and crew wellbeing',
    businessValue: 'Prevents potential accidents and maintains insurance compliance',
    timeToImplement: '4-12 hours',
    costEstimate: '$10,000 - $25,000 (delay costs)',
  },
  {
    id: '',
    action: 'Activate enhanced monitoring protocols for all vessels in affected area',
    priority: 'medium',
    estimatedImpact: 'Early detection of any weather-related issues',
    businessValue: 'Proactive risk management reduces incident probability by 40%',
    timeToImplement: '15 minutes',
    costEstimate: 'Minimal (operational resources)',
  },
];

const EQUIPMENT_MITIGATIONS: Mitigation[] = [
  {
    id: '',
    action: 'Schedule emergency maintenance during next port call',
    priority: 'immediate',
    estimatedImpact: 'Prevents complete equipment failure and unplanned downtime',
    businessValue: 'Avoids $100K+ in emergency repair costs and project delays',
    timeToImplement: '24-48 hours',
    costEstimate: '$15,000 - $30,000 (planned maintenance)',
  },
  {
    id: '',
    action: 'Reduce equipment load to 60% capacity until maintenance',
    priority: 'high',
    estimatedImpact: 'Extends equipment life and prevents catastrophic failure',
    businessValue: 'Maintains operations while preventing $50K+ in damage',
    timeToImplement: 'Immediate',
    costEstimate: '$5,000 - $10,000 (reduced productivity)',
  },
  {
    id: '',
    action: 'Deploy backup equipment from nearby vessel',
    priority: 'high',
    estimatedImpact: 'Maintains operational capability during repairs',
    businessValue: 'Prevents project delays worth $20K-50K per day',
    timeToImplement: '4-8 hours',
    costEstimate: '$8,000 - $15,000 (logistics)',
  },
  {
    id: '',
    action: 'Order replacement parts for expedited delivery',
    priority: 'medium',
    estimatedImpact: 'Ensures parts availability for scheduled maintenance',
    businessValue: 'Reduces maintenance window by 50%',
    timeToImplement: '2-5 days',
    costEstimate: '$5,000 - $20,000 (parts + expedite fees)',
  },
];

const FUEL_MITIGATIONS: Mitigation[] = [
  {
    id: '',
    action: 'Optimize route to nearest bunkering facility',
    priority: 'immediate',
    estimatedImpact: 'Ensures vessel reaches refueling point safely',
    businessValue: 'Prevents operational stoppage and emergency bunkering costs',
    timeToImplement: '30 minutes (route change)',
    costEstimate: '$2,000 - $5,000 (route deviation)',
  },
  {
    id: '',
    action: 'Reduce speed to economy mode for fuel conservation',
    priority: 'high',
    estimatedImpact: 'Extends range by 30-40% at reduced speed',
    businessValue: 'Saves $5K-15K in fuel costs and prevents emergency situations',
    timeToImplement: 'Immediate',
    costEstimate: 'Net positive (fuel savings)',
  },
  {
    id: '',
    action: 'Adjust vessel trim for optimal fuel efficiency',
    priority: 'medium',
    estimatedImpact: 'Improves fuel consumption by 5-10%',
    businessValue: 'Annual savings of $50K-100K per vessel',
    timeToImplement: '15 minutes',
    costEstimate: 'No additional cost',
  },
  {
    id: '',
    action: 'Implement emissions monitoring and reporting protocol',
    priority: 'low',
    estimatedImpact: 'Ensures ESG compliance and identifies optimization opportunities',
    businessValue: 'Supports carbon reduction targets and regulatory compliance',
    timeToImplement: '1-2 days (system setup)',
    costEstimate: '$3,000 - $8,000 (system integration)',
  },
];

const SAFETY_MITIGATIONS: Mitigation[] = [
  {
    id: '',
    action: 'Initiate crew safety briefing and implement enhanced protocols',
    priority: 'immediate',
    estimatedImpact: 'Addresses safety concerns and reinforces procedures',
    businessValue: 'Reduces incident probability by 60% and maintains compliance',
    timeToImplement: '1 hour',
    costEstimate: '$500 - $1,000 (operational time)',
  },
  {
    id: '',
    action: 'Rotate crew members approaching fatigue thresholds',
    priority: 'high',
    estimatedImpact: 'Prevents fatigue-related incidents and errors',
    businessValue: 'Maintains productivity and reduces incident risk by 45%',
    timeToImplement: '4-8 hours (shift change)',
    costEstimate: '$2,000 - $5,000 (overtime/relief crew)',
  },
  {
    id: '',
    action: 'Deploy additional safety equipment to vessel',
    priority: 'medium',
    estimatedImpact: 'Enhances emergency response capability',
    businessValue: 'Ensures regulatory compliance and crew protection',
    timeToImplement: '24-48 hours',
    costEstimate: '$5,000 - $15,000 (equipment + logistics)',
  },
  {
    id: '',
    action: 'Schedule mandatory safety audit and training refresh',
    priority: 'low',
    estimatedImpact: 'Identifies gaps and improves overall safety culture',
    businessValue: 'Long-term risk reduction and insurance benefits',
    timeToImplement: '1-2 weeks',
    costEstimate: '$10,000 - $20,000 (audit + training)',
  },
];

function getMitigationsForType(type: AlertType): Mitigation[] {
  switch (type) {
    case 'weather':
      return WEATHER_MITIGATIONS;
    case 'equipment':
      return EQUIPMENT_MITIGATIONS;
    case 'fuel':
      return FUEL_MITIGATIONS;
    case 'safety':
      return SAFETY_MITIGATIONS;
    default:
      return [];
  }
}

export function generateMitigations(type: AlertType, severity: AlertSeverity): Mitigation[] {
  const allMitigations = getMitigationsForType(type);
  
  // Select 2-4 mitigations based on severity
  const count = severity === 'critical' ? 4 : severity === 'warning' ? 3 : 2;
  const selected: Mitigation[] = [];
  const available = [...allMitigations];
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const index = Math.floor(Math.random() * available.length);
    const mitigation = { ...available[index], id: uuidv4() };
    selected.push(mitigation);
    available.splice(index, 1);
  }
  
  return selected;
}

export function generateWeatherAlert(vessel: Vessel, weather: WeatherCondition): Alert | null {
  if (weather.severity === 'normal') return null;
  
  let severity: AlertSeverity;
  let title: string;
  let description: string;
  
  switch (weather.severity) {
    case 'severe':
      severity = 'critical';
      title = `Severe Weather Warning - ${vessel.name}`;
      description = `Storm conditions detected in operating area. Wind speed: ${weather.windSpeed} knots, Wave height: ${weather.waveHeight}m. Immediate action required.`;
      break;
    case 'warning':
      severity = 'warning';
      title = `Weather Advisory - ${vessel.name}`;
      description = `Deteriorating weather conditions. Wind speed: ${weather.windSpeed} knots, Wave height: ${weather.waveHeight}m. Enhanced monitoring recommended.`;
      break;
    default:
      severity = 'info';
      title = `Weather Notice - ${vessel.name}`;
      description = `Minor weather changes detected. Visibility: ${weather.visibility} nm. Continue with caution.`;
  }
  
  return {
    id: uuidv4(),
    vesselId: vessel.id,
    vesselName: vessel.name,
    type: 'weather',
    severity,
    title,
    description,
    timestamp: new Date(),
    acknowledged: false,
    resolved: false,
    mitigations: generateMitigations('weather', severity),
  };
}

export function generateEquipmentAlert(vessel: Vessel): Alert | null {
  const criticalEquipment = vessel.equipment.filter((e) => e.healthScore < 40);
  const warningEquipment = vessel.equipment.filter((e) => e.healthScore >= 40 && e.healthScore < 60);
  
  if (criticalEquipment.length > 0) {
    const equipment = criticalEquipment[0];
    return {
      id: uuidv4(),
      vesselId: vessel.id,
      vesselName: vessel.name,
      type: 'equipment',
      severity: 'critical',
      title: `Critical Equipment Alert - ${vessel.name}`,
      description: `${equipment.name} health at ${equipment.healthScore}%. Temperature: ${equipment.temperature}°C, Vibration: ${equipment.vibration} mm/s. Immediate maintenance required.`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      mitigations: generateMitigations('equipment', 'critical'),
    };
  }
  
  if (warningEquipment.length > 0 && Math.random() > 0.7) {
    const equipment = warningEquipment[0];
    return {
      id: uuidv4(),
      vesselId: vessel.id,
      vesselName: vessel.name,
      type: 'equipment',
      severity: 'warning',
      title: `Equipment Warning - ${vessel.name}`,
      description: `${equipment.name} showing degradation. Health: ${equipment.healthScore}%. Schedule maintenance to prevent failure.`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      mitigations: generateMitigations('equipment', 'warning'),
    };
  }
  
  return null;
}

export function generateFuelAlert(vessel: Vessel): Alert | null {
  if (vessel.fuelLevel < 15) {
    return {
      id: uuidv4(),
      vesselId: vessel.id,
      vesselName: vessel.name,
      type: 'fuel',
      severity: 'critical',
      title: `Critical Fuel Level - ${vessel.name}`,
      description: `Fuel level at ${vessel.fuelLevel}%. Immediate bunkering required. Current consumption: ${vessel.fuelConsumption} L/hr.`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      mitigations: generateMitigations('fuel', 'critical'),
    };
  }
  
  if (vessel.fuelLevel < 30) {
    return {
      id: uuidv4(),
      vesselId: vessel.id,
      vesselName: vessel.name,
      type: 'fuel',
      severity: 'warning',
      title: `Low Fuel Warning - ${vessel.name}`,
      description: `Fuel level at ${vessel.fuelLevel}%. Plan bunkering within next 24 hours.`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      mitigations: generateMitigations('fuel', 'warning'),
    };
  }
  
  // High emissions alert
  if (vessel.emissions.co2 > 800 && Math.random() > 0.8) {
    return {
      id: uuidv4(),
      vesselId: vessel.id,
      vesselName: vessel.name,
      type: 'fuel',
      severity: 'info',
      title: `High Emissions Notice - ${vessel.name}`,
      description: `CO2 emissions at ${vessel.emissions.co2} kg/hr. Consider speed optimization for ESG compliance.`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      mitigations: generateMitigations('fuel', 'info'),
    };
  }
  
  return null;
}

export function generateSafetyAlert(vessel: Vessel): Alert | null {
  // Check crew fatigue
  if (vessel.crew.hoursOnDuty > 10 && Math.random() > 0.6) {
    return {
      id: uuidv4(),
      vesselId: vessel.id,
      vesselName: vessel.name,
      type: 'safety',
      severity: 'warning',
      title: `Crew Fatigue Alert - ${vessel.name}`,
      description: `Crew on duty for ${vessel.crew.hoursOnDuty} hours. Fatigue risk elevated. Consider crew rotation.`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      mitigations: generateMitigations('safety', 'warning'),
    };
  }
  
  // Check safety score
  if (vessel.crew.safetyScore < 90 && Math.random() > 0.8) {
    return {
      id: uuidv4(),
      vesselId: vessel.id,
      vesselName: vessel.name,
      type: 'safety',
      severity: 'info',
      title: `Safety Compliance Notice - ${vessel.name}`,
      description: `Safety score at ${vessel.crew.safetyScore}%. Review recent safety checklists and procedures.`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      mitigations: generateMitigations('safety', 'info'),
    };
  }
  
  return null;
}

export function checkAndGenerateAlerts(vessel: Vessel, weather: WeatherCondition): Alert[] {
  const alerts: Alert[] = [];
  
  // Only generate alerts probabilistically to avoid overwhelming
  if (Math.random() < 0.1) {
    const weatherAlert = generateWeatherAlert(vessel, weather);
    if (weatherAlert) alerts.push(weatherAlert);
  }
  
  if (Math.random() < 0.05) {
    const equipmentAlert = generateEquipmentAlert(vessel);
    if (equipmentAlert) alerts.push(equipmentAlert);
  }
  
  if (Math.random() < 0.03) {
    const fuelAlert = generateFuelAlert(vessel);
    if (fuelAlert) alerts.push(fuelAlert);
  }
  
  if (Math.random() < 0.02) {
    const safetyAlert = generateSafetyAlert(vessel);
    if (safetyAlert) alerts.push(safetyAlert);
  }
  
  return alerts;
}

