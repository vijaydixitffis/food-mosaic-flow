import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { allocateProductStock } from '@/integrations/supabase/stock';

interface ProductWithStockAndAllocation {
  id: string; // order_product id
  product_id: string;
  product_name: string;
  quantity_ordered: number; // number_of_pouches from order_products
  stock: number | null;
  allocated_quantity: number;
}

interface OrderStockAllocationTabProps {
  productsWithStockAndAllocation: ProductWithStockAndAllocation[];
  orderId: string | undefined; // Pass the order ID
  onAllocateStock: (productId: string, allocatedQuantity: number) => void;
  isReadOnly: boolean;
}

export function OrderStockAllocationTab({
  productsWithStockAndAllocation,
  orderId,
  onAllocateStock,
  isReadOnly,
}: OrderStockAllocationTabProps) {
  const [allocationQuantities, setAllocationQuantities] = useState<{
    [productId: string]: number;
  }>({});
  const { toast } = useToast();

  const handleInputChange = (productId: string, value: string) => {
    const quantity = parseFloat(value);
    setAllocationQuantities({
      ...allocationQuantities,
      [productId]: isNaN(quantity) ? 0 : quantity,
    });
  };

  const handleAllocateClick = (product: ProductWithStockAndAllocation) => {
    if (!orderId) {
      toast({
        title: 'Error',
        description: 'Order ID is missing for allocation.',
        variant: 'destructive',
      });
      return;
    }

    const quantityToAllocate = allocationQuantities[product.product_id] || 0;

    if (quantityToAllocate <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a quantity greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    if (product.stock !== null && quantityToAllocate > product.stock) {
      toast({
        title: 'Validation Error',
        description: `Allocated quantity for ${product.product_name} exceeds available stock (${product.stock}).`,
        variant: 'destructive',
      });
      return;
    }

    // Clear the input field after allocation
    setAllocationQuantities({
        ...allocationQuantities,
        [product.product_id]: 0,
      });


    onAllocateStock(product.product_id, quantityToAllocate);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Finished Goods Stock Allocation</h3>
        <p className="text-sm text-gray-600">Allocate finished products from stock to this order.</p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Ordered Qty</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Allocated Qty</TableHead>
              {!isReadOnly && <TableHead>Allocate</TableHead>}
              {!isReadOnly && <TableHead>Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsWithStockAndAllocation.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isReadOnly ? 4 : 6} className="text-center">
                  No products in this order or stock data not available.
                </TableCell>
              </TableRow>
            ) : (
              productsWithStockAndAllocation.map((product) => (
                <TableRow key={product.product_id}>
                  <TableCell className="font-medium">{product.product_name}</TableCell>
                  <TableCell>{product.quantity_ordered}</TableCell>
                  <TableCell>{product.stock !== null ? product.stock : 'N/A'}</TableCell>
                  <TableCell>{product.allocated_quantity}</TableCell>
                  {!isReadOnly && (
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={allocationQuantities[product.product_id] || ''}
                        onChange={(e) =>
                          handleInputChange(product.product_id, e.target.value)
                        }
                        className="w-24"
                        disabled={isReadOnly}
                      />
                    </TableCell>
                  )}
                  {!isReadOnly && (
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleAllocateClick(product)}
                        disabled={isReadOnly || (allocationQuantities[product.product_id] || 0) <= 0}
                      >
                        Allocate
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}