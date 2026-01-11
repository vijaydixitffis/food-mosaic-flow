import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { addProductStock } from '@/integrations/supabase/stock';

const stockFormSchema = z.object({
  // Form schema can be extended if needed
});

type StockFormValues = z.infer<typeof stockFormSchema>;

interface CategoryStock {
  category_id: string;
  category_name: string;
  current_stock: number;
  stock_to_add: number;
  sequence: number;
}

interface ProductStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    id: string;
    name: string;
  };
  onSuccess: () => void;
  isReadOnly?: boolean;
}

export function ProductStockDialog({
  isOpen,
  onClose,
  product,
  onSuccess,
  isReadOnly = false,
}: ProductStockDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryStocks, setCategoryStocks] = useState<CategoryStock[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockFormSchema),
  });

  useEffect(() => {
    const fetchData = async () => {
  if (!product || !isOpen) return;
  
  setLoading(true);
  try {
    // First, get the categories with sale prices for this product
    const { data: productPrices, error: pricesError } = await supabase
      .from('product_prices')
      .select(`
        category_id,
        stock,
        sale_price,
        categories!inner(
          id,
          category_name,
          sequence
        )
      `)
      .eq('product_id', product.id)
      .not('sale_price', 'is', null);

    if (pricesError) throw pricesError;

    if (!productPrices || productPrices.length === 0) {
      setCategoryStocks([]);
      setLoading(false);
      return;
    }

    // Sort the results by category sequence on the client side
    const sortedPrices = [...productPrices].sort((a, b) => 
      (a.categories?.sequence || 0) - (b.categories?.sequence || 0)
    );

    // Map the sorted data to our CategoryStock format
    const stocks: CategoryStock[] = sortedPrices.map(pp => ({
      category_id: pp.category_id,
      category_name: pp.categories?.category_name || 'Unknown',
      current_stock: pp.stock || 0,
      stock_to_add: 0,
      sequence: pp.categories?.sequence || 0,
    }));

    setCategoryStocks(stocks);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    toast({
      title: 'Error',
      description: 'Failed to load stock information',
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};

    fetchData();
  }, [isOpen, product]);

  const handleStockChange = (categoryId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setCategoryStocks(prev =>
      prev.map(item =>
        item.category_id === categoryId
          ? { ...item, stock_to_add: numValue }
          : item
      )
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setIsSubmitting(true);
    try {
      // Filter out categories with no stock change
      const updates = categoryStocks
        .filter(item => item.stock_to_add !== 0)
        .map(async (item) => {
          // Use addProductStock to create stock allocation entries
          const { error } = await addProductStock({
            product_id: product.id,
            category_id: item.category_id,
            quantity: item.stock_to_add,
          });
          if (error) throw error;
        });

      await Promise.all(updates);

      toast({
        title: 'Success',
        description: 'Stock updated successfully with audit trail',
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to update stock',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isReadOnly ? 'View' : 'Update'} Stock: {product?.name || ''}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Category Stock</Label>
              <p className="text-sm text-gray-500">
                {isReadOnly ? 'Current stock levels' : 'Enter stock to add/subtract'}
              </p>
            </div>
            
            {loading ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Loading stock information...</p>
              </div>
            ) : categoryStocks.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-gray-500">No categories with sale prices found for this product.</p>
                <p className="text-sm text-gray-400">Add Product Sale Prices first to update stocks.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {categoryStocks.map((item) => (
                  <div key={item.category_id} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5">
                      <Label className="font-medium">{item.category_name}</Label>
                      <p className="text-xs text-gray-500">
                        Current: {item.current_stock}
                      </p>
                    </div>
                    <div className="col-span-7 flex items-center gap-2">
                      <Input
                        type="number"
                        value={item.stock_to_add === 0 ? '' : item.stock_to_add}
                        onChange={(e) => handleStockChange(item.category_id, e.target.value)}
                        disabled={isReadOnly || isSubmitting}
                        placeholder="0"
                        className="text-right"
                      />
                      <span className="whitespace-nowrap text-sm text-gray-500">
                        New total: {item.current_stock + (item.stock_to_add || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Close
            </Button>
            {!isReadOnly && categoryStocks.length > 0 && (
              <Button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting ? 'Updating...' : 'Update Stock'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}