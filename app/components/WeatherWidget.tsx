'use client';

import { Weather } from '@/lib/supabase';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudFog,
  Wind,
  Waves,
  Eye,
  Thermometer,
  Navigation,
} from 'lucide-react';

interface WeatherWidgetProps {
  weather: Weather | null;
}

const conditionIcons = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  fog: CloudFog,
};

const severityColors = {
  normal: 'text-emerald-400',
  advisory: 'text-indigo-300',
  warning: 'text-amber-400',
  severe: 'text-rose-400',
};

const severityBg = {
  normal: 'bg-emerald-500/10 border-emerald-500/20',
  advisory: 'bg-indigo-500/10 border-indigo-500/20',
  warning: 'bg-amber-500/10 border-amber-500/20',
  severe: 'bg-rose-500/10 border-rose-500/20',
};

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  if (!weather) {
    return (
      <div className="glass-panel p-4">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-white/5 rounded skeleton" />
          <div className="h-10 w-16 bg-white/5 rounded skeleton" />
          <div className="h-3 w-32 bg-white/5 rounded skeleton" />
        </div>
      </div>
    );
  }

  const Icon = conditionIcons[weather.condition || 'clear'];
  const severityColor = severityColors[weather.severity || 'normal'];
  const severityBgClass = severityBg[weather.severity || 'normal'];

  return (
    <div className={`glass-panel ${severityBgClass} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`h-8 w-8 ${severityColor}`} />
          <div>
            <h3 className="font-semibold text-white capitalize">
              {weather.condition || 'Clear'}
            </h3>
            <p className={`text-xs font-medium ${severityColor} uppercase`}>
              {weather.severity || 'Normal'} Conditions
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-2xl font-bold text-white">
            <Thermometer className="h-5 w-5 text-white/40" />
            {weather.temperature ?? 30}°C
          </div>
        </div>
      </div>

      {/* Weather Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
          <Wind className="h-4 w-4 text-primary-400" />
          <div>
            <p className="text-xs text-white/40">Wind</p>
            <p className="text-sm font-medium text-white/85">
              {weather.wind_speed ?? 0} kn {getWindDirection(weather.wind_direction ?? 0)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
          <Waves className="h-4 w-4 text-sky-300" />
          <div>
            <p className="text-xs text-white/40">Waves</p>
            <p className="text-sm font-medium text-white/85">{weather.wave_height ?? 0}m</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
          <Eye className="h-4 w-4 text-white/40" />
          <div>
            <p className="text-xs text-white/40">Visibility</p>
            <p className="text-sm font-medium text-white/85">{weather.visibility ?? 10} nm</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
          <Navigation
            className="h-4 w-4 text-white/40"
            style={{ transform: `rotate(${weather.wind_direction ?? 0}deg)` }}
          />
          <div>
            <p className="text-xs text-white/40">Direction</p>
            <p className="text-sm font-medium text-white/85">{weather.wind_direction ?? 0}°</p>
          </div>
        </div>
      </div>

      {/* Updated timestamp */}
      <p className="mt-3 text-xs text-white/35 text-center">
        Updated {new Date(weather.updated_at!).toLocaleTimeString()}
      </p>
    </div>
  );
}
