import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkOrderInventoryTab } from './WorkOrderInventoryTab';
import { WorkOrderRecipesTab } from './WorkOrderRecipesTab';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { WorkOrderFormData } from './WorkOrderDialog';

interface DeliveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: any;
  formData: WorkOrderFormData;
  onSuccess: () => void;
  isReadOnly: boolean;
}

export function DeliveryDialog({
  isOpen,
  onClose,
  workOrder,
  formData,
  onSuccess,
  isReadOnly: _isReadOnly, // Rename to indicate we'll override this
}: DeliveryDialogProps) {
  // Always set to read-only mode for all users
  const isReadOnly = true;
  const [activeTab, setActiveTab] = useState('inventory');
  const canProceedToRecipes = formData.products.length > 0;

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isReadOnly ? 'View Delivery Details' : 'Delivery Details'}{workOrder?.name ? ` - WO Code: ${workOrder.name}` : ''}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory">
              {workOrder?.name ? `Inventory - ${workOrder.name}` : 'Inventory'}
            </TabsTrigger>
            <TabsTrigger 
              value="recipes" 
              disabled={!canProceedToRecipes}
              className={!canProceedToRecipes ? 'opacity-50' : ''}
            >
              {workOrder?.name ? `Recipes - ${workOrder.name}` : 'Recipes'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-4">
            <WorkOrderInventoryTab
              formData={formData}
              onNext={() => handleTabChange('recipes')}
              onPrevious={onClose}
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
