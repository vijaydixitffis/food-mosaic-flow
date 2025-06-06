
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface CompoundIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  ingredients: {
    id: string;
    name: string;
    unit_of_measurement: string | null;
    rate: number | null;
  };
}

interface Compound {
  id: string;
  name: string;
  description: string | null;
  unit_of_measurement: string | null;
  tags: string[] | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  compound_ingredients: CompoundIngredient[];
  total_rate?: number;
}

interface CompoundsTableProps {
  compounds: Compound[];
  isLoading: boolean;
  onEdit: (compound: Compound) => void;
  onDelete: (compoundId: string) => void;
  onToggleActive: (compoundId: string, currentActive: boolean) => void;
  isAdmin: boolean;
}

export function CompoundsTable({
  compounds,
  isLoading,
  onEdit,
  onDelete,
  onToggleActive,
  isAdmin,
}: CompoundsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (compounds.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No compounds found. {isAdmin ? 'Create your first compound to get started.' : ''}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {compounds.map((compound) => (
        <Card key={compound.id} className={!compound.active ? 'opacity-60' : ''}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{compound.name}</h3>
                  <Badge variant={compound.active ? 'default' : 'secondary'}>
                    {compound.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                {compound.description && (
                  <p className="text-gray-600 mb-2">{compound.description}</p>
                )}
                
                {compound.unit_of_measurement && (
                  <p className="text-sm text-gray-500 mb-2">
                    Unit: {compound.unit_of_measurement}
                  </p>
                )}

                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Ingredients:</p>
                  <div className="space-y-1">
                    {compound.compound_ingredients?.map((ci) => (
                      <div key={ci.id} className="text-sm text-gray-600 flex justify-between">
                        <span>
                          {ci.ingredients.name} ({ci.quantity} {ci.ingredients.unit_of_measurement || 'units'})
                        </span>
                        <span className="font-medium">
                          ₹{((ci.ingredients.rate || 0) * ci.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {compound.tags && compound.tags.length > 0 && (
                      <div className="flex gap-1">
                        {compound.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      Total Rate: ₹{compound.total_rate?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
              
              {isAdmin && (
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleActive(compound.id, compound.active)}
                  >
                    {compound.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(compound)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(compound.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
