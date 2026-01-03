'use client';

import { useEffect, useState } from 'react';
import { Vessel } from '@/lib/supabase';

interface FleetMapProps {
  vessels: Vessel[];
  selectedVessel: string | null;
  onSelectVessel: (id: string | null) => void;
}

// Dynamic import for Leaflet components (client-side only)
export function FleetMap({ vessels, selectedVessel, onSelectVessel }: FleetMapProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<FleetMapProps> | null>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues with Leaflet
    import('./FleetMapClient').then((mod) => {
      setMapComponent(() => mod.FleetMapClient);
    });
  }, []);

  if (!MapComponent) {
    return (
      <div className="w-full h-full min-h-[400px] glass-panel flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px]">
      <MapComponent
        vessels={vessels}
        selectedVessel={selectedVessel}
        onSelectVessel={onSelectVessel}
      />
    </div>
  );
}
