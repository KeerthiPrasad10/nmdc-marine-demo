// @ts-nocheck — legacy marine simulation engine; superseded by grid-orchestrator
import { Vessel, Alert, WeatherCondition, FleetMetrics, SimulationState } from '../types';
import { generateFleet, updateVesselPosition } from './vessels';
import { generateWeather, updateWeather } from './weather';
import { degradeEquipment, simulateEquipmentFailure } from './equipment';
import { checkAndGenerateAlerts } from './mitigations';

// Global simulation state (in-memory for demo)
let simulationState: SimulationState | null = null;
let lastUpdateTime: number = Date.now();

export function initializeSimulation(vesselCount: number = 20): SimulationState {
  const vessels = generateFleet(vesselCount);
  const vesselMap = new Map<string, Vessel>();
  
  vessels.forEach((vessel) => {
    vesselMap.set(vessel.id, vessel);
  });
  
  simulationState = {
    vessels: vesselMap,
    alerts: [],
    weather: generateWeather(),
    lastUpdate: new Date(),
    simulationSpeed: 10, // 10x faster than real-time for demo
  };
  
  lastUpdateTime = Date.now();
  return simulationState;
}

export function getSimulationState(): SimulationState {
  if (!simulationState) {
    return initializeSimulation();
  }
  return simulationState;
}

export function updateSimulation(): { vessels: Vessel[]; newAlerts: Alert[]; weather: WeatherCondition } {
  if (!simulationState) {
    initializeSimulation();
  }
  
  const state = simulationState!;
  const currentTime = Date.now();
  const realDeltaTime = (currentTime - lastUpdateTime) / 1000; // seconds
  const simulatedDeltaTime = realDeltaTime * state.simulationSpeed;
  lastUpdateTime = currentTime;
  
  const newAlerts: Alert[] = [];
  
  // Update weather periodically
  if (Math.random() < 0.1) {
    state.weather = updateWeather(state.weather);
  }
  
  // Update each vessel
  state.vessels.forEach((vessel, id) => {
    // Update position
    let updatedVessel = updateVesselPosition(vessel, simulatedDeltaTime);
    
    // Degrade equipment
    updatedVessel = {
      ...updatedVessel,
      equipment: updatedVessel.equipment.map((eq) => {
        // Check for sudden failure
        const failed = simulateEquipmentFailure(eq);
        if (failed) {
          return failed;
        }
        return degradeEquipment(eq, simulatedDeltaTime);
      }),
    };
    
    // Recalculate vessel health score
    const avgEquipmentHealth = updatedVessel.equipment.reduce((sum, e) => sum + e.healthScore, 0) / updatedVessel.equipment.length;
    updatedVessel.healthScore = Math.round(avgEquipmentHealth);
    
    // Update status based on health
    if (updatedVessel.healthScore < 30 && updatedVessel.status === 'operational') {
      updatedVessel.status = 'alert';
    } else if (updatedVessel.healthScore < 50 && updatedVessel.status === 'operational' && Math.random() > 0.95) {
      updatedVessel.status = 'maintenance';
    }
    
    // Update crew hours
    if (updatedVessel.status === 'operational') {
      updatedVessel.crew = {
        ...updatedVessel.crew,
        hoursOnDuty: Math.min(12, updatedVessel.crew.hoursOnDuty + simulatedDeltaTime / 3600),
      };
    }
    
    // Generate alerts
    const vesselAlerts = checkAndGenerateAlerts(updatedVessel, state.weather);
    newAlerts.push(...vesselAlerts);
    
    state.vessels.set(id, updatedVessel);
  });
  
  // Add new alerts to state (keep last 100)
  state.alerts = [...newAlerts, ...state.alerts].slice(0, 100);
  state.lastUpdate = new Date();
  
  return {
    vessels: Array.from(state.vessels.values()),
    newAlerts,
    weather: state.weather,
  };
}

export function getFleetMetrics(): FleetMetrics {
  const state = getSimulationState();
  const vessels = Array.from(state.vessels.values());
  
  const operationalVessels = vessels.filter((v) => v.status === 'operational');
  const maintenanceVessels = vessels.filter((v) => v.status === 'maintenance');
  const alertVessels = vessels.filter((v) => v.status === 'alert');
  
  const totalEmissions = vessels.reduce(
    (acc, v) => ({
      co2: acc.co2 + v.emissions.co2,
      nox: acc.nox + v.emissions.nox,
      sox: acc.sox + v.emissions.sox,
    }),
    { co2: 0, nox: 0, sox: 0 }
  );
  
  const activeAlerts = state.alerts.filter((a) => !a.resolved);
  const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');
  
  // Count upcoming maintenance (equipment with health < 60%)
  const upcomingMaintenance = vessels.reduce((count, v) => {
    const needsMaintenance = v.equipment.some((e) => e.healthScore < 60);
    return count + (needsMaintenance ? 1 : 0);
  }, 0);
  
  return {
    totalVessels: vessels.length,
    operationalVessels: operationalVessels.length,
    maintenanceVessels: maintenanceVessels.length,
    alertVessels: alertVessels.length,
    averageHealthScore: Math.round(vessels.reduce((sum, v) => sum + v.healthScore, 0) / vessels.length),
    averageFuelLevel: Math.round(vessels.reduce((sum, v) => sum + v.fuelLevel, 0) / vessels.length),
    totalEmissions: {
      co2: Math.round(totalEmissions.co2 * 10) / 10,
      nox: Math.round(totalEmissions.nox * 100) / 100,
      sox: Math.round(totalEmissions.sox * 1000) / 1000,
    },
    activeAlerts: activeAlerts.length,
    criticalAlerts: criticalAlerts.length,
    upcomingMaintenance,
  };
}

export function getVessel(id: string): Vessel | undefined {
  const state = getSimulationState();
  return state.vessels.get(id);
}

export function getVessels(): Vessel[] {
  const state = getSimulationState();
  return Array.from(state.vessels.values());
}

export function getAlerts(): Alert[] {
  const state = getSimulationState();
  return state.alerts;
}

export function getWeather(): WeatherCondition {
  const state = getSimulationState();
  return state.weather;
}

export function acknowledgeAlert(alertId: string): boolean {
  const state = getSimulationState();
  const alert = state.alerts.find((a) => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    return true;
  }
  return false;
}

export function resolveAlert(alertId: string): boolean {
  const state = getSimulationState();
  const alert = state.alerts.find((a) => a.id === alertId);
  if (alert) {
    alert.resolved = true;
    return true;
  }
  return false;
}

export function triggerScenario(scenario: 'storm' | 'equipment_failure' | 'fuel_crisis' | 'safety_incident'): void {
  const state = getSimulationState();
  
  switch (scenario) {
    case 'storm':
      state.weather = {
        windSpeed: 45,
        windDirection: 270,
        waveHeight: 5,
        visibility: 1.5,
        temperature: 28,
        condition: 'storm',
        severity: 'severe',
      };
      break;
      
    case 'equipment_failure':
      // Degrade equipment on random vessel
      const vessels = Array.from(state.vessels.values());
      const randomVessel = vessels[Math.floor(Math.random() * vessels.length)];
      if (randomVessel.equipment.length > 0) {
        randomVessel.equipment[0].healthScore = 15;
        randomVessel.equipment[0].temperature = 105;
        randomVessel.equipment[0].vibration = 12;
        randomVessel.status = 'alert';
      }
      break;
      
    case 'fuel_crisis':
      // Low fuel on multiple vessels
      const allVessels = Array.from(state.vessels.values());
      allVessels.slice(0, 3).forEach((v) => {
        v.fuelLevel = Math.random() * 15 + 5;
      });
      break;
      
    case 'safety_incident':
      // Increase crew fatigue
      const vesselList = Array.from(state.vessels.values());
      vesselList.slice(0, 2).forEach((v) => {
        v.crew.hoursOnDuty = 11;
        v.crew.safetyScore = 75;
      });
      break;
  }
}

