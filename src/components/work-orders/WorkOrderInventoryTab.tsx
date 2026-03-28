
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

// Type definitions for database tables not in generated types
interface Ingredient {
  id: string;
  name: string;
  unit_of_measurement: string | null;
}

interface ProductIngredient {
  ingredient_id: string;
  quantity: number;
  product_id: string;
  ingredients: Ingredient;
}

interface CompoundIngredient {
  ingredient_id: string;
  quantity: number;
  ingredients: Ingredient;
}

interface Compound {
  id: string;
  name: string;
  compound_ingredients: CompoundIngredient[];
}

interface ProductCompound {
  compound_id: string;
  quantity: number;
  product_id: string;
  compounds: Compound;
}

interface WorkOrderInventoryTabProps {
  formData: WorkOrderFormData;
  onNext: () => void;
  onPrevious: () => void;
  isReadOnly: boolean;
}

interface ProductInfo {
  id: string;
  product_id: string;
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

interface CompoundInfo {
  id: string;
  name: string;
  quantities: {
    [productId: string]: number; // productId -> quantity in kg
  };
  total_quantity: number; // in kg
}

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
      const products: ProductInfo[] = formData.products.map((wop, index) => ({
        id: (wop as any).id || `${wop.product_id}-${index}`,
        product_id: wop.product_id,
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
        .in('product_id', productIds) as { data: ProductIngredient[] | null; error: any };

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
        .in('product_id', productIds) as { data: ProductCompound[] | null; error: any };

      if (pcError) throw pcError;

      // Initialize compound and ingredient maps
      const compoundMap = new Map<string, CompoundInfo>();
      const ingredientMap = new Map<string, IngredientInfo>();

      // Process compounds first
      productCompounds?.forEach(pc => {
        if (!pc.compounds) return;

        const productRows = products.filter(p => p.product_id === pc.product_id);
        if (productRows.length === 0) return;

        const compoundId = pc.compound_id;

        productRows.forEach(productRow => {
          const pouchDerivedWeight = (productRow.pouch_size * productRow.number_of_pouches) / 1000;
          const totalProductWeight = Number.isFinite(pouchDerivedWeight) && pouchDerivedWeight > 0
            ? pouchDerivedWeight
            : (Number.isFinite(productRow.total_weight) && productRow.total_weight > 0 ? productRow.total_weight : 0);
          const compoundWeightPerKg = (pc.quantity || 0) / 5;
          const totalCompoundWeight = compoundWeightPerKg * totalProductWeight;
          const quantityInKg = convertToKg(totalCompoundWeight, 'g');
        
          if (!compoundMap.has(compoundId)) {
            compoundMap.set(compoundId, {
              id: compoundId,
              name: pc.compounds.name,
              quantities: {},
              total_quantity: 0
            });
          }
          
          const compound = compoundMap.get(compoundId)!;
          compound.quantities[productRow.id] = (compound.quantities[productRow.id] || 0) + quantityInKg;
          compound.total_quantity += quantityInKg;
        });
      });

      // Process direct product ingredients (excluding those that are part of compounds)
      productIngredients?.forEach(pi => {
        if (!pi.ingredients) return;

        const productRows = products.filter(p => p.product_id === pi.product_id);
        if (productRows.length === 0) return;

        const ingredientId = pi.ingredient_id;
        const unit = pi.ingredients.unit_of_measurement || 'kg';

        productRows.forEach(productRow => {
          // Calculate total ingredient weight based on work order product weight
          // product_ingredients.quantity is stored for 10kg of product, so divide by 10 to get per kg
          const pouchDerivedWeight = (productRow.pouch_size * productRow.number_of_pouches) / 1000;
          const totalProductWeight = Number.isFinite(pouchDerivedWeight) && pouchDerivedWeight > 0
            ? pouchDerivedWeight
            : (Number.isFinite(productRow.total_weight) && productRow.total_weight > 0 ? productRow.total_weight : 0);
          const ingredientWeightPerKg = (pi.quantity || 0) / 10;
          const totalIngredientWeight = ingredientWeightPerKg * totalProductWeight;
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
          ingredient.quantities[productRow.id] = (ingredient.quantities[productRow.id] || 0) + quantityInKg;
          ingredient.total_quantity += quantityInKg;
        });
      });

      // Convert maps to arrays and sort by name
      const compounds = Array.from(compoundMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      const ingredients = Array.from(ingredientMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      return { products, compounds, ingredients };
    },
    enabled: formData.products.length > 0,
  });

  const { products = [], compounds = [], ingredients = [] } = data || {};

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
      <div className="space-y-6">
        {/* Compounds Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Compound Requirements</h3>
          <p className="text-sm text-gray-600">
            Compounds needed to fulfill this work order based on selected products and their quantities.
          </p>
          
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading compound requirements...
            </div>
          ) : compounds.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No compounds found for the selected products.
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Compound</TableHead>
                    {products.map(product => (
                      <TableHead key={product.id} className="text-right min-w-[150px]">
                        <div className="flex flex-col">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs text-gray-500">
                            {((product.number_of_pouches * product.pouch_size)).toFixed(0)} g
                          </span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-right min-w-[150px] font-medium bg-gray-50">
                      <div className="flex flex-col">
                        <span>Total Required</span>
                        <span className="text-xs text-gray-500">g</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compounds.map((compound) => (
                    <TableRow key={compound.id}>
                      <TableCell className="font-medium">
                        {compound.name}
                      </TableCell>
                      {products.map(product => (
                        <TableCell key={`${compound.id}-${product.id}`} className="text-right">
                          {(compound.quantities[product.id] * 1000)?.toFixed(0) || '-'}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-medium bg-gray-50">
                        {(compound.total_quantity * 1000).toFixed(0)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Compounds Totals row */}
                  <TableRow className="bg-gray-50">
                    <TableCell className="font-medium">
                      <span>Total</span>
                    </TableCell>
                    {products.map(product => {
                      const total = compounds.reduce(
                        (sum, comp) => sum + (comp.quantities[product.id] || 0), 
                        0
                      );
                      return (
                        <TableCell key={`total-comp-${product.id}`} className="text-right font-medium">
                          {(total * 1000).toFixed(0)}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-bold">
                      {(compounds.reduce((sum, comp) => sum + comp.total_quantity, 0) * 1000).toFixed(0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Ingredients Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Ingredient Requirements</h3>
          <p className="text-sm text-gray-600">
            Direct ingredients needed to fulfill this work order based on selected products and their quantities.
          </p>
          
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading ingredient requirements...
            </div>
          ) : ingredients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No direct ingredients found for the selected products.
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
                            {((product.number_of_pouches * product.pouch_size)).toFixed(0)} g
                          </span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-right min-w-[150px] font-medium bg-gray-50">
                      <div className="flex flex-col">
                        <span>Total Required</span>
                        <span className="text-xs text-gray-500">g</span>
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
                          {(ingredient.quantities[product.id] * 1000)?.toFixed(0) || '-'}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-medium bg-gray-50">
                        {(ingredient.total_quantity * 1000).toFixed(0)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Ingredients Totals row */}
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
                        <TableCell key={`total-ing-${product.id}`} className="text-right font-medium">
                          {(total * 1000).toFixed(0)}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-bold">
                      {(ingredients.reduce((sum, ing) => sum + ing.total_quantity, 0) * 1000).toFixed(0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </div>
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
