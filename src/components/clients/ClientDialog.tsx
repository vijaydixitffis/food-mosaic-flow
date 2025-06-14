import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clients']['Row'];

interface ClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSuccess: (formData: Partial<Client>) => void;
  isReadOnly: boolean;
}

export function ClientDialog({
  isOpen,
  onClose,
  client,
  onSuccess,
  isReadOnly,
}: ClientDialogProps) {
  const [formData, setFormData] = useState<Partial<Client>>({
    client_code: '',
    name: '',
    office_address: '',
    company_registration_number: '',
    office_phone_number: '',
    contact_person: '',
    contact_person_phone_number: '',
    gst_number: '',
    is_igst: false,
    is_active: true,
  });

  useEffect(() => {
    if (client) {
      setFormData(client);
    } else {
      setFormData({
        client_code: '',
        name: '',
        office_address: '',
        company_registration_number: '',
        office_phone_number: '',
        contact_person: '',
        contact_person_phone_number: '',
        gst_number: '',
        is_igst: false,
        is_active: true,
      });
    }
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {client ? `Edit Client - ${client.name}` : 'Add New Client'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_code">Client Code</Label>
              <Input
                id="client_code"
                value={formData.client_code}
                onChange={(e) => setFormData({ ...formData, client_code: e.target.value })}
                disabled={isReadOnly}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isReadOnly}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="office_address">Office Address</Label>
            <Textarea
              id="office_address"
              value={formData.office_address}
              onChange={(e) => setFormData({ ...formData, office_address: e.target.value })}
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_registration_number">Company Registration Number</Label>
              <Input
                id="company_registration_number"
                value={formData.company_registration_number}
                onChange={(e) => setFormData({ ...formData, company_registration_number: e.target.value })}
                disabled={isReadOnly}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="office_phone_number">Office Phone Number</Label>
              <Input
                id="office_phone_number"
                value={formData.office_phone_number}
                onChange={(e) => setFormData({ ...formData, office_phone_number: e.target.value })}
                disabled={isReadOnly}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input
                id="gst_number"
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                disabled={isReadOnly}
                required
                placeholder="e.g., 27ABCDE1234F1Z5"
              />
            </div>
            <div className="space-y-2">
              <Label>GST Type</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="cgst"
                  name="gstType"
                  checked={!formData.is_igst}
                  onChange={() => setFormData({ ...formData, is_igst: false })}
                  disabled={isReadOnly}
                  className="h-4 w-4"
                />
                <Label htmlFor="cgst" className="cursor-pointer">CGST/SGST</Label>
                <input
                  type="radio"
                  id="igst"
                  name="gstType"
                  checked={formData.is_igst}
                  onChange={() => setFormData({ ...formData, is_igst: true })}
                  disabled={isReadOnly}
                  className="h-4 w-4 ml-4"
                />
                <Label htmlFor="igst" className="cursor-pointer">IGST</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                disabled={isReadOnly}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person_phone_number">Contact Person Phone Number</Label>
              <Input
                id="contact_person_phone_number"
                value={formData.contact_person_phone_number}
                onChange={(e) => setFormData({ ...formData, contact_person_phone_number: e.target.value })}
                disabled={isReadOnly}
                required
              />
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {client ? 'Update Client' : 'Create Client'}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
} 