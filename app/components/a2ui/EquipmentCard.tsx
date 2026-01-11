'use client';

/**
 * EquipmentCard - Equipment/Asset Information Display
 * A2UI Component for displaying equipment details
 */

import { useState } from 'react';
import { 
  Printer, Settings, MapPin, Calendar, Clock, AlertTriangle,
  ChevronDown, ChevronRight, FileText, Wrench, Activity,
  Gauge, Thermometer, Zap, History, BookOpen, Link2
} from 'lucide-react';
import type { EquipmentCardSchema } from './types';

interface EquipmentCardProps {
  data: EquipmentCardSchema;
  onPrint?: () => void;
}

const criticalityConfig = {
  critical: { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-400', icon: '🔴' },
  high: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', icon: '🟠' },
  medium: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', icon: '🟡' },
  low: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', icon: '🟢' },
};

const statusConfig = {
  operational: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: '✓' },
  degraded: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: '⚠' },
  failed: { bg: 'bg-rose-500/20', text: 'text-rose-400', icon: '✗' },
  maintenance: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '🔧' },
  decommissioned: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '—' },
};

export function EquipmentCard({ data, onPrint }: EquipmentCardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['specs', 'readings', 'maintenance', 'safety'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const handlePrint = () => onPrint ? onPrint() : window.print();

  const crit = criticalityConfig[data.criticality] || criticalityConfig.medium;
  const status = statusConfig[data.status] || statusConfig.operational;

  return (
    <div className="bg-black text-white rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-800/50 to-transparent border-b border-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
              <Settings className="w-7 h-7 text-white/60" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <code className="text-lg font-mono font-bold text-white">{data.tag}</code>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status.bg} ${status.text}`}>
                  {status.icon} {data.status.toUpperCase()}
                </span>
              </div>
              <h2 className="text-white/90 font-medium">{data.name}</h2>
              <p className="text-white/50 text-sm">{data.type}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-2 py-1 rounded text-[10px] font-bold ${crit.bg} ${crit.text} border ${crit.border}`}>
              {crit.icon} {data.criticality.toUpperCase()} CRITICALITY
            </span>
            <button onClick={handlePrint} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60">
              <Printer className="w-3 h-3" /> Print
            </button>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-4 mt-4 text-sm text-white/60">
          <MapPin className="w-4 h-4" />
          {data.location.vessel && <span>Vessel: {data.location.vessel}</span>}
          {data.location.deck && <span>Deck: {data.location.deck}</span>}
          {data.location.area && <span>Area: {data.location.area}</span>}
          {data.location.zone && <span>Zone: {data.location.zone}</span>}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Technical Details */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] uppercase text-white/40">Manufacturer</div>
            <div className="text-sm">{data.manufacturer}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-white/40">Model</div>
            <div className="text-sm">{data.model}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-white/40">Serial Number</div>
            <div className="text-sm font-mono">{data.serialNumber}</div>
          </div>
        </div>

        {/* Specifications */}
        {data.specifications && Object.keys(data.specifications).length > 0 && (
          <Section
            title="Specifications"
            icon={<FileText className="w-4 h-4" />}
            expanded={expandedSections.has('specs')}
            onToggle={() => toggleSection('specs')}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(data.specifications).map(([key, value]) => (
                <div key={key} className="px-3 py-2 rounded-lg bg-white/5">
                  <div className="text-[10px] uppercase text-white/40">{formatLabel(key)}</div>
                  <div className="text-sm font-mono">{String(value)}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Current Readings */}
        {data.currentReadings && data.currentReadings.length > 0 && (
          <Section
            title="Current Readings"
            icon={<Activity className="w-4 h-4" />}
            expanded={expandedSections.has('readings')}
            onToggle={() => toggleSection('readings')}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.currentReadings.map((reading, i) => {
                const statusColor = reading.status === 'alarm' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
                                   reading.status === 'warning' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                   'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
                return (
                  <div key={i} className={`px-3 py-2 rounded-lg border ${statusColor}`}>
                    <div className="text-[10px] uppercase opacity-70">{reading.parameter}</div>
                    <div className="text-lg font-mono font-bold">
                      {reading.value} <span className="text-xs font-normal opacity-70">{reading.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Operating Limits */}
        {data.operatingLimits && data.operatingLimits.length > 0 && (
          <Section
            title="Operating Limits"
            icon={<Gauge className="w-4 h-4" />}
            expanded={expandedSections.has('limits')}
            onToggle={() => toggleSection('limits')}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-2 text-left text-[10px] uppercase text-white/40">Parameter</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase text-white/40">Min</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase text-white/40">Normal</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase text-white/40">Max</th>
                    <th className="px-3 py-2 text-right text-[10px] uppercase text-white/40">Current</th>
                    <th className="px-3 py-2 text-center text-[10px] uppercase text-white/40">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.operatingLimits.map((limit, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{limit.parameter}</td>
                      <td className="px-3 py-2 text-right font-mono text-white/60">{limit.min ?? '—'} {limit.unit}</td>
                      <td className="px-3 py-2 text-right font-mono">{limit.normal ?? '—'} {limit.unit}</td>
                      <td className="px-3 py-2 text-right font-mono text-white/60">{limit.max ?? '—'} {limit.unit}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{limit.current ?? '—'} {limit.unit}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          limit.status === 'alarm' ? 'bg-rose-500/20 text-rose-400' :
                          limit.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {limit.status?.toUpperCase() || 'OK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Maintenance Info */}
        <Section
          title="Maintenance"
          icon={<Wrench className="w-4 h-4" />}
          expanded={expandedSections.has('maintenance')}
          onToggle={() => toggleSection('maintenance')}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.maintenance.lastPM && (
              <div>
                <div className="text-[10px] uppercase text-white/40">Last PM</div>
                <div className="text-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-white/40" />
                  {data.maintenance.lastPM}
                </div>
              </div>
            )}
            {data.maintenance.nextPM && (
              <div>
                <div className="text-[10px] uppercase text-white/40">Next PM</div>
                <div className="text-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-white/40" />
                  {data.maintenance.nextPM}
                </div>
              </div>
            )}
            {data.maintenance.pmFrequency && (
              <div>
                <div className="text-[10px] uppercase text-white/40">PM Frequency</div>
                <div className="text-sm">{data.maintenance.pmFrequency}</div>
              </div>
            )}
            {data.maintenance.runningHours !== undefined && (
              <div>
                <div className="text-[10px] uppercase text-white/40">Running Hours</div>
                <div className="text-sm font-mono">{data.maintenance.runningHours.toLocaleString()} hrs</div>
              </div>
            )}
          </div>
        </Section>

        {/* Recent History */}
        {data.recentHistory && data.recentHistory.length > 0 && (
          <Section
            title="Recent History"
            icon={<History className="w-4 h-4" />}
            expanded={expandedSections.has('history')}
            onToggle={() => toggleSection('history')}
          >
            <div className="space-y-2">
              {data.recentHistory.map((event, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-white/[0.02]">
                  <div className="text-xs text-white/40 w-20 flex-shrink-0">{event.date}</div>
                  <div className={`px-2 py-0.5 rounded text-[10px] capitalize ${
                    event.type === 'incident' ? 'bg-rose-500/20 text-rose-400' :
                    event.type === 'repair' ? 'bg-amber-500/20 text-amber-400' :
                    event.type === 'maintenance' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {event.type}
                  </div>
                  <div className="text-sm text-white/70 flex-1">{event.description}</div>
                  {event.workOrder && (
                    <code className="text-xs text-white/40">{event.workOrder}</code>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Safety Info */}
        {data.safetyInfo && (
          <Section
            title="Safety Information"
            icon={<AlertTriangle className="w-4 h-4" />}
            expanded={expandedSections.has('safety')}
            onToggle={() => toggleSection('safety')}
            variant="warning"
          >
            <div className="space-y-3">
              {data.safetyInfo.atexZone && (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-sm">ATEX Zone: <span className="font-bold text-amber-400">{data.safetyInfo.atexZone}</span></span>
                </div>
              )}
              {data.safetyInfo.hazards && data.safetyInfo.hazards.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase text-rose-400 mb-1">Hazards</div>
                  <div className="flex flex-wrap gap-2">
                    {data.safetyInfo.hazards.map((h, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                        ⚠️ {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {data.safetyInfo.ppeRequired && data.safetyInfo.ppeRequired.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase text-blue-400 mb-1">Required PPE</div>
                  <div className="flex flex-wrap gap-2">
                    {data.safetyInfo.ppeRequired.map((p, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                        🛡️ {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Documents */}
        {data.documents && data.documents.length > 0 && (
          <Section
            title="Documents"
            icon={<BookOpen className="w-4 h-4" />}
            expanded={expandedSections.has('documents')}
            onToggle={() => toggleSection('documents')}
          >
            <div className="grid grid-cols-2 gap-2">
              {data.documents.map((doc, i) => (
                <a 
                  key={i}
                  href={doc.url || '#'}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <FileText className="w-4 h-4 text-white/40" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{doc.title}</div>
                    <div className="text-[10px] text-white/40 capitalize">{doc.type}</div>
                  </div>
                  {doc.url && <Link2 className="w-3 h-3 text-white/30" />}
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* Notes */}
        {data.notes && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] uppercase text-white/40 mb-2">Notes</div>
            <p className="text-sm text-white/70 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
}

function Section({ 
  title, icon, children, expanded, onToggle, variant = 'default'
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  variant?: 'default' | 'warning';
}) {
  return (
    <div className={`rounded-xl border overflow-hidden ${variant === 'warning' ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10'}`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5">
        <div className="flex items-center gap-2">
          <span className={variant === 'warning' ? 'text-amber-400' : 'text-white/60'}>{icon}</span>
          <span className="font-medium text-sm">{title}</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default EquipmentCard;

