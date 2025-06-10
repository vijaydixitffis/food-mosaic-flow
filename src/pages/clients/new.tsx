import { useState } from 'react';
import { useRouter } from 'next/router';
import { NextPageWithLayout } from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { ClientForm } from '@/components/clients/forms/ClientForm';
import { useClients } from '@/hooks/useClients';
import { toast } from '@/components/ui/use-toast';

const NewClientPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { createClient } = useClients();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await createClient.mutateAsync(data);
      toast({
        title: 'Client created',
        description: 'The client has been created successfully.',
      });
      router.push('/clients');
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while creating the client.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add New Client</h1>
      </div>
      <ClientForm
        initialData={null}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

NewClientPage.getLayout = (page) => <AppLayout>{page}</AppLayout>;

export default NewClientPage;
