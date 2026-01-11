'use client';

import { Grid3X3, Box } from "lucide-react";
import { EquipmentCard } from "./EquipmentCard";
import type { EquipmentGridData, EquipmentData } from "../types";

interface EquipmentGridProps {
  data: EquipmentGridData;
  onEquipmentClick?: (equipment: EquipmentData) => void;
}

export function EquipmentGrid({ data, onEquipmentClick }: EquipmentGridProps) {
  const { title, equipment, groupBy = 'none' } = data;

  // Group equipment if needed
  const grouped = groupBy !== 'none' 
    ? groupEquipment(equipment, groupBy)
    : { 'All Equipment': equipment };

  return (
    <div className="w-full">
      {/* Header */}
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <Grid3X3 className="w-5 h-5 text-[#71717A]" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <span className="text-sm text-white/40">({equipment.length} items)</span>
        </div>
      )}

      {/* Grouped sections */}
      {Object.entries(grouped).map(([groupName, items]) => (
        <div key={groupName} className="mb-6 last:mb-0">
          {groupBy !== 'none' && (
            <h4 className="text-sm font-medium text-white/50 mb-3 flex items-center gap-2">
              <Box className="w-4 h-4" />
              {groupName}
              <span className="text-white/30">({items.length})</span>
            </h4>
          )}
          
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((eq) => (
              <EquipmentCard
                key={eq.tag}
                data={eq}
                onEquipmentClick={onEquipmentClick}
                compact
              />
            ))}
          </div>
        </div>
      ))}

      {equipment.length === 0 && (
        <div className="text-center py-8 text-white/40">
          <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No equipment found</p>
        </div>
      )}
    </div>
  );
}

// Helper to group equipment
function groupEquipment(
  equipment: EquipmentData[], 
  groupBy: 'type' | 'drawing'
): Record<string, EquipmentData[]> {
  const groups: Record<string, EquipmentData[]> = {};
  
  for (const eq of equipment) {
    const key = groupBy === 'type' 
      ? eq.type 
      : eq.drawingNumber || 'Unknown Drawing';
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(eq);
  }
  
  return groups;
}

export default EquipmentGrid;

