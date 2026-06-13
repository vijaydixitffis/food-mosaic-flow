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
import { useToast } from '@/hooks/use-toast';

interface ProductWithStockAndAllocation {
  id: string; // order_product id
  product_id: string;
  product_name: string;
  quantity_ordered: number; // number_of_pouches from order_products
  stock: number | null;
  allocated_quantity: number;
  remaining_quantity: number;
}

interface OrderStockAllocationTabProps {
  productsWithStockAndAllocation: ProductWithStockAndAllocation[];
  orderId: string | undefined;
  onAllocateStock: (
    productId: string,
    quantity: number,
    batchNumber?: string,
    mfgDate?: string,
    expiryDate?: string
  ) => void;
  isReadOnly: boolean;
}

export function OrderStockAllocationTab({
  productsWithStockAndAllocation,
  orderId,
  onAllocateStock,
  isReadOnly,
}: OrderStockAllocationTabProps) {
  const [allocationQuantities, setAllocationQuantities] = useState<Record<string, number>>({});
  const [batchNumbers, setBatchNumbers] = useState<Record<string, string>>({});
  const [mfgDates, setMfgDates] = useState<Record<string, string>>({});
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleAllocateClick = (product: ProductWithStockAndAllocation) => {
    if (!orderId) {
      toast({ title: 'Error', description: 'Order ID is missing for allocation.', variant: 'destructive' });
      return;
    }

    const quantityToAllocate = allocationQuantities[product.product_id] || 0;

    if (quantityToAllocate <= 0) {
      toast({ title: 'Validation Error', description: 'Please enter a quantity greater than 0.', variant: 'destructive' });
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

    const batch = batchNumbers[product.product_id] || undefined;
    const mfg = mfgDates[product.product_id] || undefined;
    const expiry = expiryDates[product.product_id] || undefined;

    // Clear this product's inputs
    setAllocationQuantities((prev) => ({ ...prev, [product.product_id]: 0 }));
    setBatchNumbers((prev) => ({ ...prev, [product.product_id]: '' }));
    setMfgDates((prev) => ({ ...prev, [product.product_id]: '' }));
    setExpiryDates((prev) => ({ ...prev, [product.product_id]: '' }));

    onAllocateStock(product.product_id, quantityToAllocate, batch, mfg, expiry);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Finished Goods Stock Allocation</h3>
        <p className="text-sm text-gray-600">Allocate finished products from stock to this order.</p>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Ordered Qty</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Allocated Qty</TableHead>
              <TableHead>Remaining Qty</TableHead>
              {!isReadOnly && <TableHead>Qty to Allocate</TableHead>}
              {!isReadOnly && <TableHead>Batch No.</TableHead>}
              {!isReadOnly && <TableHead>Mfg Date</TableHead>}
              {!isReadOnly && <TableHead>Expiry</TableHead>}
              {!isReadOnly && <TableHead>Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsWithStockAndAllocation.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isReadOnly ? 5 : 10} className="text-center">
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
                  <TableCell
                    className={product.remaining_quantity < 0 ? 'text-red-600 font-semibold' : ''}
                  >
                    {product.remaining_quantity}
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={allocationQuantities[product.product_id] || ''}
                        onChange={(e) =>
                          setAllocationQuantities((prev) => ({
                            ...prev,
                            [product.product_id]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-24"
                      />
                    </TableCell>
                  )}
                  {!isReadOnly && (
                    <TableCell>
                      <Input
                        type="text"
                        placeholder="Batch No."
                        value={batchNumbers[product.product_id] || ''}
                        onChange={(e) =>
                          setBatchNumbers((prev) => ({
                            ...prev,
                            [product.product_id]: e.target.value,
                          }))
                        }
                        className="w-28"
                      />
                    </TableCell>
                  )}
                  {!isReadOnly && (
                    <TableCell>
                      <Input
                        type="date"
                        value={mfgDates[product.product_id] || ''}
                        onChange={(e) =>
                          setMfgDates((prev) => ({
                            ...prev,
                            [product.product_id]: e.target.value,
                          }))
                        }
                        className="w-36"
                      />
                    </TableCell>
                  )}
                  {!isReadOnly && (
                    <TableCell>
                      <Input
                        type="date"
                        value={expiryDates[product.product_id] || ''}
                        onChange={(e) =>
                          setExpiryDates((prev) => ({
                            ...prev,
                            [product.product_id]: e.target.value,
                          }))
                        }
                        className="w-36"
                      />
                    </TableCell>
                  )}
                  {!isReadOnly && (
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleAllocateClick(product)}
                        disabled={(allocationQuantities[product.product_id] || 0) <= 0}
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
