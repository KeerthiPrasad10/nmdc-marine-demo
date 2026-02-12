'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface JackUpModelProps {
  healthScore: number;
  isSelected?: boolean;
  legCount?: number; // 3 or 4 legs typically
}

export function JackUpModel({ healthScore, isSelected = false, legCount = 4 }: JackUpModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const craneRef = useRef<THREE.Group>(null);
  
  // Subtle animation - jack-ups are stable when jacked up
  useFrame((state) => {
    if (groupRef.current) {
      // Very minimal movement - platform is elevated and stable
      groupRef.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 0.2) * 0.005;
    }
    // Slow crane rotation
    if (craneRef.current) {
      craneRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.2;
    }
  });

  const healthColor = healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444';
  const hullColor = '#1a1a2e';
  const legColor = '#374151';
  const deckColor = '#16213e';
  const accentColor = isSelected ? '#a855f7' : '#8b5cf6'; // Violet for jack-ups

  // Leg positions for 4-leg configuration
  const legPositions = legCount === 4 
    ? [[-1.2, 0, -0.8], [1.2, 0, -0.8], [-1.2, 0, 0.8], [1.2, 0, 0.8]]
    : [[-1, 0, -0.9], [1, 0, -0.9], [0, 0, 1]]; // 3-leg triangular

  return (
    <group ref={groupRef}>
      {/* Platform Hull - elevated above water */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[3.2, 0.4, 2.2]} />
        <meshStandardMaterial color={hullColor} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Main Deck */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[3, 0.1, 2]} />
        <meshStandardMaterial color={deckColor} metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Deck markings - helipad */}
      <mesh position={[0.8, 1.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.35, 32]} />
        <meshStandardMaterial color="#fbbf24" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.8, 1.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, 0.6]} />
        <meshStandardMaterial color="#fbbf24" side={THREE.DoubleSide} />
      </mesh>

      {/* Jack-Up Legs - the distinctive feature */}
      {legPositions.map((pos, i) => (
        <group key={i} position={[pos[0], pos[1], pos[2]]}>
          {/* Main leg structure - lattice tower */}
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.25, 2.4, 0.25]} />
            <meshStandardMaterial color={legColor} metalness={0.5} roughness={0.5} />
          </mesh>
          
          {/* Leg cross braces */}
          {[0.3, 0.7, 1.1].map((y, j) => (
            <group key={j}>
              <mesh position={[0, y, 0]} rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[0.35, 0.03, 0.03]} />
                <meshStandardMaterial color={legColor} />
              </mesh>
              <mesh position={[0, y, 0]} rotation={[0, -Math.PI / 4, 0]}>
                <boxGeometry args={[0.35, 0.03, 0.03]} />
                <meshStandardMaterial color={legColor} />
              </mesh>
            </group>
          ))}
          
          {/* Leg guide at hull level */}
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[0.35, 0.15, 0.35]} />
            <meshStandardMaterial color="#4b5563" metalness={0.4} roughness={0.6} />
          </mesh>
          
          {/* Spud can (foundation) at bottom */}
          <mesh position={[0, -1, 0]}>
            <cylinderGeometry args={[0.2, 0.35, 0.3, 8]} />
            <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Superstructure / Accommodation */}
      <mesh position={[-0.9, 1.5, 0]} castShadow>
        <boxGeometry args={[1, 0.8, 1.4]} />
        <meshStandardMaterial color={deckColor} metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Bridge deck */}
      <mesh position={[-0.9, 1.95, 0]} castShadow>
        <boxGeometry args={[1.1, 0.1, 1.5]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>

      {/* Windows */}
      <mesh position={[-0.38, 1.55, 0]}>
        <boxGeometry args={[0.02, 0.4, 1.2]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
      </mesh>

      {/* Crane on deck */}
      <group ref={craneRef} position={[0.6, 1.1, -0.5]}>
        {/* Crane pedestal */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 0.3, 12]} />
          <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.5} />
        </mesh>

        {/* Crane house */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.3, 0.35, 0.25]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.4} roughness={0.6} />
        </mesh>

        {/* Crane boom */}
        <mesh position={[0.4, 0.55, 0]} rotation={[0, 0, -0.3]} castShadow>
          <boxGeometry args={[0.8, 0.08, 0.08]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.4} roughness={0.6} />
        </mesh>

        {/* Hook cable */}
        <mesh position={[0.7, 0.3, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.4, 8]} />
          <meshBasicMaterial color="#6b7280" />
        </mesh>
      </group>

      {/* Secondary crane */}
      <group position={[0.6, 1.1, 0.6]}>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.2, 8]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.2, 0.25, 0.18]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0.25, 0.38, 0]} rotation={[0, 0, -0.25]}>
          <boxGeometry args={[0.5, 0.05, 0.05]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
      </group>

      {/* Equipment containers on deck */}
      {[[0, 1.15, 0.7], [0.3, 1.15, 0.7], [-0.3, 1.15, -0.7]].map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1], pos[2]]} castShadow>
          <boxGeometry args={[0.25, 0.15, 0.12]} />
          <meshStandardMaterial color={i === 2 ? '#dc2626' : '#374151'} />
        </mesh>
      ))}

      {/* Ventilation / exhaust stacks */}
      <mesh position={[-1.2, 1.7, 0.3]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
      <mesh position={[-1.2, 1.7, -0.3]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>

      {/* Radar mast */}
      <mesh position={[-0.9, 2.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
      <mesh position={[-0.9, 2.35, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>

      {/* Health indicator light */}
      <pointLight
        position={[0, 1.5, 0]}
        color={healthColor}
        intensity={0.3}
        distance={2}
      />

      {/* Selection glow */}
      {isSelected && (
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[3.4, 0.6, 2.4]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.1} />
        </mesh>
      )}

      {/* Water surface reference */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial 
          color="#0c4a6e" 
          transparent 
          opacity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}






