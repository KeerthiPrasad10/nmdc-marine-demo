'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Ship, 
  TrendingUp,
  Building2,
  Waves,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { 
  PROJECT_SITES, 
  PROJECT_TYPE_CONFIG, 
  PROJECT_STATUS_CONFIG,
  getProjectStats,
  type ProjectSite 
} from '@/lib/nmdc/projects';

interface VesselInfo {
  mmsi: string;
  name: string;
  type: string;
  isOnline: boolean;
}

export default function ProjectsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());

  const [mapReady, setMapReady] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectSite | null>(null);
  const [filterStatus, setFilterStatus] = useState<ProjectSite['status'] | 'all'>('all');
  const [filterType, setFilterType] = useState<ProjectSite['type'] | 'all'>('all');
  const [vessels, setVessels] = useState<Map<string, VesselInfo>>(new Map());

  const stats = getProjectStats();

  // Fetch vessel data for name lookups
  useEffect(() => {
    const fetchVessels = async () => {
      try {
        const response = await fetch('/api/fleet');
        const data = await response.json();
        if (data.success && data.vessels) {
          const vesselMap = new Map<string, VesselInfo>();
          data.vessels.forEach((v: { mmsi: string; name: string; type: string; isOnline: boolean }) => {
            vesselMap.set(v.mmsi, { mmsi: v.mmsi, name: v.name, type: v.type, isOnline: v.isOnline });
          });
          setVessels(vesselMap);
        }
      } catch (err) {
        console.error('Error fetching vessels:', err);
      }
    };
    fetchVessels();
  }, []);

  const getVesselName = (mmsi: string): string => {
    return vessels.get(mmsi)?.name || mmsi;
  };

  const getVesselInfo = (mmsi: string): VesselInfo | undefined => {
    return vessels.get(mmsi);
  };

  const filteredProjects = PROJECT_SITES.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterType !== 'all' && p.type !== filterType) return false;
    return true;
  });

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;
    
    if (mapRef.current) {
      setMapReady(true);
      return;
    }

    const initMap = async () => {
      try {
        const L = await import('leaflet');
        leafletRef.current = L.default || L;

        const container = containerRef.current as HTMLElement & { _leaflet_id?: string };
        if (container?._leaflet_id) {
          setMapReady(true);
          return;
        }

        const map = leafletRef.current.map(containerRef.current, {
          center: [24.5, 54.0],
          zoom: 7,
          zoomControl: true,
          attributionControl: false,
        });

        leafletRef.current.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;
        setMapReady(true);
      } catch (err) {
        console.error('Map init error:', err);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Update markers
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !mapReady) return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    const bounds: [number, number][] = [];

    filteredProjects.forEach(project => {
      const typeConfig = PROJECT_TYPE_CONFIG[project.type];
      const statusConfig = PROJECT_STATUS_CONFIG[project.status];
      const isSelected = selectedProject?.id === project.id;
      const isActive = project.status === 'active';

      // Create custom icon
      const size = isSelected ? 40 : 32;
      const icon = L.divIcon({
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background: ${isActive ? typeConfig.color : '#4b5563'};
            border: 3px solid ${isSelected ? '#fff' : 'rgba(0,0,0,0.5)'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '18px' : '14px'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            opacity: ${isActive ? 1 : 0.6};
          ">
            ${typeConfig.icon}
          </div>
        `,
        className: 'project-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([project.location.lat, project.location.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : (isActive ? 100 : 0),
      })
        .addTo(map)
        .on('click', () => setSelectedProject(project));

      marker.bindTooltip(`
        <div style="text-align: center;">
          <div style="font-weight: 600; margin-bottom: 2px;">${project.name}</div>
          <div style="font-size: 10px; color: ${statusConfig.color};">${statusConfig.label}</div>
          ${project.progress !== undefined ? `<div style="font-size: 10px; opacity: 0.7;">${project.progress}% complete</div>` : ''}
        </div>
      `, {
        permanent: false,
        direction: 'top',
        offset: [0, -20],
        className: 'project-tooltip',
      });

      markersRef.current.set(project.id, marker);
      bounds.push([project.location.lat, project.location.lng]);
    });

    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 9 });
      } catch (e) {
        console.error('fitBounds error:', e);
      }
    }
  }, [filteredProjects, selectedProject, mapReady]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Pan to selected project
  useEffect(() => {
    if (selectedProject && mapRef.current) {
      mapRef.current.flyTo([selectedProject.location.lat, selectedProject.location.lng], 10, {
        duration: 0.5,
      });
    }
  }, [selectedProject]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Project Sites</h1>
                <p className="text-sm text-white/50">Active & Planned Projects</p>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{stats.active}</p>
                <p className="text-xs text-white/50">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{stats.planned}</p>
                <p className="text-xs text-white/50">Planned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white/60">{stats.completed}</p>
                <p className="text-xs text-white/50">Completed</p>
              </div>
              <div className="text-center border-l border-white/10 pl-6">
                <p className="text-2xl font-bold text-amber-400">{stats.avgProgress}%</p>
                <p className="text-xs text-white/50">Avg Progress</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-96 border-r border-white/10 flex flex-col bg-[#0a0a0a]">
          {/* Filters */}
          <div className="p-4 border-b border-white/10 space-y-3">
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ProjectSite['status'] | 'all')}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="planned">Planned</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ProjectSite['type'] | 'all')}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
              >
                <option value="all">All Types</option>
                {Object.entries(PROJECT_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-white/40">
              Showing {filteredProjects.length} of {PROJECT_SITES.length} projects
            </p>
          </div>

          {/* Project List */}
          <div className="flex-1 overflow-y-auto">
            {filteredProjects.map(project => {
              const typeConfig = PROJECT_TYPE_CONFIG[project.type];
              const statusConfig = PROJECT_STATUS_CONFIG[project.status];
              const isSelected = selectedProject?.id === project.id;

              return (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`w-full text-left p-4 border-b border-white/5 transition-all ${
                    isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ backgroundColor: `${typeConfig.color}20` }}
                    >
                      {typeConfig.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-white truncate">{project.name}</h3>
                      </div>
                      <p className="text-xs text-white/50 mt-0.5">{project.location.area}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ 
                            backgroundColor: `${statusConfig.color}20`,
                            color: statusConfig.color,
                          }}
                        >
                          {statusConfig.label}
                        </span>
                        <span className="text-[10px] text-white/40">{typeConfig.label}</span>
                      </div>
                      {project.status === 'active' && project.progress !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-white/40">Progress</span>
                            <span className="text-white/60">{project.progress}%</span>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${project.progress}%`,
                                backgroundColor: typeConfig.color,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronRight className={`h-4 w-4 text-white/30 flex-shrink-0 transition-transform ${
                      isSelected ? 'rotate-90' : ''
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="p-3 border-t border-white/10 bg-black/50">
            <p className="text-[10px] text-white/40 mb-2">Project Types</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PROJECT_TYPE_CONFIG).map(([key, config]) => (
                <div key={key} className="flex items-center gap-1">
                  <span className="text-xs">{config.icon}</span>
                  <span className="text-[10px] text-white/50">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <div ref={containerRef} className="absolute inset-0" />

          {/* Selected Project Details */}
          {selectedProject && (
            <div className="absolute bottom-4 left-4 right-4 max-w-2xl mx-auto z-10">
              <div className="bg-black/90 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{PROJECT_TYPE_CONFIG[selectedProject.type].icon}</span>
                        <h2 className="text-lg font-bold">{selectedProject.name}</h2>
                      </div>
                      <p className="text-sm text-white/60 mb-3">{selectedProject.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center gap-1.5 text-white/40 text-xs mb-1">
                            <Building2 className="h-3 w-3" />
                            Client
                          </div>
                          <p className="text-sm font-medium">{selectedProject.client}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-white/40 text-xs mb-1">
                            <MapPin className="h-3 w-3" />
                            Location
                          </div>
                          <p className="text-sm font-medium">{selectedProject.location.area}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-white/40 text-xs mb-1">
                            <Calendar className="h-3 w-3" />
                            Timeline
                          </div>
                          <p className="text-sm font-medium">
                            {new Date(selectedProject.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            {selectedProject.endDate && ` - ${new Date(selectedProject.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-white/40 text-xs mb-1">
                            <TrendingUp className="h-3 w-3" />
                            Value
                          </div>
                          <p className="text-sm font-medium">{selectedProject.value || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Scope */}
                      {selectedProject.scope && (
                        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/10">
                          {selectedProject.scope.dredgeVolume && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                              <Waves className="h-4 w-4 text-orange-400" />
                              <span className="text-sm">{selectedProject.scope.dredgeVolume}</span>
                            </div>
                          )}
                          {selectedProject.scope.depth && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                              <TrendingUp className="h-4 w-4 text-blue-400" />
                              <span className="text-sm">{selectedProject.scope.depth}</span>
                            </div>
                          )}
                          {selectedProject.scope.area && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                              <MapPin className="h-4 w-4 text-green-400" />
                              <span className="text-sm">{selectedProject.scope.area}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Assigned Vessels */}
                      {selectedProject.assignedVessels.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2 text-white/40 text-xs mb-2">
                            <Ship className="h-3 w-3" />
                            Assigned Vessels ({selectedProject.assignedVessels.length})
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedProject.assignedVessels.map(mmsi => {
                              const vesselInfo = getVesselInfo(mmsi);
                              return (
                                <Link
                                  key={mmsi}
                                  href={`/live/${mmsi}`}
                                  className="flex items-center gap-2 px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors group"
                                >
                                  {vesselInfo?.isOnline && (
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                  )}
                                  <span>{getVesselName(mmsi)}</span>
                                  <Ship className="h-3 w-3 text-white/30 group-hover:text-white/60 transition-colors" />
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress Ring */}
                    {selectedProject.status === 'active' && selectedProject.progress !== undefined && (
                      <div className="flex-shrink-0 text-center">
                        <div className="relative w-20 h-20">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="36"
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="8"
                              fill="none"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="36"
                              stroke={PROJECT_TYPE_CONFIG[selectedProject.type].color}
                              strokeWidth="8"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={`${selectedProject.progress * 2.26} 226`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold">{selectedProject.progress}%</span>
                          </div>
                        </div>
                        <p className="text-xs text-white/40 mt-1">Progress</p>
                      </div>
                    )}

                    {selectedProject.status === 'completed' && (
                      <div className="flex-shrink-0 text-center">
                        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle2 className="h-10 w-10 text-green-400" />
                        </div>
                        <p className="text-xs text-white/40 mt-1">Completed</p>
                      </div>
                    )}

                    {selectedProject.status === 'planned' && (
                      <div className="flex-shrink-0 text-center">
                        <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Clock className="h-10 w-10 text-blue-400" />
                        </div>
                        <p className="text-xs text-white/40 mt-1">Planned</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        .project-marker {
          background: transparent !important;
          border: none !important;
        }
        .project-tooltip {
          background: rgba(0,0,0,0.9) !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
          color: white !important;
          font-size: 11px !important;
          padding: 6px 10px !important;
          border-radius: 6px !important;
        }
        .leaflet-container {
          background: #1a1a1a !important;
        }
        .leaflet-control-zoom {
          border: none !important;
        }
        .leaflet-control-zoom a {
          background: rgba(0,0,0,0.7) !important;
          color: white !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(0,0,0,0.9) !important;
        }
      `}</style>
    </div>
  );
}

