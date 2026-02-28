CREATE EXTENSION IF NOT EXISTS "pgcrypto";

BEGIN;

-- 3. CREATE TABLES WITH AUTO-GENERATED PREFIXED IDs

CREATE TABLE customers (
  id TEXT PRIMARY KEY DEFAULT ('cust_' || gen_random_uuid()),
  name TEXT NOT NULL,
  mobile_no VARCHAR(20) NOT NULL,
  address TEXT,
  city TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dealers (
  id TEXT PRIMARY KEY DEFAULT ('deal_' || gen_random_uuid()),
  contact_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  mobile_no VARCHAR(20) NOT NULL,
  address TEXT,
  city TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  outstanding_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE brands (
  id TEXT PRIMARY KEY DEFAULT ('brnd_' || gen_random_uuid()),
  name TEXT NOT NULL,
  company_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id TEXT PRIMARY KEY DEFAULT ('prod_' || gen_random_uuid()),
  brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  hsn VARCHAR(20) NOT NULL,
  pack TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_orders (
  id TEXT PRIMARY KEY DEFAULT ('po_' || gen_random_uuid()),
  purchase_order_number TEXT NOT NULL UNIQUE,
  dealer_id TEXT REFERENCES dealers(id) ON DELETE SET NULL,
  order_date DATE NOT NULL,
  due_date DATE,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_batches (
  id TEXT PRIMARY KEY DEFAULT ('bat_' || gen_random_uuid()),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  dealer_id TEXT REFERENCES dealers(id) ON DELETE SET NULL,
  purchase_order_id TEXT REFERENCES purchase_orders(id) ON DELETE SET NULL,
  batch_no TEXT NOT NULL,
  expiry_date DATE,
  hsn VARCHAR(20) NOT NULL,
  pack TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0 CHECK (qty >= 0),
  mrp NUMERIC(12, 2) NOT NULL CHECK (mrp >= 0),
  purchase_rate NUMERIC(12, 2) NOT NULL CHECK (purchase_rate >= 0),
  sgst NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (sgst >= 0),
  cgst NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (cgst >= 0),
  total_purchase_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_purchase_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, batch_no)
);

CREATE TABLE sales_orders (
  id TEXT PRIMARY KEY DEFAULT ('so_' || gen_random_uuid()),
  order_number TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  order_date DATE NOT NULL,
  due_date DATE,
  taxable_value NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (taxable_value >= 0),
  sgst_total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (sgst_total >= 0),
  cgst_total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (cgst_total >= 0),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note: line items often use BIGSERIAL for simplicity within an order context
CREATE TABLE sales_order_items (
  id BIGSERIAL PRIMARY KEY,
  sales_order_id TEXT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  inventory_batch_id TEXT REFERENCES inventory_batches(id) ON DELETE SET NULL,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  batch_no TEXT,
  expiry_date DATE,
  pack TEXT,
  hsn VARCHAR(20),
  qty INTEGER NOT NULL CHECK (qty > 0),
  mrp NUMERIC(12, 2) NOT NULL CHECK (mrp >= 0),
  rate NUMERIC(12, 2) NOT NULL CHECK (rate >= 0),
  sgst NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (sgst >= 0),
  cgst NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (cgst >= 0),
  line_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (line_amount >= 0)
);

CREATE TABLE customer_collections (
  id TEXT PRIMARY KEY DEFAULT ('coll_' || gen_random_uuid()),
  sales_order_id TEXT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'Card', 'Cheque')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
  id BIGSERIAL PRIMARY KEY,
  purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  batch_no TEXT,
  expiry_date DATE,
  pack TEXT,
  hsn VARCHAR(20),
  qty INTEGER NOT NULL CHECK (qty > 0),
  purchase_rate NUMERIC(12, 2) NOT NULL CHECK (purchase_rate >= 0),
  mrp NUMERIC(12, 2) NOT NULL CHECK (mrp >= 0),
  sgst NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (sgst >= 0),
  cgst NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (cgst >= 0),
  line_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (line_amount >= 0)
);

CREATE TABLE dealer_payments (
  id TEXT PRIMARY KEY DEFAULT ('pay_' || gen_random_uuid()),
  purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  dealer_id TEXT REFERENCES dealers(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_product_id ON inventory_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_dealer_id ON inventory_batches(dealer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_due_date ON sales_orders(due_date);
CREATE INDEX IF NOT EXISTS idx_customer_collections_sales_order_id ON customer_collections(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_dealer_id ON purchase_orders(dealer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_due_date ON purchase_orders(due_date);
CREATE INDEX IF NOT EXISTS idx_dealer_payments_purchase_order_id ON dealer_payments(purchase_order_id);

COMMIT;