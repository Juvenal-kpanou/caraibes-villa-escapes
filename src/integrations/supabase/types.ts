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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bank_settings: {
        Row: {
          account_holder: string
          bank_name: string
          bic: string
          iban: string
          id: string
          updated_at: string
        }
        Insert: {
          account_holder?: string
          bank_name?: string
          bic?: string
          iban?: string
          id?: string
          updated_at?: string
        }
        Update: {
          account_holder?: string
          bank_name?: string
          bic?: string
          iban?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      blocked_dates: {
        Row: {
          created_at: string
          date: string
          id: string
          reason: string | null
          villa_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          reason?: string | null
          villa_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          reason?: string | null
          villa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_villa_id_fkey"
            columns: ["villa_id"]
            isOneToOne: false
            referencedRelation: "villas"
            referencedColumns: ["id"]
          },
        ]
      }
      date_overrides: {
        Row: {
          created_at: string
          date: string
          id: string
          villa_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          villa_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          villa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "date_overrides_villa_id_fkey"
            columns: ["villa_id"]
            isOneToOne: false
            referencedRelation: "villas"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          amount_due_now: number
          amount_paid: number
          check_in: string
          check_out: string
          cleaning_fee: number
          confirmed_at: string | null
          created_at: string
          deposit: number
          deposit_required: boolean
          guest_email: string
          guest_name: string
          guest_phone: string
          guests: number
          id: string
          nights: number
          payment_option: string
          price_per_night: number
          price_per_person: number
          reference: string
          refund_bic: string | null
          refund_holder: string | null
          refund_iban: string | null
          refund_processed_at: string | null
          refund_requested_at: string | null
          status: string
          total_amount: number
          villa_id: string
        }
        Insert: {
          amount_due_now?: number
          amount_paid?: number
          check_in: string
          check_out: string
          cleaning_fee: number
          confirmed_at?: string | null
          created_at?: string
          deposit: number
          deposit_required?: boolean
          guest_email: string
          guest_name: string
          guest_phone: string
          guests: number
          id?: string
          nights: number
          payment_option?: string
          price_per_night: number
          price_per_person?: number
          reference: string
          refund_bic?: string | null
          refund_holder?: string | null
          refund_iban?: string | null
          refund_processed_at?: string | null
          refund_requested_at?: string | null
          status?: string
          total_amount: number
          villa_id: string
        }
        Update: {
          amount_due_now?: number
          amount_paid?: number
          check_in?: string
          check_out?: string
          cleaning_fee?: number
          confirmed_at?: string | null
          created_at?: string
          deposit?: number
          deposit_required?: boolean
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          guests?: number
          id?: string
          nights?: number
          payment_option?: string
          price_per_night?: number
          price_per_person?: number
          reference?: string
          refund_bic?: string | null
          refund_holder?: string | null
          refund_iban?: string | null
          refund_processed_at?: string | null
          refund_requested_at?: string | null
          status?: string
          total_amount?: number
          villa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_villa_id_fkey"
            columns: ["villa_id"]
            isOneToOne: false
            referencedRelation: "villas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      villas: {
        Row: {
          amenities: string[]
          bathrooms: number
          bedrooms: number
          beds: number
          capacity: number
          cleaning_fee: number
          created_at: string
          deposit: number
          description: string
          has_pool: boolean
          id: string
          images: string[]
          is_active: boolean
          location: string
          name: string
          parties_allowed: boolean
          price_per_night: number
          price_per_person: number
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          bathrooms?: number
          bedrooms?: number
          beds?: number
          capacity?: number
          cleaning_fee?: number
          created_at?: string
          deposit?: number
          description?: string
          has_pool?: boolean
          id?: string
          images?: string[]
          is_active?: boolean
          location?: string
          name: string
          parties_allowed?: boolean
          price_per_night?: number
          price_per_person?: number
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          bathrooms?: number
          bedrooms?: number
          beds?: number
          capacity?: number
          cleaning_fee?: number
          created_at?: string
          deposit?: number
          description?: string
          has_pool?: boolean
          id?: string
          images?: string[]
          is_active?: boolean
          location?: string
          name?: string
          parties_allowed?: boolean
          price_per_night?: number
          price_per_person?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_unavailable_dates: { Args: { _villa_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "client"],
    },
  },
} as const
