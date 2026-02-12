// @ts-nocheck — legacy marine simulation
import { Vessel, EquipmentStatus, MaintenancePrediction, MitigationPriority } from '../types';
import { v4 as uuidv4 } from 'uuid';

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function degradeEquipment(equipment: EquipmentStatus, deltaTime: number): EquipmentStatus {
  // Equipment degrades over time based on usage
  const hoursElapsed = deltaTime / 3600; // Convert seconds to hours
  const newHoursOperated = equipment.hoursOperated + hoursElapsed;
  
  // Health degrades based on operating hours and random factors
  const baseDegradation = hoursElapsed * 0.001; // 0.1% per hour of operation
  const randomFactor = randomInRange(-0.0005, 0.002);
  const newHealthScore = Math.max(0, equipment.healthScore - (baseDegradation + randomFactor) * 100);
  
  // Temperature fluctuates
  const tempChange = randomInRange(-2, 3);
  const newTemperature = Math.max(30, Math.min(120, equipment.temperature + tempChange));
  
  // Vibration increases as health decreases
  const baseVibration = equipment.vibration;
  const healthFactor = (100 - newHealthScore) / 100;
  const newVibration = Math.max(0.1, baseVibration + healthFactor * randomInRange(-0.5, 1));
  
  // Update failure prediction based on health
  let predictedFailure = equipment.predictedFailure;
  let failureConfidence = equipment.failureConfidence;
  
  if (newHealthScore < 50 && !predictedFailure) {
    // Start predicting failure when health drops below 50%
    const daysUntilFailure = Math.max(1, (newHealthScore / 50) * 30);
    predictedFailure = new Date(Date.now() + daysUntilFailure * 24 * 60 * 60 * 1000);
    failureConfidence = Math.round(60 + (50 - newHealthScore));
  } else if (predictedFailure && newHealthScore > 60) {
    // Clear prediction if health improves (after maintenance)
    predictedFailure = null;
    failureConfidence = 0;
  }
  
  return {
    ...equipment,
    healthScore: Math.round(newHealthScore * 10) / 10,
    temperature: Math.round(newTemperature * 10) / 10,
    vibration: Math.round(newVibration * 100) / 100,
    hoursOperated: Math.round(newHoursOperated * 10) / 10,
    predictedFailure,
    failureConfidence: Math.min(99, failureConfidence),
  };
}

export function simulateEquipmentFailure(equipment: EquipmentStatus): EquipmentStatus | null {
  // Random chance of sudden failure, higher for low health equipment
  const failureChance = (100 - equipment.healthScore) / 10000; // 1% for 0 health per tick
  
  if (Math.random() < failureChance) {
    return {
      ...equipment,
      healthScore: Math.max(0, equipment.healthScore - randomInRange(20, 40)),
      temperature: equipment.temperature + randomInRange(10, 30),
      vibration: equipment.vibration * randomInRange(1.5, 3),
      predictedFailure: new Date(Date.now() + randomInRange(1, 7) * 24 * 60 * 60 * 1000),
      failureConfidence: Math.round(randomInRange(80, 99)),
    };
  }
  
  return null;
}

export function generateMaintenancePredictions(vessels: Vessel[]): MaintenancePrediction[] {
  const predictions: MaintenancePrediction[] = [];
  
  for (const vessel of vessels) {
    for (const equipment of vessel.equipment) {
      if (equipment.healthScore < 70 || equipment.predictedFailure) {
        const daysUntilFailure = equipment.predictedFailure
          ? Math.max(0, Math.round((equipment.predictedFailure.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
          : Math.round((equipment.healthScore / 100) * 60);
        
        let priority: MitigationPriority;
        let predictedIssue: string;
        let recommendedAction: string;
        let estimatedDowntime: string;
        let estimatedCost: string;
        
        if (equipment.healthScore < 30) {
          priority = 'immediate';
          predictedIssue = `Critical failure imminent - ${equipment.name} showing severe degradation`;
          recommendedAction = 'Immediate replacement required. Schedule emergency maintenance.';
          estimatedDowntime = '24-48 hours';
          estimatedCost = '$50,000 - $150,000';
        } else if (equipment.healthScore < 50) {
          priority = 'high';
          predictedIssue = `${equipment.name} performance degradation detected. High vibration and temperature anomalies.`;
          recommendedAction = 'Schedule maintenance within 7 days. Order replacement parts.';
          estimatedDowntime = '12-24 hours';
          estimatedCost = '$20,000 - $50,000';
        } else if (equipment.healthScore < 60) {
          priority = 'medium';
          predictedIssue = `${equipment.name} showing early signs of wear. Trending towards failure.`;
          recommendedAction = 'Plan maintenance during next scheduled downtime.';
          estimatedDowntime = '8-12 hours';
          estimatedCost = '$10,000 - $25,000';
        } else {
          priority = 'low';
          predictedIssue = `${equipment.name} approaching maintenance threshold.`;
          recommendedAction = 'Add to next scheduled maintenance cycle.';
          estimatedDowntime = '4-8 hours';
          estimatedCost = '$5,000 - $15,000';
        }
        
        predictions.push({
          id: uuidv4(),
          vesselId: vessel.id,
          vesselName: vessel.name,
          equipment,
          predictedIssue,
          probability: equipment.failureConfidence || Math.round((100 - equipment.healthScore) * 0.8),
          daysUntilFailure,
          recommendedAction,
          priority,
          estimatedDowntime,
          estimatedCost,
        });
      }
    }
  }
  
  // Sort by priority and days until failure
  const priorityOrder: Record<MitigationPriority, number> = {
    immediate: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  
  predictions.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.daysUntilFailure - b.daysUntilFailure;
  });
  
  return predictions;
}

export function performMaintenance(equipment: EquipmentStatus): EquipmentStatus {
  return {
    ...equipment,
    healthScore: Math.min(100, equipment.healthScore + randomInRange(30, 50)),
    temperature: randomInRange(40, 60),
    vibration: randomInRange(0.5, 2),
    lastMaintenance: new Date(),
    predictedFailure: null,
    failureConfidence: 0,
  };
}

