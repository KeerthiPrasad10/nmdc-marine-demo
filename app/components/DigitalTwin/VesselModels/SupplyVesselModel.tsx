'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SupplyVesselModelProps {
  healthScore: number;
  isSelected?: boolean;
  hasDP?: boolean; // Dynamic Positioning
}

export function SupplyVesselModel({ healthScore, isSelected = false, hasDP = true }: SupplyVesselModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const radarRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.015;
      groupRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.25) * 0.01;
    }
    // Rotating radar
    if (radarRef.current) {
      radarRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  const healthColor = healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444';
  const hullColor = '#1a1a2e';
  const superstructureColor = '#16213e';
  const accentColor = isSelected ? '#a855f7' : '#22c55e'; // Green for supply vessels

  return (
    <group ref={groupRef}>
      {/* Hull - long cargo deck */}
      <mesh position={[0, -0.2, 0]} castShadow>
        <boxGeometry args={[3.5, 0.5, 1.1]} />
        <meshStandardMaterial color={hullColor} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Bow - slightly pointed */}
      <mesh position={[1.85, -0.15, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[0.4, 0.45, 0.4]} />
        <meshStandardMaterial color={hullColor} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Main deck */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[3.3, 0.06, 1]} />
        <meshStandardMaterial color="#374151" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Cargo deck area (open) */}
      <mesh position={[0.5, 0.05, 0]}>
        <boxGeometry args={[2, 0.02, 0.9]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Deck tie-down points */}
      {[-0.3, 0.3, 0.9, 1.5].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.12, 0.35]}>
            <cylinderGeometry args={[0.03, 0.03, 0.08, 8]} />
            <meshStandardMaterial color="#6b7280" metalness={0.6} />
          </mesh>
          <mesh position={[x, 0.12, -0.35]}>
            <cylinderGeometry args={[0.03, 0.03, 0.08, 8]} />
            <meshStandardMaterial color="#6b7280" metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Superstructure at bow */}
      <mesh position={[-1.1, 0.5, 0]} castShadow>
        <boxGeometry args={[1, 0.8, 0.9]} />
        <meshStandardMaterial color={superstructureColor} metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Bridge deck */}
      <mesh position={[-1.1, 0.95, 0]} castShadow>
        <boxGeometry args={[0.9, 0.35, 0.85]} />
        <meshStandardMaterial color={superstructureColor} metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Bridge windows */}
      <mesh position={[-0.65, 0.55, 0]}>
        <boxGeometry args={[0.02, 0.35, 0.7]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-0.65, 1, 0]}>
        <boxGeometry args={[0.02, 0.25, 0.65]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
      </mesh>

      {/* Mast */}
      <mesh position={[-1.1, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 0.5, 8]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>

      {/* Radar */}
      <group position={[-1.1, 1.6, 0]}>
        <mesh ref={radarRef}>
          <boxGeometry args={[0.3, 0.03, 0.06]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
      </group>

      {/* Funnel */}
      <mesh position={[-1.4, 0.8, 0]} castShadow>
        <boxGeometry args={[0.25, 0.35, 0.3]} />
        <meshStandardMaterial color={accentColor} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Crane for cargo handling */}
      <group position={[-0.3, 0.1, 0]}>
        {/* Crane pedestal */}
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.3, 8]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        {/* Crane arm */}
        <mesh position={[0.4, 0.45, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.8, 0.08, 0.08]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
      </group>

      {/* DP thrusters (if equipped) */}
      {hasDP && (
        <>
          {/* Bow thruster tunnel */}
          <mesh position={[1.4, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.1, 8]} />
            <meshStandardMaterial color="#4b5563" />
          </mesh>
          {/* Stern thrusters */}
          <mesh position={[-1.5, -0.35, 0.3]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.15, 8]} />
            <meshStandardMaterial color="#4b5563" />
          </mesh>
          <mesh position={[-1.5, -0.35, -0.3]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.15, 8]} />
            <meshStandardMaterial color="#4b5563" />
          </mesh>
          {/* DP indicator */}
          <mesh position={[-1.1, 1.2, 0.3]}>
            <boxGeometry args={[0.1, 0.05, 0.05]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.5} />
          </mesh>
        </>
      )}

      {/* Cargo on deck (containers/equipment) */}
      <mesh position={[0.8, 0.25, 0]} castShadow>
        <boxGeometry args={[0.6, 0.3, 0.5]} />
        <meshStandardMaterial color="#dc2626" metalness={0.2} roughness={0.8} />
      </mesh>
      <mesh position={[0.2, 0.2, 0.2]} castShadow>
        <boxGeometry args={[0.4, 0.2, 0.35]} />
        <meshStandardMaterial color="#2563eb" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Safety rails */}
      <mesh position={[0.3, 0.18, 0.5]}>
        <boxGeometry args={[2.5, 0.1, 0.02]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
      <mesh position={[0.3, 0.18, -0.5]}>
        <boxGeometry args={[2.5, 0.1, 0.02]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      {/* Life rafts */}
      <mesh position={[-1.3, 0.25, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 12]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      <mesh position={[-1.3, 0.25, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 12]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>

      {/* Health indicator */}
      <mesh position={[-1.1, 1.75, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={healthColor} emissive={healthColor} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

export default SupplyVesselModel;

