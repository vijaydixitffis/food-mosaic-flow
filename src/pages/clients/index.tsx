import { NextPageWithLayout } from '@/types';
import { ClientList } from '@/components/clients/ClientList';
import { AppLayout } from '@/components/layout/AppLayout';

const ClientsPage: NextPageWithLayout = () => {
  return <ClientList />;
};

ClientsPage.getLayout = (page) => <AppLayout>{page}</AppLayout>;

export default ClientsPage;
