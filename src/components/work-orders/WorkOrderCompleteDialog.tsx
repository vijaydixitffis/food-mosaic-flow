import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addProductStock } from '@/integrations/supabase/stock';
import type { Database } from '@/integrations/supabase/types';

type WorkOrder = Database['public']['Tables']['work_orders']['Row'];
type WorkOrderWithProducts = WorkOrder & {
  work_order_products: Array<{
    id: string;
    product_id: string;
    total_weight: number;
    number_of_pouches: number;
    pouch_size: number;
    products: {
      id: string;
      name: string;
    };
  }>;
};

interface WorkOrderCompleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderWithProducts;
  onSuccess: () => void;
  isReadOnly: boolean;
}

export function WorkOrderCompleteDialog({
  isOpen,
  onClose,
  workOrder,
  onSuccess,
  isReadOnly,
}: WorkOrderCompleteDialogProps) {
  const [batchNumber, setBatchNumber] = useState('');
  const [mfgDate, setMfgDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const productIds = workOrder.work_order_products.map((wop) => wop.product_id);

  // Fetch categories that have product_prices for at least one WO product
  const { data: availableCategories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['wo-complete-categories', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase
        .from('product_prices')
        .select('category_id, categories!inner(id, category_name)')
        .in('product_id', productIds);
      if (error) throw error;

      // Deduplicate by category_id
      const seen = new Set<string>();
      const unique: { id: string; category_name: string }[] = [];
      for (const row of data || []) {
        const cat = row.categories as unknown as { id: string; category_name: string };
        if (cat && !seen.has(cat.id)) {
          seen.add(cat.id);
          unique.push(cat);
        }
      }
      return unique.sort((a, b) => a.category_name.localeCompare(b.category_name));
    },
    enabled: isOpen && productIds.length > 0,
  });

  const handleClose = () => {
    setBatchNumber('');
    setMfgDate('');
    setExpiryDate('');
    setCategoryId('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!batchNumber.trim()) {
      toast({ title: 'Validation Error', description: 'Batch number is required.', variant: 'destructive' });
      return;
    }
    if (!mfgDate) {
      toast({ title: 'Validation Error', description: 'Manufacturing date is required.', variant: 'destructive' });
      return;
    }
    if (!expiryDate) {
      toast({ title: 'Validation Error', description: 'Expiry date is required.', variant: 'destructive' });
      return;
    }
    if (!categoryId) {
      toast({ title: 'Validation Error', description: 'Please select a category.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Add product stock for each WO product (all-or-nothing)
      for (const wop of workOrder.work_order_products) {
        const { error } = await addProductStock({
          product_id: wop.product_id,
          category_id: categoryId,
          quantity: wop.total_weight,
          reference_id: workOrder.id,
          batch_number: batchNumber.trim(),
          mfg_date: mfgDate,
          expiry_date: expiryDate,
        });
        if (error) {
          throw new Error(
            `Failed to add stock for ${wop.products.name}: ${(error as Error).message}`
          );
        }
      }

      // Mark WO as EXECUTED
      const { error: statusError } = await supabase
        .from('work_orders')
        .update({ status: 'EXECUTED' })
        .eq('id', workOrder.id);

      if (statusError) throw statusError;

      toast({
        title: 'Work Order Executed',
        description: `Stock added and WO ${workOrder.name} marked as EXECUTED.`,
      });
      handleClose();
      onSuccess();
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Execute Work Order — {workOrder.name}</DialogTitle>
          <DialogDescription>
            Enter batch details for the finished goods. Stock will be added and the work order
            marked as EXECUTED.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Batch Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Batch Details</h3>
            <div className="space-y-1">
              <Label htmlFor="batch-number">Batch Number *</Label>
              <Input
                id="batch-number"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g. BAT-2026-001"
                disabled={isReadOnly || isSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="mfg-date">Manufacturing Date *</Label>
                <Input
                  id="mfg-date"
                  type="date"
                  value={mfgDate}
                  onChange={(e) => setMfgDate(e.target.value)}
                  disabled={isReadOnly || isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="expiry-date">Expiry Date *</Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  disabled={isReadOnly || isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Stock Category */}
          <div className="space-y-1">
            <Label htmlFor="category">Stock Category *</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={isReadOnly || isSubmitting || isLoadingCategories}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder={isLoadingCategories ? 'Loading…' : 'Select category'} />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Manufactured stock will be added under this category.
            </p>
          </div>

          {/* Products summary */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Products to Add to Stock</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrder.work_order_products.map((wop) => (
                    <TableRow key={wop.id}>
                      <TableCell>{wop.products.name}</TableCell>
                      <TableCell className="text-right">{wop.total_weight}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isReadOnly || isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? 'Executing…' : 'Execute & Add to Stock'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
