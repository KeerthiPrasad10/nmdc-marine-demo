'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sphere } from '@react-three/drei';
import * as THREE from 'three';

export interface SensorData {
  id: string;
  name: string;
  type: 'temperature' | 'vibration' | 'pressure' | 'rpm' | 'fuel' | 'power';
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

      {/* Connection line to vessel */}
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

// Generate sensor positions based on equipment data
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
    // Distribute sensors around the vessel
    const angle = (index / equipment.length) * Math.PI * 2;
    const radius = 0.8;
    const x = Math.cos(angle) * radius * 0.5;
    const z = Math.sin(angle) * radius;
    const y = 0.3 + Math.random() * 0.3;

    // Temperature sensor
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

    // Vibration sensor
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

    // Health-based power sensor
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

