export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      diagnosis_symptom_catalogs: {
        Row: {
          id: string
          diagnosis: string
          symptom_catalog: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          diagnosis: string
          symptom_catalog: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          diagnosis?: string
          symptom_catalog?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      feeling_captures: {
        Row: {
          id: string
          profile_id: string
          global_feeling: "bad" | "ok" | "good" | "excellent"
          capture_date: string
          capture_time: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          global_feeling: "bad" | "ok" | "good" | "excellent"
          capture_date: string
          capture_time: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          global_feeling?: "bad" | "ok" | "good" | "excellent"
          capture_date?: string
          capture_time?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeling_captures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      captured_symptoms: {
        Row: {
          id: string
          feeling_capture_id: string
          symptom_name: string
          symptom_intensity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          feeling_capture_id: string
          symptom_name: string
          symptom_intensity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          feeling_capture_id?: string
          symptom_name?: string
          symptom_intensity?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "captured_symptoms_feeling_capture_id_fkey"
            columns: ["feeling_capture_id"]
            isOneToOne: false
            referencedRelation: "feeling_captures"
            referencedColumns: ["id"]
          }
        ]
      }
  
      consumptions: {
        Row: {
          id: string
          profile_id: string
          consumption_time: string
          consumption_date: string
          consumption_type: string | null
          consumption: string | null
          prep_mode: string | null
          after_effects: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          consumption_time: string
          consumption_date: string
          consumption_type?: string | null
          consumption?: string | null
          prep_mode?: string | null
          after_effects?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          consumption_time?: string
          consumption_date?: string
          consumption_type?: string | null
          consumption?: string | null
          prep_mode?: string | null
          after_effects?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      
      meals: {
        Row: {
          cooking_method: string
          created_at: string
          foods: string
          id: string
          meal_date: string
          meal_time: string
          profile_id: string
          symptoms_after: string | null
          updated_at: string
        }
        Insert: {
          cooking_method: string
          created_at?: string
          foods: string
          id?: string
          meal_date: string
          meal_time: string
          profile_id: string
          symptoms_after?: string | null
          updated_at?: string
        }
        Update: {
          cooking_method?: string
          created_at?: string
          foods?: string
          id?: string
          meal_date?: string
          meal_time?: string
          profile_id?: string
          symptoms_after?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          diagnosis: string
          gender: "male" | "female" | null
          id: string
          is_profile_complete: boolean | null
          last_calprotectin_date: string | null
          last_calprotectin_value: number | null
          name: string
          rectocolite_signature: string | null
          updated_at: string
          user_id: string
          symptom_catalog: Json | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          diagnosis: string
          gender?: "male" | "female" | null
          id?: string
          is_profile_complete?: boolean | null
          last_calprotectin_date?: string | null
          last_calprotectin_value?: number | null
          name: string
          rectocolite_signature?: string | null
          updated_at?: string
          user_id: string
          symptom_catalog?: Json | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          diagnosis?: string
          gender?: "male" | "female" | null
          id?: string
          is_profile_complete?: boolean | null
          last_calprotectin_date?: string | null
          last_calprotectin_value?: number | null
          name?: string
          rectocolite_signature?: string | null
          updated_at?: string
          user_id?: string
          symptom_catalog?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      stools: {
        Row: {
          consistency: number
          created_at: string
          id: string
          profile_id: string
          stool_date: string
          stool_time: string
          updated_at: string
          urgence: number
          blood_level: string | null
          mucus_level: string | null
          stool_color: string | null
          evacuation_effort: string | null
          duration_minutes: number | null
          pain_level: number | null
          notes: string | null
        }
        Insert: {
          consistency: number
          created_at?: string
          id?: string
          profile_id: string
          stool_date: string
          stool_time: string
          updated_at?: string
          urgence?: number
          blood_level?: string | null
          mucus_level?: string | null
          stool_color?: string | null
          evacuation_effort?: string | null
          duration_minutes?: number | null
          pain_level?: number | null
          notes?: string | null
        }
        Update: {
          consistency?: number
          created_at?: string
          id?: string
          profile_id?: string
          stool_date?: string
          stool_time?: string
          updated_at?: string
          urgence?: number
          blood_level?: string | null
          mucus_level?: string | null
          stool_color?: string | null
          evacuation_effort?: string | null
          duration_minutes?: number | null
          pain_level?: number | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stools_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      // OLD SYMPTOMS TABLE - TO BE TEMPORARILY KEPT FOR MIGRATION
      symptoms: {
        Row: {
          abdominal_pain: number | null
          bloating: number | null
          created_at: string
          fatigue: number | null
          global_feeling: string | null
          id: string
          joint_pain: number | null
          other: string | null
          profile_id: string
          stress: number | null
          symptom_date: string
          symptom_time: string
          updated_at: string
        }
        Insert: {
          abdominal_pain?: number | null
          bloating?: number | null
          created_at?: string
          fatigue?: number | null
          global_feeling?: string | null
          id?: string
          joint_pain?: number | null
          other?: string | null
          profile_id: string
          stress?: number | null
          symptom_date: string
          symptom_time: string
          updated_at?: string
        }
        Update: {
          abdominal_pain?: number | null
          bloating?: number | null
          created_at?: string
          fatigue?: number | null
          global_feeling?: string | null
          id?: string
          joint_pain?: number | null
          other?: string | null
          profile_id?: string
          stress?: number | null
          symptom_date?: string
          symptom_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "symptoms_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      treatments: {
        Row: {
          created_at: string
          dosage: string | null
          end_date: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          name: string
          profile_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          profile_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          profile_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
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
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
