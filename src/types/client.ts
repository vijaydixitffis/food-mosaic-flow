import { Address, AddressType } from './address';

export interface BaseClient {
  id?: string;
  client_code: string;
  name: string;
  registered_office_address_id: string;
  bill_to_address_id?: string | null;
  ship_to_address_id?: string | null;
  gst_number?: string | null;
  is_igst?: boolean;
  company_registration_number?: string | null;
  office_phone_number?: string | null;
  contact_person1_name?: string | null;
  contact_person1_phone?: string | null;
  contact_person2_name?: string | null;
  contact_person2_phone?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface Client extends BaseClient {
  id: string;
  created_at: string;
  updated_at: string;
  // Relationships that will be populated by the API
  registered_office_address?: Address;
  bill_to_address?: Address | null;
  ship_to_address?: Address | null;
}

export interface CreateClientDTO {
  client_code: string;
  name: string;
  registered_office_address: Omit<Address, 'id' | 'created_at' | 'updated_at'>;
  bill_to_address?: Omit<Address, 'id' | 'created_at' | 'updated_at'> | null;
  ship_to_address?: Omit<Address, 'id' | 'created_at' | 'updated_at'> | null;
  gst_number?: string | null;
  is_igst?: boolean;
  company_registration_number?: string | null;
  office_phone_number?: string | null;
  contact_person1_name?: string | null;
  contact_person1_phone?: string | null;
  contact_person2_name?: string | null;
  contact_person2_phone?: string | null;
}

export interface UpdateClientDTO extends Partial<Omit<CreateClientDTO, 'client_code' | 'registered_office_address'>> {
  registered_office_address?: Omit<Address, 'id' | 'created_at' | 'updated_at'>;
}

// For Supabase response types
declare global {
  namespace DB {
    interface Tables {
      clients: {
        Row: {
          id: string;
          client_code: string;
          name: string;
          registered_office_address_id: string;
          bill_to_address_id: string | null;
          ship_to_address_id: string | null;
          gst_number: string | null;
          is_igst: boolean;
          company_registration_number: string | null;
          office_phone_number: string | null;
          contact_person1_name: string | null;
          contact_person1_phone: string | null;
          contact_person2_name: string | null;
          contact_person2_phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: Omit<{
          id?: string;
          client_code: string;
          name: string;
          registered_office_address_id: string;
          bill_to_address_id?: string | null;
          ship_to_address_id?: string | null;
          gst_number?: string | null;
          is_igst?: boolean;
          company_registration_number?: string | null;
          office_phone_number?: string | null;
          contact_person1_name?: string | null;
          contact_person1_phone?: string | null;
          contact_person2_name?: string | null;
          contact_person2_phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        }, 'id' | 'created_at' | 'updated_at'>;
        Update: {
          client_code?: string;
          name?: string;
          registered_office_address_id?: string;
          bill_to_address_id?: string | null;
          ship_to_address_id?: string | null;
          gst_number?: string | null;
          is_igst?: boolean;
          company_registration_number?: string | null;
          office_phone_number?: string | null;
          contact_person1_name?: string | null;
          contact_person1_phone?: string | null;
          contact_person2_name?: string | null;
          contact_person2_phone?: string | null;
          is_active?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
    }
  }
}

export type ClientRow = DB.Tables['clients']['Row'];
export type InsertClient = DB.Tables['clients']['Insert'];
export type UpdateClient = DB.Tables['clients']['Update'];
