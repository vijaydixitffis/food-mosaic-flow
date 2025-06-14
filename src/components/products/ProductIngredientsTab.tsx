import React, { useState } from 'react';
import { FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, Search } from 'lucide-react';
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
  const [searchValue, setSearchValue] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filteredIngredients = searchValue.length >= 2
    ? ingredients.filter(ingredient => 
        ingredient.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    : [];

  const selectedIngredientName = selectedIngredient
    ? ingredients.find(i => i.id === selectedIngredient)?.name
    : '';

  const handleIngredientSelect = (ingredientId: string) => {
    onSelectedIngredientChange(ingredientId);
    setSearchValue('');
    setShowResults(false);
  };

  const handleAddClick = () => {
    if (!selectedIngredient) {
      return;
    }
    onAddIngredient();
    setSearchValue('');
    onSelectedIngredientChange('');
    onIngredientQuantityChange('1');
  };

  return (
    <div className="space-y-4">
      <FormLabel>Product Ingredients * (Add at least one ingredient or compound)</FormLabel>
      
      {/* Add Ingredient */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder={selectedIngredient ? selectedIngredientName : "Type at least 2 characters to search ingredients..."}
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="pl-10"
          />
          {showResults && searchValue.length >= 2 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredIngredients.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">No ingredients found</div>
              ) : (
                <div className="py-1">
                  {filteredIngredients.map((ingredient) => (
                    <button
                      key={ingredient.id}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      onClick={() => handleIngredientSelect(ingredient.id)}
                    >
                      {ingredient.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <Input
          type="number"
          step="0.001"
          placeholder="Quantity"
          value={ingredientQuantity}
          onChange={(e) => onIngredientQuantityChange(e.target.value)}
          className="w-24"
          disabled={!selectedIngredient}
        />
        <Button 
          type="button" 
          onClick={handleAddClick} 
          size="sm"
          disabled={!selectedIngredient || !ingredientQuantity}
        >
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
