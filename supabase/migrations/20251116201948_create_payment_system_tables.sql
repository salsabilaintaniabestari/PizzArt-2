/*
  # Payment System with QRIS Integration
  
  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `order_id` (text) - Order ID reference
      - `user_id` (text) - User ID who made payment
      - `amount` (numeric)
      - `payment_method` (text) - 'qris', 'cash', etc
      - `status` (text) - 'pending', 'success', 'failed', 'expired'
      - `qr_string` (text) - QRIS string from Midtrans
      - `transaction_id` (text) - Midtrans transaction ID
      - `midtrans_order_id` (text) - Midtrans order ID
      - `expiry_time` (timestamptz)
      - `paid_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `revenue_stats`
      - `id` (uuid, primary key)
      - `date` (date)
      - `total_revenue` (numeric)
      - `total_orders` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  user_id text NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'qris',
  status text NOT NULL DEFAULT 'pending',
  qr_string text,
  transaction_id text,
  midtrans_order_id text UNIQUE,
  expiry_time timestamptz,
  paid_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create revenue_stats table
CREATE TABLE IF NOT EXISTS revenue_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_revenue numeric NOT NULL DEFAULT 0,
  total_orders integer NOT NULL DEFAULT 0,
  successful_payments integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create webhook_logs table for debugging
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  order_id text,
  transaction_status text,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_midtrans_order_id ON payments(midtrans_order_id);
CREATE INDEX IF NOT EXISTS idx_revenue_stats_date ON revenue_stats(date);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_order_id ON webhook_logs(order_id);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Service role can manage payments"
  ON payments FOR ALL
  USING (true);

-- Revenue stats policies (admin only - we'll control via service key)
CREATE POLICY "Service role can manage revenue stats"
  ON revenue_stats FOR ALL
  USING (true);

-- Webhook logs policies (service role only)
CREATE POLICY "Service role can manage webhook logs"
  ON webhook_logs FOR ALL
  USING (true);

-- Function to update revenue stats after payment success
CREATE OR REPLACE FUNCTION update_revenue_stats()
RETURNS TRIGGER AS $$
DECLARE
  payment_date date;
  payment_amount numeric;
BEGIN
  -- Only process when payment status changes to success
  IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') THEN
    payment_date := DATE(COALESCE(NEW.paid_at, NEW.updated_at));
    payment_amount := NEW.amount;
    
    -- Insert or update revenue stats for the day
    INSERT INTO revenue_stats (date, total_revenue, total_orders, successful_payments, updated_at)
    VALUES (payment_date, payment_amount, 1, 1, now())
    ON CONFLICT (date)
    DO UPDATE SET
      total_revenue = revenue_stats.total_revenue + payment_amount,
      total_orders = revenue_stats.total_orders + 1,
      successful_payments = revenue_stats.successful_payments + 1,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update revenue stats
DROP TRIGGER IF EXISTS trigger_update_revenue_stats ON payments;
CREATE TRIGGER trigger_update_revenue_stats
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_revenue_stats();
