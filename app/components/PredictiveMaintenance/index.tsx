// @ts-nocheck — PM component being re-themed; legacy marine types pending migration
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Brain,
  Activity,
  FileText,
  ClipboardList,
  Ship,
  Cloud,
  Eye,
  Droplets,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingDown,
  TrendingUp,
  Wrench,
  DollarSign,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Zap,
  Target,
  Shield,
  Package,
  X,
  Gauge,
  Thermometer,
  Waves,
  Calendar,
  History,
  BarChart3,
  Users,
  Settings,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Info,
  FlaskConical,
  Cpu,
  Download,
  Printer,
  Hash,
  User,
  Building,
  MapPin,
} from 'lucide-react'
import {
  PMAnalysis,
  PMAnalysisRequest,
  PMDataSource,
  PMPrediction,
  PMReasoningStep,
  PMSourceContribution,
  PMEquipmentType,
  PMAssetType,
  PMWorkOrder,
  PMFleetPattern,
  PMInspectionRecord,
  PMOilAnalysis,
} from '@/lib/predictive-maintenance/types'
import { analyzeEquipment, DATA_SOURCES } from '@/lib/predictive-maintenance/analyzer'
import { getOEMProfile, getWearPercentage } from '@/lib/predictive-maintenance/oem-specs'
import { getWorkOrderHistory, getFleetPatterns, getInspectionRecords, getOilAnalysisRecords } from '@/lib/predictive-maintenance/history'

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  Activity: <Activity className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  ClipboardList: <ClipboardList className="w-4 h-4" />,
  Ship: <Ship className="w-4 h-4" />,
  Cloud: <Cloud className="w-4 h-4" />,
  Eye: <Eye className="w-4 h-4" />,
  Droplets: <Droplets className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
}

interface LiveDataStream {
  id: string
  name: string
  value: number
  unit: string
  status: 'normal' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  threshold: { min: number; max: number }
  history: number[]
}

function generateLiveDataStreams(equipmentType: PMEquipmentType, currentHealth: number): LiveDataStream[] {
  const streams: LiveDataStream[] = []
  const profile = getOEMProfile(equipmentType)
  
  const baseVibration = 1 + (100 - currentHealth) * 0.05
  const baseTemp = 45 + (100 - currentHealth) * 0.4

  streams.push({
    id: 'vibration',
    name: 'Vibration',
    value: Math.round((baseVibration + Math.random() * 0.5) * 100) / 100,
    unit: 'mm/s',
    status: baseVibration > (profile.specs.maxVibration || 4) * 0.8 ? 'warning' : 'normal',
    trend: currentHealth < 70 ? 'up' : 'stable',
    threshold: { min: 0, max: profile.specs.maxVibration || 5 },
    history: Array.from({ length: 20 }, () => Math.round((baseVibration + (Math.random() - 0.5) * 0.8) * 100) / 100),
  })

  streams.push({
    id: 'temperature',
    name: 'Temperature',
    value: Math.round((baseTemp + Math.random() * 5) * 10) / 10,
    unit: '°C',
    status: baseTemp > (profile.specs.maxTemperature || 80) * 0.85 ? 'warning' : 'normal',
    trend: currentHealth < 60 ? 'up' : 'stable',
    threshold: { min: 20, max: profile.specs.maxTemperature || 85 },
    history: Array.from({ length: 20 }, () => Math.round((baseTemp + (Math.random() - 0.5) * 8) * 10) / 10),
  })

  if (equipmentType === 'main_engine' || equipmentType === 'generator') {
    streams.push({
      id: 'rpm',
      name: 'RPM',
      value: Math.round(1200 + Math.random() * 100),
      unit: 'rpm',
      status: 'normal',
      trend: 'stable',
      threshold: { min: 800, max: 1800 },
      history: Array.from({ length: 20 }, () => Math.round(1200 + (Math.random() - 0.5) * 150)),
    })

    streams.push({
      id: 'fuel_rate',
      name: 'Fuel Rate',
      value: Math.round((85 + Math.random() * 15) * 10) / 10,
      unit: 'L/hr',
      status: 'normal',
      trend: currentHealth < 75 ? 'up' : 'stable',
      threshold: { min: 50, max: 120 },
      history: Array.from({ length: 20 }, () => Math.round((85 + (Math.random() - 0.5) * 20) * 10) / 10),
    })
  }

  if (equipmentType === 'pump_system') {
    streams.push({
      id: 'flow_rate',
      name: 'Flow Rate',
      value: Math.round((currentHealth / 100) * 4500 + Math.random() * 200),
      unit: 'm³/hr',
      status: currentHealth < 70 ? 'warning' : 'normal',
      trend: currentHealth < 70 ? 'down' : 'stable',
      threshold: { min: 3000, max: 5000 },
      history: Array.from({ length: 20 }, () => Math.round((currentHealth / 100) * 4500 + (Math.random() - 0.5) * 400)),
    })

    streams.push({
      id: 'pressure',
      name: 'Discharge Pressure',
      value: Math.round((3.5 + Math.random() * 0.5) * 10) / 10,
      unit: 'bar',
      status: 'normal',
      trend: 'stable',
      threshold: { min: 2.5, max: 5 },
      history: Array.from({ length: 20 }, () => Math.round((3.5 + (Math.random() - 0.5) * 0.8) * 10) / 10),
    })
  }

  if (equipmentType === 'hydraulic_system') {
    streams.push({
      id: 'system_pressure',
      name: 'System Pressure',
      value: Math.round(280 + Math.random() * 40),
      unit: 'bar',
      status: 'normal',
      trend: 'stable',
      threshold: { min: 200, max: 350 },
      history: Array.from({ length: 20 }, () => Math.round(280 + (Math.random() - 0.5) * 60)),
    })

    streams.push({
      id: 'oil_level',
      name: 'Oil Level',
      value: Math.round(78 + Math.random() * 10),
      unit: '%',
      status: 'normal',
      trend: 'stable',
      threshold: { min: 60, max: 100 },
      history: Array.from({ length: 20 }, () => Math.round(78 + (Math.random() - 0.5) * 8)),
    })
  }

  if (equipmentType === 'hoist_motor' || equipmentType === 'slew_bearing') {
    streams.push({
      id: 'load',
      name: 'Current Load',
      value: Math.round(65 + Math.random() * 20),
      unit: '%',
      status: 'normal',
      trend: 'stable',
      threshold: { min: 0, max: 100 },
      history: Array.from({ length: 20 }, () => Math.round(65 + (Math.random() - 0.5) * 30)),
    })
  }

  if (equipmentType === 'wire_rope') {
    streams.push({
      id: 'tension',
      name: 'Wire Tension',
      value: Math.round(45 + Math.random() * 15),
      unit: 'kN',
      status: 'normal',
      trend: 'stable',
      threshold: { min: 20, max: 80 },
      history: Array.from({ length: 20 }, () => Math.round(45 + (Math.random() - 0.5) * 20)),
    })
  }

  return streams
}

function LiveDataStreamCard({ stream }: { stream: LiveDataStream }) {
  const statusColors = {
    normal: 'text-emerald-400',
    warning: 'text-amber-400',
    critical: 'text-rose-400',
  }

  const statusBgColors = {
    normal: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-rose-500',
  }

  const trendIcons = {
    up: <TrendingUp className="w-3 h-3" />,
    down: <TrendingDown className="w-3 h-3" />,
    stable: <ArrowRight className="w-3 h-3" />,
  }

  const trendDescriptions = {
    up: 'Increasing',
    down: 'Decreasing', 
    stable: 'Stable',
  }

  const range = stream.threshold.max - stream.threshold.min
  const warningHighThreshold = stream.threshold.max - range * 0.2
  const warningLowThreshold = stream.threshold.min + range * 0.1

  const history = stream.history.slice(-20)
  const chartWidth = 200
  const chartHeight = 60
  const padding = { left: 0, right: 0, top: 5, bottom: 5 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  const valueToY = (val: number) => {
    const normalized = (val - stream.threshold.min) / range
    return chartHeight - padding.bottom - (normalized * innerHeight)
  }

  const points = history.map((val, idx) => {
    const x = padding.left + (idx / (history.length - 1)) * innerWidth
    const y = valueToY(val)
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `${padding.left},${chartHeight - padding.bottom} ${points} ${chartWidth - padding.right},${chartHeight - padding.bottom}`

  const warningHighY = valueToY(warningHighThreshold)
  const warningLowY = valueToY(warningLowThreshold)

  const firstVal = history[0]
  const lastVal = history[history.length - 1]
  const changePercent = ((lastVal - firstVal) / firstVal * 100).toFixed(1)
  const isPositiveChange = lastVal > firstVal

  return (
    <div className="p-3 rounded-lg bg-black/40 border border-white/10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-white/80">{stream.name}</span>
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
          stream.status === 'critical' ? 'bg-rose-500/20' :
          stream.status === 'warning' ? 'bg-amber-500/20' : 'bg-emerald-500/20'
        } ${statusColors[stream.status]}`}>
          {trendIcons[stream.trend]}
          <span className="text-[9px] font-medium">{trendDescriptions[stream.trend]}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${statusColors[stream.status]}`}>
            {stream.value}
          </span>
          <span className="text-xs text-white/40">{stream.unit}</span>
        </div>
        <div className={`text-[10px] ${isPositiveChange ? 'text-rose-400' : 'text-emerald-400'}`}>
          {isPositiveChange ? '↑' : '↓'} {Math.abs(parseFloat(changePercent))}%
        </div>
      </div>

      <div className="relative bg-slate-900/50 rounded-lg p-2 mb-2">
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`gradient-${stream.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={
                stream.status === 'critical' ? '#ef4444' :
                stream.status === 'warning' ? '#f59e0b' : '#10b981'
              } stopOpacity="0.3" />
              <stop offset="100%" stopColor={
                stream.status === 'critical' ? '#ef4444' :
                stream.status === 'warning' ? '#f59e0b' : '#10b981'
              } stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <rect 
            x={0} 
            y={padding.top} 
            width={chartWidth} 
            height={warningHighY - padding.top} 
            fill="#ef4444" 
            fillOpacity="0.1" 
          />
          <rect 
            x={0} 
            y={warningLowY} 
            width={chartWidth} 
            height={chartHeight - padding.bottom - warningLowY} 
            fill="#f59e0b" 
            fillOpacity="0.1" 
          />

          <line 
            x1={0} 
            y1={warningHighY} 
            x2={chartWidth} 
            y2={warningHighY} 
            stroke="#ef4444" 
            strokeWidth="1" 
            strokeDasharray="4,2" 
            opacity="0.6"
          />
          <line 
            x1={0} 
            y1={warningLowY} 
            x2={chartWidth} 
            y2={warningLowY} 
            stroke="#f59e0b" 
            strokeWidth="1" 
            strokeDasharray="4,2" 
            opacity="0.6"
          />

          <polygon 
            points={areaPoints} 
            fill={`url(#gradient-${stream.id})`}
          />

          <polyline
            points={points}
            fill="none"
            stroke={
              stream.status === 'critical' ? '#ef4444' :
              stream.status === 'warning' ? '#f59e0b' : '#10b981'
            }
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {history.map((val, idx) => {
            const x = padding.left + (idx / (history.length - 1)) * innerWidth
            const y = valueToY(val)
            const isLast = idx === history.length - 1
            return isLast ? (
              <g key={idx}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={
                    stream.status === 'critical' ? '#ef4444' :
                    stream.status === 'warning' ? '#f59e0b' : '#10b981'
                  }
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="none"
                  stroke={
                    stream.status === 'critical' ? '#ef4444' :
                    stream.status === 'warning' ? '#f59e0b' : '#10b981'
                  }
                  strokeWidth="1"
                  opacity="0.5"
                />
              </g>
            ) : null
          })}
        </svg>

        <div className="absolute top-1 right-1 text-[8px] text-rose-400/70 flex items-center gap-0.5">
          <span className="w-2 border-t border-dashed border-rose-400/70" />
          High
        </div>
        <div className="absolute bottom-1 right-1 text-[8px] text-amber-400/70 flex items-center gap-0.5">
          <span className="w-2 border-t border-dashed border-amber-400/70" />
          Low
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px]">
        <div className="flex items-center gap-2">
          <span className="text-white/30">Range:</span>
          <span className="text-white/50">{stream.threshold.min} - {stream.threshold.max} {stream.unit}</span>
        </div>
        <div className={`flex items-center gap-1 ${statusColors[stream.status]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusBgColors[stream.status]} animate-pulse`} />
          <span className="capitalize">{stream.status}</span>
        </div>
      </div>
    </div>
  )
}

function WorkOrderCard({ wo }: { wo: PMWorkOrder }) {
  return (
    <div className={`p-3 rounded-lg border ${
      wo.type === 'CM' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-blue-500/5 border-blue-500/20'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-white/50">{wo.id}</span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
          wo.type === 'CM' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
        }`}>
          {wo.type}
        </span>
      </div>
      <p className="text-xs text-white/80 mb-2">{wo.issue}</p>
      <div className="flex items-center gap-3 text-[10px] text-white/40">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {wo.dateCreated.toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {wo.laborHours}h labor
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          ${wo.partsCost.toLocaleString()}
        </span>
      </div>
      {wo.resolution && (
        <p className="text-[10px] text-emerald-400/70 mt-2 pt-2 border-t border-white/5">
          ✓ {wo.resolution}
        </p>
      )}
    </div>
  )
}

function InspectionCard({ inspection }: { inspection: PMInspectionRecord }) {
  const conditionColors = {
    good: 'text-emerald-400 bg-emerald-500/20',
    fair: 'text-amber-400 bg-amber-500/20',
    poor: 'text-orange-400 bg-orange-500/20',
    critical: 'text-rose-400 bg-rose-500/20',
  }

  return (
    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-white/50">{inspection.id}</span>
        <span className={`text-[9px] px-2 py-0.5 rounded ${conditionColors[inspection.condition]}`}>
          {inspection.condition}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2 text-xs text-white/60">
        <Users className="w-3 h-3" />
        <span>{inspection.inspector}</span>
        <span className="text-white/30">•</span>
        <span>{inspection.date.toLocaleDateString()}</span>
      </div>
      <ul className="space-y-1">
        {inspection.findings.slice(0, 3).map((finding, idx) => (
          <li key={idx} className="text-[10px] text-white/60 flex items-start gap-1.5">
            <ChevronRight className="w-3 h-3 text-white/30 flex-shrink-0 mt-0.5" />
            {finding}
          </li>
        ))}
      </ul>
    </div>
  )
}

function OilAnalysisCard({ analysis }: { analysis: PMOilAnalysis }) {
  const conditionColors = {
    good: 'text-emerald-400',
    marginal: 'text-amber-400',
    critical: 'text-rose-400',
  }

  return (
    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[10px] font-mono text-white/50">{analysis.id}</span>
          <p className="text-xs text-white/60">{analysis.lab}</p>
        </div>
        <span className={`text-xs font-medium ${conditionColors[analysis.overallCondition]}`}>
          {analysis.overallCondition.toUpperCase()}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {analysis.results.slice(0, 4).map((result, idx) => (
          <div key={idx} className="p-2 rounded bg-black/30">
            <span className="text-[9px] text-white/40 block">{result.parameter}</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-sm font-medium ${
                result.status === 'critical' ? 'text-rose-400' :
                result.status === 'warning' ? 'text-amber-400' : 'text-white'
              }`}>
                {result.value}
              </span>
              <span className="text-[9px] text-white/30">{result.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-white/50 mt-2 pt-2 border-t border-white/5">
        {analysis.recommendation}
      </p>
    </div>
  )
}

function FleetPatternCard({ pattern }: { pattern: PMFleetPattern }) {
  return (
    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
      <div className="flex items-center gap-2 mb-2">
        <Ship className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-medium text-white">{pattern.pattern}</span>
      </div>
      <div className="flex items-center gap-3 mb-2 text-[10px] text-white/50">
        <span>{pattern.occurrences} occurrences</span>
        <span className="text-white/30">•</span>
        <span>Avg failure @ {pattern.averageFailurePoint.value.toLocaleString()} {pattern.averageFailurePoint.unit}</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {pattern.affectedAssets.slice(0, 4).map((asset, idx) => (
          <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
            {asset}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-emerald-400/80">
        ↳ {pattern.recommendedIntervention}
      </p>
    </div>
  )
}

interface PredictionDetailPanelProps {
  prediction: PMPrediction
  analysis: PMAnalysis
  equipment: { currentHealth?: number; operatingHours?: number; cycleCount?: number }
  onClose: () => void
  onResolve?: (query: string) => void
}

function PredictionDetailPanel({ prediction, analysis, equipment, onClose, onResolve }: PredictionDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'history' | 'fleet'>('overview')
  const [liveStreams, setLiveStreams] = useState<LiveDataStream[]>([])
  const [workOrders, setWorkOrders] = useState<PMWorkOrder[]>([])
  const [fleetPatterns, setFleetPatterns] = useState<PMFleetPattern[]>([])
  const [inspections, setInspections] = useState<PMInspectionRecord[]>([])
  const [oilAnalysis, setOilAnalysis] = useState<PMOilAnalysis[]>([])
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false)
  const workOrderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLiveStreams(generateLiveDataStreams(prediction.componentType, equipment.currentHealth || 75))
    setWorkOrders(getWorkOrderHistory(prediction.assetId, prediction.componentId))
    setFleetPatterns(getFleetPatterns(prediction.componentType))
    setInspections(getInspectionRecords(prediction.assetId, prediction.componentId))
    setOilAnalysis(getOilAnalysisRecords(prediction.assetId, prediction.componentId))
  }, [prediction, equipment])

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStreams(prev => prev.map(stream => ({
        ...stream,
        value: Math.round((stream.value + (Math.random() - 0.5) * (stream.threshold.max - stream.threshold.min) * 0.02) * 100) / 100,
        history: [...stream.history.slice(1), stream.value],
      })))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const profile = getOEMProfile(prediction.componentType)
  const relevantReasoning = analysis.reasoningChain.filter(
    step => step.text.toLowerCase().includes(prediction.componentName.toLowerCase().split(' ')[0]) ||
            step.text.toLowerCase().includes(prediction.componentType.replace('_', ' '))
  )

  const priorityColors = {
    critical: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
    high: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    medium: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    low: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-[600px] h-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border-r border-white/10 overflow-hidden flex flex-col animate-in slide-in-from-left duration-300">
        <div className="p-4 border-b border-white/10 bg-black/40">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${priorityColors[prediction.priority]}`}>
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{prediction.componentName}</h2>
                <p className="text-xs text-white/50 capitalize">
                  {prediction.componentType.replace('_', ' ')} • {prediction.assetName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded-lg bg-black/30 text-center">
              <p className="text-[10px] text-white/40">Health</p>
              <p className={`text-lg font-bold ${
                (equipment.currentHealth || 75) >= 80 ? 'text-emerald-400' :
                (equipment.currentHealth || 75) >= 60 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {equipment.currentHealth || 75}%
              </p>
            </div>
            <div className="p-2 rounded-lg bg-black/30 text-center">
              <p className="text-[10px] text-white/40">RUL</p>
              <p className={`text-lg font-bold ${priorityColors[prediction.priority].split(' ')[0]}`}>
                {prediction.remainingLife.value}
              </p>
              <p className="text-[9px] text-white/30">{prediction.remainingLife.unit}</p>
            </div>
            <div className="p-2 rounded-lg bg-black/30 text-center">
              <p className="text-[10px] text-white/40">Confidence</p>
              <p className="text-lg font-bold text-cyan-400">{prediction.confidence}%</p>
            </div>
            <div className="p-2 rounded-lg bg-black/30 text-center">
              <p className="text-[10px] text-white/40">Operating</p>
              <p className="text-lg font-bold text-white">{((equipment.operatingHours || 0) / 1000).toFixed(1)}k</p>
              <p className="text-[9px] text-white/30">hours</p>
            </div>
          </div>
        </div>

        <div className="flex border-b border-white/10">
          {[
            { id: 'overview', label: 'Analysis', icon: Brain },
            { id: 'data', label: 'Live Data', icon: Activity },
            { id: 'history', label: 'History', icon: History },
            { id: 'fleet', label: 'Fleet Intel', icon: Ship },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'overview' && (
            <>
              <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  <span className="text-sm font-medium text-violet-400">AI Prediction Summary</span>
                </div>
                <p className="text-sm text-white/80 mb-3">{prediction.description}</p>
                <p className="text-xs text-white/60">
                  <strong className="text-white/80">Predicted Issue:</strong> {prediction.predictedIssue}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  AI Reasoning Chain
                </h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {(relevantReasoning.length > 0 ? relevantReasoning : analysis.reasoningChain.slice(0, 5)).map((step, idx) => (
                    <div
                      key={step.id}
                      className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                        step.isKey ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-white/[0.02]'
                      }`}
                    >
                      <span className="text-white/30 font-mono w-4">{idx + 1}.</span>
                      <div className="flex-1">
                        <p className="text-white/70">{step.text}</p>
                        <p className="text-[10px] text-white/40 mt-1">
                          Source: {step.sourceType.replace('_', ' ')} • {step.confidence}% confidence
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  OEM Specifications
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded bg-black/30">
                    <p className="text-[10px] text-white/40">Manufacturer</p>
                    <p className="text-xs text-white">{profile.manufacturer}</p>
                  </div>
                  <div className="p-2 rounded bg-black/30">
                    <p className="text-[10px] text-white/40">Model</p>
                    <p className="text-xs text-white">{profile.model}</p>
                  </div>
                  <div className="p-2 rounded bg-black/30">
                    <p className="text-[10px] text-white/40">PM Interval</p>
                    <p className="text-xs text-white">{profile.specs.maintenanceIntervalHours?.toLocaleString() || 'N/A'} hrs</p>
                  </div>
                  <div className="p-2 rounded bg-black/30">
                    <p className="text-[10px] text-white/40">Expected Life</p>
                    <p className="text-xs text-white">
                      {profile.specs.maxOperatingHours?.toLocaleString() || profile.specs.expectedLifeCycles?.toLocaleString() || 'N/A'}
                      {profile.specs.expectedLifeCycles ? ' cycles' : ' hrs'}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-black/30">
                    <p className="text-[10px] text-white/40">MTBF</p>
                    <p className="text-xs text-white">{profile.specs.mtbf?.toLocaleString() || 'N/A'} hrs</p>
                  </div>
                  <div className="p-2 rounded bg-black/30">
                    <p className="text-[10px] text-white/40">Max Temp</p>
                    <p className="text-xs text-white">{profile.specs.maxTemperature || 'N/A'}°C</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[10px] text-white/40 mb-2">Known Failure Modes</p>
                  <div className="space-y-1">
                    {profile.failureModes.slice(0, 3).map((fm, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-white/60">{fm.mode}</span>
                        <span className="text-amber-400">{(fm.probability * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400">Repair Cost</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    ${prediction.estimatedRepairCost.min.toLocaleString()} - ${prediction.estimatedRepairCost.max.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <span className="text-xs text-rose-400">Cost of Inaction</span>
                  </div>
                  <p className="text-lg font-bold text-rose-400">
                    ${prediction.costOfInaction.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-400">Recommended Action</span>
                </div>
                <p className="text-sm text-white/80">{prediction.recommendedAction}</p>
                {prediction.partsRequired && prediction.partsRequired.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-cyan-500/20">
                    <p className="text-[10px] text-white/40 mb-2">Parts Required</p>
                    <div className="flex flex-wrap gap-1.5">
                      {prediction.partsRequired.map((part, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-1 rounded bg-cyan-500/10 text-cyan-400">
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'data' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Live Data Streams
                </h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Real-time
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {liveStreams.map(stream => (
                  <LiveDataStreamCard key={stream.id} stream={stream} />
                ))}
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-violet-400" />
                    Equipment Health Over Time
                  </h3>
                  <div className="flex items-center gap-3 text-[9px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
                      Historical
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      Now
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-violet-500/50 border border-dashed border-violet-400" />
                      AI Forecast
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-white/40 mb-3">
                  Shows how equipment health has declined and predicted future degradation based on current trends
                </p>
                
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[8px] text-white/30">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>
                  
                  <div className="ml-10 relative">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[100, 75, 50, 25, 0].map((_, i) => (
                        <div key={i} className="border-t border-white/5 w-full" />
                      ))}
                    </div>
                    
                    <div className="h-32 flex items-end gap-0.5 relative">
                      {analysis.degradationCurve.slice(-20).map((point, idx, arr) => {
                        const h = point.healthScore
                        const isCurrentPoint = !point.isProjected && arr[idx + 1]?.isProjected
                        const totalPoints = arr.length
                        const historicalCount = arr.filter(p => !p.isProjected).length
                        
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center relative group">
                            <div
                              className={`w-full rounded-t transition-all relative ${
                                point.isProjected 
                                  ? 'bg-violet-500/30 border-l border-r border-t border-dashed border-violet-500/50' 
                                  : isCurrentPoint 
                                  ? 'bg-cyan-400 shadow-lg shadow-cyan-500/30'
                                  : h >= 80 ? 'bg-emerald-500/60' 
                                  : h >= 60 ? 'bg-amber-500/60' 
                                  : 'bg-rose-500/60'
                              }`}
                              style={{ height: `${h}%` }}
                            >
                              {isCurrentPoint && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                  <span className="text-[9px] font-medium text-cyan-400 bg-slate-900/90 px-1.5 py-0.5 rounded">
                                    NOW: {h}%
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-10 pointer-events-none transition-opacity">
                              <span className="text-[9px] text-white bg-slate-800 px-2 py-1 rounded shadow-lg border border-white/10">
                                {point.isProjected ? 'Forecast' : 'Actual'}: {h}%
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    <div className="flex justify-between mt-2 text-[9px] text-white/40">
                      <span>-6 months</span>
                      <span>-3 months</span>
                      <span className="text-cyan-400 font-medium">Today</span>
                      <span className="text-violet-400">+3 months</span>
                      <span className="text-violet-400">+6 months</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <div className="flex items-start gap-2">
                    <TrendingDown className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-violet-400 font-medium">AI Prediction</p>
                      <p className="text-[10px] text-white/60">
                        Based on current degradation rate, health will reach critical levels ({prediction.remainingLife.value} {prediction.remainingLife.unit} remaining). 
                        Recommend maintenance before the projected failure window.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                <h3 className="text-sm font-medium text-white mb-3">Data Source Quality</h3>
                <div className="space-y-2">
                  {analysis.sourceContributions.slice(0, 5).map((contrib, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-cyan-400 w-5">
                        {SOURCE_ICONS[contrib.source.iconName] || <Activity className="w-4 h-4" />}
                      </span>
                      <span className="text-xs text-white/60 flex-1">{contrib.source.name}</span>
                      <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${contrib.relevanceScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/40 w-8">{contrib.relevanceScore}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-violet-400" />
                  Work Order History
                </h3>
                <span className="text-[10px] text-white/40">{workOrders.length} records</span>
              </div>
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {workOrders.slice(0, 5).map(wo => (
                  <WorkOrderCard key={wo.id} wo={wo} />
                ))}
              </div>

              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-orange-400" />
                  Inspection Records
                </h3>
                <span className="text-[10px] text-white/40">{inspections.length} records</span>
              </div>
              <div className="space-y-2">
                {inspections.slice(0, 2).map(insp => (
                  <InspectionCard key={insp.id} inspection={insp} />
                ))}
              </div>

              {oilAnalysis.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-yellow-400" />
                      Oil Analysis
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {oilAnalysis.slice(0, 1).map(oa => (
                      <OilAnalysisCard key={oa.id} analysis={oa} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'fleet' && (
            <>
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Ship className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Fleet Intelligence Summary</span>
                </div>
                <p className="text-xs text-white/70">
                  Analysis of {fleetPatterns.length} patterns from similar {prediction.componentType.replace('_', ' ')} equipment 
                  across the Exelon grid fleet reveals common failure modes and optimal intervention points.
                </p>
              </div>

              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Identified Patterns</h3>
                <span className="text-[10px] text-white/40">{fleetPatterns.length} patterns</span>
              </div>
              <div className="space-y-3">
                {fleetPatterns.map((pattern, idx) => (
                  <FleetPatternCard key={idx} pattern={pattern} />
                ))}
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                <h3 className="text-sm font-medium text-white mb-3">Fleet Comparison</h3>
                <div className="space-y-2">
                  {['Al Mirfa', 'Arzanah', 'Kawkab', 'Zakher'].map((vessel, idx) => {
                    const health = 60 + Math.random() * 35
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-xs text-white/60 w-20">{vessel}</span>
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              health >= 80 ? 'bg-emerald-500' :
                              health >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${health}%` }}
                          />
                        </div>
                        <span className="text-xs text-white/40 w-10">{health.toFixed(0)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-black/40 space-y-2">
          {onResolve && (
            <button 
              onClick={() => {
                const equipType = prediction.componentType.replace(/_/g, ' ')
                const health = equipment.currentHealth || 75
                const query = `${prediction.componentName} ${equipType} on ${prediction.assetName} has ${prediction.priority} priority issue - ${prediction.predictedIssue}. Health is ${health} percent. ${prediction.description.replace(/[()%]/g, '')} Recommended: ${prediction.recommendedAction.replace(/[()"%]/g, '')}. How do I diagnose and fix this step by step?`
                onResolve(query)
                onClose()
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Brain className="w-4 h-4" />
              Resolve with AI Assistant
            </button>
          )}
          <button 
            onClick={() => setShowWorkOrderModal(true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            Create Work Order
          </button>
        </div>
      </div>

      {showWorkOrderModal && (
        <WorkOrderModal
          prediction={prediction}
          equipment={equipment}
          profile={profile}
          onClose={() => setShowWorkOrderModal(false)}
        />
      )}
    </div>
  )
}

interface WorkOrderModalProps {
  prediction: PMPrediction
  equipment: { currentHealth?: number; operatingHours?: number; cycleCount?: number }
  profile: ReturnType<typeof getOEMProfile>
  onClose: () => void
}

function WorkOrderModal({ prediction, equipment, profile, onClose }: WorkOrderModalProps) {
  const workOrderRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    priority: prediction.priority,
    assignee: '',
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estimatedHours: prediction.estimatedDowntime.min,
    notes: '',
  })

  const workOrderNumber = `WO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
  const createdDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const handlePrint = () => {
    const printContent = workOrderRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Work Order ${workOrderNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px; 
              color: #1a1a1a;
              line-height: 1.5;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start;
              border-bottom: 3px solid #7c3aed; 
              padding-bottom: 20px; 
              margin-bottom: 30px;
            }
            .logo { font-size: 28px; font-weight: bold; color: #7c3aed; }
            .logo span { color: #06b6d4; }
            .wo-number { font-size: 24px; font-weight: bold; color: #1a1a1a; }
            .wo-date { font-size: 12px; color: #666; margin-top: 4px; }
            .section { margin-bottom: 24px; }
            .section-title { 
              font-size: 11px; 
              text-transform: uppercase; 
              letter-spacing: 1px;
              color: #7c3aed; 
              font-weight: 600;
              margin-bottom: 12px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 6px;
            }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
            .field { margin-bottom: 12px; }
            .field-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
            .field-value { font-size: 14px; font-weight: 500; color: #1a1a1a; margin-top: 2px; }
            .priority-badge { 
              display: inline-block;
              padding: 4px 12px; 
              border-radius: 4px; 
              font-size: 11px; 
              font-weight: 600;
              text-transform: uppercase;
            }
            .priority-critical { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
            .priority-high { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; }
            .priority-medium { background: #fefce8; color: #ca8a04; border: 1px solid #fef08a; }
            .priority-low { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
            .description-box { 
              background: #f8fafc; 
              border: 1px solid #e2e8f0; 
              border-radius: 8px; 
              padding: 16px; 
              margin-top: 8px;
            }
            .parts-list { 
              display: flex; 
              flex-wrap: wrap; 
              gap: 8px; 
              margin-top: 8px;
            }
            .part-tag { 
              background: #f1f5f9; 
              border: 1px solid #cbd5e1;
              padding: 4px 10px; 
              border-radius: 4px; 
              font-size: 12px;
            }
            .cost-box { 
              background: #fafafa; 
              border: 1px solid #e5e7eb; 
              border-radius: 8px; 
              padding: 16px; 
              text-align: center;
            }
            .cost-value { font-size: 20px; font-weight: bold; color: #059669; }
            .footer { 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 1px solid #e5e7eb;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
            }
            .signature-line { 
              border-bottom: 1px solid #1a1a1a; 
              margin-top: 40px;
              margin-bottom: 8px;
            }
            .signature-label { font-size: 11px; color: #666; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">Exelon<span>GridIQ</span></div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">Predictive Maintenance Work Order</div>
            </div>
            <div style="text-align: right;">
              <div class="wo-number">${workOrderNumber}</div>
              <div class="wo-date">Created: ${createdDate}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Equipment Information</div>
            <div class="grid">
              <div class="field">
                <div class="field-label">Equipment Name</div>
                <div class="field-value">${prediction.componentName}</div>
              </div>
              <div class="field">
                <div class="field-label">Equipment Type</div>
                <div class="field-value" style="text-transform: capitalize;">${prediction.componentType.replace('_', ' ')}</div>
              </div>
              <div class="field">
                <div class="field-label">Asset</div>
                <div class="field-value">${prediction.assetName}</div>
              </div>
              <div class="field">
                <div class="field-label">Current Health</div>
                <div class="field-value">${equipment.currentHealth || 75}%</div>
              </div>
              <div class="field">
                <div class="field-label">Operating Hours</div>
                <div class="field-value">${(equipment.operatingHours || 0).toLocaleString()} hrs</div>
              </div>
              <div class="field">
                <div class="field-label">OEM</div>
                <div class="field-value">${profile.manufacturer} ${profile.model}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Work Order Details</div>
            <div class="grid">
              <div class="field">
                <div class="field-label">Priority</div>
                <div class="field-value">
                  <span class="priority-badge priority-${formData.priority}">${formData.priority}</span>
                </div>
              </div>
              <div class="field">
                <div class="field-label">Remaining Life</div>
                <div class="field-value">${prediction.remainingLife.value} ${prediction.remainingLife.unit}</div>
              </div>
              <div class="field">
                <div class="field-label">Scheduled Date</div>
                <div class="field-value">${new Date(formData.scheduledDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="field">
                <div class="field-label">Estimated Duration</div>
                <div class="field-value">${formData.estimatedHours} - ${prediction.estimatedDowntime.max} hours</div>
              </div>
              ${formData.assignee ? `
              <div class="field">
                <div class="field-label">Assigned To</div>
                <div class="field-value">${formData.assignee}</div>
              </div>
              ` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Issue Description</div>
            <div class="description-box">
              <strong>Predicted Issue:</strong> ${prediction.predictedIssue}<br><br>
              ${prediction.description}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Recommended Action</div>
            <div class="description-box">
              ${prediction.recommendedAction}
            </div>
          </div>

          ${prediction.partsRequired && prediction.partsRequired.length > 0 ? `
          <div class="section">
            <div class="section-title">Parts Required</div>
            <div class="parts-list">
              ${prediction.partsRequired.map(part => `<span class="part-tag">${part}</span>`).join('')}
            </div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Cost Estimates</div>
            <div class="grid-3">
              <div class="cost-box">
                <div class="field-label">Estimated Repair Cost</div>
                <div class="cost-value">$${prediction.estimatedRepairCost.min.toLocaleString()} - $${prediction.estimatedRepairCost.max.toLocaleString()}</div>
              </div>
              <div class="cost-box">
                <div class="field-label">Estimated Downtime</div>
                <div class="cost-value" style="color: #f59e0b;">${prediction.estimatedDowntime.min} - ${prediction.estimatedDowntime.max} hrs</div>
              </div>
              <div class="cost-box">
                <div class="field-label">Cost of Inaction</div>
                <div class="cost-value" style="color: #dc2626;">$${prediction.costOfInaction.amount.toLocaleString()}</div>
              </div>
            </div>
          </div>

          ${formData.notes ? `
          <div class="section">
            <div class="section-title">Additional Notes</div>
            <div class="description-box">${formData.notes}</div>
          </div>
          ` : ''}

          <div class="footer">
            <div>
              <div class="signature-line"></div>
              <div class="signature-label">Maintenance Supervisor Signature</div>
            </div>
            <div>
              <div class="signature-line"></div>
              <div class="signature-label">Operations Manager Approval</div>
            </div>
          </div>

          <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #999;">
            Generated by Exelon GridIQ Predictive Maintenance System • AI Confidence: ${prediction.confidence}%
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const priorityColors = {
    critical: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl border border-white/10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Create Work Order</h2>
                <p className="text-xs text-white/50">{workOrderNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        <div ref={workOrderRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
            <h3 className="text-xs font-medium text-white/50 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Equipment Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-white/40">Equipment</p>
                <p className="text-sm text-white font-medium">{prediction.componentName}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40">Asset</p>
                <p className="text-sm text-white font-medium">{prediction.assetName}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40">Type</p>
                <p className="text-sm text-white capitalize">{prediction.componentType.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40">Current Health</p>
                <p className={`text-sm font-medium ${
                  (equipment.currentHealth || 75) >= 80 ? 'text-emerald-400' :
                  (equipment.currentHealth || 75) >= 60 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {equipment.currentHealth || 75}%
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
            <h3 className="text-xs font-medium text-white/50 uppercase tracking-wide mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Issue Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-white/40">Predicted Issue</p>
                <p className="text-sm text-white">{prediction.predictedIssue}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40">Description</p>
                <p className="text-xs text-white/70">{prediction.description}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40">Recommended Action</p>
                <p className="text-xs text-cyan-400">{prediction.recommendedAction}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-white/50 uppercase tracking-wide flex items-center gap-1 mb-1">
                  <Hash className="w-3 h-3" />
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as typeof formData.priority })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-medium ${priorityColors[formData.priority]} bg-transparent focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
                >
                  <option value="critical" className="bg-slate-900">Critical</option>
                  <option value="high" className="bg-slate-900">High</option>
                  <option value="medium" className="bg-slate-900">Medium</option>
                  <option value="low" className="bg-slate-900">Low</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-white/50 uppercase tracking-wide flex items-center gap-1 mb-1">
                  <User className="w-3 h-3" />
                  Assign To
                </label>
                <input
                  type="text"
                  value={formData.assignee}
                  onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                  placeholder="Technician name"
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-white/50 uppercase tracking-wide flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" />
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/50 uppercase tracking-wide flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3" />
                  Estimated Hours
                </label>
                <input
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) || 0 })}
                  min={1}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
            </div>
          </div>

          {prediction.partsRequired && prediction.partsRequired.length > 0 && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <h3 className="text-xs font-medium text-white/50 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Parts Required
              </h3>
              <div className="flex flex-wrap gap-2">
                {prediction.partsRequired.map((part, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400">
                    {part}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
              <p className="text-[10px] text-white/40">Repair Cost</p>
              <p className="text-sm font-bold text-emerald-400">
                ${prediction.estimatedRepairCost.min.toLocaleString()} - ${prediction.estimatedRepairCost.max.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
              <p className="text-[10px] text-white/40">Downtime</p>
              <p className="text-sm font-bold text-amber-400">
                {prediction.estimatedDowntime.min} - {prediction.estimatedDowntime.max} hrs
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-center">
              <p className="text-[10px] text-white/40">Cost if Delayed</p>
              <p className="text-sm font-bold text-rose-400">
                ${prediction.costOfInaction.amount.toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-white/50 uppercase tracking-wide flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3" />
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes or instructions..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 font-medium text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export to PDF
          </button>
        </div>
      </div>
    </div>
  )
}

interface AgentNode {
  id: string
  name: string
  shortName: string
  icon: React.ReactNode
  color: string
  borderColor: string
  bgColor: string
  thinkingMessages: string[]
  finding: string
}

const ANALYSIS_AGENTS: AgentNode[] = [
  {
    id: 'dga',
    name: 'DGA Analysis Agent',
    shortName: 'DGA',
    icon: <FlaskConical className="w-4 h-4" />,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    thinkingMessages: [
      'Reading dissolved gas concentrations…',
      'Computing Duval Triangle classification…',
      'Evaluating Rogers Ratio patterns…',
      'Mapping to IEEE C57.104 thresholds…',
    ],
    finding: 'TDCG trending above Condition 2 threshold',
  },
  {
    id: 'thermal',
    name: 'Thermal Modeling Agent',
    shortName: 'Thermal',
    icon: <Thermometer className="w-4 h-4" />,
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-rose-500/10',
    thinkingMessages: [
      'Analyzing winding hot-spot temperatures…',
      'Running IEEE C57.91 aging model…',
      'Correlating ambient vs load profile…',
      'Estimating insulation DP degradation…',
    ],
    finding: 'Hot-spot 12°C above design limit at peak load',
  },
  {
    id: 'fleet',
    name: 'Fleet Intelligence Agent',
    shortName: 'Fleet',
    icon: <Building className="w-4 h-4" />,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    thinkingMessages: [
      'Querying similar assets across fleet…',
      'Matching failure patterns by vintage…',
      'Cross-referencing manufacturer batch…',
      'Computing fleet-wide failure probability…',
    ],
    finding: '3 similar units failed within 18 months of this profile',
  },
  {
    id: 'oem',
    name: 'OEM Specs Agent',
    shortName: 'OEM',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    thinkingMessages: [
      'Loading manufacturer service bulletins…',
      'Checking design-life parameters…',
      'Evaluating overhaul intervals…',
      'Reviewing known failure modes…',
    ],
    finding: 'Operating beyond OEM recommended service life',
  },
  {
    id: 'history',
    name: 'Work Order History Agent',
    shortName: 'History',
    icon: <ClipboardList className="w-4 h-4" />,
    color: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    bgColor: 'bg-violet-500/10',
    thinkingMessages: [
      'Scanning corrective maintenance records…',
      'Analyzing PM compliance gaps…',
      'Correlating repeat failure modes…',
      'Evaluating repair effectiveness…',
    ],
    finding: 'Repeat bushing repairs — 3 CMs in 24 months',
  },
  {
    id: 'inspection',
    name: 'Inspection Records Agent',
    shortName: 'Inspect',
    icon: <Eye className="w-4 h-4" />,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    thinkingMessages: [
      'Reviewing latest field inspection notes…',
      'Flagging condition deterioration trends…',
      'Correlating visual findings with DGA…',
      'Checking environmental exposure factors…',
    ],
    finding: 'Oil seepage noted at bushing gasket — progressive',
  },
]

type AgentStatus = 'queued' | 'thinking' | 'complete'

interface BeanstalkOrchestrationProps {
  isAnalyzing: boolean
  isComplete: boolean
  onSynthesisComplete?: () => void
}

function BeanstalkOrchestration({ isAnalyzing, isComplete }: BeanstalkOrchestrationProps) {
  const [agentStates, setAgentStates] = useState<Record<string, { status: AgentStatus; messageIdx: number }>>({})
  const [synthStatus, setSynthStatus] = useState<'waiting' | 'synthesizing' | 'complete'>('waiting')
  const timerRefs = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    if (!isAnalyzing) return
    const initial: Record<string, { status: AgentStatus; messageIdx: number }> = {}
    ANALYSIS_AGENTS.forEach(a => { initial[a.id] = { status: 'queued', messageIdx: 0 } })
    setAgentStates(initial)
    setSynthStatus('waiting')
    timerRefs.current.forEach(clearTimeout)
    timerRefs.current = []

    const startAgent = (agent: AgentNode, delay: number) => {
      const t1 = setTimeout(() => {
        setAgentStates(prev => ({ ...prev, [agent.id]: { status: 'thinking', messageIdx: 0 } }))
      }, delay)
      timerRefs.current.push(t1)
      agent.thinkingMessages.forEach((_, mIdx) => {
        if (mIdx === 0) return
        const t = setTimeout(() => {
          setAgentStates(prev => ({ ...prev, [agent.id]: { status: 'thinking', messageIdx: mIdx } }))
        }, delay + mIdx * 450)
        timerRefs.current.push(t)
      })
      const completeDelay = delay + agent.thinkingMessages.length * 450 + 200
      const t2 = setTimeout(() => {
        setAgentStates(prev => ({ ...prev, [agent.id]: { status: 'complete', messageIdx: agent.thinkingMessages.length - 1 } }))
      }, completeDelay)
      timerRefs.current.push(t2)
    }

    ANALYSIS_AGENTS.forEach((a, i) => startAgent(a, 300 + i * 350))

    const maxAgentTime = 300 + 5 * 350 + 4 * 450 + 200
    const synthT = setTimeout(() => setSynthStatus('synthesizing'), maxAgentTime + 400)
    const synthDone = setTimeout(() => setSynthStatus('complete'), maxAgentTime + 1600)
    timerRefs.current.push(synthT, synthDone)
    return () => timerRefs.current.forEach(clearTimeout)
  }, [isAnalyzing])

  useEffect(() => {
    if (isComplete && !isAnalyzing) {
      const done: Record<string, { status: AgentStatus; messageIdx: number }> = {}
      ANALYSIS_AGENTS.forEach(a => { done[a.id] = { status: 'complete', messageIdx: a.thinkingMessages.length - 1 } })
      setAgentStates(done)
      setSynthStatus('complete')
    }
  }, [isComplete, isAnalyzing])

  const allDone = synthStatus === 'complete' || isComplete
  const stemColor = isAnalyzing && !allDone ? 'bg-violet-500/25' : allDone ? 'bg-emerald-500/15' : 'bg-white/[0.06]'
  const stemGlow = isAnalyzing && !allDone ? 'shadow-[0_0_6px_rgba(139,92,246,0.15)]' : ''

  return (
    <div className="relative py-2">
      {/* ── Orchestrator — top of the stem ── */}
      <div className="flex justify-center mb-0">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500 ${
          isAnalyzing && !allDone
            ? 'bg-violet-500/10 border-violet-500/25 shadow-md shadow-violet-500/10'
            : allDone
            ? 'bg-emerald-500/[0.06] border-emerald-500/20'
            : 'bg-white/[0.02] border-white/[0.06]'
        }`}>
          <Brain className={`w-4 h-4 transition-colors duration-500 ${
            isAnalyzing && !allDone ? 'text-violet-400' : allDone ? 'text-emerald-400/70' : 'text-white/25'
          }`} />
          <span className="text-[11px] font-semibold text-white/50">GridIQ Orchestrator</span>
          {isAnalyzing && !allDone && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />}
          {allDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-400/60" />}
        </div>
      </div>

      {/* ── Vertical Stem with alternating branches ── */}
      <div className="relative ml-[50%]">
        {/* The stem line */}
        <div className={`absolute left-0 top-0 bottom-0 w-px ${stemColor} ${stemGlow} transition-all duration-500`} />

        {ANALYSIS_AGENTS.map((agent, i) => {
          const state = agentStates[agent.id] || { status: 'queued', messageIdx: 0 }
          const isThinking = state.status === 'thinking'
          const isDone = state.status === 'complete'
          const isLeft = i % 2 === 0
          const branchColor = isThinking ? agent.borderColor.replace('border-', 'bg-') :
            isDone ? 'bg-emerald-500/20' : 'bg-white/[0.06]'

          return (
            <div key={agent.id} className="relative" style={{ height: 72 }}>
              {/* Horizontal branch */}
              <div
                className={`absolute top-[36px] h-px transition-all duration-500 ${branchColor}`}
                style={isLeft
                  ? { right: '0', width: '40px', left: 'auto', transform: 'translateX(-1px)' }
                  : { left: '1px', width: '40px' }
                }
              />

              {/* Animated pulse dot traveling along branch */}
              {isThinking && (
                <div
                  className="absolute top-[34px] w-2 h-2 rounded-full"
                  style={{
                    ...(isLeft
                      ? { right: '0', animation: 'pulseLeft 1.2s ease-in-out infinite' }
                      : { left: '1px', animation: 'pulseRight 1.2s ease-in-out infinite' }),
                    background: agent.color.includes('amber') ? 'rgba(251,191,36,0.6)' :
                      agent.color.includes('rose') ? 'rgba(251,113,133,0.6)' :
                      agent.color.includes('blue') ? 'rgba(96,165,250,0.6)' :
                      agent.color.includes('cyan') ? 'rgba(34,211,238,0.6)' :
                      agent.color.includes('violet') ? 'rgba(167,139,250,0.6)' :
                      'rgba(52,211,153,0.6)',
                    boxShadow: `0 0 8px ${
                      agent.color.includes('amber') ? 'rgba(251,191,36,0.4)' :
                      agent.color.includes('rose') ? 'rgba(251,113,133,0.4)' :
                      agent.color.includes('blue') ? 'rgba(96,165,250,0.4)' :
                      agent.color.includes('cyan') ? 'rgba(34,211,238,0.4)' :
                      agent.color.includes('violet') ? 'rgba(167,139,250,0.4)' :
                      'rgba(52,211,153,0.4)'
                    }`,
                  }}
                />
              )}

              {/* Node junction dot on stem */}
              <div className={`absolute top-[33px] left-0 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 transition-all duration-500 ${
                isThinking ? `${agent.borderColor} ${agent.bgColor}` :
                isDone ? 'border-emerald-500/40 bg-emerald-500/25' :
                'border-white/10 bg-white/[0.04]'
              }`} />

              {/* Agent card */}
              <div
                className={`absolute top-[12px] transition-all duration-500 ${
                  isLeft ? 'right-[calc(50%+52px)]' : 'left-[52px]'
                }`}
                style={{ width: 'calc(50% - 64px)' }}
              >
                <div className={`p-2.5 rounded-lg border transition-all duration-500 ${
                  isThinking ? `${agent.bgColor} ${agent.borderColor}` :
                  isDone ? 'bg-emerald-500/[0.03] border-emerald-500/15' :
                  'bg-white/[0.015] border-white/[0.06]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`flex-shrink-0 transition-colors duration-300 ${
                      isThinking ? agent.color : isDone ? 'text-emerald-400/60' : 'text-white/15'
                    }`}>
                      {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : agent.icon}
                    </span>
                    <span className={`text-[11px] font-medium truncate transition-colors duration-300 ${
                      isThinking ? 'text-white/70' : isDone ? 'text-white/45' : 'text-white/20'
                    }`}>
                      {agent.shortName}
                    </span>
                    {isThinking && <span className={`ml-auto w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0 ${agent.bgColor.replace('/10', '/50')}`} />}
                  </div>
                  <p className={`text-[10px] mt-1 leading-snug line-clamp-1 transition-colors duration-300 ${
                    isThinking ? 'text-white/35' : isDone ? 'text-emerald-400/35' : 'text-white/10'
                  }`}>
                    {isThinking ? agent.thinkingMessages[state.messageIdx] :
                     isDone ? `→ ${agent.finding}` : 'Waiting…'}
                  </p>
                </div>
              </div>
            </div>
          )
        })}

        {/* ── Synthesis — bottom of the stem ── */}
        <div className="relative" style={{ height: 56 }}>
          <div className={`absolute top-[28px] left-0 -translate-x-1/2 w-3 h-3 rounded-full border-2 transition-all duration-500 ${
            synthStatus === 'synthesizing' ? 'border-cyan-500/50 bg-cyan-500/30 animate-pulse' :
            allDone ? 'border-emerald-500/40 bg-emerald-500/30' :
            'border-white/10 bg-white/[0.04]'
          }`} />
        </div>
      </div>

      {/* Synthesis label */}
      <div className="flex justify-center mt-0">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500 ${
          synthStatus === 'synthesizing'
            ? 'bg-cyan-500/10 border-cyan-500/25 shadow-md shadow-cyan-500/10'
            : allDone
            ? 'bg-emerald-500/[0.06] border-emerald-500/20'
            : 'bg-white/[0.02] border-white/[0.06]'
        }`}>
          {allDone ? <CheckCircle className="w-4 h-4 text-emerald-400/60" /> :
           synthStatus === 'synthesizing' ? <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" /> :
           <Sparkles className="w-4 h-4 text-white/20" />}
          <span className={`text-[11px] font-semibold transition-colors duration-300 ${
            synthStatus === 'synthesizing' ? 'text-cyan-400/60' : allDone ? 'text-emerald-400/50' : 'text-white/20'
          }`}>
            {synthStatus === 'synthesizing' ? 'Synthesizing findings…' :
             allDone ? 'Analysis complete' : 'Synthesis Engine'}
          </span>
        </div>
      </div>

      {/* CSS animations for the traveling pulse dots */}
      <style jsx>{`
        @keyframes pulseLeft {
          0% { transform: translateX(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateX(-38px); opacity: 0; }
        }
        @keyframes pulseRight {
          0% { transform: translateX(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateX(38px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

interface PredictionCardProps {
  prediction: PMPrediction
  onOpenDetail: () => void
}

function PredictionCard({ prediction, onOpenDetail }: PredictionCardProps) {
  const priorityColors = {
    critical: 'border-rose-500/50 bg-rose-500/10',
    high: 'border-orange-500/50 bg-orange-500/10',
    medium: 'border-amber-500/50 bg-amber-500/10',
    low: 'border-emerald-500/50 bg-emerald-500/10',
  }

  const priorityTextColors = {
    critical: 'text-rose-400',
    high: 'text-orange-400',
    medium: 'text-amber-400',
    low: 'text-emerald-400',
  }

  const priorityBadgeColors = {
    critical: 'bg-rose-500/20 text-rose-400',
    high: 'bg-orange-500/20 text-orange-400',
    medium: 'bg-amber-500/20 text-amber-400',
    low: 'bg-emerald-500/20 text-emerald-400',
  }

  return (
    <div
      className={`rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${priorityColors[prediction.priority]}`}
      onClick={onOpenDetail}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {prediction.priority === 'critical' ? (
              <AlertTriangle className={`w-5 h-5 ${priorityTextColors[prediction.priority]}`} />
            ) : prediction.priority === 'high' ? (
              <Wrench className={`w-5 h-5 ${priorityTextColors[prediction.priority]}`} />
            ) : (
              <Shield className={`w-5 h-5 ${priorityTextColors[prediction.priority]}`} />
            )}
            <div>
              <h3 className="text-sm font-medium text-white">{prediction.componentName}</h3>
              <p className="text-[10px] text-white/40 capitalize">{prediction.componentType.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${priorityBadgeColors[prediction.priority]}`}>
              {prediction.priority}
            </span>
            <ChevronRight className="w-4 h-4 text-white/40" />
          </div>
        </div>

        <p className="text-xs text-white/70 mb-3 line-clamp-2">{prediction.description}</p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-white/40" />
            <span className={`text-sm font-medium ${priorityTextColors[prediction.priority]}`}>
              {prediction.remainingLife.value} {prediction.remainingLife.unit}
            </span>
            <span className="text-[10px] text-white/40">remaining</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-white/40" />
            <span className="text-xs text-white/60">{prediction.confidence}% confidence</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-cyan-400">Click to view detailed analysis, live data & history</span>
        </div>
      </div>
    </div>
  )
}

interface AIPredictiveMaintenanceProps {
  assetType: PMAssetType
  assetId: string
  assetName: string
  equipment: {
    id: string
    name: string
    type: PMEquipmentType
    currentHealth?: number
    operatingHours?: number
    cycleCount?: number
    temperature?: number
    vibration?: number
  }[]
  compact?: boolean
  onPredictionSelect?: (prediction: PMPrediction) => void
  onResolve?: (query: string) => void
}

export function AIPredictiveMaintenance({
  assetType,
  assetId,
  assetName,
  equipment,
  compact = false,
  onPredictionSelect,
  onResolve,
}: AIPredictiveMaintenanceProps) {
  const [analysis, setAnalysis] = useState<PMAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [selectedPrediction, setSelectedPrediction] = useState<PMPrediction | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<typeof equipment[0] | null>(null)
  const hasRun = useRef(false)

  const runAnalysis = useCallback(() => {
    setIsAnalyzing(true)
    setAnalysis(null)

    const request: PMAnalysisRequest = {
      assetType,
      assetId,
      assetName,
      componentList: equipment.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        currentHealth: e.currentHealth,
        temperature: e.temperature,
      })),
    }

    const totalAgentTime = 350 + 2 * 250 + 4 * 400 + 200 + 1200 + 300
    setTimeout(() => {
      const result = analyzeEquipment(request)
      setAnalysis(result)
      setIsAnalyzing(false)
    }, totalAgentTime)
  }, [assetType, assetId, assetName, equipment])

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true
    runAnalysis()
  }, [runAnalysis])

  const handleOpenDetail = (pred: PMPrediction) => {
    const eq = equipment.find(e => e.id === pred.equipmentId) || equipment[0]
    setSelectedPrediction(pred)
    setSelectedEquipment(eq)
    onPredictionSelect?.(pred)
  }

  if (compact) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-violet-500/5 to-cyan-500/5 border border-violet-500/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" />
            AI Predictive Maintenance
          </h3>
          {isAnalyzing && (
            <span className="text-[10px] text-violet-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Analyzing...
            </span>
          )}
        </div>

        {analysis && !isAnalyzing && analysis.predictions.length > 0 && (
          <div className="space-y-2">
            {analysis.predictions.slice(0, 2).map((pred) => (
              <div
                key={pred.id}
                className={`p-2 rounded-lg border cursor-pointer hover:scale-[1.01] transition-transform ${
                  pred.priority === 'critical' ? 'border-rose-500/30 bg-rose-500/10' :
                  pred.priority === 'high' ? 'border-orange-500/30 bg-orange-500/10' :
                  pred.priority === 'medium' ? 'border-amber-500/30 bg-amber-500/10' :
                  'border-emerald-500/30 bg-emerald-500/10'
                }`}
                onClick={() => handleOpenDetail(pred)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Wrench className={`w-3.5 h-3.5 ${
                    pred.priority === 'critical' ? 'text-rose-400' :
                    pred.priority === 'high' ? 'text-orange-400' :
                    pred.priority === 'medium' ? 'text-amber-400' :
                    'text-emerald-400'
                  }`} />
                  <span className="text-xs font-medium text-white truncate">{pred.equipmentName}</span>
                  <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded ${
                    pred.priority === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                    pred.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    pred.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {pred.remainingLife.value} {pred.remainingLife.unit}
                  </span>
                </div>
                <p className="text-[10px] text-white/60 line-clamp-1">{pred.recommendedAction}</p>
              </div>
            ))}
          </div>
        )}

        {isAnalyzing && (
          <div className="flex items-center gap-2 py-4">
            <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-white/50">6 agents analyzing in parallel…</span>
          </div>
        )}

        {selectedPrediction && analysis && selectedEquipment && (
          <PredictionDetailPanel
            prediction={selectedPrediction}
            analysis={analysis}
            equipment={selectedEquipment}
            onClose={() => setSelectedPrediction(null)}
            onResolve={onResolve}
          />
        )}
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">AI Predictive Maintenance</h2>
                <p className="text-xs text-white/50">
                  Cross-referencing {DATA_SOURCES.length} data sources for {assetName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {analysis && (
                <span className="text-[10px] text-white/40">
                  v{analysis.analysisVersion}
                </span>
              )}
              <button
                onClick={() => {
                  hasRun.current = false
                  runAnalysis()
                }}
                disabled={isAnalyzing}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-white/60 ${isAnalyzing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <BeanstalkOrchestration
            isAnalyzing={isAnalyzing}
            isComplete={!isAnalyzing && !!analysis}
          />
        </div>

        <div className="p-4">
          {analysis && !isAnalyzing && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-white/60">Maintenance Predictions</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-400">{analysis.overallHealthScore}%</span>
                  </div>
                  <span className="text-[10px] text-white/40">overall health</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {analysis.predictions.map((pred) => (
                  <PredictionCard
                    key={pred.id}
                    prediction={pred}
                    onOpenDetail={() => handleOpenDetail(pred)}
                  />
                ))}
              </div>

              {analysis.predictions.length === 0 && (
                <div className="text-center py-8">
                  <Shield className="w-10 h-10 text-emerald-400/50 mx-auto mb-3" />
                  <p className="text-sm text-white/60">All equipment operating within parameters</p>
                  <p className="text-xs text-white/40 mt-1">Next analysis recommended: {analysis.nextAnalysisRecommended.toLocaleDateString()}</p>
                </div>
              )}
            </>
          )}

          {isAnalyzing && (
            <div className="text-center py-4">
              <p className="text-xs text-white/40">Agents analyzing — results will appear below</p>
            </div>
          )}
        </div>
      </div>

      {selectedPrediction && analysis && selectedEquipment && (
        <PredictionDetailPanel
          prediction={selectedPrediction}
          analysis={analysis}
          equipment={selectedEquipment}
          onClose={() => setSelectedPrediction(null)}
          onResolve={onResolve}
        />
      )}
    </>
  )
}

export default AIPredictiveMaintenance
