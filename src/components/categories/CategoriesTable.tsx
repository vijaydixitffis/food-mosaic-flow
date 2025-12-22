import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategoriesTableProps {
  categories: Category[];
  isLoading?: boolean;
  onEdit: (category: Category) => void;
  onView: (category: Category) => void;
  isReadOnly?: boolean;
}

export function CategoriesTable({ 
  categories = [], 
  isLoading = false, 
  onEdit, 
  onView, 
  isReadOnly 
}: CategoriesTableProps) {
  // Sort categories by sequence number
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.sequence - b.sequence);
  }, [categories]);

  if (isLoading) {
    return (
      <div className="rounded-md border p-4">
        <p className="text-center text-gray-500">Loading categories...</p>
      </div>
    );
  }

  if (sortedCategories.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-gray-500">No categories found</p>
        <p className="text-sm text-gray-400 mt-1">Create your first category to get started</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] whitespace-nowrap">Sequence</TableHead>
            <TableHead className="w-[120px] whitespace-nowrap">Category Code</TableHead>
            <TableHead className="w-[300px]">Category Name</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCategories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium text-center">
                {category.sequence}
              </TableCell>
              <TableCell className="font-medium font-mono text-sm">
                {category.category_code}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{category.category_name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={category.is_active ? "default" : "secondary"}
                  className={category.is_active ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}
                >
                  {category.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => isReadOnly ? onView(category) : onEdit(category)}
                    className="flex items-center gap-1"
                  >
                    {isReadOnly ? <Eye className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
                    {isReadOnly ? 'View' : 'Edit'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}