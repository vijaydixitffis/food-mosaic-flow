import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ClientsTable } from './ClientsTable';
import { ClientDialog } from './ClientDialog';
import { ClientsPagination } from './ClientsPagination';
import type { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];

const DEFAULT_PAGE_SIZE = 10;

export function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { toast } = useToast();
  const { isStaff, isAdmin, user, profile } = useAuth();
  const queryClient = useQueryClient();

  console.log('ClientsPage - Auth Debug:', {
    user: user?.id,
    profile: profile?.role,
    isStaff,
    isAdmin,
    userEmail: user?.email
  });

  // Fetch clients with pagination
  const { data: clientsData, isLoading, error } = useQuery({
    queryKey: ['clients', searchTerm, currentPage, pageSize],
    queryFn: async () => {
      console.log('ClientsPage - Starting query with auth state:', {
        userId: user?.id,
        userRole: profile?.role,
        isAuthenticated: !!user
      });

      try {
        let query = supabase
          .from('clients')
          .select('*')
          .order('name', { ascending: true });

        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,client_code.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%`);
        }

        console.log('ClientsPage - About to execute count query');
        
        // Get total count for pagination
        let countQuery = supabase
          .from('clients')
          .select('*', { count: 'exact', head: true });

        if (searchTerm) {
          countQuery = countQuery.or(`name.ilike.%${searchTerm}%,client_code.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%`);
        }

        const { count, error: countError } = await countQuery;

        if (countError) {
          console.error('ClientsPage - Count query error:', {
            error: countError,
            message: countError.message,
            details: countError.details,
            hint: countError.hint,
            code: countError.code
          });
          throw countError;
        }

        console.log('ClientsPage - Count query successful, count:', count);
        console.log('ClientsPage - About to execute data query with pagination');

        // Get paginated results
        const { data, error } = await query
          .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

        if (error) {
          console.error('ClientsPage - Data query error:', {
            error: error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        console.log('ClientsPage - Data query successful:', {
          dataLength: data?.length,
          totalCount: count,
          sampleData: data?.[0]
        });

        return {
          clients: data as Client[],
          total: count || 0
        };
      } catch (err) {
        console.error('ClientsPage - Query function error:', err);
        throw err;
      }
    },
  });

  console.log('ClientsPage - Query state:', {
    isLoading,
    error: error ? {
      message: error.message,
      name: error.name,
      stack: error.stack
    } : null,
    hasData: !!clientsData
  });

  // Create/Update client mutation
  const clientMutation = useMutation({
    mutationFn: async (clientData: Partial<Client>) => {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingClient.id);

        if (error) throw error;
      } else {
        // Ensure client_code is unique before insert
        const { data: existing, error: checkError } = await supabase
          .from('clients')
          .select('id')
          .eq('client_code', clientData.client_code)
          .maybeSingle();
        if (checkError) throw checkError;
        if (existing) {
          throw new Error('Client code must be unique. A client with this code already exists.');
        }
        // Ensure all required fields are present for insert
        const insertData: ClientInsert = {
          client_code: clientData.client_code!,
          name: clientData.name!,
          office_address: clientData.office_address!,
          company_registration_number: clientData.company_registration_number!,
          office_phone_number: clientData.office_phone_number!,
          contact_person: clientData.contact_person!,
          contact_person_phone_number: clientData.contact_person_phone_number!,
          gst_number: clientData.gst_number!,
          is_igst: clientData.is_igst ?? false,
          is_active: clientData.is_active ?? true,
          discount: clientData.discount ?? 0,
        };

        const { error } = await supabase
          .from('clients')
          .insert([insertData]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Success",
        description: editingClient ? "Client updated successfully" : "Client created successfully",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingClient ? 'update' : 'create'} client: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Toggle client active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ clientId, isActive }: { clientId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: isActive })
        .eq('id', clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Success",
        description: "Client status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update client status: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddClient = () => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view clients",
        variant: "destructive",
      });
      return;
    }
    setEditingClient(null);
    setIsDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view clients",
        variant: "destructive",
      });
      return;
    }
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const handleToggleActive = (clientId: string, currentActive: boolean) => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view clients",
        variant: "destructive",
      });
      return;
    }
    toggleActiveMutation.mutate({ clientId, isActive: !currentActive });
  };

  const handleSubmit = (formData: Partial<Client>) => {
    clientMutation.mutate(formData);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const totalPages = Math.ceil((clientsData?.total || 0) / pageSize);

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isStaff ? 'View Clients' : 'Manage Clients'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isStaff ? 'View client information' : 'Create and manage client information'}
            </p>
          </div>
        </div>
        {!isStaff && (
          <Button onClick={handleAddClient} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Client
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search clients by name, code or contact person..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error loading clients</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <details className="mt-2">
            <summary className="text-red-600 text-sm cursor-pointer">Debug Details</summary>
            <pre className="text-xs text-red-500 mt-1 whitespace-pre-wrap">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Clients Table */}
      <ClientsTable
        clients={clientsData?.clients || []}
        isLoading={isLoading}
        onEdit={handleEditClient}
        onToggleActive={handleToggleActive}
        isReadOnly={isStaff}
      />

      {/* Pagination */}
      {clientsData && (
        <ClientsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={clientsData.total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Client Dialog */}
      <ClientDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        client={editingClient}
        onSuccess={handleSubmit}
        isReadOnly={isStaff}
      />
    </div>
  );
} 