-- Create master_products table for storing imported product data
CREATE TABLE IF NOT EXISTS master_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  uom TEXT NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create locations table for storing location folders
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pic_name TEXT,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_counts table for storing count results
CREATE TABLE IF NOT EXISTS stock_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  product_name TEXT NOT NULL,
  uom TEXT NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  counted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_master_products_barcode ON master_products(barcode);
CREATE INDEX IF NOT EXISTS idx_stock_counts_location ON stock_counts(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_counts_barcode ON stock_counts(barcode);
CREATE INDEX IF NOT EXISTS idx_stock_counts_counted_at ON stock_counts(counted_at);

-- Enable Row Level Security
ALTER TABLE master_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_counts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a simple warehouse app without user auth)
-- Allow all operations on master_products
CREATE POLICY "Allow all access to master_products" ON master_products FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on locations
CREATE POLICY "Allow all access to locations" ON locations FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on stock_counts
CREATE POLICY "Allow all access to stock_counts" ON stock_counts FOR ALL USING (true) WITH CHECK (true);
