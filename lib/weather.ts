// Weather utilities for location-based weather data

export interface LocalWeather {
  temperature: number;
  windSpeed: number;
  windDirection: string;
  waveHeight: number;
  visibility: number;
  condition: string;
  zone: string;
  operationalRisk: 'low' | 'medium' | 'high';
}

// Define weather zones in the UAE/Persian Gulf region
const weatherZones: { name: string; lat: number; lng: number; radius: number }[] = [
  { name: 'Abu Dhabi Offshore', lat: 24.5, lng: 54.0, radius: 0.5 },
  { name: 'Dubai Channel', lat: 25.2, lng: 55.1, radius: 0.3 },
  { name: 'Fujairah Waters', lat: 25.1, lng: 56.3, radius: 0.4 },
  { name: 'Das Island', lat: 25.15, lng: 52.87, radius: 0.3 },
  { name: 'Ruwais Terminal', lat: 24.1, lng: 52.7, radius: 0.3 },
  { name: 'Khalifa Port', lat: 24.8, lng: 54.6, radius: 0.2 },
  { name: 'Open Gulf', lat: 24.8, lng: 53.5, radius: 1.0 },
];

const windDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const conditions = ['clear', 'partly_cloudy', 'cloudy', 'hazy', 'windy', 'rough'];

// Get weather for a specific location
export function getWeatherAtLocation(lat: number, lng: number): LocalWeather {
  // Find closest zone
  let closestZone = weatherZones[weatherZones.length - 1]; // Default to Open Gulf
  let minDistance = Infinity;

  for (const zone of weatherZones) {
    const distance = Math.sqrt(
      Math.pow(lat - zone.lat, 2) + Math.pow(lng - zone.lng, 2)
    );
    if (distance < minDistance && distance < zone.radius) {
      minDistance = distance;
      closestZone = zone;
    }
  }

  // Generate semi-random but consistent weather based on location
  const seed = Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453;
  const random = (offset: number) => {
    const val = Math.sin(seed + offset) * 43758.5453;
    return val - Math.floor(val);
  };

  const windSpeed = 5 + random(1) * 20; // 5-25 knots
  const waveHeight = 0.3 + random(2) * 2.5; // 0.3-2.8m
  const temperature = 28 + random(3) * 12; // 28-40°C
  const visibility = 5 + random(4) * 15; // 5-20 nm
  const windDir = windDirections[Math.floor(random(5) * 8)];
  const condition = conditions[Math.floor(random(6) * conditions.length)];

  // Calculate operational risk
  let risk: 'low' | 'medium' | 'high' = 'low';
  if (windSpeed > 20 || waveHeight > 2.0) {
    risk = 'high';
  } else if (windSpeed > 15 || waveHeight > 1.5) {
    risk = 'medium';
  }

  return {
    temperature: Math.round(temperature),
    windSpeed: Math.round(windSpeed),
    windDirection: windDir,
    waveHeight: Math.round(waveHeight * 10) / 10,
    visibility: Math.round(visibility),
    condition,
    zone: closestZone.name,
    operationalRisk: risk,
  };
}

// Get weather icon emoji based on condition
export function getWeatherIcon(condition: string): string {
  const icons: Record<string, string> = {
    clear: '☀️',
    partly_cloudy: '⛅',
    cloudy: '☁️',
    hazy: '🌫️',
    windy: '💨',
    rough: '🌊',
    storm: '⛈️',
    rain: '🌧️',
  };
  return icons[condition] || '🌤️';
}

// Get risk color
export function getRiskColor(risk: 'low' | 'medium' | 'high'): string {
  const colors = {
    low: '#22c55e',    // green-500
    medium: '#f59e0b', // amber-500
    high: '#ef4444',   // red-500
  };
  return colors[risk];
}

// Get sea state description based on wave height (Douglas scale)
export function getSeaStateDescription(waveHeight: number): string {
  if (waveHeight < 0.1) return 'Calm (glassy)';
  if (waveHeight < 0.5) return 'Calm (rippled)';
  if (waveHeight < 1.25) return 'Smooth';
  if (waveHeight < 2.5) return 'Slight';
  if (waveHeight < 4.0) return 'Moderate';
  if (waveHeight < 6.0) return 'Rough';
  if (waveHeight < 9.0) return 'Very rough';
  if (waveHeight < 14.0) return 'High';
  return 'Phenomenal';
}
