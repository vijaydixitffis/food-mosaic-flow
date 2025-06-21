import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { RecipesTable } from './RecipesTable';
import { RecipeDialog } from './RecipeDialog';
import { RecipesPagination } from './RecipesPagination';
import type { Database } from '@/integrations/supabase/types';

type Recipe = Database['public']['Tables']['recipes']['Row'];

const RECIPES_PER_PAGE = 10;

export function RecipesPage() {
  const { isAdmin, isStaff, user, profile } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(RECIPES_PER_PAGE);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const queryClient = useQueryClient();

  console.log('RecipesPage - Auth Debug:', {
    user: user?.id,
    profile: profile?.role,
    isStaff,
    isAdmin,
    userEmail: user?.email
  });

  const { data: recipesData, isLoading, error } = useQuery({
    queryKey: ['recipes', searchTerm, currentPage, pageSize],
    queryFn: async () => {
      console.log('RecipesPage - Starting query with auth state:', {
        userId: user?.id,
        userRole: profile?.role,
        isAuthenticated: !!user
      });

      try {
        let query = supabase
          .from('recipes')
          .select(`
            *,
            recipe_instructions (
              id,
              instruction_text,
              sequence_number
            ),
            recipe_products (
              product_id,
              products (
                id,
                name
              )
            ),
            recipe_compounds (
              compound_id,
              compounds (
                id,
                name
              )
            )
          `)
          .order('name', { ascending: true });

        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        console.log('RecipesPage - About to execute count query');
        
        // Get total count for pagination
        let countQuery = supabase
          .from('recipes')
          .select('*', { count: 'exact', head: true });

        if (searchTerm) {
          countQuery = countQuery.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        const { count, error: countError } = await countQuery;

        if (countError) {
          console.error('RecipesPage - Count query error:', {
            error: countError,
            message: countError.message,
            details: countError.details,
            hint: countError.hint,
            code: countError.code
          });
          throw countError;
        }

        console.log('RecipesPage - Count query successful, count:', count);
        console.log('RecipesPage - About to execute data query with pagination');

        // Get paginated results
        const { data, error } = await query
          .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

        if (error) {
          console.error('RecipesPage - Data query error:', {
            error: error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        console.log('RecipesPage - Data query successful:', {
          dataLength: data?.length,
          totalCount: count,
          sampleData: data?.[0]
        });

        return {
          recipes: data as Recipe[],
          total: count || 0
        };
      } catch (err) {
        console.error('RecipesPage - Query function error:', err);
        throw err;
      }
    },
  });

  console.log('RecipesPage - Query state:', {
    isLoading,
    error: error ? {
      message: error.message,
      name: error.name,
      stack: error.stack
    } : null,
    hasData: !!recipesData
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ recipeId, active }: { recipeId: string; active: boolean }) => {
      const { error } = await supabase
        .from('recipes')
        .update({ active })
        .eq('id', recipeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast({
        title: "Success",
        description: "Recipe status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update recipe status: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateRecipe = () => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view recipes",
        variant: "destructive",
      });
      return;
    }
    setEditingRecipe(null);
    setIsDialogOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view recipes",
        variant: "destructive",
      });
      return;
    }
    setEditingRecipe(recipe);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingRecipe(null);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const recipes = recipesData?.recipes || [];
  const totalItems = recipesData?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isStaff ? 'View Recipes' : 'Manage Recipes'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isStaff ? 'View recipe information' : 'Create and manage recipe information'}
            </p>
          </div>
        </div>
        {!isStaff && (
          <Button onClick={handleCreateRecipe} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Recipe
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search recipes by name or description..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error loading recipes</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <details className="mt-2">
            <summary className="text-red-600 text-sm cursor-pointer">Debug Details</summary>
            <pre className="text-xs text-red-500 mt-1 whitespace-pre-wrap">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Recipes Table */}
      <RecipesTable
        recipes={recipes}
        onEdit={handleEditRecipe}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['recipes'] })}
        isAdmin={!isStaff}
      />

      {/* Pagination */}
      <RecipesPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Recipe Dialog */}
      <RecipeDialog
        recipe={editingRecipe}
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        isReadOnly={isStaff}
      />
    </div>
  );
}
