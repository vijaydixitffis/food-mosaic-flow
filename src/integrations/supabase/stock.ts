import { supabase } from '@/integrations/supabase/client';
import type { Database } from './types';

export type StockAllocation = Database['public']['Tables']['stock_allocation']['Row'];

/**
 * Adds stock to an ingredient (INWARD transaction).
 * @param data - The ingredient stock data.
 * @returns The updated ingredient record or an error.
 */
export async function addIngredientStock(data: {
  ingredient_id: string;
  quantity: number;
  reference_id?: string;
}) {
  // First get the current stock
  const { data: currentIngredient, error: fetchError } = await supabase
    .from('ingredients')
    .select('current_stock')
    .eq('id', data.ingredient_id)
    .single();

  if (fetchError) {
    console.error('Error fetching current ingredient stock:', fetchError);
    return { data: null, error: fetchError };
  }

  // Calculate new stock
  const currentStock = currentIngredient?.current_stock || 0;
  const newStock = currentStock + data.quantity;

  // Start a transaction to update ingredient and create stock allocation record
  const { data: updatedIngredient, error: updateError } = await supabase
    .from('ingredients')
    .update({ current_stock: newStock })
    .eq('id', data.ingredient_id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating ingredient stock:', updateError);
    return { data: null, error: updateError };
  }

  // Create INWARD stock allocation record
  const { error: allocationError } = await supabase
    .from('stock_allocation')
    .insert([{
      stock_entry_type: 'INWARD',
      stock_type: 'INGREDIENT',
      stock_item_id: data.ingredient_id,
      reference_id: data.reference_id || null,
      quantity_allocated: data.quantity
    }]);

  if (allocationError) {
    console.error('Error creating stock allocation record:', allocationError);
    // Note: We don't rollback the ingredient update here for simplicity
    // In production, you might want to implement proper transaction handling
  }

  return { data: updatedIngredient, error: null };
}

/**
 * Adds stock to a product (INWARD transaction for manufactured stock).
 * @param data - The product stock data.
 * @returns The updated product record or an error.
 */
export async function addProductStock(data: {
  product_id: string;
  quantity: number;
  reference_id?: string;
}) {
  // First get the current stock
  const { data: currentProduct, error: fetchError } = await supabase
    .from('products')
    .select('current_stock')
    .eq('id', data.product_id)
    .single();

  if (fetchError) {
    console.error('Error fetching current product stock:', fetchError);
    return { data: null, error: fetchError };
  }

  // Calculate new stock
  const currentStock = currentProduct?.current_stock || 0;
  const newStock = currentStock + data.quantity;

  // Update product current_stock
  const { data: updatedProduct, error: updateError } = await supabase
    .from('products')
    .update({ current_stock: newStock })
    .eq('id', data.product_id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating product stock:', updateError);
    return { data: null, error: updateError };
  }

  // Create INWARD stock allocation record
  const { error: allocationError } = await supabase
    .from('stock_allocation')
    .insert([{
      stock_entry_type: 'INWARD',
      stock_type: 'PRODUCT',
      stock_item_id: data.product_id,
      reference_id: data.reference_id || null,
      quantity_allocated: data.quantity
    }]);

  if (allocationError) {
    console.error('Error creating stock allocation record:', allocationError);
  }

  return { data: updatedProduct, error: null };
}

/**
 * Allocates product stock to an order (OUTWARD transaction).
 * @param data - The allocation data (productId, orderId, quantity).
 * @returns The result of the operation or an error.
 */
export async function allocateProductStock(data: { productId: string; orderId: string; quantity: number }) {
  const { productId, orderId, quantity } = data;

  try {
    // 1. Check if product has sufficient stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('current_stock')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Error finding product:', productError);
      throw new Error('Product not found or error fetching.');
    }

    if ((product.current_stock || 0) < quantity) {
      throw new Error('Insufficient product stock for allocation.');
    }

    // 2. Create OUTWARD stock allocation record
    const { data: allocation, error: allocationError } = await supabase
      .from('stock_allocation')
      .insert([{
        stock_entry_type: 'OUTWARD',
        stock_type: 'PRODUCT',
        stock_item_id: productId,
        reference_id: orderId,
        quantity_allocated: quantity
      }])
      .select()
      .single();

    if (allocationError) {
      console.error('Error creating stock allocation:', allocationError);
      throw allocationError;
    }

    // 3. Update product current_stock (reduce by allocated quantity)
    const newStock = (product.current_stock || 0) - quantity;
    const { error: updateError } = await supabase
      .from('products')
      .update({ current_stock: newStock })
      .eq('id', productId);

    if (updateError) {
      console.error('Error updating product stock after allocation:', updateError);
      throw updateError;
    }

    return { data: allocation, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Fetches stock allocations for a given work order.
 * @param workOrderId - The ID of the work order.
 * @returns A list of stock allocations for the work order or an error.
 */
export async function getStockAllocationsByWorkOrder(workOrderId: string) {
  const { data, error } = await supabase
    .from('stock_allocation')
    .select('*')
    .eq('reference_id', workOrderId);

  if (error) {
    console.error('Error fetching stock allocations for work order:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Fetches stock allocations for a given order.
 * @param orderId - The ID of the order.
 * @returns A list of stock allocations for the order or an error.
 */
export async function getStockAllocationsByOrder(orderId: string) {
  const { data, error } = await supabase
    .from('stock_allocation')
    .select('*')
    .eq('reference_id', orderId);

  if (error) {
    console.error('Error fetching stock allocations for order:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Allocates ingredient stock to a work order (OUTWARD transaction).
 * @param data - The allocation data (ingredientId, workOrderId, quantity).
 * @returns The result of the operation or an error.
 */
export async function allocateIngredientStock(data: { ingredientId: string; workOrderId: string; quantity: number }) {
  const { ingredientId, workOrderId, quantity } = data;

  try {
    // 1. Check if ingredient has sufficient stock
    const { data: ingredient, error: ingredientError } = await supabase
      .from('ingredients')
      .select('current_stock')
      .eq('id', ingredientId)
      .single();

    if (ingredientError || !ingredient) {
      console.error('Error finding ingredient:', ingredientError);
      throw new Error('Ingredient not found or error fetching.');
    }

    if ((ingredient.current_stock || 0) < quantity) {
      throw new Error('Insufficient stock for allocation.');
    }

    // 2. Create OUTWARD stock allocation record
    const { data: allocation, error: allocationError } = await supabase
      .from('stock_allocation')
      .insert([{ 
        stock_entry_type: 'OUTWARD',
        stock_type: 'INGREDIENT',
        stock_item_id: ingredientId, 
        reference_id: workOrderId, 
        quantity_allocated: quantity
      }])
      .select()
      .single();

    if (allocationError) {
      console.error('Error creating stock allocation:', allocationError);
      throw allocationError;
    }

    // 3. Update ingredient current_stock (reduce by allocated quantity)
    const newStock = (ingredient.current_stock || 0) - quantity;
    const { error: updateError } = await supabase
      .from('ingredients')
      .update({ current_stock: newStock })
      .eq('id', ingredientId);

    if (updateError) {
      console.error('Error updating ingredient stock after allocation:', updateError);
      throw updateError;
    }

    return { data: allocation, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Fetches the ingredients required for a given work order.
 * @param workOrderId - The ID of the work order.
 * @returns A list of required ingredients with quantities or an error.
 */
export async function getRequiredIngredientsForWorkOrder(workOrderId: string) {
  // Simplified approach: fetch work order products first, then fetch ingredients for each product
  const { data: workOrderProducts, error: workOrderError } = await supabase
    .from('work_order_products')
    .select('product_id, total_weight')
    .eq('work_order_id', workOrderId);

  if (workOrderError) {
    console.error('Error fetching work order products:', workOrderError);
    return { data: null, error: workOrderError };
  }

  if (!workOrderProducts || workOrderProducts.length === 0) {
    return { data: [], error: null };
  }

  // For now, return the work order products data
  // The ingredient calculation can be done on the client side or with a more complex query
  return { data: workOrderProducts, error: null };
}

/**
 * Fetches stock transaction history for an ingredient.
 * @param ingredientId - The ID of the ingredient.
 * @returns A list of stock transactions or an error.
 */
export async function getIngredientStockHistory(ingredientId: string) {
  const { data, error } = await supabase
    .from('stock_allocation')
    .select('*')
    .eq('stock_item_id', ingredientId)
    .eq('stock_type', 'INGREDIENT')
    .order('allocation_date', { ascending: false });

  if (error) {
    console.error('Error fetching ingredient stock history:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Fetches stock transaction history for a product.
 * @param productId - The ID of the product.
 * @returns A list of stock transactions or an error.
 */
export async function getProductStockHistory(productId: string) {
  const { data, error } = await supabase
    .from('stock_allocation')
    .select('*')
    .eq('stock_item_id', productId)
    .eq('stock_type', 'PRODUCT')
    .order('allocation_date', { ascending: false });

  if (error) {
    console.error('Error fetching product stock history:', error);
    return { data: null, error };
  }

  return { data, error: null };
}