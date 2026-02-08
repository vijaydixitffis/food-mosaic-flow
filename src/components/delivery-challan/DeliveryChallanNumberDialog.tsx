import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DeliveryChallanNumberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (number: string) => void;
  initialValue: string;
}

export function DeliveryChallanNumberDialog({
  isOpen,
  onClose,
  onSave,
  initialValue
}: DeliveryChallanNumberDialogProps) {
  const [invoiceNumber, setInvoiceNumber] = useState(initialValue);

  useEffect(() => {
    setInvoiceNumber(initialValue);
  }, [initialValue]);

  const handleSave = () => {
    if (invoiceNumber.trim()) {
      onSave(invoiceNumber.trim());
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delivery Challan Number</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="delivery-challan-number" className="text-right">
              DC Number
            </Label>
            <Input
              id="delivery-challan-number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              className="col-span-3"
              placeholder="Enter delivery challan number"
              autoFocus
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!invoiceNumber.trim()}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
