
import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabsProps } from '@/components/ui/tabs';
import { WorkOrderBasicInfoTab } from './WorkOrderBasicInfoTab';
import { WorkOrderProductsTab, WorkOrderProductItem } from './WorkOrderProductsTab';
import { DeliveryDialog } from './DeliveryDialog';
import { WorkOrderIngredientsTab } from './WorkOrderIngredientsTab';
import type { Database } from '@/integrations/supabase/types';

type WorkOrder = Database['public']['Tables']['work_orders']['Row'];
type WorkOrderStatus = Database['public']['Enums']['work_order_status'];
type WorkOrderWithProducts = WorkOrder & {
  // Define the expected structure of work_order_products
  work_order_products: Array<{
    id: string;
    product_id: string;
    total_weight: number;
    number_of_pouches: number;
    pouch_size: number;
    products: {
      id: string;
      name: string;
      // Assuming 'products' might have ingredients linked, adjust if needed
      product_ingredients?: Array<{
        ingredient_id: string;
      }>;
    };
  }>;
};

type RequiredIngredient = {
  ingredient_id: string;
  name: string;
  unit_of_measurement: string | null;
  required_quantity: number;
};

type RequiredIngredientWithStock = RequiredIngredient & {
  current_stock: number;
}

export interface StockAllocationItem {
  id: string;
}
type IngredientStock = Database['public']['Tables']['ingredient_stock']['Row'];

interface WorkOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderWithProducts | null;
  onSuccess: () => void;
  isReadOnly: boolean;
}


export function WorkOrderDialog({
  isOpen,
  onClose,
  workOrder,
  onSuccess,
  isReadOnly,
}: WorkOrderDialogProps) {
  const [activeTab, setActiveTab] = useState<TabsProps['defaultValue']>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [formData, setFormData] = useState<WorkOrderFormData>({
    name: '',
    description: '',
    remarks: '',
    status: 'CREATED',
    products: [],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch required ingredients for the work order
  const { data: requiredIngredientsData, isLoading: isLoadingRequiredIngredients } = useQuery<RequiredIngredient[]>({
    queryKey: ['work-order-required-ingredients', workOrder?.id],
    queryFn: async (): Promise<RequiredIngredient[]> => {
      if (!workOrder?.id) return [];
      // Assuming you have a Supabase function 'get_required_ingredients_for_work_order'
      const { data, error } = await supabase.rpc('get_required_ingredients_for_work_order', { p_work_order_id: workOrder.id });
      if (error) throw error;
      // The RPC should return data directly conforming to RequiredIngredient[] or be mapped here
      // Assuming the RPC returns data in the correct format already
      return data || [];
    },
    enabled: !!workOrder?.id && activeTab === 'ingredients', // Only enable query if workOrder exists and ingredients tab is active
  });
  
  // Fetch all ingredient stock
  const { data: ingredientStockData, isLoading: isLoadingIngredientStock } = useQuery<IngredientStock[]>({
    queryKey: ['ingredientStock'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ingredient_stock').select('*');
      if (error) throw error;
      return data;
    },
    enabled: activeTab === 'ingredients', // Only fetch stock when ingredients tab is active
  });

  // Combine required ingredients with current stock data
  const combinedIngredients = useMemo<RequiredIngredientWithStock[]>(() => {
    if (!requiredIngredientsData || !ingredientStockData) return [];
    return requiredIngredientsData.map(requiredIng => {
      const stockItem = ingredientStockData.find(stock => stock.ingredient_id === requiredIng.ingredient_id);
      return {
        ...requiredIng,
        current_stock: stockItem?.quantity || 0,
      };
    });
  }, [requiredIngredientsData, ingredientStockData]);
  
  // Mutation for allocating ingredient stock
  const allocateIngredientStockMutation = useMutation({
    mutationFn: async ({ ingredientId, quantity }: { ingredientId: string; quantity: number }) => {
      if (!workOrder?.id) throw new Error('Work order ID is missing');
      // Find the stock_item_id for the ingredient
      const stockItem = ingredientStockData?.find(item => item.ingredient_id === ingredientId);
      if (!stockItem) throw new Error(`Stock item not found for ingredient ID: ${ingredientId}`);

      const { data, error } = await supabase.rpc('allocate_ingredient_stock', {
        p_ingredient_stock_id: stockItem.id,
        p_work_order_id: workOrder.id,
        p_quantity: quantity,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientStock'] }); // Invalidate overall stock
      queryClient.invalidateQueries({ queryKey: ['work-order-required-ingredients', workOrder?.id] }); // Invalidate required ingredients for WO
      // Optionally invalidate a specific query for allocations if you add one
      toast({
        title: "Success",
        description: "Ingredient stock allocated.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: `Failed to allocate stock: ${error.message}`, variant: "destructive" });
    },
  });
  const saveWorkOrder = useMutation({
    mutationFn: async (data: WorkOrderFormData) => {
      // Existing save logic (unchanged in this diff)
      // ... (removed for brevity in diff, but remains in the file)
      setIsSubmitting(true);
      try {
        const workOrderData = {
          name: data.name,
          description: data.description,
          remarks: data.remarks,
          status: data.status,
        };

        const workOrderProductsData = data.products.map(product => ({
          product_id: product.product_id,
          number_of_pouches: product.number_of_pouches,
          pouch_size: product.pouch_size,
          total_weight: product.total_weight,
        }));

        if (workOrder) {
          // Update existing work order
          const { data: updatedWorkOrder, error: updateError } = await supabase
            .from('work_orders')
            .update(workOrderData)
            .eq('id', workOrder.id)
            .select()
            .single();

          if (updateError) throw updateError;

          // Delete existing work order products
          const { error: deleteError } = await supabase
            .from('work_order_products')
            .delete()
            .eq('work_order_id', workOrder.id);

          if (deleteError) throw deleteError;

          // Insert new work order products
          const { error: insertError } = await supabase
            .from('work_order_products')
            .insert(
              workOrderProductsData.map(product => ({
                ...product,
                work_order_id: workOrder.id,
              }))
            );

          if (insertError) throw insertError;

          return updatedWorkOrder;
        } else {
          // Create new work order
          const { data: newWorkOrder, error: insertError } = await supabase
            .from('work_orders')
            .insert(workOrderData)
            .select()
            .single();

          if (insertError) throw insertError;

          // Insert work order products
          const { error: productsError } = await supabase
            .from('work_order_products')
            .insert(
              workOrderProductsData.map(product => ({
                ...product,
                work_order_id: newWorkOrder.id,
              }))
            );

          if (productsError) throw productsError;

          return newWorkOrder;
        }
      } finally { setIsSubmitting(false); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast({
        title: 'Success',
        description: workOrder ? 'Work order updated successfully' : 'Work order created successfully',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      console.error('Error saving work order:', error);
      toast({
        title: 'Error',
        description: `Failed to save work order: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleAllocateIngredientStock = (ingredientId: string, allocatedQuantity: number) => {
    if (!workOrder?.id) return; // Should not happen if button is disabled
    allocateIngredientStockMutation.mutate({ ingredientId, quantity: allocatedQuantity });
  };
  const handleSubmit = async () => {
    if (formData.products.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one product to the work order',
        variant: 'destructive',
      });
      return;
    }
    await saveWorkOrder.mutateAsync(formData);
  };

  React.useEffect(() => {
    if (workOrder) {
      setFormData({
        name: workOrder.name,
        description: workOrder.description || '',
        remarks: workOrder.remarks || '',
        status: workOrder.status,
        products: workOrder.work_order_products.map(wop => ({
          id: wop.id,
          product_id: wop.product_id,
          total_weight: wop.total_weight,
          number_of_pouches: wop.number_of_pouches,
          pouch_size: wop.pouch_size,
        })),
      });
    } else {
      setFormData({
        name: '',
        description: '',
        remarks: '',
        status: 'CREATED',
        products: [],
      });
    }
  }, [workOrder]);

  const handleTabChange = (tab: TabsProps['defaultValue']) => {
    if (tab === 'products' && formData.name.trim() === '') {
      return;
    } else if (tab === 'ingredients' && !workOrder) return; // Cannot go to ingredients if no work order
    setActiveTab(tab);
  };

  const canProceedToProducts = formData.name.trim() !== '';
  const canViewDelivery = canProceedToProducts && formData.products.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {workOrder ? `Edit Work Order - ${workOrder.name}` : 'Create New Work Order'}
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList>
            <TabsTrigger value="basic">
              {formData.name ? `WO Code: ${formData.name}` : 'Basic Info'}
            </TabsTrigger>
            <TabsTrigger value="products" disabled={!formData.name}>
              {formData.name ? `Products (${formData.products.length})` : 'Products'}
            </TabsTrigger>
            {workOrder && ( // Only show ingredients tab for existing work orders
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <WorkOrderBasicInfoTab
              formData={formData}
              setFormData={setFormData}
              onNext={() => handleTabChange('products')}
              isReadOnly={isReadOnly}
            />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <WorkOrderProductsTab
              formData={formData}
              setFormData={setFormData}
              onNext={handleSubmit}
              onPrevious={() => handleTabChange('basic')}
              isReadOnly={isReadOnly}
              isSubmitting={isSubmitting}
            />
          </TabsContent>

          <TabsContent value="ingredients" className="space-y-4">
            <WorkOrderIngredientsTab
              requiredIngredientsWithStock={combinedIngredients}
              onAllocateStock={handleAllocateIngredientStock}
              isReadOnly={isReadOnly}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
