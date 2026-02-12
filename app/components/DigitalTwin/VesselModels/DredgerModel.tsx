'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DredgerModelProps {
  healthScore: number;
  isSelected?: boolean;
  subType?: 'hopper' | 'csd' | 'backhoe';
}

export function DredgerModel({ healthScore, isSelected = false, subType = 'hopper' }: DredgerModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const dragheadRef = useRef<THREE.Group>(null);
  const pipeRef = useRef<THREE.Mesh>(null);
  
  // Subtle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.015;
    }
    // Animate draghead movement for trailing suction hopper dredger
    if (dragheadRef.current && subType === 'hopper') {
      dragheadRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1 - 0.3;
    }
  });

  const healthColor = healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444';
  const hullColor = '#1a1a2e';
  const deckColor = '#16213e';
  const accentColor = isSelected ? '#a855f7' : '#3b82f6';

  if (subType === 'csd') {
    // Cutter Suction Dredger
    return (
      <group ref={groupRef}>
        {/* Hull - wider for stability */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <boxGeometry args={[4, 0.5, 1.8]} />
          <meshStandardMaterial color={hullColor} metalness={0.3} roughness={0.7} />
        </mesh>

        {/* Deck */}
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[3.8, 0.1, 1.6]} />
          <meshStandardMaterial color={deckColor} metalness={0.2} roughness={0.8} />
        </mesh>

        {/* Superstructure / Bridge */}
        <mesh position={[-0.8, 0.6, 0]} castShadow>
          <boxGeometry args={[1.2, 0.8, 1]} />
          <meshStandardMaterial color={deckColor} metalness={0.2} roughness={0.8} />
        </mesh>

        {/* Windows */}
        <mesh position={[-0.2, 0.7, 0]}>
          <boxGeometry args={[0.05, 0.3, 0.8]} />
          <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
        </mesh>

        {/* Cutter Ladder (the distinctive feature) */}
        <group position={[2.2, 0, 0]} rotation={[0, 0, -0.4]}>
          {/* Ladder structure */}
          <mesh position={[0.8, -0.3, 0]} castShadow>
            <boxGeometry args={[2, 0.15, 0.4]} />
            <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.5} />
          </mesh>
          
          {/* Cutter head */}
          <mesh position={[1.8, -0.5, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.3, 0.5, 12]} />
            <meshStandardMaterial color={accentColor} metalness={0.6} roughness={0.4} />
          </mesh>
          
          {/* Cutter teeth */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <mesh 
              key={i} 
              position={[
                1.8 + Math.cos(angle * Math.PI / 180) * 0.35,
                -0.5,
                Math.sin(angle * Math.PI / 180) * 0.35
              ]}
            >
              <boxGeometry args={[0.08, 0.1, 0.08]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          
          {/* Suction pipe */}
          <mesh position={[0.8, -0.1, 0]} rotation={[0, 0, 0.4]}>
            <cylinderGeometry args={[0.12, 0.12, 2.2, 8]} />
            <meshStandardMaterial color="#4b5563" metalness={0.4} roughness={0.6} />
          </mesh>
        </group>

        {/* Spud poles (for positioning) */}
        <mesh position={[-1.5, -0.8, 0.6]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 1.8, 8]} />
          <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[-1.5, -0.8, -0.6]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 1.8, 8]} />
          <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.5} />
        </mesh>

        {/* Discharge pipe on deck */}
        <mesh position={[-1, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 1.5, 8]} />
          <meshStandardMaterial color="#374151" metalness={0.4} roughness={0.6} />
        </mesh>

        {/* Engine room vents */}
        <mesh position={[0.5, 0.4, 0.4]}>
          <boxGeometry args={[0.3, 0.3, 0.2]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>
        <mesh position={[0.5, 0.4, -0.4]}>
          <boxGeometry args={[0.3, 0.3, 0.2]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>

        {/* Health indicator light */}
        <mesh position={[-0.8, 1.1, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color={healthColor} emissive={healthColor} emissiveIntensity={0.8} />
        </mesh>
      </group>
    );
  }

  // Default: Trailing Suction Hopper Dredger (TSHD)
  return (
    <group ref={groupRef}>
      {/* Main Hull - ship-shaped */}
      <mesh position={[0, -0.2, 0]} castShadow>
        <boxGeometry args={[4.5, 0.5, 1.4]} />
        <meshStandardMaterial color={hullColor} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Bow - pointed */}
      <mesh position={[2.4, -0.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[0.6, 0.5, 0.6]} />
        <meshStandardMaterial color={hullColor} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Hopper (cargo hold for dredged material) */}
      <mesh position={[0.3, 0.1, 0]}>
        <boxGeometry args={[2.5, 0.5, 1.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.2} roughness={0.8} />
      </mesh>
      {/* Hopper opening */}
      <mesh position={[0.3, 0.35, 0]}>
        <boxGeometry args={[2.3, 0.02, 1]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Bridge / Superstructure at stern */}
      <mesh position={[-1.6, 0.6, 0]} castShadow>
        <boxGeometry args={[1, 0.9, 1]} />
        <meshStandardMaterial color={deckColor} metalness={0.2} roughness={0.8} />
      </mesh>
      <mesh position={[-1.6, 1.15, 0]}>
        <boxGeometry args={[0.8, 0.3, 0.8]} />
        <meshStandardMaterial color={deckColor} metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Windows */}
      <mesh position={[-1.1, 0.7, 0]}>
        <boxGeometry args={[0.05, 0.4, 0.8]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
      </mesh>

      {/* Funnel / Exhaust */}
      <mesh position={[-1.6, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.4, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Trailing suction arm (draghead) */}
      <group ref={dragheadRef} position={[1.5, 0, 0.8]}>
        {/* Suction pipe */}
        <mesh position={[0.5, -0.6, 0]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.15, 1.5, 8]} />
          <meshStandardMaterial color="#4b5563" metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Draghead */}
        <mesh position={[0.8, -1.2, 0]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.5, 0.15, 0.4]} />
          <meshStandardMaterial color={accentColor} metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Draghead visor */}
        <mesh position={[1, -1.25, 0]} rotation={[0.7, 0, 0]}>
          <boxGeometry args={[0.3, 0.08, 0.35]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* Port side suction arm */}
      <group position={[1.5, 0, -0.8]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0.5, -0.6, 0]} rotation={[-0.3, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.15, 1.5, 8]} />
          <meshStandardMaterial color="#4b5563" metalness={0.4} roughness={0.6} />
        </mesh>
      </group>

      {/* Bottom doors (for dumping) */}
      <mesh position={[0.3, -0.45, 0]}>
        <boxGeometry args={[2, 0.05, 1]} />
        <meshStandardMaterial color="#dc2626" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Pump room housing */}
      <mesh position={[1.8, 0.3, 0]}>
        <boxGeometry args={[0.5, 0.3, 0.6]} />
        <meshStandardMaterial color={deckColor} />
      </mesh>

      {/* Health indicator */}
      <mesh position={[-1.6, 1.8, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={healthColor} emissive={healthColor} emissiveIntensity={0.8} />
      </mesh>

      {/* Deck equipment */}
      <mesh position={[-0.8, 0.45, 0.5]}>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
      <mesh position={[-0.8, 0.45, -0.5]}>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
    </group>
  );
}

export default DredgerModel;















