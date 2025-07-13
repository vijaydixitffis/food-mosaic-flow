import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getStockAllocationsByWorkOrder } from '@/integrations/supabase/stock';
import { supabase } from '@/integrations/supabase/client';

interface RequiredIngredientWithStock {
  id: string;
  name: string;
  unit_of_measurement: string | null;
  required_quantity: number;
  stock: number;
}

interface WorkOrderIngredientsTabProps {
  workOrderId: string | null;
  requiredIngredientsWithStock: RequiredIngredientWithStock[];
  onAllocateStock: (ingredientId: string, quantity: number) => void;
  isReadOnly: boolean;
}

export function WorkOrderIngredientsTab({
  workOrderId,
  requiredIngredientsWithStock,
  onAllocateStock,
  isReadOnly,
}: WorkOrderIngredientsTabProps) {
  const [allocationQuantities, setAllocationQuantities] = useState<{ [ingredientId: string]: string }>({});
  const { toast } = useToast();

  // Fetch stock allocations for this work order
  const { data: stockAllocations } = useQuery({
    queryKey: ['stock-allocations', workOrderId],
    queryFn: async () => {
      if (!workOrderId) return { data: [] };
      return await getStockAllocationsByWorkOrder(workOrderId);
    },
    enabled: !!workOrderId,
  });

  // Calculate allocated quantities for each ingredient
  const getAllocatedQuantity = (ingredientId: string): number => {
    if (!stockAllocations?.data) return 0;
    return stockAllocations.data
      .filter(allocation => 
        allocation.stock_item_id === ingredientId && 
        allocation.stock_type === 'INGREDIENT'
      )
      .reduce((sum, allocation) => sum + allocation.quantity_allocated, 0);
  };

  const handleQuantityChange = (ingredientId: string, value: string) => {
    setAllocationQuantities(prev => ({
      ...prev,
      [ingredientId]: value,
    }));
  };

  const handleAllocate = (ingredient: RequiredIngredientWithStock) => {
    if (!workOrderId) {
      toast({
        title: 'Error',
        description: 'Work Order ID is missing.',
        variant: 'destructive',
      });
      return;
    }

    const quantityToAllocate = parseFloat(allocationQuantities[ingredient.id] || '0');

    if (isNaN(quantityToAllocate) || quantityToAllocate <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid quantity to allocate.',
        variant: 'destructive',
      });
      return;
    }

    if (quantityToAllocate > ingredient.stock) {
      toast({
        title: 'Validation Error',
        description: `Cannot allocate more than available stock for ${ingredient.name}. Available: ${ingredient.stock}`,
        variant: 'destructive',
      });
      return;
    }

    onAllocateStock(ingredient.id, quantityToAllocate);
    setAllocationQuantities(prev => ({
      ...prev,
      [ingredient.id]: '', // Clear the input after allocation
    }));
  };

  return (
    <div className="space-y-4">
      {requiredIngredientsWithStock.length === 0 ? (
        <div className="text-center text-gray-500">No ingredients required for this work order's products.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingredient</TableHead>
              <TableHead>Required Quantity</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Allocated</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Allocate Quantity</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requiredIngredientsWithStock.map(ingredient => {
              const allocatedQuantity = getAllocatedQuantity(ingredient.id);
              const remainingRequired = Math.max(0, ingredient.required_quantity - allocatedQuantity);
              const availableForAllocation = Math.min(ingredient.stock, remainingRequired);
              const stockStatus = ingredient.stock >= ingredient.required_quantity ? 'sufficient' : 'insufficient';
              
              return (
                <TableRow key={ingredient.id}>
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  <TableCell>
                    {ingredient.required_quantity} {ingredient.unit_of_measurement}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{ingredient.stock} {ingredient.unit_of_measurement}</span>
                      <Badge variant={stockStatus === 'sufficient' ? 'default' : 'destructive'}>
                        {stockStatus === 'sufficient' ? 'Sufficient' : 'Insufficient'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {allocatedQuantity} {ingredient.unit_of_measurement}
                  </TableCell>
                  <TableCell>
                    <span className={remainingRequired > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                      {remainingRequired} {ingredient.unit_of_measurement}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={allocationQuantities[ingredient.id] || ''}
                      onChange={(e) => handleQuantityChange(ingredient.id, e.target.value)}
                      disabled={isReadOnly || ingredient.stock <= 0 || remainingRequired <= 0}
                      min="0"
                      max={availableForAllocation}
                      step="any"
                      className="w-32"
                      placeholder={`Max: ${availableForAllocation}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleAllocate(ingredient)}
                      disabled={
                        isReadOnly || 
                        ingredient.stock <= 0 || 
                        remainingRequired <= 0 ||
                        parseFloat(allocationQuantities[ingredient.id] || '0') <= 0 ||
                        parseFloat(allocationQuantities[ingredient.id] || '0') > availableForAllocation
                      }
                    >
                      Allocate
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}