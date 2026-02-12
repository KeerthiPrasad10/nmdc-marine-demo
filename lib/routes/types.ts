// Route Optimization Types

export interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'origin' | 'destination' | 'waypoint' | 'port' | 'avoid';
}

export interface RouteSegment {
  from: Waypoint;
  to: Waypoint;
  distance: number; // nautical miles
  bearing: number; // degrees
  estimatedTime: number; // hours
  fuelConsumption: number; // liters
  weatherRisk: number; // 0-100
}

export interface Route {
  id: string;
  name: string;
  vesselId: string;
  vesselName: string;
  origin: Waypoint;
  destination: Waypoint;
  waypoints: Waypoint[];
  segments: RouteSegment[];
  totalDistance: number;
  estimatedTime: number;
  fuelConsumption: number;
  emissions: {
    co2: number;
    nox: number;
    sox: number;
  };
  averageSpeed: number;
  weatherRisk: number;
  cost: number;
  createdAt: Date;
  status: 'planned' | 'active' | 'completed';
}

export interface RouteOptimizationRequest {
  vesselId: string;
  origin: { lat: number; lng: number; name?: string };
  destination: { lat: number; lng: number; name?: string };
  priorities: {
    time: number; // 0-100
    fuel: number; // 0-100
    cost: number; // 0-100
    emissions: number; // 0-100
    safety: number; // 0-100
  };
  constraints: {
    maxSpeed?: number;
    minSpeed?: number;
    avoidAreas?: Array<{ lat: number; lng: number; radius: number }>;
    requiredWaypoints?: Waypoint[];
    deadline?: Date;
  };
}

export interface RouteOptimizationResult {
  recommendedRoute: Route;
  alternatives: Route[];
  comparison: {
    vsDirectRoute: {
      distanceDiff: number;
      timeDiff: number;
      fuelSavings: number;
      emissionsSavings: number;
    };
    vsCurrentRoute?: {
      distanceDiff: number;
      timeDiff: number;
      fuelSavings: number;
      emissionsSavings: number;
    };
  };
  weatherForecast: WeatherPoint[];
  riskAssessment: {
    overallRisk: number;
    factors: Array<{
      factor: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
  };
}

export interface WeatherPoint {
  lat: number;
  lng: number;
  time: Date;
  windSpeed: number;
  windDirection: number;
  waveHeight: number;
  visibility: number;
  condition: 'clear' | 'cloudy' | 'rain' | 'storm';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface FuelCalculation {
  baseConsumption: number; // L/hr at cruising speed
  adjustedConsumption: number; // L/hr with weather/load factors
  totalFuel: number;
  costPerLiter: number;
  totalCost: number;
}















