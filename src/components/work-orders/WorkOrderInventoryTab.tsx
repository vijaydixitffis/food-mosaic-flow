
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

interface IngredientRequirement {
  ingredient_id: string;
  ingredient_name: string;
  total_quantity: number;
  unit_of_measurement: string;
}

export function WorkOrderInventoryTab({
  formData,
  onNext,
  onPrevious,
  isReadOnly,
}: WorkOrderInventoryTabProps) {
  // Fetch ingredients needed for all selected products
  const { data: ingredientRequirements = [], isLoading } = useQuery({
    queryKey: ['work-order-ingredients', formData.products.map(p => p.product_id)],
    queryFn: async () => {
      if (formData.products.length === 0) return [];

      const productIds = formData.products.map(p => p.product_id);
      
      // Get ingredients from products
      const { data: productIngredients, error: productError } = await supabase
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

      if (productError) throw productError;

      // Get ingredients from compounds used in products
      const { data: productCompounds, error: compoundError } = await supabase
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

      if (compoundError) throw compoundError;

      // Calculate total ingredient requirements
      const ingredientMap = new Map<string, IngredientRequirement>();

      // Process direct product ingredients
      productIngredients?.forEach(pi => {
        const workOrderProduct = formData.products.find(p => p.product_id === pi.product_id);
        if (!workOrderProduct || !pi.ingredients) return;

        const totalQuantity = pi.quantity * workOrderProduct.total_weight;
        const ingredientId = pi.ingredient_id;
        
        if (ingredientMap.has(ingredientId)) {
          const existing = ingredientMap.get(ingredientId)!;
          existing.total_quantity += totalQuantity;
        } else {
          ingredientMap.set(ingredientId, {
            ingredient_id: ingredientId,
            ingredient_name: pi.ingredients.name,
            total_quantity: totalQuantity,
            unit_of_measurement: pi.ingredients.unit_of_measurement || 'kg',
          });
        }
      });

      // Process compound ingredients
      if (productCompounds) {
        for (const pc of productCompounds) {
          const workOrderProduct = formData.products.find(p => p.product_id === pc.product_id);
          if (!workOrderProduct || !pc.compounds) continue;
          
          const compoundIngredients = pc.compounds.compound_ingredients;
          if (!Array.isArray(compoundIngredients)) continue;
          
          const compoundQuantity = pc.quantity || 0;
          
          for (const ci of compoundIngredients) {
            if (!ci.ingredients) continue;
            
            const totalQuantity = (ci.quantity || 0) * compoundQuantity * (workOrderProduct.total_weight || 1);
            const ingredientId = ci.ingredient_id;
            
            if (ingredientMap.has(ingredientId)) {
              const existing = ingredientMap.get(ingredientId)!;
              existing.total_quantity += totalQuantity;
            } else {
              ingredientMap.set(ingredientId, {
                ingredient_id: ingredientId,
                ingredient_name: ci.ingredients?.name || 'Unknown Ingredient',
                total_quantity: totalQuantity,
                unit_of_measurement: ci.ingredients?.unit_of_measurement || 'kg',
              });
            }
          }
        }
      }

      return Array.from(ingredientMap.values()).sort((a, b) => 
        a.ingredient_name.localeCompare(b.ingredient_name)
      );
    },
    enabled: formData.products.length > 0,
  });

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
        ) : ingredientRequirements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No ingredients found for the selected products.
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Total Quantity Required</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredientRequirements.map((ingredient) => (
                  <TableRow key={ingredient.ingredient_id}>
                    <TableCell className="font-medium">
                      {ingredient.ingredient_name}
                    </TableCell>
                    <TableCell>{ingredient.total_quantity.toFixed(2)}</TableCell>
                    <TableCell>{ingredient.unit_of_measurement}</TableCell>
                  </TableRow>
                ))}
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
