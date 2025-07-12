import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ORDER_STATUSES, ORDER_STATUS_DISPLAY_NAMES } from '@/lib/constants';
import type { Database } from '@/integrations/supabase/types';

import { getStockAllocationsByOrder, allocateProductStock } from '@/integrations/supabase/stock';
import { OrderStockAllocationTab } from './OrderStockAllocationTab';
// Predefined pouch sizes in grams (copied from WorkOrderProductsTab)
const POUCH_SIZES = [50, 100, 125, 150, 250, 500, 1000];

export function OrdersDialog({ isOpen, onClose, order, onSuccess, isReadOnly }) {
  const [tab, setTab] = useState('details');
  const [formData, setFormData] = useState(order || {
    order_code: '',
    remarks: '',
    order_date: '',
    target_delivery_date: '',
    client: null,
    products: [],
    status: ORDER_STATUSES.NEW,
  });

  // Re-initialize formData when editing a different order
  useEffect(() => {
    if (order) {
      // Map order_products to the expected products structure
      const mappedProducts = (order.order_products || []).map((op, index) => ({
        id: op.id || `item-${index + 1}`,
        product_id: op.product_id,
        pouch_size: op.pouch_size,
        number_of_pouches: op.number_of_pouches,
        total_weight: op.total_weight,
        product_name: op.products?.name || '',
      }));

      setFormData({
        order_code: order.order_code || '',
        remarks: order.remarks || '',
        order_date: order.order_date || '',
        target_delivery_date: order.target_delivery_date || '',
        client: order.clients || null,
        products: mappedProducts,
        status: order.status || ORDER_STATUSES.NEW,
      });
    } else {
      setFormData({
        order_code: '',
        remarks: '',
        order_date: '',
        target_delivery_date: '',
        client: null,
        products: [],
        status: ORDER_STATUSES.NEW,
      });
    }
  }, [order]);

  // Product selection state for Products tab (match WorkOrderProductsTab)
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedPouchSize, setSelectedPouchSize] = useState<number | ''>('');
  const [numberOfPouches, setNumberOfPouches] = useState('');
  const [nextItemId, setNextItemId] = useState(1);
  const { toast } = useToast();

  // Product search state
  const [productSearch, setProductSearch] = useState('');
  const [showProductResults, setShowProductResults] = useState(false);

  // Fetch active products (same as WorkOrderProductsTab)
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Filter products based on search
  const filteredProducts = productSearch.length >= 2
    ? products.filter(product => 
        product.name.toLowerCase().includes(productSearch.toLowerCase())
      )
    : [];

  const selectedProductName = selectedProductId
    ? products.find(p => p.id === selectedProductId)?.name
    : '';

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    setProductSearch('');
    setShowProductResults(false);
  };

  const queryClient = useQueryClient();

  // --- Client Search for Details Tab ---
  const [clientSearch, setClientSearch] = useState('');
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients', clientSearch],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (clientSearch) {
        query = query.ilike('name', `%${clientSearch}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // --- Order Save Mutation ---
  const orderMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Prepare order data
      const orderData: Database['public']['Tables']['orders']['Insert'] = {
        order_code: data.order_code,
        remarks: data.remarks,
        order_date: data.order_date,
        target_delivery_date: data.target_delivery_date,
        client_id: data.client?.id,
        status: data.status,
      };
      // Prepare order products data
      const orderProductsData: Database['public']['Tables']['order_products']['Insert'][] = (data.products || []).map(product => ({
        product_id: product.product_id,
        pouch_size: product.pouch_size,
        number_of_pouches: product.number_of_pouches,
        total_weight: product.total_weight,
        order_id: '', // will be set after order insert
      }));
      let orderId;
      if (order) {
        // Update existing order
        const { data: updatedOrder, error: updateError } = await supabase
          .from('orders')
          .update(orderData)
          .eq('id', order.id)
          .select()
          .single();
        if (updateError) throw updateError;
        orderId = order.id;
        // Delete existing order_products
        const { error: deleteError } = await supabase
          .from('order_products')
          .delete()
          .eq('order_id', order.id);
        if (deleteError) throw deleteError;
      } else {
        // Create new order
        const { data: newOrder, error: insertError } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();
        if (insertError) throw insertError;
        orderId = newOrder.id;
      }
      // Insert order_products
      if (orderProductsData.length > 0) {
        const productsToInsert = orderProductsData.map(product => ({ ...product, order_id: orderId }));
        const { error: productsError } = await supabase
          .from('order_products')
          .insert(productsToInsert);
        if (productsError) throw productsError;
      }
      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Success',
        description: order ? 'Order updated successfully' : 'Order created successfully',
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${order ? 'update' : 'create'} order: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // --- Fetch Stock Allocations for Stock Allocation Tab ---
  const { data: orderStockAllocationsResponse, isLoading: isLoadingOrderStockAllocations } = useQuery({
    queryKey: ['stock-allocations', order?.id],
    queryFn: () => getStockAllocationsByOrder(order!.id),
    enabled: !!order?.id, // Only fetch if order exists
  });

  // Extract data from responses
  const orderStockAllocations = orderStockAllocationsResponse?.data || [];

  // Wrapper function for allocateMutation to match expected signature
  const handleAllocateStock = (productId: string, allocatedQuantity: number) => {
    allocateMutation.mutate({ productId, quantity: allocatedQuantity });
  };

  // Combine order products with stock and allocation data
  const productsWithStockAndAllocation = React.useMemo(() => {
    if (!formData.products || !orderStockAllocations) return [];

    return formData.products.map(orderProduct => {
      const allocatedQuantity = orderStockAllocations
        .filter(allocation => allocation.stock_item_id === orderProduct.product_id)
        .reduce((sum, allocation) => sum + allocation.quantity_allocated, 0);

      return {
        ...orderProduct,
        currentStock: 0, // This will be populated from the products table
        allocatedQuantity: allocatedQuantity,
      };
    });
  }, [formData.products, orderStockAllocations]);

  // --- Handle Product Stock Allocation ---
  const allocateMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      if (!order?.id) {
        throw new Error('Cannot allocate stock without an order ID.');
      }
      await allocateProductStock({ productId, orderId: order.id, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-allocations', order?.id] });
      toast({
        title: 'Success',
        description: 'Product stock allocated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to allocate product stock: ${error.message}`,
        variant: 'destructive',
      });
    }});

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
    const newItem = {
      id: `item-${nextItemId}`,
      product_id: selectedProductId,
      pouch_size: pouchSize,
      number_of_pouches: pouches,
      total_weight: totalWeight,
      product_name: products.find(p => p.id === selectedProductId)?.name || '',
    };
    setFormData({
      ...formData,
      products: [...(formData.products || []), newItem],
    });
    setSelectedProductId('');
    setSelectedPouchSize('');
    setNumberOfPouches('');
    setProductSearch('');
    setShowProductResults(false);
    setNextItemId(id => id + 1);
  };

  const removeProductItem = (id) => {
    setFormData({
      ...formData,
      products: (formData.products || []).filter(item => item.id !== id),
    });
  };

  // TODO: Implement client search/select and product add logic

  // --- Validation for enabling submit ---
  const isClientValid = !!formData.client && !!formData.client.id && !!formData.client.name;
  const areProductsValid = Array.isArray(formData.products) && formData.products.length > 0;
  const canSubmit = isClientValid && areProductsValid;
  const [validationError, setValidationError] = useState<string | null>(null);

  // --- Handle Submit ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isClientValid) {
      setValidationError('Please select a client with all required details.');
      return;
    }
    if (!areProductsValid) {
      setValidationError('Please add at least one product to the order.');
      return;
    }
    setValidationError(null);
    orderMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{order ? `Edit Order - ${order.order_code}` : 'Add New Order'}</DialogTitle>
          <DialogDescription>
            {order ? 'Edit the order details and products.' : 'Create a new order with client and product information.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="stock-allocation">Stock Allocation</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              {/* Client search and select UI */}
              <div className="space-y-2 mb-4">
                <label htmlFor="client_search">Client</label>
                <Input
                  id="client_search"
                  placeholder="Search and select client..."
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  disabled={isReadOnly}
                />
                <div className="mt-2">
                  <select
                    value={formData.client?.id || ''}
                    onChange={e => {
                      const selected = clients.find(c => c.id === e.target.value);
                      setFormData({ ...formData, client: selected });
                    }}
                    disabled={isReadOnly || isLoadingClients}
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="">Select client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="order_code">Order Code</label>
                  <Input
                    id="order_code"
                    value={formData.order_code}
                    onChange={e => setFormData({ ...formData, order_code: e.target.value })}
                    disabled={isReadOnly}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="order_date">Order Date</label>
                  <Input
                    id="order_date"
                    type="date"
                    value={formData.order_date}
                    onChange={e => setFormData({ ...formData, order_date: e.target.value })}
                    disabled={isReadOnly}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="target_delivery_date">Target Delivery Date</label>
                  <Input
                    id="target_delivery_date"
                    type="date"
                    value={formData.target_delivery_date}
                    onChange={e => setFormData({ ...formData, target_delivery_date: e.target.value })}
                    disabled={isReadOnly}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="status">Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ORDER_STATUSES).map(([key, value]) => (
                        <SelectItem key={value} value={value}>
                          {ORDER_STATUS_DISPLAY_NAMES[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <label htmlFor="remarks">Remarks</label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  disabled={isReadOnly}
                />
              </div>
            </TabsContent>
            <TabsContent value="products">
              {!isReadOnly && (
                <div className="border rounded-lg p-4 space-y-4 mb-4">
                  <h3 className="text-lg font-medium">Add Products</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="product">Product *</label>
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
                      <label htmlFor="pouchSize">Pouch Size (g) *</label>
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
                      <label htmlFor="numberOfPouches">No of Pouches</label>
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
                      <label>Total Weight</label>
                      <div className="px-3 py-2 bg-gray-50 border rounded-md text-sm">
                        {selectedPouchSize && numberOfPouches ? 
                          `${(Number(selectedPouchSize) * parseInt(numberOfPouches)).toLocaleString()}g` : 
                          '0g'
                        }
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={addProductItem} 
                    className="flex items-center gap-2"
                    disabled={!selectedProductId || !selectedPouchSize || !numberOfPouches}
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                </div>
              )}
              {/* Products Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Pouch Size (g)</TableHead>
                      <TableHead>Number of Pouches</TableHead>
                      <TableHead>Total Weight (g)</TableHead>
                      {!isReadOnly && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(formData.products || []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name || products.find(p => p.id === item.product_id)?.name || ''}</TableCell>
                        <TableCell>{item.pouch_size}</TableCell>
                        <TableCell>{item.number_of_pouches}</TableCell>
                        <TableCell>{item.total_weight}</TableCell>
                        {!isReadOnly && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={() => removeProductItem(item.id)}
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="stock-allocation">
             <OrderStockAllocationTab
               productsWithStockAndAllocation={productsWithStockAndAllocation}
               onAllocateStock={handleAllocateStock}
               orderId={order?.id || ''}
               isReadOnly={isReadOnly}
             />
            </TabsContent>
          </Tabs>
          {validationError && (
            <div className="text-red-600 text-sm mb-2">{validationError}</div>
          )}
          {!isReadOnly && (
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={orderMutation.isPending || !canSubmit}>
                {order ? 'Update Order' : 'Create Order'}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
} 