/*
  # Create Admin System Tables

  ## Overview
  This migration creates the complete admin system for the pizza ordering platform.
  It includes tables for inventory management, order tracking, and admin authentication.

  ## 1. New Tables
  
  ### `admin_users`
  - `id` (uuid, primary key) - Admin unique identifier
  - `email` (text, unique) - Admin email for login
  - `username` (text) - Admin display name
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update
  
  ### `inventory`
  - `id` (uuid, primary key) - Inventory item identifier
  - `name` (text, unique) - Item name (e.g., "Mozzarella Cheese")
  - `category` (text) - Category (meat, vegetable, cheese, sauce, base)
  - `stock_quantity` (integer) - Current stock amount
  - `unit` (text) - Measurement unit (kg, pieces, liters)
  - `is_available` (boolean) - Availability toggle for admin
  - `low_stock_threshold` (integer) - Warning threshold
  - `created_at` (timestamptz) - Item creation timestamp
  - `updated_at` (timestamptz) - Last stock update
  
  ### `orders`
  - `id` (uuid, primary key) - Order identifier
  - `user_id` (uuid) - Reference to auth.users
  - `user_email` (text) - Customer email
  - `user_name` (text) - Customer name
  - `total_price` (decimal) - Total order amount
  - `status` (text) - Order status (pending, processing, completed, shipped)
  - `created_at` (timestamptz) - Order placement time
  - `updated_at` (timestamptz) - Last status update
  
  ### `order_items`
  - `id` (uuid, primary key) - Order item identifier
  - `order_id` (uuid, foreign key) - Reference to orders
  - `pizza_name` (text) - Custom pizza name
  - `size` (text) - Pizza size
  - `crust` (text) - Crust type
  - `sauce` (text) - Sauce choice
  - `toppings` (jsonb) - Array of topping objects
  - `quantity` (integer) - Number of pizzas
  - `price` (decimal) - Item price
  - `created_at` (timestamptz) - Item creation time

  ## 2. Security
  - Enable RLS on all tables
  - Admin users can manage all data
  - Regular authenticated users can view their own orders
  - Public users have no access to admin tables
  
  ## 3. Important Notes
  - Admin authentication uses same auth.users but with admin_users table for admin-specific data
  - Inventory availability directly affects customer pizza builder
  - Orders are created when customers complete checkout
  - Stock quantities should be monitored regularly
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  username text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read own data"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update own data"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL CHECK (category IN ('meat', 'vegetable', 'cheese', 'sauce', 'base')),
  stock_quantity integer DEFAULT 0,
  unit text DEFAULT 'kg',
  is_available boolean DEFAULT true,
  low_stock_threshold integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert inventory"
  ON inventory FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update inventory"
  ON inventory FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete inventory"
  ON inventory FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  user_name text NOT NULL,
  total_price decimal(10, 2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'shipped')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  pizza_name text NOT NULL,
  size text NOT NULL,
  crust text NOT NULL,
  sauce text NOT NULL,
  toppings jsonb DEFAULT '[]'::jsonb,
  quantity integer DEFAULT 1,
  price decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_is_available ON inventory(is_available);

-- Insert default inventory items
INSERT INTO inventory (name, category, stock_quantity, unit, is_available, low_stock_threshold) VALUES
  ('Thin Crust', 'base', 100, 'pieces', true, 20),
  ('Thick Crust', 'base', 100, 'pieces', true, 20),
  ('Stuffed Crust', 'base', 80, 'pieces', true, 15),
  ('Tomato Sauce', 'sauce', 50, 'liters', true, 10),
  ('BBQ Sauce', 'sauce', 40, 'liters', true, 10),
  ('White Sauce', 'sauce', 35, 'liters', true, 8),
  ('Mozzarella Cheese', 'cheese', 60, 'kg', true, 15),
  ('Cheddar Cheese', 'cheese', 45, 'kg', true, 10),
  ('Parmesan Cheese', 'cheese', 30, 'kg', true, 8),
  ('Pepperoni', 'meat', 40, 'kg', true, 10),
  ('Italian Sausage', 'meat', 35, 'kg', true, 10),
  ('Ham', 'meat', 30, 'kg', true, 8),
  ('Chicken', 'meat', 38, 'kg', true, 10),
  ('Bacon', 'meat', 25, 'kg', true, 8),
  ('Mushrooms', 'vegetable', 20, 'kg', true, 5),
  ('Bell Peppers', 'vegetable', 25, 'kg', true, 5),
  ('Onions', 'vegetable', 22, 'kg', true, 5),
  ('Olives', 'vegetable', 18, 'kg', true, 5),
  ('Tomatoes', 'vegetable', 20, 'kg', true, 5),
  ('Spinach', 'vegetable', 15, 'kg', true, 5)
ON CONFLICT (name) DO NOTHING;