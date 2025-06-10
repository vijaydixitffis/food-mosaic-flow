import { createClient } from '@supabase/supabase-js';
import { Client, CreateClientDTO, UpdateClientDTO } from '@/types/client';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Client service for handling client-related operations
 */
export const clientService = {
  /**
   * Fetch all clients with their addresses
   */
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('client_details')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    return data.map(transformClientResponse);
  },

  /**
   * Fetch a single client by ID with addresses
   */
  async getClientById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('client_details')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      console.error(`Error fetching client ${id}:`, error);
      throw error;
    }

    return transformClientResponse(data);
  },

  /**
   * Create a new client with addresses
   */
  async createClient(clientData: CreateClientDTO): Promise<Client> {
    const { data, error } = await supabase.rpc('create_client_with_addresses', {
      client_data: {
        client_code: clientData.client_code,
        name: clientData.name,
        gst_number: clientData.gst_number || null,
        is_igst: clientData.is_igst || false,
        company_registration_number: clientData.company_registration_number || null,
        office_phone_number: clientData.office_phone_number || null,
        contact_person1_name: clientData.contact_person1_name || null,
        contact_person1_phone: clientData.contact_person1_phone || null,
        contact_person2_name: clientData.contact_person2_name || null,
        contact_person2_phone: clientData.contact_person2_phone || null,
      },
      registered_office_address: {
        ...clientData.registered_office_address,
        address_type: 'REGD',
      },
      bill_to_address: clientData.bill_to_address ? {
        ...clientData.bill_to_address,
        address_type: 'BILLTO',
      } : null,
      ship_to_address: clientData.ship_to_address ? {
        ...clientData.ship_to_address,
        address_type: 'SHIPTO',
      } : null,
    });

    if (error) {
      console.error('Error creating client:', error);
      throw error;
    }

    return data as unknown as Client;
  },

  /**
   * Update an existing client with addresses
   */
  async updateClient(id: string, clientData: UpdateClientDTO): Promise<Client> {
    const { data, error } = await supabase.rpc('update_client_with_addresses', {
      client_id: id,
      client_data: {
        name: clientData.name,
        gst_number: clientData.gst_number,
        is_igst: clientData.is_igst,
        company_registration_number: clientData.company_registration_number,
        office_phone_number: clientData.office_phone_number,
        contact_person1_name: clientData.contact_person1_name,
        contact_person1_phone: clientData.contact_person1_phone,
        contact_person2_name: clientData.contact_person2_name,
        contact_person2_phone: clientData.contact_person2_phone,
      },
      registered_office_address: clientData.registered_office_address ? {
        ...clientData.registered_office_address,
        address_type: 'REGD',
      } : null,
      bill_to_address: clientData.bill_to_address ? {
        ...clientData.bill_to_address,
        address_type: 'BILLTO',
      } : null,
      ship_to_address: clientData.ship_to_address ? {
        ...clientData.ship_to_address,
        address_type: 'SHIPTO',
      } : null,
    });

    if (error) {
      console.error(`Error updating client ${id}:`, error);
      throw error;
    }

    return data as unknown as Client;
  },

  /**
   * Soft delete a client by setting is_active to false
   */
  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      console.error(`Error deleting client ${id}:`, error);
      throw error;
    }
  },

  /**
   * Check if a client code is available
   */
  async isClientCodeAvailable(code: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('client_code', code)
      .eq('is_active', true);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error checking client code availability:', error);
      throw error;
    }

    return count === 0;
  },
};

/**
 * Transform the raw database response to Client type
 */
function transformClientResponse(data: any): Client {
  const transformAddress = (prefix: string) => {
    if (!data[`${prefix}_id`]) return null;
    
    return {
      id: data[`${prefix}_id`],
      address_type: data[`${prefix}_address_type`],
      address_line1: data[`${prefix}_address_line1`],
      address_line2: data[`${prefix}_address_line2`],
      landmark: data[`${prefix}_landmark`],
      city: data[`${prefix}_city`],
      state: data[`${prefix}_state`],
      pincode: data[`${prefix}_pincode`],
      created_at: data.created_at, // Using client's timestamps as fallback
      updated_at: data.updated_at,
      created_by: data.created_by,
      updated_by: data.updated_by,
      is_active: true // Assuming address is active if it's being returned
    };
  };

  const registeredOfficeAddress = transformAddress('registered_office_address')!;
  const billToAddress = transformAddress('billing_address');
  const shipToAddress = data.shipping_address_id === data.billing_address_id 
    ? null 
    : transformAddress('shipping_address');

  return {
    id: data.id,
    client_code: data.client_code,
    name: data.name,
    registered_office_address_id: registeredOfficeAddress.id,
    bill_to_address_id: billToAddress?.id || null,
    ship_to_address_id: shipToAddress?.id || billToAddress?.id || null,
    gst_number: data.gst_number,
    is_igst: data.is_igst,
    company_registration_number: data.company_registration_number,
    office_phone_number: data.office_phone_number,
    contact_person1_name: data.contact_person1_name,
    contact_person1_phone: data.contact_person1_phone,
    contact_person2_name: data.contact_person2_name,
    contact_person2_phone: data.contact_person2_phone,
    is_active: data.is_active,
    created_at: data.created_at,
    updated_at: data.updated_at,
    created_by: data.created_by,
    updated_by: data.updated_by,
    registered_office_address: registeredOfficeAddress,
    bill_to_address: billToAddress,
    ship_to_address: shipToAddress,
  };
}
