import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addProductStock } from '@/integrations/supabase/stock'; // Import addProductStock
import type { Database } from '@/integrations/supabase/types'; // Assuming Database type is here
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';


type Product = Database['public']['Tables']['products']['Row']; // Assuming Product type from your DB types

const formSchema = z.object({
  product_id: z.string().uuid({ message: 'Please select a product.' }),
  quantity: z.preprocess(
    (val) => Number(val),
    z.number().positive('Quantity must be a positive number.')
  ),
  location: z.string().optional(),
});

interface AddProductStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddProductStockDialog({
  isOpen,
  onClose,
}: AddProductStockDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch list of products for the dropdown
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['productsForStock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching products for stock dialog:', error);
        throw error;
      }
      return data;
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_id: '',
      quantity: 0,
      location: '',
    },
  });

  const addStockMutation = useMutation({
    mutationFn: addProductStock, // Use the addProductStock function
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Product stock added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['productStock'] }); // Invalidate productStock query
      onClose(); // Close the dialog on success
      form.reset(); // Reset form fields
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to add product stock: ${error.message}`,
        variant: 'destructive',
      });
      console.error('Error adding product stock:', error);
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addStockMutation.mutate(values);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Product Stock</DialogTitle>
          <DialogDescription>
            Enter details for the new product stock.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingProducts ? (
                        <SelectItem value="" disabled>Loading products...</SelectItem>
                      ) : (
                        products?.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the quantity of stock to add.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the storage location of the stock.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={addStockMutation.isPending}>
              {addStockMutation.isPending ? 'Adding Stock...' : 'Add Stock'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}