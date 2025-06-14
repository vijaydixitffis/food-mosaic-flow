
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/date';
import { useClients } from '@/hooks/useClients';

export function ClientDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const { useClient } = useClients();
  const { data: client, isLoading, error } = useClient(id);

  if (isLoading) return <div>Loading client details...</div>;
  if (error || !client) return <div>Error loading client details</div>;

  const renderAddress = (address: any, title: string) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {address ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium">{address.address_line1}</p>
            {address.address_line2 && <p>{address.address_line2}</p>}
            {address.landmark && <p>Landmark: {address.landmark}</p>}
            <p>
              {address.city}, {address.state} - {address.pincode}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground">Same as registered office</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Clients
        </Button>
        <Button
          onClick={() => navigate(`/clients/${client.id}/edit`)}
          className="gap-1"
        >
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{client.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{client.client_code}</Badge>
                {client.is_igst && (
                  <Badge variant="secondary">IGST Applicable</Badge>
                )}
                {!client.is_active && (
                  <Badge variant="destructive">Inactive</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">GST Number</h3>
              <p>{client.gst_number || '-'}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Company Reg. No.</h3>
              <p>{client.company_registration_number || '-'}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Office Phone</h3>
              <p>{client.office_phone_number || '-'}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Created On</h3>
              <p>{formatDate(client.created_at)}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
              <p>{formatDate(client.updated_at)}</p>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">Contact Persons</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {client.contact_person1_name && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Primary Contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{client.contact_person1_name}</p>
                    {client.contact_person1_phone && (
                      <p className="text-sm">{client.contact_person1_phone}</p>
                    )}
                  </CardContent>
                </Card>
              )}
              {client.contact_person2_name && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Secondary Contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{client.contact_person2_name}</p>
                    {client.contact_person2_phone && (
                      <p className="text-sm">{client.contact_person2_phone}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Addresses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderAddress(
                client.registered_office_address,
                'Registered Office Address'
              )}
              {renderAddress(
                client.bill_to_address || null,
                'Billing Address'
              )}
              {renderAddress(
                client.ship_to_address || null,
                'Shipping Address'
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
