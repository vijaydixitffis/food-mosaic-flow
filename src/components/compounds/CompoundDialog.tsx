
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const compoundSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  unit_of_measurement: z.string().optional(),
  active: z.boolean().default(true),
});

type CompoundFormData = z.infer<typeof compoundSchema>;

interface CompoundIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  ingredients: {
    id: string;
    name: string;
    unit_of_measurement: string | null;
    rate: number | null;
  };
}

interface Compound {
  id: string;
  name: string;
  description: string | null;
  unit_of_measurement: string | null;
  tags: string[] | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  compound_ingredients: CompoundIngredient[];
}

interface CompoundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  compound?: Compound | null;
  onSuccess: () => void;
}

interface SelectedIngredient {
  ingredient_id: string;
  quantity: number;
  name: string;
  unit_of_measurement: string | null;
  rate: number | null;
}

export function CompoundDialog({ isOpen, onClose, compound, onSuccess }: CompoundDialogProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CompoundFormData>({
    resolver: zodResolver(compoundSchema),
    defaultValues: {
      name: '',
      description: '',
      unit_of_measurement: '',
      active: true,
    },
  });

  // Fetch available ingredients
  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Reset form when dialog opens/closes or compound changes
  useEffect(() => {
    if (isOpen) {
      if (compound) {
        form.reset({
          name: compound.name,
          description: compound.description || '',
          unit_of_measurement: compound.unit_of_measurement || '',
          active: compound.active,
        });
        setTags(compound.tags || []);
        
        // Set selected ingredients from compound
        const compoundIngredients = compound.compound_ingredients?.map(ci => ({
          ingredient_id: ci.ingredient_id,
          quantity: ci.quantity,
          name: ci.ingredients.name,
          unit_of_measurement: ci.ingredients.unit_of_measurement,
          rate: ci.ingredients.rate,
        })) || [];
        setSelectedIngredients(compoundIngredients);
      } else {
        form.reset({
          name: '',
          description: '',
          unit_of_measurement: '',
          active: true,
        });
        setTags([]);
        setSelectedIngredients([]);
      }
      setTagInput('');
      setSelectedIngredientId('');
      setQuantity(1);
    }
  }, [isOpen, compound, form]);

  const createCompoundMutation = useMutation({
    mutationFn: async (data: CompoundFormData) => {
      console.log('Creating compound with data:', data);
      console.log('Tags:', tags);
      console.log('Selected ingredients:', selectedIngredients);

      // Create the compound
      const { data: compoundData, error: compoundError } = await supabase
        .from('compounds')
        .insert({
          name: data.name,
          description: data.description || null,
          unit_of_measurement: data.unit_of_measurement || null,
          tags: tags.length > 0 ? tags : null,
          active: data.active,
        })
        .select()
        .single();

      if (compoundError) throw compoundError;

      // Create compound ingredients
      if (selectedIngredients.length > 0) {
        const compoundIngredients = selectedIngredients.map(si => ({
          compound_id: compoundData.id,
          ingredient_id: si.ingredient_id,
          quantity: si.quantity,
        }));

        const { error: ingredientsError } = await supabase
          .from('compound_ingredients')
          .insert(compoundIngredients);

        if (ingredientsError) throw ingredientsError;
      }

      return compoundData;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Compound created successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create compound: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateCompoundMutation = useMutation({
    mutationFn: async (data: CompoundFormData) => {
      if (!compound) throw new Error('No compound to update');

      console.log('Updating compound with data:', data);
      console.log('Tags:', tags);
      console.log('Selected ingredients:', selectedIngredients);

      // Update the compound
      const { error: compoundError } = await supabase
        .from('compounds')
        .update({
          name: data.name,
          description: data.description || null,
          unit_of_measurement: data.unit_of_measurement || null,
          tags: tags.length > 0 ? tags : null,
          active: data.active,
        })
        .eq('id', compound.id);

      if (compoundError) throw compoundError;

      // Delete existing compound ingredients
      const { error: deleteError } = await supabase
        .from('compound_ingredients')
        .delete()
        .eq('compound_id', compound.id);

      if (deleteError) throw deleteError;

      // Create new compound ingredients
      if (selectedIngredients.length > 0) {
        const compoundIngredients = selectedIngredients.map(si => ({
          compound_id: compound.id,
          ingredient_id: si.ingredient_id,
          quantity: si.quantity,
        }));

        const { error: ingredientsError } = await supabase
          .from('compound_ingredients')
          .insert(compoundIngredients);

        if (ingredientsError) throw ingredientsError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Compound updated successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update compound: " + error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompoundFormData) => {
    if (selectedIngredients.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one ingredient to the compound",
        variant: "destructive",
      });
      return;
    }

    if (compound) {
      updateCompoundMutation.mutate(data);
    } else {
      createCompoundMutation.mutate(data);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addIngredient = () => {
    if (!selectedIngredientId || quantity <= 0) return;

    const ingredient = ingredients.find(i => i.id === selectedIngredientId);
    if (!ingredient) return;

    // Check if ingredient is already added
    const existingIngredient = selectedIngredients.find(si => si.ingredient_id === selectedIngredientId);
    if (existingIngredient) {
      toast({
        title: "Error",
        description: "This ingredient is already added to the compound",
        variant: "destructive",
      });
      return;
    }

    const newIngredient: SelectedIngredient = {
      ingredient_id: selectedIngredientId,
      quantity,
      name: ingredient.name,
      unit_of_measurement: ingredient.unit_of_measurement,
      rate: ingredient.rate,
    };

    setSelectedIngredients([...selectedIngredients, newIngredient]);
    setSelectedIngredientId('');
    setQuantity(1);
  };

  const removeIngredient = (ingredientId: string) => {
    setSelectedIngredients(selectedIngredients.filter(si => si.ingredient_id !== ingredientId));
  };

  const updateIngredientQuantity = (ingredientId: string, newQuantity: number) => {
    setSelectedIngredients(selectedIngredients.map(si => 
      si.ingredient_id === ingredientId 
        ? { ...si, quantity: newQuantity }
        : si
    ));
  };

  const calculateTotalRate = () => {
    return selectedIngredients.reduce((sum, si) => {
      return sum + ((si.rate || 0) * si.quantity);
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {compound ? 'Edit Compound' : 'Add New Compound'}
          </DialogTitle>
          <DialogDescription>
            {compound 
              ? 'Update the compound information and ingredients' 
              : 'Create a new compound by combining ingredients'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter compound name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter compound description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit_of_measurement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit of Measurement</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., kg, liters, pieces" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-4">
              <FormLabel>Ingredients</FormLabel>
              
              {/* Add ingredient */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map((ingredient) => (
                        <SelectItem key={ingredient.id} value={ingredient.id}>
                          {ingredient.name} (₹{ingredient.rate || 0}/{ingredient.unit_of_measurement || 'unit'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <Button type="button" onClick={addIngredient} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Selected ingredients */}
              <div className="space-y-2">
                {selectedIngredients.map((si) => (
                  <div key={si.ingredient_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">{si.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        (₹{si.rate || 0}/{si.unit_of_measurement || 'unit'})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={si.quantity}
                        onChange={(e) => updateIngredientQuantity(si.ingredient_id, Number(e.target.value))}
                        className="w-20"
                        min="0.01"
                        step="0.01"
                      />
                      <span className="text-sm text-gray-500 w-12">
                        {si.unit_of_measurement || 'units'}
                      </span>
                      <span className="font-medium w-20 text-right">
                        ₹{((si.rate || 0) * si.quantity).toFixed(2)}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeIngredient(si.ingredient_id)}
                        className="text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total rate */}
              {selectedIngredients.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Compound Rate:</span>
                    <span className="text-lg font-bold text-green-600">
                      ₹{calculateTotalRate().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createCompoundMutation.isPending || updateCompoundMutation.isPending}
              >
                {createCompoundMutation.isPending || updateCompoundMutation.isPending
                  ? 'Saving...'
                  : compound
                  ? 'Update Compound'
                  : 'Create Compound'
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
