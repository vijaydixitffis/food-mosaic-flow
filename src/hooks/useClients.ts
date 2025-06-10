import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '@/services/clientService';
import { Client, CreateClientDTO, UpdateClientDTO } from '@/types/client';

export function useClients() {
  const queryClient = useQueryClient();

  // Fetch all clients
  const { data: clients, isLoading, error } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => clientService.getClients(),
  });

  // Fetch single client
  const useClient = (id: string) => {
    return useQuery<Client | null>({
      queryKey: ['client', id],
      queryFn: () => clientService.getClientById(id),
      enabled: !!id,
    });
  };

  // Create client
  const createClient = useMutation({
    mutationFn: (data: CreateClientDTO) => clientService.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  // Update client
  const updateClient = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDTO }) => 
      clientService.updateClient(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
    },
  });

  // Delete client
  const deleteClient = useMutation({
    mutationFn: (id: string) => clientService.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  // Check if client code is available
  const checkClientCode = useMutation({
    mutationFn: ({ code, excludeId }: { code: string; excludeId?: string }) => 
      clientService.isClientCodeAvailable(code, excludeId),
  });

  return {
    clients,
    isLoading,
    error,
    useClient,
    createClient,
    updateClient,
    deleteClient,
    checkClientCode,
  };
}
