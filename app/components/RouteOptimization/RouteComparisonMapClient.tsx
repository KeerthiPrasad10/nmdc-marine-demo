'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteOptimizationResult } from '@/lib/route-optimization/types';

interface RouteComparisonMapClientProps {
  result: RouteOptimizationResult;
  showOriginal?: boolean;
  showOptimized?: boolean;
  showWeatherZones?: boolean;
  height?: string;
}

export function RouteComparisonMapClient({
  result,
  showOriginal = true,
  showOptimized = true,
  showWeatherZones = true,
  height = '400px',
}: RouteComparisonMapClientProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Calculate bounds
    const allPoints = [
      result.origin,
      result.destination,
      ...result.originalRoute.waypoints,
      ...result.optimizedRoute.waypoints,
    ];

    const bounds = L.latLngBounds(allPoints.map(p => [p.lat, p.lng]));

    // Create map
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    });

    // Add dark base tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);
    
    // Add OpenSeaMap nautical overlay for sea marks and navigation aids
    L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
      maxZoom: 18,
      opacity: 0.8,
    }).addTo(map);

    // Fit to bounds with padding
    map.fitBounds(bounds, { padding: [50, 50] });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [result]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Clear existing layers (except tile layer)
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Add weather zones
    if (showWeatherZones && result.weatherZonesAvoided.length > 0) {
      result.weatherZonesAvoided.forEach((zone) => {
        const color = zone.severity === 'severe' ? '#ef4444' : 
                      zone.severity === 'moderate' ? '#fbbf24' : '#9ca3af';
        
        L.circle([zone.center.lat, zone.center.lng], {
          radius: zone.radiusNm * 1852, // Convert nm to meters
          color: color,
          fillColor: color,
          fillOpacity: 0.2,
          weight: 2,
          dashArray: '5, 5',
        }).addTo(map).bindPopup(`
          <div style="color: #000; font-size: 12px;">
            <strong>${zone.name || zone.type}</strong><br/>
            ${zone.severity.toUpperCase()}<br/>
            ${zone.windSpeedKnots ? `Wind: ${zone.windSpeedKnots} knots` : ''}<br/>
            ${zone.waveHeightM ? `Waves: ${zone.waveHeightM}m` : ''}
          </div>
        `);
      });
    }

    // Add original route (dashed red line)
    if (showOriginal) {
      const originalCoords = result.originalRoute.waypoints.map(wp => 
        [wp.lat, wp.lng] as [number, number]
      );

      L.polyline(originalCoords, {
        color: '#ef4444',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10',
      }).addTo(map);
    }

    // Add optimized route (solid green line)
    if (showOptimized) {
      const optimizedCoords = result.optimizedRoute.waypoints.map(wp => 
        [wp.lat, wp.lng] as [number, number]
      );

      L.polyline(optimizedCoords, {
        color: '#10b981',
        weight: 4,
        opacity: 0.9,
      }).addTo(map);

      // Add waypoint markers
      result.optimizedRoute.waypoints.forEach((wp, index) => {
        const isOrigin = wp.type === 'origin';
        const isDestination = wp.type === 'destination';
        const isAvoidance = wp.type === 'weather_avoidance';

        const color = isOrigin ? '#3b82f6' : 
                      isDestination ? '#8b5cf6' :
                      isAvoidance ? '#10b981' : '#ffffff';

        const radius = (isOrigin || isDestination) ? 10 : 7;

        L.circleMarker([wp.lat, wp.lng], {
          radius,
          color: '#ffffff',
          fillColor: color,
          fillOpacity: 1,
          weight: 2,
        }).addTo(map).bindPopup(`
          <div style="color: #000; font-size: 12px;">
            <strong>${wp.name || `Waypoint ${index + 1}`}</strong><br/>
            ${wp.lat.toFixed(4)}°N, ${wp.lng.toFixed(4)}°E
            ${wp.notes ? `<br/><em>${wp.notes}</em>` : ''}
          </div>
        `);
      });
    }

  }, [result, showOriginal, showOptimized, showWeatherZones]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10">
      <div ref={mapContainerRef} style={{ height }} />
      
      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-white/10 z-[1000]">
        <div className="text-[10px] uppercase tracking-wider text-white/50 mb-2">Route Legend</div>
        <div className="space-y-1.5">
          {showOriginal && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 border-t-2 border-dashed border-rose-500" />
              <span className="text-xs text-white/70">Original (Direct)</span>
            </div>
          )}
          {showOptimized && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-emerald-500 rounded" />
              <span className="text-xs text-white/70">Optimized</span>
            </div>
          )}
          {showWeatherZones && result.weatherZonesAvoided.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-rose-500/30 border-2 border-dashed border-rose-500" />
              <span className="text-xs text-white/70">Weather Hazard</span>
            </div>
          )}
        </div>
      </div>

      {/* Vessel info */}
      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10 z-[1000]">
        <div className="text-xs font-medium text-white">{result.vessel.name}</div>
        <div className="text-[10px] text-white/50">{result.vessel.type} • {result.vessel.speed} knots</div>
      </div>
    </div>
  );
}

