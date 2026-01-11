'use client';

/**
 * LOTOForm - Lockout/Tagout Procedure Form
 * A2UI Component for rendering and editing LOTO procedures
 */

import { useState, useRef } from 'react';
import { 
  Printer, Save, Lock, Unlock, AlertTriangle, Shield,
  Zap, CheckCircle2, Clock, User, ChevronDown, ChevronRight,
  Plus, Trash2, FileText, Phone
} from 'lucide-react';
import type { LOTOSchema } from './types';

interface LOTOFormProps {
  initialData: LOTOSchema;
  onSave?: (data: LOTOSchema) => void;
  onSubmit?: (data: LOTOSchema) => void;
  onPrint?: () => void;
}

const energyTypeIcons: Record<string, string> = {
  electrical: '⚡',
  mechanical: '⚙️',
  hydraulic: '💧',
  pneumatic: '💨',
  thermal: '🔥',
  chemical: '☣️',
  gravitational: '⬇️',
  stored_energy: '🔋',
};

const statusConfig = {
  draft: { bg: 'bg-gray-500/20', border: 'border-gray-500/40', text: 'text-gray-400', label: 'DRAFT' },
  active: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', label: 'ACTIVE' },
  completed: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', label: 'COMPLETED' },
  cancelled: { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-400', label: 'CANCELLED' },
};

export function LOTOForm({ initialData, onSave, onSubmit, onPrint }: LOTOFormProps) {
  const [data, setData] = useState<LOTOSchema>(initialData);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['equipment', 'energy', 'isolation', 'verification', 'approvals'])
  );
  const printRef = useRef<HTMLDivElement>(null);

  const updateField = (path: string, value: unknown) => {
    setData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const updateArrayItem = (arrayPath: string, index: number, field: string, value: unknown) => {
    setData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = arrayPath.split('.');
      let arr = newData;
      for (const key of keys) {
        arr = arr[key];
      }
      if (Array.isArray(arr) && arr[index]) {
        arr[index][field] = value;
      }
      return newData;
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const handlePrint = () => {
    if (onPrint) onPrint();
    else window.print();
  };

  const handleSave = () => onSave?.(data);
  const handleSubmit = () => onSubmit?.(data);

  const status = statusConfig[data.status] || statusConfig.draft;
  const allIsolated = data.isolationPoints.every(p => p.isolated && p.verified);
  const allVerified = data.zeroEnergyVerification.every(v => v.verified);

  return (
    <div className="bg-black text-white rounded-xl border border-rose-500/30 overflow-hidden">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .loto-form { background: white !important; color: black !important; }
          .loto-form * { color: black !important; border-color: #ccc !important; }
        }
      `}</style>

      {/* Header Actions */}
      <div className="no-print sticky top-0 z-50 bg-black/95 backdrop-blur border-b border-rose-500/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h1 className="font-semibold">Lockout/Tagout Procedure</h1>
              <p className="text-xs text-white/50">{data.procedureNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-[10px] font-bold ${status.bg} ${status.border} ${status.text} border`}>
              {status.label}
            </span>
            <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm">
              <Save className="w-4 h-4" /> Save
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm">
              <Printer className="w-4 h-4" /> Print
            </button>
            {onSubmit && (
              <button 
                onClick={handleSubmit} 
                disabled={!allIsolated || !allVerified}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
                  allIsolated && allVerified 
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400' 
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Complete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div ref={printRef} className="loto-form p-4 space-y-4">
        
        {/* Warning Banner */}
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-rose-400">DANGER: Lockout/Tagout Procedure</h3>
              <p className="text-sm text-rose-300/70">
                Failure to follow this procedure may result in serious injury or death. 
                All energy sources must be isolated and verified before work begins.
              </p>
            </div>
          </div>
        </div>

        {/* Equipment & Work Info */}
        <Section
          title="Equipment Information"
          icon={<FileText className="w-4 h-4" />}
          expanded={expandedSections.has('equipment')}
          onToggle={() => toggleSection('equipment')}
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Equipment Tag</label>
              <input
                type="text"
                value={data.equipment.tag}
                onChange={(e) => updateField('equipment.tag', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-mono focus:outline-none focus:border-white/30"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Equipment Name</label>
              <input
                type="text"
                value={data.equipment.name}
                onChange={(e) => updateField('equipment.name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Location</label>
              <input
                type="text"
                value={data.equipment.location}
                onChange={(e) => updateField('equipment.location', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Est. Duration</label>
              <input
                type="text"
                value={data.estimatedDuration}
                onChange={(e) => updateField('estimatedDuration', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Work Description</label>
            <textarea
              value={data.workDescription}
              onChange={(e) => updateField('workDescription', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30 resize-none"
            />
          </div>
        </Section>

        {/* Energy Sources */}
        <Section
          title="Energy Sources & Hazards"
          icon={<Zap className="w-4 h-4" />}
          expanded={expandedSections.has('energy')}
          onToggle={() => toggleSection('energy')}
          variant="danger"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-amber-400 mb-2">Energy Sources Present</label>
              <div className="grid grid-cols-2 gap-2">
                {data.energySources.map((source, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="text-2xl">{energyTypeIcons[source.type] || '⚡'}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium capitalize">{source.type.replace('_', ' ')}</div>
                      <div className="text-xs text-white/50">{source.description}</div>
                      {source.voltage && <div className="text-xs text-amber-400">Voltage: {source.voltage}</div>}
                      {source.pressure && <div className="text-xs text-amber-400">Pressure: {source.pressure}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-rose-400 mb-2">Hazards</label>
              <div className="flex flex-wrap gap-2">
                {data.hazards.map((hazard, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-300">
                    ⚠️ {hazard}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-blue-400 mb-2">Required PPE</label>
              <div className="flex flex-wrap gap-2">
                {data.ppeRequired.map((ppe, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
                    🛡️ {ppe}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Isolation Points */}
        <Section
          title={`Isolation Points (${data.isolationPoints.filter(p => p.isolated).length}/${data.isolationPoints.length} Isolated)`}
          icon={<Lock className="w-4 h-4" />}
          expanded={expandedSections.has('isolation')}
          onToggle={() => toggleSection('isolation')}
          variant="danger"
        >
          <div className="space-y-3">
            {data.isolationPoints.map((point, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-xl border ${
                  point.isolated && point.verified 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : point.isolated 
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                    point.isolated && point.verified 
                      ? 'bg-emerald-500/30 text-emerald-400' 
                      : point.isolated
                        ? 'bg-amber-500/30 text-amber-400'
                        : 'bg-rose-500/30 text-rose-400'
                  }`}>
                    {point.sequence}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-4 gap-3">
                    <div>
                      <div className="text-[10px] uppercase text-white/40">Tag</div>
                      <div className="font-mono text-sm">{point.tag}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-white/40">Type</div>
                      <div className="text-sm">{point.type}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-white/40">Location</div>
                      <div className="text-sm">{point.location}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-white/40">Lock ID</div>
                      <input
                        type="text"
                        value={point.lockId || ''}
                        onChange={(e) => updateArrayItem('isolationPoints', i, 'lockId', e.target.value)}
                        placeholder="Lock #"
                        className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-2 gap-4 pl-14">
                  <div>
                    <div className="text-[10px] uppercase text-amber-400 mb-1">Action Required</div>
                    <div className="text-sm text-white/70">{point.action}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-emerald-400 mb-1">Verification Method</div>
                    <div className="text-sm text-white/70">{point.verification}</div>
                  </div>
                </div>

                <div className="mt-3 pl-14 flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={point.isolated || false}
                      onChange={(e) => {
                        updateArrayItem('isolationPoints', i, 'isolated', e.target.checked);
                        if (e.target.checked) {
                          updateArrayItem('isolationPoints', i, 'isolatedAt', new Date().toISOString());
                        }
                      }}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-sm">
                      {point.isolated ? <span className="text-amber-400">🔒 Isolated</span> : 'Mark Isolated'}
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={point.verified || false}
                      onChange={(e) => {
                        updateArrayItem('isolationPoints', i, 'verified', e.target.checked);
                        if (e.target.checked) {
                          updateArrayItem('isolationPoints', i, 'verifiedAt', new Date().toISOString());
                        }
                      }}
                      disabled={!point.isolated}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-sm">
                      {point.verified ? <span className="text-emerald-400">✓ Verified</span> : 'Verify Zero Energy'}
                    </span>
                  </label>

                  <input
                    type="text"
                    value={point.verifiedBy || ''}
                    onChange={(e) => updateArrayItem('isolationPoints', i, 'verifiedBy', e.target.value)}
                    placeholder="Verified by..."
                    className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Zero Energy Verification */}
        <Section
          title="Zero Energy Verification"
          icon={<Shield className="w-4 h-4" />}
          expanded={expandedSections.has('verification')}
          onToggle={() => toggleSection('verification')}
          variant="success"
        >
          <div className="space-y-2">
            {data.zeroEnergyVerification.map((ver, i) => (
              <div 
                key={i}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  ver.verified ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5 border border-white/10'
                }`}
              >
                <input
                  type="checkbox"
                  checked={ver.verified || false}
                  onChange={(e) => {
                    updateArrayItem('zeroEnergyVerification', i, 'verified', e.target.checked);
                    if (e.target.checked) {
                      updateArrayItem('zeroEnergyVerification', i, 'verifiedAt', new Date().toISOString());
                    }
                  }}
                  className="w-5 h-5 rounded"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{ver.point}</div>
                  <div className="text-xs text-white/50">Method: {ver.method}</div>
                </div>
                <input
                  type="text"
                  value={ver.verifiedBy || ''}
                  onChange={(e) => updateArrayItem('zeroEnergyVerification', i, 'verifiedBy', e.target.value)}
                  placeholder="Verified by..."
                  className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs focus:outline-none w-32"
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Emergency Contacts */}
        {data.emergencyContacts && data.emergencyContacts.length > 0 && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <h4 className="text-xs uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Emergency Contacts
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {data.emergencyContacts.map((contact, i) => (
                <div key={i} className="text-sm">
                  <div className="text-white/50">{contact.role}</div>
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-blue-400 font-mono">{contact.phone}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approvals */}
        <Section
          title="Approvals & Sign-off"
          icon={<CheckCircle2 className="w-4 h-4" />}
          expanded={expandedSections.has('approvals')}
          onToggle={() => toggleSection('approvals')}
        >
          <div className="grid grid-cols-2 gap-4">
            {data.approvals.map((approval, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-2">{approval.role}</div>
                <input
                  type="text"
                  value={approval.name || ''}
                  onChange={(e) => updateArrayItem('approvals', i, 'name', e.target.value)}
                  placeholder="Name"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none mb-2"
                />
                <div className="h-14 border border-dashed border-white/20 rounded-lg flex items-center justify-center text-white/30 text-xs mb-2">
                  Signature
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={approval.date || ''}
                    onChange={(e) => updateArrayItem('approvals', i, 'date', e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs focus:outline-none"
                  />
                  <input
                    type="time"
                    value={approval.time || ''}
                    onChange={(e) => updateArrayItem('approvals', i, 'time', e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Created: {new Date(data.createdAt).toLocaleString()}</span>
          </div>
          <div>Procedure: {data.procedureNumber}</div>
        </div>
      </div>
    </div>
  );
}

// Collapsible section component
function Section({ 
  title, icon, children, expanded, onToggle, variant = 'default'
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  variant?: 'default' | 'danger' | 'success';
}) {
  const styles = {
    default: 'border-white/10',
    danger: 'border-rose-500/30 bg-rose-500/5',
    success: 'border-emerald-500/30 bg-emerald-500/5',
  };

  return (
    <div className={`rounded-xl border ${styles[variant]} overflow-hidden`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5">
        <div className="flex items-center gap-3">
          <span className={variant === 'danger' ? 'text-rose-400' : variant === 'success' ? 'text-emerald-400' : 'text-white/60'}>
            {icon}
          </span>
          <span className="font-medium">{title}</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default LOTOForm;

