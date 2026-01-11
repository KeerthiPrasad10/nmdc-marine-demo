// @ts-nocheck - Work order page with optional fields
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { WorkOrderForm } from '@/app/components/a2ui';
import type { WorkOrderSchema } from '@/app/components/a2ui';
import { Loader2 } from 'lucide-react';

// Default work order data - API Maxum OH2 pump bearing replacement
// This would normally come from the Resolve API based on the manual data
const getDefaultWorkOrder = (): WorkOrderSchema => ({
  workOrderNumber: `WO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
  priority: 'critical',
  status: 'draft',
  
  equipment: {
    tag: 'P-XXX',
    name: 'API Maxum OH2 Horizontal Process Pump',
    location: 'Enter vessel/location',
    manufacturer: 'Flowserve',
    model: 'API Maxum OH2 (API 610 11th Edition)',
    serialNumber: '',
  },
  
  workType: 'Emergency Repair',
  description: 'Emergency bearing replacement for API Maxum OH2 horizontal process pump. Bearing failure detected requiring immediate replacement per API 610 11th Edition maintenance procedures.',
  symptoms: [
    'Abnormal vibration detected',
    'Elevated bearing temperature',
    'Unusual noise from bearing housing',
  ],
  estimatedDuration: '8 hours',
  targetCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  
  safety: {
    atexRequired: true,
    atexZone: '1',
    lotoRequired: true,
    confinedSpace: false,
    hotWorkPermit: false,
    ppeRequired: [
      'Hard Hat',
      'Safety Glasses',
      'Steel-toe Boots',
      'Hearing Protection',
      'Work Gloves',
      'Flame Resistant Clothing',
    ],
    specialPrecautions: [
      'Complete lockout/tagout before starting work',
      'Verify pump is isolated and depressurized',
      'Use only ATEX-certified tools in hazardous area',
      'Allow motor to cool before disassembly',
      'Temperature limits must be observed during bearing installation (max 120°C/248°F for heating)',
      'Verify proper rotation direction before startup',
      'Monitor bearing temperature during initial run-in period',
    ],
  },
  
  lotoPoints: [
    {
      sequence: 1,
      tag: 'MCC-PXXX',
      type: 'Electrical Breaker',
      location: 'MCC Room / Pump Motor',
      action: 'Open breaker and apply lock',
      verification: 'Verify zero voltage at motor terminals',
      isolated: false,
    },
    {
      sequence: 2,
      tag: 'V-XXX-IN',
      type: 'Suction Isolation Valve',
      location: 'Pump Suction',
      action: 'Close and lock in closed position',
      verification: 'Verify valve position indicator shows CLOSED',
      isolated: false,
    },
    {
      sequence: 3,
      tag: 'V-XXX-OUT',
      type: 'Discharge Isolation Valve',
      location: 'Pump Discharge',
      action: 'Close and lock in closed position',
      verification: 'Verify valve position indicator shows CLOSED',
      isolated: false,
    },
    {
      sequence: 4,
      tag: 'PI-XXX',
      type: 'Pressure Gauge / Drain',
      location: 'Pump Casing',
      action: 'Open drain and bleed pressure',
      verification: 'Confirm zero pressure on gauge',
      isolated: false,
    },
  ],
  
  procedureSteps: [
    {
      step: 1,
      description: 'Complete LOTO procedure and verify all energy sources isolated',
      critical: true,
      completed: false,
    },
    {
      step: 2,
      description: 'Drain pump casing and disconnect coupling guard',
      critical: false,
      completed: false,
    },
    {
      step: 3,
      description: 'Disconnect coupling and remove motor (if required for access)',
      critical: false,
      completed: false,
    },
    {
      step: 4,
      description: 'Remove bearing housing cover and document existing clearances',
      critical: false,
      completed: false,
      notes: 'Record all measurements for reassembly reference',
    },
    {
      step: 5,
      description: 'Remove existing bearings using appropriate puller - DO NOT use impact methods',
      critical: true,
      completed: false,
      notes: 'Inspect shaft for wear, scoring, or damage',
    },
    {
      step: 6,
      description: 'Clean and inspect shaft, housing, and all sealing surfaces',
      critical: false,
      completed: false,
    },
    {
      step: 7,
      description: 'Heat new bearings uniformly to max 120°C (248°F) using induction heater or oil bath',
      critical: true,
      completed: false,
      notes: 'NEVER use open flame. Monitor temperature continuously.',
    },
    {
      step: 8,
      description: 'Install new bearings immediately after heating - slide onto shaft, do not force',
      critical: true,
      completed: false,
      notes: 'Allow natural cooling, do not quench',
    },
    {
      step: 9,
      description: 'Verify bearing seating and set proper end float per manufacturer specs',
      critical: true,
      completed: false,
    },
    {
      step: 10,
      description: 'Reassemble bearing housing, install new gaskets and seals',
      critical: false,
      completed: false,
    },
    {
      step: 11,
      description: 'Reconnect coupling and verify alignment within tolerance',
      critical: true,
      completed: false,
      notes: 'Laser alignment recommended. Max misalignment per API 610.',
    },
    {
      step: 12,
      description: 'Remove LOTO, restore power and verify rotation direction before starting',
      critical: true,
      completed: false,
    },
    {
      step: 13,
      description: 'Start pump and monitor bearing temperature during initial run-in (minimum 30 minutes)',
      critical: true,
      completed: false,
      notes: 'Max temp rise 40°C above ambient. Shut down if exceeded.',
    },
    {
      step: 14,
      description: 'Verify vibration levels within acceptable range per API 610',
      critical: false,
      completed: false,
    },
  ],
  
  qualityCheckpoints: [
    {
      id: 'qc-1',
      checkpoint: 'Shaft runout measurement',
      criteria: 'Max 0.025mm (0.001") TIR',
      passed: false,
    },
    {
      id: 'qc-2',
      checkpoint: 'Bearing internal clearance',
      criteria: 'Per manufacturer specification',
      passed: false,
    },
    {
      id: 'qc-3',
      checkpoint: 'Coupling alignment',
      criteria: 'Angular: ≤0.05mm/100mm, Offset: ≤0.05mm',
      passed: false,
    },
    {
      id: 'qc-4',
      checkpoint: 'Post-startup vibration',
      criteria: '≤4.5 mm/s per API 610',
      passed: false,
    },
    {
      id: 'qc-5',
      checkpoint: 'Bearing temperature (stabilized)',
      criteria: 'Max 40°C above ambient, absolute max 82°C',
      passed: false,
    },
  ],
  
  requiredParts: [
    {
      partNumber: 'BEARING-DE-XXX',
      description: 'Drive End Bearing (specify type from pump datasheet)',
      quantity: 1,
      unitCost: 0,
      inStock: false,
    },
    {
      partNumber: 'BEARING-NDE-XXX',
      description: 'Non-Drive End Bearing (specify type from pump datasheet)',
      quantity: 1,
      unitCost: 0,
      inStock: false,
    },
    {
      partNumber: 'SEAL-KIT-XXX',
      description: 'Bearing Housing Seal Kit (O-rings, lip seals)',
      quantity: 1,
      unitCost: 0,
      inStock: false,
    },
    {
      partNumber: 'GASKET-BH-XXX',
      description: 'Bearing Housing Cover Gasket',
      quantity: 2,
      unitCost: 0,
      inStock: false,
    },
    {
      partNumber: 'LUBRICANT-XXX',
      description: 'Bearing Lubricant (per manufacturer spec)',
      quantity: 1,
      unitCost: 0,
      inStock: false,
    },
  ],
  
  requiredTools: [
    'Induction bearing heater',
    'Bearing puller set',
    'Torque wrench set',
    'Dial indicator with magnetic base',
    'Laser alignment system',
    'Vibration analyzer',
    'Infrared thermometer',
    'Feeler gauge set',
    'Soft-face mallet',
    'Clean rags and cleaning solvent',
    'ATEX-certified hand tools',
  ],
  
  personnel: {
    requestedBy: '',
    assignedTo: '',
    safetyObserver: '',
    supervisor: '',
  },
  
  approvals: [
    {
      role: 'Maintenance Supervisor',
      approved: false,
    },
    {
      role: 'Operations Manager',
      approved: false,
    },
    {
      role: 'Safety Officer',
      approved: false,
    },
  ],
  
  createdAt: new Date().toISOString(),
  notes: 'This emergency work order is based on API Maxum OH2 maintenance procedures per API 610 11th Edition. Verify all part numbers against actual pump datasheet before ordering. ATEX compliance is mandatory for Zone 1 classified area.',
});

function WorkOrderContent() {
  const searchParams = useSearchParams();
  
  // In a real implementation, this would fetch from the API based on params
  const vesselId = searchParams.get('vessel');
  const equipmentTag = searchParams.get('equipment');
  
  // Get default data and customize if params provided
  const workOrderData = getDefaultWorkOrder();
  if (vesselId) {
    workOrderData.equipment.location = `Vessel: ${vesselId}`;
  }
  if (equipmentTag) {
    workOrderData.equipment.tag = equipmentTag;
  }

  const handleSave = (data: WorkOrderSchema) => {
    console.log('Saving work order:', data);
    // In production, this would POST to an API
    alert('Work order saved! (Check console for data)');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <WorkOrderForm 
      initialData={workOrderData}
      onSave={handleSave}
      onPrint={handlePrint}
    />
  );
}

export default function WorkOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/60">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading work order...</span>
        </div>
      </div>
    }>
      <WorkOrderContent />
    </Suspense>
  );
}

