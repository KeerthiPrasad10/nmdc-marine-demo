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

// Define weather zones in the Puget Sound / WA State Ferries region
const weatherZones: { name: string; lat: number; lng: number; radius: number }[] = [
  { name: 'Elliott Bay', lat: 47.602, lng: -122.339, radius: 0.15 },
  { name: 'Bainbridge Passage', lat: 47.618, lng: -122.465, radius: 0.2 },
  { name: 'Rich Passage', lat: 47.56, lng: -122.55, radius: 0.15 },
  { name: 'Admiralty Inlet', lat: 48.15, lng: -122.75, radius: 0.3 },
  { name: 'San Juan Channel', lat: 48.53, lng: -122.9, radius: 0.3 },
  { name: 'Rosario Strait', lat: 48.45, lng: -122.75, radius: 0.25 },
  { name: 'Central Puget Sound', lat: 47.65, lng: -122.45, radius: 0.5 },
  { name: 'South Puget Sound', lat: 47.3, lng: -122.5, radius: 0.3 },
  { name: 'Mukilteo Channel', lat: 47.95, lng: -122.32, radius: 0.15 },
  { name: 'Open Puget Sound', lat: 47.75, lng: -122.45, radius: 1.5 },
];

const windDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const conditions = ['clear', 'partly_cloudy', 'cloudy', 'rain', 'windy', 'rough', 'hazy'];

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

  const windSpeed = 3 + random(1) * 18; // 3-21 knots
  const waveHeight = 0.2 + random(2) * 1.8; // 0.2-2.0m
  const temperature = 5 + random(3) * 10; // 5-15°C (Pacific NW winter)
  const visibility = 3 + random(4) * 17; // 3-20 nm
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
