import { useState } from "react";
import { 
  ClipboardList, 
  AlertCircle, 
  Calendar,
  Clock,
  Wrench,
  Package,
  Shield,
  Download,
  Send,
  Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { WorkOrderData } from "../types";

interface WorkOrderFormProps {
  data: WorkOrderData;
  onSubmit?: (data: WorkOrderData) => void;
  exportable?: boolean;
  onExport?: () => void;
  editable?: boolean;
}

export function WorkOrderForm({ 
  data: initialData, 
  onSubmit,
  exportable = true,
  onExport,
  editable = true
}: WorkOrderFormProps) {
  const [data, setData] = useState<WorkOrderData>(initialData);
  const [isEditing, setIsEditing] = useState(editable);

  const priorityColors = {
    emergency: 'bg-red-500/20 text-red-400 border-red-500/30',
    urgent: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    normal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const workTypeLabels = {
    corrective: 'Corrective Maintenance',
    preventive: 'Preventive Maintenance',
    inspection: 'Inspection',
    modification: 'Modification',
  };

  const updateField = <K extends keyof WorkOrderData>(field: K, value: WorkOrderData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit?.(data);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-[#71717A]/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Work Order</h3>
                <p className="text-sm text-white/50">
                  {data.workOrderNumber || 'New Work Order'}
                </p>
              </div>
            </div>

            <div className={cn(
              "px-3 py-1.5 rounded-lg border text-sm font-medium",
              priorityColors[data.priority]
            )}>
              {data.priority.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Equipment & Type */}
          <div className="grid md:grid-cols-2 gap-4">
            <FormField label="Equipment Tag">
              {isEditing ? (
                <Input 
                  value={data.equipmentTag}
                  onChange={(e) => updateField('equipmentTag', e.target.value)}
                  className="bg-white/5 border-white/20 font-mono"
                />
              ) : (
                <p className="font-mono text-[#71717A]">{data.equipmentTag}</p>
              )}
            </FormField>

            <FormField label="Work Type">
              {isEditing ? (
                <select
                  value={data.workType}
                  onChange={(e) => updateField('workType', e.target.value as WorkOrderData['workType'])}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white"
                >
                  {Object.entries(workTypeLabels).map(([value, label]) => (
                    <option key={value} value={value} className="bg-slate-900">
                      {label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-white/80">{workTypeLabels[data.workType]}</p>
              )}
            </FormField>
          </div>

          {/* Description */}
          <FormField label="Description">
            {isEditing ? (
              <Textarea 
                value={data.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="bg-white/5 border-white/20 min-h-[100px]"
                placeholder="Describe the work to be performed..."
              />
            ) : (
              <p className="text-white/80">{data.description}</p>
            )}
          </FormField>

          {/* Symptoms */}
          {(data.symptoms || isEditing) && (
            <FormField label="Symptoms / Problem Description">
              {isEditing ? (
                <Textarea 
                  value={data.symptoms || ''}
                  onChange={(e) => updateField('symptoms', e.target.value)}
                  className="bg-white/5 border-white/20"
                  placeholder="Describe the symptoms or problem observed..."
                />
              ) : (
                <p className="text-white/70">{data.symptoms}</p>
              )}
            </FormField>
          )}

          {/* Dates & Estimates */}
          <div className="grid md:grid-cols-3 gap-4">
            <FormField label="Target Date" icon={<Calendar className="w-4 h-4" />}>
              {isEditing ? (
                <Input 
                  type="date"
                  value={data.targetDate || ''}
                  onChange={(e) => updateField('targetDate', e.target.value)}
                  className="bg-white/5 border-white/20"
                />
              ) : (
                <p className="text-white/80">{data.targetDate || 'TBD'}</p>
              )}
            </FormField>

            <FormField label="Est. Hours" icon={<Clock className="w-4 h-4" />}>
              {isEditing ? (
                <Input 
                  type="number"
                  value={data.estimatedHours || ''}
                  onChange={(e) => updateField('estimatedHours', parseInt(e.target.value) || undefined)}
                  className="bg-white/5 border-white/20"
                  placeholder="Hours"
                />
              ) : (
                <p className="text-white/80">{data.estimatedHours || 'TBD'} hours</p>
              )}
            </FormField>

            <FormField label="Priority">
              {isEditing ? (
                <select
                  value={data.priority}
                  onChange={(e) => updateField('priority', e.target.value as WorkOrderData['priority'])}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white"
                >
                  <option value="emergency" className="bg-slate-900">Emergency</option>
                  <option value="urgent" className="bg-slate-900">Urgent</option>
                  <option value="normal" className="bg-slate-900">Normal</option>
                  <option value="low" className="bg-slate-900">Low</option>
                </select>
              ) : (
                <p className={cn("font-medium", priorityColors[data.priority].split(' ')[1])}>
                  {data.priority}
                </p>
              )}
            </FormField>
          </div>

          {/* Required Resources */}
          <div className="grid md:grid-cols-2 gap-4">
            <FormField label="Required Parts" icon={<Package className="w-4 h-4" />}>
              {isEditing ? (
                <Textarea 
                  value={data.requiredParts?.join('\n') || ''}
                  onChange={(e) => updateField('requiredParts', e.target.value.split('\n').filter(Boolean))}
                  className="bg-white/5 border-white/20"
                  placeholder="One per line..."
                  rows={3}
                />
              ) : (
                <ul className="text-sm text-white/70 space-y-1">
                  {data.requiredParts?.map((part, idx) => (
                    <li key={idx}>• {part}</li>
                  )) || <li className="text-white/40">None specified</li>}
                </ul>
              )}
            </FormField>

            <FormField label="Required Tools" icon={<Wrench className="w-4 h-4" />}>
              {isEditing ? (
                <Textarea 
                  value={data.requiredTools?.join('\n') || ''}
                  onChange={(e) => updateField('requiredTools', e.target.value.split('\n').filter(Boolean))}
                  className="bg-white/5 border-white/20"
                  placeholder="One per line..."
                  rows={3}
                />
              ) : (
                <ul className="text-sm text-white/70 space-y-1">
                  {data.requiredTools?.map((tool, idx) => (
                    <li key={idx}>• {tool}</li>
                  )) || <li className="text-white/40">None specified</li>}
                </ul>
              )}
            </FormField>
          </div>

          {/* Safety */}
          <FormField label="Safety Requirements" icon={<Shield className="w-4 h-4" />}>
            <div className="flex items-center gap-4 mb-2">
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={data.lotoRequired || false}
                  onChange={(e) => updateField('lotoRequired', e.target.checked)}
                  disabled={!isEditing}
                  className="rounded"
                />
                LOTO Required
              </label>
            </div>
            {isEditing ? (
              <Textarea 
                value={data.safetyRequirements?.join('\n') || ''}
                onChange={(e) => updateField('safetyRequirements', e.target.value.split('\n').filter(Boolean))}
                className="bg-white/5 border-white/20"
                placeholder="Additional safety requirements (one per line)..."
                rows={2}
              />
            ) : data.safetyRequirements && data.safetyRequirements.length > 0 ? (
              <ul className="text-sm text-white/70 space-y-1">
                {data.safetyRequirements.map((req, idx) => (
                  <li key={idx}>• {req}</li>
                ))}
              </ul>
            ) : null}
          </FormField>

          {/* Notes */}
          <FormField label="Additional Notes">
            {isEditing ? (
              <Textarea 
                value={data.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                className="bg-white/5 border-white/20"
                placeholder="Any additional notes or instructions..."
              />
            ) : data.notes ? (
              <p className="text-white/70">{data.notes}</p>
            ) : null}
          </FormField>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-white/10 flex justify-between">
          <div>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-white/50 hover:text-white"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {exportable && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white/70 hover:bg-white/10"
                onClick={onExport}
              >
                <Download className="w-4 h-4 mr-1" />
                Export PDF
              </Button>
            )}
            <Button
              size="sm"
              className="bg-[#71717A] hover:bg-[#52525B]"
              onClick={handleSubmit}
            >
              <Send className="w-4 h-4 mr-1" />
              Submit Work Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Form field wrapper
function FormField({ 
  label, 
  icon, 
  children 
}: { 
  label: string; 
  icon?: React.ReactNode; 
  children: React.ReactNode 
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-white/50 mb-2">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

export default WorkOrderForm;

