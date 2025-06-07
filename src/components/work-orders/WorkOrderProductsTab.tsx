
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { WorkOrderFormData } from './WorkOrderDialog';

interface WorkOrderProductsTabProps {
  formData: WorkOrderFormData;
  setFormData: (data: WorkOrderFormData) => void;
  onNext: () => void;
  onPrevious: () => void;
  isReadOnly: boolean;
}

interface Product {
  id: string;
  name: string;
}

export function WorkOrderProductsTab({
  formData,
  setFormData,
  onNext,
  onPrevious,
  isReadOnly,
}: WorkOrderProductsTabProps) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  const [numberOfPouches, setNumberOfPouches] = useState('');
  const { toast } = useToast();

  // Fetch active products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data as Product[];
    },
  });

  const calculatePouchSize = (weight: number, pouches: number) => {
    if (weight > 0 && pouches > 0) {
      return weight / pouches;
    }
    return 0;
  };

  const addProduct = () => {
    if (!selectedProductId || !totalWeight || !numberOfPouches) {
      toast({
        title: "Validation Error",
        description: "Please fill in all product fields",
        variant: "destructive",
      });
      return;
    }

    const weight = parseFloat(totalWeight);
    const pouches = parseInt(numberOfPouches);

    if (weight <= 0 || pouches <= 0) {
      toast({
        title: "Validation Error",
        description: "Weight and number of pouches must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    // Check if product is already added
    if (formData.products.some(p => p.product_id === selectedProductId)) {
      toast({
        title: "Validation Error",
        description: "This product is already added to the work order",
        variant: "destructive",
      });
      return;
    }

    const pouchSize = calculatePouchSize(weight, pouches);

    setFormData({
      ...formData,
      products: [...formData.products, {
        product_id: selectedProductId,
        total_weight: weight,
        number_of_pouches: pouches,
        pouch_size: pouchSize,
      }],
    });

    // Reset form
    setSelectedProductId('');
    setTotalWeight('');
    setNumberOfPouches('');
  };

  const removeProduct = (index: number) => {
    const updatedProducts = formData.products.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      products: updatedProducts,
    });
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const canProceed = formData.products.length > 0;

  return (
    <div className="space-y-6">
      {!isReadOnly && (
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-medium">Add Product to Work Order</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : products.length > 0 ? (
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-products" disabled>No products available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalWeight">Total Weight (kg) *</Label>
              <Input
                id="totalWeight"
                type="number"
                step="0.01"
                min="0"
                value={totalWeight}
                onChange={(e) => setTotalWeight(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfPouches">Number of Pouches *</Label>
              <Input
                id="numberOfPouches"
                type="number"
                min="1"
                value={numberOfPouches}
                onChange={(e) => setNumberOfPouches(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Pouch Size (kg)</Label>
              <div className="px-3 py-2 bg-gray-50 border rounded-md text-sm">
                {totalWeight && numberOfPouches ? 
                  calculatePouchSize(parseFloat(totalWeight), parseInt(numberOfPouches)).toFixed(2) : 
                  '0.00'
                }
              </div>
            </div>
          </div>

          <Button onClick={addProduct} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      )}

      {/* Products Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Work Order Products</h3>
        
        {formData.products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No products added yet. {!isReadOnly && 'Add products above to continue.'}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Total Weight (kg)</TableHead>
                  <TableHead>Number of Pouches</TableHead>
                  <TableHead>Pouch Size (kg)</TableHead>
                  {!isReadOnly && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.products.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {getProductName(product.product_id)}
                    </TableCell>
                    <TableCell>{product.total_weight}</TableCell>
                    <TableCell>{product.number_of_pouches}</TableCell>
                    <TableCell>{product.pouch_size.toFixed(2)}</TableCell>
                    {!isReadOnly && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
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
            disabled={!canProceed}
            className="flex items-center gap-2"
          >
            Next: Review
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
