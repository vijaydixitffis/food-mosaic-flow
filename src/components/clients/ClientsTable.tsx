import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, MoreHorizontal, UserX } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clients']['Row'];

interface ClientsTableProps {
  clients: Client[];
  isLoading: boolean;
  onEdit: (client: Client) => void;
  onDeactivate: (clientId: string) => void;
  isReadOnly: boolean;
}

export function ClientsTable({
  clients,
  isLoading,
  onEdit,
  onDeactivate,
  isReadOnly,
}: ClientsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border p-4">
        <p className="text-center text-gray-500">Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>Office Phone</TableHead>
            <TableHead>GST Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.client_code}</TableCell>
              <TableCell>{client.name}</TableCell>
              <TableCell>{client.discount != null ? `${client.discount}%` : '-'}</TableCell>
              <TableCell>{client.contact_person}</TableCell>
              <TableCell>{client.office_phone_number}</TableCell>
              <TableCell>
                <Badge variant={client.is_igst ? "default" : "secondary"}>
                  {client.is_igst ? "IGST" : "CGST/SGST"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={client.is_active ? "default" : "secondary"}>
                  {client.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white">
                    <DropdownMenuItem onClick={() => onEdit(client)}>
                      <Edit className="mr-2 h-4 w-4" />
                      {isReadOnly ? 'View' : 'Edit'}
                    </DropdownMenuItem>
                    {!isReadOnly && client.is_active && (
                      <DropdownMenuItem
                        onClick={() => onDeactivate(client.id)}
                        className="text-red-600"
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 