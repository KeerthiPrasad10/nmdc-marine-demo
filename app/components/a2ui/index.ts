/**
 * A2UI Component Catalog
 * 
 * Based on Google's A2UI open project for agent-driven interfaces.
 * https://a2ui.org
 * https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/
 * 
 * These components render structured data from agents as interactive UIs.
 * The agent generates the schema, the client renders using its component catalog.
 */

// Types
export * from './types';

// Main renderer
export { A2UIRenderer, isA2UIResponse, extractA2UIResponse } from './A2UIRenderer';

// Component catalog
export { WorkOrderForm } from './WorkOrderForm';
export { LOTOForm } from './LOTOForm';
export { ChecklistForm } from './ChecklistForm';
export { EquipmentCard } from './EquipmentCard';
export { InfoCard } from './InfoCard';
