import { useRouter } from 'next/router';
import { NextPageWithLayout } from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { ClientForm } from '@/components/clients/forms/ClientForm';
import { useClients } from '@/hooks/useClients';
import { toast } from '@/components/ui/use-toast';
import { useEffect, useState } from 'react';

const EditClientPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;
  const { updateClient, useClient } = useClients();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: client, isLoading } = useClient(id as string);

  const handleSubmit = async (data: any) => {
    if (!id || Array.isArray(id)) return;
    
    try {
      setIsSubmitting(true);
      await updateClient.mutateAsync({ id, data });
      toast({
        title: 'Client updated',
        description: 'The client has been updated successfully.',
      });
      router.push(`/clients/${id}`);
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while updating the client.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading client data...</div>;
  }

  if (!client) {
    return <div>Client not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Client</h1>
      </div>
      <ClientForm
        initialData={client}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

EditClientPage.getLayout = (page) => <AppLayout>{page}</AppLayout>;

export default EditClientPage;
