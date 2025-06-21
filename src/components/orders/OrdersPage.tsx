import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Search, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { OrdersTable } from './OrdersTable';
import { OrdersDialog } from './OrdersDialog';
import { OrdersPagination } from './OrdersPagination';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ORDER_STATUSES } from '@/lib/constants';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'] & {
  clients: {
    id: string;
    name: string;
    client_code: string;
  };
  order_products: Array<{
    id: string;
    product_id: string;
    pouch_size: number;
    number_of_pouches: number;
    total_weight: number;
    products: {
      id: string;
      name: string;
    };
  }>;
};

export function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isStaff, isAdmin, user, profile } = useAuth();

  console.log('OrdersPage - Auth Debug:', {
    user: user?.id,
    profile: profile?.role,
    isStaff,
    isAdmin,
    userEmail: user?.email
  });

  // Fetch orders
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['orders', searchTerm, currentPage, pageSize],
    queryFn: async () => {
      console.log('OrdersPage - Starting query with auth state:', {
        userId: user?.id,
        userRole: profile?.role,
        isAuthenticated: !!user
      });

      try {
        let query = supabase
          .from('orders')
          .select(`
            *,
            clients (
              id,
              name,
              client_code
            ),
            order_products (
              id,
              product_id,
              pouch_size,
              number_of_pouches,
              total_weight,
              products (
                id,
                name
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (searchTerm) {
          query = query.or(`order_code.ilike.%${searchTerm}%,remarks.ilike.%${searchTerm}%`);
        }

        console.log('OrdersPage - About to execute count query');
        
        // Get total count for pagination
        let countQuery = supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        if (searchTerm) {
          countQuery = countQuery.or(`order_code.ilike.%${searchTerm}%,remarks.ilike.%${searchTerm}%`);
        }

        const { count, error: countError } = await countQuery;

        if (countError) {
          console.error('OrdersPage - Count query error:', {
            error: countError,
            message: countError.message,
            details: countError.details,
            hint: countError.hint,
            code: countError.code
          });
          throw countError;
        }

        console.log('OrdersPage - Count query successful, count:', count);
        console.log('OrdersPage - About to execute data query with pagination');

        // Get paginated results
        const { data, error } = await query
          .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

        if (error) {
          console.error('OrdersPage - Data query error:', {
            error: error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        console.log('OrdersPage - Data query successful:', {
          dataLength: data?.length,
          totalCount: count,
          sampleData: data?.[0]
        });

        return {
          orders: data as Order[],
          total: count || 0
        };
      } catch (err) {
        console.error('OrdersPage - Query function error:', err);
        throw err;
      }
    },
  });

  console.log('OrdersPage - Query state:', {
    isLoading,
    error: error ? {
      message: error.message,
      name: error.name,
      stack: error.stack
    } : null,
    hasData: !!ordersData
  });

  // Toggle order status mutation
  const toggleOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Success",
        description: `Order ${status === ORDER_STATUSES.CANCELED ? 'canceled' : 'reactivated'} successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update order status: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddOrder = () => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view orders",
        variant: "destructive",
      });
      return;
    }
    setEditingOrder(null);
    setIsReadOnly(false);
    setIsDialogOpen(true);
  };

  const handleEditOrder = async (order: Order) => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view orders",
        variant: "destructive",
      });
      return;
    }
    setEditingOrder(order);
    setIsReadOnly(false);
    setIsDialogOpen(true);
  };

  const handleToggleOrderStatus = (orderId: string, currentStatus: string) => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view orders",
        variant: "destructive",
      });
      return;
    }

    const newStatus = currentStatus === ORDER_STATUSES.CANCELED ? ORDER_STATUSES.NEW : ORDER_STATUSES.CANCELED;
    toggleOrderStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleDialogSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    setIsDialogOpen(false);
  };

  const orders = ordersData?.orders || [];
  const totalItems = ordersData?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
            <p className="text-slate-600">Manage client orders and track fulfillment</p>
          </div>
        </div>
        {!isStaff && (
          <Button onClick={handleAddOrder} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Order
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search orders by order code or remarks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error loading orders</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <details className="mt-2">
            <summary className="text-red-600 text-sm cursor-pointer">Debug Details</summary>
            <pre className="text-xs text-red-500 mt-1 whitespace-pre-wrap">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Orders Table */}
      <div className="w-[120%]">
        <OrdersTable
          orders={orders}
          isLoading={isLoading}
          onEdit={handleEditOrder}
          onToggleStatus={handleToggleOrderStatus}
          isReadOnly={isStaff}
        />
      </div>

      {/* Pagination */}
      <OrdersPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Orders Dialog */}
      <OrdersDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        order={editingOrder}
        onSuccess={handleDialogSuccess}
        isReadOnly={isReadOnly}
      />
    </div>
  );
} 