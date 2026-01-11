import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { addProductStock, getProductStockHistory } from '@/integrations/supabase/stock';
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
      description: string;
      unit_of_measurement: string;
      created_at: string;
      updated_at: string;
    };
  }>;
  pack_type: string | null;
  client_note: string | null;
  remarks: string | null;
  tags: string[] | null;
};

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  pack_type: z.string().optional(),
  client_note: z.string().optional(),
  remarks: z.string().optional(),
  tags: z.array(z.string()).optional(),
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
  id: string;
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
  
  // Stock management state
  const [showAddStock, setShowAddStock] = useState(false);
  const [showStockHistory, setShowStockHistory] = useState(false);
  const [addStockQty, setAddStockQty] = useState('');
  const [addStockLoading, setAddStockLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  console.log('ProductDialog render - product exists:', !!product);
  console.log('ProductDialog render - product.id:', product?.id);
  console.log('ProductDialog render - showAddStock:', showAddStock);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories for stock addition
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sequence', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      pack_type: '',
      client_note: '',
      remarks: '',
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

  // Fetch current product data to get the most up-to-date stock
  const { data: currentProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', product?.id],
    queryFn: async () => {
      if (!product?.id) return null;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', product.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!product?.id,
  });

  // Use the fetched product data for current stock, fallback to prop
  const currentStock = currentProduct?.current_stock ?? 0;

  // Fetch stock history for this product
  const { data: stockHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['product-stock-history', product?.id],
    queryFn: () => getProductStockHistory(product!.id),
    enabled: !!product?.id && showStockHistory,
  });

  // Initialize form when product changes
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || '',
        pack_type: product.pack_type || '',
        client_note: product.client_note || '',
        remarks: product.remarks || '',
      });
      setTags(product.tags || []);
      
      // Set ingredients and compounds from product
      if (product.product_ingredients) {
        const ingredients = product.product_ingredients.map(pi => ({
          id: pi.id,
          ingredient_id: pi.ingredient_id,
          quantity: pi.quantity,
        }));
        setProductIngredients(ingredients);
      }
      
      if (product.product_compounds) {
        const compounds = product.product_compounds.map(pc => ({
          id: pc.id,
          compound_id: pc.compound_id,
          quantity: pc.quantity,
        }));
        setProductCompounds(compounds);
      }
    } else {
      form.reset({
        name: '',
        description: '',
        pack_type: '',
        client_note: '',
        remarks: '',
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
        description: formData.description || null,
        pack_type: formData.pack_type || null,
        client_note: formData.client_note || null,
        remarks: formData.remarks || null,
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

      const compound = compounds.find(c => c.id === selectedCompound);
      if (!compound) return;

      setProductCompounds([
        ...productCompounds,
        {
          id: Date.now().toString(),
          compound_id: selectedCompound,
          quantity,
          compound_name: compound.name,
        },
      ]);
      setSelectedCompound('');
      setCompoundQuantity('1');
    }
  };

  const updateCompoundQuantity = (compoundId: string, quantity: number) => {
    setProductCompounds(productCompounds.map(pc => 
      pc.compound_id === compoundId 
        ? { ...pc, quantity }
        : pc
    ));
  };

  const removeCompound = (compoundId: string) => {
    setProductCompounds(productCompounds.filter(pc => pc.compound_id !== compoundId));
  };

  // Stock management functions
  const handleAddStock = async (e?: React.FormEvent) => {
    console.log('handleAddStock called!');
    e?.preventDefault();
    if (!product?.id || !addStockQty || !selectedCategoryId) {
      console.log('Early return - missing data:', { 
        hasProductId: !!product?.id, 
        hasQuantity: !!addStockQty, 
        hasCategoryId: !!selectedCategoryId 
      });
      return;
    }
    setAddStockLoading(true);
    
    // DEBUG: Check database state before adding stock
    console.log('=== DEBUGGING BEFORE ADDING STOCK ===');
    console.log('Product ID:', product.id);
    console.log('Category ID:', selectedCategoryId);
    console.log('Quantity:', addStockQty);
    
    try {
      const { data: checkProductPrice } = await supabase
        .from('product_prices')
        .select('*')
        .eq('product_id', product.id)
        .eq('category_id', selectedCategoryId);
        
      console.log('Product price check result:', checkProductPrice);
      
      const { data: allProductPrices } = await supabase
        .from('product_prices')
        .select('*')
        .eq('product_id', product.id);
        
      console.log('All product prices for this product:', allProductPrices);
      
      const { data: checkStockAllocation } = await supabase
        .from('stock_allocation')
        .select('*')
        .eq('stock_type', 'PRODUCT')
        .limit(5);
        
      console.log('Sample stock allocations:', checkStockAllocation);
      
      await addProductStock({
        product_id: product.id,
        category_id: selectedCategoryId,
        quantity: parseFloat(addStockQty),
      });
      toast({ title: 'Success', description: 'Stock added successfully.' });
      setAddStockQty('');
      setSelectedCategoryId('');
      setShowAddStock(false);
      // Only invalidate the product query, not the whole list
      queryClient.invalidateQueries({ queryKey: ['product', product.id] });
    } catch (error) {
      console.error('Error adding stock:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add stock';
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setAddStockLoading(false);
    }
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Product Details</TabsTrigger>
                <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                <TabsTrigger value="compounds">Compounds</TabsTrigger>
                <TabsTrigger value="stock">Stock Management</TabsTrigger>
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
                  onUpdateQuantity={updateCompoundQuantity}
                  onRemoveCompound={removeCompound}
                />
              </TabsContent>

              {/* Stock Management Tab */}
              <TabsContent value="stock" className="space-y-4">
                {product ? (
                  <div className="space-y-4">
                    {/* Current Stock Display */}
                    <div className="flex items-center gap-4">
                      <div className="font-medium">
                        Current Stock: 
                        <span className="text-blue-700 ml-2">
                          {isLoadingProduct ? 'Loading...' : currentStock}
                        </span>
                      </div>
                      {!isReadOnly && (
                        <Button 
                          type="button"
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowAddStock(v => !v);
                          }}
                        >
                          {showAddStock ? 'Cancel' : 'Add Stock'}
                        </Button>
                      )}
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowStockHistory(v => !v);
                        }}
                      >
                        {showStockHistory ? 'Hide History' : 'Show History'}
                      </Button>
                    </div>
                    
                    {/* Stock History */}
                    {showStockHistory && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <h4 className="font-medium mb-2">Stock Transaction History</h4>
                        {isLoadingHistory ? (
                          <div className="text-sm text-gray-500">Loading history...</div>
                        ) : stockHistory?.data && stockHistory.data.length > 0 ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {stockHistory.data.map((transaction) => (
                              <div key={transaction.stock_entry_id} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    transaction.stock_entry_type === 'INWARD' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {transaction.stock_entry_type}
                                  </span>
                                  <span>{transaction.quantity_allocated}</span>
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {new Date(transaction.allocation_date).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No transaction history</div>
                        )}
                      </div>
                    )}

                    {/* Add Stock Form */}
                    {showAddStock && (
                      <form onSubmit={handleAddStock} className="space-y-3">
                        <div className="flex gap-2 items-end">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Quantity to Add</label>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={addStockQty}
                              onChange={e => setAddStockQty(e.target.value)}
                              placeholder="Enter quantity"
                              required
                              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <select
                              value={selectedCategoryId}
                              onChange={e => setSelectedCategoryId(e.target.value)}
                              required
                              className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select category</option>
                              {categories.map((category: any) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Button 
                            type="submit" 
                            size="sm" 
                            disabled={addStockLoading}
                            onClick={() => console.log('Add Stock button clicked!')}
                          >
                            {addStockLoading ? 'Adding...' : 'Add'}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Please save the product first to manage stock.
                  </div>
                )}
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
