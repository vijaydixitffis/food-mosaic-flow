export type AddressType = 'SHIPTO' | 'BILLTO' | 'REGD' | 'COMM' | 'BRANCH' | 'PERSONAL' | 'OTHER';

export interface BaseAddress {
  id?: string;
  address_type: AddressType;
  address_line1: string;
  address_line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface Address extends BaseAddress {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressDTO extends Omit<BaseAddress, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'> {}

export interface UpdateAddressDTO extends Partial<Omit<BaseAddress, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>> {}

// For Supabase response types
export interface Tables {
  addresses: {
    Row: {
      id: string;
      address_type: AddressType;
      address_line1: string;
      address_line2: string | null;
      landmark: string | null;
      city: string;
      state: string;
      pincode: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      created_by: string | null;
      updated_by: string | null;
    };
    Insert: Omit<{
      id?: string;
      address_type: AddressType;
      address_line1: string;
      address_line2?: string | null;
      landmark?: string | null;
      city: string;
      state: string;
      pincode: string;
      is_active?: boolean;
      created_at?: string;
      updated_at?: string;
      created_by?: string | null;
      updated_by?: string | null;
    }, 'id' | 'created_at' | 'updated_at'>;
    Update: {
      address_type?: AddressType;
      address_line1?: string;
      address_line2?: string | null;
      landmark?: string | null;
      city?: string;
      state?: string;
      pincode?: string;
      is_active?: boolean;
      updated_at?: string;
      updated_by?: string | null;
    };
  };
}

export type AddressRow = Tables['addresses']['Row'];
export type InsertAddress = Tables['addresses']['Insert'];
export type UpdateAddress = Tables['addresses']['Update'];
