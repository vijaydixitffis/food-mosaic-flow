import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, FileText, X, Loader2, IndianRupee } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { ORDER_STATUSES, ORDER_STATUS_DISPLAY_NAMES } from '@/lib/constants';

type Order = Database['public']['Tables']['orders']['Row'] & {
  clients: {
    id: string;
    name: string;
    client_code: string;
    discount: number;
  };
  categories: {
    id: string;
    category_name: string;
    category_code: string;
  } | null;
  order_products: Array<{
    id: string;
    product_id: string;
    pouch_size: number;
    number_of_pouches: number;
    total_weight: number;
    products: {
      id: string;
      name: string;
      sale_price: number | null;
      hsn_code: string;
      gst: number | null;
    } | null;
    product_prices?: {
      id: string;
      product_id: string;
      category_id: string;
      sale_price: number;
    } | null;
  }>;
};

type Category = Database['public']['Tables']['categories']['Row'];

export function OrderSummaryReport() {
  // Get current month date range for defaults
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  // Filter states with current month as default for order date range
  const [filters, setFilters] = useState({
    orderCode: '',
    clientCode: '',
    categoryId: '',
    status: '',
    orderDateFrom: firstDayOfMonth,
    orderDateTo: lastDayOfMonth,
    targetDateFrom: '',
    targetDateTo: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories-for-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sequence', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch orders with filters
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['order-summary-report', appliedFilters],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          clients (
            id,
            name,
            client_code,
            discount
          ),
          categories (
            id,
            category_name,
            category_code
          ),
          order_products (
            id,
            product_id,
            pouch_size,
            number_of_pouches,
            total_weight,
            products (
              id,
              name,
              sale_price,
              hsn_code,
              gst
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (appliedFilters.orderCode) {
        query = query.ilike('order_code', `%${appliedFilters.orderCode}%`);
      }
      if (appliedFilters.categoryId) {
        query = query.eq('category_id', appliedFilters.categoryId);
      }
      if (appliedFilters.status) {
        query = query.eq('status', appliedFilters.status);
      }
      if (appliedFilters.orderDateFrom) {
        query = query.gte('order_date', appliedFilters.orderDateFrom);
      }
      if (appliedFilters.orderDateTo) {
        query = query.lte('order_date', appliedFilters.orderDateTo);
      }
      if (appliedFilters.targetDateFrom) {
        query = query.gte('target_delivery_date', appliedFilters.targetDateFrom);
      }
      if (appliedFilters.targetDateTo) {
        query = query.lte('target_delivery_date', appliedFilters.targetDateTo);
      }

      // Note: clientCode filter needs to be applied differently since it's from a joined table
      // We'll filter in memory after fetching for client code
      const { data: orders, error } = await query;
      if (error) throw error;

      // Filter by client code in memory if specified
      let filteredOrders = orders || [];
      if (appliedFilters.clientCode) {
        filteredOrders = filteredOrders.filter(
          (order: any) => order.clients?.client_code?.toLowerCase().includes(appliedFilters.clientCode.toLowerCase())
        );
      }

      // Fetch category-specific prices for accurate totals
      const ordersWithPrices = await Promise.all(
        filteredOrders.map(async (order: any) => {
          const productIds = order.order_products?.map(op => op.product_id) || [];
          if (productIds.length === 0) return order;

          const { data: prices, error: priceError } = await supabase
            .from('product_prices')
            .select('*')
            .in('product_id', productIds);

          if (priceError) return order;

          const priceMap = new Map<string, any[]>();
          prices?.forEach(price => {
            if (!priceMap.has(price.product_id)) {
              priceMap.set(price.product_id, []);
            }
            priceMap.get(price.product_id)!.push(price);
          });

          const orderProducts = order.order_products?.map(op => {
            const matchingPrice = priceMap.get(op.product_id)?.find(
              price => price.category_id === order.category_id
            );
            return { ...op, product_prices: matchingPrice || null };
          }) || [];

          return { ...order, order_products: orderProducts };
        })
      );

      return ordersWithPrices as Order[];
    },
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const defaultFilters = {
      orderCode: '',
      clientCode: '',
      categoryId: '',
      status: '',
      orderDateFrom: firstDayOfMonth,
      orderDateTo: lastDayOfMonth,
      targetDateFrom: '',
      targetDateTo: '',
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  // Calculate order total
  const calculateOrderTotal = (order: Order) => {
    return order.order_products.reduce((total, item) => {
      const price = item.product_prices?.sale_price || item.products?.sale_price || 0;
      const quantity = item.number_of_pouches;
      return total + (price * quantity);
    }, 0);
  };

  // Calculate order quantity (total pouches)
  const calculateOrderQuantity = (order: Order) => {
    return order.order_products.reduce((total, item) => total + item.number_of_pouches, 0);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'NEW': return 'default';
      case 'IN PROGRESS': return 'secondary';
      case 'SHIPPED': return 'outline';
      case 'DELIVERED': return 'default';
      case 'BILLED': return 'secondary';
      case 'COMPLETE': return 'default';
      case 'CANCELED': return 'destructive';
      default: return 'outline';
    }
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="space-y-6">
      {/* Filter Form */}
      <Card className="bg-gray-50 border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Search className="w-4 h-4" />
            Filter Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Row 1: Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Order Code */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Order Code</label>
              <Input
                placeholder="Search order code..."
                value={filters.orderCode}
                onChange={(e) => handleFilterChange('orderCode', e.target.value)}
                className="h-9"
              />
            </div>

            {/* Client Code */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Client Code</label>
              <Input
                placeholder="Search client code..."
                value={filters.clientCode}
                onChange={(e) => handleFilterChange('clientCode', e.target.value)}
                className="h-9"
              />
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Category</label>
              <select
                value={filters.categoryId}
                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                className="w-full h-9 px-2 border rounded-md text-sm bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full h-9 px-2 border rounded-md text-sm bg-white"
              >
                <option value="">All Statuses</option>
                {Object.entries(ORDER_STATUSES).map(([key, value]) => (
                  <option key={value} value={value}>
                    {ORDER_STATUS_DISPLAY_NAMES[value]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {/* Order Date Range */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Order Date From</label>
              <Input
                type="date"
                value={filters.orderDateFrom}
                onChange={(e) => handleFilterChange('orderDateFrom', e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Order Date To</label>
              <Input
                type="date"
                value={filters.orderDateTo}
                onChange={(e) => handleFilterChange('orderDateTo', e.target.value)}
                className="h-9"
              />
            </div>

            {/* Target Delivery Date Range */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Target Date From</label>
              <Input
                type="date"
                value={filters.targetDateFrom}
                onChange={(e) => handleFilterChange('targetDateFrom', e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Target Date To</label>
              <Input
                type="date"
                value={filters.targetDateTo}
                onChange={(e) => handleFilterChange('targetDateTo', e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleApplyFilters}
              size="sm"
              className="flex items-center gap-1"
            >
              <Search className="w-4 h-4" />
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Button
                onClick={handleClearFilters}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="bg-white shadow-sm border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Order Summary
              {ordersData && (
                <span className="text-sm font-normal text-gray-500">
                  ({ordersData.length} records)
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading orders...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Error loading orders: {error.message}
            </div>
          ) : ordersData?.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No orders found matching the criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Order Code</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Client Code</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Order Date</TableHead>
                    <TableHead className="font-semibold">Target Delivery</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="font-semibold text-right">Qty (Pouches)</TableHead>
                    <TableHead className="font-semibold text-right">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersData?.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">
                        {order.order_code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.clients?.name}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {order.clients?.client_code}
                      </TableCell>
                      <TableCell>
                        {order.categories?.category_name ? (
                          <Badge variant="outline" className="text-xs">
                            {order.categories.category_name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.order_date ? new Date(order.order_date).toLocaleDateString('en-IN') : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.target_delivery_date ? new Date(order.target_delivery_date).toLocaleDateString('en-IN') : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(order.status)} className="text-xs">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {calculateOrderQuantity(order).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono flex items-center justify-end gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {calculateOrderTotal(order).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
