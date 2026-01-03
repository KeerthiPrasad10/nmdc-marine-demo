export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          acknowledged: boolean | null
          created_at: string | null
          description: string | null
          id: string
          resolved: boolean | null
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          type: Database["public"]["Enums"]["alert_type"]
          updated_at: string | null
          vessel_id: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          resolved?: boolean | null
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          type: Database["public"]["Enums"]["alert_type"]
          updated_at?: string | null
          vessel_id?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          resolved?: boolean | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
          type?: Database["public"]["Enums"]["alert_type"]
          updated_at?: string | null
          vessel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          created_at: string | null
          failure_confidence: number | null
          health_score: number | null
          hours_operated: number | null
          id: string
          last_maintenance: string | null
          name: string
          predicted_failure: string | null
          temperature: number | null
          type: Database["public"]["Enums"]["equipment_type"]
          updated_at: string | null
          vessel_id: string | null
          vibration: number | null
        }
        Insert: {
          created_at?: string | null
          failure_confidence?: number | null
          health_score?: number | null
          hours_operated?: number | null
          id?: string
          last_maintenance?: string | null
          name: string
          predicted_failure?: string | null
          temperature?: number | null
          type: Database["public"]["Enums"]["equipment_type"]
          updated_at?: string | null
          vessel_id?: string | null
          vibration?: number | null
        }
        Update: {
          created_at?: string | null
          failure_confidence?: number | null
          health_score?: number | null
          hours_operated?: number | null
          id?: string
          last_maintenance?: string | null
          name?: string
          predicted_failure?: string | null
          temperature?: number | null
          type?: Database["public"]["Enums"]["equipment_type"]
          updated_at?: string | null
          vessel_id?: string | null
          vibration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_metrics: {
        Row: {
          active_alerts: number | null
          alert_vessels: number | null
          average_fuel_level: number | null
          average_health_score: number | null
          critical_alerts: number | null
          id: string
          maintenance_vessels: number | null
          operational_vessels: number | null
          recorded_at: string | null
          total_emissions_co2: number | null
          total_emissions_nox: number | null
          total_emissions_sox: number | null
          total_vessels: number | null
          upcoming_maintenance: number | null
        }
        Insert: {
          active_alerts?: number | null
          alert_vessels?: number | null
          average_fuel_level?: number | null
          average_health_score?: number | null
          critical_alerts?: number | null
          id?: string
          maintenance_vessels?: number | null
          operational_vessels?: number | null
          recorded_at?: string | null
          total_emissions_co2?: number | null
          total_emissions_nox?: number | null
          total_emissions_sox?: number | null
          total_vessels?: number | null
          upcoming_maintenance?: number | null
        }
        Update: {
          active_alerts?: number | null
          alert_vessels?: number | null
          average_fuel_level?: number | null
          average_health_score?: number | null
          critical_alerts?: number | null
          id?: string
          maintenance_vessels?: number | null
          operational_vessels?: number | null
          recorded_at?: string | null
          total_emissions_co2?: number | null
          total_emissions_nox?: number | null
          total_emissions_sox?: number | null
          total_vessels?: number | null
          upcoming_maintenance?: number | null
        }
        Relationships: []
      }
      mitigations: {
        Row: {
          action: string
          alert_id: string | null
          business_value: string | null
          cost_estimate: string | null
          created_at: string | null
          estimated_impact: string | null
          id: string
          priority: Database["public"]["Enums"]["mitigation_priority"]
          time_to_implement: string | null
        }
        Insert: {
          action: string
          alert_id?: string | null
          business_value?: string | null
          cost_estimate?: string | null
          created_at?: string | null
          estimated_impact?: string | null
          id?: string
          priority: Database["public"]["Enums"]["mitigation_priority"]
          time_to_implement?: string | null
        }
        Update: {
          action?: string
          alert_id?: string | null
          business_value?: string | null
          cost_estimate?: string | null
          created_at?: string | null
          estimated_impact?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["mitigation_priority"]
          time_to_implement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mitigations_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      offshore_assets: {
        Row: {
          ai_anomaly_score: number | null
          ambient_temp_c: number | null
          asset_id: string
          asset_subtype: Database["public"]["Enums"]["asset_subtype"]
          asset_type: Database["public"]["Enums"]["asset_type"]
          compressor_load_pct: number | null
          connect_rssi_dbm: number | null
          created_at: string | null
          das_event_flag: boolean | null
          discharge_pressure_bar: number | null
          dts_temp_anomaly: boolean | null
          health_score: number | null
          id: string
          installed_date: string | null
          last_inspection: string | null
          leak_risk_pct: number | null
          machine_vibration_mm_s: number | null
          maintenance_due_hours: number | null
          name: string
          next_inspection: string | null
          op_mode: Database["public"]["Enums"]["op_mode"] | null
          pipe_flow_kbd: number | null
          pipe_pressure_bar: number | null
          pipe_temp_c: number | null
          position_end_lat: number | null
          position_end_lng: number | null
          position_lat: number
          position_lng: number
          predicted_failure_risk_pct: number | null
          project: string | null
          safety_state: Database["public"]["Enums"]["safety_state"] | null
          sat_latency_ms: number | null
          suction_pressure_bar: number | null
          updated_at: string | null
          water_depth_m: number | null
          wave_height_m: number | null
          wind_speed_kn: number | null
        }
        Insert: {
          ai_anomaly_score?: number | null
          ambient_temp_c?: number | null
          asset_id: string
          asset_subtype: Database["public"]["Enums"]["asset_subtype"]
          asset_type?: Database["public"]["Enums"]["asset_type"]
          compressor_load_pct?: number | null
          connect_rssi_dbm?: number | null
          created_at?: string | null
          das_event_flag?: boolean | null
          discharge_pressure_bar?: number | null
          dts_temp_anomaly?: boolean | null
          health_score?: number | null
          id?: string
          installed_date?: string | null
          last_inspection?: string | null
          leak_risk_pct?: number | null
          machine_vibration_mm_s?: number | null
          maintenance_due_hours?: number | null
          name: string
          next_inspection?: string | null
          op_mode?: Database["public"]["Enums"]["op_mode"] | null
          pipe_flow_kbd?: number | null
          pipe_pressure_bar?: number | null
          pipe_temp_c?: number | null
          position_end_lat?: number | null
          position_end_lng?: number | null
          position_lat: number
          position_lng: number
          predicted_failure_risk_pct?: number | null
          project?: string | null
          safety_state?: Database["public"]["Enums"]["safety_state"] | null
          sat_latency_ms?: number | null
          suction_pressure_bar?: number | null
          updated_at?: string | null
          water_depth_m?: number | null
          wave_height_m?: number | null
          wind_speed_kn?: number | null
        }
        Update: {
          ai_anomaly_score?: number | null
          ambient_temp_c?: number | null
          asset_id?: string
          asset_subtype?: Database["public"]["Enums"]["asset_subtype"]
          asset_type?: Database["public"]["Enums"]["asset_type"]
          compressor_load_pct?: number | null
          connect_rssi_dbm?: number | null
          created_at?: string | null
          das_event_flag?: boolean | null
          discharge_pressure_bar?: number | null
          dts_temp_anomaly?: boolean | null
          health_score?: number | null
          id?: string
          installed_date?: string | null
          last_inspection?: string | null
          leak_risk_pct?: number | null
          machine_vibration_mm_s?: number | null
          maintenance_due_hours?: number | null
          name?: string
          next_inspection?: string | null
          op_mode?: Database["public"]["Enums"]["op_mode"] | null
          pipe_flow_kbd?: number | null
          pipe_pressure_bar?: number | null
          pipe_temp_c?: number | null
          position_end_lat?: number | null
          position_end_lng?: number | null
          position_lat?: number
          position_lng?: number
          predicted_failure_risk_pct?: number | null
          project?: string | null
          safety_state?: Database["public"]["Enums"]["safety_state"] | null
          sat_latency_ms?: number | null
          suction_pressure_bar?: number | null
          updated_at?: string | null
          water_depth_m?: number | null
          wave_height_m?: number | null
          wind_speed_kn?: number | null
        }
        Relationships: []
      }
      position_history: {
        Row: {
          heading: number | null
          id: string
          position_lat: number
          position_lng: number
          speed: number | null
          timestamp: string | null
          vessel_id: string | null
          weather_at_location: Json | null
        }
        Insert: {
          heading?: number | null
          id?: string
          position_lat: number
          position_lng: number
          speed?: number | null
          timestamp?: string | null
          vessel_id?: string | null
          weather_at_location?: Json | null
        }
        Update: {
          heading?: number | null
          id?: string
          position_lat?: number
          position_lng?: number
          speed?: number | null
          timestamp?: string | null
          vessel_id?: string | null
          weather_at_location?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "position_history_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      vessels: {
        Row: {
          breadth: number | null
          call_sign: string | null
          created_at: string | null
          crew_count: number | null
          crew_hours_on_duty: number | null
          crew_safety_score: number | null
          deadweight: number | null
          destination_lat: number | null
          destination_lng: number | null
          destination_port: string | null
          emissions_co2: number | null
          emissions_nox: number | null
          emissions_sox: number | null
          eta: string | null
          flag: string | null
          fuel_consumption: number | null
          fuel_level: number | null
          fuel_type: string | null
          gross_tonnage: number | null
          heading: number | null
          health_score: number | null
          id: string
          imo_number: string | null
          length_overall: number | null
          max_draught: number | null
          mmsi: string | null
          name: string
          position_lat: number
          position_lng: number
          project: string | null
          speed: number | null
          status: Database["public"]["Enums"]["vessel_status"] | null
          type: Database["public"]["Enums"]["vessel_type"]
          updated_at: string | null
          vessel_class: string | null
          year_built: number | null
        }
        Insert: {
          breadth?: number | null
          call_sign?: string | null
          created_at?: string | null
          crew_count?: number | null
          crew_hours_on_duty?: number | null
          crew_safety_score?: number | null
          deadweight?: number | null
          destination_lat?: number | null
          destination_lng?: number | null
          destination_port?: string | null
          emissions_co2?: number | null
          emissions_nox?: number | null
          emissions_sox?: number | null
          eta?: string | null
          flag?: string | null
          fuel_consumption?: number | null
          fuel_level?: number | null
          fuel_type?: string | null
          gross_tonnage?: number | null
          heading?: number | null
          health_score?: number | null
          id?: string
          imo_number?: string | null
          length_overall?: number | null
          max_draught?: number | null
          mmsi?: string | null
          name: string
          position_lat: number
          position_lng: number
          project?: string | null
          speed?: number | null
          status?: Database["public"]["Enums"]["vessel_status"] | null
          type: Database["public"]["Enums"]["vessel_type"]
          updated_at?: string | null
          vessel_class?: string | null
          year_built?: number | null
        }
        Update: {
          breadth?: number | null
          call_sign?: string | null
          created_at?: string | null
          crew_count?: number | null
          crew_hours_on_duty?: number | null
          crew_safety_score?: number | null
          deadweight?: number | null
          destination_lat?: number | null
          destination_lng?: number | null
          destination_port?: string | null
          emissions_co2?: number | null
          emissions_nox?: number | null
          emissions_sox?: number | null
          eta?: string | null
          flag?: string | null
          fuel_consumption?: number | null
          fuel_level?: number | null
          fuel_type?: string | null
          gross_tonnage?: number | null
          heading?: number | null
          health_score?: number | null
          id?: string
          imo_number?: string | null
          length_overall?: number | null
          max_draught?: number | null
          mmsi?: string | null
          name?: string
          position_lat?: number
          position_lng?: number
          project?: string | null
          speed?: number | null
          status?: Database["public"]["Enums"]["vessel_status"] | null
          type?: Database["public"]["Enums"]["vessel_type"]
          updated_at?: string | null
          vessel_class?: string | null
          year_built?: number | null
        }
        Relationships: []
      }
      weather: {
        Row: {
          condition: Database["public"]["Enums"]["weather_condition"] | null
          id: string
          severity: Database["public"]["Enums"]["weather_severity"] | null
          temperature: number | null
          updated_at: string | null
          visibility: number | null
          wave_height: number | null
          wind_direction: number | null
          wind_speed: number | null
        }
        Insert: {
          condition?: Database["public"]["Enums"]["weather_condition"] | null
          id?: string
          severity?: Database["public"]["Enums"]["weather_severity"] | null
          temperature?: number | null
          updated_at?: string | null
          visibility?: number | null
          wave_height?: number | null
          wind_direction?: number | null
          wind_speed?: number | null
        }
        Update: {
          condition?: Database["public"]["Enums"]["weather_condition"] | null
          id?: string
          severity?: Database["public"]["Enums"]["weather_severity"] | null
          temperature?: number | null
          updated_at?: string | null
          visibility?: number | null
          wave_height?: number | null
          wind_direction?: number | null
          wind_speed?: number | null
        }
        Relationships: []
      }
      vessel_datasheets: {
        Row: {
          id: string
          vessel_id: string | null
          vessel_type: string
          vessel_subtype: string
          title: string
          url: string
          published_date: string | null
          author: string | null
          score: number | null
          highlights: string[] | null
          text_content: string | null
          source_domain: string | null
          document_type: string | null
          is_primary: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          vessel_id?: string | null
          vessel_type: string
          vessel_subtype: string
          title: string
          url: string
          published_date?: string | null
          author?: string | null
          score?: number | null
          highlights?: string[] | null
          text_content?: string | null
          source_domain?: string | null
          document_type?: string | null
          is_primary?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          vessel_id?: string | null
          vessel_type?: string
          vessel_subtype?: string
          title?: string
          url?: string
          published_date?: string | null
          author?: string | null
          score?: number | null
          highlights?: string[] | null
          text_content?: string | null
          source_domain?: string | null
          document_type?: string | null
          is_primary?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vessel_datasheets_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      alert_severity: "critical" | "warning" | "info"
      alert_type: "weather" | "equipment" | "fuel" | "safety"
      asset_subtype:
        | "CSD"
        | "Derrick Barge"
        | "Hopper Dredger"
        | "Tug/Support"
        | "Supply Vessel"
        | "Survey Vessel"
        | "Crane Barge"
        | "Subsea Pipeline"
        | "Platform Compressor"
        | "Offshore Platform"
      asset_type: "Vessel" | "OffshoreAsset"
      equipment_type:
        | "engine"
        | "hydraulics"
        | "electrical"
        | "navigation"
        | "crane"
        | "propulsion"
      mitigation_priority: "immediate" | "high" | "medium" | "low"
      op_mode:
        | "TRANSIT"
        | "WORK"
        | "IDLE"
        | "ONLINE"
        | "STANDBY"
        | "MAINT"
        | "STATIC"
      safety_state: "GREEN" | "AMBER" | "RED"
      vessel_status: "operational" | "maintenance" | "idle" | "alert"
      vessel_type:
        | "tugboat"
        | "supply_vessel"
        | "crane_barge"
        | "dredger"
        | "survey_vessel"
      weather_condition: "clear" | "cloudy" | "rain" | "storm" | "fog"
      weather_severity: "normal" | "advisory" | "warning" | "severe"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never
