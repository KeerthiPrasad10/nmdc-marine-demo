'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sphere } from '@react-three/drei';
import * as THREE from 'three';

export interface SensorData {
  id: string;
  name: string;
  type: 'temperature' | 'vibration' | 'pressure' | 'rpm' | 'fuel' | 'power'
    | 'dga' | 'oil_quality' | 'load' | 'moisture' | 'partial_discharge';
  value: number;
  unit: string;
  normalRange: { min: number; max: number };
  position: [number, number, number];
  status: 'normal' | 'warning' | 'critical';
}

interface SensorMarkerProps {
  sensor: SensorData;
  onClick?: (sensor: SensorData) => void;
  isSelected?: boolean;
}

function SensorMarker({ sensor, onClick, isSelected }: SensorMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Pulse animation for warning/critical sensors
  useFrame((state) => {
    if (meshRef.current && (sensor.status !== 'normal' || hovered)) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
      meshRef.current.scale.setScalar(hovered ? 1.5 : scale);
    }
  });

  const getStatusColor = () => {
    switch (sensor.status) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const getTypeIcon = () => {
    switch (sensor.type) {
      case 'temperature': return '🌡️';
      case 'vibration': return '〰️';
      case 'pressure': return '⏲️';
      case 'rpm': return '⚙️';
      case 'fuel': return '⛽';
      case 'power': return '⚡';
      case 'dga': return '🧪';
      case 'oil_quality': return '🛢️';
      case 'load': return '📊';
      case 'moisture': return '💧';
      case 'partial_discharge': return '⚡';
      default: return '📊';
    }
  };

  const color = getStatusColor();

  return (
    <group position={sensor.position}>
      {/* Sensor marker sphere */}
      <Sphere
        ref={meshRef}
        args={[0.06, 16, 16]}
        onClick={() => onClick?.(sensor)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={sensor.status !== 'normal' ? 0.8 : 0.4}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* Connection line to model */}
      <mesh position={[0, -sensor.position[1] / 2, 0]}>
        <cylinderGeometry args={[0.005, 0.005, Math.abs(sensor.position[1]), 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>

      {/* Tooltip on hover or selection */}
      {(hovered || isSelected) && (
        <Html
          position={[0, 0.15, 0]}
          center
          style={{
            pointerEvents: 'none',
            transform: 'translateY(-50%)',
          }}
        >
          <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white text-xs whitespace-nowrap shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <span>{getTypeIcon()}</span>
              <span className="font-medium">{sensor.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="font-mono">
                {sensor.value.toFixed(1)} {sensor.unit}
              </span>
            </div>
            <div className="text-white/50 text-[10px] mt-1">
              Range: {sensor.normalRange.min} - {sensor.normalRange.max} {sensor.unit}
            </div>
          </div>
        </Html>
      )}

      {/* Outer ring for critical/warning sensors */}
      {sensor.status !== 'normal' && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.1, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

interface SensorOverlayProps {
  sensors: SensorData[];
  selectedSensor?: string | null;
  onSensorClick?: (sensor: SensorData) => void;
  visible?: boolean;
}

export function SensorOverlay({ 
  sensors, 
  selectedSensor, 
  onSensorClick,
  visible = true 
}: SensorOverlayProps) {
  if (!visible) return null;

  return (
    <group>
      {sensors.map((sensor) => (
        <SensorMarker
          key={sensor.id}
          sensor={sensor}
          onClick={onSensorClick}
          isSelected={selectedSensor === sensor.id}
        />
      ))}
    </group>
  );
}

// ───────────────────────────────────────────────
// Generate sensor positions from equipment data
// (legacy – still works for Supabase equipment rows)
// ───────────────────────────────────────────────
export function generateSensorsFromEquipment(equipment: Array<{
  id: string;
  name: string;
  type: string;
  health_score?: number | null;
  temperature?: number | null;
  vibration?: number | null;
}>): SensorData[] {
  const sensors: SensorData[] = [];
  
  equipment.forEach((eq, index) => {
    const angle = (index / equipment.length) * Math.PI * 2;
    const radius = 0.8;
    const x = Math.cos(angle) * radius * 0.5;
    const z = Math.sin(angle) * radius;
    const y = 0.3 + Math.random() * 0.3;

    if (eq.temperature != null) {
      const temp = eq.temperature;
      const tempStatus = temp > 90 ? 'critical' : temp > 75 ? 'warning' : 'normal';
      sensors.push({
        id: `${eq.id}-temp`,
        name: `${eq.name} Temp`,
        type: 'temperature',
        value: temp,
        unit: '°C',
        normalRange: { min: 40, max: 85 },
        position: [x, y, z],
        status: tempStatus,
      });
    }

    if (eq.vibration != null) {
      const vib = eq.vibration;
      const vibStatus = vib > 8 ? 'critical' : vib > 5 ? 'warning' : 'normal';
      sensors.push({
        id: `${eq.id}-vib`,
        name: `${eq.name} Vib`,
        type: 'vibration',
        value: vib,
        unit: 'mm/s',
        normalRange: { min: 0, max: 6 },
        position: [x + 0.1, y + 0.15, z],
        status: vibStatus,
      });
    }

    const healthScore = eq.health_score ?? 100;
    const powerStatus = healthScore < 50 ? 'critical' : healthScore < 70 ? 'warning' : 'normal';
    sensors.push({
      id: `${eq.id}-power`,
      name: `${eq.name} Power`,
      type: 'power',
      value: healthScore,
      unit: '%',
      normalRange: { min: 60, max: 100 },
      position: [x - 0.1, y - 0.1, z],
      status: powerStatus,
    });
  });

  return sensors;
}

// ───────────────────────────────────────────────
// Generate transformer-specific sensors
// Positions are mapped to the TransformerModel geometry.
// ───────────────────────────────────────────────
export interface TransformerSensorInput {
  assetTag: string;
  healthIndex: number;        // 0-100
  topOilTemp?: number;        // °C
  windingHotSpot?: number;    // °C
  dgaH2?: number;             // ppm
  dgaCH4?: number;            // ppm
  dgaC2H2?: number;           // ppm
  oilMoisture?: number;       // ppm
  loadPercent?: number;        // % of nameplate
  partialDischarge?: number;  // pC (picocoulombs)
  bushingPowerFactor?: number;// %
}

export function generateTransformerSensors(input: TransformerSensorInput): SensorData[] {
  const sensors: SensorData[] = [];

  // ── Top oil temperature (conservator area) ──
  const topOilTemp = input.topOilTemp ?? 55 + Math.random() * 30;
  sensors.push({
    id: `${input.assetTag}-top-oil`,
    name: 'Top Oil Temperature',
    type: 'temperature',
    value: topOilTemp,
    unit: '°C',
    normalRange: { min: 30, max: 85 },
    position: [0.6, 1.6, 0],
    status: topOilTemp > 95 ? 'critical' : topOilTemp > 80 ? 'warning' : 'normal',
  });

  // ── Winding hot-spot temperature (main tank centre) ──
  const windingTemp = input.windingHotSpot ?? topOilTemp + 10 + Math.random() * 15;
  sensors.push({
    id: `${input.assetTag}-winding-hs`,
    name: 'Winding Hot-Spot',
    type: 'temperature',
    value: windingTemp,
    unit: '°C',
    normalRange: { min: 40, max: 110 },
    position: [0, 0.6, 0],
    status: windingTemp > 120 ? 'critical' : windingTemp > 105 ? 'warning' : 'normal',
  });

  // ── DGA – Hydrogen (main tank, top) ──
  const h2 = input.dgaH2 ?? Math.random() * 200;
  sensors.push({
    id: `${input.assetTag}-dga-h2`,
    name: 'DGA – Hydrogen (H₂)',
    type: 'dga',
    value: h2,
    unit: 'ppm',
    normalRange: { min: 0, max: 100 },
    position: [-0.6, 0.9, 0.3],
    status: h2 > 500 ? 'critical' : h2 > 100 ? 'warning' : 'normal',
  });

  // ── DGA – Acetylene (main tank, bottom) ──
  const c2h2 = input.dgaC2H2 ?? Math.random() * 10;
  sensors.push({
    id: `${input.assetTag}-dga-c2h2`,
    name: 'DGA – Acetylene (C₂H₂)',
    type: 'dga',
    value: c2h2,
    unit: 'ppm',
    normalRange: { min: 0, max: 2 },
    position: [-0.6, 0.2, -0.3],
    status: c2h2 > 10 ? 'critical' : c2h2 > 2 ? 'warning' : 'normal',
  });

  // ── DGA – Methane ──
  const ch4 = input.dgaCH4 ?? Math.random() * 150;
  sensors.push({
    id: `${input.assetTag}-dga-ch4`,
    name: 'DGA – Methane (CH₄)',
    type: 'dga',
    value: ch4,
    unit: 'ppm',
    normalRange: { min: 0, max: 120 },
    position: [0.4, 0.4, -0.4],
    status: ch4 > 400 ? 'critical' : ch4 > 120 ? 'warning' : 'normal',
  });

  // ── Oil moisture (conservator / breather) ──
  const moisture = input.oilMoisture ?? 10 + Math.random() * 25;
  sensors.push({
    id: `${input.assetTag}-moisture`,
    name: 'Oil Moisture',
    type: 'moisture',
    value: moisture,
    unit: 'ppm',
    normalRange: { min: 0, max: 20 },
    position: [0.8, 1.2, 0.2],
    status: moisture > 35 ? 'critical' : moisture > 20 ? 'warning' : 'normal',
  });

  // ── Load (% of nameplate) ──
  const load = input.loadPercent ?? 40 + Math.random() * 50;
  sensors.push({
    id: `${input.assetTag}-load`,
    name: 'Load (MVA)',
    type: 'load',
    value: load,
    unit: '%',
    normalRange: { min: 0, max: 100 },
    position: [0, -0.3, 0.5],
    status: load > 110 ? 'critical' : load > 90 ? 'warning' : 'normal',
  });

  // ── Partial discharge ──
  const pd = input.partialDischarge ?? Math.random() * 200;
  sensors.push({
    id: `${input.assetTag}-pd`,
    name: 'Partial Discharge',
    type: 'partial_discharge',
    value: pd,
    unit: 'pC',
    normalRange: { min: 0, max: 300 },
    position: [-0.3, 1.5, -0.2],
    status: pd > 500 ? 'critical' : pd > 300 ? 'warning' : 'normal',
  });

  // ── Bushing power factor (HV bushing #2) ──
  const bpf = input.bushingPowerFactor ?? 0.3 + Math.random() * 0.5;
  sensors.push({
    id: `${input.assetTag}-bushing-pf`,
    name: 'Bushing Power Factor',
    type: 'power',
    value: bpf,
    unit: '%',
    normalRange: { min: 0, max: 0.5 },
    position: [0, 1.8, -0.2],
    status: bpf > 1.0 ? 'critical' : bpf > 0.5 ? 'warning' : 'normal',
  });

  // ── Health index (overall) ──
  const hi = input.healthIndex;
  sensors.push({
    id: `${input.assetTag}-health`,
    name: 'Health Index',
    type: 'power',
    value: hi,
    unit: '%',
    normalRange: { min: 60, max: 100 },
    position: [0.6, 0.4, 0.5],
    status: hi < 40 ? 'critical' : hi < 65 ? 'warning' : 'normal',
  });

  return sensors;
}
