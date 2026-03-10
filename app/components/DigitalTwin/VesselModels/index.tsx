'use client';

import { SupplyVesselModel } from './SupplyVesselModel';

export { SupplyVesselModel };

// Re-export SupplyVesselModel as FerryModel for semantic clarity
export const FerryModel = SupplyVesselModel;

interface VesselModelSelectorProps {
  vesselType: string;
  vesselSubType?: string;
  healthScore: number;
  isSelected?: boolean;
}

export function VesselModelSelector({
  vesselType,
  vesselSubType,
  healthScore,
  isSelected = false,
}: VesselModelSelectorProps) {
  const normalizedSubType = (vesselSubType || '').toLowerCase();
  
  // Determine if it's a large or small ferry class based on subType
  const isLargeClass = normalizedSubType.includes('jumbo') || 
                       normalizedSubType.includes('super');
  
  // All WSDOT vessels are ferries - use the supply vessel model 
  // which has the closest hull shape to a passenger/vehicle ferry
  return (
    <SupplyVesselModel 
      healthScore={healthScore} 
      isSelected={isSelected}
      hasDP={isLargeClass}
    />
  );
}

export default VesselModelSelector;
