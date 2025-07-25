import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Eye } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];
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
  }>; // Add stock property to ProductWithIngredients type
  stock: number | null;
};

interface StatusSliderProps {
  isActive: boolean;
  onToggle: () => void;
  productName: string;
  disabled?: boolean;
}

function StatusSlider({ isActive, onToggle, productName, disabled = false }: StatusSliderProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleToggle = () => {
    if (disabled) return;
    
    if (isActive) {
      // If currently active and trying to deactivate, show confirmation
      const confirmed = window.confirm(
        `Are you sure you want to deactivate "${productName}"? This will make the product unavailable for orders.`
      );
      if (confirmed) {
        onToggle();
      }
    } else {
      // If currently inactive and trying to activate, proceed directly
      onToggle();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          ${isActive 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-gray-200 hover:bg-gray-300'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${isActive ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}

interface ProductsTableProps {
  products: ProductWithIngredients[];
  isLoading: boolean;
  onEdit: (product: ProductWithIngredients) => void;
  onDelete: (productId: string) => void;
  onToggleActive: (productId: string, currentActive: boolean) => void;
  isReadOnly?: boolean;
}

export function ProductsTable({
  products,
  isLoading,
  onEdit,
  onDelete,
  onToggleActive,
  isReadOnly = false,
}: ProductsTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="border rounded-lg p-8">
        <div className="text-center">
          <p className="text-gray-500">No products found.</p>
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your search criteria or add a new product.
          </p>
        </div>
      </div>
    );
  }

  const formatTags = (tags: string[] | null) => {
    if (!tags || tags.length === 0) return null;
    return tags.map((tag, index) => (
      <Badge key={index} variant="secondary" className="text-xs">
        {tag}
      </Badge>
    ));
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Sale Price</TableHead>
            <TableHead>Stock</TableHead> {/* Add Stock column header */}
            <TableHead>Tags</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate" title={product.description || ''}>
                  {product.description || '-'}
                </div>
              </TableCell>
              <TableCell>
                {product.sale_price ? `₹${Number(product.sale_price).toFixed(2)}` : '-'}
              </TableCell>
              <TableCell>
                {product.stock !== null ? product.stock : '-'} {/* Display product stock */}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {formatTags(product.tags)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-between">
                  <StatusSlider
                    isActive={product.active}
                    onToggle={() => onToggleActive(product.id, product.active)}
                    productName={product.name}
                    disabled={isReadOnly}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(product)}
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
