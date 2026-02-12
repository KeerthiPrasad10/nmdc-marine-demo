'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TransformerModelProps {
  healthScore: number;
  isSelected?: boolean;
  voltageClass?: number; // kV — affects scale
}

function getHealthColor(health: number): string {
  if (health >= 70) return '#10b981';
  if (health >= 50) return '#f59e0b';
  return '#ef4444';
}

/**
 * Simplified 3-D power transformer:
 *  ─ Main tank (rectangular box)
 *  ─ Three HV bushings on top
 *  ─ Two LV bushings on top (shorter)
 *  ─ Conservator tank (cylinder on top-rear)
 *  ─ Radiator fins (flat boxes on two sides)
 *  ─ Base frame
 *  ─ Cooling fans (circles)
 */
export function TransformerModel({ healthScore, isSelected = false, voltageClass = 230 }: TransformerModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Slow rotation when selected
  useFrame((_, delta) => {
    if (groupRef.current && isSelected) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  const healthColor = getHealthColor(healthScore);
  const scale = voltageClass >= 345 ? 1.15 : voltageClass >= 230 ? 1.0 : 0.85;
  const tankColor = healthScore >= 70 ? '#2a3a4a' : healthScore >= 50 ? '#3a3520' : '#3a2020';
  const metalColor = '#555';

  return (
    <group ref={groupRef} scale={scale}>
      {/* ── Base frame ── */}
      <mesh position={[0, -0.6, 0]} castShadow>
        <boxGeometry args={[2.6, 0.12, 1.6]} />
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* ── Main tank ── */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[2.2, 1.6, 1.2]} />
        <meshStandardMaterial color={tankColor} metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Tank edge banding (top) */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[2.24, 0.06, 1.24]} />
        <meshStandardMaterial color={metalColor} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Tank edge banding (bottom) */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[2.24, 0.06, 1.24]} />
        <meshStandardMaterial color={metalColor} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ── HV Bushings (3) ── */}
      {[-0.5, 0, 0.5].map((x, i) => (
        <group key={`hv-${i}`} position={[x, 1.1, -0.2]}>
          {/* Bushing porcelain */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 1.0, 12]} />
            <meshStandardMaterial color="#c4a882" metalness={0.2} roughness={0.5} />
          </mesh>
          {/* Bushing skirts (rings) */}
          {[0.2, 0.5, 0.8].map((y, j) => (
            <mesh key={j} position={[0, y, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.04, 12]} />
              <meshStandardMaterial color="#b09070" metalness={0.3} roughness={0.4} />
            </mesh>
          ))}
          {/* Bushing cap */}
          <mesh position={[0, 1.0, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={metalColor} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* ── LV Bushings (2, shorter) ── */}
      {[-0.3, 0.3].map((x, i) => (
        <group key={`lv-${i}`} position={[x, 1.1, 0.3]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.07, 0.6, 12]} />
            <meshStandardMaterial color="#c4a882" metalness={0.2} roughness={0.5} />
          </mesh>
          {[0.15, 0.35].map((y, j) => (
            <mesh key={j} position={[0, y, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.03, 12]} />
              <meshStandardMaterial color="#b09070" metalness={0.3} roughness={0.4} />
            </mesh>
          ))}
          <mesh position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color={metalColor} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* ── Conservator tank (cylinder on top-rear) ── */}
      <group position={[0.6, 1.5, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 1.0, 16]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Conservator end caps */}
        <mesh position={[-0.5, 0, 0]}>
          <sphereGeometry args={[0.18, 8, 8, 0, Math.PI]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Oil level gauge */}
        <mesh position={[0, 0.19, 0]}>
          <boxGeometry args={[0.3, 0.04, 0.04]} />
          <meshStandardMaterial color="#2563eb" metalness={0.2} roughness={0.3} transparent opacity={0.7} />
        </mesh>
        {/* Support pipe to main tank */}
        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.55, 8]} />
          <meshStandardMaterial color={metalColor} metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* ── Radiator banks (both sides) ── */}
      {[-1, 1].map(side => (
        <group key={`radiator-${side}`} position={[0, 0.2, side * 0.85]}>
          {/* Radiator fins */}
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={i} position={[-0.7 + i * 0.2, 0, 0]} castShadow>
              <boxGeometry args={[0.03, 1.2, 0.2]} />
              <meshStandardMaterial color="#444" metalness={0.5} roughness={0.5} />
            </mesh>
          ))}
          {/* Top header pipe */}
          <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 1.6, 8]} />
            <meshStandardMaterial color={metalColor} metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Bottom header pipe */}
          <mesh position={[0, -0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 1.6, 8]} />
            <meshStandardMaterial color={metalColor} metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ── Cooling fans (2 per side) ── */}
      {[-1, 1].map(side =>
        [-0.3, 0.3].map((x, fi) => (
          <group key={`fan-${side}-${fi}`} position={[x, -0.2, side * 1.15]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.04, 16]} />
              <meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Fan blade hint */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.04, 0.14, 16]} />
              <meshStandardMaterial color="#555" metalness={0.5} roughness={0.3} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )),
      )}

      {/* ── Nameplate ── */}
      <mesh position={[0, 0.5, 0.61]}>
        <boxGeometry args={[0.5, 0.3, 0.01]} />
        <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ── Health indicator glow ── */}
      <pointLight position={[0, 2.2, 0]} intensity={0.5} color={healthColor} distance={3} />

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.53, 0]}>
          <ringGeometry args={[1.6, 1.7, 64]} />
          <meshBasicMaterial color={healthColor} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export default TransformerModel;

