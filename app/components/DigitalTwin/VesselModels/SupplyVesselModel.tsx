'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SupplyVesselModelProps {
  healthScore: number;
  isSelected?: boolean;
  hasDP?: boolean; // Large ferry class flag
}

// This model represents a WSDOT passenger/vehicle ferry
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
  const accentColor = isSelected ? '#a855f7' : '#22c55e'; // Green for WSDOT ferries

  return (
    <group ref={groupRef}>
      {/* Hull - wide ferry hull */}
      <mesh position={[0, -0.2, 0]} castShadow>
        <boxGeometry args={[3.5, 0.5, 1.3]} />
        <meshStandardMaterial color={hullColor} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Bow - blunt ferry bow */}
      <mesh position={[1.85, -0.15, 0]} castShadow>
        <boxGeometry args={[0.3, 0.45, 1.1]} />
        <meshStandardMaterial color={hullColor} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Stern - blunt ferry stern */}
      <mesh position={[-1.85, -0.15, 0]} castShadow>
        <boxGeometry args={[0.3, 0.45, 1.1]} />
        <meshStandardMaterial color={hullColor} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Vehicle deck (main deck) */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[3.3, 0.06, 1.2]} />
        <meshStandardMaterial color="#374151" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Vehicle deck lane markings */}
      {[-0.3, 0, 0.3].map((z, i) => (
        <mesh key={`lane-${i}`} position={[0, 0.12, z]}>
          <boxGeometry args={[2.8, 0.005, 0.02]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} />
        </mesh>
      ))}

      {/* Passenger superstructure - forward section */}
      <mesh position={[0.6, 0.55, 0]} castShadow>
        <boxGeometry args={[1.4, 0.8, 1.0]} />
        <meshStandardMaterial color={superstructureColor} metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Passenger superstructure - aft section */}
      <mesh position={[-0.6, 0.55, 0]} castShadow>
        <boxGeometry args={[1.2, 0.8, 1.0]} />
        <meshStandardMaterial color={superstructureColor} metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Passenger deck windows - forward port side */}
      <mesh position={[0.6, 0.6, 0.51]}>
        <boxGeometry args={[1.2, 0.3, 0.02]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
      </mesh>
      {/* Passenger deck windows - forward starboard side */}
      <mesh position={[0.6, 0.6, -0.51]}>
        <boxGeometry args={[1.2, 0.3, 0.02]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
      </mesh>
      {/* Passenger deck windows - aft port side */}
      <mesh position={[-0.6, 0.6, 0.51]}>
        <boxGeometry args={[1.0, 0.3, 0.02]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
      </mesh>
      {/* Passenger deck windows - aft starboard side */}
      <mesh position={[-0.6, 0.6, -0.51]}>
        <boxGeometry args={[1.0, 0.3, 0.02]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
      </mesh>

      {/* Bridge deck (pilot house) */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.9, 0.35, 0.85]} />
        <meshStandardMaterial color={superstructureColor} metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Bridge windows - forward */}
      <mesh position={[0.46, 1.08, 0]}>
        <boxGeometry args={[0.02, 0.25, 0.65]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.4} />
      </mesh>
      {/* Bridge windows - aft */}
      <mesh position={[-0.46, 1.08, 0]}>
        <boxGeometry args={[0.02, 0.25, 0.65]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.4} />
      </mesh>

      {/* Mast */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 0.5, 8]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>

      {/* Radar */}
      <group position={[0, 1.7, 0]}>
        <mesh ref={radarRef}>
          <boxGeometry args={[0.3, 0.03, 0.06]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
      </group>

      {/* Funnels (twin stacks) */}
      <mesh position={[0.3, 0.85, 0.3]} castShadow>
        <boxGeometry args={[0.2, 0.4, 0.2]} />
        <meshStandardMaterial color={accentColor} metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[0.3, 0.85, -0.3]} castShadow>
        <boxGeometry args={[0.2, 0.4, 0.2]} />
        <meshStandardMaterial color={accentColor} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Bow loading ramp */}
      <mesh position={[1.95, 0.0, 0]} castShadow>
        <boxGeometry args={[0.15, 0.05, 0.8]} />
        <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Bow ramp hinges */}
      <mesh position={[1.8, 0.1, 0.35]}>
        <cylinderGeometry args={[0.03, 0.03, 0.06, 8]} />
        <meshStandardMaterial color="#6b7280" metalness={0.6} />
      </mesh>
      <mesh position={[1.8, 0.1, -0.35]}>
        <cylinderGeometry args={[0.03, 0.03, 0.06, 8]} />
        <meshStandardMaterial color="#6b7280" metalness={0.6} />
      </mesh>

      {/* Stern loading ramp */}
      <mesh position={[-1.95, 0.0, 0]} castShadow>
        <boxGeometry args={[0.15, 0.05, 0.8]} />
        <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Bow thrusters (for docking) */}
      {hasDP && (
        <>
          <mesh position={[1.4, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.3, 8]} />
            <meshStandardMaterial color="#4b5563" />
          </mesh>
          {/* Stern thrusters */}
          <mesh position={[-1.4, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.3, 8]} />
            <meshStandardMaterial color="#4b5563" />
          </mesh>
        </>
      )}

      {/* Safety rails - port side */}
      <mesh position={[0, 0.18, 0.62]}>
        <boxGeometry args={[3.2, 0.1, 0.02]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
      {/* Safety rails - starboard side */}
      <mesh position={[0, 0.18, -0.62]}>
        <boxGeometry args={[3.2, 0.1, 0.02]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      {/* Life rafts */}
      {[0.4, -0.4].map((x, i) => (
        <group key={`raft-${i}`}>
          <mesh position={[x, 0.95, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 12]} />
            <meshStandardMaterial color="#f97316" />
          </mesh>
          <mesh position={[x, 0.95, -0.52]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 12]} />
            <meshStandardMaterial color="#f97316" />
          </mesh>
        </group>
      ))}

      {/* Health indicator */}
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={healthColor} emissive={healthColor} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

export default SupplyVesselModel;
