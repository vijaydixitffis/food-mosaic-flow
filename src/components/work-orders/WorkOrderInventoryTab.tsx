
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { WorkOrderFormData } from './WorkOrderDialog';

interface WorkOrderInventoryTabProps {
  formData: WorkOrderFormData;
  onNext: () => void;
  onPrevious: () => void;
  isReadOnly: boolean;
}

interface ProductInfo {
  id: string;
  name: string;
  total_weight: number;
  number_of_pouches: number;
  pouch_size: number;
}

// Helper function to convert to kg if the unit is grams
const convertToKg = (value: number, unit: string): number => {
  return unit?.toLowerCase() === 'g' || unit?.toLowerCase() === 'gms' 
    ? value / 1000 
    : value;
};

interface IngredientInfo {
  id: string;
  name: string;
  unit_of_measurement: string;
  quantities: {
    [productId: string]: number; // productId -> quantity in kg
  };
  total_quantity: number; // in kg
}

export function WorkOrderInventoryTab({
  formData,
  onNext,
  onPrevious,
  isReadOnly,
}: WorkOrderInventoryTabProps) {
  // Fetch detailed product information and ingredient requirements
  const { data, isLoading } = useQuery({
    queryKey: ['work-order-ingredients-matrix', formData.products],
    queryFn: async () => {
      if (formData.products.length === 0) return { products: [], ingredients: [] };

      // Get product details
      const productIds = formData.products.map(p => p.product_id);
      const { data: productDetails, error: productError } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      if (productError) throw productError;

      // Create product info map with pouch information
      const products: ProductInfo[] = formData.products.map(wop => ({
        id: wop.product_id,
        name: productDetails?.find(p => p.id === wop.product_id)?.name || `Product ${wop.product_id}`,
        total_weight: wop.total_weight,
        number_of_pouches: wop.number_of_pouches,
        pouch_size: wop.pouch_size
      }));

      // Get all ingredients from products and compounds
      const { data: productIngredients, error: piError } = await supabase
        .from('product_ingredients')
        .select(`
          ingredient_id,
          quantity,
          product_id,
          ingredients:ingredient_id (
            id,
            name,
            unit_of_measurement
          )
        `)
        .in('product_id', productIds);

      if (piError) throw piError;

      // Get compound ingredients
      const { data: productCompounds, error: pcError } = await supabase
        .from('product_compounds')
        .select(`
          compound_id,
          quantity,
          product_id,
          compounds:compound_id (
            id,
            name,
            compound_ingredients (
              ingredient_id,
              quantity,
              ingredients:ingredient_id (
                id,
                name,
                unit_of_measurement
              )
            )
          )
        `)
        .in('product_id', productIds);

      if (pcError) throw pcError;

      // Initialize ingredient map
      const ingredientMap = new Map<string, IngredientInfo>();

      // Process direct product ingredients
      productIngredients?.forEach(pi => {
        if (!pi.ingredients) return;
        
        const product = products.find(p => p.id === pi.product_id);
        if (!product) return;

        const ingredientId = pi.ingredient_id;
        const unit = pi.ingredients.unit_of_measurement || 'kg';
        // Calculate total ingredient weight using the formula: (ingredient_weight / 1000) * [(pouch_size * number_of_pouches) / 1000]
        const totalProductWeight = (product.pouch_size * product.number_of_pouches) / 1000; // Convert total product weight to kg
        const totalIngredientWeight = (pi.quantity || 0) * totalProductWeight;
        const quantityInKg = convertToKg(totalIngredientWeight, unit);
        
        if (!ingredientMap.has(ingredientId)) {
          ingredientMap.set(ingredientId, {
            id: ingredientId,
            name: pi.ingredients.name,
            unit_of_measurement: 'kg', // Always use kg after conversion
            quantities: {},
            total_quantity: 0
          });
        }
        
        const ingredient = ingredientMap.get(ingredientId)!;
        ingredient.quantities[product.id] = (ingredient.quantities[product.id] || 0) + quantityInKg;
        ingredient.total_quantity += quantityInKg;
      });

      // Process compound ingredients
      productCompounds?.forEach(pc => {
        if (!pc.compounds || !Array.isArray(pc.compounds.compound_ingredients)) return;
        
        const product = products.find(p => p.id === pc.product_id);
        if (!product) return;

        pc.compounds.compound_ingredients.forEach(ci => {
          if (!ci.ingredients) return;
          
          const ingredientId = ci.ingredient_id;
          const unit = ci.ingredients.unit_of_measurement || 'kg';
          // Calculate total ingredient weight using the formula: (ingredient_weight / 1000) * [(pouch_size * number_of_pouches) / 1000]
          // Note: pc.quantity is already accounted for in the product weight calculation
          const totalProductWeight = (product.pouch_size * product.number_of_pouches) / 1000; // Convert total product weight to kg
          const totalIngredientWeight = (ci.quantity || 0) * totalProductWeight;
          const quantityInKg = convertToKg(totalIngredientWeight, unit);
          
          if (!ingredientMap.has(ingredientId)) {
            ingredientMap.set(ingredientId, {
              id: ingredientId,
              name: ci.ingredients.name,
              unit_of_measurement: 'kg', // Always use kg after conversion
              quantities: {},
              total_quantity: 0
            });
          }
          
          const ingredient = ingredientMap.get(ingredientId)!;
          ingredient.quantities[product.id] = (ingredient.quantities[product.id] || 0) + quantityInKg;
          ingredient.total_quantity += quantityInKg;
        });
      });

      // Convert map to array and sort by ingredient name
      const ingredients = Array.from(ingredientMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      return { products, ingredients };
    },
    enabled: formData.products.length > 0,
  });

  const { products = [], ingredients = [] } = data || {};

  if (formData.products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-gray-500">
          No products selected. Please add products in the previous step to view ingredient requirements.
        </div>
        
        {!isReadOnly && (
          <div className="flex justify-between">
            <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button 
              onClick={onNext} 
              disabled={true}
              className="flex items-center gap-2"
            >
              Next: Recipes
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Ingredient Requirements</h3>
        <p className="text-sm text-gray-600">
          Total ingredients needed to fulfill this work order based on selected products and their quantities.
        </p>
        
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Loading ingredient requirements...
          </div>
        ) : ingredients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No ingredients found for the selected products.
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Ingredient</TableHead>
                  {products.map(product => (
                    <TableHead key={product.id} className="text-right min-w-[150px]">
                      <div className="flex flex-col">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-xs text-gray-500">
                          {((product.number_of_pouches * product.pouch_size) / 1000).toFixed(2)} kg
                        </span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-right min-w-[150px] font-medium bg-gray-50">
                    <div className="flex flex-col">
                      <span>Total Required</span>
                      <span className="text-xs text-gray-500">kg</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">
                      {ingredient.name}
                    </TableCell>
                    {products.map(product => (
                      <TableCell key={`${ingredient.id}-${product.id}`} className="text-right">
                        {ingredient.quantities[product.id]?.toFixed(2) || '-'}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-medium bg-gray-50">
                      {ingredient.total_quantity.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-gray-50">
                  <TableCell className="font-medium">
                    <span>Total</span>
                  </TableCell>
                  {products.map(product => {
                    const total = ingredients.reduce(
                      (sum, ing) => sum + (ing.quantities[product.id] || 0), 
                      0
                    );
                    return (
                      <TableCell key={`total-${product.id}`} className="text-right font-medium">
                        {total.toFixed(2)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right font-bold">
                    {ingredients.reduce((sum, ing) => sum + ing.total_quantity, 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {!isReadOnly && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button 
            onClick={onNext} 
            className="flex items-center gap-2"
          >
            Next: Recipes
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
