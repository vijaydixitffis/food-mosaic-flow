
import React from 'react';
import { FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Compound = Database['public']['Tables']['compounds']['Row'];

interface ProductCompound {
  compound_id: string;
  quantity: number;
  compound_name?: string;
}

interface ProductCompoundsTabProps {
  compounds: Compound[];
  productCompounds: ProductCompound[];
  selectedCompound: string;
  compoundQuantity: string;
  onSelectedCompoundChange: (value: string) => void;
  onCompoundQuantityChange: (value: string) => void;
  onAddCompound: () => void;
  onRemoveCompound: (compoundId: string) => void;
}

export function ProductCompoundsTab({
  compounds,
  productCompounds,
  selectedCompound,
  compoundQuantity,
  onSelectedCompoundChange,
  onCompoundQuantityChange,
  onAddCompound,
  onRemoveCompound,
}: ProductCompoundsTabProps) {
  return (
    <div className="space-y-4">
      <FormLabel>Product Compounds * (Add at least one ingredient or compound)</FormLabel>
      
      {/* Add Compound */}
      <div className="flex gap-2">
        <Select value={selectedCompound} onValueChange={onSelectedCompoundChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select compound" />
          </SelectTrigger>
          <SelectContent>
            {compounds.map((compound) => (
              <SelectItem key={compound.id} value={compound.id}>
                {compound.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          step="0.001"
          placeholder="Quantity"
          value={compoundQuantity}
          onChange={(e) => onCompoundQuantityChange(e.target.value)}
          className="w-24"
        />
        <Button type="button" onClick={onAddCompound} size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Selected Compounds */}
      {productCompounds.length > 0 && (
        <div className="space-y-2">
          {productCompounds.map((pc) => (
            <div key={pc.compound_id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-sm">
                {pc.compound_name} - Quantity: {pc.quantity}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveCompound(pc.compound_id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
