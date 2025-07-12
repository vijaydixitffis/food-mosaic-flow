import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Search, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ProductsTable } from './ProductsTable';
import { ProductDialog } from './ProductDialog';
import { ProductsPagination } from './ProductsPagination';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AddProductStockDialog } from './AddProductStockDialog'; // Import the AddProductStockDialog
import type { Database } from '@/integrations/supabase/types';


type Product = Database['public']['Tables']['products']['Row'] & { stock: number | null }; // Add stock property
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

export function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false); // State for Add Stock dialog
  const [editingProduct, setEditingProduct] = useState<ProductWithIngredients | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isStaff, isAdmin, user, profile } = useAuth();

  console.log('ProductsPage - Auth Debug:', {
    user: user?.id,
    profile: profile?.role,
    isStaff,
    isAdmin,
    userEmail: user?.email
  });

  // Fetch products with their ingredients and compounds
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['products', searchTerm, currentPage, pageSize],
    queryFn: async () => {
      console.log('ProductsPage - Starting query with auth state:', {
        userId: user?.id,
        userRole: profile?.role,
        isAuthenticated: !!user
      });

      try {
        let query = supabase
          .from('products')
          .select(
            '*, product_ingredients ( id, ingredient_id, quantity, ingredients ( id, name, unit_of_measurement ) ), product_compounds ( id, compound_id, quantity, compounds ( id, name, unit_of_measurement ) )'
          ) // Replaced template literal with string
          .order('name', { ascending: true });

        console.log('ProductsPage - About to execute count query');

        // Get total count for pagination
        const { count, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.error('ProductsPage - Count query error:', {
            error: countError,
            message: countError.message,
            details: countError.details,
            hint: countError.hint,
            code: countError.code
          });
          throw countError;
        }

        console.log('ProductsPage - Count query successful, count:', count);
        console.log('ProductsPage - About to execute data query');

        // Get all results (we\'ll filter client-side for consistent partial matching)
        const { data, error } = await query;

        if (error) {
          console.error('ProductsPage - Data query error:', {
            error: error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        console.log('ProductsPage - Data query successful:', {
          dataLength: data?.length,
          totalCount: count,
          sampleData: data?.[0]
        });

        // Filter results client-side for consistent partial matching across all fields
        let filteredData = data as ProductWithIngredients[];
        let filteredCount = count || 0;

        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          filteredData = filteredData.filter(product =>
            product.name.toLowerCase().includes(searchLower) ||
            (product.description && product.description.toLowerCase().includes(searchLower)) ||
            (product.tags && product.tags.some(tag =>
              tag.toLowerCase().includes(searchLower)
            ))
          );
          filteredCount = filteredData.length;
        }

        // Apply pagination to filtered results
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        return {
          products: paginatedData,
          total: filteredCount
        };
      } catch (err) {
        console.error('ProductsPage - Query function error:', err);
        throw err;
      }
    },
  });

  console.log('ProductsPage - Query state:', {
    isLoading,
    error: error ? {
      message: error.message,
      name: error.name,
      stack: error.stack
    } : null,
    hasData: !!productsData
  });

  // Use products with their current_stock
  const products = useMemo(() => {
    if (!productsData?.products) return [];
    return productsData.products.map(product => ({
      ...product, 
      stock: product.current_stock || 0
    }));
  }, [productsData?.products]);

  const totalItems = productsData?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ productId, active }: { productId: string; active: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ active })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Product status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update product status: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddProduct = () => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view products",
        variant: "destructive",
      });
      return;
    }
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: ProductWithIngredients) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view products",
        variant: "destructive",
      });
      return;
    }
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleToggleActive = (productId: string, currentActive: boolean) => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view products",
        variant: "destructive",
      });
      return;
    }
    toggleActiveMutation.mutate({ productId, active: !currentActive });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isStaff ? 'View Products' : 'Manage Products'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isStaff ? 'View product information' : 'Create and manage product information'}
            </p>
          </div>
        </div>
        {!isStaff && (
          <div className="flex gap-4"> {/* Use a flex container for buttons */}
            <Button onClick={handleAddProduct} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
            <Button onClick={() => setIsAddStockDialogOpen(true)} variant="secondary" className="flex items-center gap-2"> {/* Add Add Stock button */}
              <Plus className="w-4 h-4" />
              Add Stock
            </Button>
          </div>
        )}
      </div>


      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search products by name, description, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error loading products</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <details className="mt-2">
            <summary className="text-red-600 text-sm cursor-pointer">Debug Details</summary>
            <pre className="text-xs text-red-500 mt-1 whitespace-pre-wrap">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Products Table */}
      <ProductsTable
        products={products}
        isLoading={isLoading}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onToggleActive={handleToggleActive}
        isReadOnly={isStaff}
      />

      {/* Pagination */}
      <ProductsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Product Dialog */}
      <ProductDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        product={editingProduct}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['products'] });
          setIsDialogOpen(false);
        }}
        isReadOnly={isStaff}
      />
    </div>
  );
}
