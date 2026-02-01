// @ts-nocheck - Orchestration page with complex vessel types
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Vessel, isSupabaseConfigured } from '@/lib/supabase';
import { GanttChart } from '@/app/components/orchestration/GanttChart';
import { ScheduleOptimizer } from '@/app/components/orchestration/ScheduleOptimizer';
import { OptimizationResults } from '@/app/components/orchestration/OptimizationResults';
import { FleetOptimizationResult } from '@/lib/orchestration/fleet-optimizer';
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
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Leaf,
  Target,
  Play,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ImpactAnalysisPanel } from '@/app/components/ImpactAnalysisPanel';
import { 
  analyzeImpact, 
  generateMockFleetState,
  ProposedChange,
  ImpactAnalysisResult,
} from '@/lib/impact-analysis';

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
  
  // Fleet optimization state
  const [optimizationResult, setOptimizationResult] = useState<FleetOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Impact analysis state
  const [showImpactPanel, setShowImpactPanel] = useState(false);
  const [impactResult, setImpactResult] = useState<ImpactAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pendingChange, setPendingChange] = useState<{ type: string; context: Record<string, unknown> } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Always use NMDC fleet data for this demo
      const vesselsData = NMDC_FLEET.map((v) => ({
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

  // Run fleet optimization
  const runOptimization = useCallback(async () => {
    if (vessels.length === 0 || projects.length === 0) return;
    
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/fleet-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vessels: vessels.map(v => ({
            id: v.id,
            name: v.name,
            type: v.type,
            lat: v.current_lat,
            lng: v.current_lng,
            speed: v.speed || 10,
          })),
          projects: projects.map(p => ({
            id: p.id,
            name: p.name,
            lat: p.location.lat,
            lng: p.location.lng,
            requiredVesselTypes: p.requirements.vesselTypes,
            priority: p.priority,
            startDate: p.schedule.startDate.toISOString(),
            endDate: p.schedule.endDate.toISOString(),
          })),
          assignments: assignments.map(a => ({
            id: a.id,
            vesselId: a.vesselId,
            vesselName: a.vesselName,
            projectId: a.projectId,
            projectName: a.projectName,
            startDate: a.startDate instanceof Date ? a.startDate.toISOString() : a.startDate,
            endDate: a.endDate instanceof Date ? a.endDate.toISOString() : a.endDate,
            status: a.status,
            utilization: a.utilization,
          })),
        }),
      });
      
      const data = await response.json();
      if (data.success && data.result) {
        setOptimizationResult(data.result);
      }
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [vessels, projects, assignments]);

  const handleAssignmentClick = (assignment: VesselAssignment) => {
    setSelectedAssignment(assignment);
  };

  const analyzeChangeImpact = useCallback((changeType: string, context: Record<string, unknown> = {}) => {
    setIsAnalyzing(true);
    setPendingChange({ type: changeType, context });
    setShowImpactPanel(true);
    
    setTimeout(() => {
      const fleetState = generateMockFleetState();
      
      const vesselIds = context.vesselIds as string[] || NMDC_FLEET.slice(0, 2).map(v => v.mmsi);
      const projectIds = context.projectIds as string[] || projects.slice(0, 2).map(p => p.id);
      
      const change: ProposedChange = {
        id: `change-${Date.now()}`,
        type: changeType as ProposedChange['type'],
        title: getChangeTitle(changeType, context),
        description: getChangeDescription(changeType, context),
        effectiveDate: new Date(),
        affectedVessels: vesselIds,
        affectedProjects: projectIds,
        parameters: context,
      };
      
      const result = analyzeImpact(change, fleetState);
      setImpactResult(result);
      setIsAnalyzing(false);
    }, 1200);
  }, [projects]);

  const getChangeTitle = (type: string, context: Record<string, unknown>): string => {
    const titles: Record<string, string> = {
      vessel_assignment: `Reassign ${context.vesselName || 'Vessel'}`,
      schedule_change: 'Schedule Modification',
      project_delay: `Delay ${context.projectName || 'Project'}`,
      new_project: 'New Project Assignment',
      maintenance_schedule: 'Maintenance Reschedule',
      route_change: 'Route Optimization',
    };
    return titles[type] || 'Operational Change';
  };

  const getChangeDescription = (type: string, context: Record<string, unknown>): string => {
    switch (type) {
      case 'vessel_assignment':
        return `Reassign ${context.vesselName || 'vessel'} to ${context.targetProject || 'new project'}`;
      case 'schedule_change':
        return `Modify schedule by ${context.days || 'several'} days`;
      case 'project_delay':
        return `Delay ${context.projectName || 'project'} by ${context.days || 7} days`;
      case 'new_project':
        return 'Evaluate impact of accepting new project on current operations';
      default:
        return 'Analyze operational change impact';
    }
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
                onClick={() => setShowImpactPanel(!showImpactPanel)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                  showImpactPanel 
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                <Brain className="w-4 h-4" />
                Impact Analysis
              </button>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button 
                onClick={runOptimization}
                disabled={isOptimizing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/80 hover:bg-primary-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isOptimizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Optimize Schedule
                  </>
                )}
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

        {/* Optimization Results */}
        {optimizationResult && (
          <div className="mb-6">
            <OptimizationResults
              result={optimizationResult}
              onApply={() => {
                // In a real app, this would apply the optimized schedule
                console.log('Applying optimizations:', optimizationResult.changes);
                setOptimizationResult(null);
              }}
              onDismiss={() => setOptimizationResult(null)}
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

        {/* Impact Analysis Panel (Slide-in) */}
        {showImpactPanel && (
          <div className="mb-6 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 rounded-xl border border-violet-500/20 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <Brain className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Predictive Impact Analysis</h3>
                  <p className="text-xs text-white/50">Analyze upstream & downstream effects before making changes</p>
                </div>
              </div>
              <button
                onClick={() => setShowImpactPanel(false)}
                className="text-white/40 hover:text-white/60 text-sm"
              >
                Close
              </button>
            </div>
            
            {!impactResult && !isAnalyzing ? (
              <div className="grid grid-cols-4 gap-3">
                {[
                  {
                    type: 'vessel_assignment',
                    icon: Ship,
                    title: 'Reassign Vessel',
                    description: 'Move a vessel to a different project',
                    color: 'blue',
                  },
                  {
                    type: 'schedule_change',
                    icon: Calendar,
                    title: 'Modify Schedule',
                    description: 'Change project timelines',
                    color: 'amber',
                  },
                  {
                    type: 'new_project',
                    icon: Target,
                    title: 'New Project',
                    description: 'Evaluate taking on new work',
                    color: 'emerald',
                  },
                  {
                    type: 'maintenance_schedule',
                    icon: Settings,
                    title: 'Reschedule Maintenance',
                    description: 'Defer or accelerate PM tasks',
                    color: 'violet',
                  },
                ].map(scenario => {
                  const colorClasses: Record<string, string> = {
                    blue: 'border-blue-500/30 hover:bg-blue-500/10 text-blue-400',
                    amber: 'border-amber-500/30 hover:bg-amber-500/10 text-amber-400',
                    emerald: 'border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400',
                    violet: 'border-violet-500/30 hover:bg-violet-500/10 text-violet-400',
                  };
                  
                  return (
                    <button
                      key={scenario.type}
                      onClick={() => analyzeChangeImpact(scenario.type, {})}
                      className={`p-4 rounded-xl bg-white/[0.02] border ${colorClasses[scenario.color]} transition-colors text-left`}
                    >
                      <scenario.icon className={`w-5 h-5 mb-2 ${colorClasses[scenario.color].split(' ').pop()}`} />
                      <div className="text-sm font-medium text-white">{scenario.title}</div>
                      <p className="text-xs text-white/40 mt-0.5">{scenario.description}</p>
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-white/30">
                        <Play className="w-3 h-3" />
                        Run Analysis
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : isAnalyzing ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white/60">Analyzing impact chain...</p>
                  <div className="flex items-center justify-center gap-4 mt-2 text-xs text-white/40">
                    <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Upstream</span>
                    <span className="flex items-center gap-1"><ArrowDownRight className="w-3 h-3" /> Downstream</span>
                  </div>
                </div>
              </div>
            ) : impactResult ? (
              <ImpactAnalysisPanel
                result={impactResult}
                compact
                onDismiss={() => {
                  setImpactResult(null);
                  setPendingChange(null);
                }}
                onApplyChange={() => {
                  alert('Change would be applied with all stakeholders notified of impacts.');
                  setImpactResult(null);
                  setPendingChange(null);
                  setShowImpactPanel(false);
                }}
              />
            ) : null}
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
                  project: (v as Record<string, unknown>).destination as string | undefined,
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

            {/* Quick Impact Analysis */}
            <div className="bg-white/[0.02] rounded-xl border border-white/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-medium text-white">Quick Impact Check</span>
              </div>
              <p className="text-[10px] text-white/40 mb-2">
                Analyze effects before making changes
              </p>
              <button
                onClick={() => setShowImpactPanel(true)}
                className="w-full py-2 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-colors flex items-center justify-center gap-1"
              >
                <Zap className="w-3 h-3" />
                Run What-If Analysis
              </button>
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
                          <button
                            onClick={() => analyzeChangeImpact('schedule_change', {
                              conflictId: conflict.id,
                              description: conflict.description,
                            })}
                            className="mt-2 text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1"
                          >
                            <Brain className="w-3 h-3" />
                            Analyze Resolution Impact
                          </button>
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
            <ProjectCard 
              key={project.id} 
              project={project} 
              onAnalyzeImpact={() => analyzeChangeImpact('project_delay', {
                projectId: project.id,
                projectName: project.name,
                days: 7,
              })}
            />
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
function ProjectCard({ project, onAnalyzeImpact }: { project: Project; onAnalyzeImpact?: () => void }) {
  const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-400',
    planning: 'bg-blue-500/20 text-blue-400',
    delayed: 'bg-rose-500/20 text-rose-400',
    'on-hold': 'bg-amber-500/20 text-amber-400',
    completed: 'bg-white/10 text-white/50',
  };

  const budgetSpent = (project.budget.spent / project.budget.allocated) * 100;

  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4 group">
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

      {/* Impact Analysis Button */}
      {onAnalyzeImpact && (
        <button
          onClick={onAnalyzeImpact}
          className="mt-3 w-full py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-medium hover:bg-violet-500/20 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1"
        >
          <Brain className="w-3 h-3" />
          What if delayed 7 days?
        </button>
      )}
    </div>
  );
}

