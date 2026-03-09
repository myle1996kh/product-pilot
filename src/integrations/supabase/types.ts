export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agent_runs: {
        Row: {
          agent_type: string
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          model_used: string | null
          output_hash: string | null
          project_id: string
          prompt_hash: string | null
          status: string
          user_id: string
        }
        Insert: {
          agent_type: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          model_used?: string | null
          output_hash?: string | null
          project_id: string
          prompt_hash?: string | null
          status?: string
          user_id: string
        }
        Update: {
          agent_type?: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          model_used?: string | null
          output_hash?: string | null
          project_id?: string
          prompt_hash?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_provider_settings: {
        Row: {
          api_endpoint: string | null
          api_key_encrypted: string | null
          created_at: string
          default_model: string | null
          id: string
          is_active: boolean | null
          provider_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          created_at?: string
          default_model?: string | null
          id?: string
          is_active?: boolean | null
          provider_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          created_at?: string
          default_model?: string | null
          id?: string
          is_active?: boolean | null
          provider_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      artifact_sections: {
        Row: {
          artifact_id: string
          confidence: number | null
          content: string
          created_at: string
          id: string
          is_locked: boolean | null
          section_order: number
          source_refs: Json | null
          status: Database["public"]["Enums"]["section_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artifact_id: string
          confidence?: number | null
          content?: string
          created_at?: string
          id?: string
          is_locked?: boolean | null
          section_order?: number
          source_refs?: Json | null
          status?: Database["public"]["Enums"]["section_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          artifact_id?: string
          confidence?: number | null
          content?: string
          created_at?: string
          id?: string
          is_locked?: boolean | null
          section_order?: number
          source_refs?: Json | null
          status?: Database["public"]["Enums"]["section_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifact_sections_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
        ]
      }
      artifacts: {
        Row: {
          artifact_type: Database["public"]["Enums"]["artifact_type"]
          created_at: string
          id: string
          project_id: string
          user_id: string
          version: number
        }
        Insert: {
          artifact_type: Database["public"]["Enums"]["artifact_type"]
          created_at?: string
          id?: string
          project_id: string
          user_id: string
          version?: number
        }
        Update: {
          artifact_type?: Database["public"]["Enums"]["artifact_type"]
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          content: string
          created_at: string
          extracted_fields: Json | null
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          extracted_fields?: Json | null
          id?: string
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          extracted_fields?: Json | null
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          preferred_language: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_language?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_language?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget_range: string | null
          constraints: string | null
          created_at: string
          current_version: number | null
          desired_outcome: string | null
          id: string
          name: string
          problem_statement: string | null
          readiness_details: Json | null
          readiness_score: number | null
          status: Database["public"]["Enums"]["project_status"]
          target_users: string | null
          timeline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_range?: string | null
          constraints?: string | null
          created_at?: string
          current_version?: number | null
          desired_outcome?: string | null
          id?: string
          name: string
          problem_statement?: string | null
          readiness_details?: Json | null
          readiness_score?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          target_users?: string | null
          timeline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_range?: string | null
          constraints?: string | null
          created_at?: string
          current_version?: number | null
          desired_outcome?: string | null
          id?: string
          name?: string
          problem_statement?: string | null
          readiness_details?: Json | null
          readiness_score?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          target_users?: string | null
          timeline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      section_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          section_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          section_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          section_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_comments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "artifact_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      version_snapshots: {
        Row: {
          change_summary: string | null
          created_at: string
          id: string
          project_id: string
          snapshot_data: Json
          user_id: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          created_at?: string
          id?: string
          project_id: string
          snapshot_data: Json
          user_id: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          created_at?: string
          id?: string
          project_id?: string
          snapshot_data?: Json
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "version_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
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
      artifact_type:
        | "idea_brief"
        | "research_summary"
        | "business_model"
        | "proposal"
        | "prd"
        | "architecture"
        | "execution_plan"
        | "lovable_handoff"
        | "intro_deck"
      project_status:
        | "draft"
        | "discussing"
        | "ready_to_generate"
        | "generating"
        | "in_review"
        | "approved"
        | "exported"
      section_status: "draft" | "needs_review" | "approved" | "locked"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      artifact_type: [
        "idea_brief",
        "research_summary",
        "business_model",
        "proposal",
        "prd",
        "architecture",
        "execution_plan",
        "lovable_handoff",
        "intro_deck",
      ],
      project_status: [
        "draft",
        "discussing",
        "ready_to_generate",
        "generating",
        "in_review",
        "approved",
        "exported",
      ],
      section_status: ["draft", "needs_review", "approved", "locked"],
    },
  },
} as const
