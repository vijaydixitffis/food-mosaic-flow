import { useRouter } from 'next/router';
import { NextPageWithLayout } from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { ClientDetail } from '@/components/clients/ClientDetail';

const ClientDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;

  if (!id || Array.isArray(id)) {
    return <div>Client not found</div>;
  }

  return <ClientDetail id={id} />;
};

ClientDetailPage.getLayout = (page) => <AppLayout>{page}</AppLayout>;

export default ClientDetailPage;
