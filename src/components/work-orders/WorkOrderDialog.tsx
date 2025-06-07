
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkOrderBasicInfoTab } from './WorkOrderBasicInfoTab';
import { WorkOrderProductsTab } from './WorkOrderProductsTab';
import { WorkOrderInventoryTab } from './WorkOrderInventoryTab';
import { WorkOrderRecipesTab } from './WorkOrderRecipesTab';
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

interface WorkOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderWithProducts | null;
  onSuccess: () => void;
  isReadOnly: boolean;
}

export interface WorkOrderFormData {
  name: string;
  description: string;
  remarks: string;
  status: WorkOrderStatus;
  products: Array<{
    product_id: string;
    total_weight: number;
    number_of_pouches: number;
    pouch_size: number;
  }>;
}

export function WorkOrderDialog({
  isOpen,
  onClose,
  workOrder,
  onSuccess,
  isReadOnly,
}: WorkOrderDialogProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<WorkOrderFormData>({
    name: '',
    description: '',
    remarks: '',
    status: 'CREATED',
    products: [],
  });

  React.useEffect(() => {
    if (workOrder) {
      setFormData({
        name: workOrder.name,
        description: workOrder.description || '',
        remarks: workOrder.remarks || '',
        status: workOrder.status,
        products: workOrder.work_order_products.map(wop => ({
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

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  const canProceedToProducts = formData.name.trim() !== '';
  const canProceedToInventory = canProceedToProducts && formData.products.length > 0;
  const canProceedToRecipes = canProceedToInventory;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isReadOnly 
              ? 'View Work Order' 
              : workOrder 
                ? 'Edit Work Order' 
                : 'Create New Work Order'
            }
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger 
              value="products" 
              disabled={!canProceedToProducts}
              className={!canProceedToProducts ? 'opacity-50' : ''}
            >
              Products
            </TabsTrigger>
            <TabsTrigger 
              value="inventory" 
              disabled={!canProceedToInventory}
              className={!canProceedToInventory ? 'opacity-50' : ''}
            >
              Inventory
            </TabsTrigger>
            <TabsTrigger 
              value="recipes" 
              disabled={!canProceedToRecipes}
              className={!canProceedToRecipes ? 'opacity-50' : ''}
            >
              Recipes
            </TabsTrigger>
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
              onNext={() => handleTabChange('inventory')}
              onPrevious={() => handleTabChange('basic')}
              isReadOnly={isReadOnly}
            />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <WorkOrderInventoryTab
              formData={formData}
              onNext={() => handleTabChange('recipes')}
              onPrevious={() => handleTabChange('products')}
              isReadOnly={isReadOnly}
            />
          </TabsContent>

          <TabsContent value="recipes" className="space-y-4">
            <WorkOrderRecipesTab
              formData={formData}
              workOrder={workOrder}
              onPrevious={() => handleTabChange('inventory')}
              onSuccess={onSuccess}
              onClose={onClose}
              isReadOnly={isReadOnly}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
