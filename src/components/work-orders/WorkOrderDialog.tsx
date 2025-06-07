
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
import { WorkOrderReviewTab } from './WorkOrderReviewTab';
import type { Database } from '@/integrations/supabase/types';

type WorkOrder = Database['public']['Tables']['work_orders']['Row'];
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
  status: string;
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
  const canProceedToReview = canProceedToProducts && formData.products.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger 
              value="products" 
              disabled={!canProceedToProducts}
              className={!canProceedToProducts ? 'opacity-50' : ''}
            >
              Products
            </TabsTrigger>
            <TabsTrigger 
              value="review" 
              disabled={!canProceedToReview}
              className={!canProceedToReview ? 'opacity-50' : ''}
            >
              Review
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
              onNext={() => handleTabChange('review')}
              onPrevious={() => handleTabChange('basic')}
              isReadOnly={isReadOnly}
            />
          </TabsContent>

          <TabsContent value="review" className="space-y-4">
            <WorkOrderReviewTab
              formData={formData}
              workOrder={workOrder}
              onPrevious={() => handleTabChange('products')}
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
