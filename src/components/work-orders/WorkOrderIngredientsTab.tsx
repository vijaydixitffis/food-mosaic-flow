import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

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
  onAllocateStock: (ingredientId: string, workOrderId: string, quantity: number) => void;
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

    onAllocateStock(ingredient.id, workOrderId, quantityToAllocate);
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
              <TableHead>Allocate Quantity</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requiredIngredientsWithStock.map(ingredient => (
              <TableRow key={ingredient.id}>
                <TableCell className="font-medium">{ingredient.name}</TableCell>
                <TableCell>{ingredient.required_quantity} {ingredient.unit_of_measurement}</TableCell>
                <TableCell>{ingredient.stock} {ingredient.unit_of_measurement}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={allocationQuantities[ingredient.id] || ''}
                    onChange={(e) => handleQuantityChange(ingredient.id, e.target.value)}
                    disabled={isReadOnly || ingredient.stock <= 0}
                    min="0"
                    max={ingredient.stock}
                    step="any"
                    className="w-32"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => handleAllocate(ingredient)}
                    disabled={isReadOnly || ingredient.stock <= 0 || parseFloat(allocationQuantities[ingredient.id] || '0') <= 0}
                  >
                    Allocate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}