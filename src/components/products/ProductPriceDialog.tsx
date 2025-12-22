import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const priceFormSchema = z.object({
  hsn_code: z.string().optional(),
  gst: z.string().optional(),
});

type PriceFormValues = z.infer<typeof priceFormSchema>;

interface CategoryPrice {
  category_id: string;
  category_name: string;
  sale_price: string;
  sequence: number;
}

interface ProductPriceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    id: string;
    name: string;
    hsn_code?: string | null;
    gst?: number | null;
  };
  onSuccess: () => void;
  isReadOnly?: boolean;
}

export function ProductPriceDialog({
  isOpen,
  onClose,
  product,
  onSuccess,
  isReadOnly = false,
}: ProductPriceDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryPrices, setCategoryPrices] = useState<CategoryPrice[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: {
      hsn_code: '',
      gst: '',
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sequence', { ascending: true });
        
        if (error) throw error;
        
        const initialPrices: CategoryPrice[] = (data || []).map(category => ({
          category_id: category.id,
          category_name: category.category_name,
          sale_price: '',
          sequence: category.sequence,
        }));
        setCategoryPrices(initialPrices);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: 'Error',
          description: 'Failed to load categories',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchCategories();
      if (product) {
        fetchProductPrices();
      }
    }
  }, [isOpen, product]);

  const fetchProductPrices = async () => {
    if (!product) return;
    setLoading(true);
    try {
      // First, fetch all categories to ensure we have all of them
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('sequence', { ascending: true });
      
      if (categoriesError) throw categoriesError;

      // Then fetch existing prices for this product
      const { data: pricesData, error: pricesError } = await supabase
        .from('product_prices')
        .select('*, categories(*)')
        .eq('product_id', product.id);

      if (pricesError) throw pricesError;

      // Create a map of category_id to price data for quick lookup
      const priceMap = new Map(
        (pricesData || []).map(price => [
          price.category_id, 
          { 
            sale_price: price.sale_price?.toString() || '0', 
            sequence: price.categories?.sequence || 0 
          }
        ])
      );

      // Create the category prices array with proper defaults
      const newCategoryPrices = (categoriesData || []).map(category => ({
        category_id: category.id,
        category_name: category.category_name,
        sale_price: priceMap.has(category.id) 
          ? priceMap.get(category.id)!.sale_price 
          : '',
        sequence: category.sequence
      }));

      setCategoryPrices(newCategoryPrices);
    } catch (error) {
      console.error('Error fetching product prices:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product prices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPriceChange = (categoryId: string, price: string) => {
    setCategoryPrices(prev =>
      prev.map(cp =>
        cp.category_id === categoryId ? { ...cp, sale_price: price } : cp
      )
    );
  };

  const onSubmit: SubmitHandler<PriceFormValues> = async (data) => {
    if (!product) return;
    
    setIsSubmitting(true);
    try {
      // Update product HSN code and GST
      const productData = {
        hsn_code: data.hsn_code,
        gst: data.gst ? parseFloat(data.gst) : null,
      };

      const { error: productError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', product.id);
      
      if (productError) throw productError;

      // Delete existing product prices
      const { error: deleteError } = await supabase
        .from('product_prices')
        .delete()
        .eq('product_id', product.id);
      
      if (deleteError) throw deleteError;

      // Insert new product prices for categories with prices
      const pricesToInsert = categoryPrices
        .filter(cp => cp.sale_price && parseFloat(cp.sale_price) > 0)
        .map(cp => ({
          product_id: product.id,
          category_id: cp.category_id,
          sale_price: parseFloat(cp.sale_price),
        }));

      if (pricesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('product_prices')
          .insert(pricesToInsert);
        
        if (insertError) throw insertError;
      }
      
      toast({ 
        title: 'Success', 
        description: 'Product prices updated successfully',
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving product prices:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to save product prices', 
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (product) {
      form.reset({
        hsn_code: product.hsn_code || '',
        gst: product.gst?.toString() || '',
      });
    }
  }, [product, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isReadOnly ? 'View' : product ? 'Edit' : 'Add'} Product Pricing
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hsn_code">HSN Code</Label>
              <Input
                id="hsn_code"
                placeholder="Enter HSN code"
                disabled={isReadOnly || isSubmitting}
                {...form.register('hsn_code')}
              />
              {form.formState.errors.hsn_code && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.hsn_code.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst">GST (%)</Label>
              <Input
                id="gst"
                type="number"
                step="0.01"
                min="0"
                max="99.99"
                placeholder="0.00"
                disabled={isReadOnly || isSubmitting}
                {...form.register('gst')}
              />
              {form.formState.errors.gst && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.gst.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Category Pricing</Label>
              <p className="text-sm text-gray-500">
                Set different prices for each category
              </p>
            </div>
            
            {loading ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Loading categories...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {categoryPrices
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((categoryPrice) => (
                    <div key={categoryPrice.category_id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">
                          {categoryPrice.category_name}
                        </Label>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={categoryPrice.sale_price}
                          onChange={(e) => handleCategoryPriceChange(
                            categoryPrice.category_id, 
                            e.target.value
                          )}
                          disabled={isReadOnly || isSubmitting}
                          className="text-right"
                        />
                      </div>
                    </div>
                  ))
                }
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
              Cancel
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}