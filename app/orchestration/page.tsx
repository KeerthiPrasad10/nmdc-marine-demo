// @ts-nocheck - Orchestration page with decision workflow
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EXELON_ASSETS } from '@/lib/exelon/fleet';
import { ASSET_ISSUES, getAssetIssueSummary, ComponentIssue } from '@/lib/asset-issues';
import { GRID_PROGRAMS, getProgramsByAsset, GridProgram } from '@/lib/exelon/projects';
import {
  ArrowLeft,
  AlertTriangle,
  Zap,
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
  TrendingDown,
  Target,
  ChevronLeft,
  Truck,
  ShieldAlert,
  Activity,
} from 'lucide-react';

interface OrchestrationOption {
  id: string;
  title: string;
  description: string;
  icon: typeof Zap;
  timeImpact: string;
  costImpact: string;
  riskLevel: 'low' | 'medium' | 'high';
  pros: string[];
  cons: string[];
  rippleEffects: string[];
  scheduleChange: {
    type: 'delay' | 'swap' | 'parallel' | 'none';
    daysShift: number;
    affectedAssets: string[];
    swapWith?: string;
  };
}

interface ActiveIssue {
  assetTag: string;
  assetName: string;
  assetType: string;
  opCo: string;
  issue: ComponentIssue;
  affectedPrograms: Array<{
    id: string;
    name: string;
    sponsor: string;
    delayRisk: number;
    financialRisk: string;
    customersImpacted: number;
  }>;
}

interface ScheduleBlock {
  assetTag: string;
  assetName: string;
  programId: string;
  programName: string;
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
    
    Object.entries(ASSET_ISSUES).forEach(([assetTag, assetData]) => {
      const criticalAndHigh = assetData.issues.filter(
        i => i.pmPrediction.priority === 'critical' || i.pmPrediction.priority === 'high'
      );
      
      criticalAndHigh.forEach(issue => {
        const affectedPrograms = getProgramsByAsset(assetTag)
          .filter(p => p.status === 'active')
          .map(p => {
            const baseDelay = issue.pmPrediction.priority === 'critical' ? 14 : 5;
            const healthPenalty = Math.floor((100 - issue.healthScore) / 15);
            const delayRisk = baseDelay + healthPenalty;
            const budgetMatch = p.budget?.match(/\$([\d.]+)([BM])/);
            const budgetM = budgetMatch
              ? parseFloat(budgetMatch[1]) * (budgetMatch[2] === 'B' ? 1000 : 1)
              : 100;
            const financialRisk = `$${(budgetM * 0.005 * delayRisk / 7).toFixed(1)}M`;
            return {
              id: p.id,
              name: p.name,
              sponsor: p.sponsor,
              delayRisk,
              financialRisk,
              customersImpacted: p.customersImpacted,
            };
          });
        
        if (affectedPrograms.length > 0) {
          issues.push({
            assetTag,
            assetName: assetData.assetName,
            assetType: assetData.assetType,
            opCo: assetData.opCo,
            issue,
            affectedPrograms,
          });
        }
      });
    });
    
    return issues.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.issue.pmPrediction.priority] - priorityOrder[b.issue.pmPrediction.priority];
    });
  }, []);

  // Deterministic pseudo-random from string
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
    
    EXELON_ASSETS.forEach((asset) => {
      const programs = getProgramsByAsset(asset.assetTag).filter(p => p.status === 'active');
      const summary = getAssetIssueSummary(asset.assetTag);
      const worstHealth = summary.worstHealth;
      
      if (programs.length > 0) {
        programs.forEach((program, pIdx) => {
          const seed = `${asset.assetTag}-${program.id}-${pIdx}`;
          const duration = 30 + Math.floor(seededRandom(seed) * 25);
          
          blocks.push({
            assetTag: asset.assetTag,
            assetName: asset.name,
            programId: program.id,
            programName: program.name,
            startDay: pIdx * 5,
            duration,
            status: worstHealth < 60 ? 'affected' : 'active',
            health: worstHealth,
          });
        });
      } else {
        blocks.push({
          assetTag: asset.assetTag,
          assetName: asset.name,
          programId: 'standby',
          programName: 'Normal Operations',
          startDay: 0,
          duration: 45,
          status: 'planned',
          health: worstHealth,
        });
      }
    });
    
    return blocks;
  }, []);

  // Display schedule with permanent changes + preview
  const displaySchedule = useMemo((): ScheduleBlock[] => {
    return baseSchedule.map(block => {
      const permanentChange = permanentScheduleChanges.get(block.assetTag);
      let modifiedBlock = { ...block };
      
      if (permanentChange) {
        modifiedBlock = {
          ...modifiedBlock,
          ...permanentChange,
          startDay: modifiedBlock.startDay + (permanentChange.startDay || 0),
        };
      }
      
      // Preview for currently selected option
      if (selectedOption && selectedIssue && !permanentScheduleChanges.has(selectedIssue.assetTag)) {
        const change = selectedOption.scheduleChange;
        
        if (block.assetTag === selectedIssue.assetTag) {
          if (change.type === 'delay') {
            return { ...modifiedBlock, startDay: modifiedBlock.startDay + change.daysShift, status: 'affected' as const };
          }
          if (change.type === 'swap' && change.swapWith) {
            return { ...modifiedBlock, status: 'maintenance' as const, programName: 'Under Repair (Preview)', duration: change.daysShift };
          }
        }
        
        if (change.type === 'swap' && change.swapWith === block.assetTag) {
          const originalBlock = baseSchedule.find(b => b.assetTag === selectedIssue.assetTag);
          return {
            ...modifiedBlock,
            programId: originalBlock?.programId || modifiedBlock.programId,
            programName: `${originalBlock?.programName || modifiedBlock.programName} (Preview)`,
            status: 'swapped' as const,
            startDay: modifiedBlock.startDay + 2,
          };
        }
      }
      
      return modifiedBlock;
    });
  }, [baseSchedule, selectedOption, selectedIssue, permanentScheduleChanges]);

  const getAssetByTag = (tag: string) => EXELON_ASSETS.find(a => a.assetTag === tag);

  const generateOptions = (issue: ActiveIssue): OrchestrationOption[] => {
    // Find a healthy asset of the same type (same OpCo preferred) to swap with
    const availableAssets = EXELON_ASSETS.filter(a => {
      const summary = getAssetIssueSummary(a.assetTag);
      const hasCritical = summary.hasCritical;
      return !hasCritical && a.assetTag !== issue.assetTag && a.type === issue.assetType && a.opCo === issue.opCo;
    });
    
    const swapAsset = availableAssets[0];
    const isCritical = issue.issue.pmPrediction.priority === 'critical';
    const delayDays = issue.affectedPrograms[0]?.delayRisk || 7;
    const customersAtRisk = issue.issue.pmPrediction.customersAtRisk || 50000;
    
    const options: OrchestrationOption[] = [
      {
        id: 'emergency-repair',
        title: 'Emergency Crew Dispatch',
        description: `Deploy lineworker crew for emergency ${issue.issue.componentName} repair at ${issue.assetName}`,
        icon: Truck,
        timeImpact: isCritical ? '5-10 days outage window' : '2-4 days maintenance window',
        costImpact: isCritical ? '$250K-500K (emergency parts + overtime)' : '$75K-150K',
        riskLevel: 'medium',
        pros: [
          'Fastest resolution for this asset',
          'No impact on other programs',
          `Maintains ${customersAtRisk.toLocaleString()} customer reliability`,
        ],
        cons: [
          'Higher repair cost (overtime + expedited parts)',
          'Requires planned outage coordination',
          isCritical ? 'May still cause 3-5 day partial outage' : 'Minor switching required',
        ],
        rippleEffects: [
          `${issue.assetName} offline for repairs — load transfer to adjacent feeders`,
          'Lineworker crew reassigned from scheduled maintenance',
          `${issue.opCo} dispatch center notified`,
        ],
        scheduleChange: {
          type: 'delay',
          daysShift: isCritical ? 7 : 3,
          affectedAssets: [issue.assetTag],
        },
      },
    ];
    
    if (swapAsset) {
      options.push({
        id: 'load-transfer',
        title: `Load Transfer to ${swapAsset.name}`,
        description: `Transfer load from ${issue.assetName} to ${swapAsset.name} while performing repair`,
        icon: ArrowRightLeft,
        timeImpact: '2-4 hours switchover',
        costImpact: '$30K-50K (switching operations)',
        riskLevel: 'low',
        pros: [
          'Near-zero customer outage',
          `${swapAsset.name} is healthy (no critical issues)`,
          'Allows proper maintenance window',
        ],
        cons: [
          `${swapAsset.name} operates at higher load factor`,
          'Reduced N-1 contingency during transfer',
          'Requires switching coordination with PJM',
        ],
        rippleEffects: [
          `${swapAsset.name} assumes additional load`,
          `${issue.assetName} de-energized for maintenance`,
          `PJM & ${issue.opCo} control room notified`,
        ],
        scheduleChange: {
          type: 'swap',
          daysShift: 8,
          affectedAssets: [issue.assetTag, swapAsset.assetTag],
          swapWith: swapAsset.assetTag,
        },
      });
    }
    
    options.push({
      id: 'defer-program',
      title: 'Defer Program Phase',
      description: 'Delay affected program phase to accommodate extended repair window',
      icon: Calendar,
      timeImpact: `${delayDays}-${delayDays + 5} days delay`,
      costImpact: issue.affectedPrograms[0]?.financialRisk || '$2M+ (schedule overrun)',
      riskLevel: 'high',
      pros: [
        'No additional operational cost',
        'Thorough repair without rush',
        'Other assets unaffected',
      ],
      cons: [
        'Program timeline impacted',
        'Rate case commitments at risk',
        `${customersAtRisk.toLocaleString()} customers exposed longer`,
      ],
      rippleEffects: [
        `${issue.affectedPrograms[0]?.sponsor || issue.opCo} program office notified`,
        'Regulatory filing may need amendment',
        `SAIDI/SAIFI impact: +${(delayDays * 0.3).toFixed(1)} minutes`,
      ],
      scheduleChange: {
        type: 'delay',
        daysShift: delayDays + 3,
        affectedAssets: [issue.assetTag],
      },
    });
    
    if (isCritical) {
      options.push({
        id: 'mobile-substation',
        title: 'Deploy Mobile Substation',
        description: 'Deploy mobile transformer/substation while primary unit is repaired or replaced',
        icon: Zap,
        timeImpact: '24-48 hours to deploy',
        costImpact: '$300K-500K (mobilization + rental)',
        riskLevel: 'medium',
        pros: [
          'Near-zero customer outage',
          'Full repair without time pressure',
          'Maintains N-1 reliability standard',
        ],
        cons: [
          'Highest cost option',
          'Requires available mobile unit (limited fleet)',
          'Site preparation needed',
        ],
        rippleEffects: [
          'Mobile transformer mobilized from storage yard',
          'Site prep crew deployed for pad/connections',
          'Insurance/permit coordination required',
        ],
        scheduleChange: {
          type: 'parallel',
          daysShift: 0,
          affectedAssets: [issue.assetTag],
        },
      });
    }
    
    return options;
  };

  const handleExecuteDecision = () => {
    if (selectedIssue && selectedOption) {
      const newDecision: ExecutedDecision = {
        issueId: `${selectedIssue.assetTag}-${selectedIssue.issue.componentName}`,
        issue: selectedIssue,
        option: selectedOption,
        executedAt: new Date(),
      };
      setExecutedDecisions(prev => [...prev, newDecision]);
      
      const newChanges = new Map(permanentScheduleChanges);
      const change = selectedOption.scheduleChange;
      
      if (change.type === 'delay') {
        newChanges.set(selectedIssue.assetTag, { startDay: change.daysShift, status: 'active' as const });
      } else if (change.type === 'swap' && change.swapWith) {
        newChanges.set(selectedIssue.assetTag, { status: 'maintenance' as const, programName: 'Under Repair', duration: change.daysShift });
        newChanges.set(change.swapWith, { status: 'swapped' as const, startDay: 2 });
      }
      
      setPermanentScheduleChanges(newChanges);
      setShowConfirmation(true);
      
      setTimeout(() => {
        setShowConfirmation(false);
        setSelectedIssue(null);
        setSelectedOption(null);
      }, 3000);
    }
  };
  
  const isIssueExecuted = (issue: ActiveIssue) => {
    return executedDecisions.some(
      d => d.issue.assetTag === issue.assetTag && d.issue.issue.componentName === issue.issue.componentName
    );
  };

  const totalDelayRisk = activeIssues.reduce((sum, issue) => 
    sum + issue.affectedPrograms.reduce((s, p) => s + p.delayRisk, 0), 0
  );
  
  const totalFinancialRisk = activeIssues.reduce((sum, issue) => 
    sum + issue.affectedPrograms.reduce((s, p) => {
      const match = p.financialRisk.match(/[\d.]+/);
      return s + (match ? parseFloat(match[0]) : 0);
    }, 0), 0
  );
  
  const totalCustomersAtRisk = activeIssues.reduce((sum, issue) =>
    sum + (issue.issue.pmPrediction.customersAtRisk || 0), 0
  );
  
  const formatFinancialRisk = (value: number): string => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
    return `$${value.toFixed(1)}M`;
  };

  const daysToShow = 45;
  const dayWidth = 24;
  const rowHeight = 36;

  // Only show assets that have programs or issues (limit for chart clarity)
  const chartAssets = useMemo(() => {
    const relevantTags = new Set<string>();
    displaySchedule.forEach(b => relevantTags.add(b.assetTag));
    return EXELON_ASSETS.filter(a => relevantTags.has(a.assetTag));
  }, [displaySchedule]);

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
                <h1 className="text-xl font-bold">Grid Dispatch & Orchestration</h1>
                <p className="text-xs text-white/50">Issue → Impact → Decision → Dispatch</p>
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
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="text-white/70">{(totalCustomersAtRisk / 1000).toFixed(0)}K customers exposed</span>
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
              Asset & Program Schedule
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
              <button onClick={() => setChartStartDay(chartStartDay - 7)} className="p-1.5 rounded bg-white/5 hover:bg-white/10">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-white/50 w-32 text-center">
                {new Date(Date.now() + chartStartDay * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' - '}
                {new Date(Date.now() + (chartStartDay + daysToShow) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <button onClick={() => setChartStartDay(chartStartDay + 7)} className="p-1.5 rounded bg-white/5 hover:bg-white/10">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-4 mb-3 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500/60" /><span className="text-white/50">Active</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-500/60" /><span className="text-white/50">At Risk</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500/60" /><span className="text-white/50">Maintenance</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-cyan-500/60" /><span className="text-white/50">Load Transfer</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-white/20" /><span className="text-white/50">Normal Ops</span></div>
          </div>
          
          {/* Chart */}
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Header row */}
              <div className="flex">
                <div className="w-40 flex-shrink-0" />
                <div className="flex">
                  {Array.from({ length: daysToShow }).map((_, i) => {
                    const date = new Date(Date.now() + (chartStartDay + i) * 86400000);
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
                          <div className="font-medium">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Asset rows */}
              {chartAssets.map((asset) => {
                const assetBlocks = displaySchedule.filter(b => b.assetTag === asset.assetTag);
                const isAffected = selectedIssue?.assetTag === asset.assetTag;
                const isSwapTarget = selectedOption?.scheduleChange.swapWith === asset.assetTag;
                const permanentChange = permanentScheduleChanges.get(asset.assetTag);
                const isInMaintenance = permanentChange?.status === 'maintenance';
                const wasSwapped = permanentChange?.status === 'swapped';
                
                return (
                  <div
                    key={asset.assetTag}
                    className={`flex border-b border-white/5 ${
                      isAffected ? 'bg-rose-500/10' : 
                      isSwapTarget ? 'bg-cyan-500/10' : 
                      isInMaintenance ? 'bg-amber-500/5' :
                      wasSwapped ? 'bg-cyan-500/5' : ''
                    }`}
                    style={{ height: rowHeight }}
                  >
                    <div className={`w-40 flex-shrink-0 flex items-center px-2 text-xs font-medium border-r border-white/10 ${
                      isAffected ? 'text-rose-400' : 
                      isSwapTarget ? 'text-cyan-400' : 
                      isInMaintenance ? 'text-amber-400' :
                      wasSwapped ? 'text-cyan-400' : 'text-white/70'
                    }`}>
                      <button
                        onClick={() => router.push(`/vessel/${asset.assetTag}`)}
                        className="hover:underline truncate text-left"
                      >
                        {asset.name}
                      </button>
                      {isAffected && <AlertTriangle className="w-3 h-3 ml-1 text-rose-400 flex-shrink-0" />}
                      {isInMaintenance && <Wrench className="w-3 h-3 ml-1 text-amber-400 flex-shrink-0" />}
                      {wasSwapped && <CheckCircle className="w-3 h-3 ml-1 text-cyan-400 flex-shrink-0" />}
                    </div>
                    
                    <div className="relative flex-1" style={{ width: daysToShow * dayWidth }}>
                      <div className="absolute inset-0 flex">
                        {Array.from({ length: daysToShow }).map((_, i) => {
                          const isToday = i === -chartStartDay;
                          return <div key={i} className={`border-r ${isToday ? 'border-cyan-500/50' : 'border-white/5'}`} style={{ width: dayWidth }} />;
                        })}
                      </div>
                      
                      {assetBlocks.map((block, blockIdx) => {
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
                            style={{ left, width }}
                            title={`${block.programName} (${block.duration} days)`}
                          >
                            {width > 60 && block.programName}
                            {block.health && block.health < 60 && <span className="ml-1 text-rose-300">({block.health}%)</span>}
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
                  <p className="text-xs text-white/50 mt-1">No critical issues affecting programs</p>
                </div>
              ) : (
                activeIssues.map((issue, idx) => {
                  const isExecuted = isIssueExecuted(issue);
                  const isSelected = selectedIssue?.assetTag === issue.assetTag && 
                                    selectedIssue?.issue.componentName === issue.issue.componentName;
                  
                  return (
                    <button
                      key={`${issue.assetTag}-${idx}`}
                      onClick={() => { setSelectedIssue(issue); setSelectedOption(null); }}
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
                            d.issue.assetTag === issue.assetTag && d.issue.issue.componentName === issue.issue.componentName
                          )?.option.title || 'Decision Executed'}
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3 h-3 text-white/60" />
                          <span className="text-sm font-medium">{issue.assetName}</span>
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
                        {issue.issue.componentName}: {issue.issue.pmPrediction.predictedIssue}
                      </div>
                      
                      <div className="flex items-center gap-2 text-[10px] text-white/50 mb-2">
                        <span>Health: {issue.issue.healthScore}%</span>
                        <span>•</span>
                        <span>{issue.opCo}</span>
                        {issue.issue.pmPrediction.customersAtRisk && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400">{(issue.issue.pmPrediction.customersAtRisk / 1000).toFixed(0)}K customers</span>
                          </>
                        )}
                      </div>
                      
                      <div className="border-t border-white/10 pt-2">
                        {issue.affectedPrograms.slice(0, 1).map(prog => (
                          <div key={prog.id} className="flex items-center justify-between text-[10px]">
                            <span className="text-white/60 truncate">{prog.name}</span>
                            <span className={`ml-2 ${
                              issue.issue.pmPrediction.priority === 'critical' ? 'text-rose-400' : 'text-amber-400'
                            }`}>
                              {prog.delayRisk}d • {prog.financialRisk}
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
          
          {/* Column 2: Options */}
          <div className="col-span-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                Dispatch Options
              </h2>
            </div>
            
            {!selectedIssue ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-6">
                  <ChevronRight className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <h3 className="text-sm text-white/40 mb-1">Select an Issue</h3>
                  <p className="text-xs text-white/30">Click an issue to see dispatch options</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="font-medium">{selectedIssue.assetName}</span>
                    <button
                      onClick={() => router.push(`/vessel/${selectedIssue.assetTag}`)}
                      className="ml-auto text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      Details <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    {selectedIssue.issue.componentName} • {selectedIssue.issue.healthScore}% • {selectedIssue.opCo}
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
                  <p className="text-xs text-white/30">Choose a dispatch option to see impact</p>
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
                        <div className="text-white/40 text-[10px]">Outage Window</div>
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
                          ⏱ {selectedIssue?.assetName} program delayed by {selectedOption.scheduleChange.daysShift} days
                        </div>
                      )}
                      {selectedOption.scheduleChange.type === 'swap' && (
                        <>
                          <div className="text-cyan-400">
                            🔄 {getAssetByTag(selectedOption.scheduleChange.swapWith!)?.name} assumes load
                          </div>
                          <div className="text-amber-400">
                            🔧 {selectedIssue?.assetName} de-energized for repair ({selectedOption.scheduleChange.daysShift} days)
                          </div>
                        </>
                      )}
                      {selectedOption.scheduleChange.type === 'parallel' && (
                        <div className="text-emerald-400">
                          ⚡ Minimal impact — mobile substation deployed
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
                  
                  {/* Actions Generated */}
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                      <FileText className="w-3 h-3 text-emerald-400" />
                      Actions Generated
                    </h4>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex items-center gap-1.5 p-1.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        Work Order #WO-{selectedIssue?.assetTag.slice(-3)}-{selectedOption?.id.slice(0, 3).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-1.5 p-1.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                        <CheckCircle className="w-3 h-3 text-cyan-400" />
                        Crew Dispatch Notification
                      </div>
                      <div className="flex items-center gap-1.5 p-1.5 rounded bg-blue-500/10 border border-blue-500/30">
                        <CheckCircle className="w-3 h-3 text-blue-400" />
                        OMS/SCADA Switching Order
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Execute Button */}
                <div className="pt-3 border-t border-white/10 mt-3">
                  {showConfirmation ? (
                    <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-center">
                      <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                      <h4 className="text-sm font-medium text-emerald-300">Dispatch Executed</h4>
                      <p className="text-[10px] text-white/50">Crews notified · SCADA updated</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleExecuteDecision}
                      className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Execute & Dispatch
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
