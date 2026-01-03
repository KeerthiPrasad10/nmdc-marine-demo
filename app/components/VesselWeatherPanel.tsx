'use client';

import { Vessel } from '@/lib/supabase';
import { getWeatherAtLocation, getWeatherIcon, getRiskColor, getSeaStateDescription, LocalWeather } from '@/lib/weather';
import { 
  Wind, 
  Waves, 
  Eye, 
  Thermometer, 
  Navigation,
  AlertTriangle,
  CheckCircle,
  Clock,
  Route,
  Anchor,
} from 'lucide-react';
import { useMemo } from 'react';

interface VesselWeatherPanelProps {
  vessel: Vessel;
}

// Derive sea state from wave height
function getSeaState(waveHeight: number): string {
  if (waveHeight < 0.5) return 'calm';
  if (waveHeight < 1.0) return 'slight';
  if (waveHeight < 2.0) return 'moderate';
  if (waveHeight < 3.0) return 'rough';
  return 'very_rough';
}

// Generate a simple 24-hour forecast for the vessel's location
function generateForecast(lat: number, lng: number): LocalWeather[] {
  const forecast: LocalWeather[] = [];
  const now = new Date();
  
  for (let i = 0; i < 8; i++) {
    // Simulate weather changes over time with some consistency
    const offsetLat = lat + (Math.random() - 0.5) * 0.01;
    const offsetLng = lng + (Math.random() - 0.5) * 0.01;
    forecast.push(getWeatherAtLocation(offsetLat, offsetLng));
  }
  
  return forecast;
}

// Generate route optimization suggestions based on weather
function getRouteOptimizations(vessel: Vessel, weather: LocalWeather): string[] {
  const suggestions: string[] = [];
  
  if (weather.waveHeight > 1.5) {
    suggestions.push(`Consider reducing speed from ${vessel.speed?.toFixed(1)} kn to ${Math.max(4, (vessel.speed || 8) * 0.7).toFixed(1)} kn to improve fuel efficiency in rough seas`);
  }
  
  if (weather.windSpeed > 20) {
    const windDir = weather.windDirection;
    suggestions.push(`Strong ${windDir} winds detected. Adjust heading to minimize beam exposure`);
  }
  
  if (weather.visibility < 5) {
    suggestions.push('Reduced visibility - activate fog signals and reduce speed');
  }
  
  if (weather.operationalRisk === 'high') {
    suggestions.push('Weather conditions unfavorable. Consider sheltering at nearest port');
  }
  
  if (weather.waveHeight < 0.5 && vessel.speed && vessel.speed < 8) {
    suggestions.push('Calm conditions - optimal for increasing speed to make up schedule');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Current route is optimal for present conditions');
  }
  
  return suggestions;
}

export function VesselWeatherPanel({ vessel }: VesselWeatherPanelProps) {
  const weather = useMemo(() => 
    getWeatherAtLocation(vessel.position_lat, vessel.position_lng), 
    [vessel.position_lat, vessel.position_lng]
  );
  
  const forecast = useMemo(() => 
    generateForecast(vessel.position_lat, vessel.position_lng),
    [vessel.position_lat, vessel.position_lng]
  );
  
  const optimizations = useMemo(() => 
    getRouteOptimizations(vessel, weather),
    [vessel, weather]
  );

  const riskColor = getRiskColor(weather.operationalRisk);
  const weatherIcon = getWeatherIcon(weather.condition);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Vessel Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <Anchor className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">{vessel.name}</h3>
          <p className="text-xs text-white/50">{weather.zone}</p>
        </div>
      </div>

      {/* Current Conditions */}
      <div className="glass-panel p-4">
        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          Current Conditions
        </h4>
        
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{weatherIcon}</span>
          <div>
            <div className="text-2xl font-bold text-white">{weather.temperature}°C</div>
            <div className="text-sm text-white/60 capitalize">
              {weather.condition.replace('_', ' ')}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div 
              className="text-sm font-semibold uppercase"
              style={{ color: riskColor }}
            >
              {weather.operationalRisk} Risk
            </div>
            <div className="text-xs text-white/50">
              {getSeaStateDescription(weather.waveHeight)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Wind className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-xs text-white/50">Wind</div>
              <div className="text-sm text-white font-medium">
                {weather.windSpeed} kt {weather.windDirection}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Waves className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-xs text-white/50">Waves</div>
              <div className="text-sm text-white font-medium">
                {weather.waveHeight}m
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Eye className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-xs text-white/50">Visibility</div>
              <div className="text-sm text-white font-medium">
                {weather.visibility} km
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Navigation className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-xs text-white/50">Sea State</div>
              <div className="text-sm text-white font-medium capitalize">
                {getSeaState(weather.waveHeight).replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour Forecast */}
      <div className="glass-panel p-4">
        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          24-Hour Forecast
        </h4>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {forecast.map((f, i) => (
            <div 
              key={i}
              className="flex-shrink-0 w-14 p-2 rounded-lg bg-white/5 text-center"
            >
              <div className="text-xs text-white/50 mb-1">
                {i === 0 ? 'Now' : `+${i * 3}h`}
              </div>
              <div className="text-lg mb-1">{getWeatherIcon(f.condition)}</div>
              <div className="text-xs text-white font-medium">{f.temperature}°</div>
              <div className="text-[10px] text-white/50">{f.waveHeight}m</div>
            </div>
          ))}
        </div>
      </div>

      {/* Route Optimizations */}
      <div className="glass-panel p-4">
        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Route className="w-3.5 h-3.5" />
          Route Optimization
        </h4>
        
        <div className="space-y-2">
          {optimizations.map((opt, i) => (
            <div 
              key={i}
              className="flex items-start gap-2 p-2 rounded-lg bg-white/5"
            >
              {opt.includes('optimal') || opt.includes('Calm') ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              )}
              <span className="text-sm text-white/80">{opt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vessel Stats */}
      <div className="glass-panel p-4">
        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          Vessel Status
        </h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">Current Speed</span>
            <span className="text-white font-medium">{vessel.speed?.toFixed(1) ?? 0} kn</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Heading</span>
            <span className="text-white font-medium">{vessel.heading?.toFixed(0) ?? 0}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Fuel Level</span>
            <span className={`font-medium ${(vessel.fuel_level ?? 100) < 30 ? 'text-rose-400' : 'text-white'}`}>
              {vessel.fuel_level?.toFixed(0) ?? 100}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Health Score</span>
            <span className={`font-medium ${(vessel.health_score ?? 100) < 70 ? 'text-amber-400' : 'text-white'}`}>
              {vessel.health_score ?? 100}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Position</span>
            <span className="text-white font-mono text-xs">
              {vessel.position_lat.toFixed(4)}°N, {vessel.position_lng.toFixed(4)}°E
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

