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
import { ArrowLeft, ArrowRight, Plus, Trash2, Search, Package } from 'lucide-react';
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

interface Order {
  id: string;
  order_code: string;
  status: string;
  client: {
    id: string;
    name: string;
  };
}

interface OrderProduct {
  id: string;
  product_id: string;
  pouch_size: number;
  number_of_pouches: number;
  total_weight: number;
  product: {
    id: string;
    name: string;
  };
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

  // Product search state
  const [productSearch, setProductSearch] = useState('');
  const [showProductResults, setShowProductResults] = useState(false);

  // Order search state
  const [orderSearch, setOrderSearch] = useState('');
  const [showOrderResults, setShowOrderResults] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [addedOrderIds, setAddedOrderIds] = useState<string[]>([]);

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

  // Fetch orders for search
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders-search', orderSearch],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_code,
          status,
          client:clients(id, name)
        `)
        .in('status', ['NEW', 'IN PROGRESS'])
        .order('order_code');
      
      if (orderSearch) {
        query = query.ilike('order_code', `%${orderSearch}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
  });

  // Fetch order products when an order is selected
  const { data: orderProducts = [], isLoading: isLoadingOrderProducts } = useQuery({
    queryKey: ['order-products', selectedOrderId],
    queryFn: async () => {
      if (!selectedOrderId) return [];
      
      const { data, error } = await supabase
        .from('order_products')
        .select(`
          id,
          product_id,
          pouch_size,
          number_of_pouches,
          total_weight,
          product:products(id, name)
        `)
        .eq('order_id', selectedOrderId);
      
      if (error) throw error;
      return data as OrderProduct[];
    },
    enabled: !!selectedOrderId,
  });

  // Filter products based on search
  const filteredProducts = productSearch.length >= 2
    ? products.filter(product => 
        product.name.toLowerCase().includes(productSearch.toLowerCase())
      )
    : [];

  // Filter orders based on search
  const filteredOrders = orderSearch.length >= 2
    ? orders.filter(order => 
        order.order_code.toLowerCase().includes(orderSearch.toLowerCase()) &&
        !addedOrderIds.includes(order.id)
      )
    : [];

  const selectedProductName = selectedProductId
    ? products.find(p => p.id === selectedProductId)?.name
    : '';

  const selectedOrder = selectedOrderId
    ? orders.find(o => o.id === selectedOrderId)
    : null;

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    setProductSearch('');
    setShowProductResults(false);
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    setOrderSearch('');
    setShowOrderResults(false);
  };

  const addProductsFromOrder = () => {
    if (!selectedOrderId || orderProducts.length === 0) {
      toast({
        title: "No Products",
        description: "Selected order has no products to add",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicates
    const existingProductIds = formData.products.map(p => p.product_id);
    const newProducts = orderProducts.filter(op => !existingProductIds.includes(op.product_id));

    if (newProducts.length === 0) {
      toast({
        title: "No New Products",
        description: "All products from this order are already added to the work order",
        variant: "destructive",
      });
      return;
    }

    // Add new products to work order
    const newItems: WorkOrderProductItem[] = newProducts.map((op, index) => ({
      id: `item-${nextItemId + index}`,
      product_id: op.product_id,
      pouch_size: op.pouch_size,
      number_of_pouches: op.number_of_pouches,
      total_weight: op.total_weight,
    }));

    setFormData({
      ...formData,
      products: [...formData.products, ...newItems],
    });

    // Mark order as added and reset
    setAddedOrderIds(prev => [...prev, selectedOrderId]);
    setSelectedOrderId('');
    setNextItemId(prev => prev + newItems.length);

    toast({
      title: "Products Added",
      description: `Added ${newItems.length} products from order ${selectedOrder?.order_code}`,
    });
  };

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
    setSelectedProductId('');
    setSelectedPouchSize('');
    setNumberOfPouches('');
    setProductSearch('');
    setShowProductResults(false);
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
        <>
          {/* Add Products from Order */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-medium">Add Products from Order</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order">Search Order *</Label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="order"
                    placeholder={selectedOrderId ? selectedOrder?.order_code : "Type at least 2 characters to search orders..."}
                    value={orderSearch}
                    onChange={(e) => {
                      setOrderSearch(e.target.value);
                      setShowOrderResults(true);
                    }}
                    onFocus={() => setShowOrderResults(true)}
                    className="pl-10"
                    disabled={isReadOnly}
                  />
                  {showOrderResults && orderSearch.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredOrders.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No orders found</div>
                      ) : (
                        <div className="py-1">
                          {filteredOrders.map((order) => (
                            <button
                              key={order.id}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              onClick={() => handleOrderSelect(order.id)}
                            >
                              <div className="font-medium">{order.order_code}</div>
                              <div className="text-xs text-gray-500">
                                {order.client?.name} - {order.status}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Order Products</Label>
                <div className="px-3 py-2 bg-gray-50 border rounded-md text-sm min-h-[40px] flex items-center">
                  {isLoadingOrderProducts ? (
                    <span className="text-gray-500">Loading products...</span>
                  ) : selectedOrderId && orderProducts.length > 0 ? (
                    <span>{orderProducts.length} products available</span>
                  ) : selectedOrderId ? (
                    <span className="text-gray-500">No products in this order</span>
                  ) : (
                    <span className="text-gray-500">Select an order to view products</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button 
                  onClick={addProductsFromOrder} 
                  className="flex items-center gap-2 w-full"
                  disabled={!selectedOrderId || isLoadingOrderProducts || orderProducts.length === 0}
                >
                  <Plus className="w-4 h-4" />
                  Add from Order
                </Button>
              </div>
            </div>
          </div>

          {/* Add Individual Product */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-medium">Add Individual Product</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="product"
                    placeholder={selectedProductId ? selectedProductName : "Type at least 2 characters to search products..."}
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductResults(true);
                    }}
                    onFocus={() => setShowProductResults(true)}
                    className="pl-10"
                    disabled={isReadOnly}
                  />
                  {showProductResults && productSearch.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredProducts.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No products found</div>
                      ) : (
                        <div className="py-1">
                          {filteredProducts.map((product) => (
                            <button
                              key={product.id}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              onClick={() => handleProductSelect(product.id)}
                            >
                              {product.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
        </>
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
