ALTER TABLE user_subscriptions
    ADD COLUMN IF NOT EXISTS auto_renew_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE user_subscriptions
    ADD COLUMN IF NOT EXISTS last_renewal_attempt_at TIMESTAMPTZ(6);

ALTER TABLE user_subscriptions
    ADD COLUMN IF NOT EXISTS renewal_failure_reason VARCHAR(500);

CREATE TABLE IF NOT EXISTS user_payment_methods (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(32) NOT NULL DEFAULT 'VNPAY',
    token_ref VARCHAR(255) NOT NULL,
    brand VARCHAR(64),
    bank_code VARCHAR(32),
    last4 VARCHAR(4),
    created_at TIMESTAMPTZ(6) NOT NULL,
    updated_at TIMESTAMPTZ(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id ON user_payment_methods(user_id);
