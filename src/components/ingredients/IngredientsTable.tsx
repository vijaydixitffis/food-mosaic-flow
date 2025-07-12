
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2, Eye } from 'lucide-react';
import { Ingredient } from './IngredientsPage';

interface IngredientsTableProps {
  ingredients: Ingredient[];
  isLoading: boolean;
  onEdit: (ingredient: Ingredient) => void;
  onDeactivate: (id: string) => void;
  isReadOnly?: boolean;
}

export function IngredientsTable({ 
  ingredients, 
  isLoading, 
  onEdit, 
  onDeactivate,
  isReadOnly = false 
}: IngredientsTableProps) {
  console.log('IngredientsTable received props:', { 
    ingredientsCount: ingredients.length, 
    isLoading, 
    ingredients,
    isReadOnly 
  });

  if (isLoading) {
    console.log('Rendering loading state');
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading ingredients...</div>
      </div>
    );
  }

  if (ingredients.length === 0) {
    console.log('Rendering empty state - no ingredients found');
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">No ingredients found. Add your first ingredient!</div>
      </div>
    );
  }

  console.log('Rendering table with ingredients:', ingredients);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Rate per Kg (₹)</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Tags</TableHead>
 <TableHead>Stock</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ingredients.map((ingredient) => {
          console.log('Rendering ingredient row:', ingredient);
          return (
            <TableRow key={ingredient.id}>
              <TableCell className="font-medium">{ingredient.name}</TableCell>
              <TableCell>{ingredient.short_description || '-'}</TableCell>
              <TableCell>{ingredient.unit_of_measurement || '-'}</TableCell>
              <TableCell>
                {ingredient.rate ? `₹${ingredient.rate.toFixed(2)}` : '-'}
              </TableCell>
              <TableCell>
                <Badge variant={ingredient.active ? 'default' : 'secondary'}>
                  {ingredient.active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                {ingredient.tags && ingredient.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {ingredient.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
 <TableCell>
                {ingredient.stock !== null && ingredient.stock !== undefined ? ingredient.stock : 'N/A'}
 </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(ingredient)}
                  >
                    {isReadOnly ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  </Button>
                  {!isReadOnly && ingredient.active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeactivate(ingredient.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
