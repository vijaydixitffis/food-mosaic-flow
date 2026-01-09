// src/components/invoice/InvoiceNumberDialog.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceNumberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoiceNumber: string) => void;
  initialValue?: string;
}

export function InvoiceNumberDialog({ 
  isOpen, 
  onClose, 
  onSave,
  initialValue = ''
}: InvoiceNumberDialogProps) {
  const [invoiceNumber, setInvoiceNumber] = useState(initialValue);
  const [error, setError] = useState('');

  // Fetch invoice number prefix from company params
  const { data: companyParams = [] } = useQuery({
    queryKey: ['company-params'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_params')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // Get the invoice number prefix
  const invoiceNumberPrefix = companyParams.find(p => p.key === 'invoice_number_prefix')?.value || 'INV-';

  // Update local state when initialValue changes
  useEffect(() => {
    setInvoiceNumber(initialValue);
  }, [initialValue]);

  const handleSave = () => {
    if (!invoiceNumber.trim()) {
      setError('Please enter an invoice number');
      return;
    }
    onSave(invoiceNumber.trim());
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Invoice Number</DialogTitle>
          <DialogDescription>
            Please provide the invoice number. This will be combined with the prefix "{invoiceNumberPrefix}" to form the complete invoice number.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invoice-number">Invoice Number</Label>
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-600 font-medium whitespace-nowrap">{invoiceNumberPrefix}</span>
              <Input
                id="invoice-number"
                value={invoiceNumber}
                onChange={(e) => {
                  setInvoiceNumber(e.target.value);
                  if (error) setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="e.g., 2023-001"
                className={error ? 'border-red-500' : ''}
                style={{ width: '150px' }}
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            variant="default"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}