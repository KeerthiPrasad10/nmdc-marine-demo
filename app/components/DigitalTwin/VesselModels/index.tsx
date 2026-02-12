'use client';

import { DredgerModel } from './DredgerModel';
import { CraneBargeModel } from './CraneBargeModel';
import { TugboatModel } from './TugboatModel';
import { SupplyVesselModel } from './SupplyVesselModel';
import { JackUpModel } from './JackUpModel';
import { TransformerModel } from '../TransformerModel';

export { DredgerModel, CraneBargeModel, TugboatModel, SupplyVesselModel, JackUpModel, TransformerModel };

// =========================================
// Grid Asset Model Selector (Exelon re-theme)
// =========================================
interface AssetModelSelectorProps {
  assetType: string;
  healthScore: number;
  isSelected?: boolean;
  voltageClass?: number;
}

export function AssetModelSelector({
  assetType,
  healthScore,
  isSelected = false,
  voltageClass = 230,
}: AssetModelSelectorProps) {
  // All grid assets currently render as a transformer model.
  // As more 3-D models (circuit breaker, substation yard, etc.) are
  // created, switch here on `assetType`.
  return (
    <TransformerModel
      healthScore={healthScore}
      isSelected={isSelected}
      voltageClass={voltageClass}
    />
  );
}

// =========================================
// Legacy Vessel Model Selector (kept for compatibility)
// =========================================
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

  // ── Grid asset types → TransformerModel ──
  if (
    normalizedType.includes('transformer') ||
    normalizedType.includes('substation') ||
    normalizedType.includes('circuitbreaker') ||
    normalizedType.includes('feeder') ||
    normalizedType.includes('power_transformer') ||
    normalizedType.includes('distribution')
  ) {
    return (
      <TransformerModel
        healthScore={healthScore}
        isSelected={isSelected}
        voltageClass={normalizedType.includes('distribution') ? 13 : 230}
      />
    );
  }

  // Use subType first for more accurate matching (fleet data)
  
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
  
  // Derrick Lay Barges & Semi-Submersibles (heavy lift vessels)
  if (normalizedSubType.includes('derrick') || normalizedSubType.includes('semi-submersible')) {
    return (
      <CraneBargeModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        craneCapacity={craneCapacity || 4200}
      />
    );
  }
  
  // Pipelay Barges (conventional flat bottom)
  if (normalizedSubType.includes('pipelay') || normalizedSubType.includes('flat bottom')) {
    return (
      <CraneBargeModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        craneCapacity={craneCapacity || 1000}
      />
    );
  }
  
  // Self-Elevating Platforms (Jack-Up Barges)
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
  
  if (normalizedType.includes('jackup') || normalizedType.includes('sep')) {
    return (
      <JackUpModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        legCount={4}
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
  
  if (normalizedType.includes('tug') || normalizedType.includes('ahts') || normalizedType.includes('pusher')) {
    return (
      <TugboatModel 
        healthScore={healthScore} 
        isSelected={isSelected}
        bollardPull={bollardPull}
      />
    );
  }
  
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
  
  // Default: Transformer model for Exelon demo
  return (
    <TransformerModel
      healthScore={healthScore}
      isSelected={isSelected}
      voltageClass={230}
    />
  );
}

export default VesselModelSelector;
