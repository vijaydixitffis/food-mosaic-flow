import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Search, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CategoriesTable } from './CategoriesTable';
import { CategoriesDialog } from './CategoriesDialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type Category = Database['public']['Tables']['categories']['Row'];

export function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isStaff, isAdmin } = useAuth();

  // Fetch categories
  const { data: categoriesData, isLoading, error } = useQuery({
    queryKey: ['categories', searchTerm, currentPage, pageSize],
    queryFn: async () => {
      try {
        let query = supabase
          .from('categories')
          .select('*', { count: 'exact' })
          .order('category_code', { ascending: true });

        if (searchTerm) {
          query = query.or(`category_code.ilike.%${searchTerm}%,category_name.ilike.%${searchTerm}%`);
        }

        // Get paginated results
        const { data, error, count } = await query
          .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

        if (error) throw error;

        return {
          categories: data as Category[],
          total: count || 0
        };
      } catch (err) {
        console.error('CategoriesPage - Query function error:', err);
        throw err;
      }
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('categories')
        .insert(category);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      setIsDialogOpen(false);
      setEditingCategory(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create category: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...category }: Partial<Category> & { id: string }) => {
      const { error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      setIsDialogOpen(false);
      setEditingCategory(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update category: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddCategory = () => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view categories",
        variant: "destructive",
      });
      return;
    }
    setEditingCategory(null);
    setIsReadOnly(false);
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view categories",
        variant: "destructive",
      });
      return;
    }
    setEditingCategory(category);
    setIsReadOnly(false);
    setIsDialogOpen(true);
  };

  const handleViewCategory = (category: Category) => {
    setEditingCategory(category);
    setIsReadOnly(true);
    setIsDialogOpen(true);
  };

  const handleDialogSuccess = (category: Partial<Category>) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, ...category });
    } else {
      createCategoryMutation.mutate(category as Omit<Category, 'id' | 'created_at' | 'updated_at'>);
    }
  };

  const categories = categoriesData?.categories || [];
  const totalItems = categoriesData?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <Tag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
            <p className="text-slate-600">Manage product and order categories</p>
          </div>
        </div>
        {!isStaff && (
          <Button onClick={handleAddCategory} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search categories by code or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error loading categories</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
        </div>
      )}

      {/* Categories Table */}
      <div className="w-full">
        <CategoriesTable
          categories={categories}
          isLoading={isLoading}
          onEdit={handleEditCategory}
          onView={handleViewCategory}
          isReadOnly={isStaff}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} categories
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Categories Dialog */}
      <CategoriesDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        category={editingCategory}
        onSuccess={handleDialogSuccess}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
