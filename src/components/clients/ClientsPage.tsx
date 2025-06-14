import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
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
  const { isStaff, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch clients with pagination
  const { data: clientsData, isLoading, error } = useQuery({
    queryKey: ['clients', searchTerm, currentPage, pageSize],
    queryFn: async () => {
      // First, get total count
      let countQuery = supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      if (searchTerm) {
        countQuery = countQuery.or(`name.ilike.%${searchTerm}%,client_code.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%`);
      }

      const { count } = await countQuery;

      // Then, get paginated data
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,client_code.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, count: count || 0 };
    },
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

  // Deactivate client mutation
  const deactivateMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: false })
        .eq('id', clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Success",
        description: "Client deactivated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to deactivate client: " + error.message,
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

  const handleDeactivateClient = (clientId: string) => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view clients",
        variant: "destructive",
      });
      return;
    }
    if (confirm('Are you sure you want to deactivate this client?')) {
      deactivateMutation.mutate(clientId);
    }
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

  const totalPages = Math.ceil((clientsData?.count || 0) / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isStaff ? 'View Clients' : 'Manage Clients'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isStaff ? 'View client information' : 'Create and manage client information'}
          </p>
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
        </div>
      )}

      {/* Clients Table */}
      <ClientsTable
        clients={clientsData?.data || []}
        isLoading={isLoading}
        onEdit={handleEditClient}
        onDeactivate={handleDeactivateClient}
        isReadOnly={isStaff}
      />

      {/* Pagination */}
      {clientsData && (
        <ClientsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={clientsData.count}
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