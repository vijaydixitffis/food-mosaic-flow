import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ProductIngredientsTab } from './ProductIngredientsTab';
import { ProductCompoundsTab } from './ProductCompoundsTab';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];
type Ingredient = Database['public']['Tables']['ingredients']['Row'];
type Compound = Database['public']['Tables']['compounds']['Row'];

type ProductWithIngredients = Product & {
  product_ingredients: Array<{
    id: string;
    ingredient_id: string;
    quantity: number;
    ingredients: {
      id: string;
      name: string;
      unit_of_measurement: string | null;
    };
  }>;
  product_compounds: Array<{
    id: string;
    compound_id: string;
    quantity: number;
    compounds: {
      id: string;
      name: string;
      unit_of_measurement: string | null;
    };
  }>;
};

interface ProductRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductWithIngredients | null;
  onSuccess: () => void;
  isReadOnly?: boolean;
}

type ProductIngredient = {
  ingredient_id: string;
  quantity: number;
  ingredient_name?: string;
};

type ProductCompound = {
  compound_id: string;
  quantity: number;
  compound_name?: string;
};

export function ProductRecipeDialog({
  isOpen,
  onClose,
  product,
  onSuccess,
  isReadOnly = false,
}: ProductRecipeDialogProps) {
  console.log('ProductRecipeDialog props:', { isOpen, product: product?.name, isReadOnly });
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('ingredients');
  
  // Ingredients state
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([]);
  const [productIngredients, setProductIngredients] = React.useState<ProductIngredient[]>([]);
  const [selectedIngredient, setSelectedIngredient] = React.useState('');
  const [ingredientQuantity, setIngredientQuantity] = React.useState('');
  
  // Compounds state
  const [compounds, setCompounds] = React.useState<Compound[]>([]);
  const [productCompounds, setProductCompounds] = React.useState<ProductCompound[]>([]);
  const [selectedCompound, setSelectedCompound] = React.useState('');
  const [compoundQuantity, setCompoundQuantity] = React.useState('');

  // Initialize product ingredients and compounds when product changes
  useEffect(() => {
    if (product && isOpen) {
      // Set existing product ingredients
      const existingIngredients = product.product_ingredients?.map(pi => ({
        ingredient_id: pi.ingredient_id,
        quantity: pi.quantity,
        ingredient_name: pi.ingredients?.name
      })) || [];
      setProductIngredients(existingIngredients);

      // Set existing product compounds
      const existingCompounds = product.product_compounds?.map(pc => ({
        compound_id: pc.compound_id,
        quantity: pc.quantity,
        compound_name: pc.compounds?.name
      })) || [];
      setProductCompounds(existingCompounds);
    }
  }, [product, isOpen]);

  // Fetch ingredients and compounds data when dialog opens
  useEffect(() => {
    if (isOpen) {
      const fetchIngredientsAndCompounds = async () => {
        try {
          // Fetch ingredients
          const { data: ingredientsData, error: ingredientsError } = await supabase
            .from('ingredients')
            .select('*')
            .order('name', { ascending: true });
          
          if (ingredientsError) throw ingredientsError;
          setIngredients(ingredientsData || []);

          // Fetch compounds
          const { data: compoundsData, error: compoundsError } = await supabase
            .from('compounds')
            .select('*')
            .order('name', { ascending: true });
          
          if (compoundsError) throw compoundsError;
          setCompounds(compoundsData || []);
        } catch (error) {
          console.error('Error fetching ingredients and compounds:', error);
        }
      };

      fetchIngredientsAndCompounds();
    }
  }, [isOpen]);

  // Ingredient handlers
  const handleAddIngredient = () => {
    if (selectedIngredient && ingredientQuantity) {
      const selectedIngredientData = ingredients.find(i => i.id === selectedIngredient);
      const newIngredient: ProductIngredient = {
        ingredient_id: selectedIngredient,
        quantity: parseFloat(ingredientQuantity),
        ingredient_name: selectedIngredientData?.name || ''
      };
      setProductIngredients([...productIngredients, newIngredient]);
      setSelectedIngredient('');
      setIngredientQuantity('');
    }
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    setProductIngredients(productIngredients.filter(pi => pi.ingredient_id !== ingredientId));
  };

  // Compound handlers
  const handleUpdateCompoundQuantity = (compoundId: string, quantity: number) => {
    const existingCompound = productCompounds.find(pc => pc.compound_id === compoundId);
    const compoundData = compounds.find(c => c.id === compoundId);
    
    if (existingCompound) {
      // Update existing compound quantity
      setProductCompounds(
        productCompounds.map(pc => 
          pc.compound_id === compoundId 
            ? { ...pc, quantity, compound_name: compoundData?.name || '' } 
            : pc
        )
      );
    } else if (quantity > 0) {
      // Add new compound
      const newCompound: ProductCompound = {
        compound_id: compoundId,
        quantity,
        compound_name: compoundData?.name || ''
      };
      setProductCompounds([...productCompounds, newCompound]);
    }
  };

  const handleRemoveCompound = (compoundId: string) => {
    setProductCompounds(productCompounds.filter(pc => pc.compound_id !== compoundId));
  };

const handleSave = async () => {
  if (!product) return;
  
  setIsSubmitting(true);
  try {
    // Delete existing product ingredients
    const { error: deleteIngredientsError } = await supabase
      .from('product_ingredients')
      .delete()
      .eq('product_id', product.id);

    if (deleteIngredientsError) throw deleteIngredientsError;

    // Delete existing product compounds
    const { error: deleteCompoundsError } = await supabase
      .from('product_compounds')
      .delete()
      .eq('product_id', product.id);

    if (deleteCompoundsError) throw deleteCompoundsError;

    // Prepare ingredients data for batch insert
    const ingredientsToInsert = productIngredients.map(pi => ({
      product_id: product.id,
      ingredient_id: pi.ingredient_id,
      quantity: pi.quantity,
    }));

    // Prepare compounds data for batch insert
    const compoundsToInsert = productCompounds.map(pc => ({
      product_id: product.id,
      compound_id: pc.compound_id,
      quantity: pc.quantity,
    }));

    // Insert ingredients if there are any
    if (ingredientsToInsert.length > 0) {
      const { error: ingredientsError } = await supabase
        .from('product_ingredients')
        .insert(ingredientsToInsert);

      if (ingredientsError) throw ingredientsError;
    }

    // Insert compounds if there are any
    if (compoundsToInsert.length > 0) {
      const { error: compoundsError } = await supabase
        .from('product_compounds')
        .insert(compoundsToInsert);

      if (compoundsError) throw compoundsError;
    }
    
    toast({
      title: "Success",
      description: "Product recipe updated successfully",
    });
    
    onSuccess();
    onClose();
  } catch (error) {
    console.error('Error saving product recipe:', error);
    toast({
      title: "Error",
      description: "Failed to save product recipe. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isReadOnly ? 'View Product Recipe' : `Manage Recipe: ${product?.name || 'New Product'}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="compounds">Compounds</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ingredients" className="space-y-4">
              <ProductIngredientsTab 
                ingredients={ingredients}
                productIngredients={productIngredients}
                selectedIngredient={selectedIngredient}
                ingredientQuantity={ingredientQuantity}
                onSelectedIngredientChange={setSelectedIngredient}
                onIngredientQuantityChange={setIngredientQuantity}
                onAddIngredient={handleAddIngredient}
                onRemoveIngredient={handleRemoveIngredient}
              />
            </TabsContent>
            
            <TabsContent value="compounds" className="space-y-4">
              <ProductCompoundsTab 
                compounds={compounds}
                productCompounds={productCompounds}
                onUpdateQuantity={handleUpdateCompoundQuantity}
                onRemoveCompound={handleRemoveCompound}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Recipe'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
