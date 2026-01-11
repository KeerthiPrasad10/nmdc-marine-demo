'use client';

/**
 * A2UIRenderer - The main component that renders A2UI responses
 * 
 * Based on Google's A2UI open project for agent-driven interfaces.
 * https://a2ui.org
 * 
 * This component receives structured data from an agent and renders
 * the appropriate UI component from the client's component catalog.
 */

import React from 'react';
import type { A2UIResponse, WorkOrderSchema, LOTOSchema, ChecklistSchema, EquipmentCardSchema } from './types';
import { WorkOrderForm } from './WorkOrderForm';
import { LOTOForm } from './LOTOForm';
import { ChecklistForm } from './ChecklistForm';
import { EquipmentCard } from './EquipmentCard';
import { InfoCard } from './InfoCard';

interface A2UIRendererProps {
  response: A2UIResponse;
  onSave?: (data: unknown) => void;
  onSubmit?: (data: unknown) => void;
  onPrint?: () => void;
}

/**
 * Renders an A2UI response using the appropriate component from the catalog.
 * 
 * The agent generates structured data (schema), and the client renders it
 * using pre-approved, trusted UI components. This maintains security while
 * allowing rich, interactive UIs.
 */
export function A2UIRenderer({ response, onSave, onSubmit, onPrint }: A2UIRendererProps) {
  // Dispatch to the appropriate component based on response type
  switch (response.type) {
    case 'work_order':
      return (
        <WorkOrderForm 
          initialData={response.schema as WorkOrderSchema}
          onSave={onSave as (data: WorkOrderSchema) => void}
          onSubmit={onSubmit as (data: WorkOrderSchema) => void}
          onPrint={onPrint}
        />
      );
    
    case 'loto_procedure':
      return (
        <LOTOForm 
          initialData={response.schema as LOTOSchema}
          onSave={onSave as (data: LOTOSchema) => void}
          onSubmit={onSubmit as (data: LOTOSchema) => void}
          onPrint={onPrint}
        />
      );
    
    case 'checklist':
      return (
        <ChecklistForm 
          initialData={response.schema as ChecklistSchema}
          onSave={onSave as (data: ChecklistSchema) => void}
          onSubmit={onSubmit as (data: ChecklistSchema) => void}
          onPrint={onPrint}
        />
      );
    
    case 'equipment_card':
      return (
        <EquipmentCard 
          data={response.schema as EquipmentCardSchema}
          onPrint={onPrint}
        />
      );
    
    case 'info':
      return (
        <InfoCard 
          data={response.schema as Record<string, unknown>}
        />
      );
    
    default:
      // Fallback for unknown types - render as JSON
      return (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-white/40 mb-2">Unknown A2UI type: {response.type}</p>
          <pre className="text-xs text-white/60 overflow-auto">
            {JSON.stringify(response.schema, null, 2)}
          </pre>
        </div>
      );
  }
}

/**
 * Utility to check if a response is a valid A2UI response
 */
export function isA2UIResponse(data: unknown): data is A2UIResponse {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.type === 'string' &&
    typeof obj.schema === 'object' &&
    obj.schema !== null
  );
}

/**
 * A2UI-compatible types that should be rendered as interactive forms
 */
const A2UI_TYPES = ['work_order', 'loto_procedure', 'checklist', 'equipment_card'];

/**
 * Utility to extract A2UI response from various API response formats
 */
export function extractA2UIResponse(apiResponse: unknown): A2UIResponse | null {
  console.log('[A2UI extractA2UIResponse] Input:', {
    type: typeof apiResponse,
    isNull: apiResponse === null,
    isObject: typeof apiResponse === 'object',
  });
  
  if (!apiResponse || typeof apiResponse !== 'object') {
    console.log('[A2UI extractA2UIResponse] Rejected: not object');
    return null;
  }
  
  const obj = apiResponse as Record<string, unknown>;
  
  console.log('[A2UI extractA2UIResponse] Checking object with keys:', Object.keys(obj).slice(0, 10));
  console.log('[A2UI extractA2UIResponse] obj.type =', obj.type);
  console.log('[A2UI extractA2UIResponse] has obj.data =', !!obj.data);
  console.log('[A2UI extractA2UIResponse] has obj.responses =', !!obj.responses);
  console.log('[A2UI extractA2UIResponse] has obj.answer =', !!obj.answer);
  
  // Direct A2UI response (has type + schema)
  if (isA2UIResponse(obj)) {
    console.log('[A2UI extractA2UIResponse] ✅ Direct A2UI response');
    return obj;
  }
  
  // Handle multi_response format: { type: 'multi_response', data: { responses: [...] } }
  // OR { responses: [...] } directly at top level
  const responsesArray = 
    (obj.responses && Array.isArray(obj.responses)) ? obj.responses :
    (obj.data && typeof obj.data === 'object' && (obj.data as Record<string, unknown>).responses && 
     Array.isArray((obj.data as Record<string, unknown>).responses)) ? 
      (obj.data as Record<string, unknown>).responses as unknown[] : null;
  
  if (responsesArray) {
    console.log('[A2UI extractA2UIResponse] Found responses array, length:', responsesArray.length);
    for (const resp of responsesArray) {
      if (resp && typeof resp === 'object') {
        const respObj = resp as Record<string, unknown>;
        console.log('[A2UI extractA2UIResponse] Checking response item, type:', respObj.type);
        if (respObj.type && A2UI_TYPES.includes(respObj.type as string) && respObj.data) {
          console.log('[A2UI extractA2UIResponse] ✅ Found in multi_response:', respObj.type);
          return {
            type: respObj.type as A2UIResponse['type'],
            version: '1.0',
            schema: normalizeSchemaKeys(respObj.data as Record<string, unknown>),
          };
        }
      }
    }
  }
  
  // API format: { type: 'work_order', data: {...} } - convert to A2UI format
  if (obj.type && typeof obj.type === 'string' && obj.data && typeof obj.data === 'object') {
    console.log('[A2UI extractA2UIResponse] Checking direct type:', obj.type, 'isA2UIType:', A2UI_TYPES.includes(obj.type));
    if (A2UI_TYPES.includes(obj.type)) {
      console.log('[A2UI extractA2UIResponse] ✅ Found direct type:', obj.type);
      return {
        type: obj.type as A2UIResponse['type'],
        version: '1.0',
        schema: normalizeSchemaKeys(obj.data as Record<string, unknown>),
      };
    }
  }
  
  // Wrapped in 'ui' field
  if (obj.ui && typeof obj.ui === 'object') {
    const uiResult = extractA2UIResponse(obj.ui);
    if (uiResult) return uiResult;
  }
  
  // Wrapped in 'response' field  
  if (obj.response && typeof obj.response === 'object') {
    const respResult = extractA2UIResponse(obj.response);
    if (respResult) return respResult;
  }
  
  // Handle answer field that contains HTML with work order
  if (obj.answer && typeof obj.answer === 'string') {
    // Check if the answer mentions work order generation
    const answer = obj.answer as string;
    if (answer.includes('WO-') && answer.includes('work_order_number')) {
      // Try to extract JSON from the answer
      const jsonMatch = answer.match(/\{[\s\S]*"work_order_number"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const woData = JSON.parse(jsonMatch[0]);
          return {
            type: 'work_order',
            version: '1.0',
            schema: normalizeSchemaKeys(woData),
          };
        } catch {
          // Ignore parse errors
        }
      }
    }
  }
  
  // Try to infer type from data structure (fallback)
  const dataToCheck = obj.data && typeof obj.data === 'object' ? obj.data as Record<string, unknown> : obj;
  
  if (dataToCheck.workOrderNumber || dataToCheck.work_order_number) {
    console.log('[A2UI] Inferred work_order from data structure');
    return {
      type: 'work_order',
      version: '1.0',
      schema: normalizeSchemaKeys(dataToCheck) as unknown as WorkOrderSchema,
    };
  }
  
  if (dataToCheck.isolationPoints || dataToCheck.isolation_points || 
      dataToCheck.lotoPoints || dataToCheck.loto_points || dataToCheck.procedureNumber) {
    console.log('[A2UI] Inferred loto_procedure from data structure');
    return {
      type: 'loto_procedure',
      version: '1.0',
      schema: normalizeSchemaKeys(dataToCheck) as unknown as LOTOSchema,
    };
  }
  
  // Check for checklist - must have items array with checklist-like structure
  if (dataToCheck.items && Array.isArray(dataToCheck.items) && dataToCheck.items.length > 0) {
    const firstItem = dataToCheck.items[0] as Record<string, unknown> | null;
    if (firstItem && (firstItem.checked !== undefined || firstItem.text || firstItem.label)) {
      console.log('[A2UI] Inferred checklist from data structure');
      return {
        type: 'checklist',
        version: '1.0',
        schema: normalizeSchemaKeys(dataToCheck) as unknown as ChecklistSchema,
      };
    }
  }
  
  if (dataToCheck.equipmentTag || dataToCheck.equipment_tag || 
      dataToCheck.assetTag || dataToCheck.asset_tag ||
      (dataToCheck.tag && dataToCheck.manufacturer)) {
    console.log('[A2UI] Inferred equipment_card from data structure');
    return {
      type: 'equipment_card',
      version: '1.0',
      schema: normalizeSchemaKeys(dataToCheck) as unknown as EquipmentCardSchema,
    };
  }
  
  return null;
}

/**
 * Normalize snake_case keys to camelCase for schema compatibility
 */
function normalizeSchemaKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Convert snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    // Recursively normalize nested objects and arrays
    if (Array.isArray(value)) {
      result[camelKey] = value.map(item => 
        item && typeof item === 'object' ? normalizeSchemaKeys(item as Record<string, unknown>) : item
      );
    } else if (value && typeof value === 'object') {
      result[camelKey] = normalizeSchemaKeys(value as Record<string, unknown>);
    } else {
      result[camelKey] = value;
    }
  }
  
  return result;
}

export default A2UIRenderer;

