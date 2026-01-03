'use client';

import { useState } from 'react';
import {
  Eye,
  Thermometer,
  Activity,
  Gauge,
  Zap,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move3D,
  Layers,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { HeatmapMode } from './HeatmapLayer';
import { LucideIcon } from 'lucide-react';

interface ControlPanelProps {
  showSensors: boolean;
  onToggleSensors: (show: boolean) => void;
  heatmapMode: HeatmapMode;
  onHeatmapModeChange: (mode: HeatmapMode) => void;
  onResetCamera: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isPlaying?: boolean;
  onTogglePlayback?: () => void;
  timelinePosition?: number;
  onTimelineChange?: (position: number) => void;
}

const heatmapModes: { mode: HeatmapMode; icon: LucideIcon; label: string }[] = [
  { mode: 'none', icon: Eye, label: 'None' },
  { mode: 'temperature', icon: Thermometer, label: 'Temperature' },
  { mode: 'vibration', icon: Activity, label: 'Vibration' },
  { mode: 'efficiency', icon: Gauge, label: 'Efficiency' },
  { mode: 'stress', icon: Zap, label: 'Stress' },
];

export function ControlPanel({
  showSensors,
  onToggleSensors,
  heatmapMode,
  onHeatmapModeChange,
  onResetCamera,
  onZoomIn,
  onZoomOut,
  isPlaying = false,
  onTogglePlayback,
  timelinePosition = 0,
  onTimelineChange,
}: ControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="absolute top-4 left-4 z-10">
      {/* Main control panel */}
      <div 
        className={`bg-black/80 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden transition-all duration-300 ${
          isExpanded ? 'w-56' : 'w-10'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-white/10">
          {isExpanded && (
            <span className="text-xs font-medium text-white/70 px-1">Visualization</span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            {isExpanded ? (
              <ChevronLeft className="w-4 h-4 text-white/50" />
            ) : (
              <Move3D className="w-4 h-4 text-white/50" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="p-3 space-y-4">
            {/* Camera Controls */}
            <div>
              <div className="text-[10px] text-white/40 uppercase tracking-wide mb-2">Camera</div>
              <div className="flex gap-1">
                <button
                  onClick={onZoomIn}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-white/60" />
                </button>
                <button
                  onClick={onZoomOut}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5 text-white/60" />
                </button>
                <button
                  onClick={onResetCamera}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                  title="Reset Camera"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-white/60" />
                </button>
              </div>
            </div>

            {/* Sensor Toggle */}
            <div>
              <div className="text-[10px] text-white/40 uppercase tracking-wide mb-2">Sensors</div>
              <button
                onClick={() => onToggleSensors(!showSensors)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  showSensors
                    ? 'bg-primary-500/20 border border-primary-500/30 text-primary-400'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="text-xs">
                  {showSensors ? 'Sensors Visible' : 'Show Sensors'}
                </span>
              </button>
            </div>

            {/* Heatmap Mode */}
            <div>
              <div className="text-[10px] text-white/40 uppercase tracking-wide mb-2">Heatmap</div>
              <div className="grid grid-cols-5 gap-1">
                {heatmapModes.map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => onHeatmapModeChange(mode)}
                    className={`flex items-center justify-center p-2 rounded transition-colors ${
                      heatmapMode === mode
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                    }`}
                    title={label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              {heatmapMode !== 'none' && (
                <div className="mt-2 text-[10px] text-center text-white/50 capitalize">
                  {heatmapMode} overlay active
                </div>
              )}
            </div>

            {/* Timeline (for historical playback) */}
            {onTimelineChange && (
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-wide mb-2">Timeline</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onTogglePlayback}
                    className={`p-1.5 rounded ${
                      isPlaying ? 'bg-primary-500/20 text-primary-400' : 'bg-white/5 text-white/60'
                    }`}
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={timelinePosition}
                    onChange={(e) => onTimelineChange(Number(e.target.value))}
                    className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-white/30 mt-1">
                  <span>-24h</span>
                  <span>Now</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick tips */}
      {isExpanded && (
        <div className="mt-2 bg-black/60 rounded-lg p-2 text-[10px] text-white/40 border border-white/5">
          <div>🖱️ Drag to rotate • Scroll to zoom</div>
          <div>Click sensors for details</div>
        </div>
      )}
    </div>
  );
}

