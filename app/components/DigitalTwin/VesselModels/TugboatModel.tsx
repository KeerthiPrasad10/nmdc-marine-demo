'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TugboatModelProps {
  healthScore: number;
  isSelected?: boolean;
  bollardPull?: number; // in tons
}

export function TugboatModel({ healthScore, isSelected = false, bollardPull = 80 }: TugboatModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const propWashRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.04;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.02;
      groupRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.35) * 0.015;
    }
    // Prop wash animation
    if (propWashRef.current) {
      propWashRef.current.rotation.y = state.clock.elapsedTime * 3;
    }
  });

  const healthColor = healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444';
  const hullColor = '#1a1a2e';
  const superstructureColor = '#16213e';
  const accentColor = isSelected ? '#a855f7' : '#dc2626'; // Tugs often have red accents

  // Scale based on bollard pull
  const scale = bollardPull > 100 ? 1.2 : bollardPull > 60 ? 1 : 0.9;

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {/* Hull - compact and strong */}
      <mesh position={[0, -0.15, 0]} castShadow>
        <boxGeometry args={[2.2, 0.4, 0.9]} />
        <meshStandardMaterial color={hullColor} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Bow - reinforced pusher bow */}
      <mesh position={[1.2, -0.1, 0]} castShadow>
        <boxGeometry args={[0.3, 0.35, 0.85]} />
        <meshStandardMaterial color={hullColor} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Bow fender */}
      <mesh position={[1.35, -0.05, 0]}>
        <boxGeometry args={[0.08, 0.4, 0.9]} />
        <meshStandardMaterial color="#1f2937" metalness={0.2} roughness={0.9} />
      </mesh>

      {/* Main deck */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[2, 0.06, 0.85]} />
        <meshStandardMaterial color="#374151" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Superstructure - compact wheelhouse */}
      <mesh position={[0.2, 0.45, 0]} castShadow>
        <boxGeometry args={[0.9, 0.7, 0.7]} />
        <meshStandardMaterial color={superstructureColor} metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Wheelhouse roof */}
      <mesh position={[0.2, 0.85, 0]}>
        <boxGeometry args={[0.95, 0.08, 0.75]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>

      {/* Windows - wrap-around */}
      <mesh position={[0.66, 0.5, 0]}>
        <boxGeometry args={[0.02, 0.35, 0.6]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.2, 0.5, 0.36]}>
        <boxGeometry args={[0.7, 0.35, 0.02]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.2, 0.5, -0.36]}>
        <boxGeometry args={[0.7, 0.35, 0.02]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
      </mesh>

      {/* Funnel */}
      <mesh position={[-0.3, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.4, 8]} />
        <meshStandardMaterial color={accentColor} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Funnel top */}
      <mesh position={[-0.3, 0.92, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.05, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Towing winch (stern) */}
      <mesh position={[-0.8, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.3, 12]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Winch drum */}
      <mesh position={[-0.8, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.03, 8, 24]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>

      {/* Towing hook/pin */}
      <mesh position={[-0.95, 0.15, 0]}>
        <boxGeometry args={[0.1, 0.15, 0.15]} />
        <meshStandardMaterial color="#6b7280" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Forward towing winch */}
      <mesh position={[0.85, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.25, 8]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Fenders (tire fenders on sides) */}
      {[-0.3, 0.1, 0.5].map((x, i) => (
        <group key={i}>
          <mesh position={[x, -0.05, 0.48]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.08, 0.03, 8, 16]} />
            <meshStandardMaterial color="#1f2937" roughness={0.9} />
          </mesh>
          <mesh position={[x, -0.05, -0.48]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.08, 0.03, 8, 16]} />
            <meshStandardMaterial color="#1f2937" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Mast with lights */}
      <mesh position={[0.2, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
      {/* Navigation lights */}
      <mesh position={[0.2, 1.35, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>

      {/* Propeller area / stern */}
      <mesh position={[-1.15, -0.2, 0]}>
        <boxGeometry args={[0.1, 0.3, 0.7]} />
        <meshStandardMaterial color={hullColor} />
      </mesh>

      {/* Twin propeller housings */}
      <mesh position={[-1.15, -0.3, 0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.12, 0.15, 8]} />
        <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-1.15, -0.3, -0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.12, 0.15, 8]} />
        <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Prop wash effect */}
      <mesh ref={propWashRef} position={[-1.3, -0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.15, 0.02, 8, 16]} />
        <meshStandardMaterial color="#22d3ee" transparent opacity={0.3} />
      </mesh>

      {/* Safety rails */}
      <mesh position={[0.5, 0.15, 0.43]}>
        <boxGeometry args={[1.5, 0.08, 0.02]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
      <mesh position={[0.5, 0.15, -0.43]}>
        <boxGeometry args={[1.5, 0.08, 0.02]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      {/* Health indicator */}
      <mesh position={[0.2, 1.0, 0.15]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color={healthColor} emissive={healthColor} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

export default TugboatModel;

