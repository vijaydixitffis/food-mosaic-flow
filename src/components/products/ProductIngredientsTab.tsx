
import React from 'react';
import { FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Ingredient = Database['public']['Tables']['ingredients']['Row'];

interface ProductIngredient {
  ingredient_id: string;
  quantity: number;
  ingredient_name?: string;
}

interface ProductIngredientsTabProps {
  ingredients: Ingredient[];
  productIngredients: ProductIngredient[];
  selectedIngredient: string;
  ingredientQuantity: string;
  onSelectedIngredientChange: (value: string) => void;
  onIngredientQuantityChange: (value: string) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (ingredientId: string) => void;
}

export function ProductIngredientsTab({
  ingredients,
  productIngredients,
  selectedIngredient,
  ingredientQuantity,
  onSelectedIngredientChange,
  onIngredientQuantityChange,
  onAddIngredient,
  onRemoveIngredient,
}: ProductIngredientsTabProps) {
  return (
    <div className="space-y-4">
      <FormLabel>Product Ingredients * (Add at least one ingredient or compound)</FormLabel>
      
      {/* Add Ingredient */}
      <div className="flex gap-2">
        <Select value={selectedIngredient} onValueChange={onSelectedIngredientChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select ingredient" />
          </SelectTrigger>
          <SelectContent>
            {ingredients.map((ingredient) => (
              <SelectItem key={ingredient.id} value={ingredient.id}>
                {ingredient.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          step="0.001"
          placeholder="Quantity"
          value={ingredientQuantity}
          onChange={(e) => onIngredientQuantityChange(e.target.value)}
          className="w-24"
        />
        <Button type="button" onClick={onAddIngredient} size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Selected Ingredients */}
      {productIngredients.length > 0 && (
        <div className="space-y-2">
          {productIngredients.map((pi) => (
            <div key={pi.ingredient_id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-sm">
                {pi.ingredient_name} - Quantity: {pi.quantity}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveIngredient(pi.ingredient_id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
