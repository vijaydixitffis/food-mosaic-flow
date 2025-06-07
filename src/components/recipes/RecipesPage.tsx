
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { RecipesTable } from './RecipesTable';
import { RecipeDialog } from './RecipeDialog';
import { RecipesPagination } from './RecipesPagination';
import type { Database } from '@/integrations/supabase/types';

type Recipe = Database['public']['Tables']['recipes']['Row'];

const RECIPES_PER_PAGE = 10;

export function RecipesPage() {
  const { isAdmin, isStaff } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  console.log('RecipesPage rendered, isAdmin:', isAdmin, 'isStaff:', isStaff);

  const { data: recipesData, isLoading, refetch } = useQuery({
    queryKey: ['recipes', searchTerm, currentPage],
    queryFn: async () => {
      console.log('Fetching recipes with search term:', searchTerm);
      
      let query = supabase
        .from('recipes')
        .select(`
          *,
          recipe_instructions(*),
          recipe_products(
            product_id,
            products(name)
          ),
          recipe_compounds(
            compound_id,
            compounds(name)
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (searchTerm) {
        // Search in recipe name, description, product names, compound names, and instruction text
        query = query.or(`
          name.ilike.%${searchTerm}%,
          description.ilike.%${searchTerm}%,
          recipe_instructions.instruction_text.ilike.%${searchTerm}%,
          recipe_products.products.name.ilike.%${searchTerm}%,
          recipe_compounds.compounds.name.ilike.%${searchTerm}%
        `);
      }

      const from = (currentPage - 1) * RECIPES_PER_PAGE;
      const to = from + RECIPES_PER_PAGE - 1;

      const { data, error, count } = await query.range(from, to);
      
      if (error) {
        console.error('Error fetching recipes:', error);
        throw error;
      }

      console.log('Fetched recipes:', data);
      return {
        recipes: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / RECIPES_PER_PAGE)
      };
    }
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
    console.log('Creating new recipe');
    setSelectedRecipe(null);
    setIsDialogOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    console.log('Editing recipe:', recipe);
    setSelectedRecipe(recipe);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedRecipe(null);
    refetch();
  };

  const handleSearch = (value: string) => {
    console.log('Searching recipes with term:', value);
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isStaff ? 'View Recipes' : 'Recipes'}
          </h2>
          <p className="text-muted-foreground">
            {isStaff ? 'View recipes and manufacturing instructions' : 'Manage your recipes and manufacturing instructions'}
          </p>
        </div>
        {!isStaff && (
          <Button onClick={handleCreateRecipe}>
            <Plus className="w-4 h-4 mr-2" />
            Add Recipe
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipe Management</CardTitle>
          <CardDescription>
            {isStaff ? 'View all recipes in your system' : 'Search and manage all recipes in your system'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes by name, description, products, compounds, or instructions..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading recipes...</div>
            </div>
          ) : (
            <>
              <RecipesTable
                recipes={recipesData?.recipes || []}
                onEdit={handleEditRecipe}
                onRefresh={refetch}
                isAdmin={isAdmin}
              />
              
              {recipesData && recipesData.totalPages > 1 && (
                <RecipesPagination
                  currentPage={currentPage}
                  totalPages={recipesData.totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <RecipeDialog
        recipe={selectedRecipe}
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        isReadOnly={isStaff}
      />
    </div>
  );
}
