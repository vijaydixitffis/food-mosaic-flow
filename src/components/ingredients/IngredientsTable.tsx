
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
import { Edit, Trash2 } from 'lucide-react';
import { Ingredient } from './IngredientsPage';

interface IngredientsTableProps {
  ingredients: Ingredient[];
  isLoading: boolean;
  onEdit: (ingredient: Ingredient) => void;
  onDeactivate: (id: string) => void;
}

export function IngredientsTable({ 
  ingredients, 
  isLoading, 
  onEdit, 
  onDeactivate 
}: IngredientsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading ingredients...</div>
      </div>
    );
  }

  if (ingredients.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">No ingredients found. Add your first ingredient!</div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Rate</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ingredients.map((ingredient) => (
          <TableRow key={ingredient.id}>
            <TableCell className="font-medium">{ingredient.name}</TableCell>
            <TableCell>{ingredient.short_description || '-'}</TableCell>
            <TableCell>{ingredient.unit_of_measurement || '-'}</TableCell>
            <TableCell>
              {ingredient.rate ? `$${ingredient.rate.toFixed(2)}` : '-'}
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
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(ingredient)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                {ingredient.active && (
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
        ))}
      </TableBody>
    </Table>
  );
}
