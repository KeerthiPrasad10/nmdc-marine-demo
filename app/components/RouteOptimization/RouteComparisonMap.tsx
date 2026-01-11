'use client';

import { useEffect, useState } from 'react';
import { RouteOptimizationResult } from '@/lib/route-optimization/types';

interface RouteComparisonMapProps {
  result: RouteOptimizationResult;
  showOriginal?: boolean;
  showOptimized?: boolean;
  showWeatherZones?: boolean;
  height?: string;
}

// Dynamic import wrapper to avoid SSR issues with Leaflet
export function RouteComparisonMap(props: RouteComparisonMapProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<RouteComparisonMapProps> | null>(null);

  useEffect(() => {
    import('./RouteComparisonMapClient').then((mod) => {
      setMapComponent(() => mod.RouteComparisonMapClient);
    });
  }, []);

  if (!MapComponent) {
    return (
      <div 
        className="w-full flex items-center justify-center bg-slate-900 rounded-xl border border-white/10"
        style={{ height: props.height || '400px' }}
      >
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/40 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return <MapComponent {...props} />;
}
