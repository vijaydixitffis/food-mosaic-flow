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
import { addIngredientStock } from '@/integrations/supabase/stock'; // Import the function
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client'; // Assuming you have this client

// Define the form schema using Zod
const formSchema = z.object({
  ingredient_id: z.string().uuid({ message: 'Please select an ingredient.' }),
  quantity: z.preprocess(
    (val) => Number(val),
    z.number().positive({ message: 'Quantity must be a positive number.' })
  ),
  unit_of_measure: z.string().optional(),
  location: z.string().optional(),
});

type AddIngredientStockFormValues = z.infer<typeof formSchema>;

interface AddIngredientStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddIngredientStockDialog({
  isOpen,
  onClose,
}: AddIngredientStockDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch list of ingredients for the dropdown
  const { data: ingredients, isLoading: isLoadingIngredients } = useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ingredients').select('id, name');
      if (error) throw error;
      return data;
    },
  });


  const form = useForm<AddIngredientStockFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredient_id: '',
      quantity: 0,
      unit_of_measure: '',
      location: '',
    },
  });

  const addStockMutation = useMutation({
    mutationFn: addIngredientStock, // Use the imported function
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Ingredient stock added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['ingredientStock'] }); // Invalidate query
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add ingredient stock: ${error.message}`,
        variant: 'destructive',
      });
      console.error('Error adding ingredient stock:', error);
    },
  });

  const onSubmit = (values: AddIngredientStockFormValues) => {
    addStockMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Ingredient Stock</DialogTitle>
          <DialogDescription>
            Fill in the details to add new stock for an ingredient.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="ingredient_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredient</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an ingredient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingIngredients ? (
                         <SelectItem value="loading" disabled>Loading ingredients...</SelectItem>
                      ) : (
                        ingredients?.map((ingredient) => (
                          <SelectItem key={ingredient.id} value={ingredient.id}>
                            {ingredient.name}
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
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter quantity"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)} // Ensure number type
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="unit_of_measure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit of Measure (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., kg, liters, units" {...field} />
                  </FormControl>
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
                    <Input placeholder="e.g., Warehouse A, Shelf 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={addStockMutation.isLoading}>
              {addStockMutation.isLoading ? 'Adding Stock...' : 'Add Stock'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}