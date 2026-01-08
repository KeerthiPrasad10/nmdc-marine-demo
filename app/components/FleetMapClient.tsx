'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Vessel } from '@/lib/supabase';
import { getWeatherAtLocation, getWeatherIcon, getRiskColor } from '@/lib/weather';

interface PlannedRoute {
  vesselId: string;
  waypoints: Array<{ lat: number; lng: number }>;
  origin: { lat: number; lng: number; name?: string };
  destination: { lat: number; lng: number; name?: string };
}

interface FleetMapClientProps {
  vessels: Vessel[];
  selectedVessel: string | null;
  onSelectVessel: (id: string | null) => void;
  plannedRoutes?: PlannedRoute[];
  onPlanRoute?: (vesselId: string) => void;
}

// Mapbox token from environment
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Maximum points to keep in route history
const MAX_ROUTE_POINTS = 50;

const vesselColors: Record<string, string> = {
  tugboat: '#34d399',      // emerald-400
  supply_vessel: '#60a5fa', // blue-400
  crane_barge: '#fbbf24',   // amber-400
  dredger: '#a78bfa',       // violet-400
  survey_vessel: '#f472b6', // pink-400
};

const statusColors: Record<string, string> = {
  operational: '#22c55e',   // green-500
  maintenance: '#f59e0b',   // amber-500
  idle: '#6b7280',          // gray-500
  alert: '#ef4444',         // red-500
};

// SVG icons for different vessel types - these look like actual ships
const vesselSVGs: Record<string, string> = {
  tugboat: `<svg viewBox="0 0 32 32" fill="currentColor">
    <path d="M6 20l2-8h16l2 8H6z" opacity="0.9"/>
    <path d="M10 12V8h4v4h-4z" opacity="0.8"/>
    <path d="M4 20c0 2 2 4 12 4s12-2 12-4H4z"/>
    <circle cx="16" cy="22" r="1.5" fill="white" opacity="0.6"/>
  </svg>`,
  
  supply_vessel: `<svg viewBox="0 0 32 32" fill="currentColor">
    <path d="M4 18l3-10h18l3 10H4z" opacity="0.9"/>
    <rect x="12" y="8" width="8" height="6" rx="1" opacity="0.8"/>
    <path d="M2 18c0 3 3 6 14 6s14-3 14-6H2z"/>
    <rect x="8" y="14" width="4" height="3" fill="white" opacity="0.4"/>
    <rect x="20" y="14" width="4" height="3" fill="white" opacity="0.4"/>
  </svg>`,
  
  crane_barge: `<svg viewBox="0 0 32 32" fill="currentColor">
    <path d="M2 20l2-6h24l2 6H2z" opacity="0.9"/>
    <path d="M2 20c0 2 3 4 14 4s14-2 14-4H2z"/>
    <path d="M20 14V4l6 10h-6z" opacity="0.8"/>
    <rect x="18" y="6" width="4" height="8" opacity="0.7"/>
    <line x1="20" y1="4" x2="8" y2="10" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,
  
  dredger: `<svg viewBox="0 0 32 32" fill="currentColor">
    <path d="M4 18l2-8h20l2 8H4z" opacity="0.9"/>
    <path d="M2 18c0 3 3 6 14 6s14-3 14-6H2z"/>
    <rect x="8" y="10" width="6" height="5" rx="1" opacity="0.8"/>
    <path d="M22 10l4-6v12l-4-6z" opacity="0.7"/>
    <circle cx="24" cy="10" r="2" fill="white" opacity="0.5"/>
  </svg>`,
  
  survey_vessel: `<svg viewBox="0 0 32 32" fill="currentColor">
    <path d="M6 18l2-8h16l2 8H6z" opacity="0.9"/>
    <path d="M4 18c0 3 2 6 12 6s12-3 12-6H4z"/>
    <rect x="13" y="6" width="6" height="8" rx="1" opacity="0.8"/>
    <circle cx="16" cy="4" r="2" opacity="0.7"/>
    <line x1="16" y1="6" x2="16" y2="2" stroke="currentColor" stroke-width="1"/>
    <rect x="8" y="12" width="3" height="4" fill="white" opacity="0.4"/>
    <rect x="21" y="12" width="3" height="4" fill="white" opacity="0.4"/>
  </svg>`,
};

function createVesselIcon(vessel: Vessel, isSelected: boolean): L.DivIcon {
  const color = vesselColors[vessel.type] || '#60a5fa';
  const statusColor = statusColors[vessel.status || 'operational'];
  const size = isSelected ? 44 : 32;
  const rotation = vessel.heading || 0;
  const svg = vesselSVGs[vessel.type] || vesselSVGs.supply_vessel;

  return L.divIcon({
    className: 'vessel-marker-wrapper',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
      ">
        ${isSelected ? `
          <div style="
            position: absolute;
            inset: -6px;
            border: 2px solid ${color};
            border-radius: 50%;
            animation: pulse 2s infinite;
            opacity: 0.6;
          "></div>
        ` : ''}
        <div style="
          width: ${size}px;
          height: ${size}px;
          color: ${color};
          transform: rotate(${rotation - 90}deg);
          transition: transform 0.5s ease;
        ">
          ${svg}
        </div>
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: ${isSelected ? 14 : 10}px;
          height: ${isSelected ? 14 : 10}px;
          background: ${statusColor};
          border-radius: 50%;
          border: 2px solid #1a1a1a;
          ${vessel.status === 'alert' ? 'animation: pulse 1s infinite;' : ''}
        "></div>
        ${isSelected ? `
          <div style="
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            white-space: nowrap;
            font-weight: 500;
          ">${vessel.name}</div>
        ` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function FleetMapClient({ 
  vessels, 
  selectedVessel, 
  onSelectVessel,
  plannedRoutes = [],
  onPlanRoute,
}: FleetMapClientProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const routesRef = useRef<Map<string, L.Polyline>>(new Map());
  const routeHistoryRef = useRef<Map<string, [number, number][]>>(new Map());
  const plannedRoutesLayerRef = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initAttemptRef = useRef(0);

  // Initialize map with retry logic to handle container size issues
  useEffect(() => {
    const initMap = () => {
      if (!containerRef.current) return;
      
      // Don't reinitialize if map already exists
      if (mapRef.current) {
        // Just invalidate size in case container resized
        mapRef.current.invalidateSize();
        return;
      }

      // Check if container has valid dimensions
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // Retry after a short delay
        if (initAttemptRef.current < 10) {
          initAttemptRef.current++;
          setTimeout(initMap, 100);
        }
        return;
      }

      // Initialize map centered on UAE/Persian Gulf waters
      const map = L.map(containerRef.current, {
        center: [24.8, 54.0], // Centered on Abu Dhabi offshore
        zoom: 8,
        zoomControl: true,
        attributionControl: false,
      });

      // Add map tile layer
      if (MAPBOX_TOKEN) {
        // Mapbox Navigation Night style
        L.tileLayer(
          `https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
          {
            maxZoom: 19,
            tileSize: 512,
            zoomOffset: -1,
          }
        ).addTo(map);
      } else {
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(map);
      }

      // Add OpenSeaMap overlay for maritime features
      L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
        maxZoom: 19,
        opacity: 0.7,
      }).addTo(map);

      mapRef.current = map;

      // Create layer group for planned routes
      plannedRoutesLayerRef.current = L.layerGroup().addTo(map);

      // Invalidate size after tiles load
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Render planned routes
  useEffect(() => {
    const map = mapRef.current;
    const layer = plannedRoutesLayerRef.current;
    if (!map || !layer) return;

    // Clear existing planned routes
    layer.clearLayers();

    // Draw each planned route
    plannedRoutes.forEach((route) => {
      if (route.waypoints.length < 2) return;

      const latLngs = route.waypoints.map(wp => [wp.lat, wp.lng] as [number, number]);
      const vesselColor = vesselColors[vessels.find(v => v.id === route.vesselId)?.type || 'supply_vessel'] || '#5b8a8a';

      // Draw dashed route line
      const routeLine = L.polyline(latLngs, {
        color: vesselColor,
        weight: 3,
        opacity: 0.7,
        dashArray: '8, 6',
        lineCap: 'round',
        lineJoin: 'round',
      });
      layer.addLayer(routeLine);

      // Add destination marker
      if (route.destination) {
        const destMarker = L.circleMarker(
          [route.destination.lat, route.destination.lng],
          {
            radius: 6,
            fillColor: vesselColor,
            fillOpacity: 0.8,
            color: '#000',
            weight: 2,
          }
        );
        
        destMarker.bindTooltip(route.destination.name || 'Destination', {
          permanent: false,
          direction: 'top',
          className: 'route-tooltip',
        });
        
        layer.addLayer(destMarker);
      }

      // Add intermediate waypoint markers
      for (let i = 1; i < route.waypoints.length - 1; i++) {
        const wpMarker = L.circleMarker(
          [route.waypoints[i].lat, route.waypoints[i].lng],
          {
            radius: 3,
            fillColor: vesselColor,
            fillOpacity: 0.6,
            color: '#000',
            weight: 1,
          }
        );
        layer.addLayer(wpMarker);
      }
    });
  }, [plannedRoutes, vessels]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Filter vessels with valid positions
    const validVessels = vessels.filter((v) => 
      typeof v.position_lat === 'number' && 
      typeof v.position_lng === 'number' &&
      !isNaN(v.position_lat) && 
      !isNaN(v.position_lng)
    );

    validVessels.forEach((vessel) => {
      const isSelected = vessel.id === selectedVessel;
      const color = vesselColors[vessel.type] || '#60a5fa';
      const currentPos: [number, number] = [vessel.position_lat, vessel.position_lng];

      // Update route history
      let history = routeHistoryRef.current.get(vessel.id) || [];
      const lastPos = history[history.length - 1];
      
      if (!lastPos || 
          Math.abs(lastPos[0] - currentPos[0]) > 0.001 || 
          Math.abs(lastPos[1] - currentPos[1]) > 0.001) {
        history.push(currentPos);
        if (history.length > MAX_ROUTE_POINTS) {
          history = history.slice(-MAX_ROUTE_POINTS);
        }
        routeHistoryRef.current.set(vessel.id, history);
      }

      // Update or create route polyline
      const existingRoute = routesRef.current.get(vessel.id);
      if (history.length > 1) {
        if (existingRoute) {
          existingRoute.setLatLngs(history);
          existingRoute.setStyle({
            weight: isSelected ? 3 : 2,
            opacity: isSelected ? 0.8 : 0.4,
          });
        } else {
          const route = L.polyline(history, {
            color: color,
            weight: isSelected ? 3 : 2,
            opacity: isSelected ? 0.8 : 0.4,
            smoothFactor: 1,
            lineCap: 'round',
            lineJoin: 'round',
          });
          route.addTo(map);
          routesRef.current.set(vessel.id, route);
        }
      }

      // Update or create marker
      const existingMarker = markersRef.current.get(vessel.id);

      if (existingMarker) {
        existingMarker.setLatLng(currentPos);
        existingMarker.setIcon(createVesselIcon(vessel, isSelected));
      } else {
        const marker = L.marker(currentPos, {
          icon: createVesselIcon(vessel, isSelected),
        });

        // Get local weather for this vessel
        const localWeather = getWeatherAtLocation(vessel.position_lat, vessel.position_lng);
        const weatherIcon = getWeatherIcon(localWeather.condition);
        const riskColor = getRiskColor(localWeather.operationalRisk);

        marker.bindPopup(`
          <div style="min-width: 240px; font-family: system-ui, sans-serif;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="width: 24px; height: 24px; color: ${color};">${vesselSVGs[vessel.type] || vesselSVGs.supply_vessel}</div>
              <div>
                <h3 style="font-weight: 600; font-size: 14px; margin: 0; color: white;">${vessel.name}</h3>
                <span style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: capitalize;">${vessel.type.replace('_', ' ')}</span>
              </div>
            </div>
            
            <div style="display: grid; gap: 6px; font-size: 12px;">
              <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: rgba(255,255,255,0.5);">Status</span>
                <span style="color: ${statusColors[vessel.status || 'operational']}; font-weight: 500; text-transform: capitalize;">${vessel.status}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: rgba(255,255,255,0.5);">Speed</span>
                <span style="color: white;">${vessel.speed?.toFixed(1) ?? 0} kn</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: rgba(255,255,255,0.5);">Heading</span>
                <span style="color: white;">${vessel.heading?.toFixed(0) ?? 0}°</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: rgba(255,255,255,0.5);">Health</span>
                <span style="color: ${(vessel.health_score ?? 100) < 70 ? '#ef4444' : 'white'};">${vessel.health_score ?? 100}%</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: rgba(255,255,255,0.5);">Fuel</span>
                <span style="color: ${(vessel.fuel_level ?? 100) < 30 ? '#ef4444' : 'white'};">${vessel.fuel_level?.toFixed(0) ?? 100}%</span>
              </div>
            </div>

            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 11px; color: rgba(255,255,255,0.5);">Local Weather</span>
                <span style="font-size: 11px; color: rgba(255,255,255,0.4);">${localWeather.zone}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; font-size: 12px;">
                <span style="font-size: 20px;">${weatherIcon}</span>
                <div style="flex: 1;">
                  <div style="color: white; text-transform: capitalize;">${localWeather.condition.replace('_', ' ')}</div>
                  <div style="color: rgba(255,255,255,0.5); font-size: 11px;">
                    ${localWeather.windSpeed} kt ${localWeather.windDirection} • ${localWeather.waveHeight}m waves
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="color: white;">${localWeather.temperature}°C</div>
                  <div style="color: ${riskColor}; font-size: 10px; text-transform: uppercase; font-weight: 500;">
                    ${localWeather.operationalRisk} risk
                  </div>
                </div>
              </div>
            </div>

            ${onPlanRoute ? `
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
              <button 
                class="plan-route-btn" 
                data-vessel-id="${vessel.id}"
                style="
                  width: 100%;
                  padding: 8px 12px;
                  background: rgba(91, 138, 138, 0.2);
                  border: 1px solid rgba(91, 138, 138, 0.4);
                  border-radius: 6px;
                  color: #5b8a8a;
                  font-size: 11px;
                  font-weight: 500;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 6px;
                  transition: all 0.2s;
                "
                onmouseover="this.style.background='rgba(91, 138, 138, 0.3)'"
                onmouseout="this.style.background='rgba(91, 138, 138, 0.2)'"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 11l18-9-9 18-3-6-6-3z"/>
                </svg>
                Plan Route
              </button>
            </div>
            ` : ''}
          </div>
        `, {
          className: 'vessel-popup',
        });

        // Add click handler for Plan Route button
        if (onPlanRoute) {
          marker.on('popupopen', () => {
            setTimeout(() => {
              const btn = document.querySelector(`.plan-route-btn[data-vessel-id="${vessel.id}"]`);
              if (btn) {
                btn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  onPlanRoute(vessel.id);
                  marker.closePopup();
                });
              }
            }, 100);
          });
        }

        marker.on('click', () => {
          onSelectVessel(vessel.id);
        });

        marker.addTo(map);
        markersRef.current.set(vessel.id, marker);
      }
    });

    // Cleanup removed vessels
    markersRef.current.forEach((marker, id) => {
      if (!vessels.find((v) => v.id === id)) {
        marker.remove();
        markersRef.current.delete(id);
        const route = routesRef.current.get(id);
        if (route) {
          route.remove();
          routesRef.current.delete(id);
        }
        routeHistoryRef.current.delete(id);
      }
    });
  }, [vessels, selectedVessel, onSelectVessel]);

  // Pan to selected vessel
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedVessel) return;

    const vessel = vessels.find((v) => v.id === selectedVessel);
    if (vessel) {
      map.setView([vessel.position_lat, vessel.position_lng], 10, { animate: true });
    }
  }, [selectedVessel, vessels]);

  // Handle resize events to ensure map displays correctly
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <style>{`
        .vessel-popup .leaflet-popup-content-wrapper {
          background: rgba(20, 20, 25, 0.95);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .vessel-popup .leaflet-popup-tip {
          background: rgba(20, 20, 25, 0.95);
        }
        .route-tooltip {
          background: rgba(20, 20, 25, 0.95) !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
          border-radius: 4px !important;
          color: white !important;
          font-size: 11px !important;
          padding: 4px 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        }
        .route-tooltip::before {
          border-top-color: rgba(20, 20, 25, 0.95) !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-white/10"
        style={{ height: '100%', minHeight: '400px' }}
      />
    </>
  );
}
