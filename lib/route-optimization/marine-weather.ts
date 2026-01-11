// @ts-nocheck - Weather data with dynamic severity types
/**
 * Real Marine Weather Data from Open-Meteo API
 * https://open-meteo.com/en/docs/marine-weather-api
 * 
 * FREE API - No API key required!
 */

import { WeatherZone } from './types';
import { calculateDistanceNm, calculateBearing, calculateDestinationPoint } from './optimizer';

interface MarineWeatherPoint {
  lat: number;
  lng: number;
  waveHeight: number;        // meters
  waveDirection: number;     // degrees
  wavePeriod: number;        // seconds
  windWaveHeight: number;    // meters
  swellHeight: number;       // meters
  swellDirection: number;    // degrees
  seaSurfaceTemp?: number;   // celsius
}

interface OpenMeteoMarineResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    wave_height: (number | null)[];
    wave_direction: (number | null)[];
    wave_period: (number | null)[];
    wind_wave_height: (number | null)[];
    swell_wave_height: (number | null)[];
    swell_wave_direction: (number | null)[];
  };
}

/**
 * Fetch marine weather for a single point
 */
async function fetchMarineWeather(lat: number, lng: number): Promise<MarineWeatherPoint | null> {
  try {
    const url = new URL('https://marine-api.open-meteo.com/v1/marine');
    url.searchParams.set('latitude', lat.toFixed(4));
    url.searchParams.set('longitude', lng.toFixed(4));
    url.searchParams.set('hourly', 'wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height,swell_wave_direction');
    url.searchParams.set('forecast_days', '1');
    
    const response = await fetch(url.toString(), {
      next: { revalidate: 1800 } // Cache for 30 minutes
    });
    
    if (!response.ok) {
      console.error(`[Marine Weather] API error: ${response.status}`);
      return null;
    }
    
    const data: OpenMeteoMarineResponse = await response.json();
    
    // Get current hour's data (first entry is closest to now)
    const currentHourIndex = 0;
    
    return {
      lat: data.latitude,
      lng: data.longitude,
      waveHeight: data.hourly.wave_height[currentHourIndex] ?? 0,
      waveDirection: data.hourly.wave_direction[currentHourIndex] ?? 0,
      wavePeriod: data.hourly.wave_period[currentHourIndex] ?? 0,
      windWaveHeight: data.hourly.wind_wave_height[currentHourIndex] ?? 0,
      swellHeight: data.hourly.swell_wave_height[currentHourIndex] ?? 0,
      swellDirection: data.hourly.swell_wave_direction[currentHourIndex] ?? 0,
    };
  } catch (error) {
    console.error('[Marine Weather] Fetch error:', error);
    return null;
  }
}

/**
 * Determine severity based on wave conditions
 * Based on Douglas Sea Scale and maritime safety guidelines
 */
function determineSeverity(waveHeight: number, windWaveHeight: number): 'minor' | 'moderate' | 'severe' {
  const totalWaveHeight = Math.max(waveHeight, windWaveHeight);
  
  if (totalWaveHeight >= 4.0) return 'severe';      // Very rough seas
  if (totalWaveHeight >= 2.5) return 'moderate';    // Moderate to rough
  return 'minor';                                    // Slight to smooth
}

/**
 * Determine if conditions require avoidance
 */
function getAvoidanceRecommendation(
  waveHeight: number, 
  severity: 'minor' | 'moderate' | 'severe'
): 'mandatory' | 'recommended' | 'optional' {
  if (severity === 'severe') return 'mandatory';
  if (severity === 'moderate') return 'recommended';
  return 'optional';
}

/**
 * Sample points along the route and identify hazardous areas
 */
export async function fetchRealWeatherZones(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  samplePoints: number = 5
): Promise<WeatherZone[]> {
  const zones: WeatherZone[] = [];
  const now = new Date();
  
  // Calculate route details
  const totalDistance = calculateDistanceNm(origin, destination);
  const bearing = calculateBearing(origin, destination);
  
  // Don't bother for very short routes
  if (totalDistance < 20) {
    return zones;
  }
  
  // Sample points along the route
  const samplePromises: Promise<{ point: { lat: number; lng: number }; weather: MarineWeatherPoint | null }>[] = [];
  
  for (let i = 1; i <= samplePoints; i++) {
    const fraction = i / (samplePoints + 1);
    const distanceNm = totalDistance * fraction;
    const point = calculateDestinationPoint(origin, distanceNm, bearing);
    
    samplePromises.push(
      fetchMarineWeather(point.lat, point.lng).then(weather => ({ point, weather }))
    );
  }
  
  const samples = await Promise.all(samplePromises);
  
  // Analyze samples for hazardous conditions
  for (const { point, weather } of samples) {
    if (!weather) continue;
    
    const severity = determineSeverity(weather.waveHeight, weather.windWaveHeight);
    
    // Only create zones for moderate or severe conditions
    if (severity === 'minor') continue;
    
    const zone: WeatherZone = {
      id: `weather-${point.lat.toFixed(2)}-${point.lng.toFixed(2)}`,
      type: severity === 'severe' ? 'storm' : 'high_wind',
      severity,
      center: point,
      radiusNm: severity === 'severe' ? 15 : 10,
      windSpeedKnots: Math.round(weather.waveHeight * 10), // Rough estimate
      waveHeightM: weather.waveHeight,
      validFrom: now,
      validTo: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      name: severity === 'severe' 
        ? `High Seas Warning (${weather.waveHeight.toFixed(1)}m waves)`
        : `Wave Advisory (${weather.waveHeight.toFixed(1)}m)`,
      avoidanceRecommendation: getAvoidanceRecommendation(weather.waveHeight, severity),
    };
    
    zones.push(zone);
  }
  
  // Merge nearby zones
  return mergeNearbyZones(zones);
}

/**
 * Merge zones that are close together
 */
function mergeNearbyZones(zones: WeatherZone[]): WeatherZone[] {
  if (zones.length <= 1) return zones;
  
  const merged: WeatherZone[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < zones.length; i++) {
    if (used.has(i)) continue;
    
    let zone = { ...zones[i] };
    
    for (let j = i + 1; j < zones.length; j++) {
      if (used.has(j)) continue;
      
      const distance = calculateDistanceNm(zone.center, zones[j].center);
      
      // Merge if zones overlap
      if (distance < zone.radiusNm + zones[j].radiusNm) {
        // Take the more severe zone's properties
        if (zones[j].severity === 'severe' || 
            (zones[j].severity === 'moderate' && zone.severity === 'minor')) {
          zone = {
            ...zone,
            severity: zones[j].severity,
            type: zones[j].type,
            name: zones[j].name,
            waveHeightM: Math.max(zone.waveHeightM || 0, zones[j].waveHeightM || 0),
          };
        }
        
        // Expand radius to cover both
        zone.radiusNm = Math.max(zone.radiusNm, distance + zones[j].radiusNm);
        
        // Center between the two
        zone.center = {
          lat: (zone.center.lat + zones[j].center.lat) / 2,
          lng: (zone.center.lng + zones[j].center.lng) / 2,
        };
        
        used.add(j);
      }
    }
    
    merged.push(zone);
  }
  
  return merged;
}

/**
 * Get a weather summary for display
 */
export async function getRouteWeatherSummary(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{
  maxWaveHeight: number;
  avgWaveHeight: number;
  overallRisk: 'low' | 'medium' | 'high';
  hazardCount: number;
}> {
  const zones = await fetchRealWeatherZones(origin, destination);
  
  const waveHeights = zones.map(z => z.waveHeightM || 0);
  const maxWaveHeight = waveHeights.length > 0 ? Math.max(...waveHeights) : 0;
  const avgWaveHeight = waveHeights.length > 0 
    ? waveHeights.reduce((a, b) => a + b, 0) / waveHeights.length 
    : 0;
  
  let overallRisk: 'low' | 'medium' | 'high' = 'low';
  if (zones.some(z => z.severity === 'severe')) {
    overallRisk = 'high';
  } else if (zones.some(z => z.severity === 'moderate')) {
    overallRisk = 'medium';
  }
  
  return {
    maxWaveHeight,
    avgWaveHeight,
    overallRisk,
    hazardCount: zones.length,
  };
}

