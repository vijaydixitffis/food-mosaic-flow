import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Carrot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { IngredientsTable } from './IngredientsTable';
import { IngredientDialog } from './IngredientDialog';
import { IngredientsSearch } from './IngredientsSearch';
import { IngredientsPagination } from './IngredientsPagination';

export interface Ingredient {
  id: string;
  name: string;
  short_description: string | null;
  unit_of_measurement: string | null;
  rate: number | null;
  tags: string[] | null;
  active: boolean | null;
  created_at: string;
  updated_at: string;
}

export function IngredientsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, isStaff } = useAuth();

  // Fetch ingredients
  const { data: ingredients = [], isLoading, error } = useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      console.log('Fetching ingredients from Supabase...');
      
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name', { ascending: true });
      
      console.log('Supabase response:', { data, error });
      
      if (error) {
        console.error('Error fetching ingredients:', error);
        throw error;
      }
      
      console.log('Successfully fetched ingredients:', data);
      return data as Ingredient[];
    },
  });

  // Filter ingredients based on search term
  const filteredIngredients = useMemo(() => {
    if (!searchTerm.trim()) {
      return ingredients;
    }

    const searchLower = searchTerm.toLowerCase();
    
    return ingredients.filter((ingredient) => {
      // Search in name
      const nameMatch = ingredient.name?.toLowerCase().includes(searchLower);
      
      // Search in short_description
      const descriptionMatch = ingredient.short_description?.toLowerCase().includes(searchLower);
      
      // Search in tags
      const tagsMatch = ingredient.tags?.some(tag => 
        tag.toLowerCase().includes(searchLower)
      );

      return nameMatch || descriptionMatch || tagsMatch;
    });
  }, [ingredients, searchTerm]);

  // Paginate filtered ingredients
  const paginatedIngredients = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredIngredients.slice(startIndex, endIndex);
  }, [filteredIngredients, currentPage, pageSize]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredIngredients.length / pageSize);

  // Reset to first page when search term or page size changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  console.log('Current ingredients state:', ingredients);
  console.log('Filtered ingredients:', filteredIngredients);
  console.log('Paginated ingredients:', paginatedIngredients);
  console.log('Search term:', searchTerm);
  console.log('Current page:', currentPage);
  console.log('Page size:', pageSize);
  console.log('Total pages:', totalPages);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);

  // Deactivate ingredient mutation
  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ingredients')
        .update({ active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast({
        title: "Success",
        description: "Ingredient deactivated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to deactivate ingredient",
        variant: "destructive",
      });
      console.error('Error deactivating ingredient:', error);
    },
  });

  const handleAddIngredient = () => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view ingredients",
        variant: "destructive",
      });
      return;
    }
    setEditingIngredient(null);
    setIsDialogOpen(true);
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setIsDialogOpen(true);
  };

  const handleDeactivateIngredient = async (id: string) => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view ingredients",
        variant: "destructive",
      });
      return;
    }
    if (window.confirm('Are you sure you want to deactivate this ingredient?')) {
      deactivateMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingIngredient(null);
  };

  const handleSearchChange = (value: string) => {
    console.log('Search term changed to:', value);
    setSearchTerm(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
  };

  if (error) {
    console.error('Rendering error state:', error);
    return (
      <div className="px-6 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Carrot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isStaff ? 'View Ingredients' : 'Manage Ingredients'}
              </h1>
              <p className="text-gray-600 mt-2">
                {isStaff ? 'View ingredient information' : 'Create and manage ingredient information'}
              </p>
            </div>
          </div>
          {!isStaff && (
            <Button onClick={handleAddIngredient} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Ingredient
            </Button>
          )}
        </div>

        {/* Search */}
        <IngredientsSearch searchTerm={searchTerm} onSearchChange={handleSearchChange} />

        {/* Error Display */}
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error loading ingredients</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
        </div>

        {/* Ingredients Table */}
        <IngredientsTable
          ingredients={paginatedIngredients}
          isLoading={isLoading}
          onEdit={handleEditIngredient}
          onDeactivate={handleDeactivateIngredient}
          isReadOnly={isStaff}
        />

        {/* Pagination */}
        <IngredientsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredIngredients.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />

        {/* Ingredient Dialog */}
        <IngredientDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          ingredient={editingIngredient}
          isReadOnly={isStaff}
        />
      </div>
    );
  }

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Carrot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isStaff ? 'View Ingredients' : 'Manage Ingredients'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isStaff ? 'View ingredient information' : 'Create and manage ingredient information'}
            </p>
          </div>
        </div>
        {!isStaff && (
          <Button onClick={handleAddIngredient} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Ingredient
          </Button>
        )}
      </div>

      {/* Search */}
      <IngredientsSearch searchTerm={searchTerm} onSearchChange={handleSearchChange} />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error loading ingredients</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
        </div>
      )}

      {/* Ingredients Table */}
      <IngredientsTable
        ingredients={paginatedIngredients}
        isLoading={isLoading}
        onEdit={handleEditIngredient}
        onDeactivate={handleDeactivateIngredient}
        isReadOnly={isStaff}
      />

      {/* Pagination */}
      <IngredientsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredIngredients.length}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Ingredient Dialog */}
      <IngredientDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        ingredient={editingIngredient}
        isReadOnly={isStaff}
      />
    </div>
  );
}
