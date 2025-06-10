
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight } from 'lucide-react';
import type { WorkOrderFormData } from './WorkOrderDialog';
import type { Database } from '@/integrations/supabase/types';

type WorkOrderStatus = Database['public']['Enums']['work_order_status'];

interface WorkOrderBasicInfoTabProps {
  formData: WorkOrderFormData;
  setFormData: (data: WorkOrderFormData) => void;
  onNext: () => void;
  isReadOnly: boolean;
}

const statusOptions: WorkOrderStatus[] = [
  'CREATED',
  'PROCURED',
  'IN-STOCK',
  'PROCESSED',
  'SHIPPED',
  'EXECUTED',
  'COMPLETE',
];

export function WorkOrderBasicInfoTab({
  formData,
  setFormData,
  onNext,
  isReadOnly,
}: WorkOrderBasicInfoTabProps) {
  const handleInputChange = (field: keyof WorkOrderFormData, value: string | WorkOrderStatus) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const canProceed = formData.name.trim() !== '';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">WO Code *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter WO Code"
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: WorkOrderStatus) => handleInputChange('status', value)}
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Enter work order description"
          rows={3}
          disabled={isReadOnly}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea
          id="remarks"
          value={formData.remarks}
          onChange={(e) => handleInputChange('remarks', e.target.value)}
          placeholder="Enter any additional remarks"
          rows={3}
          disabled={isReadOnly}
        />
      </div>

      {!isReadOnly && (
        <div className="flex justify-end">
          <Button 
            onClick={onNext} 
            disabled={!canProceed}
            className="flex items-center gap-2"
          >
            Next: Add Products
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
