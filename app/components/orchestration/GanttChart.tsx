'use client';

import { useMemo, useState } from 'react';
import { VesselAssignment, Project } from '@/lib/orchestration/types';
import { ChevronLeft, ChevronRight, Calendar, AlertTriangle } from 'lucide-react';

interface GanttChartProps {
  assignments: VesselAssignment[];
  projects: Project[];
  vessels: Array<{ id: string; name: string; type: string }>;
  onAssignmentClick?: (assignment: VesselAssignment) => void;
  startDate?: Date;
  daysToShow?: number;
  // Optimization overlay support
  highlightedVessels?: string[]; // Vessel IDs to highlight (from optimization suggestions)
  optimizationImpact?: {
    type: 'delay' | 'reschedule' | 'reassign' | 'accelerate' | 'reroute';
    vesselIds: string[];
    daysChange?: number;
  } | null;
}

// Muted, professional color palette
const projectColors: Record<string, string> = {
  'proj-001': 'bg-slate-400/60',
  'proj-002': 'bg-zinc-500/60',
  'proj-003': 'bg-stone-400/60',
  'proj-004': 'bg-neutral-400/60',
  'proj-005': 'bg-gray-500/60',
  'proj-006': 'bg-slate-500/60',
  'maintenance': 'bg-white/20',
};

// Fallback colors for dynamic project IDs
const fallbackColors = [
  'bg-slate-400/60',
  'bg-zinc-500/60', 
  'bg-stone-400/60',
  'bg-neutral-400/60',
  'bg-gray-500/60',
  'bg-slate-500/60',
];

export function GanttChart({
  assignments,
  projects,
  vessels,
  onAssignmentClick,
  startDate: initialStartDate,
  daysToShow = 60,
  highlightedVessels = [],
  optimizationImpact = null,
}: GanttChartProps) {
  const [startDate, setStartDate] = useState(
    initialStartDate || new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
  );
  const [hoveredAssignment, setHoveredAssignment] = useState<string | null>(null);

  const endDate = useMemo(() => {
    return new Date(startDate.getTime() + daysToShow * 24 * 60 * 60 * 1000);
  }, [startDate, daysToShow]);

  // Generate date columns
  const dateColumns = useMemo(() => {
    const columns: { date: Date; isWeekend: boolean; isToday: boolean }[] = [];
    const current = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(current);
      const dayOfWeek = date.getDay();
      columns.push({
        date,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isToday: date.toDateString() === today.toDateString(),
      });
      current.setDate(current.getDate() + 1);
    }
    return columns;
  }, [startDate, daysToShow]);

  // Group assignments by vessel
  const vesselRows = useMemo(() => {
    return vessels.map(vessel => ({
      vessel,
      assignments: assignments.filter(a => a.vesselId === vessel.id),
    }));
  }, [vessels, assignments]);

  // Calculate bar position and width
  const getBarStyle = (assignment: VesselAssignment) => {
    const assignStart = new Date(assignment.startDate);
    const assignEnd = new Date(assignment.endDate);

    // Clamp to visible range
    const visibleStart = Math.max(assignStart.getTime(), startDate.getTime());
    const visibleEnd = Math.min(assignEnd.getTime(), endDate.getTime());

    if (visibleStart >= visibleEnd) return null;

    const totalDuration = endDate.getTime() - startDate.getTime();
    const left = ((visibleStart - startDate.getTime()) / totalDuration) * 100;
    const width = ((visibleEnd - visibleStart) / totalDuration) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  // Navigation
  const scrollLeft = () => {
    setStartDate(new Date(startDate.getTime() - 14 * 24 * 60 * 60 * 1000));
  };

  const scrollRight = () => {
    setStartDate(new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000));
  };

  const goToToday = () => {
    setStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  };

  // Format date for header
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Get unique months for header
  const monthHeaders = useMemo(() => {
    const months: { month: string; startIndex: number; span: number }[] = [];
    let currentMonth = '';
    let startIndex = 0;

    dateColumns.forEach((col, index) => {
      const month = formatMonth(col.date);
      if (month !== currentMonth) {
        if (currentMonth) {
          months.push({ month: currentMonth, startIndex, span: index - startIndex });
        }
        currentMonth = month;
        startIndex = index;
      }
    });
    months.push({ month: currentMonth, startIndex, span: dateColumns.length - startIndex });

    return months;
  }, [dateColumns]);

  return (
    <div className="flex flex-col h-full bg-black rounded-xl border border-white/10 overflow-hidden">
      {/* Header Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <button
            onClick={scrollLeft}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>
          <button
            onClick={goToToday}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/60"
          >
            <Calendar className="w-3.5 h-3.5" />
            Today
          </button>
          <button
            onClick={scrollRight}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white/60" />
          </button>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-400/60" />
            <span className="text-white/50">Project</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-white/20" />
            <span className="text-white/50">Maintenance</span>
          </div>
          {highlightedVessels.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-white/40 ring-1 ring-white/60" />
              <span className="text-white/60">Affected</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[1200px]">
          {/* Month Headers */}
          <div className="flex border-b border-white/10">
            <div className="w-48 flex-shrink-0 px-4 py-2 bg-white/[0.02] border-r border-white/10">
              <span className="text-xs text-white/40">Vessels</span>
            </div>
            <div className="flex-1 flex">
              {monthHeaders.map((header, i) => (
                <div
                  key={i}
                  className="border-r border-white/5 px-2 py-2 text-center"
                  style={{ width: `${(header.span / daysToShow) * 100}%` }}
                >
                  <span className="text-xs font-medium text-white/60">{header.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Date Headers */}
          <div className="flex border-b border-white/10">
            <div className="w-48 flex-shrink-0 px-4 py-1 bg-white/[0.02] border-r border-white/10" />
            <div className="flex-1 flex">
              {dateColumns.map((col, i) => (
                <div
                  key={i}
                  className={`flex-1 min-w-[20px] border-r border-white/5 text-center py-1 ${
                    col.isToday ? 'bg-primary-500/20' : col.isWeekend ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <span className={`text-[10px] ${col.isToday ? 'text-primary-400 font-medium' : 'text-white/30'}`}>
                    {col.date.getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Vessel Rows */}
          {vesselRows.map(({ vessel, assignments: vesselAssignments }) => {
            const isHighlighted = highlightedVessels.includes(vessel.id);
            const hasImpact = optimizationImpact?.vesselIds.includes(vessel.id);
            
            return (
            <div 
              key={vessel.id} 
              className={`flex border-b transition-all duration-300 ${
                isHighlighted 
                  ? 'bg-white/10 border-white/20' 
                  : 'border-white/5 hover:bg-white/[0.02]'
              }`}
            >
              {/* Vessel Name */}
              <div className={`w-48 flex-shrink-0 px-4 py-3 border-r border-white/10 transition-colors ${
                isHighlighted ? 'bg-white/10' : 'bg-white/[0.02]'
              }`}>
                <div className="flex items-center gap-2">
                  {isHighlighted && (
                    <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                  )}
                  <div className="text-sm text-white font-medium truncate">{vessel.name}</div>
                </div>
                <div className="text-[10px] text-white/40 capitalize">{vessel.type.replace('_', ' ')}</div>
                {hasImpact && optimizationImpact && (
                  <div className={`text-[10px] mt-1 font-medium ${
                    optimizationImpact.type === 'delay' ? 'text-amber-400' :
                    optimizationImpact.type === 'accelerate' ? 'text-emerald-400' :
                    'text-white/60'
                  }`}>
                    {optimizationImpact.type === 'delay' && optimizationImpact.daysChange && `+${Math.abs(optimizationImpact.daysChange)} days`}
                    {optimizationImpact.type === 'accelerate' && optimizationImpact.daysChange && `-${Math.abs(optimizationImpact.daysChange)} days`}
                    {optimizationImpact.type === 'reassign' && '→ Reassign'}
                    {optimizationImpact.type === 'reschedule' && '↔ Reschedule'}
                    {optimizationImpact.type === 'reroute' && '⤳ Reroute'}
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="flex-1 relative h-14">
                {/* Grid lines */}
                <div className="absolute inset-0 flex">
                  {dateColumns.map((col, i) => (
                    <div
                      key={i}
                      className={`flex-1 min-w-[20px] border-r border-white/5 ${
                        col.isToday ? 'bg-primary-500/10' : col.isWeekend ? 'bg-white/[0.01]' : ''
                      }`}
                    />
                  ))}
                </div>

                {/* Assignment Bars */}
                {vesselAssignments.map((assignment, idx) => {
                  const style = getBarStyle(assignment);
                  if (!style) return null;

                  const project = projects.find(p => p.id === assignment.projectId);
                  const isHovered = hoveredAssignment === assignment.id;
                  const isAffected = hasImpact;
                  
                  // Get color - use project color or fallback
                  const colorClass = projectColors[assignment.projectId] || fallbackColors[idx % fallbackColors.length];

                  return (
                    <div
                      key={assignment.id}
                      className={`absolute top-2 h-10 rounded-lg cursor-pointer transition-all ${colorClass} ${
                        isHovered ? 'ring-2 ring-white/50 z-10' : ''
                      } ${isAffected ? 'ring-1 ring-dashed ring-white/40' : ''}`}
                      style={style}
                      onClick={() => onAssignmentClick?.(assignment)}
                      onMouseEnter={() => setHoveredAssignment(assignment.id)}
                      onMouseLeave={() => setHoveredAssignment(null)}
                    >
                      <div className="h-full px-2 flex items-center overflow-hidden">
                        <span className="text-[11px] text-white font-medium truncate">
                          {assignment.projectName}
                        </span>
                      </div>

                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-black/95 border border-white/20 rounded-lg p-3 min-w-[200px] z-20 shadow-xl">
                          <div className="text-sm font-medium text-white mb-1">
                            {assignment.projectName}
                          </div>
                          <div className="text-xs text-white/60 space-y-1">
                            <div>Vessel: {assignment.vesselName}</div>
                            <div>
                              {new Date(assignment.startDate).toLocaleDateString()} - {new Date(assignment.endDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${
                                assignment.status === 'active' ? 'bg-emerald-400' :
                                assignment.status === 'completed' ? 'bg-blue-400' : 'bg-amber-400'
                              }`} />
                              <span className="capitalize">{assignment.status}</span>
                            </div>
                            {assignment.utilization > 0 && (
                              <div>Utilization: {Math.round(assignment.utilization)}%</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Today marker */}
                {dateColumns.some(col => col.isToday) && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary-500 z-10"
                    style={{
                      left: `${((Date.now() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100}%`,
                    }}
                  />
                )}
              </div>
            </div>
          );
          })}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-white/[0.02] text-xs text-white/40">
        <div>
          Showing {vessels.length} vessels, {assignments.length} assignments
        </div>
        <div>
          {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

