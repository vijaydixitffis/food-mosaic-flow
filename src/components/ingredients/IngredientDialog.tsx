
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Ingredient } from './IngredientsPage';
import { addIngredientStock, getIngredientStockHistory } from '@/integrations/supabase/stock';

interface IngredientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient?: Ingredient | null;
  isReadOnly?: boolean;
}

interface IngredientFormData {
  name: string;
  short_description: string;
  unit_of_measurement: string;
  rate: string;
  tags: string;
  initial_stock: string; // Add initial stock field
}

const UNIT_OPTIONS = [
  { value: 'KG', label: 'Kilogram (KG)' },
  { value: 'Gms', label: 'Grams (Gms)' },
  { value: 'Lit', label: 'Liter (Lit)' },
  { value: 'Mls', label: 'Milliliter (Mls)' },
  { value: 'Pack', label: 'Pack' },
  { value: 'Dozen', label: 'Dozen' },
  { value: 'Units', label: 'Number of Units' },
];

export function IngredientDialog({ isOpen, onClose, ingredient, isReadOnly = false }: IngredientDialogProps) {
  const [formData, setFormData] = useState<IngredientFormData>({
    name: '',
    short_description: '',
    unit_of_measurement: '',
    rate: '',
    tags: '',
    initial_stock: '', // Initialize initial_stock
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddStock, setShowAddStock] = useState(false);
  const [showStockHistory, setShowStockHistory] = useState(false);
  const [addStockQty, setAddStockQty] = useState('');
  const [addStockLoading, setAddStockLoading] = useState(false);

  useEffect(() => {
    if (ingredient) {
      setFormData({
        name: ingredient.name,
        short_description: ingredient.short_description || '',
        unit_of_measurement: ingredient.unit_of_measurement || '',
        rate: ingredient.rate ? ingredient.rate.toString() : '',
        tags: ingredient.tags ? ingredient.tags.join(', ') : '',
        initial_stock: '', // Initialize as empty for existing ingredients
      });
    } else {
      setFormData({
        name: '',
        short_description: '',
        unit_of_measurement: '',
        rate: '',
        tags: '',
        initial_stock: '', // Reset initial_stock for new ingredient
      });
    }
  }, [ingredient, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async (data: IngredientFormData) => {
      const ingredientData = {
        name: data.name,
        short_description: data.short_description || null,
        unit_of_measurement: data.unit_of_measurement || null,
        rate: data.rate ? parseFloat(data.rate) : null,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : null,
        current_stock: data.initial_stock ? parseFloat(data.initial_stock) : 0, // Set initial stock
        active: true,
      };

      if (ingredient) {
        const { error } = await supabase
          .from('ingredients')
          .update(ingredientData)
          .eq('id', ingredient.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ingredients')
          .insert([ingredientData]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast({
        title: "Success",
        description: `Ingredient ${ingredient ? 'updated' : 'created'} successfully`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${ingredient ? 'update' : 'create'} ingredient`,
        variant: "destructive",
      });
      console.error('Error saving ingredient:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    
    setIsSubmitting(true);
    
    try {
      await saveMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof IngredientFormData, value: string) => {
    if (isReadOnly) return;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Fetch current ingredient data to get the most up-to-date stock
  const { data: currentIngredient, isLoading: isLoadingIngredient } = useQuery({
    queryKey: ['ingredient', ingredient?.id],
    queryFn: async () => {
      if (!ingredient?.id) return null;
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('id', ingredient.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!ingredient?.id,
  });

  // Use the fetched ingredient data for current stock, fallback to prop
  const currentStock = currentIngredient?.current_stock ?? ingredient?.current_stock ?? 0;

  // Fetch stock history for this ingredient
  const { data: stockHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['ingredient-stock-history', ingredient?.id],
    queryFn: () => getIngredientStockHistory(ingredient!.id),
    enabled: !!ingredient?.id && showStockHistory,
  });

  // Add stock handler
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredient?.id || !addStockQty) return;
    setAddStockLoading(true);
    try {
      await addIngredientStock({
        ingredient_id: ingredient.id,
        quantity: parseFloat(addStockQty),
      });
      toast({ title: 'Success', description: 'Stock added successfully.' });
      setAddStockQty('');
      setShowAddStock(false);
      // Invalidate both the ingredients list and the specific ingredient query
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['ingredient', ingredient.id] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add stock', variant: 'destructive' });
    } finally {
      setAddStockLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isReadOnly ? 'View Ingredient' : (ingredient ? 'Edit Ingredient' : 'Add New Ingredient')}
          </DialogTitle>
        </DialogHeader>
        {/* Show current stock and Add Stock button for both new and existing ingredients */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-4">
            <div className="font-medium">
              Current Stock: 
              <span className="text-blue-700">
                {ingredient ? (isLoadingIngredient ? 'Loading...' : currentStock) : '0'}
              </span>
            </div>
            {!isReadOnly && ingredient && (
              <Button size="sm" variant="outline" onClick={() => setShowAddStock(v => !v)}>
                {showAddStock ? 'Cancel' : 'Add Stock'}
              </Button>
            )}
            {ingredient && (
              <Button size="sm" variant="outline" onClick={() => setShowStockHistory(v => !v)}>
                {showStockHistory ? 'Hide History' : 'Show History'}
              </Button>
            )}
          </div>
          
          {/* Stock History - only show for existing ingredients */}
          {ingredient && showStockHistory && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <h4 className="font-medium mb-2">Stock Transaction History</h4>
              {isLoadingHistory ? (
                <div className="text-sm text-gray-500">Loading history...</div>
              ) : stockHistory?.data && stockHistory.data.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {stockHistory.data.map((transaction) => (
                    <div key={transaction.stock_entry_id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          transaction.stock_entry_type === 'INWARD' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.stock_entry_type}
                        </span>
                        <span>{transaction.quantity_allocated}</span>
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(transaction.allocation_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No transaction history</div>
              )}
            </div>
          )}
          
          {/* Info message for new ingredients */}
          {!ingredient && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                Set initial stock below. Stock management features will be available after saving.
              </p>
            </div>
          )}
        </div>
        {/* Inline Add Stock form */}
        {showAddStock && (
          <form onSubmit={handleAddStock} className="mb-4 flex gap-2 items-end">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={addStockQty}
              onChange={e => setAddStockQty(e.target.value)}
              placeholder="Enter quantity"
              required
              className="w-32"
            />
            <Button type="submit" size="sm" disabled={addStockLoading}>
              {addStockLoading ? 'Adding...' : 'Add'}
            </Button>
          </form>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required={!isReadOnly}
              placeholder="Enter ingredient name"
              readOnly={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.short_description}
              onChange={(e) => handleInputChange('short_description', e.target.value)}
              placeholder="Enter ingredient description"
              rows={3}
              readOnly={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit of Measurement</Label>
            {isReadOnly ? (
              <Input
                value={formData.unit_of_measurement || 'Not specified'}
                readOnly
              />
            ) : (
              <Select
                value={formData.unit_of_measurement}
                onValueChange={(value) => handleInputChange('unit_of_measurement', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit of measurement" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">Rate (per unit)</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              value={formData.rate}
              onChange={(e) => handleInputChange('rate', e.target.value)}
              placeholder="0.00"
              readOnly={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="Enter tags separated by commas"
              readOnly={isReadOnly}
            />
          </div>

          {/* Initial Stock field for new ingredients */}
          {!ingredient && (
            <div className="space-y-2">
              <Label htmlFor="initial_stock">Initial Stock</Label>
              <Input
                id="initial_stock"
                type="number"
                min="0"
                step="1"
                value={formData.initial_stock}
                onChange={(e) => handleInputChange('initial_stock', e.target.value)}
                placeholder="Enter initial stock quantity"
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (ingredient ? 'Update' : 'Create')}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
