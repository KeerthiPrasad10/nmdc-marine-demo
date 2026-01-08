'use client';

import { DredgerModel } from './DredgerModel';
import { CraneBargeModel } from './CraneBargeModel';
import { TugboatModel } from './TugboatModel';
import { SupplyVesselModel } from './SupplyVesselModel';

export { DredgerModel, CraneBargeModel, TugboatModel, SupplyVesselModel };

interface VesselModelSelectorProps {
  vesselType: string;
  vesselSubType?: string;
  healthScore: number;
  isSelected?: boolean;
  craneCapacity?: number;
  bollardPull?: number;
  hasDP?: boolean;
}

export function VesselModelSelector({
  vesselType,
  vesselSubType,
  healthScore,
  isSelected = false,
  craneCapacity,
  bollardPull,
  hasDP,
}: VesselModelSelectorProps) {
  // Normalize vessel type
  const normalizedType = vesselType.toLowerCase().replace(/[_\s-]/g, '');
  
  // Select appropriate model based on vessel type
  if (normalizedType.includes('dredger') || normalizedType.includes('hopper') || normalizedType === 'csd') {
    const subType = normalizedType.includes('csd') || normalizedType.includes('cutter') 
      ? 'csd' 
      : normalizedType.includes('backhoe') 
        ? 'backhoe' 
        : 'hopper';
    return (
      <DredgerModel 
        healthScore={healthScore} 
        isSelected={isSelected} 
        subType={subType}
      />
    );
  }
  
  if (normalizedType.includes('crane') || normalizedType.includes('barge')) {
    return (
      <CraneBargeModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        craneCapacity={craneCapacity}
      />
    );
  }
  
  if (normalizedType.includes('tug') || normalizedType.includes('pusher')) {
    return (
      <TugboatModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        bollardPull={bollardPull}
      />
    );
  }
  
  if (normalizedType.includes('supply') || normalizedType.includes('support') || normalizedType.includes('survey')) {
    return (
      <SupplyVesselModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        hasDP={hasDP}
      />
    );
  }
  
  // Default to supply vessel for unknown types
  return (
    <SupplyVesselModel 
      healthScore={healthScore} 
      isSelected={isSelected}
      hasDP={false}
    />
  );
}

export default VesselModelSelector;



