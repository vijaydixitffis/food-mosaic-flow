import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CompoundsTable } from './CompoundsTable';
import { CompoundDialog } from './CompoundDialog';
import { CompoundsPagination } from './CompoundsPagination';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type Compound = Database['public']['Tables']['compounds']['Row'];
type CompoundWithIngredients = Compound & {
  compound_ingredients: Array<{
    id: string;
    ingredient_id: string;
    quantity: number;
    ingredients: {
      id: string;
      name: string;
      unit_of_measurement: string | null;
      rate: number | null;
    };
  }>;
  total_rate?: number;
};

export function CompoundsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompound, setEditingCompound] = useState<CompoundWithIngredients | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, isStaff } = useAuth();

  // Fetch compounds with their ingredients
  const { data: compoundsData, isLoading } = useQuery({
    queryKey: ['compounds', searchTerm, currentPage, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('compounds')
        .select(`
          *,
          compound_ingredients (
            id,
            ingredient_id,
            quantity,
            ingredients (
              id,
              name,
              unit_of_measurement,
              rate
            )
          )
        `)
        .order('name', { ascending: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Get total count for pagination
      const { count } = await supabase
        .from('compounds')
        .select('*', { count: 'exact', head: true })
        .or(searchTerm ? `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%` : 'id.neq.0');

      // Get paginated results
      const { data, error } = await query
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) throw error;

      // Calculate total rate for each compound
      const compoundsWithRates = data?.map(compound => {
        const totalRate = compound.compound_ingredients?.reduce((sum, ci) => {
          const rate = ci.ingredients?.rate || 0;
          const unit = ci.ingredients?.unit_of_measurement?.toLowerCase() || '';
          // Convert quantity to kg if it's in grams
          const quantityInKg = unit === 'gms' ? ci.quantity / 1000 : ci.quantity;
          return sum + (rate * quantityInKg);
        }, 0) || 0;

        return {
          ...compound,
          total_rate: totalRate
        };
      }) || [];

      return {
        compounds: compoundsWithRates as CompoundWithIngredients[],
        total: count || 0
      };
    },
  });

  // Delete compound mutation - only for admins
  const deleteCompoundMutation = useMutation({
    mutationFn: async (compoundId: string) => {
      const { error } = await supabase
        .from('compounds')
        .delete()
        .eq('id', compoundId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compounds'] });
      toast({
        title: "Success",
        description: "Compound deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete compound: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation - only for admins
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ compoundId, active }: { compoundId: string; active: boolean }) => {
      const { error } = await supabase
        .from('compounds')
        .update({ active })
        .eq('id', compoundId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compounds'] });
      toast({
        title: "Success",
        description: "Compound status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update compound status: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddCompound = () => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: isStaff ? "You can only view compounds" : "Only admin users can add compounds",
        variant: "destructive",
      });
      return;
    }
    setEditingCompound(null);
    setIsDialogOpen(true);
  };

  const handleEditCompound = (compound: CompoundWithIngredients) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: isStaff ? "You can only view compounds" : "Only admin users can edit compounds",
        variant: "destructive",
      });
      return;
    }
    setEditingCompound(compound);
    setIsDialogOpen(true);
  };

  const handleDeleteCompound = (compoundId: string) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: isStaff ? "You can only view compounds" : "Only admin users can delete compounds",
        variant: "destructive",
      });
      return;
    }
    if (confirm('Are you sure you want to delete this compound?')) {
      deleteCompoundMutation.mutate(compoundId);
    }
  };

  const handleToggleActive = (compoundId: string, currentActive: boolean) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: isStaff ? "You can only view compounds" : "Only admin users can change compound status",
        variant: "destructive",
      });
      return;
    }
    toggleActiveMutation.mutate({ compoundId, active: !currentActive });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const compounds = compoundsData?.compounds || [];
  const totalItems = compoundsData?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isStaff ? 'View Compounds' : 'Manage Compounds'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isAdmin ? 'Create and manage compound ingredients' : 'View compound ingredients'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddCompound} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Compound
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search compounds by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Compounds Table */}
      <CompoundsTable
        compounds={compounds}
        isLoading={isLoading}
        onEdit={handleEditCompound}
        onDelete={handleDeleteCompound}
        onToggleActive={handleToggleActive}
        isAdmin={isAdmin}
      />

      {/* Pagination */}
      <CompoundsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Compound Dialog - only show for admins */}
      {isAdmin && (
        <CompoundDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          compound={editingCompound}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['compounds'] });
            setIsDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
