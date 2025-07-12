# Stock Management Migrations Summary

This document summarizes the database migrations related to stock management in the Food Mosaic ERP system.

## Migration Overview

### 1. `20240623000000_restructure_stock_allocation_table.sql`
**Purpose:** Initial restructuring of the stock allocation table to support both ingredients and products.

**Changes:**
- Added `current_stock` column to `ingredients` table
- Restructured `stock_allocation` table with new columns:
  - `stock_entry_id` (PK)
  - `stock_entry_type` (INWARD/OUTWARD)
  - `stock_type` (INGREDIENT/PRODUCT)
  - `stock_item_id` (references ingredient or product ID)
  - `reference_id` (links to work orders, orders, etc.)
  - `quantity_allocated`
  - `allocation_date`
- Migrated existing data from old structure
- Added proper indexes and RLS policies

### 2. `20240624000000_fix_stock_allocation_constraints.sql`
**Purpose:** Fixed problematic check constraints that used subqueries (not allowed in PostgreSQL).

**Changes:**
- Removed problematic check constraints that referenced subqueries
- Recreated table structure without the constraints
- Migrated data properly from backup
- Maintained all indexes and RLS policies

### 3. `20240625000000_consolidate_stock_columns.sql`
**Purpose:** Consolidated stock management by removing separate stock tables and adding stock directly to main entities.

**Changes:**
- Added `current_stock` column to `products` table
- Migrated existing data from `product_stock` table to `products.current_stock`
- Dropped the separate `product_stock` table and its policies
- Added proper error handling for table existence checks

## Final Database Structure

### Ingredients Table
```sql
ingredients (
  -- existing columns...
  current_stock DECIMAL(10, 2) DEFAULT 0
)
```

### Products Table
```sql
products (
  -- existing columns...
  current_stock DECIMAL(10, 2) DEFAULT 0
)
```

### Stock Allocation Table
```sql
stock_allocation (
  stock_entry_id uuid PRIMARY KEY,
  stock_entry_type TEXT CHECK (IN ('INWARD', 'OUTWARD')),
  stock_type TEXT CHECK (IN ('INGREDIENT', 'PRODUCT')),
  stock_item_id uuid NOT NULL,
  reference_id uuid,
  quantity_allocated DECIMAL(10, 2) NOT NULL,
  allocation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

## Stock Management Flow

### For Ingredients:
1. **INWARD transactions:** When inventory is added (e.g., from suppliers)
   - Increment `ingredients.current_stock`
   - Create `stock_allocation` record with `stock_entry_type = 'INWARD'`

2. **OUTWARD transactions:** When ingredients are used in work orders
   - Decrement `ingredients.current_stock`
   - Create `stock_allocation` record with `stock_entry_type = 'OUTWARD'`

### For Products:
1. **INWARD transactions:** When products are manufactured
   - Increment `products.current_stock`
   - Create `stock_allocation` record with `stock_entry_type = 'INWARD'`

2. **OUTWARD transactions:** When products are allocated to orders
   - Decrement `products.current_stock`
   - Create `stock_allocation` record with `stock_entry_type = 'OUTWARD'`

## Benefits of This Structure

1. **Simplified Architecture:** No separate stock tables - stock is directly on main entities
2. **Consistent Structure:** Both ingredients and products have `current_stock` columns
3. **Unified Stock Allocation:** All stock movements are tracked in one table with proper transaction types
4. **Better Performance:** Fewer database queries and joins needed
5. **Easier Maintenance:** Single source of truth for stock data
6. **Audit Trail:** Complete history of all stock movements with timestamps

## Frontend Integration

The frontend has been updated to work with this new structure:
- Product Dialog includes stock management tab
- Ingredient Dialog includes stock management
- Stock history is displayed with color-coded INWARD/OUTWARD transactions
- Real-time stock updates after adding stock
- Proper error handling and loading states 