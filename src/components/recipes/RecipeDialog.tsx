
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormLabel } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { RecipeInstructionsTab } from './RecipeInstructionsTab';
import { RecipeProductsTab } from './RecipeProductsTab';
import { RecipeCompoundsTab } from './RecipeCompoundsTab';
import type { Database } from '@/integrations/supabase/types';

type Recipe = Database['public']['Tables']['recipes']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Compound = Database['public']['Tables']['compounds']['Row'];

interface RecipeInstruction {
  id?: string;
  sequence_number: number;
  instruction_text: string;
}

interface RecipeProduct {
  product_id: string;
  product_name?: string;
}

interface RecipeCompound {
  compound_id: string;
  compound_name?: string;
}

interface RecipeDialogProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeDialog({ recipe, isOpen, onClose }: RecipeDialogProps) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState<RecipeInstruction[]>([]);
  const [recipeProducts, setRecipeProducts] = useState<RecipeProduct[]>([]);
  const [recipeCompounds, setRecipeCompounds] = useState<RecipeCompound[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch products and compounds for selection
  const { data: products } = useQuery({
    queryKey: ['products-for-recipe'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data as Product[];
    }
  });

  const { data: compounds } = useQuery({
    queryKey: ['compounds-for-recipe'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compounds')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data as Compound[];
    }
  });

  // Load recipe data when editing
  useEffect(() => {
    if (recipe && isOpen) {
      console.log('Loading recipe for editing:', recipe);
      setName(recipe.name);
      setDescription(recipe.description || '');
      loadRecipeData(recipe.id);
    } else if (isOpen) {
      console.log('Creating new recipe');
      setName('');
      setDescription('');
      setInstructions([]);
      setRecipeProducts([]);
      setRecipeCompounds([]);
    }
  }, [recipe, isOpen]);

  const loadRecipeData = async (recipeId: string) => {
    try {
      // Load instructions
      const { data: instructionsData, error: instructionsError } = await supabase
        .from('recipe_instructions')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('sequence_number');

      if (instructionsError) throw instructionsError;

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('recipe_products')
        .select(`
          product_id,
          products(name)
        `)
        .eq('recipe_id', recipeId);

      if (productsError) throw productsError;

      // Load compounds
      const { data: compoundsData, error: compoundsError } = await supabase
        .from('recipe_compounds')
        .select(`
          compound_id,
          compounds(name)
        `)
        .eq('recipe_id', recipeId);

      if (compoundsError) throw compoundsError;

      setInstructions(instructionsData || []);
      setRecipeProducts(productsData?.map(rp => ({
        product_id: rp.product_id,
        product_name: rp.products?.name
      })) || []);
      setRecipeCompounds(compoundsData?.map(rc => ({
        compound_id: rc.compound_id,
        compound_name: rc.compounds?.name
      })) || []);

    } catch (error) {
      console.error('Error loading recipe data:', error);
      toast({
        title: "Error",
        description: "Failed to load recipe data",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Recipe name is required",
        variant: "destructive",
      });
      return;
    }

    if (instructions.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one instruction is required",
        variant: "destructive",
      });
      return;
    }

    if (recipeProducts.length === 0 && recipeCompounds.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one product or compound must be associated",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let recipeId: string;

      if (recipe) {
        // Update existing recipe
        const { error } = await supabase
          .from('recipes')
          .update({
            name: name.trim(),
            description: description.trim() || null,
          })
          .eq('id', recipe.id);

        if (error) throw error;
        recipeId = recipe.id;
      } else {
        // Create new recipe
        const { data, error } = await supabase
          .from('recipes')
          .insert({
            name: name.trim(),
            description: description.trim() || null,
          })
          .select()
          .single();

        if (error) throw error;
        recipeId = data.id;
      }

      // Update instructions
      if (recipe) {
        // Delete existing instructions
        await supabase
          .from('recipe_instructions')
          .delete()
          .eq('recipe_id', recipeId);
      }

      // Insert new instructions
      if (instructions.length > 0) {
        const { error: instructionsError } = await supabase
          .from('recipe_instructions')
          .insert(
            instructions.map(inst => ({
              recipe_id: recipeId,
              sequence_number: inst.sequence_number,
              instruction_text: inst.instruction_text.trim(),
            }))
          );

        if (instructionsError) throw instructionsError;
      }

      // Update products
      if (recipe) {
        await supabase
          .from('recipe_products')
          .delete()
          .eq('recipe_id', recipeId);
      }

      if (recipeProducts.length > 0) {
        const { error: productsError } = await supabase
          .from('recipe_products')
          .insert(
            recipeProducts.map(rp => ({
              recipe_id: recipeId,
              product_id: rp.product_id,
            }))
          );

        if (productsError) throw productsError;
      }

      // Update compounds
      if (recipe) {
        await supabase
          .from('recipe_compounds')
          .delete()
          .eq('recipe_id', recipeId);
      }

      if (recipeCompounds.length > 0) {
        const { error: compoundsError } = await supabase
          .from('recipe_compounds')
          .insert(
            recipeCompounds.map(rc => ({
              recipe_id: recipeId,
              compound_id: rc.compound_id,
            }))
          );

        if (compoundsError) throw compoundsError;
      }

      toast({
        title: "Success",
        description: `Recipe ${recipe ? 'updated' : 'created'} successfully`,
      });

      onClose();
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast({
        title: "Error",
        description: `Failed to ${recipe ? 'update' : 'create'} recipe`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly = !isAdmin;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {recipe 
              ? (isReadOnly ? 'View Recipe' : 'Edit Recipe')
              : 'Create New Recipe'
            }
          </DialogTitle>
          <DialogDescription>
            {isReadOnly 
              ? 'View recipe details and instructions'
              : 'Manage recipe information, instructions, and associated products/compounds'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <FormLabel>Recipe Name *</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter recipe name"
                disabled={isReadOnly}
              />
            </div>
            <div>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter recipe description"
                disabled={isReadOnly}
                rows={3}
              />
            </div>
          </div>

          {/* Tabbed sections */}
          <Tabs defaultValue="instructions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="instructions">Instructions</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="compounds">Compounds</TabsTrigger>
            </TabsList>

            <TabsContent value="instructions" className="space-y-4">
              <RecipeInstructionsTab
                instructions={instructions}
                onInstructionsChange={setInstructions}
                isReadOnly={isReadOnly}
              />
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <RecipeProductsTab
                products={products || []}
                recipeProducts={recipeProducts}
                onRecipeProductsChange={setRecipeProducts}
                isReadOnly={isReadOnly}
              />
            </TabsContent>

            <TabsContent value="compounds" className="space-y-4">
              <RecipeCompoundsTab
                compounds={compounds || []}
                recipeCompounds={recipeCompounds}
                onRecipeCompoundsChange={setRecipeCompounds}
                isReadOnly={isReadOnly}
              />
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isReadOnly && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (recipe ? 'Update Recipe' : 'Create Recipe')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
