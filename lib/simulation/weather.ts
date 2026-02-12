// @ts-nocheck — legacy marine simulation
import { WeatherCondition } from '../types';

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

const WEATHER_CONDITIONS: WeatherCondition['condition'][] = ['clear', 'cloudy', 'rain', 'storm', 'fog'];

export function generateWeather(): WeatherCondition {
  // UAE has generally hot, clear weather but can have occasional storms
  const condition = Math.random() > 0.85 
    ? WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)]
    : 'clear';
  
  let windSpeed: number;
  let waveHeight: number;
  let visibility: number;
  let severity: WeatherCondition['severity'];
  
  switch (condition) {
    case 'storm':
      windSpeed = randomInRange(30, 50);
      waveHeight = randomInRange(3, 6);
      visibility = randomInRange(1, 3);
      severity = 'severe';
      break;
    case 'rain':
      windSpeed = randomInRange(15, 30);
      waveHeight = randomInRange(1.5, 3);
      visibility = randomInRange(3, 6);
      severity = 'warning';
      break;
    case 'fog':
      windSpeed = randomInRange(5, 15);
      waveHeight = randomInRange(0.5, 1.5);
      visibility = randomInRange(0.5, 2);
      severity = 'advisory';
      break;
    case 'cloudy':
      windSpeed = randomInRange(10, 20);
      waveHeight = randomInRange(0.5, 2);
      visibility = randomInRange(6, 10);
      severity = 'normal';
      break;
    default: // clear
      windSpeed = randomInRange(5, 15);
      waveHeight = randomInRange(0.3, 1);
      visibility = randomInRange(10, 20);
      severity = 'normal';
  }
  
  return {
    windSpeed: Math.round(windSpeed * 10) / 10,
    windDirection: Math.round(randomInRange(0, 360)),
    waveHeight: Math.round(waveHeight * 10) / 10,
    visibility: Math.round(visibility * 10) / 10,
    temperature: Math.round(randomInRange(28, 45)),
    condition,
    severity,
  };
}

export function updateWeather(current: WeatherCondition): WeatherCondition {
  // Weather changes gradually
  const changeChance = Math.random();
  
  if (changeChance < 0.05) {
    // 5% chance of significant weather change
    return generateWeather();
  }
  
  // Gradual changes
  const newWindSpeed = Math.max(0, current.windSpeed + randomInRange(-2, 2));
  const newWindDirection = (current.windDirection + randomInRange(-10, 10) + 360) % 360;
  const newWaveHeight = Math.max(0.1, current.waveHeight + randomInRange(-0.2, 0.2));
  const newVisibility = Math.max(0.5, Math.min(20, current.visibility + randomInRange(-0.5, 0.5)));
  const newTemperature = Math.max(20, Math.min(50, current.temperature + randomInRange(-1, 1)));
  
  // Determine severity based on conditions
  let severity: WeatherCondition['severity'] = 'normal';
  if (newWindSpeed > 40 || newWaveHeight > 4) {
    severity = 'severe';
  } else if (newWindSpeed > 25 || newWaveHeight > 2.5 || newVisibility < 3) {
    severity = 'warning';
  } else if (newWindSpeed > 15 || newWaveHeight > 1.5 || newVisibility < 5) {
    severity = 'advisory';
  }
  
  // Update condition based on values
  let condition = current.condition;
  if (severity === 'severe') {
    condition = 'storm';
  } else if (newVisibility < 2) {
    condition = 'fog';
  } else if (severity === 'warning' && Math.random() > 0.5) {
    condition = 'rain';
  } else if (severity === 'normal' && Math.random() > 0.7) {
    condition = 'clear';
  }
  
  return {
    windSpeed: Math.round(newWindSpeed * 10) / 10,
    windDirection: Math.round(newWindDirection),
    waveHeight: Math.round(newWaveHeight * 10) / 10,
    visibility: Math.round(newVisibility * 10) / 10,
    temperature: Math.round(newTemperature),
    condition,
    severity,
  };
}

export function getWeatherImpact(weather: WeatherCondition): {
  speedReduction: number;
  safetyRisk: number;
  operationalImpact: string;
} {
  switch (weather.severity) {
    case 'severe':
      return {
        speedReduction: 0.5,
        safetyRisk: 0.8,
        operationalImpact: 'Operations should be suspended. All vessels to seek safe harbor.',
      };
    case 'warning':
      return {
        speedReduction: 0.3,
        safetyRisk: 0.5,
        operationalImpact: 'Reduced operations. Non-essential activities postponed.',
      };
    case 'advisory':
      return {
        speedReduction: 0.15,
        safetyRisk: 0.25,
        operationalImpact: 'Proceed with caution. Enhanced monitoring required.',
      };
    default:
      return {
        speedReduction: 0,
        safetyRisk: 0.05,
        operationalImpact: 'Normal operations. All activities proceed as planned.',
      };
  }
}

