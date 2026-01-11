import { 
  Box, 
  ArrowRight, 
  ArrowLeft, 
  Gauge, 
  FileText, 
  Download,
  ChevronRight,
  Cog
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { EquipmentData, EquipmentConnection, EquipmentInstrument } from "../types";

interface EquipmentCardProps {
  data: EquipmentData;
  onEquipmentClick?: (equipment: EquipmentData) => void;
  onActionClick?: (actionId: string, params?: Record<string, unknown>) => void;
  exportable?: boolean;
  onExport?: () => void;
  compact?: boolean;
}

export function EquipmentCard({ 
  data, 
  onEquipmentClick,
  onActionClick,
  exportable,
  onExport,
  compact = false
}: EquipmentCardProps) {
  const hasConnections = data.connections && data.connections.length > 0;
  const hasInstruments = data.instruments && data.instruments.length > 0;
  const hasSpecs = data.specifications && Object.keys(data.specifications).length > 0;

  if (compact) {
    return (
      <button
        onClick={() => onEquipmentClick?.(data)}
        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all text-left group"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#71717A]">{data.tag}</span>
              <span className="text-sm text-white/50">{data.type}</span>
            </div>
            {data.name && (
              <p className="text-sm text-white/70 mt-0.5">{data.name}</p>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#71717A] transition-colors" />
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#71717A]/20 flex items-center justify-center">
              <Box className="w-6 h-6 text-[#71717A]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-mono">{data.tag}</h3>
              <p className="text-white/60">{data.name || data.type}</p>
            </div>
          </div>
          
          {data.drawingNumber && (
            <div className="flex items-center gap-1.5 text-sm text-white/40 bg-white/5 px-2.5 py-1 rounded-lg">
              <FileText className="w-3.5 h-3.5" />
              <span>{data.drawingNumber}</span>
            </div>
          )}
        </div>

        {data.description && (
          <p className="mt-3 text-white/70 text-sm leading-relaxed">
            {data.description}
          </p>
        )}
      </div>

      {/* Content Grid */}
      <div className="p-5 grid gap-4 md:grid-cols-2">
        {/* Connections */}
        {hasConnections && (
          <div>
            <h4 className="text-sm font-medium text-white/50 mb-2 flex items-center gap-1.5">
              <Cog className="w-3.5 h-3.5" />
              Connections
            </h4>
            <div className="space-y-2">
              {data.connections!.map((conn, idx) => (
                <ConnectionItem key={idx} connection={conn} />
              ))}
            </div>
          </div>
        )}

        {/* Instruments */}
        {hasInstruments && (
          <div>
            <h4 className="text-sm font-medium text-white/50 mb-2 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              Instruments
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.instruments!.map((inst, idx) => (
                <InstrumentBadge key={idx} instrument={inst} />
              ))}
            </div>
          </div>
        )}

        {/* Specifications */}
        {hasSpecs && (
          <div className={cn(!hasConnections && !hasInstruments && "md:col-span-2")}>
            <h4 className="text-sm font-medium text-white/50 mb-2">Specifications</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(data.specifications!).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-white/50">{key}:</span>
                  <span className="text-white/80 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-3 border-t border-white/10 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-white/20 text-white/70 hover:bg-white/10"
          onClick={() => onActionClick?.('generate_loto', { equipmentTag: data.tag })}
        >
          Generate LOTO
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-white/20 text-white/70 hover:bg-white/10"
          onClick={() => onActionClick?.('create_work_order', { equipmentTag: data.tag })}
        >
          Create Work Order
        </Button>
        {data.drawingId && (
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white/70 hover:bg-white/10"
            onClick={() => onActionClick?.('view_drawing', { drawingId: data.drawingId })}
          >
            View P&ID
          </Button>
        )}
        {exportable && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-white/50 hover:text-white"
            onClick={onExport}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        )}
      </div>
    </div>
  );
}

// Connection item sub-component
function ConnectionItem({ connection }: { connection: EquipmentConnection }) {
  const isUpstream = connection.direction === 'upstream';
  
  return (
    <div className="flex items-center gap-2 text-sm">
      {isUpstream ? (
        <ArrowLeft className="w-4 h-4 text-blue-400" />
      ) : (
        <ArrowRight className="w-4 h-4 text-emerald-400" />
      )}
      <span className="font-mono text-[#71717A]">{connection.tag}</span>
      <span className="text-white/40">{connection.type}</span>
      {connection.via && (
        <span className="text-xs text-white/30">via {connection.via}</span>
      )}
    </div>
  );
}

// Instrument badge sub-component
function InstrumentBadge({ instrument }: { instrument: EquipmentInstrument }) {
  return (
    <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
      <span className="font-mono text-sm text-[#71717A]">{instrument.tag}</span>
      {instrument.measuredVariable && (
        <span className="text-xs text-white/40 ml-1.5">
          ({instrument.measuredVariable})
        </span>
      )}
    </div>
  );
}

export default EquipmentCard;

