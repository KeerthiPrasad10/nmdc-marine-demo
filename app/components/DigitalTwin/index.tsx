'use client';

import { Suspense, useRef, useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { VesselModelSelector, AssetModelSelector } from './VesselModels';
import {
  SensorOverlay,
  SensorData,
  generateSensorsFromEquipment,
  generateTransformerSensors,
  TransformerSensorInput,
} from './SensorOverlay';
import { getSensorTroubleshooting } from '@/lib/troubleshooting';
import { HeatmapLayer, HeatmapMode, generateHeatmapData, HeatmapLegend } from './HeatmapLayer';
import { ControlPanel } from './ControlPanel';
import { Vessel, Equipment } from '@/lib/supabase';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

// ────────────────────────────────────────────────────────────
// GridAsset shape for the re-themed Exelon demo
// ────────────────────────────────────────────────────────────
export interface GridAssetTwin {
  assetTag: string;
  name: string;
  type: string;       // 'power_transformer' | 'substation' | …
  healthIndex: number; // 0-100
  voltageClass?: number;
  sensorInput?: TransformerSensorInput;
}

// ────────────────────────────────────────────────────────────
// Props – supports both legacy vessel and new grid-asset mode
// ────────────────────────────────────────────────────────────
interface DigitalTwinProps {
  /** Legacy vessel prop */
  vessel?: Vessel;
  /** Legacy equipment list */
  equipment?: Equipment[];
  vesselSubType?: string;
  /** New grid-asset prop */
  gridAsset?: GridAssetTwin;
}

// ────────────────────────────────────────────────────────────
// Scene
// ────────────────────────────────────────────────────────────
function Scene({
  vessel,
  equipment,
  gridAsset,
  showSensors,
  heatmapMode,
  selectedSensor,
  onSensorClick,
  controlsRef,
  vesselSubType,
}: {
  vessel?: Vessel;
  equipment?: Equipment[];
  gridAsset?: GridAssetTwin;
  showSensors: boolean;
  heatmapMode: HeatmapMode;
  selectedSensor: string | null;
  onSensorClick: (sensor: SensorData) => void;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  vesselSubType?: string;
}) {
  // ── Sensors ──
  const sensors = gridAsset
    ? generateTransformerSensors(
        gridAsset.sensorInput ?? {
          assetTag: gridAsset.assetTag,
          healthIndex: gridAsset.healthIndex,
        },
      )
    : generateSensorsFromEquipment(equipment ?? []);

  // ── Heatmap data (reuse existing helper – works for both) ──
  const heatmapEquipment = equipment ?? [];
  const heatmapData = generateHeatmapData(heatmapEquipment, heatmapMode);

  const dimensions = gridAsset
    ? { length: 3.0, width: 2.0 }
    : {
        length: vessel?.type === 'crane_barge' ? 4 : vessel?.type === 'dredger' ? 3.5 : 2.5,
        width: vessel?.type === 'crane_barge' ? 1.5 : vessel?.type === 'dredger' ? 1.2 : 0.8,
      };

  const healthScore = gridAsset?.healthIndex ?? vessel?.health_score ?? 100;

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[4, 3, 4]} fov={50} />

      {/* Controls */}
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        minDistance={2}
        maxDistance={15}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.1}
        dampingFactor={0.05}
        enableDamping
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#a855f7" />

      {/* Environment */}
      <Environment preset="night" />

      {/* Ground surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#111820" metalness={0.6} roughness={0.4} transparent opacity={0.95} />
      </mesh>

      {/* Substation gravel pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.69, 0]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#1e2430" metalness={0.3} roughness={0.8} />
      </mesh>

      <gridHelper args={[20, 40, '#1a1a3a', '#0a0a1a']} position={[0, -0.68, 0]} />

      {/* 3-D Model */}
      {gridAsset ? (
        <AssetModelSelector
          assetType={gridAsset.type}
          healthScore={healthScore}
          isSelected
          voltageClass={gridAsset.voltageClass}
        />
      ) : vessel ? (
        <VesselModelSelector
          vesselType={vessel.type}
          vesselSubType={vesselSubType}
          healthScore={healthScore}
          isSelected
        />
      ) : null}

      {/* Sensor Overlay */}
      <SensorOverlay
        sensors={sensors}
        selectedSensor={selectedSensor}
        onSensorClick={onSensorClick}
        visible={showSensors}
      />

      {/* Heatmap Layer */}
      <HeatmapLayer mode={heatmapMode} data={heatmapData} vesselDimensions={dimensions} />

      {/* Contact shadows */}
      <ContactShadows position={[0, -0.68, 0]} opacity={0.4} scale={10} blur={2} far={4} />
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Loading / Error states
// ────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-white/60 text-sm">Loading 3D model...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
        <p className="text-white/60 text-sm">{message}</p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────
export function DigitalTwin({ vessel, equipment, vesselSubType, gridAsset }: DigitalTwinProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [showSensors, setShowSensors] = useState(true);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('none');
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [selectedSensorData, setSelectedSensorData] = useState<SensorData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelinePosition, setTimelinePosition] = useState(100);
  const [hasError, setHasError] = useState(false);

  const handleSensorClick = useCallback(
    (sensor: SensorData) => {
      setSelectedSensor(sensor.id === selectedSensor ? null : sensor.id);
      setSelectedSensorData(sensor.id === selectedSensor ? null : sensor);
    },
    [selectedSensor],
  );

  const handleResetCamera = useCallback(() => controlsRef.current?.reset(), []);

  const handleZoomIn = useCallback(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current as unknown as { object: { position: { multiplyScalar: (s: number) => void } } };
      controls.object.position.multiplyScalar(0.8);
      controlsRef.current.update();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current as unknown as { object: { position: { multiplyScalar: (s: number) => void } } };
      controls.object.position.multiplyScalar(1.2);
      controlsRef.current.update();
    }
  }, []);

  // Error boundary effect
  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return <ErrorState message="Failed to load 3D visualization" />;
  }

  // Derive display values
  const assetName = gridAsset?.name ?? vessel?.name ?? 'Unknown';
  const assetType = gridAsset?.type?.replace(/_/g, ' ') ?? vesselSubType ?? vessel?.type?.replace(/_/g, ' ') ?? '';
  const healthScore = gridAsset?.healthIndex ?? vessel?.health_score ?? 100;
  const assetId = gridAsset?.assetTag ?? vessel?.id ?? '';

  return (
    <div className="relative w-full h-full min-h-[500px] bg-black rounded-xl overflow-hidden">
      {/* 3D Canvas */}
      <Suspense fallback={<LoadingState />}>
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => gl.setClearColor('#0a0a0f')}
        >
          <Scene
            vessel={vessel}
            equipment={equipment}
            gridAsset={gridAsset}
            showSensors={showSensors}
            heatmapMode={heatmapMode}
            selectedSensor={selectedSensor}
            onSensorClick={handleSensorClick}
            controlsRef={controlsRef}
            vesselSubType={vesselSubType}
          />
        </Canvas>
      </Suspense>

      {/* Control Panel */}
      <ControlPanel
        showSensors={showSensors}
        onToggleSensors={setShowSensors}
        heatmapMode={heatmapMode}
        onHeatmapModeChange={setHeatmapMode}
        onResetCamera={handleResetCamera}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        isPlaying={isPlaying}
        onTogglePlayback={() => setIsPlaying(!isPlaying)}
        timelinePosition={timelinePosition}
        onTimelineChange={setTimelinePosition}
      />

      {/* Heatmap Legend */}
      <HeatmapLegend mode={heatmapMode} />

      {/* Selected Sensor Details Panel */}
      {selectedSensorData && (
        <div className="absolute bottom-4 left-4 bg-black/90 backdrop-blur-sm rounded-xl border border-white/10 p-4 w-80 max-h-[400px] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">{selectedSensorData.name}</h3>
            <button
              onClick={() => { setSelectedSensor(null); setSelectedSensorData(null); }}
              className="text-white/40 hover:text-white/60 text-lg"
            >
              ×
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Current Value</span>
              <span className="font-mono text-white">
                {selectedSensorData.value.toFixed(1)} {selectedSensorData.unit}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Status</span>
              <span className={`capitalize font-medium ${
                selectedSensorData.status === 'critical' ? 'text-rose-400' :
                selectedSensorData.status === 'warning' ? 'text-amber-400' :
                'text-emerald-400'
              }`}>
                {selectedSensorData.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Normal Range</span>
              <span className="text-white/70">
                {selectedSensorData.normalRange.min} – {selectedSensorData.normalRange.max} {selectedSensorData.unit}
              </span>
            </div>

            {/* Value bar */}
            <div className="mt-3">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    selectedSensorData.status === 'critical' ? 'bg-rose-500' :
                    selectedSensorData.status === 'warning' ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (selectedSensorData.value / (selectedSensorData.normalRange.max || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Troubleshooting section for warning/critical sensors */}
            {selectedSensorData.status !== 'normal' && (() => {
              // Map transformer-specific sensor types to the generic troubleshooting categories
              const mappedType: 'temperature' | 'vibration' | 'pressure' | 'power' =
                selectedSensorData.type === 'dga' || selectedSensorData.type === 'oil_quality' || selectedSensorData.type === 'moisture'
                  ? 'pressure'     // DGA/oil maps to "pressure" troubleshooting (fluid analysis)
                  : selectedSensorData.type === 'load' || selectedSensorData.type === 'partial_discharge'
                    ? 'power'
                    : (selectedSensorData.type as 'temperature' | 'vibration' | 'pressure' | 'power');

              const troubleshooting = getSensorTroubleshooting(
                gridAsset ? 'transformer' : (vessel?.type ?? 'transformer'),
                mappedType,
                selectedSensorData.status as 'critical' | 'warning',
              );
              return (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  <h4 className="text-xs font-medium text-white/70 uppercase tracking-wide flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {gridAsset ? 'Grid Asset' : vessel?.type?.replace('_', ' ').toUpperCase() ?? ''} – Troubleshooting
                  </h4>

                  {/* Urgency banner */}
                  <div className={`p-2 rounded text-[10px] ${
                    selectedSensorData.status === 'critical'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    ⚠️ {troubleshooting.urgency}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="text-rose-300 font-medium">Possible Causes:</div>
                    <ul className="text-white/60 space-y-1 pl-3">
                      {troubleshooting.causes.slice(0, 5).map((cause, i) => (
                        <li key={i}>• {cause}</li>
                      ))}
                    </ul>
                    <div className="text-emerald-300 font-medium mt-2">Recommended Actions:</div>
                    <ul className="text-white/60 space-y-1 pl-3">
                      {troubleshooting.actions.slice(0, 5).map((action, i) => (
                        <li key={i}>{i + 1}. {action}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/work-order?asset=${assetId}&equipment=${selectedSensorData.id}&issue=${encodeURIComponent(selectedSensorData.name)}`}
                      className="flex-1 px-3 py-2 rounded-lg bg-primary-500/20 text-primary-400 text-xs hover:bg-primary-500/30 transition-colors border border-primary-500/30 text-center"
                    >
                      Generate Work Order
                    </Link>
                    <Link
                      href={`/troubleshoot?asset=${assetId}&name=${encodeURIComponent(assetName)}&equipment=${encodeURIComponent(selectedSensorData.name)}`}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-white/60 text-xs hover:bg-white/10 transition-colors border border-white/10 text-center"
                    >
                      View Full Guide
                    </Link>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Asset Info Overlay */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-white/10 max-w-[200px]">
        <div className="text-xs text-white/50 mb-1">Digital Twin</div>
        <div className="text-sm font-medium text-white">{assetName}</div>
        <div className="text-[10px] text-white/50 leading-tight capitalize">{assetType}</div>
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${
            healthScore >= 80 ? 'bg-emerald-400' :
            healthScore >= 60 ? 'bg-amber-400' : 'bg-rose-400'
          }`} />
          <span className="text-xs text-white/60">
            Health: {healthScore}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default DigitalTwin;
