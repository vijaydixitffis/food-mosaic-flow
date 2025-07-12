import { supabase } from '@/integrations/supabase/client';
import type { Database } from './types';

export type IngredientStock = Database['public']['Tables']['ingredient_stock']['Row'];
export type ProductStock = Database['public']['Tables']['product_stock']['Row'];
export type StockAllocation = Database['public']['Tables']['stock_allocation']['Row'];

/**
 * Adds a new ingredient stock record to the database.
 * @param data - The ingredient stock data.
 * @returns The newly created ingredient stock record or an error.
 */
export async function addIngredientStock(data: {
  ingredient_id: string;
  quantity: number;
  unit_of_measure?: string;
  location?: string;
}) {
  const { data: newStock, error } = await supabase
    .from('ingredient_stock')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error adding ingredient stock:', error);
    return { data: null, error };
  }

 return { data: newStock, error: null };
}

/**
 * Allocates product stock to an order.
 * @param data - The allocation data (productId, orderId, quantity).
 * @returns The result of the operation or an error.
 */
export async function allocateProductStock(data: { productId: string; orderId: string; quantity: number }) {
 const { productId, orderId, quantity } = data;

  try {
    // 1. Find the product stock item ID
    const { data: stockItem, error: stockError } = await supabase
      .from('product_stock')
      .select('id, quantity')
      .eq('product_id', productId)
      .single();

    if (stockError || !stockItem) {
      console.error('Error finding product stock item:', stockError);
 throw new Error('Product stock item not found or error fetching.');
    }

    // 2. Create a new stock allocation record
    const { data: allocation, error: allocationError } = await supabase
      .from('stock_allocation')
      .insert([{ stock_item_id: stockItem.id, item_type: 'product', reference_id: orderId, reference_type: 'order', quantity_allocated: quantity }])
      .select()
      .single();

    if (allocationError) {
 console.error('Error creating stock allocation:', allocationError);
 throw allocationError;
    }

  return { data: allocation, error: null };
}

/**
 * Adds a new product stock record to the database.
 * @param data - The product stock data.
 * @returns The newly created product stock record or an error.
 */
export async function addProductStock(data: {
  product_id: string;
  quantity: number;
  location?: string;
}) {
  const { data: newStock, error } = await supabase
    .from('product_stock')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error adding product stock:', error);
    return { data: null, error };
  }

  return { data: newStock, error: null };
}

/**
 * Fetches all ingredient stock records from the database.
 * @returns A list of all ingredient stock records or an error.
 */
export async function getIngredientStock() {
  const { data, error } = await supabase
    .from('ingredient_stock')
    .select('*');

  if (error) {
    console.error('Error fetching ingredient stock:', error);
    return { data: null, error };
  }

  return { data, error: null };
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
    .eq('reference_id', workOrderId)
    .eq('reference_type', 'work_order');

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
    .eq('reference_id', orderId)
    .eq('reference_type', 'order');

  if (error) {
    console.error('Error fetching stock allocations for order:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Allocates ingredient stock to a work order.
 * @param data - The allocation data (ingredientId, workOrderId, quantity).
 * @returns The result of the operation or an error.
 */
export async function allocateIngredientStock(data: { ingredientId: string; workOrderId: string; quantity: number }) {
  const { ingredientId, workOrderId, quantity } = data;

  try {
    // 1. Find the ingredient stock item ID
    const { data: stockItem, error: stockError } = await supabase
      .from('ingredient_stock')
      .select('id, quantity')
      .eq('ingredient_id', ingredientId)
      .single();

    if (stockError || !stockItem) {
      console.error('Error finding ingredient stock item:', stockError);
      throw new Error('Ingredient stock item not found or error fetching.');
    }

    // 2. Create a new stock allocation record
    const { data: allocation, error: allocationError } = await supabase
      .from('stock_allocation')
      .insert([{ stock_item_id: stockItem.id, item_type: 'ingredient', reference_id: workOrderId, reference_type: 'work_order', quantity_allocated: quantity }])
      .select()
      .single();

    if (allocationError) {
      console.error('Error creating stock allocation:', allocationError);
      throw allocationError;
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
  // This query joins work_order_products with products and product_ingredients
  // to find all ingredients and their total required quantity for a work order.
  // It then groups by ingredient_id and sums the required quantity.
  const { data, error } = await supabase
    .from('work_order_products')
    .select(`
      product_id,
      total_weight,
      products (
        product_ingredients (
          ingredient_id,
          quantity,
          ingredients (id, name, unit_of_measurement)
        )
      )
    `)
    .eq('work_order_id', workOrderId);

  // Note: Processing the data to sum up ingredient quantities across all products
  // in the work order might be needed on the client side or with a more complex SQL query.
  // This function currently fetches the raw required ingredients per product.

  if (error) {
    console.error('Error fetching required ingredients for work order:', error);
    return { data: null, error };
  }

  // Process the data to get total required quantity per ingredient
  const requiredIngredientsMap = new Map<string, { ingredient_id: string; name: string; unit_of_measurement: string | null; total_required_quantity: number }>();

  if (data) {
    data.forEach(workOrderProduct => {
      const totalProductWeight = workOrderProduct.total_weight;
      workOrderProduct.products?.product_ingredients.forEach(productIngredient => {
        const requiredQuantityForThisProduct = productIngredient.quantity * totalProductWeight; // Assuming product_ingredient.quantity is per unit of product weight
        const ingredient = productIngredient.ingredients;

        if (ingredient) {
          const current = requiredIngredientsMap.get(ingredient.id) || { ingredient_id: ingredient.id, name: ingredient.name, unit_of_measurement: ingredient.unit_of_measurement, total_required_quantity: 0 };
          current.total_required_quantity += requiredQuantityForThisProduct;
          requiredIngredientsMap.set(ingredient.id, current);
        }
      });
    });
  }

  return { data: Array.from(requiredIngredientsMap.values()), error: null };
}

/**
 * Fetches all product stock records from the database.
 * @returns A list of all product stock records or an error.
 */
export async function getProductStock() {
  const { data, error } = await supabase
    .from('product_stock')
    .select('*');

  if (error) {
    console.error('Error fetching product stock:', error);
    return { data: null, error };
  }

  return { data, error: null };
}