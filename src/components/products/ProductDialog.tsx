import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { ProductBasicInfoForm } from './ProductBasicInfoForm';
import { ProductTagsSection } from './ProductTagsSection';
import { ProductIngredientsTab } from './ProductIngredientsTab';
import { ProductCompoundsTab } from './ProductCompoundsTab';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];
type Ingredient = Database['public']['Tables']['ingredients']['Row'];
type Compound = Database['public']['Tables']['compounds']['Row'];

type ProductWithIngredients = Product & {
  product_ingredients: Array<{
    id: string;
    ingredient_id: string;
    quantity: number;
    ingredients: {
      id: string;
      name: string;
      unit_of_measurement: string | null;
    };
  }>;
  product_compounds: Array<{
    id: string;
    compound_id: string;
    quantity: number;
    compounds: {
      id: string;
      name: string;
      unit_of_measurement: string | null;
    };
  }>;
};

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  hsn_code: z.string().min(1, 'HSN code is required'),
  description: z.string().optional(),
  pack_type: z.string().optional(),
  client_note: z.string().optional(),
  remarks: z.string().optional(),
  sale_price: z.string().optional(),
  gst: z.string().refine(val => val === '' || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) < 100), {
    message: 'GST must be between 0 and 99.99',
  }),
});

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductWithIngredients | null;
  onSuccess: () => void;
  isReadOnly?: boolean;
}

interface ProductIngredient {
  ingredient_id: string;
  quantity: number;
  ingredient_name?: string;
}

interface ProductCompound {
  compound_id: string;
  quantity: number;
  compound_name?: string;
}

export function ProductDialog({ isOpen, onClose, product, onSuccess, isReadOnly = false }: ProductDialogProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [productIngredients, setProductIngredients] = useState<ProductIngredient[]>([]);
  const [productCompounds, setProductCompounds] = useState<ProductCompound[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<string>('');
  const [ingredientQuantity, setIngredientQuantity] = useState<string>('1');
  const [selectedCompound, setSelectedCompound] = useState<string>('');
  const [compoundQuantity, setCompoundQuantity] = useState<string>('1');
  const { toast } = useToast();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      hsn_code: '',
      description: '',
      pack_type: '',
      client_note: '',
      remarks: '',
      sale_price: '',
      gst: '',
    },
  });

  // Fetch all active ingredients for the dropdown
  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients-for-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data as Ingredient[];
    },
  });

  // Fetch all active compounds for the dropdown
  const { data: compounds = [] } = useQuery({
    queryKey: ['compounds-for-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compounds')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data as Compound[];
    },
  });

  // Initialize form when product changes
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        hsn_code: product.hsn_code || '',
        description: product.description || '',
        pack_type: product.pack_type || '',
        client_note: product.client_note || '',
        remarks: product.remarks || '',
        sale_price: product.sale_price ? product.sale_price.toString() : '',
        gst: product.gst !== undefined && product.gst !== null ? product.gst.toString() : '',
      });
      setTags(Array.isArray(product.tags) ? product.tags : []);
      setProductIngredients(
        product.product_ingredients.map(pi => ({
          ingredient_id: pi.ingredient_id,
          quantity: pi.quantity,
          ingredient_name: pi.ingredients.name,
        }))
      );
      setProductCompounds(
        product.product_compounds?.map(pc => ({
          compound_id: pc.compound_id,
          quantity: pc.quantity,
          compound_name: pc.compounds.name,
        })) || []
      );
    } else {
      form.reset({
        name: '',
        hsn_code: '',
        description: '',
        pack_type: '',
        client_note: '',
        remarks: '',
        sale_price: '',
        gst: '',
      });
      setTags([]);
      setProductIngredients([]);
      setProductCompounds([]);
    }
    setTagInput('');
    setSelectedIngredient('');
    setIngredientQuantity('1');
    setSelectedCompound('');
    setCompoundQuantity('1');
  }, [product, form]);

  // ... keep existing code (saveProductMutation)
  const saveProductMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof productSchema>) => {
      const currentTags = tags;
      console.log('Current tags at mutation time:', currentTags);
      
      const productData = {
        name: formData.name,
        hsn_code: formData.hsn_code,
        description: formData.description || null,
        pack_type: formData.pack_type || null,
        client_note: formData.client_note || null,
        remarks: formData.remarks || null,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        gst: formData.gst ? parseFloat(formData.gst) : null,
        tags: currentTags.length > 0 ? currentTags : null,
        active: true,
      };

      console.log('Saving product with tags:', currentTags);
      console.log('Product data being sent:', productData);

      let productId: string;

      if (product) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) {
          console.error('Error updating product:', error);
          throw error;
        }
        productId = product.id;
      } else {
        // Create new product
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) {
          console.error('Error creating product:', error);
          throw error;
        }
        productId = newProduct.id;
      }

      // Handle product ingredients
      if (product) {
        // Delete existing ingredients
        await supabase
          .from('product_ingredients')
          .delete()
          .eq('product_id', productId);
      }

      // Insert new ingredients
      if (productIngredients.length > 0) {
        const ingredientsToInsert = productIngredients.map(pi => ({
          product_id: productId,
          ingredient_id: pi.ingredient_id,
          quantity: pi.quantity,
        }));

        const { error: ingredientsError } = await supabase
          .from('product_ingredients')
          .insert(ingredientsToInsert);

        if (ingredientsError) {
          console.error('Error inserting ingredients:', ingredientsError);
          throw ingredientsError;
        }
      }

      // Handle product compounds
      if (product) {
        // Delete existing compounds
        await supabase
          .from('product_compounds')
          .delete()
          .eq('product_id', productId);
      }

      // Insert new compounds
      if (productCompounds.length > 0) {
        const compoundsToInsert = productCompounds.map(pc => ({
          product_id: productId,
          compound_id: pc.compound_id,
          quantity: pc.quantity,
        }));

        const { error: compoundsError } = await supabase
          .from('product_compounds')
          .insert(compoundsToInsert);

        if (compoundsError) {
          console.error('Error inserting compounds:', compoundsError);
          throw compoundsError;
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Product ${product ? 'updated' : 'created'} successfully`,
      });
      onSuccess();
    },
    onError: (error) => {
      console.error('Save product mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to ${product ? 'update' : 'create'} product: ` + error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof productSchema>) => {
    console.log('Form submitted with current tags state:', tags);
    console.log('Product ingredients:', productIngredients);
    console.log('Product compounds:', productCompounds);
    
    if (productIngredients.length === 0 && productCompounds.length === 0) {
      toast({
        title: "Error",
        description: "Product must have at least one ingredient or compound",
        variant: "destructive",
      });
      return;
    }
    
    saveProductMutation.mutate(data);
  };

  // Tag management functions
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setTagInput('');
      console.log('Added tag, current tags:', newTags);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    console.log('Removed tag, current tags:', newTags);
  };

  // Ingredient management functions
  const addIngredient = () => {
    if (selectedIngredient && ingredientQuantity) {
      const quantity = parseFloat(ingredientQuantity);
      if (quantity <= 0) {
        toast({
          title: "Error",
          description: "Quantity must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      // Check if ingredient already added
      if (productIngredients.some(pi => pi.ingredient_id === selectedIngredient)) {
        toast({
          title: "Error",
          description: "This ingredient is already added",
          variant: "destructive",
        });
        return;
      }

      const ingredient = ingredients.find(i => i.id === selectedIngredient);
      setProductIngredients([
        ...productIngredients,
        {
          ingredient_id: selectedIngredient,
          quantity,
          ingredient_name: ingredient?.name,
        },
      ]);
      setSelectedIngredient('');
      setIngredientQuantity('1');
    }
  };

  const removeIngredient = (ingredientId: string) => {
    setProductIngredients(productIngredients.filter(pi => pi.ingredient_id !== ingredientId));
  };

  // Compound management functions
  const addCompound = () => {
    if (selectedCompound && compoundQuantity) {
      const quantity = parseFloat(compoundQuantity);
      if (quantity <= 0) {
        toast({
          title: "Error",
          description: "Quantity must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      // Check if compound already added
      if (productCompounds.some(pc => pc.compound_id === selectedCompound)) {
        toast({
          title: "Error",
          description: "This compound is already added",
          variant: "destructive",
        });
        return;
      }

      const compound = compounds.find(c => c.id === selectedCompound);
      setProductCompounds([
        ...productCompounds,
        {
          compound_id: selectedCompound,
          quantity,
          compound_name: compound?.name,
        },
      ]);
      setSelectedCompound('');
      setCompoundQuantity('1');
    }
  };

  const removeCompound = (compoundId: string) => {
    setProductCompounds(productCompounds.filter(pc => pc.compound_id !== compoundId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? (isReadOnly ? 'View Product' : 'Edit Product') : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Product Details</TabsTrigger>
                <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                <TabsTrigger value="compounds">Compounds</TabsTrigger>
              </TabsList>
              
              {/* Product Details Tab */}
              <TabsContent value="details" className="space-y-6">
                <ProductBasicInfoForm form={form} />
                
                <ProductTagsSection
                  tags={tags}
                  tagInput={tagInput}
                  onTagInputChange={setTagInput}
                  onAddTag={addTag}
                  onRemoveTag={removeTag}
                />
              </TabsContent>

              {/* Ingredients Tab */}
              <TabsContent value="ingredients" className="space-y-4">
                <ProductIngredientsTab
                  ingredients={ingredients}
                  productIngredients={productIngredients}
                  selectedIngredient={selectedIngredient}
                  ingredientQuantity={ingredientQuantity}
                  onSelectedIngredientChange={setSelectedIngredient}
                  onIngredientQuantityChange={setIngredientQuantity}
                  onAddIngredient={addIngredient}
                  onRemoveIngredient={removeIngredient}
                />
              </TabsContent>

              {/* Compounds Tab */}
              <TabsContent value="compounds" className="space-y-4">
                <ProductCompoundsTab
                  compounds={compounds}
                  productCompounds={productCompounds}
                  selectedCompound={selectedCompound}
                  compoundQuantity={compoundQuantity}
                  onSelectedCompoundChange={setSelectedCompound}
                  onCompoundQuantityChange={setCompoundQuantity}
                  onAddCompound={addCompound}
                  onRemoveCompound={removeCompound}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {!isReadOnly && (
                <Button type="submit" disabled={saveProductMutation.isPending}>
                  {saveProductMutation.isPending
                    ? 'Saving...'
                    : product
                    ? 'Update Product'
                    : 'Add Product'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
