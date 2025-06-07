
import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { WorkOrderFormData } from './WorkOrderDialog';
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

interface WorkOrderReviewTabProps {
  formData: WorkOrderFormData;
  workOrder: WorkOrderWithProducts | null;
  onPrevious: () => void;
  onSuccess: () => void;
  onClose: () => void;
  isReadOnly: boolean;
}

const statusColors: Record<WorkOrderStatus, string> = {
  CREATED: 'bg-gray-100 text-gray-800',
  PROCURED: 'bg-blue-100 text-blue-800',
  'IN-STOCK': 'bg-green-100 text-green-800',
  PROCESSED: 'bg-yellow-100 text-yellow-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  EXECUTED: 'bg-orange-100 text-orange-800',
  COMPLETE: 'bg-emerald-100 text-emerald-800',
};

export function WorkOrderReviewTab({
  formData,
  workOrder,
  onPrevious,
  onSuccess,
  onClose,
  isReadOnly,
}: WorkOrderReviewTabProps) {
  const { toast } = useToast();

  const saveWorkOrderMutation = useMutation({
    mutationFn: async () => {
      if (workOrder) {
        // Update existing work order
        const { error: updateError } = await supabase
          .from('work_orders')
          .update({
            name: formData.name,
            description: formData.description || null,
            remarks: formData.remarks || null,
            status: formData.status,
          })
          .eq('id', workOrder.id);

        if (updateError) throw updateError;

        // Delete existing products
        const { error: deleteError } = await supabase
          .from('work_order_products')
          .delete()
          .eq('work_order_id', workOrder.id);

        if (deleteError) throw deleteError;

        // Insert new products
        if (formData.products.length > 0) {
          const { error: insertError } = await supabase
            .from('work_order_products')
            .insert(
              formData.products.map(product => ({
                work_order_id: workOrder.id,
                ...product,
              }))
            );

          if (insertError) throw insertError;
        }
      } else {
        // Create new work order
        const { data: newWorkOrder, error: createError } = await supabase
          .from('work_orders')
          .insert({
            name: formData.name,
            description: formData.description || null,
            remarks: formData.remarks || null,
            status: formData.status,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Insert products
        if (formData.products.length > 0) {
          const { error: insertError } = await supabase
            .from('work_order_products')
            .insert(
              formData.products.map(product => ({
                work_order_id: newWorkOrder.id,
                ...product,
              }))
            );

          if (insertError) throw insertError;
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Work order ${workOrder ? 'updated' : 'created'} successfully`,
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${workOrder ? 'update' : 'create'} work order: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const totalWeight = formData.products.reduce((sum, product) => sum + product.total_weight, 0);
  const totalPouches = formData.products.reduce((sum, product) => sum + product.number_of_pouches, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Work Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{formData.name}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <Badge
                  variant="secondary"
                  className={statusColors[formData.status]}
                >
                  {formData.status}
                </Badge>
              </dd>
            </div>

            {formData.description && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{formData.description}</dd>
              </div>
            )}

            {formData.remarks && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Remarks</dt>
                <dd className="mt-1 text-sm text-gray-900">{formData.remarks}</dd>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Products</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">{formData.products.length}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Weight</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">{totalWeight.toFixed(2)} kg</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Total Pouches</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">{totalPouches}</dd>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          {formData.products.length === 0 ? (
            <p className="text-gray-500">No products added.</p>
          ) : (
            <div className="space-y-4">
              {formData.products.map((product, index) => (
                <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Product {index + 1}</h4>
                    <p className="text-sm text-gray-500">ID: {product.product_id}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      <span className="font-medium">{product.total_weight} kg</span> in{' '}
                      <span className="font-medium">{product.number_of_pouches} pouches</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {product.pouch_size.toFixed(2)} kg per pouch
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        {!isReadOnly && (
          <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
        )}
        
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={onClose}>
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isReadOnly && (
            <Button 
              onClick={() => saveWorkOrderMutation.mutate()}
              disabled={saveWorkOrderMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saveWorkOrderMutation.isPending ? 'Saving...' : workOrder ? 'Update Work Order' : 'Create Work Order'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
