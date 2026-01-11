'use client';

import { useRef } from "react";
import { 
  Shield, 
  AlertTriangle, 
  HardHat,
  Lock,
  Unlock,
  Download,
  Printer,
  FileText,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LOTOData, LOTOStep } from "../types";
import { exportToPDF } from "../PDFExporter";

interface LOTODocumentProps {
  data: LOTOData;
  exportable?: boolean;
  onExport?: () => void;
}

export function LOTODocument({ data, exportable = true, onExport }: LOTODocumentProps) {
  const documentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (documentRef.current) {
      exportToPDF(documentRef.current, {
        title: `LOTO Procedure - ${data.equipmentTag}`,
        filename: `loto-${data.equipmentTag?.replace(/[^a-zA-Z0-9]/g, '-') || 'procedure'}`,
      });
    }
    onExport?.();
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Document Container */}
      <div 
        ref={documentRef}
        className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden print:bg-white print:text-black"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#71717A]/20 to-red-500/20 p-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <Shield className="w-6 h-6" />
                <span className="text-sm font-semibold uppercase tracking-wider">
                  Lock Out / Tag Out Procedure
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white">
                {data.equipmentTag}
              </h2>
              <p className="text-white/60 mt-1">{data.equipmentName}</p>
            </div>
            
            <div className="text-right text-sm">
              {data.procedureNumber && (
                <p className="text-white/40">Procedure: {data.procedureNumber}</p>
              )}
              {data.revisionDate && (
                <p className="text-white/40">Rev: {data.revisionDate}</p>
              )}
              {data.drawingReference && (
                <div className="flex items-center gap-1 text-white/40 mt-1 justify-end">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{data.drawingReference}</span>
                </div>
              )}
            </div>
          </div>

          {data.scope && (
            <p className="mt-4 text-sm text-white/70 bg-white/5 p-3 rounded-lg">
              <strong>Scope:</strong> {data.scope}
            </p>
          )}
        </div>

        {/* Hazards & PPE */}
        <div className="grid md:grid-cols-2 gap-4 p-6 border-b border-white/10">
          {/* Hazards */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-400 mb-3">
              <AlertTriangle className="w-4 h-4" />
              HAZARDS
            </h4>
            <ul className="space-y-1.5">
              {data.hazards.map((hazard, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5" />
                  {hazard}
                </li>
              ))}
            </ul>
          </div>

          {/* PPE */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-400 mb-3">
              <HardHat className="w-4 h-4" />
              REQUIRED PPE
            </h4>
            <ul className="space-y-1.5">
              {data.ppe.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                  <CheckCircle className="shrink-0 w-4 h-4 text-blue-400 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pre-Isolation Checks */}
        {data.preIsolationChecks && data.preIsolationChecks.length > 0 && (
          <div className="p-6 border-b border-white/10">
            <h4 className="text-sm font-semibold text-white mb-3">
              PRE-ISOLATION CHECKS
            </h4>
            <div className="space-y-2">
              {data.preIsolationChecks.map((check, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <span className="shrink-0 w-6 h-6 rounded bg-white/10 flex items-center justify-center text-white/50 font-mono text-xs">
                    {idx + 1}
                  </span>
                  <span className="text-white/70">{check}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Isolation Steps Table */}
        <div className="p-6 border-b border-white/10">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-red-400 mb-4">
            <Lock className="w-4 h-4" />
            ISOLATION STEPS
          </h4>
          <LOTOStepsTable steps={data.isolationSteps} />
        </div>

        {/* Drain & Vent Steps */}
        {((data.drainSteps && data.drainSteps.length > 0) || 
          (data.ventSteps && data.ventSteps.length > 0)) && (
          <div className="grid md:grid-cols-2 gap-6 p-6 border-b border-white/10">
            {data.drainSteps && data.drainSteps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">DRAIN STEPS</h4>
                <LOTOStepsTable steps={data.drainSteps} compact />
              </div>
            )}
            {data.ventSteps && data.ventSteps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">VENT STEPS</h4>
                <LOTOStepsTable steps={data.ventSteps} compact />
              </div>
            )}
          </div>
        )}

        {/* Verification Steps */}
        {data.verificationSteps && data.verificationSteps.length > 0 && (
          <div className="p-6 border-b border-white/10">
            <h4 className="text-sm font-semibold text-emerald-400 mb-3">
              ZERO ENERGY VERIFICATION
            </h4>
            <div className="space-y-2">
              {data.verificationSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <CheckCircle className="shrink-0 w-4 h-4 text-emerald-400 mt-0.5" />
                  <span className="text-white/70">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reinstatement Steps */}
        {data.reinstateSteps && data.reinstateSteps.length > 0 && (
          <div className="p-6 border-b border-white/10">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-400 mb-4">
              <Unlock className="w-4 h-4" />
              REINSTATEMENT SEQUENCE
            </h4>
            <div className="space-y-2">
              {data.reinstateSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <span className="shrink-0 w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 font-mono text-xs">
                    {idx + 1}
                  </span>
                  <span className="text-white/70">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signature Block */}
        <div className="p-6 bg-white/[0.02]">
          <h4 className="text-sm font-semibold text-white mb-4">AUTHORIZATION</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <SignatureBlock 
              title="Authorized by" 
              roles={data.authorizedPersonnel || ['Operations Supervisor']} 
            />
            <SignatureBlock 
              title="Acknowledged by" 
              roles={['Maintenance Technician']} 
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {exportable && (
        <div className="mt-4 flex justify-end gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white/70 hover:bg-white/10"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-1" />
            Print
          </Button>
          <Button
            size="sm"
            className="bg-[#71717A] hover:bg-[#52525B]"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-1" />
            Export PDF
          </Button>
        </div>
      )}
    </div>
  );
}

// Steps table sub-component
function LOTOStepsTable({ steps, compact = false }: { steps: LOTOStep[]; compact?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-3 py-2 text-left text-white/50 font-medium w-12">#</th>
            <th className="px-3 py-2 text-left text-white/50 font-medium">Point</th>
            <th className="px-3 py-2 text-left text-white/50 font-medium">Action</th>
            {!compact && (
              <th className="px-3 py-2 text-left text-white/50 font-medium">Verification</th>
            )}
          </tr>
        </thead>
        <tbody>
          {steps.map((step) => (
            <tr key={step.step} className="border-b border-white/5">
              <td className="px-3 py-2.5 text-white/50 font-mono">{step.step}</td>
              <td className="px-3 py-2.5 font-mono text-[#71717A]">{step.point}</td>
              <td className="px-3 py-2.5 text-white/70">{step.action}</td>
              {!compact && (
                <td className="px-3 py-2.5 text-white/50">{step.verification}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Signature block sub-component
function SignatureBlock({ title, roles }: { title: string; roles: string[] }) {
  return (
    <div>
      <p className="text-xs text-white/40 mb-2">{title}</p>
      {roles.map((role, idx) => (
        <div key={idx} className="mb-3">
          <p className="text-sm text-white/60 mb-1">{role}</p>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="border-b border-white/20 h-8" />
              <p className="text-xs text-white/30 mt-1">Signature</p>
            </div>
            <div className="w-24">
              <div className="border-b border-white/20 h-8" />
              <p className="text-xs text-white/30 mt-1">Date</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default LOTODocument;

