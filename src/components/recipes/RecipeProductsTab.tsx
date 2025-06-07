
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

interface RecipeProduct {
  product_id: string;
  product_name?: string;
}

interface RecipeProductsTabProps {
  products: Product[];
  recipeProducts: RecipeProduct[];
  onRecipeProductsChange: (products: RecipeProduct[]) => void;
  isReadOnly: boolean;
}

export function RecipeProductsTab({
  products,
  recipeProducts,
  onRecipeProductsChange,
  isReadOnly,
}: RecipeProductsTabProps) {
  const [selectedProduct, setSelectedProduct] = useState('');

  const addProduct = () => {
    if (!selectedProduct) return;

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    // Check if product is already added
    if (recipeProducts.some(rp => rp.product_id === selectedProduct)) {
      return;
    }

    const newRecipeProduct: RecipeProduct = {
      product_id: selectedProduct,
      product_name: product.name,
    };

    onRecipeProductsChange([...recipeProducts, newRecipeProduct]);
    setSelectedProduct('');
  };

  const removeProduct = (productId: string) => {
    onRecipeProductsChange(recipeProducts.filter(rp => rp.product_id !== productId));
  };

  const availableProducts = products.filter(
    product => !recipeProducts.some(rp => rp.product_id === product.id)
  );

  return (
    <div className="space-y-4">
      <Label>Associated Products</Label>
      
      {!isReadOnly && (
        <div className="flex gap-2">
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {availableProducts.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            type="button" 
            onClick={addProduct} 
            size="sm"
            disabled={!selectedProduct}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {recipeProducts.length > 0 ? (
        <div className="space-y-2">
          {recipeProducts.map((rp) => (
            <div 
              key={rp.product_id} 
              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline">Product</Badge>
                <span className="font-medium">{rp.product_name}</span>
              </div>
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProduct(rp.product_id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          {isReadOnly 
            ? 'No products associated with this recipe'
            : 'No products selected. Choose products that this recipe can manufacture.'
          }
        </div>
      )}
    </div>
  );
}
