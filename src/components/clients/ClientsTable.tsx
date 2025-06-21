import React, { useState } from 'react';
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
import { Edit, Eye } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clients']['Row'];

interface StatusSliderProps {
  isActive: boolean;
  onToggle: () => void;
  clientName: string;
  disabled?: boolean;
}

function StatusSlider({ isActive, onToggle, clientName, disabled = false }: StatusSliderProps) {
  const handleToggle = () => {
    if (disabled) return;
    
    if (isActive) {
      // If currently active and trying to deactivate, show confirmation
      const confirmed = window.confirm(
        `Are you sure you want to deactivate "${clientName}"? This will make the client unavailable for orders.`
      );
      if (confirmed) {
        onToggle();
      }
    } else {
      // If currently inactive and trying to activate, proceed directly
      onToggle();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          ${isActive 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-gray-200 hover:bg-gray-300'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${isActive ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}

interface ClientsTableProps {
  clients: Client[];
  isLoading: boolean;
  onEdit: (client: Client) => void;
  onToggleActive: (clientId: string, isActive: boolean) => void;
  isReadOnly: boolean;
}

export function ClientsTable({
  clients,
  isLoading,
  onEdit,
  onToggleActive,
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
            <TableHead>Actions</TableHead>
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
                <div className="flex items-center justify-between">
                  <StatusSlider
                    isActive={client.is_active}
                    onToggle={() => onToggleActive(client.id, client.is_active)}
                    clientName={client.name}
                    disabled={isReadOnly}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(client)}
                    className="flex items-center gap-1"
                  >
                    {isReadOnly ? <Eye className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
                    {isReadOnly ? 'View' : 'Edit'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 