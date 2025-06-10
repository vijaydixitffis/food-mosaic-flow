import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';

interface WorkOrderProductsTabProps {
  formData: WorkOrderFormData;
  setFormData: (data: WorkOrderFormData) => void;
  onNext: () => void | Promise<void>;
  onPrevious: () => void;
  isReadOnly: boolean;
  isSubmitting?: boolean;
}

interface Product {
  id: string;
  name: string;
}

// Predefined pouch sizes in grams
const POUCH_SIZES = [50, 100, 125, 150, 250, 500, 1000];

interface WorkOrderProductItem {
  id: string;
  product_id: string;
  total_weight: number;
  number_of_pouches: number;
  pouch_size: number;
}

export function WorkOrderProductsTab({
  formData,
  setFormData,
  onNext,
  onPrevious,
  isReadOnly,
  isSubmitting = false,
}: WorkOrderProductsTabProps) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedPouchSize, setSelectedPouchSize] = useState<number | ''>('');
  const [numberOfPouches, setNumberOfPouches] = useState('');
  const [nextItemId, setNextItemId] = useState(1);
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

  const addProductItem = () => {
    if (!selectedProductId || !selectedPouchSize || !numberOfPouches) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const pouches = parseInt(numberOfPouches);

    if (pouches <= 0) {
      toast({
        title: "Validation Error",
        description: "Number of pouches must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    const pouchSize = Number(selectedPouchSize);
    const totalWeight = pouchSize * pouches;

    // Create a new item with all the details
    const newItem: WorkOrderProductItem = {
      id: `item-${nextItemId}`,
      product_id: selectedProductId,
      pouch_size: pouchSize,
      number_of_pouches: pouches,
      total_weight: totalWeight,
    };

    setFormData({
      ...formData,
      products: [...formData.products, newItem],
    });

    // Reset form for next item
    setSelectedPouchSize('');
    setNumberOfPouches('');
    setNextItemId(nextId => nextId + 1);
  };

  const removeProductItem = (id: string) => {
    const updatedProducts = formData.products.filter(item => item.id !== id);
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
          <h3 className="text-lg font-medium">Add Product Item to Work Order</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select 
                value={selectedProductId} 
                onValueChange={setSelectedProductId}
              >
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
              <Label htmlFor="pouchSize">Pouch Size (g) *</Label>
              <Select 
                value={selectedPouchSize ? selectedPouchSize.toString() : ''} 
                onValueChange={(value) => setSelectedPouchSize(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {POUCH_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}g
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label>Total Weight</Label>
              <div className="px-3 py-2 bg-gray-50 border rounded-md text-sm">
                {selectedPouchSize && numberOfPouches ? 
                  `${(selectedPouchSize * parseInt(numberOfPouches)).toLocaleString()}g` : 
                  '0g'
                }
              </div>
            </div>
          </div>

          <Button 
            onClick={addProductItem} 
            className="flex items-center gap-2"
            disabled={!selectedProductId || !selectedPouchSize || !numberOfPouches}
          >
            <Plus className="w-4 h-4" />
            Add Item
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
                  <TableHead>Pouch Size</TableHead>
                  <TableHead>Pouches</TableHead>
                  <TableHead>Total Weight</TableHead>
                  {!isReadOnly && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isReadOnly ? 4 : 5} className="text-center text-muted-foreground py-4">
                      No items added yet
                    </TableCell>
                  </TableRow>
                ) : (
                  formData.products.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {getProductName(item.product_id)}
                      </TableCell>
                      <TableCell>{item.pouch_size}g</TableCell>
                      <TableCell>{item.number_of_pouches}</TableCell>
                      <TableCell>
                        {item.total_weight.toLocaleString()}g 
                        <span className="text-muted-foreground ml-1">
                          ({(item.total_weight / 1000).toFixed(2)}kg)
                        </span>
                      </TableCell>
                      {!isReadOnly && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProductItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
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
            disabled={formData.products.length === 0 || isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? 'Saving...' : 'Save Work Order'}
          </Button>
        </div>
      )}
    </div>
  );
}
