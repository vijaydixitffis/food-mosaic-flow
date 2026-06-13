-- Migration: Add RBAC roles (supervisor) and update all RLS policies
-- Consolidates from binary admin/staff to three-tier admin/supervisor/staff system.
-- Supervisor = full access to Ingredients, Compounds, Products, Recipes, Work Orders.
-- Staff = Work Orders only + stock updates via security-definer functions.
-- Admin = full access to everything.

-- =============================================
-- 1. EXTEND user_role ENUM
-- =============================================
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'supervisor';

-- =============================================
-- 2. HELPER FUNCTIONS
-- =============================================

-- Tiered role check: admin or supervisor
CREATE OR REPLACE FUNCTION public.can_supervise(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('admin', 'supervisor') AND active = true
  );
$$;

-- Stock update functions (SECURITY DEFINER so Staff can call them without direct table UPDATE access)
CREATE OR REPLACE FUNCTION public.fn_update_ingredient_stock(
  p_ingredient_id uuid,
  p_new_stock numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE ingredients SET current_stock = p_new_stock WHERE id = p_ingredient_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_update_ingredient_stock(uuid, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_update_product_price_stock(
  p_product_price_id uuid,
  p_new_stock numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE product_prices SET stock = p_new_stock WHERE id = p_product_price_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_update_product_price_stock(uuid, numeric) TO authenticated;

-- =============================================
-- 3. INGREDIENTS
-- =============================================
DROP POLICY IF EXISTS "Admins can view all ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Staff can view all ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Admins can insert ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Admins can update ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Admins can delete ingredients" ON public.ingredients;

CREATE POLICY "All authenticated can view ingredients"
  ON public.ingredients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Supervisors can insert ingredients"
  ON public.ingredients FOR INSERT TO authenticated
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can update ingredients"
  ON public.ingredients FOR UPDATE TO authenticated
  USING (public.can_supervise(auth.uid()))
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can delete ingredients"
  ON public.ingredients FOR DELETE TO authenticated
  USING (public.can_supervise(auth.uid()));

-- =============================================
-- 4. COMPOUNDS & COMPOUND_INGREDIENTS
-- =============================================
DROP POLICY IF EXISTS "Admin users can manage compounds" ON public.compounds;
DROP POLICY IF EXISTS "Staff users can view compounds" ON public.compounds;

CREATE POLICY "All authenticated can view compounds"
  ON public.compounds FOR SELECT TO authenticated USING (true);

CREATE POLICY "Supervisors can insert compounds"
  ON public.compounds FOR INSERT TO authenticated
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can update compounds"
  ON public.compounds FOR UPDATE TO authenticated
  USING (public.can_supervise(auth.uid()))
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can delete compounds"
  ON public.compounds FOR DELETE TO authenticated
  USING (public.can_supervise(auth.uid()));

DROP POLICY IF EXISTS "Admin users can manage compound ingredients" ON public.compound_ingredients;
DROP POLICY IF EXISTS "Staff users can view compound ingredients" ON public.compound_ingredients;

CREATE POLICY "All authenticated can view compound ingredients"
  ON public.compound_ingredients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Supervisors can insert compound ingredients"
  ON public.compound_ingredients FOR INSERT TO authenticated
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can update compound ingredients"
  ON public.compound_ingredients FOR UPDATE TO authenticated
  USING (public.can_supervise(auth.uid()))
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can delete compound ingredients"
  ON public.compound_ingredients FOR DELETE TO authenticated
  USING (public.can_supervise(auth.uid()));

-- =============================================
-- 5. PRODUCTS, PRODUCT_INGREDIENTS, PRODUCT_COMPOUNDS
-- =============================================
-- products SELECT already open ("Authenticated users can view products"), keep it
DROP POLICY IF EXISTS "Admin users can insert products" ON public.products;
DROP POLICY IF EXISTS "Admin users can update products" ON public.products;
DROP POLICY IF EXISTS "Admin users can delete products" ON public.products;

CREATE POLICY "Supervisors can insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can update products"
  ON public.products FOR UPDATE TO authenticated
  USING (public.can_supervise(auth.uid()))
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can delete products"
  ON public.products FOR DELETE TO authenticated
  USING (public.can_supervise(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all product ingredients" ON public.product_ingredients;
DROP POLICY IF EXISTS "Admins can insert product ingredients" ON public.product_ingredients;
DROP POLICY IF EXISTS "Admins can update product ingredients" ON public.product_ingredients;
DROP POLICY IF EXISTS "Admins can delete product ingredients" ON public.product_ingredients;

CREATE POLICY "All authenticated can view product ingredients"
  ON public.product_ingredients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Supervisors can insert product ingredients"
  ON public.product_ingredients FOR INSERT TO authenticated
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can update product ingredients"
  ON public.product_ingredients FOR UPDATE TO authenticated
  USING (public.can_supervise(auth.uid()))
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can delete product ingredients"
  ON public.product_ingredients FOR DELETE TO authenticated
  USING (public.can_supervise(auth.uid()));

-- product_compounds: already fully open to authenticated, no change needed

-- =============================================
-- 6. RECIPES & RELATED TABLES
-- =============================================
DROP POLICY IF EXISTS "Admins can manage all recipes" ON public.recipes;
DROP POLICY IF EXISTS "Staff can view all recipes" ON public.recipes;

CREATE POLICY "All authenticated can view recipes"
  ON public.recipes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Supervisors can insert recipes"
  ON public.recipes FOR INSERT TO authenticated
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can update recipes"
  ON public.recipes FOR UPDATE TO authenticated
  USING (public.can_supervise(auth.uid()))
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can delete recipes"
  ON public.recipes FOR DELETE TO authenticated
  USING (public.can_supervise(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all recipe instructions" ON public.recipe_instructions;
DROP POLICY IF EXISTS "Staff can view all recipe instructions" ON public.recipe_instructions;

CREATE POLICY "All authenticated can view recipe instructions"
  ON public.recipe_instructions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Supervisors can insert recipe instructions"
  ON public.recipe_instructions FOR INSERT TO authenticated
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can update recipe instructions"
  ON public.recipe_instructions FOR UPDATE TO authenticated
  USING (public.can_supervise(auth.uid()))
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can delete recipe instructions"
  ON public.recipe_instructions FOR DELETE TO authenticated
  USING (public.can_supervise(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all recipe products" ON public.recipe_products;
DROP POLICY IF EXISTS "Staff can view all recipe products" ON public.recipe_products;

CREATE POLICY "All authenticated can view recipe products"
  ON public.recipe_products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Supervisors can insert recipe products"
  ON public.recipe_products FOR INSERT TO authenticated
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can update recipe products"
  ON public.recipe_products FOR UPDATE TO authenticated
  USING (public.can_supervise(auth.uid()))
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can delete recipe products"
  ON public.recipe_products FOR DELETE TO authenticated
  USING (public.can_supervise(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all recipe compounds" ON public.recipe_compounds;
DROP POLICY IF EXISTS "Staff can view all recipe compounds" ON public.recipe_compounds;

CREATE POLICY "All authenticated can view recipe compounds"
  ON public.recipe_compounds FOR SELECT TO authenticated USING (true);

CREATE POLICY "Supervisors can insert recipe compounds"
  ON public.recipe_compounds FOR INSERT TO authenticated
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can update recipe compounds"
  ON public.recipe_compounds FOR UPDATE TO authenticated
  USING (public.can_supervise(auth.uid()))
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can delete recipe compounds"
  ON public.recipe_compounds FOR DELETE TO authenticated
  USING (public.can_supervise(auth.uid()));

-- =============================================
-- 7. WORK ORDERS — all authenticated can fully manage
-- =============================================
DROP POLICY IF EXISTS "Everyone can view work orders" ON public.work_orders;
DROP POLICY IF EXISTS "Only admins can insert work orders" ON public.work_orders;
DROP POLICY IF EXISTS "Only admins can update work orders" ON public.work_orders;
DROP POLICY IF EXISTS "Only admins can delete work orders" ON public.work_orders;

CREATE POLICY "All authenticated can manage work orders"
  ON public.work_orders FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Everyone can view work order products" ON public.work_order_products;
DROP POLICY IF EXISTS "Only admins can insert work order products" ON public.work_order_products;
DROP POLICY IF EXISTS "Only admins can update work order products" ON public.work_order_products;
DROP POLICY IF EXISTS "Only admins can delete work order products" ON public.work_order_products;

CREATE POLICY "All authenticated can manage work order products"
  ON public.work_order_products FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 8. CLIENTS — admin-only at DB level
-- =============================================
DROP POLICY IF EXISTS "Allow authenticated users to view clients" ON public.clients;
DROP POLICY IF EXISTS "Allow admin users to insert clients" ON public.clients;
DROP POLICY IF EXISTS "Allow admin users to update clients" ON public.clients;
DROP POLICY IF EXISTS "Allow admin users to delete clients" ON public.clients;

CREATE POLICY "Admin-only access to clients"
  ON public.clients FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- 9. ORDERS & ORDER_PRODUCTS — admin-only at DB level
-- =============================================
DROP POLICY IF EXISTS "Allow authenticated users to view orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin users to insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin users to update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin users to delete orders" ON public.orders;

CREATE POLICY "Admin-only access to orders"
  ON public.orders FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow authenticated users to view order_products" ON public.order_products;
DROP POLICY IF EXISTS "Allow admin users to insert order_products" ON public.order_products;
DROP POLICY IF EXISTS "Allow admin users to update order_products" ON public.order_products;
DROP POLICY IF EXISTS "Allow admin users to delete order_products" ON public.order_products;

CREATE POLICY "Admin-only access to order_products"
  ON public.order_products FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- 10. COMPANY SETTINGS — admin-only
-- =============================================
DROP POLICY IF EXISTS "Allow authenticated users to view company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Allow admin users to insert company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Allow admin users to update company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Allow admin users to delete company settings" ON public.company_settings;

CREATE POLICY "Admin-only access to company settings"
  ON public.company_settings FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- 11. CATEGORIES — all can read, admin-only write
-- =============================================
DROP POLICY IF EXISTS "Allow authenticated users to read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow admin users to insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow admin users to update categories" ON public.categories;
DROP POLICY IF EXISTS "Allow admin users to delete categories" ON public.categories;

CREATE POLICY "All authenticated can view categories"
  ON public.categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin-only insert categories"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin-only update categories"
  ON public.categories FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin-only delete categories"
  ON public.categories FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- =============================================
-- 12. PRODUCT PRICES — supervisors can manage
-- =============================================
DROP POLICY IF EXISTS "Allow authenticated users to read product prices" ON public.product_prices;
DROP POLICY IF EXISTS "Allow admin users to insert product prices" ON public.product_prices;
DROP POLICY IF EXISTS "Allow admin users to update product prices" ON public.product_prices;
DROP POLICY IF EXISTS "Allow admin users to delete product prices" ON public.product_prices;

CREATE POLICY "All authenticated can view product prices"
  ON public.product_prices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Supervisors can insert product prices"
  ON public.product_prices FOR INSERT TO authenticated
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can update product prices"
  ON public.product_prices FOR UPDATE TO authenticated
  USING (public.can_supervise(auth.uid()))
  WITH CHECK (public.can_supervise(auth.uid()));

CREATE POLICY "Supervisors can delete product prices"
  ON public.product_prices FOR DELETE TO authenticated
  USING (public.can_supervise(auth.uid()));

-- =============================================
-- 13. COMPANY PARAMS — all can read, admin-only write
-- =============================================
DROP POLICY IF EXISTS "Allow authenticated users to view company params" ON public.company_params;
DROP POLICY IF EXISTS "Allow admin users to insert company params" ON public.company_params;
DROP POLICY IF EXISTS "Allow admin users to update company params" ON public.company_params;
DROP POLICY IF EXISTS "Allow admin users to delete company params" ON public.company_params;

CREATE POLICY "All authenticated can view company params"
  ON public.company_params FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin-only insert company params"
  ON public.company_params FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin-only update company params"
  ON public.company_params FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin-only delete company params"
  ON public.company_params FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- stock_allocation: already open to all authenticated (USING true), no change needed
