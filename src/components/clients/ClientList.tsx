
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/date';

export function ClientList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { clients, isLoading, deleteClient } = useClients();

  const filteredClients = clients?.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.client_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.gst_number?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  ) || [];

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      await deleteClient.mutateAsync(id);
    }
  };

  if (isLoading) return <div>Loading clients...</div>;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Clients</CardTitle>
            <CardDescription>Manage your clients and their information</CardDescription>
          </div>
          <Button onClick={() => navigate('/clients/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>GST Number</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No clients found
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/50 cursor-pointer" 
                    onClick={() => navigate(`/clients/${client.id}`)}>
                    <TableCell className="font-medium">{client.client_code}</TableCell>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.gst_number || '-'}</TableCell>
                    <TableCell>{client.contact_person1_phone || '-'}</TableCell>
                    <TableCell>{formatDate(client.created_at)}</TableCell>
                    <TableCell className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/clients/${client.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <div>{filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} found</div>
      </CardFooter>
    </Card>
  );
}
