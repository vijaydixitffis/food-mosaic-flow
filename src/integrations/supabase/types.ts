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
          hsn_code: string
          id: string
          name: string
          pack_type: string | null
          remarks: string | null
          sale_price: number | null
          tags: string[] | null
          updated_at: string
          gst: number | null
        }
        Insert: {
          active?: boolean
          client_note?: string | null
          created_at?: string
          description?: string | null
          hsn_code: string
          id?: string
          name: string
          pack_type?: string | null
          remarks?: string | null
          sale_price?: number | null
          tags?: string[] | null
          updated_at?: string
          gst?: number | null
        }
        Update: {
          active?: boolean
          client_note?: string | null
          created_at?: string
          description?: string | null
          hsn_code?: string
          id?: string
          name?: string
          pack_type?: string | null
          remarks?: string | null
          sale_price?: number | null
          tags?: string[] | null
          updated_at?: string
          gst?: number | null
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
      clients: {
        Row: {
          id: string
          client_code: string
          name: string
          office_address: string
          company_registration_number: string
          office_phone_number: string
          contact_person: string
          contact_person_phone_number: string
          gst_number: string
          is_igst: boolean
          is_active: boolean
          discount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_code: string
          name: string
          office_address: string
          company_registration_number: string
          office_phone_number: string
          contact_person: string
          contact_person_phone_number: string
          gst_number: string
          is_igst?: boolean
          is_active?: boolean
          discount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_code?: string
          name?: string
          office_address?: string
          company_registration_number?: string
          office_phone_number?: string
          contact_person?: string
          contact_person_phone_number?: string
          gst_number?: string
          is_igst?: boolean
          is_active?: boolean
          discount?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          id: string
          company_name: string
          company_logo_url: string | null
          registration_number: string | null
          gst_number: string | null
          contact_number: string | null
          qr_code_url: string | null
          address: string | null
          email: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          company_logo_url?: string | null
          registration_number?: string | null
          gst_number?: string | null
          contact_number?: string | null
          qr_code_url?: string | null
          address?: string | null
          email?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          company_logo_url?: string | null
          registration_number?: string | null
          gst_number?: string | null
          contact_number?: string | null
          qr_code_url?: string | null
          address?: string | null
          email?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string;
          order_code: string;
          remarks: string | null;
          order_date: string;
          target_delivery_date: string;
          client_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_code: string;
          remarks?: string | null;
          order_date: string;
          target_delivery_date: string;
          client_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_code?: string;
          remarks?: string | null;
          order_date?: string;
          target_delivery_date?: string;
          client_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      order_products: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          pouch_size: number;
          number_of_pouches: number;
          total_weight: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          pouch_size: number;
          number_of_pouches: number;
          total_weight: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          pouch_size?: number;
          number_of_pouches?: number;
          total_weight?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_products_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
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
