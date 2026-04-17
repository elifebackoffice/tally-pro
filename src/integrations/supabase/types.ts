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
      companies: {
        Row: {
          address: string | null
          base_currency: string
          books_begin: string
          country: string
          created_at: string
          created_by: string
          email: string | null
          fy_end: string
          fy_start: string
          gstin: string | null
          id: string
          mailing_name: string | null
          name: string
          pan: string | null
          phone: string | null
          pincode: string | null
          state: string
          state_code: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          base_currency?: string
          books_begin?: string
          country?: string
          created_at?: string
          created_by: string
          email?: string | null
          fy_end?: string
          fy_start?: string
          gstin?: string | null
          id?: string
          mailing_name?: string | null
          name: string
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string
          state_code?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          base_currency?: string
          books_begin?: string
          country?: string
          created_at?: string
          created_by?: string
          email?: string | null
          fy_end?: string
          fy_start?: string
          gstin?: string | null
          id?: string
          mailing_name?: string | null
          name?: string
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string
          state_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      godowns: {
        Row: {
          address: string | null
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "godowns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_groups: {
        Row: {
          affects_gross_profit: boolean
          company_id: string
          created_at: string
          id: string
          is_primary: boolean
          name: string
          nature: Database["public"]["Enums"]["group_nature"]
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          affects_gross_profit?: boolean
          company_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          name: string
          nature: Database["public"]["Enums"]["group_nature"]
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          affects_gross_profit?: boolean
          company_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          name?: string
          nature?: Database["public"]["Enums"]["group_nature"]
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_groups_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ledger_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      ledgers: {
        Row: {
          address: string | null
          alias: string | null
          company_id: string
          created_at: string
          email: string | null
          group_id: string
          gstin: string | null
          id: string
          is_revenue: boolean
          name: string
          opening_balance: number
          opening_dr_cr: Database["public"]["Enums"]["entry_type"]
          pan: string | null
          phone: string | null
          state: string | null
          state_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          alias?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          group_id: string
          gstin?: string | null
          id?: string
          is_revenue?: boolean
          name: string
          opening_balance?: number
          opening_dr_cr?: Database["public"]["Enums"]["entry_type"]
          pan?: string | null
          phone?: string | null
          state?: string | null
          state_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          alias?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          group_id?: string
          gstin?: string | null
          id?: string
          is_revenue?: boolean
          name?: string
          opening_balance?: number
          opening_dr_cr?: Database["public"]["Enums"]["entry_type"]
          pan?: string | null
          phone?: string | null
          state?: string | null
          state_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledgers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledgers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ledger_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_groups: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_groups_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "stock_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          alias: string | null
          company_id: string
          created_at: string
          group_id: string | null
          gst_rate: number
          hsn_code: string | null
          id: string
          name: string
          opening_qty: number
          opening_rate: number
          opening_value: number
          standard_rate: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          alias?: string | null
          company_id: string
          created_at?: string
          group_id?: string | null
          gst_rate?: number
          hsn_code?: string | null
          id?: string
          name: string
          opening_qty?: number
          opening_rate?: number
          opening_value?: number
          standard_rate?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          alias?: string | null
          company_id?: string
          created_at?: string
          group_id?: string | null
          gst_rate?: number
          hsn_code?: string | null
          id?: string
          name?: string
          opening_qty?: number
          opening_rate?: number
          opening_value?: number
          standard_rate?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "stock_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "stock_units"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_units: {
        Row: {
          company_id: string
          created_at: string
          decimal_places: number
          formal_name: string | null
          id: string
          symbol: string
        }
        Insert: {
          company_id: string
          created_at?: string
          decimal_places?: number
          formal_name?: string | null
          id?: string
          symbol: string
        }
        Update: {
          company_id?: string
          created_at?: string
          decimal_places?: number
          formal_name?: string | null
          id?: string
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      voucher_entries: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          entry_type: Database["public"]["Enums"]["entry_type"]
          id: string
          ledger_id: string
          line_order: number
          voucher_id: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          entry_type: Database["public"]["Enums"]["entry_type"]
          id?: string
          ledger_id: string
          line_order?: number
          voucher_id: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          entry_type?: Database["public"]["Enums"]["entry_type"]
          id?: string
          ledger_id?: string
          line_order?: number
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_entries_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_entries_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_inventory: {
        Row: {
          amount: number
          cgst_amount: number
          company_id: string
          created_at: string
          discount_pct: number
          godown_id: string | null
          gst_rate: number
          id: string
          igst_amount: number
          line_order: number
          quantity: number
          rate: number
          sgst_amount: number
          stock_item_id: string
          voucher_id: string
        }
        Insert: {
          amount?: number
          cgst_amount?: number
          company_id: string
          created_at?: string
          discount_pct?: number
          godown_id?: string | null
          gst_rate?: number
          id?: string
          igst_amount?: number
          line_order?: number
          quantity?: number
          rate?: number
          sgst_amount?: number
          stock_item_id: string
          voucher_id: string
        }
        Update: {
          amount?: number
          cgst_amount?: number
          company_id?: string
          created_at?: string
          discount_pct?: number
          godown_id?: string | null
          gst_rate?: number
          id?: string
          igst_amount?: number
          line_order?: number
          quantity?: number
          rate?: number
          sgst_amount?: number
          stock_item_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_inventory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_inventory_godown_id_fkey"
            columns: ["godown_id"]
            isOneToOne: false
            referencedRelation: "godowns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_inventory_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_inventory_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          id: string
          is_invoice: boolean
          narration: string | null
          party_ledger_id: string | null
          place_of_supply: string | null
          reference_date: string | null
          reference_no: string | null
          total_amount: number
          updated_at: string
          voucher_date: string
          voucher_no: string
          voucher_type: Database["public"]["Enums"]["voucher_type"]
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          is_invoice?: boolean
          narration?: string | null
          party_ledger_id?: string | null
          place_of_supply?: string | null
          reference_date?: string | null
          reference_no?: string | null
          total_amount?: number
          updated_at?: string
          voucher_date?: string
          voucher_no: string
          voucher_type: Database["public"]["Enums"]["voucher_type"]
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_invoice?: boolean
          narration?: string | null
          party_ledger_id?: string | null
          place_of_supply?: string | null
          reference_date?: string | null
          reference_no?: string | null
          total_amount?: number
          updated_at?: string
          voucher_date?: string
          voucher_no?: string
          voucher_type?: Database["public"]["Enums"]["voucher_type"]
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_party_ledger_id_fkey"
            columns: ["party_ledger_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      company_role: "owner" | "admin" | "accountant" | "viewer"
      entry_type: "debit" | "credit"
      group_nature: "assets" | "liabilities" | "income" | "expenses"
      voucher_type:
        | "sales"
        | "purchase"
        | "receipt"
        | "payment"
        | "contra"
        | "journal"
        | "debit_note"
        | "credit_note"
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
      app_role: ["admin", "user"],
      company_role: ["owner", "admin", "accountant", "viewer"],
      entry_type: ["debit", "credit"],
      group_nature: ["assets", "liabilities", "income", "expenses"],
      voucher_type: [
        "sales",
        "purchase",
        "receipt",
        "payment",
        "contra",
        "journal",
        "debit_note",
        "credit_note",
      ],
    },
  },
} as const
