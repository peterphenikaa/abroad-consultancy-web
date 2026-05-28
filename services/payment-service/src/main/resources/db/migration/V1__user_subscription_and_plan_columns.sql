CREATE TABLE IF NOT EXISTS user_subscriptions (
    user_id VARCHAR(255) PRIMARY KEY,
    plan_code VARCHAR(32) NOT NULL,
    billing_cycle VARCHAR(16) NOT NULL,
    expires_at TIMESTAMPTZ(6) NOT NULL,
    created_at TIMESTAMPTZ(6) NOT NULL,
    updated_at TIMESTAMPTZ(6) NOT NULL
);

DO $$
BEGIN
  IF to_regclass('public.payments') IS NOT NULL THEN
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan_code VARCHAR(32);
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(16);
  END IF;
END $$;
