CREATE TABLE IF NOT EXISTS user_subscriptions (
    user_id VARCHAR(255) PRIMARY KEY,
    plan_code VARCHAR(32) NOT NULL,
    billing_cycle VARCHAR(16) NOT NULL,
    expires_at TIMESTAMPTZ(6) NOT NULL,
    created_at TIMESTAMPTZ(6) NOT NULL,
    updated_at TIMESTAMPTZ(6) NOT NULL
);
