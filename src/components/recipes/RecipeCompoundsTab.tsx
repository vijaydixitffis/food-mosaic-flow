
import React, { useState } from 'react';
import { FormLabel } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Compound = Database['public']['Tables']['compounds']['Row'];

interface RecipeCompound {
  compound_id: string;
  compound_name?: string;
}

interface RecipeCompoundsTabProps {
  compounds: Compound[];
  recipeCompounds: RecipeCompound[];
  onRecipeCompoundsChange: (compounds: RecipeCompound[]) => void;
  isReadOnly: boolean;
}

export function RecipeCompoundsTab({
  compounds,
  recipeCompounds,
  onRecipeCompoundsChange,
  isReadOnly,
}: RecipeCompoundsTabProps) {
  const [selectedCompound, setSelectedCompound] = useState('');

  const addCompound = () => {
    if (!selectedCompound) return;

    const compound = compounds.find(c => c.id === selectedCompound);
    if (!compound) return;

    // Check if compound is already added
    if (recipeCompounds.some(rc => rc.compound_id === selectedCompound)) {
      return;
    }

    const newRecipeCompound: RecipeCompound = {
      compound_id: selectedCompound,
      compound_name: compound.name,
    };

    onRecipeCompoundsChange([...recipeCompounds, newRecipeCompound]);
    setSelectedCompound('');
  };

  const removeCompound = (compoundId: string) => {
    onRecipeCompoundsChange(recipeCompounds.filter(rc => rc.compound_id !== compoundId));
  };

  const availableCompounds = compounds.filter(
    compound => !recipeCompounds.some(rc => rc.compound_id === compound.id)
  );

  return (
    <div className="space-y-4">
      <FormLabel>Associated Compounds</FormLabel>
      
      {!isReadOnly && (
        <div className="flex gap-2">
          <Select value={selectedCompound} onValueChange={setSelectedCompound}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a compound" />
            </SelectTrigger>
            <SelectContent>
              {availableCompounds.map((compound) => (
                <SelectItem key={compound.id} value={compound.id}>
                  {compound.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            type="button" 
            onClick={addCompound} 
            size="sm"
            disabled={!selectedCompound}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {recipeCompounds.length > 0 ? (
        <div className="space-y-2">
          {recipeCompounds.map((rc) => (
            <div 
              key={rc.compound_id} 
              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline">Compound</Badge>
                <span className="font-medium">{rc.compound_name}</span>
              </div>
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCompound(rc.compound_id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          {isReadOnly 
            ? 'No compounds associated with this recipe'
            : 'No compounds selected. Choose compounds that this recipe can manufacture.'
          }
        </div>
      )}
    </div>
  );
}
