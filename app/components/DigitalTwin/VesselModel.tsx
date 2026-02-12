'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface VesselModelProps {
  vesselType: string;
  healthScore: number;
  isSelected?: boolean;
}

// Generate a procedural vessel model based on type
export function VesselModel({ vesselType, healthScore, isSelected = false }: VesselModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Subtle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
      groupRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.4) * 0.01;
    }
  });

  // Color based on health
  const healthColor = useMemo(() => {
    if (healthScore >= 80) return '#10b981'; // emerald
    if (healthScore >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  }, [healthScore]);

  const hullColor = '#1a1a2e';
  const deckColor = '#16213e';
  const accentColor = isSelected ? '#a855f7' : '#3b82f6';

  // Different vessel configurations based on type
  const vesselConfig = useMemo(() => {
    switch (vesselType) {
      case 'crane_barge':
        return { length: 4, width: 1.5, hasCrane: true, hasBridge: true, bridgePosition: -1 };
      case 'dredger':
        return { length: 3.5, width: 1.2, hasCrane: false, hasBridge: true, bridgePosition: 0.5, hasDredgeArm: true };
      case 'supply_vessel':
        return { length: 2.5, width: 0.8, hasCrane: false, hasBridge: true, bridgePosition: -0.5 };
      case 'survey_vessel':
        return { length: 2, width: 0.6, hasCrane: false, hasBridge: true, bridgePosition: 0, hasRadar: true };
      case 'tugboat':
      default:
        return { length: 2, width: 0.7, hasCrane: false, hasBridge: true, bridgePosition: -0.3 };
    }
  }, [vesselType]);

  return (
    <group ref={groupRef}>
      {/* Hull - Main body */}
      <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[vesselConfig.length, 0.4, vesselConfig.width]} />
        <meshStandardMaterial color={hullColor} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Hull - Bow (front pointed section) */}
      <mesh position={[vesselConfig.length / 2 + 0.3, -0.2, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[0.5, 0.3, vesselConfig.width * 0.8]} />
        <meshStandardMaterial color={hullColor} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Deck */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[vesselConfig.length * 0.9, 0.1, vesselConfig.width * 0.95]} />
        <meshStandardMaterial color={deckColor} metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Waterline stripe */}
      <mesh position={[0, -0.35, 0]}>
        <boxGeometry args={[vesselConfig.length, 0.05, vesselConfig.width + 0.02]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.3} />
      </mesh>

      {/* Bridge/Superstructure */}
      {vesselConfig.hasBridge && (
        <group position={[vesselConfig.bridgePosition, 0.4, 0]}>
          {/* Main bridge structure */}
          <RoundedBox args={[0.8, 0.5, vesselConfig.width * 0.6]} radius={0.05} castShadow>
            <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.6} />
          </RoundedBox>
          
          {/* Bridge windows */}
          <mesh position={[0.35, 0.05, 0]}>
            <boxGeometry args={[0.05, 0.15, vesselConfig.width * 0.5]} />
            <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.5} transparent opacity={0.8} />
          </mesh>

          {/* Radar mast */}
          <Cylinder args={[0.02, 0.02, 0.4]} position={[0, 0.45, 0]} castShadow>
            <meshStandardMaterial color="#374151" />
          </Cylinder>
          
          {/* Radar dish */}
          <mesh position={[0, 0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
            <meshStandardMaterial color="#1f2937" metalness={0.6} />
          </mesh>
        </group>
      )}

      {/* Crane for crane barges */}
      {vesselConfig.hasCrane && (
        <group position={[0.8, 0.3, 0]}>
          {/* Crane base */}
          <Cylinder args={[0.15, 0.2, 0.3]} castShadow>
            <meshStandardMaterial color="#fbbf24" metalness={0.5} roughness={0.5} />
          </Cylinder>
          
          {/* Crane arm */}
          <group position={[0, 0.3, 0]} rotation={[0, 0, -0.3]}>
            <Box args={[0.1, 1.5, 0.1]} position={[0.6, 0.4, 0]} castShadow>
              <meshStandardMaterial color="#fbbf24" />
            </Box>
            
            {/* Crane jib */}
            <Box args={[1.2, 0.08, 0.08]} position={[0.3, 1.1, 0]} rotation={[0, 0, 0.15]} castShadow>
              <meshStandardMaterial color="#f59e0b" />
            </Box>
            
            {/* Hook cable */}
            <Cylinder args={[0.01, 0.01, 0.6]} position={[0.8, 0.7, 0]} castShadow>
              <meshStandardMaterial color="#6b7280" />
            </Cylinder>
          </group>
        </group>
      )}

      {/* Dredge arm for dredgers */}
      {vesselConfig.hasDredgeArm && (
        <group position={[vesselConfig.length / 2, 0, 0]} rotation={[0, 0, -0.5]}>
          <Box args={[1.5, 0.15, 0.15]} position={[0.75, -0.3, 0]} castShadow>
            <meshStandardMaterial color="#6b7280" metalness={0.6} />
          </Box>
          <mesh position={[1.4, -0.6, 0]}>
            <coneGeometry args={[0.2, 0.4, 8]} />
            <meshStandardMaterial color="#4b5563" metalness={0.7} />
          </mesh>
        </group>
      )}

      {/* Additional radar for survey vessels */}
      {vesselConfig.hasRadar && (
        <group position={[0.5, 0.3, 0]}>
          <Cylinder args={[0.03, 0.03, 0.5]} castShadow>
            <meshStandardMaterial color="#374151" />
          </Cylinder>
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.3} />
          </mesh>
        </group>
      )}

      {/* Engine exhausts */}
      <group position={[-vesselConfig.length / 4, 0.25, 0]}>
        <Cylinder args={[0.05, 0.06, 0.3]} position={[0, 0, 0.15]} castShadow>
          <meshStandardMaterial color="#1f2937" />
        </Cylinder>
        <Cylinder args={[0.05, 0.06, 0.3]} position={[0, 0, -0.15]} castShadow>
          <meshStandardMaterial color="#1f2937" />
        </Cylinder>
      </group>

      {/* Health indicator light */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial 
          color={healthColor} 
          emissive={healthColor} 
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Selection glow ring */}
      {isSelected && (
        <mesh position={[0, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[vesselConfig.length * 0.6, vesselConfig.length * 0.65, 32]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}















