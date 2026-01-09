export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          hsn_code: string | null
          sale_price: number | null
          gst: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          hsn_code?: string | null
          sale_price?: number | null
          gst?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          hsn_code?: string | null
          sale_price?: number | null
          gst?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          category_code: string
          category_name: string
          sequence: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_code: string
          category_name: string
          sequence?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_code?: string
          category_name?: string
          sequence?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_prices: {
        Row: {
          id: string
          product_id: string
          category_id: string
          sale_price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          category_id: string
          sale_price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          category_id?: string
          sale_price?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          id: string
          name: string
          description: string | null
          unit_of_measurement: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          unit_of_measurement?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          unit_of_measurement?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      compounds: {
        Row: {
          id: string
          name: string
          description: string | null
          unit_of_measurement: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          unit_of_measurement?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          unit_of_measurement?: string | null
          created_at?: string
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
          company_registration_number: string | null
          office_phone_number: string | null
          contact_person: string | null
          contact_person_phone_number: string
          gst_number: string | null
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
          company_registration_number?: string | null
          office_phone_number?: string | null
          contact_person?: string | null
          contact_person_phone_number: string
          gst_number?: string | null
          is_igst?: boolean
          is_active?: boolean
          discount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_code?: string
          name?: string
          office_address?: string
          company_registration_number?: string | null
          office_phone_number?: string | null
          contact_person?: string | null
          contact_person_phone_number?: string
          gst_number?: string | null
          is_igst?: boolean
          is_active?: boolean
          discount?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          order_code: string
          remarks: string | null
          order_date: string
          target_delivery_date: string
          client_id: string
          category_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_code: string
          remarks?: string | null
          order_date: string
          target_delivery_date: string
          client_id: string
          category_id: string
          status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_code?: string
          remarks?: string | null
          order_date?: string
          target_delivery_date?: string
          client_id?: string
          category_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_products: {
        Row: {
          id: string
          order_id: string
          product_id: string
          pouch_size: number
          number_of_pouches: number
          total_weight: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          pouch_size: number
          number_of_pouches: number
          total_weight: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          pouch_size?: number
          number_of_pouches?: number
          total_weight?: number
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
          updated_at?: string
        }
        Relationships: []
      }
      company_params: {
        Row: {
          id: string
          key: string
          value: string | null
          flag: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: string | null
          flag?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string | null
          flag?: boolean
          updated_at?: string
        }
        Relationships: []
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