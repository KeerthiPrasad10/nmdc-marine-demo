'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type HeatmapMode = 'temperature' | 'vibration' | 'efficiency' | 'stress' | 'none';

interface HeatmapLayerProps {
  mode: HeatmapMode;
  data: Array<{
    position: [number, number, number];
    value: number; // 0-1 normalized
  }>;
  vesselDimensions: { length: number; width: number };
}

// Color gradient for heatmap (blue -> green -> yellow -> red)
function getHeatmapColor(value: number): THREE.Color {
  if (value < 0.25) {
    // Blue to Cyan
    return new THREE.Color().setHSL(0.6 - value * 0.4, 0.8, 0.5);
  } else if (value < 0.5) {
    // Cyan to Green
    return new THREE.Color().setHSL(0.35 - (value - 0.25) * 0.4, 0.8, 0.5);
  } else if (value < 0.75) {
    // Green to Yellow
    return new THREE.Color().setHSL(0.15 - (value - 0.5) * 0.3, 0.9, 0.5);
  } else {
    // Yellow to Red
    return new THREE.Color().setHSL(0.05 - (value - 0.75) * 0.2, 1, 0.5);
  }
}

export function HeatmapLayer({ mode, data, vesselDimensions }: HeatmapLayerProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate heatmap texture
  const texture = useMemo(() => {
    if (mode === 'none' || data.length === 0) return null;

    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Create gradient based on data points
    const imageData = ctx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Map canvas coordinates to vessel space
        const vx = (x / size - 0.5) * vesselDimensions.length;
        const vz = (y / size - 0.5) * vesselDimensions.width;

        // Interpolate value from nearest data points
        let totalWeight = 0;
        let weightedValue = 0;

        data.forEach((point) => {
          const dx = vx - point.position[0];
          const dz = vz - point.position[2];
          const distance = Math.sqrt(dx * dx + dz * dz);
          const weight = 1 / (1 + distance * 2);
          
          totalWeight += weight;
          weightedValue += point.value * weight;
        });

        const value = totalWeight > 0 ? weightedValue / totalWeight : 0.5;
        const color = getHeatmapColor(value);

        const i = (y * size + x) * 4;
        imageData.data[i] = Math.floor(color.r * 255);
        imageData.data[i + 1] = Math.floor(color.g * 255);
        imageData.data[i + 2] = Math.floor(color.b * 255);
        imageData.data[i + 3] = Math.floor(value * 180 + 40); // Alpha based on intensity
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [mode, data, vesselDimensions]);

  // Animate heatmap
  useFrame((state) => {
    if (meshRef.current && mode !== 'none') {
      const material = meshRef.current.material;
      if (material && !Array.isArray(material) && 'opacity' in material) {
        material.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });

  if (mode === 'none' || !texture) return null;

  return (
    <mesh
      ref={meshRef}
      position={[0, 0.12, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[vesselDimensions.length * 0.85, vesselDimensions.width * 0.9]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Generate heatmap data from equipment
export function generateHeatmapData(
  equipment: Array<{
    id: string;
    type: string;
    health_score?: number | null;
    temperature?: number | null;
    vibration?: number | null;
  }>,
  mode: HeatmapMode
): Array<{ position: [number, number, number]; value: number }> {
  return equipment.map((eq, index) => {
    const angle = (index / equipment.length) * Math.PI * 2;
    const radius = 0.8;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius * 0.5;

    let value = 0.5;
    switch (mode) {
      case 'temperature':
        value = eq.temperature ? Math.min(1, eq.temperature / 100) : 0.5;
        break;
      case 'vibration':
        value = eq.vibration ? Math.min(1, eq.vibration / 10) : 0.3;
        break;
      case 'efficiency':
      case 'stress':
        value = eq.health_score ? 1 - eq.health_score / 100 : 0.5;
        break;
    }

    return {
      position: [x, 0, z] as [number, number, number],
      value,
    };
  });
}

// Legend component for heatmap
export function HeatmapLegend({ mode }: { mode: HeatmapMode }) {
  if (mode === 'none') return null;

  const labels = {
    temperature: { low: 'Cool', high: 'Hot', unit: '°C' },
    vibration: { low: 'Stable', high: 'High Vibration', unit: 'mm/s' },
    efficiency: { low: 'Efficient', high: 'Degraded', unit: '%' },
    stress: { low: 'Normal', high: 'High Stress', unit: '' },
  };

  const label = labels[mode];

  return (
    <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-white/10">
      <div className="text-xs text-white/60 mb-2 capitalize">{mode} Heatmap</div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white/50">{label.low}</span>
        <div 
          className="w-24 h-3 rounded"
          style={{
            background: 'linear-gradient(to right, #3b82f6, #10b981, #fbbf24, #ef4444)',
          }}
        />
        <span className="text-[10px] text-white/50">{label.high}</span>
      </div>
    </div>
  );
}

