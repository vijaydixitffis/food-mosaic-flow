import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { OrdersTable } from './OrdersTable';
import { OrdersDialog } from './OrdersDialog';
import { OrdersPagination } from './OrdersPagination';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function OrdersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { isAdmin, isStaff } = useAuth();
  const queryClient = useQueryClient();

  // Fetch orders with pagination
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', currentPage, pageSize],
    queryFn: async () => {
      // Get total count
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      // Get paginated data with client name
      const { data, error } = await supabase
        .from('orders')
        .select('*, clients(name)')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
      if (error) throw error;
      // Map client name for table
      const mapped = (data || []).map(order => ({
        ...order,
        client_name: order.clients?.name || '',
      }));
      return { data: mapped, count: count || 0 };
    },
  });

  const handleAddOrder = () => {
    setEditingOrder(null);
    setIsDialogOpen(true);
  };

  const handleEditOrder = async (order) => {
    // Fetch order products
    const { data: productsData, error: productsError } = await supabase
      .from('order_products')
      .select('product_id, pouch_size, number_of_pouches, total_weight')
      .eq('order_id', order.id);
    // Fetch full client details
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', order.client_id)
      .maybeSingle();
    const fullOrder = {
      ...order,
      products: productsData || [],
      client: clientData || null,
    };
    setEditingOrder(fullOrder);
    setIsDialogOpen(true);
  };

  const handleDeactivateOrder = (orderId) => {
    // TODO: Deactivate order logic
  };

  const handleDialogSuccess = () => {
    setIsDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const totalPages = Math.ceil((ordersData?.count || 0) / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isStaff ? 'View Orders' : 'Manage Orders'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isStaff ? 'View order information' : 'Create and manage client orders'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddOrder} className="flex items-center gap-2">
            + Add Order
          </Button>
        )}
      </div>
      {/* Orders Table */}
      <OrdersTable
        orders={ordersData?.data || []}
        isLoading={isLoading}
        onEdit={handleEditOrder}
        onDeactivate={handleDeactivateOrder}
        isReadOnly={isStaff}
      />
      {/* Pagination */}
      <OrdersPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={ordersData?.count || 0}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
      {/* Order Dialog */}
      <OrdersDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        order={editingOrder}
        onSuccess={handleDialogSuccess}
        isReadOnly={isStaff}
      />
    </div>
  );
} 