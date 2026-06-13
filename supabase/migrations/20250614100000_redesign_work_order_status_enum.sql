-- Redesign work_order_status enum:
-- rename PROCURED→PROCURE, add READY, remove SHIPPED
--
-- Must drop DEFAULT and convert to text first because PostgreSQL cannot cast
-- a column directly between two unrelated enum types, and the UPDATE must
-- happen while the column is plain text (before the new enum is applied).

ALTER TABLE work_orders ALTER COLUMN status DROP DEFAULT;
ALTER TABLE work_orders ALTER COLUMN status TYPE text USING status::text;

UPDATE work_orders SET status = 'PROCURE'   WHERE status = 'PROCURED';
UPDATE work_orders SET status = 'PROCESSED' WHERE status = 'SHIPPED';

CREATE TYPE work_order_status_new AS ENUM (
  'CREATED', 'PROCURE', 'IN-STOCK', 'READY', 'PROCESSED', 'EXECUTED', 'COMPLETE'
);

ALTER TABLE work_orders
  ALTER COLUMN status TYPE work_order_status_new
  USING status::work_order_status_new;

ALTER TABLE work_orders ALTER COLUMN status SET DEFAULT 'CREATED'::work_order_status_new;

DROP TYPE work_order_status;
ALTER TYPE work_order_status_new RENAME TO work_order_status;

-- Restore default using the renamed type
ALTER TABLE work_orders ALTER COLUMN status SET DEFAULT 'CREATED'::work_order_status;
