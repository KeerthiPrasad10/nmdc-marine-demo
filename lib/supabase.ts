import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Flag to check if Supabase is properly configured
export const isSupabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Create client (will work but return empty data if not configured)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Types for easier use
export type Vessel = Database['public']['Tables']['vessels']['Row'];
export type Equipment = Database['public']['Tables']['equipment']['Row'];
export type Alert = Database['public']['Tables']['alerts']['Row'];
export type Mitigation = Database['public']['Tables']['mitigations']['Row'];
export type Weather = Database['public']['Tables']['weather']['Row'];
export type FleetMetrics = Database['public']['Tables']['fleet_metrics']['Row'];
// These types reference tables that may not exist in all environments
// Uncomment when the corresponding database tables are created
// export type ComplianceRecord = Database['public']['Tables']['compliance_records']['Row'];
// export type PdmPrediction = Database['public']['Tables']['pdm_predictions']['Row'];
// export type MaintenanceSchedule = Database['public']['Tables']['maintenance_schedule']['Row'];
// export type FuelConsumptionLog = Database['public']['Tables']['fuel_consumption_log']['Row'];
export type PositionHistory = Database['public']['Tables']['position_history']['Row'];
export type VesselDatasheet = Database['public']['Tables']['vessel_datasheets']['Row'];

// Placeholder types until database tables are created
export type ComplianceRecord = { id: string; vessel_id: string | null; [key: string]: unknown };
export type PdmPrediction = { id: string; vessel_id: string | null; [key: string]: unknown };
export type MaintenanceSchedule = { id: string; vessel_id: string | null; [key: string]: unknown };
export type FuelConsumptionLog = { id: string; vessel_id: string | null; [key: string]: unknown };

// Enum types - comment out if they don't exist in your schema
// export type FuelType = Database['public']['Enums']['fuel_type'];
// export type VesselClass = Database['public']['Enums']['vessel_class'];
// export type FailureMode = Database['public']['Enums']['failure_mode'];
// export type ComplianceStatus = Database['public']['Enums']['compliance_status'];
// export type RegulationType = Database['public']['Enums']['regulation_type'];

// Placeholder enum types
export type FuelType = 'VLSFO' | 'ULSFO' | 'MGO' | 'MDO' | 'HFO' | 'LNG' | 'METHANOL' | 'BIOFUEL';
export type VesselClass = 'heavy_duty_csd' | 'derrick_barge' | 'hopper_dredger' | 'auxiliary_tug' | 'supply_vessel' | 'survey_vessel' | 'crane_barge' | 'accommodation_barge';
export type FailureMode = 'bearing_wear' | 'piston_ring_wear' | 'fuel_injector_fouling' | 'turbocharger_failure' | 'cooling_system_failure' | 'lube_oil_degradation';
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'pending' | 'expired';
export type RegulationType = 'IMO' | 'MARPOL' | 'SOLAS' | 'ISM' | 'MLC' | 'ISPS' | 'LOCAL';

// Extended types with relations
export type VesselWithEquipment = Vessel & {
  equipment: Equipment[];
};

export type AlertWithMitigations = Alert & {
  mitigations: Mitigation[];
  vessels: Pick<Vessel, 'name' | 'type'> | null;
};

export type VesselWithCompliance = Vessel & {
  compliance_records: ComplianceRecord[];
  equipment: Equipment[];
};

// New types for enhanced data model (uncomment when tables exist)
// export type OffshoreAsset = Database['public']['Tables']['offshore_assets']['Row'];
// export type AssetTimeseries = Database['public']['Tables']['asset_timeseries']['Row'];
// export type SafetyEvent = Database['public']['Tables']['safety_events']['Row'];

// Placeholder types for offshore assets
export type OffshoreAsset = { id: string; name: string; asset_type: string; [key: string]: unknown };
export type AssetTimeseries = { id: string; asset_id: string; [key: string]: unknown };
export type SafetyEvent = { id: string; asset_id: string | null; [key: string]: unknown };

// New enum types (placeholders)
export type AssetType = 'pipeline' | 'platform' | 'compressor' | 'wellhead' | 'other';
export type AssetSubtype = 'Subsea Pipeline' | 'Platform Compressor' | 'Offshore Platform' | 'FPSO' | 'Drilling Rig';
export type OpMode = 'ONLINE' | 'STANDBY' | 'MAINT' | 'OFFLINE';
export type SafetyState = 'GREEN' | 'AMBER' | 'RED';

