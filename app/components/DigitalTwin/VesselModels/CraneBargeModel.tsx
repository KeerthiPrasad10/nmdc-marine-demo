'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CraneBargeModelProps {
  healthScore: number;
  isSelected?: boolean;
  craneCapacity?: number; // in tons
}

export function CraneBargeModel({ healthScore, isSelected = false, craneCapacity = 1000 }: CraneBargeModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const craneArmRef = useRef<THREE.Group>(null);
  const hookRef = useRef<THREE.Mesh>(null);
  
  // Floating and crane animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.02;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.01;
    }
    // Slow crane rotation
    if (craneArmRef.current) {
      craneArmRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.3;
    }
    // Hook sway
    if (hookRef.current) {
      hookRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
    }
  });

  const healthColor = healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444';
  const hullColor = '#1a1a2e';
  const craneColor = '#fbbf24'; // Yellow crane
  const accentColor = isSelected ? '#a855f7' : '#3b82f6';

  // Scale crane based on capacity
  const craneScale = craneCapacity > 2000 ? 1.3 : craneCapacity > 1000 ? 1.1 : 1;

  return (
    <group ref={groupRef}>
      {/* Barge Hull - flat and wide */}
      <mesh position={[0, -0.25, 0]} castShadow>
        <boxGeometry args={[5, 0.5, 2.2]} />
        <meshStandardMaterial color={hullColor} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Deck */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[4.8, 0.1, 2]} />
        <meshStandardMaterial color="#374151" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Deck markings */}
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[4.6, 0.01, 0.1]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>

      {/* Crane Tower Base */}
      <group ref={craneArmRef} position={[-0.5, 0.1, 0]} scale={[craneScale, craneScale, craneScale]}>
        {/* Base plate */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.6, 0.7, 0.1, 16]} />
          <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.5} />
        </mesh>

        {/* Main tower */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[0.4, 1.4, 0.4]} />
          <meshStandardMaterial color={craneColor} metalness={0.4} roughness={0.6} />
        </mesh>

        {/* Tower lattice details */}
        {[0.3, 0.6, 0.9, 1.2].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <boxGeometry args={[0.5, 0.03, 0.5]} />
            <meshStandardMaterial color="#92400e" />
          </mesh>
        ))}

        {/* Crane cabin */}
        <mesh position={[0.15, 1.5, 0]} castShadow>
          <boxGeometry args={[0.4, 0.35, 0.35]} />
          <meshStandardMaterial color={craneColor} metalness={0.3} roughness={0.7} />
        </mesh>
        {/* Cabin window */}
        <mesh position={[0.36, 1.5, 0]}>
          <boxGeometry args={[0.02, 0.2, 0.25]} />
          <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
        </mesh>

        {/* Main boom */}
        <group position={[0, 1.6, 0]} rotation={[0, 0, 0.4]}>
          <mesh position={[1.2, 0, 0]} castShadow>
            <boxGeometry args={[2.5, 0.2, 0.2]} />
            <meshStandardMaterial color={craneColor} metalness={0.4} roughness={0.6} />
          </mesh>
          
          {/* Boom lattice */}
          {[0.3, 0.8, 1.3, 1.8, 2.3].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, 0.5]}>
              <boxGeometry args={[0.02, 0.25, 0.02]} />
              <meshStandardMaterial color="#92400e" />
            </mesh>
          ))}
        </group>

        {/* Counter jib */}
        <group position={[0, 1.6, 0]} rotation={[0, 0, -0.1]}>
          <mesh position={[-0.5, 0, 0]} castShadow>
            <boxGeometry args={[1, 0.15, 0.15]} />
            <meshStandardMaterial color={craneColor} metalness={0.4} roughness={0.6} />
          </mesh>
          {/* Counterweight */}
          <mesh position={[-0.9, -0.1, 0]}>
            <boxGeometry args={[0.4, 0.3, 0.3]} />
            <meshStandardMaterial color="#1f2937" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>

        {/* Cable system */}
        <mesh position={[1.5, 0.8, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 1.6, 8]} />
          <meshStandardMaterial color="#6b7280" />
        </mesh>

        {/* Hook */}
        <group ref={hookRef} position={[2, 0, 0]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <torusGeometry args={[0.08, 0.02, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* Accommodation block */}
      <mesh position={[1.8, 0.5, 0]} castShadow>
        <boxGeometry args={[1, 0.8, 1.2]} />
        <meshStandardMaterial color="#16213e" metalness={0.2} roughness={0.8} />
      </mesh>
      {/* Windows */}
      <mesh position={[2.31, 0.5, 0]}>
        <boxGeometry args={[0.02, 0.3, 0.8]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.2} />
      </mesh>

      {/* Spud poles for positioning */}
      {[[-2, 0.8], [-2, -0.8], [2.2, 0.8], [2.2, -0.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.8, z]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.6, 8]} />
          <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* Ballast tanks (visible as deck structures) */}
      <mesh position={[-2, 0.2, 0.6]}>
        <boxGeometry args={[0.6, 0.2, 0.4]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      <mesh position={[-2, 0.2, -0.6]}>
        <boxGeometry args={[0.6, 0.2, 0.4]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>

      {/* A-frame at stern */}
      <group position={[-2.2, 0.1, 0]}>
        <mesh position={[0, 0.5, 0.5]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
          <meshStandardMaterial color={accentColor} />
        </mesh>
        <mesh position={[0, 0.5, -0.5]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
          <meshStandardMaterial color={accentColor} />
        </mesh>
        <mesh position={[0.3, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
          <meshStandardMaterial color={accentColor} />
        </mesh>
      </group>

      {/* Health indicator */}
      <mesh position={[1.8, 1, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={healthColor} emissive={healthColor} emissiveIntensity={0.8} />
      </mesh>

      {/* Crane capacity label */}
      <mesh position={[-0.5, 2.1 * craneScale, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.1]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

export default CraneBargeModel;















