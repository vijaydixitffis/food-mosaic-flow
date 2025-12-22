import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
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
  onUpdateQuantity: (compoundId: string, quantity: number) => void;
  onRemoveCompound: (compoundId: string) => void;
}

export function ProductCompoundsTab({
  compounds,
  productCompounds,
  onUpdateQuantity,
  onRemoveCompound,
}: ProductCompoundsTabProps) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  // Initialize quantities from productCompounds
  useEffect(() => {
    const initialQuantities: Record<string, string> = {};
    productCompounds.forEach(pc => {
      initialQuantities[pc.compound_id] = pc.quantity.toString();
    });
    setQuantities(initialQuantities);
  }, [productCompounds]);

  const handleQuantityChange = (compoundId: string, value: string) => {
    // Only allow numbers and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setQuantities(prev => ({
        ...prev,
        [compoundId]: value
      }));
      
      // Update the parent component if the value is a valid number
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0) {
        onUpdateQuantity(compoundId, numValue);
      } else if (value === '') {
        // If the field is cleared, remove the compound
        onRemoveCompound(compoundId);
      }
    }
  };

  const handleBlur = (compoundId: string) => {
    // If the field is empty or zero after blur, remove the compound
    if (!quantities[compoundId] || parseFloat(quantities[compoundId]) <= 0) {
      onRemoveCompound(compoundId);
    }
  };

  const handleAddCompound = (compound: Compound) => {
    // Add compound with default quantity of 1 if not already added
    if (!quantities[compound.id] || quantities[compound.id] === '0') {
      onUpdateQuantity(compound.id, 1);
      setQuantities(prev => ({
        ...prev,
        [compound.id]: '1'
      }));
    }
  };

  // Create a map of all compounds for easy lookup
  const allCompounds = [...compounds].sort((a, b) => 
    (a.name || '').localeCompare(b.name || '')
  );

  return (
    <div className="space-y-4">
      <Label>Product Compounds</Label>
      
      {/* Compounds List with Quantity Inputs */}
      <div className="space-y-2">
        {allCompounds.map((compound) => {
          const isAdded = productCompounds.some(pc => pc.compound_id === compound.id);
          const quantity = quantities[compound.id] || '';
          
          return (
            <div 
              key={compound.id} 
              className={`flex items-center gap-2 p-2 rounded ${isAdded ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
            >
              <div className="flex-1">
                <div className="font-medium">{compound.name}</div>
                {compound.unit_of_measurement && (
                  <div className="text-xs text-gray-500">Unit: {compound.unit_of_measurement}</div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(compound.id, e.target.value)}
                  onBlur={() => handleBlur(compound.id)}
                  className="w-24 text-right"
                  onKeyDown={(e) => {
                    // Prevent non-numeric input
                    if (!/[0-9.]/.test(e.key) && 
                        e.key !== 'Backspace' && 
                        e.key !== 'Delete' && 
                        e.key !== 'Tab' && 
                        !e.ctrlKey && 
                        !e.metaKey) {
                      e.preventDefault();
                    }
                  }}
                />
                {isAdded ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveCompound(compound.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCompound(compound)}
                  >
                    Add
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
