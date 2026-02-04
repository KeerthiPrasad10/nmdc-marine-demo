// @ts-nocheck - Orchestration page with decision workflow
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NMDC_ENERGY_FLEET, getNMDCVesselByMMSI } from '@/lib/nmdc/fleet';
import { VESSEL_ISSUES, getVesselIssues, VesselIssues, EquipmentIssue } from '@/lib/vessel-issues';
import { PROJECT_SITES, getProjectsByVessel } from '@/lib/nmdc/projects';
import {
  ArrowLeft,
  AlertTriangle,
  Ship,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Wrench,
  ArrowRightLeft,
  Clock,
  Users,
  FileText,
  Zap,
  TrendingDown,
  Target,
  Bell,
  ChevronLeft,
} from 'lucide-react';

interface OrchestrationOption {
  id: string;
  title: string;
  description: string;
  icon: typeof Ship;
  timeImpact: string;
  costImpact: string;
  riskLevel: 'low' | 'medium' | 'high';
  pros: string[];
  cons: string[];
  rippleEffects: string[];
  scheduleChange: {
    type: 'delay' | 'swap' | 'parallel' | 'none';
    daysShift: number;
    affectedVessels: string[];
    swapWith?: string;
  };
}

interface ActiveIssue {
  mmsi: string;
  vesselName: string;
  vesselType: string;
  issue: EquipmentIssue;
  affectedProjects: Array<{
    id: string;
    name: string;
    client: string;
    delayRisk: number;
    financialRisk: string;
  }>;
}

interface ScheduleBlock {
  vesselMMSI: string;
  vesselName: string;
  projectId: string;
  projectName: string;
  startDay: number;
  duration: number;
  status: 'active' | 'planned' | 'maintenance' | 'affected' | 'swapped';
  health?: number;
}

interface ExecutedDecision {
  issueId: string;
  issue: ActiveIssue;
  option: OrchestrationOption;
  executedAt: Date;
}

export default function OrchestrationPage() {
  const router = useRouter();
  const [selectedIssue, setSelectedIssue] = useState<ActiveIssue | null>(null);
  const [selectedOption, setSelectedOption] = useState<OrchestrationOption | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [executedDecisions, setExecutedDecisions] = useState<ExecutedDecision[]>([]);
  const [chartStartDay, setChartStartDay] = useState(-7);
  const [permanentScheduleChanges, setPermanentScheduleChanges] = useState<Map<string, Partial<ScheduleBlock>>>(new Map());

  const activeIssues = useMemo(() => {
    const issues: ActiveIssue[] = [];
    
    Object.entries(VESSEL_ISSUES).forEach(([mmsi, vesselData]) => {
      const criticalAndHighIssues = vesselData.issues.filter(
        i => i.pmPrediction.priority === 'critical' || i.pmPrediction.priority === 'high'
      );
      
      criticalAndHighIssues.forEach(issue => {
        const affectedProjects = getProjectsByVessel(mmsi)
          .filter(p => p.status === 'active')
          .map(p => {
            // Deterministic delay based on issue severity and project
            const baseDelay = issue.pmPrediction.priority === 'critical' ? 7 : 3;
            const healthPenalty = Math.floor((100 - issue.healthScore) / 20);
            const delayRisk = baseDelay + healthPenalty;
            const projectValue = p.value ? parseFloat(p.value.replace(/[^\d.]/g, '')) : 100;
            const financialRisk = `$${(projectValue * 0.02 * delayRisk / 7).toFixed(1)}M`;
            return {
              id: p.id,
              name: p.name,
              client: p.client,
              delayRisk,
              financialRisk,
            };
          });
        
        if (affectedProjects.length > 0) {
          issues.push({
            mmsi,
            vesselName: vesselData.vesselName,
            vesselType: vesselData.vesselType,
            issue,
            affectedProjects,
          });
        }
      });
    });
    
    return issues.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.issue.pmPrediction.priority] - priorityOrder[b.issue.pmPrediction.priority];
    });
  }, []);

  // Helper to generate deterministic "random" number from string
  const seededRandom = (seed: string): number => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash % 100) / 100;
  };

  const baseSchedule = useMemo((): ScheduleBlock[] => {
    const blocks: ScheduleBlock[] = [];
    
    NMDC_ENERGY_FLEET.forEach((vessel, idx) => {
      const projects = getProjectsByVessel(vessel.mmsi).filter(p => p.status === 'active');
      const vesselIssues = VESSEL_ISSUES[vessel.mmsi];
      const worstHealth = vesselIssues?.issues.reduce((min, i) => Math.min(min, i.healthScore), 100) || 100;
      
      if (projects.length > 0) {
        projects.forEach((project, pIdx) => {
          // Use deterministic duration based on vessel+project
          const seed = `${vessel.mmsi}-${project.id}-${pIdx}`;
          const duration = 25 + Math.floor(seededRandom(seed) * 20);
          
          blocks.push({
            vesselMMSI: vessel.mmsi,
            vesselName: vessel.name,
            projectId: project.id,
            projectName: project.name,
            startDay: pIdx * 5,
            duration,
            status: worstHealth < 65 ? 'affected' : 'active',
            health: worstHealth,
          });
        });
      } else {
        blocks.push({
          vesselMMSI: vessel.mmsi,
          vesselName: vessel.name,
          projectId: 'available',
          projectName: 'Available',
          startDay: 0,
          duration: 45,
          status: 'planned',
          health: worstHealth,
        });
      }
    });
    
    return blocks;
  }, []);

  // Calculate the display schedule based on permanent changes and current preview
  const displaySchedule = useMemo((): ScheduleBlock[] => {
    return baseSchedule.map(block => {
      // Check if there are permanent changes for this vessel
      const permanentChange = permanentScheduleChanges.get(block.vesselMMSI);
      let modifiedBlock = { ...block };
      
      if (permanentChange) {
        modifiedBlock = {
          ...modifiedBlock,
          ...permanentChange,
          startDay: modifiedBlock.startDay + (permanentChange.startDay || 0),
        };
      }
      
      // Apply preview for currently selected option (if not already executed)
      if (selectedOption && selectedIssue && !permanentScheduleChanges.has(selectedIssue.mmsi)) {
        const change = selectedOption.scheduleChange;
        
        if (block.vesselMMSI === selectedIssue.mmsi) {
          if (change.type === 'delay') {
            return {
              ...modifiedBlock,
              startDay: modifiedBlock.startDay + change.daysShift,
              status: 'affected' as const,
            };
          }
          if (change.type === 'swap' && change.swapWith) {
            return {
              ...modifiedBlock,
              status: 'maintenance' as const,
              projectName: 'Under Repair (Preview)',
              duration: change.daysShift,
            };
          }
        }
        
        if (change.type === 'swap' && change.swapWith === block.vesselMMSI) {
          const originalBlock = baseSchedule.find(b => b.vesselMMSI === selectedIssue.mmsi);
          return {
            ...modifiedBlock,
            projectId: originalBlock?.projectId || modifiedBlock.projectId,
            projectName: `${originalBlock?.projectName || modifiedBlock.projectName} (Preview)`,
            status: 'swapped' as const,
            startDay: modifiedBlock.startDay + 2,
          };
        }
      }
      
      return modifiedBlock;
    });
  }, [baseSchedule, selectedOption, selectedIssue, permanentScheduleChanges]);

  const generateOptions = (issue: ActiveIssue): OrchestrationOption[] => {
    const availableVessels = NMDC_ENERGY_FLEET.filter(v => {
      const vesselIssues = VESSEL_ISSUES[v.mmsi];
      if (!vesselIssues) return true;
      const hasCritical = vesselIssues.issues.some(i => i.pmPrediction.priority === 'critical');
      return !hasCritical && v.mmsi !== issue.mmsi && v.type === getNMDCVesselByMMSI(issue.mmsi)?.type;
    });
    
    const swapVessel = availableVessels[0];
    const isCritical = issue.issue.pmPrediction.priority === 'critical';
    const delayDays = issue.affectedProjects[0]?.delayRisk || 5;
    
    const options: OrchestrationOption[] = [
      {
        id: 'emergency-repair',
        title: 'Emergency Repair',
        description: `Expedite repair of ${issue.issue.equipmentName} with priority crew deployment`,
        icon: Wrench,
        timeImpact: isCritical ? '3-5 days downtime' : '1-2 days downtime',
        costImpact: isCritical ? '$150K-250K' : '$50K-100K',
        riskLevel: 'medium',
        pros: [
          'Fastest resolution for this vessel',
          'No impact on other projects',
          'Maintains client relationship',
        ],
        cons: [
          'Higher repair cost (overtime/expedited parts)',
          'Vessel offline during repair',
          isCritical ? 'May still cause 2-3 day delay' : 'Minor schedule adjustment needed',
        ],
        rippleEffects: [
          `${issue.vesselName} offline for repairs`,
          'Maintenance crew reassigned from scheduled work',
        ],
        scheduleChange: {
          type: 'delay',
          daysShift: isCritical ? 4 : 2,
          affectedVessels: [issue.mmsi],
        },
      },
    ];
    
    if (swapVessel) {
      options.push({
        id: 'swap-vessel',
        title: `Swap with ${swapVessel.name}`,
        description: `Reassign ${swapVessel.name} to take over from ${issue.vesselName}`,
        icon: ArrowRightLeft,
        timeImpact: '1-2 days mobilization',
        costImpact: '$80K-120K (mobilization)',
        riskLevel: 'low',
        pros: [
          'Minimal project delay',
          `${swapVessel.name} is healthy (no critical issues)`,
          'Allows proper repair scheduling',
        ],
        cons: [
          'Mobilization time and cost',
          `${swapVessel.name}'s current assignment affected`,
          'Crew transition needed',
        ],
        rippleEffects: [
          `${swapVessel.name} reassigned from current project`,
          `${issue.vesselName} moved to repair`,
          'Updated schedule notifications to all stakeholders',
        ],
        scheduleChange: {
          type: 'swap',
          daysShift: 5,
          affectedVessels: [issue.mmsi, swapVessel.mmsi],
          swapWith: swapVessel.mmsi,
        },
      });
    }
    
    options.push({
      id: 'reschedule',
      title: 'Reschedule Project Phase',
      description: `Delay affected project phase to accommodate repair window`,
      icon: Calendar,
      timeImpact: `${delayDays}-${delayDays + 3} days delay`,
      costImpact: issue.affectedProjects[0]?.financialRisk || '$2M+ (penalties)',
      riskLevel: 'high',
      pros: [
        'No additional operational cost',
        'Proper repair without rush',
        'Other projects unaffected',
      ],
      cons: [
        'Client notification required',
        'Potential contract penalties',
        'Reputation risk with client',
      ],
      rippleEffects: [
        `${issue.affectedProjects[0]?.client || 'Client'} notified of delay`,
        'Contract penalty clause may apply',
        'Weather window considerations',
      ],
      scheduleChange: {
        type: 'delay',
        daysShift: delayDays + 2,
        affectedVessels: [issue.mmsi],
      },
    });
    
    if (isCritical) {
      options.push({
        id: 'parallel-ops',
        title: 'Parallel Operations',
        description: 'Deploy backup equipment while primary is repaired onsite',
        icon: Zap,
        timeImpact: 'Minimal delay (hours)',
        costImpact: '$200K-300K (backup equipment)',
        riskLevel: 'medium',
        pros: [
          'Near-zero project delay',
          'Equipment repaired on-site',
          'Client relationship preserved',
        ],
        cons: [
          'Highest cost option',
          'Requires available backup equipment',
          'Complex logistics',
        ],
        rippleEffects: [
          'Backup equipment mobilized from yard',
          'Additional crew deployment',
          'Increased safety monitoring required',
        ],
        scheduleChange: {
          type: 'parallel',
          daysShift: 0,
          affectedVessels: [issue.mmsi],
        },
      });
    }
    
    return options;
  };

  const handleExecuteDecision = () => {
    if (selectedIssue && selectedOption) {
      const newDecision: ExecutedDecision = {
        issueId: `${selectedIssue.mmsi}-${selectedIssue.issue.equipmentName}`,
        issue: selectedIssue,
        option: selectedOption,
        executedAt: new Date(),
      };
      setExecutedDecisions(prev => [...prev, newDecision]);
      
      // Store permanent schedule changes
      const newChanges = new Map(permanentScheduleChanges);
      const change = selectedOption.scheduleChange;
      
      if (change.type === 'delay') {
        // Mark vessel as delayed but resolved
        newChanges.set(selectedIssue.mmsi, {
          startDay: change.daysShift, // This will be added to existing startDay
          status: 'active' as const,
        });
      } else if (change.type === 'swap' && change.swapWith) {
        // Original vessel goes to maintenance
        newChanges.set(selectedIssue.mmsi, {
          status: 'maintenance' as const,
          projectName: 'Under Repair',
          duration: change.daysShift,
        });
        // Swap vessel takes over
        newChanges.set(change.swapWith, {
          status: 'swapped' as const,
          startDay: 2, // mobilization time added
        });
      }
      
      setPermanentScheduleChanges(newChanges);
      setShowConfirmation(true);
      
      // Only hide confirmation after 3 seconds, keep the chart changes
      setTimeout(() => {
        setShowConfirmation(false);
        // Clear selection but keep the executed decision in the chart
        setSelectedIssue(null);
        setSelectedOption(null);
      }, 3000);
    }
  };
  
  const isIssueExecuted = (issue: ActiveIssue) => {
    return executedDecisions.some(
      d => d.issue.mmsi === issue.mmsi && d.issue.issue.equipmentName === issue.issue.equipmentName
    );
  };

  const totalDelayRisk = activeIssues.reduce((sum, issue) => 
    sum + issue.affectedProjects.reduce((s, p) => s + p.delayRisk, 0), 0
  );
  
  const totalFinancialRisk = activeIssues.reduce((sum, issue) => 
    sum + issue.affectedProjects.reduce((s, p) => {
      // Extract just the first number from financialRisk string like "$2.3M"
      const match = p.financialRisk.match(/[\d.]+/);
      return s + (match ? parseFloat(match[0]) : 0);
    }, 0), 0
  );
  
  // Format financial risk for display
  const formatFinancialRisk = (value: number): string => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}B`;
    }
    return `$${value.toFixed(1)}M`;
  };

  const daysToShow = 45;
  const dayWidth = 24;
  const rowHeight = 36;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-[1800px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Fleet Orchestration</h1>
                <p className="text-xs text-white/50">Issue → Impact → Decision → Execute</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span className="text-white/70">{activeIssues.length} Active Issues</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-white/70">{totalDelayRisk} days at risk</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-white/70">{formatFinancialRisk(totalFinancialRisk)} exposure</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-4">
        {/* Gantt Chart */}
        <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Fleet Schedule
              {selectedOption && (
                <span className="ml-2 px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-xs">
                  Preview: {selectedOption.title}
                </span>
              )}
              {executedDecisions.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">
                  {executedDecisions.length} decision{executedDecisions.length > 1 ? 's' : ''} applied
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartStartDay(chartStartDay - 7)}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-white/50 w-32 text-center">
                {new Date(Date.now() + chartStartDay * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' - '}
                {new Date(Date.now() + (chartStartDay + daysToShow) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <button
                onClick={() => setChartStartDay(chartStartDay + 7)}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Chart Legend */}
          <div className="flex items-center gap-4 mb-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500/60" />
              <span className="text-white/50">Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-rose-500/60" />
              <span className="text-white/50">At Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-500/60" />
              <span className="text-white/50">Maintenance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-cyan-500/60" />
              <span className="text-white/50">Swapped/Reassigned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white/20" />
              <span className="text-white/50">Available</span>
            </div>
          </div>
          
          {/* Chart */}
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Header row - days */}
              <div className="flex">
                <div className="w-32 flex-shrink-0" />
                <div className="flex">
                  {Array.from({ length: daysToShow }).map((_, i) => {
                    const date = new Date(Date.now() + (chartStartDay + i) * 24 * 60 * 60 * 1000);
                    const isToday = i === -chartStartDay;
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    return (
                      <div
                        key={i}
                        className={`text-center text-[10px] border-r border-white/5 ${
                          isToday ? 'bg-cyan-500/20 text-cyan-400' : isWeekend ? 'bg-white/[0.02] text-white/30' : 'text-white/40'
                        }`}
                        style={{ width: dayWidth }}
                      >
                        {i % 7 === 0 && (
                          <div className="font-medium">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Vessel rows */}
              {NMDC_ENERGY_FLEET.map((vessel, vesselIdx) => {
                const schedule = displaySchedule;
                const vesselBlocks = schedule.filter(b => b.vesselMMSI === vessel.mmsi);
                const isAffected = selectedIssue?.mmsi === vessel.mmsi;
                const isSwapTarget = selectedOption?.scheduleChange.swapWith === vessel.mmsi;
                const hasPermanentChange = permanentScheduleChanges.has(vessel.mmsi);
                const permanentChange = permanentScheduleChanges.get(vessel.mmsi);
                const isInMaintenance = permanentChange?.status === 'maintenance';
                const wasSwapped = permanentChange?.status === 'swapped';
                
                return (
                  <div
                    key={vessel.mmsi}
                    className={`flex border-b border-white/5 ${
                      isAffected ? 'bg-rose-500/10' : 
                      isSwapTarget ? 'bg-cyan-500/10' : 
                      isInMaintenance ? 'bg-amber-500/5' :
                      wasSwapped ? 'bg-cyan-500/5' : ''
                    }`}
                    style={{ height: rowHeight }}
                  >
                    {/* Vessel name */}
                    <div className={`w-32 flex-shrink-0 flex items-center px-2 text-xs font-medium border-r border-white/10 ${
                      isAffected ? 'text-rose-400' : 
                      isSwapTarget ? 'text-cyan-400' : 
                      isInMaintenance ? 'text-amber-400' :
                      wasSwapped ? 'text-cyan-400' : 'text-white/70'
                    }`}>
                      <button
                        onClick={() => router.push(`/vessel/${vessel.mmsi}`)}
                        className="hover:underline truncate"
                      >
                        {vessel.name}
                      </button>
                      {isAffected && <AlertTriangle className="w-3 h-3 ml-1 text-rose-400" />}
                      {isInMaintenance && <Wrench className="w-3 h-3 ml-1 text-amber-400" />}
                      {wasSwapped && <CheckCircle className="w-3 h-3 ml-1 text-cyan-400" />}
                    </div>
                    
                    {/* Timeline */}
                    <div className="relative flex-1" style={{ width: daysToShow * dayWidth }}>
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex">
                        {Array.from({ length: daysToShow }).map((_, i) => {
                          const isToday = i === -chartStartDay;
                          return (
                            <div
                              key={i}
                              className={`border-r ${isToday ? 'border-cyan-500/50' : 'border-white/5'}`}
                              style={{ width: dayWidth }}
                            />
                          );
                        })}
                      </div>
                      
                      {/* Blocks */}
                      {vesselBlocks.map((block, blockIdx) => {
                        const left = Math.max(0, (block.startDay - chartStartDay)) * dayWidth;
                        const visibleStart = Math.max(chartStartDay, block.startDay);
                        const visibleEnd = Math.min(chartStartDay + daysToShow, block.startDay + block.duration);
                        const width = Math.max(0, visibleEnd - visibleStart) * dayWidth;
                        
                        if (width <= 0) return null;
                        
                        let bgColor = 'bg-emerald-500/60';
                        if (block.status === 'affected') bgColor = 'bg-rose-500/60';
                        else if (block.status === 'maintenance') bgColor = 'bg-amber-500/60';
                        else if (block.status === 'swapped') bgColor = 'bg-cyan-500/60';
                        else if (block.status === 'planned') bgColor = 'bg-white/20';
                        
                        return (
                          <div
                            key={blockIdx}
                            className={`absolute top-1 bottom-1 rounded ${bgColor} flex items-center px-2 text-[10px] font-medium text-white truncate transition-all duration-300`}
                            style={{
                              left,
                              width,
                            }}
                            title={`${block.projectName} (${block.duration} days)`}
                          >
                            {width > 60 && block.projectName}
                            {block.health && block.health < 70 && (
                              <span className="ml-1 text-rose-300">({block.health}%)</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3 Column Layout */}
        <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 420px)' }}>
          
          {/* Column 1: Active Issues */}
          <div className="col-span-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Issues Requiring Action
              </h2>
              <span className="text-xs text-white/40">{activeIssues.length} issues</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {activeIssues.length === 0 ? (
                <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <h3 className="font-medium text-emerald-300">All Clear</h3>
                  <p className="text-xs text-white/50 mt-1">No critical issues affecting projects</p>
                </div>
              ) : (
                activeIssues.map((issue, idx) => {
                  const isExecuted = isIssueExecuted(issue);
                  const isSelected = selectedIssue?.mmsi === issue.mmsi && 
                                    selectedIssue?.issue.equipmentName === issue.issue.equipmentName;
                  
                  return (
                    <button
                      key={`${issue.mmsi}-${idx}`}
                      onClick={() => {
                        setSelectedIssue(issue);
                        setSelectedOption(null);
                      }}
                      disabled={isExecuted}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isExecuted
                          ? 'opacity-50 border-emerald-500/30 bg-emerald-500/5'
                          : isSelected
                          ? 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30'
                          : issue.issue.pmPrediction.priority === 'critical'
                          ? 'border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20'
                          : 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20'
                      }`}
                    >
                      {isExecuted && (
                        <div className="flex items-center gap-1 text-emerald-400 text-[10px] mb-1">
                          <CheckCircle className="w-3 h-3" />
                          Resolved: {executedDecisions.find(d => 
                            d.issue.mmsi === issue.mmsi && d.issue.issue.equipmentName === issue.issue.equipmentName
                          )?.option.title || 'Decision Executed'}
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <Ship className="w-3 h-3 text-white/60" />
                          <span className="text-sm font-medium">{issue.vesselName}</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          issue.issue.pmPrediction.priority === 'critical' 
                            ? 'bg-rose-500/30 text-rose-300' 
                            : 'bg-amber-500/30 text-amber-300'
                        }`}>
                          {issue.issue.pmPrediction.priority}
                        </span>
                      </div>
                      
                      <div className="text-xs text-white/80 mb-1">
                        {issue.issue.equipmentName}: {issue.issue.pmPrediction.predictedIssue}
                      </div>
                      
                      <div className="text-[10px] text-white/50 mb-2">
                        Health: {issue.issue.healthScore}%
                      </div>
                      
                      <div className="border-t border-white/10 pt-2">
                        {issue.affectedProjects.slice(0, 1).map(proj => (
                          <div key={proj.id} className="flex items-center justify-between text-[10px]">
                            <span className="text-white/60 truncate">{proj.name}</span>
                            <span className={`ml-2 ${
                              issue.issue.pmPrediction.priority === 'critical' ? 'text-rose-400' : 'text-amber-400'
                            }`}>
                              {proj.delayRisk}d • {proj.financialRisk}
                            </span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Column 2: Orchestration Options */}
          <div className="col-span-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                Orchestration Options
              </h2>
            </div>
            
            {!selectedIssue ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-6">
                  <ChevronRight className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <h3 className="text-sm text-white/40 mb-1">Select an Issue</h3>
                  <p className="text-xs text-white/30">Click an issue to see options</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Ship className="w-4 h-4 text-cyan-400" />
                    <span className="font-medium">{selectedIssue.vesselName}</span>
                    <button
                      onClick={() => router.push(`/vessel/${selectedIssue.mmsi}`)}
                      className="ml-auto text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      Details <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    {selectedIssue.issue.equipmentName} • {selectedIssue.issue.healthScore}%
                  </div>
                </div>
                
                {generateOptions(selectedIssue).map(option => {
                  const Icon = option.icon;
                  const isSelected = selectedOption?.id === option.id;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedOption(option)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`p-1.5 rounded ${isSelected ? 'bg-cyan-500/20' : 'bg-white/10'}`}>
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-white/60'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-sm font-medium truncate">{option.title}</h4>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase ml-2 ${
                              option.riskLevel === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
                              option.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-rose-500/20 text-rose-400'
                            }`}>
                              {option.riskLevel}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/50 mb-2 line-clamp-2">{option.description}</p>
                          
                          <div className="flex items-center gap-3 text-[10px]">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-white/40" />
                              <span className="text-white/60">{option.timeImpact}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-white/40" />
                              <span className="text-white/60">{option.costImpact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-[10px]">
                          <div>
                            <div className="text-emerald-400 font-medium mb-1">✓ Pros</div>
                            <ul className="space-y-0.5">
                              {option.pros.slice(0, 2).map((pro, i) => (
                                <li key={i} className="text-white/50 truncate">• {pro}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="text-rose-400 font-medium mb-1">✗ Cons</div>
                            <ul className="space-y-0.5">
                              {option.cons.slice(0, 2).map((con, i) => (
                                <li key={i} className="text-white/50 truncate">• {con}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Column 3: Impact & Execute */}
          <div className="col-span-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-violet-400" />
                Impact & Execute
              </h2>
            </div>
            
            {!selectedOption ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-6">
                  <ChevronRight className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <h3 className="text-sm text-white/40 mb-1">Select an Option</h3>
                  <p className="text-xs text-white/30">Choose an option to see impact</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {/* Summary */}
                  <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <selectedOption.icon className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-medium">{selectedOption.title}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-white/40 text-[10px]">Time</div>
                        <div>{selectedOption.timeImpact}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-[10px]">Cost</div>
                        <div>{selectedOption.costImpact}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Schedule Impact */}
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-cyan-400" />
                      Schedule Impact
                    </h4>
                    <div className="text-xs space-y-1">
                      {selectedOption.scheduleChange.type === 'delay' && (
                        <div className="text-amber-400">
                          ⏱ {selectedIssue?.vesselName} delayed by {selectedOption.scheduleChange.daysShift} days
                        </div>
                      )}
                      {selectedOption.scheduleChange.type === 'swap' && (
                        <>
                          <div className="text-cyan-400">
                            🔄 {getNMDCVesselByMMSI(selectedOption.scheduleChange.swapWith!)?.name} takes over project
                          </div>
                          <div className="text-amber-400">
                            🔧 {selectedIssue?.vesselName} moves to repair ({selectedOption.scheduleChange.daysShift} days)
                          </div>
                        </>
                      )}
                      {selectedOption.scheduleChange.type === 'parallel' && (
                        <div className="text-emerald-400">
                          ⚡ Minimal impact - parallel operations
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Ripple Effects */}
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                      <RefreshCw className="w-3 h-3 text-amber-400" />
                      Ripple Effects
                    </h4>
                    <ul className="space-y-1">
                      {selectedOption.rippleEffects.map((effect, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[10px]">
                          <ChevronRight className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          <span className="text-white/60">{effect}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Actions */}
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                      <FileText className="w-3 h-3 text-emerald-400" />
                      Actions Generated
                    </h4>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex items-center gap-1.5 p-1.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        Work Order #WO-{selectedIssue?.mmsi.slice(-4)}-{selectedOption?.id.slice(0, 3).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-1.5 p-1.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                        <CheckCircle className="w-3 h-3 text-cyan-400" />
                        Schedule Update Notification
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Execute Button */}
                <div className="pt-3 border-t border-white/10 mt-3">
                  {showConfirmation ? (
                    <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-center">
                      <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                      <h4 className="text-sm font-medium text-emerald-300">Decision Executed</h4>
                      <p className="text-[10px] text-white/50">Notifications sent</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleExecuteDecision}
                      className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Execute Decision
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
