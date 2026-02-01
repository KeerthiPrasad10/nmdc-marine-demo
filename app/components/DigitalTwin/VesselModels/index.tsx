'use client';

import { DredgerModel } from './DredgerModel';
import { CraneBargeModel } from './CraneBargeModel';
import { TugboatModel } from './TugboatModel';
import { SupplyVesselModel } from './SupplyVesselModel';
import { JackUpModel } from './JackUpModel';

export { DredgerModel, CraneBargeModel, TugboatModel, SupplyVesselModel, JackUpModel };

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
  const normalizedType = vesselType.toLowerCase().replace(/[_\s-]/g, '');
  const normalizedSubType = (vesselSubType || '').toLowerCase();
  
  // Use subType first for more accurate matching (NMDC fleet data)
  
  // Trailing Suction Hopper Dredgers
  if (normalizedSubType.includes('trailing suction hopper') || normalizedSubType.includes('hopper dredger')) {
    return (
      <DredgerModel 
        healthScore={healthScore} 
        isSelected={isSelected} 
        subType="hopper"
      />
    );
  }
  
  // Cutter Suction Dredgers
  if (normalizedSubType.includes('cutter suction')) {
    return (
      <DredgerModel 
        healthScore={healthScore} 
        isSelected={isSelected} 
        subType="csd"
      />
    );
  }
  
  // Backhoe, Grab, and Split Hopper Dredgers
  if (normalizedSubType.includes('backhoe') || normalizedSubType.includes('grab') || normalizedSubType.includes('split hopper')) {
    return (
      <DredgerModel 
        healthScore={healthScore} 
        isSelected={isSelected} 
        subType="backhoe"
      />
    );
  }
  
  // NMDC Energy - Derrick Lay Barges & Semi-Submersibles (heavy lift vessels)
  if (normalizedSubType.includes('derrick') || normalizedSubType.includes('semi-submersible')) {
    return (
      <CraneBargeModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        craneCapacity={craneCapacity || 4200}
      />
    );
  }
  
  // NMDC Energy - Pipelay Barges (conventional flat bottom)
  if (normalizedSubType.includes('pipelay') || normalizedSubType.includes('flat bottom')) {
    return (
      <CraneBargeModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        craneCapacity={craneCapacity || 1000}
      />
    );
  }
  
  // NMDC Energy - Self-Elevating Platforms (Jack-Up Barges)
  if (normalizedSubType.includes('self-elevating') || normalizedSubType.includes('jack-up') || normalizedSubType.includes('jackup')) {
    return (
      <JackUpModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        legCount={4}
      />
    );
  }
  
  // DP Offshore Support & Cable Laying Vessels
  if (normalizedSubType.includes('dp') || normalizedSubType.includes('cable') || normalizedSubType.includes('offshore support')) {
    return (
      <SupplyVesselModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        hasDP={true}
      />
    );
  }
  
  // AHTS/Tug/Supply/Fire Fighting Vessels
  if (normalizedSubType.includes('ahts') || normalizedSubType.includes('tug') || normalizedSubType.includes('fire fighting') || normalizedSubType.includes('anchor handling')) {
    return (
      <TugboatModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        bollardPull={bollardPull}
      />
    );
  }
  
  // Survey vessels
  if (normalizedSubType.includes('survey') || normalizedSubType.includes('hydrographic')) {
    return (
      <SupplyVesselModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        hasDP={false}
      />
    );
  }
  
  // Offshore Supply Ships (generic)
  if (normalizedSubType.includes('supply') || normalizedSubType.includes('support')) {
    return (
      <SupplyVesselModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        hasDP={hasDP ?? normalizedSubType.includes('dp')}
      />
    );
  }
  
  // ===== Fallback to vesselType-based matching =====
  
  // Dredgers - NMDC Group dredging fleet
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
  
  // NMDC Energy - Pipelay and Derrick Barges (heavy lift vessels with cranes)
  if (normalizedType.includes('pipelay') || 
      normalizedType.includes('derrick') || 
      normalizedType.includes('dlb') || 
      normalizedType.includes('dls') ||
      normalizedType.includes('plb')) {
    return (
      <CraneBargeModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        craneCapacity={craneCapacity || 1000}
      />
    );
  }
  
  // NMDC Energy - Jack-Up Barges (self-elevating platforms)
  if (normalizedType.includes('jackup') || normalizedType.includes('sep')) {
    return (
      <JackUpModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        legCount={4}
      />
    );
  }
  
  // Generic crane/barge types
  if (normalizedType.includes('crane') || normalizedType.includes('barge')) {
    return (
      <CraneBargeModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        craneCapacity={craneCapacity}
      />
    );
  }
  
  // Tugs and AHTS vessels
  if (normalizedType.includes('tug') || normalizedType.includes('ahts') || normalizedType.includes('pusher')) {
    return (
      <TugboatModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        bollardPull={bollardPull}
      />
    );
  }
  
  // Supply, Support, Survey, and Cable Lay vessels
  if (normalizedType.includes('supply') || 
      normalizedType.includes('support') || 
      normalizedType.includes('survey') ||
      normalizedType.includes('cable')) {
    return (
      <SupplyVesselModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        hasDP={hasDP ?? normalizedType.includes('dp')}
      />
    );
  }
  
  // Default to crane barge for NMDC Energy vessels (most common)
  return (
    <CraneBargeModel 
      healthScore={healthScore} 
      isSelected={isSelected}
      craneCapacity={500}
    />
  );
}

export default VesselModelSelector;










