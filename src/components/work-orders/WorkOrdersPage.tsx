import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Search, Factory } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { WorkOrdersTable } from './WorkOrdersTable';
import { WorkOrderDialog } from './WorkOrderDialog';
import { DeliveryDialog } from './DeliveryDialog';
import { WorkOrdersPagination } from './WorkOrdersPagination';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type WorkOrder = Database['public']['Tables']['work_orders']['Row'];
type WorkOrderStatus = Database['public']['Enums']['work_order_status'];
type WorkOrderWithProducts = WorkOrder & {
  work_order_products: Array<{
    id: string;
    product_id: string;
    total_weight: number;
    number_of_pouches: number;
    pouch_size: number;
    products: {
      id: string;
      name: string;
    };
  }>;
};

export function WorkOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrderWithProducts | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderWithProducts | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isStaff, isAdmin, user, profile } = useAuth();

  console.log('WorkOrdersPage - Auth Debug:', {
    user: user?.id,
    profile: profile?.role,
    isStaff,
    isAdmin,
    userEmail: user?.email
  });

  // Fetch work orders with their products
  const { data: workOrdersData, isLoading, error } = useQuery({
    queryKey: ['work-orders', searchTerm, currentPage, pageSize],
    queryFn: async () => {
      console.log('WorkOrdersPage - Starting query with auth state:', {
        userId: user?.id,
        userRole: profile?.role,
        isAuthenticated: !!user
      });

      try {
        let query = supabase
          .from('work_orders')
          .select(`
            *,
            work_order_products (
              id,
              product_id,
              total_weight,
              number_of_pouches,
              pouch_size,
              products (
                id,
                name
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,remarks.ilike.%${searchTerm}%`);
        }

        console.log('WorkOrdersPage - About to execute count query');
        
        // Get total count for pagination
        let countQuery = supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true });

        if (searchTerm) {
          countQuery = countQuery.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,remarks.ilike.%${searchTerm}%`);
        }

        const { count, error: countError } = await countQuery;

        if (countError) {
          console.error('WorkOrdersPage - Count query error:', {
            error: countError,
            message: countError.message,
            details: countError.details,
            hint: countError.hint,
            code: countError.code
          });
          throw countError;
        }

        console.log('WorkOrdersPage - Count query successful, count:', count);
        console.log('WorkOrdersPage - About to execute data query with pagination');

        // Get paginated results
        const { data, error } = await query
          .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

        if (error) {
          console.error('WorkOrdersPage - Data query error:', {
            error: error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        console.log('WorkOrdersPage - Data query successful:', {
          dataLength: data?.length,
          totalCount: count,
          sampleData: data?.[0]
        });

        return {
          workOrders: data as WorkOrderWithProducts[],
          total: count || 0
        };
      } catch (err) {
        console.error('WorkOrdersPage - Query function error:', err);
        throw err;
      }
    },
  });

  console.log('WorkOrdersPage - Query state:', {
    isLoading,
    error: error ? {
      message: error.message,
      name: error.name,
      stack: error.stack
    } : null,
    hasData: !!workOrdersData
  });

  // Delete work order mutation
  const deleteWorkOrderMutation = useMutation({
    mutationFn: async (workOrderId: string) => {
      const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', workOrderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast({
        title: "Success",
        description: "Work order deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete work order: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ workOrderId, status }: { workOrderId: string; status: WorkOrderStatus }) => {
      const { error } = await supabase
        .from('work_orders')
        .update({ status })
        .eq('id', workOrderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast({
        title: "Success",
        description: "Work order status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update work order status: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddWorkOrder = () => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view work orders",
        variant: "destructive",
      });
      return;
    }
    setEditingWorkOrder(null);
    setIsDialogOpen(true);
  };

  const handleEditWorkOrder = (workOrder: WorkOrderWithProducts) => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view work orders",
        variant: "destructive",
      });
      return;
    }
    setEditingWorkOrder(workOrder);
    setIsDialogOpen(true);
  };

  const handleDeleteWorkOrder = (workOrderId: string) => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view work orders",
        variant: "destructive",
      });
      return;
    }
    if (window.confirm('Are you sure you want to delete this work order?')) {
      deleteWorkOrderMutation.mutate(workOrderId);
    }
  };

  const handleUpdateStatus = (workOrderId: string, status: string) => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view work orders",
        variant: "destructive",
      });
      return;
    }
    updateStatusMutation.mutate({ workOrderId, status: status as WorkOrderStatus });
  };

  const handleViewDelivery = (workOrder: WorkOrderWithProducts) => {
    setSelectedWorkOrder(workOrder);
    setIsDeliveryDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const workOrders = workOrdersData?.workOrders || [];
  const totalItems = workOrdersData?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <Factory className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Work Orders</h1>
            <p className="text-slate-600">Create and manage production work orders</p>
          </div>
        </div>
        {!isStaff && (
          <Button onClick={handleAddWorkOrder} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Work Order
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search work orders by name, description, or remarks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error loading work orders</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <details className="mt-2">
            <summary className="text-red-600 text-sm cursor-pointer">Debug Details</summary>
            <pre className="text-xs text-red-500 mt-1 whitespace-pre-wrap">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Work Orders Table */}
      <WorkOrdersTable
        workOrders={workOrders}
        isLoading={isLoading}
        onEdit={handleEditWorkOrder}
        onDelete={handleDeleteWorkOrder}
        onUpdateStatus={handleUpdateStatus}
        onViewDelivery={handleViewDelivery}
        isReadOnly={isStaff}
      />

      {/* Pagination */}
      <WorkOrdersPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Work Order Dialog */}
      <WorkOrderDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        workOrder={editingWorkOrder}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['work-orders'] });
          setIsDialogOpen(false);
        }}
        isReadOnly={isStaff}
      />

      {/* Delivery Dialog */}
      {selectedWorkOrder && (
        <DeliveryDialog
          isOpen={isDeliveryDialogOpen}
          onClose={() => setIsDeliveryDialogOpen(false)}
          workOrder={selectedWorkOrder}
          formData={{
            name: selectedWorkOrder.name,
            description: selectedWorkOrder.description || '',
            remarks: selectedWorkOrder.remarks || '',
            status: selectedWorkOrder.status,
            products: selectedWorkOrder.work_order_products.map(p => ({
              id: p.id,
              product_id: p.product_id,
              total_weight: p.total_weight,
              number_of_pouches: p.number_of_pouches,
              pouch_size: p.pouch_size,
            })) || [],
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            setIsDeliveryDialogOpen(false);
          }}
          isReadOnly={isStaff}
        />
      )}
    </div>
  );
}
