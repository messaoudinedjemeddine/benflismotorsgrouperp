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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accessories: {
        Row: {
          created_at: string
          id: string
          name: string
          price_ht: number
          price_ttc: number | null
          reference: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price_ht: number
          price_ttc?: number | null
          reference: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price_ht?: number
          price_ttc?: number | null
          reference?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_resellers: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          reseller_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          reseller_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          reseller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_resellers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promo_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_resellers_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          brand: string
          client_id: string
          created_at: string
          id: string
          model: string
          updated_at: string
          vin: string | null
        }
        Insert: {
          brand: string
          client_id: string
          created_at?: string
          id?: string
          model: string
          updated_at?: string
          vin?: string | null
        }
        Update: {
          brand?: string
          client_id?: string
          created_at?: string
          id?: string
          model?: string
          updated_at?: string
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_visits: {
        Row: {
          car_id: string
          category: Database["public"]["Enums"]["visit_category"]
          client_id: string
          created_at: string
          id: string
          last_visit_date: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          car_id: string
          category: Database["public"]["Enums"]["visit_category"]
          client_id: string
          created_at?: string
          id?: string
          last_visit_date: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          car_id?: string
          category?: Database["public"]["Enums"]["visit_category"]
          client_id?: string
          created_at?: string
          id?: string
          last_visit_date?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_visits_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_visits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_pieces: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          quantity: number
          reference: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          quantity?: number
          reference: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          quantity?: number
          reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_pieces_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "parts_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_orders: {
        Row: {
          car_id: string
          client_id: string
          created_at: string
          employee_id: string
          id: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          car_id: string
          client_id: string
          created_at?: string
          employee_id: string
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          car_id?: string
          client_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_orders_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_campaigns: {
        Row: {
          campaign_name: string
          communication_type: Database["public"]["Enums"]["communication_type"]
          created_at: string
          employee_id: string
          excel_file_url: string
          id: string
          predefined_message: string | null
        }
        Insert: {
          campaign_name: string
          communication_type: Database["public"]["Enums"]["communication_type"]
          created_at?: string
          employee_id: string
          excel_file_url: string
          id?: string
          predefined_message?: string | null
        }
        Update: {
          campaign_name?: string
          communication_type?: Database["public"]["Enums"]["communication_type"]
          created_at?: string
          employee_id?: string
          excel_file_url?: string
          id?: string
          predefined_message?: string | null
        }
        Relationships: []
      }
      repair_images: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_data: string | null
          image_url: string | null
          repair_order_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_data?: string | null
          image_url?: string | null
          repair_order_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_data?: string | null
          image_url?: string | null
          repair_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_images_repair_order_id_fkey"
            columns: ["repair_order_id"]
            isOneToOne: false
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_orders: {
        Row: {
          car_id: string
          client_id: string
          created_at: string
          creator_employee_id: string
          damage_description: string | null
          id: string
          pricer_employee_id: string | null
          repair_price: number | null
          status: Database["public"]["Enums"]["repair_status"]
          updated_at: string
        }
        Insert: {
          car_id: string
          client_id: string
          created_at?: string
          creator_employee_id: string
          damage_description?: string | null
          id?: string
          pricer_employee_id?: string | null
          repair_price?: number | null
          status?: Database["public"]["Enums"]["repair_status"]
          updated_at?: string
        }
        Update: {
          car_id?: string
          client_id?: string
          created_at?: string
          creator_employee_id?: string
          damage_description?: string | null
          id?: string
          pricer_employee_id?: string | null
          repair_price?: number | null
          status?: Database["public"]["Enums"]["repair_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_orders_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      resellers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          phone_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          description: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      vn_order_accessories: {
        Row: {
          accessory_id: string
          created_at: string
          created_by: string | null
          id: string
          order_id: string
          quantity: number
        }
        Insert: {
          accessory_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          order_id: string
          quantity?: number
        }
        Update: {
          accessory_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          order_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "vn_order_accessories_accessory_id_fkey"
            columns: ["accessory_id"]
            isOneToOne: false
            referencedRelation: "accessories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vn_order_accessories_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vn_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      vn_order_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: Database["public"]["Enums"]["vn_document_type"]
          document_url: string
          id: string
          order_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type: Database["public"]["Enums"]["vn_document_type"]
          document_url: string
          id?: string
          order_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: Database["public"]["Enums"]["vn_document_type"]
          document_url?: string
          id?: string
          order_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vn_order_documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vn_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      vn_order_history: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          order_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          order_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          order_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vn_order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vn_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      vn_orders: {
        Row: {
          advance_payment: number
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_email: string | null
          customer_id_number: string | null
          customer_name: string
          customer_phone: string
          id: string
          invoice_number: string | null
          location: Database["public"]["Enums"]["vn_order_location"]
          order_number: string
          payment_status: string | null
          remaining_balance: number | null
          stage_completion_dates: Json | null
          status: Database["public"]["Enums"]["vn_order_status"]
          total_price: number
          trop_percu: number | null
          updated_at: string
          vehicle_avaries: string | null
          vehicle_brand: string
          vehicle_color: string | null
          vehicle_features: string[] | null
          vehicle_model: string
          vehicle_vin: string | null
          vehicle_year: number | null
        }
        Insert: {
          advance_payment?: number
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_id_number?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          invoice_number?: string | null
          location?: Database["public"]["Enums"]["vn_order_location"]
          order_number: string
          payment_status?: string | null
          remaining_balance?: number | null
          stage_completion_dates?: Json | null
          status?: Database["public"]["Enums"]["vn_order_status"]
          total_price?: number
          trop_percu?: number | null
          updated_at?: string
          vehicle_avaries?: string | null
          vehicle_brand: string
          vehicle_color?: string | null
          vehicle_features?: string[] | null
          vehicle_model: string
          vehicle_vin?: string | null
          vehicle_year?: number | null
        }
        Update: {
          advance_payment?: number
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_id_number?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          invoice_number?: string | null
          location?: Database["public"]["Enums"]["vn_order_location"]
          order_number?: string
          payment_status?: string | null
          remaining_balance?: number | null
          stage_completion_dates?: Json | null
          status?: Database["public"]["Enums"]["vn_order_status"]
          total_price?: number
          trop_percu?: number | null
          updated_at?: string
          vehicle_avaries?: string | null
          vehicle_brand?: string
          vehicle_color?: string | null
          vehicle_features?: string[] | null
          vehicle_model?: string
          vehicle_vin?: string | null
          vehicle_year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_admin_user: {
        Args: {
          admin_email: string
          admin_full_name: string
          admin_password: string
        }
        Returns: string
      }
      generate_vn_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "sys_admin"
        | "director"
        | "cdv"
        | "commercial"
        | "magasin"
        | "apv"
        | "ged"
        | "adv"
        | "livraison"
        | "immatriculation"
      communication_type: "email" | "whatsapp" | "both"
      order_status: "ready" | "not_ready" | "canceled"
      repair_status: "price_set" | "price_not_set"
      visit_category:
        | "less_than_month"
        | "one_to_three_months"
        | "three_to_six_months"
        | "six_months_to_year"
        | "more_than_year"
      vn_document_type:
        | "PROFORMA_INVOICE"
        | "CUSTOMER_ID"
        | "PURCHASE_ORDER"
        | "DELIVERY_NOTE"
        | "FINAL_INVOICE"
        | "OTHER"
      vn_order_location: "PARC1" | "PARC2" | "SHOWROOM"
      vn_order_status:
        | "INSCRIPTION"
        | "PROFORMA"
        | "COMMANDE"
        | "VALIDATION"
        | "ACCUSÉ"
        | "FACTURATION"
        | "ARRIVAGE"
        | "CARTE_JAUNE"
        | "LIVRAISON"
        | "DOSSIER_DAIRA"
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
      app_role: [
        "sys_admin",
        "director",
        "cdv",
        "commercial",
        "magasin",
        "apv",
        "ged",
        "adv",
        "livraison",
        "immatriculation",
      ],
      communication_type: ["email", "whatsapp", "both"],
      order_status: ["ready", "not_ready", "canceled"],
      repair_status: ["price_set", "price_not_set"],
      visit_category: [
        "less_than_month",
        "one_to_three_months",
        "three_to_six_months",
        "six_months_to_year",
        "more_than_year",
      ],
      vn_document_type: [
        "PROFORMA_INVOICE",
        "CUSTOMER_ID",
        "PURCHASE_ORDER",
        "DELIVERY_NOTE",
        "FINAL_INVOICE",
        "OTHER",
      ],
      vn_order_location: ["PARC1", "PARC2", "SHOWROOM"],
      vn_order_status: [
        "INSCRIPTION",
        "PROFORMA",
        "COMMANDE",
        "VALIDATION",
        "ACCUSÉ",
        "FACTURATION",
        "ARRIVAGE",
        "CARTE_JAUNE",
        "LIVRAISON",
        "DOSSIER_DAIRA",
      ],
    },
  },
} as const
