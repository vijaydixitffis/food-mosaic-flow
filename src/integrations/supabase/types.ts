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
      addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          address_type: Database["public"]["Enums"]["address_type"]
          city: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          landmark: string | null
          pincode: string
          state: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          address_type: Database["public"]["Enums"]["address_type"]
          city: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          landmark?: string | null
          pincode: string
          state: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          address_type?: Database["public"]["Enums"]["address_type"]
          city?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          landmark?: string | null
          pincode?: string
          state?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          bill_to_address_id: string | null
          client_code: string
          company_registration_number: string | null
          contact_person1_name: string | null
          contact_person1_phone: string | null
          contact_person2_name: string | null
          contact_person2_phone: string | null
          created_at: string | null
          created_by: string | null
          gst_number: string | null
          id: string
          is_active: boolean | null
          is_igst: boolean | null
          name: string
          office_phone_number: string | null
          registered_office_address_id: string
          ship_to_address_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          bill_to_address_id?: string | null
          client_code: string
          company_registration_number?: string | null
          contact_person1_name?: string | null
          contact_person1_phone?: string | null
          contact_person2_name?: string | null
          contact_person2_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          is_igst?: boolean | null
          name: string
          office_phone_number?: string | null
          registered_office_address_id: string
          ship_to_address_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          bill_to_address_id?: string | null
          client_code?: string
          company_registration_number?: string | null
          contact_person1_name?: string | null
          contact_person1_phone?: string | null
          contact_person2_name?: string | null
          contact_person2_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          is_igst?: boolean | null
          name?: string
          office_phone_number?: string | null
          registered_office_address_id?: string
          ship_to_address_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_bill_to_address"
            columns: ["bill_to_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bill_to_address"
            columns: ["bill_to_address_id"]
            isOneToOne: false
            referencedRelation: "client_details"
            referencedColumns: ["billing_address_id"]
          },
          {
            foreignKeyName: "fk_bill_to_address"
            columns: ["bill_to_address_id"]
            isOneToOne: false
            referencedRelation: "client_details"
            referencedColumns: ["registered_office_address_id"]
          },
          {
            foreignKeyName: "fk_bill_to_address"
            columns: ["bill_to_address_id"]
            isOneToOne: false
            referencedRelation: "client_details"
            referencedColumns: ["shipping_address_id"]
          },
          {
            foreignKeyName: "fk_registered_office_address"
            columns: ["registered_office_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_registered_office_address"
            columns: ["registered_office_address_id"]
            isOneToOne: false
            referencedRelation: "client_details"
            referencedColumns: ["billing_address_id"]
          },
          {
            foreignKeyName: "fk_registered_office_address"
            columns: ["registered_office_address_id"]
            isOneToOne: false
            referencedRelation: "client_details"
            referencedColumns: ["registered_office_address_id"]
          },
          {
            foreignKeyName: "fk_registered_office_address"
            columns: ["registered_office_address_id"]
            isOneToOne: false
            referencedRelation: "client_details"
            referencedColumns: ["shipping_address_id"]
          },
          {
            foreignKeyName: "fk_ship_to_address"
            columns: ["ship_to_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ship_to_address"
            columns: ["ship_to_address_id"]
            isOneToOne: false
            referencedRelation: "client_details"
            referencedColumns: ["billing_address_id"]
          },
          {
            foreignKeyName: "fk_ship_to_address"
            columns: ["ship_to_address_id"]
            isOneToOne: false
            referencedRelation: "client_details"
            referencedColumns: ["registered_office_address_id"]
          },
          {
            foreignKeyName: "fk_ship_to_address"
            columns: ["ship_to_address_id"]
            isOneToOne: false
            referencedRelation: "client_details"
            referencedColumns: ["shipping_address_id"]
          },
        ]
      }
      compound_ingredients: {
        Row: {
          compound_id: string
          created_at: string
          id: string
          ingredient_id: string
          quantity: number
        }
        Insert: {
          compound_id: string
          created_at?: string
          id?: string
          ingredient_id: string
          quantity?: number
        }
        Update: {
          compound_id?: string
          created_at?: string
          id?: string
          ingredient_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "compound_ingredients_compound_id_fkey"
            columns: ["compound_id"]
            isOneToOne: false
            referencedRelation: "compounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compound_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      compounds: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          tags: string[] | null
          unit_of_measurement: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tags?: string[] | null
          unit_of_measurement?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tags?: string[] | null
          unit_of_measurement?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          name: string
          rate: number | null
          short_description: string | null
          tags: string[] | null
          unit_of_measurement: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          name: string
          rate?: number | null
          short_description?: string | null
          tags?: string[] | null
          unit_of_measurement?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string
          rate?: number | null
          short_description?: string | null
          tags?: string[] | null
          unit_of_measurement?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_compounds: {
        Row: {
          compound_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          compound_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
        }
        Update: {
          compound_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_compounds_compound_id_fkey"
            columns: ["compound_id"]
            isOneToOne: false
            referencedRelation: "compounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_compounds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          product_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          client_note: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          pack_type: string | null
          remarks: string | null
          sale_price: number | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          client_note?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          pack_type?: string | null
          remarks?: string | null
          sale_price?: number | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          client_note?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          pack_type?: string | null
          remarks?: string | null
          sale_price?: number | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          username: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      recipe_compounds: {
        Row: {
          compound_id: string
          created_at: string
          id: string
          recipe_id: string
        }
        Insert: {
          compound_id: string
          created_at?: string
          id?: string
          recipe_id: string
        }
        Update: {
          compound_id?: string
          created_at?: string
          id?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_compounds_compound_id_fkey"
            columns: ["compound_id"]
            isOneToOne: false
            referencedRelation: "compounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_compounds_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_instructions: {
        Row: {
          created_at: string
          id: string
          instruction_text: string
          recipe_id: string
          sequence_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          instruction_text: string
          recipe_id: string
          sequence_number: number
        }
        Update: {
          created_at?: string
          id?: string
          instruction_text?: string
          recipe_id?: string
          sequence_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_instructions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_products: {
        Row: {
          created_at: string
          id: string
          product_id: string
          recipe_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          recipe_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_products_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          password: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          password: string
          role: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          password?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      work_order_products: {
        Row: {
          created_at: string
          id: string
          number_of_pouches: number
          pouch_size: number
          product_id: string
          total_weight: number
          work_order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          number_of_pouches: number
          pouch_size: number
          product_id: string
          total_weight: number
          work_order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          number_of_pouches?: number
          pouch_size?: number
          product_id?: string
          total_weight?: number
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_products_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          remarks: string | null
          status: Database["public"]["Enums"]["work_order_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          remarks?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          remarks?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      client_details: {
        Row: {
          billing_address_id: string | null
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_address_type:
            | Database["public"]["Enums"]["address_type"]
            | null
          billing_city: string | null
          billing_landmark: string | null
          billing_pincode: string | null
          billing_state: string | null
          client_code: string | null
          company_registration_number: string | null
          contact_person1_name: string | null
          contact_person1_phone: string | null
          contact_person2_name: string | null
          contact_person2_phone: string | null
          created_at: string | null
          created_by: string | null
          gst_number: string | null
          id: string | null
          is_active: boolean | null
          is_igst: boolean | null
          name: string | null
          office_phone_number: string | null
          registered_office_address_id: string | null
          registered_office_address_line1: string | null
          registered_office_address_line2: string | null
          registered_office_address_type:
            | Database["public"]["Enums"]["address_type"]
            | null
          registered_office_city: string | null
          registered_office_landmark: string | null
          registered_office_pincode: string | null
          registered_office_state: string | null
          shipping_address_id: string | null
          shipping_address_line1: string | null
          shipping_address_line2: string | null
          shipping_address_type:
            | Database["public"]["Enums"]["address_type"]
            | null
          shipping_city: string | null
          shipping_landmark: string | null
          shipping_pincode: string | null
          shipping_state: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_client_with_addresses: {
        Args: {
          client_data: Json
          registered_office_address: Json
          bill_to_address?: Json
          ship_to_address?: Json
        }
        Returns: Json
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: boolean
      }
      update_client_with_addresses: {
        Args: {
          client_id: string
          client_data: Json
          registered_office_address?: Json
          bill_to_address?: Json
          ship_to_address?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      address_type:
        | "SHIPTO"
        | "BILLTO"
        | "REGD"
        | "COMM"
        | "BRANCH"
        | "PERSONAL"
        | "OTHER"
      user_role: "admin" | "staff"
      work_order_status:
        | "CREATED"
        | "PROCURED"
        | "IN-STOCK"
        | "PROCESSED"
        | "SHIPPED"
        | "EXECUTED"
        | "COMPLETE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      address_type: [
        "SHIPTO",
        "BILLTO",
        "REGD",
        "COMM",
        "BRANCH",
        "PERSONAL",
        "OTHER",
      ],
      user_role: ["admin", "staff"],
      work_order_status: [
        "CREATED",
        "PROCURED",
        "IN-STOCK",
        "PROCESSED",
        "SHIPPED",
        "EXECUTED",
        "COMPLETE",
      ],
    },
  },
} as const
