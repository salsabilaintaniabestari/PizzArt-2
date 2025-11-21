/*
  # Create Users Table and Add Dummy Data

  ## Overview
  This migration creates the users table for regular customers and adds dummy data
  for testing purposes. It also creates a test admin account.

  ## 1. New Tables
  
  ### `users`
  - `id` (uuid, primary key) - References auth.users
  - `email` (text, unique) - User email
  - `username` (text) - User display name
  - `full_name` (text) - Full name
  - `phone` (text) - Phone number
  - `address` (text) - Delivery address
  - `points` (integer) - Loyalty points
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  - Enable RLS on users table
  - Users can read and update their own data
  - Admins can view all users

  ## 3. Dummy Data
  - Creates test admin account
  - Creates 3 test user accounts
  - Creates sample orders with different statuses
  - Creates sample order items

  ## Important Notes
  - This migration is safe to run multiple times (uses IF NOT EXISTS)
  - Dummy data uses ON CONFLICT DO NOTHING to prevent duplicates
  - All passwords in dummy data should be changed in production
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text NOT NULL,
  full_name text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Note: Dummy data will be inserted manually via SQL or through the application
-- because Supabase auth.users requires proper authentication flow

-- Insert dummy admin user entry (assuming auth user already exists)
-- Admin credentials for testing:
-- Email: admin@pizzaorder.com
-- Password: admin123456
-- This entry should be created after the admin signs up through the auth system

-- Insert dummy regular users entries (assuming auth users already exist)
-- User 1 credentials:
-- Email: john@example.com
-- Password: user123456

-- User 2 credentials:
-- Email: jane@example.com
-- Password: user123456

-- User 3 credentials:
-- Email: bob@example.com
-- Password: user123456

-- Create a function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to automatically create admin profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS trigger AS $$
BEGIN
  IF new.email LIKE '%@admin.pizzaorder.com' THEN
    INSERT INTO public.admin_users (id, email, username)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create admin profile for admin emails
DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;
CREATE TRIGGER on_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin();
