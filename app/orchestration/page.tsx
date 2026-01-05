'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Vessel, isSupabaseConfigured } from '@/lib/supabase';
import { GanttChart } from '@/app/components/orchestration/GanttChart';
import { ScheduleOptimizer } from '@/app/components/orchestration/ScheduleOptimizer';
import { 
  Project, 
  VesselAssignment, 
  ScheduleConflict, 
  FleetMetrics,
} from '@/lib/orchestration/types';
import { 
  generateMockProjects, 
  generateMockAssignments, 
  generateMockConflicts,
  generateFleetMetrics,
} from '@/lib/orchestration/mock-data';
import { NMDC_FLEET } from '@/lib/nmdc/fleet';
import {
  ArrowLeft,
  LayoutGrid,
  AlertTriangle,
  TrendingUp,
  Ship,
  Calendar,
  DollarSign,
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export default function OrchestrationPage() {
  const router = useRouter();
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<VesselAssignment[]>([]);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [metrics, setMetrics] = useState<FleetMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<VesselAssignment | null>(null);
  const [conflictsPanelHighlighted, setConflictsPanelHighlighted] = useState(false);
  const conflictsPanelRef = useRef<HTMLDivElement>(null);
  
  // Optimization overlay state
  const [hoveredSuggestion, setHoveredSuggestion] = useState<{
    id: string;
    type: 'reschedule' | 'reroute' | 'reassign' | 'delay' | 'accelerate';
    affectedVessels: string[];
    estimatedImpact: { timeDelta: number };
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      let vesselsData: Vessel[] | null = null;
      
      // Try to fetch vessels from Supabase if configured
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('vessels')
          .select('*')
          .order('name');
        vesselsData = data;
      }

      // Fall back to NMDC fleet data if Supabase is not configured or returns empty
      if (!vesselsData || vesselsData.length === 0) {
        vesselsData = NMDC_FLEET.map((v) => ({
          id: v.mmsi,
          name: v.name,
          type: v.type,
          mmsi: v.mmsi,
          imo: v.imo || null,
          status: 'operational',
          current_lat: 24.5 + Math.random() * 0.5,
          current_lng: 54.0 + Math.random() * 0.5,
          heading: Math.floor(Math.random() * 360),
          speed: 5 + Math.random() * 10,
          destination: v.project || 'Abu Dhabi',
          eta: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          last_update: new Date().toISOString(),
          crew_count: v.crewCount || 20,
          engine_status: 'operational',
          fuel_level: 70 + Math.random() * 25,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })) as unknown as Vessel[];
      }

      setVessels(vesselsData);

      // Generate mock orchestration data
      const mockProjects = generateMockProjects();
      const mockAssignments = generateMockAssignments(
        mockProjects,
        vesselsData.map(v => ({ id: v.id, name: v.name }))
      );
      const mockConflicts = generateMockConflicts();
      const mockMetrics = generateFleetMetrics(
        vesselsData.map(v => ({ id: v.id, status: v.status || 'operational' }))
      );

      setProjects(mockProjects);
      setAssignments(mockAssignments);
      setConflicts(mockConflicts);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Even on error, fall back to NMDC fleet data
      const fallbackVessels = NMDC_FLEET.map((v) => ({
        id: v.mmsi,
        name: v.name,
        type: v.type,
        mmsi: v.mmsi,
        imo: v.imo || null,
        status: 'operational',
        current_lat: 24.5 + Math.random() * 0.5,
        current_lng: 54.0 + Math.random() * 0.5,
        heading: Math.floor(Math.random() * 360),
        speed: 5 + Math.random() * 10,
        destination: v.project || 'Abu Dhabi',
        eta: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        last_update: new Date().toISOString(),
        crew_count: v.crewCount || 20,
        engine_status: 'operational',
        fuel_level: 70 + Math.random() * 25,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) as unknown as Vessel[];
      
      setVessels(fallbackVessels);
      
      const mockProjects = generateMockProjects();
      const mockAssignments = generateMockAssignments(
        mockProjects,
        fallbackVessels.map(v => ({ id: v.id, name: v.name }))
      );
      setProjects(mockProjects);
      setAssignments(mockAssignments);
      setConflicts(generateMockConflicts());
      setMetrics(generateFleetMetrics(
        fallbackVessels.map(v => ({ id: v.id, status: v.status || 'operational' }))
      ));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignmentClick = (assignment: VesselAssignment) => {
    setSelectedAssignment(assignment);
  };

  const handleViewConflicts = () => {
    // Scroll to conflicts panel
    conflictsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Add highlight effect
    setConflictsPanelHighlighted(true);
    setTimeout(() => setConflictsPanelHighlighted(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60">Loading orchestration data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/70" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                  <LayoutGrid className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Fleet Orchestration</h1>
                  <p className="text-sm text-white/50">Mission Control & Resource Allocation</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/80 hover:bg-primary-500 text-white text-sm font-medium transition-colors">
                <Zap className="w-4 h-4" />
                Optimize Schedule
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Metrics Row */}
        {metrics && (
          <div className="grid grid-cols-6 gap-4 mb-6">
            <MetricCard
              icon={Ship}
              label="Fleet Utilization"
              value={`${metrics.utilization}%`}
              trend={+5}
              color="primary"
            />
            <MetricCard
              icon={Calendar}
              label="Active Projects"
              value={metrics.activeProjects.toString()}
              subtext={`${metrics.completedProjects} completed`}
              color="emerald"
            />
            <MetricCard
              icon={AlertTriangle}
              label="Schedule Conflicts"
              value={conflicts.length.toString()}
              trend={conflicts.filter(c => c.severity === 'critical').length > 0 ? undefined : 0}
              color={conflicts.some(c => c.severity === 'critical') ? 'rose' : 'amber'}
            />
            <MetricCard
              icon={Settings}
              label="Maintenance Due"
              value={metrics.upcomingMaintenance.toString()}
              subtext="Next 30 days"
              color="amber"
            />
            <MetricCard
              icon={DollarSign}
              label="Daily Revenue"
              value={`$${(metrics.revenuePerDay / 1000).toFixed(0)}k`}
              trend={+8}
              color="emerald"
            />
            <MetricCard
              icon={TrendingUp}
              label="Active Vessels"
              value={`${metrics.activeVessels}/${metrics.totalVessels}`}
              color="cyan"
            />
          </div>
        )}

        {/* Conflicts Alert */}
        {conflicts.filter(c => c.severity === 'critical').length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-rose-400">Critical Schedule Conflicts</h3>
                <p className="text-xs text-white/60 mt-1">
                  {conflicts.filter(c => c.severity === 'critical').length} critical conflict(s) require immediate attention
                </p>
              </div>
              <button 
                onClick={handleViewConflicts}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 text-sm hover:bg-rose-500/30 transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-4 gap-6">
          {/* Gantt Chart - Takes 3 columns */}
          <div className="col-span-3 h-[600px]">
            <GanttChart
              assignments={assignments}
              projects={projects}
              vessels={vessels.map(v => ({ id: v.id, name: v.name, type: v.type }))}
              onAssignmentClick={handleAssignmentClick}
              highlightedVessels={hoveredSuggestion?.affectedVessels || []}
              optimizationImpact={hoveredSuggestion ? {
                type: hoveredSuggestion.type,
                vesselIds: hoveredSuggestion.affectedVessels,
                daysChange: hoveredSuggestion.estimatedImpact.timeDelta,
              } : null}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Schedule Optimizer */}
            <div className="h-[500px]">
              <ScheduleOptimizer
                vessels={vessels.map(v => ({ 
                  id: v.id, 
                  name: v.name, 
                  type: v.type,
                  project: v.destination || undefined,
                  healthScore: typeof v.fuel_level === 'number' ? v.fuel_level : undefined,
                }))}
                onOptimizationApplied={(suggestion) => {
                  console.log('Applied optimization:', suggestion);
                  // In a real app, this would update the schedule
                }}
                onSuggestionHover={(suggestion) => {
                  if (suggestion) {
                    setHoveredSuggestion({
                      id: suggestion.id,
                      type: suggestion.type,
                      affectedVessels: suggestion.affectedVessels,
                      estimatedImpact: suggestion.estimatedImpact,
                    });
                  } else {
                    setHoveredSuggestion(null);
                  }
                }}
                selectedSuggestionId={hoveredSuggestion?.id || null}
              />
            </div>

            {/* Conflicts Panel */}
            <div 
              ref={conflictsPanelRef}
              className={`bg-black rounded-xl border overflow-hidden transition-all duration-500 ${
                conflictsPanelHighlighted 
                  ? 'border-white/40 ring-2 ring-white/20' 
                  : 'border-white/10'
              }`}
            >
              <div className={`px-4 py-3 border-b border-white/10 transition-colors duration-500 ${
                conflictsPanelHighlighted ? 'bg-white/10' : 'bg-white/[0.02]'
              }`}>
                <h3 className="text-sm font-medium text-white">Schedule Conflicts</h3>
              </div>
              <div className="p-3 space-y-2 max-h-[180px] overflow-y-auto">
                {conflicts.length === 0 ? (
                  <div className="text-center py-4 text-white/40 text-sm">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                    No conflicts detected
                  </div>
                ) : (
                  conflicts.map(conflict => (
                    <div
                      key={conflict.id}
                      className={`p-3 rounded-lg border ${
                        conflict.severity === 'critical'
                          ? 'bg-rose-500/10 border-rose-500/30'
                          : conflict.severity === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-blue-500/10 border-blue-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {conflict.severity === 'critical' ? (
                          <XCircle className="w-4 h-4 text-rose-400 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-medium">
                            {conflict.description}
                          </p>
                          <p className="text-[10px] text-white/50 mt-1">
                            {conflict.suggestedResolution}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Projects Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {projects.filter(p => p.status === 'active').slice(0, 3).map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </main>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  subtext?: string;
  trend?: number;
  color: 'primary' | 'emerald' | 'amber' | 'rose' | 'cyan';
}) {
  const colorClasses: Record<'primary' | 'emerald' | 'amber' | 'rose' | 'cyan', string> = {
    primary: 'text-primary-400 bg-primary-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
  };

  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-white">{value}</div>
          {subtext && <div className="text-xs text-white/40">{subtext}</div>}
        </div>
        {trend !== undefined && (
          <div className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </div>
  );
}

// Project Card Component
function ProjectCard({ project }: { project: Project }) {
  const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-400',
    planning: 'bg-blue-500/20 text-blue-400',
    delayed: 'bg-rose-500/20 text-rose-400',
    'on-hold': 'bg-amber-500/20 text-amber-400',
    completed: 'bg-white/10 text-white/50',
  };

  const budgetSpent = (project.budget.spent / project.budget.allocated) * 100;

  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-white">{project.name}</h3>
          <p className="text-xs text-white/40">{project.client}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusColors[project.status]}`}>
          {project.status}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-white/50">Progress</span>
          <span className="text-white">{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Budget */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-white/50">Budget</span>
          <span className="text-white">
            ${(project.budget.spent / 1000000).toFixed(1)}M / ${(project.budget.allocated / 1000000).toFixed(1)}M
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${budgetSpent > 90 ? 'bg-rose-500' : budgetSpent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${budgetSpent}%` }}
          />
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-[10px] text-white/40">
        <span>{project.assignedVessels.length} vessel(s)</span>
        <span>{project.location.name}</span>
      </div>
    </div>
  );
}

