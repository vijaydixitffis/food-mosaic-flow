
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ClientDetail } from '@/components/clients/ClientDetail';

const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>Client not found</div>;
  }

  return (
    <AppLayout>
      <ClientDetail id={id} />
    </AppLayout>
  );
};

export default ClientDetailPage;
