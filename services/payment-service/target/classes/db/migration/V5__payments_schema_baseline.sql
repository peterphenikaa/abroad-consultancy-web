-- Payment domain baseline (owned by payment-service).
-- course_id is a logical UUID reference to content-service Course (no cross-service FK).

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    amount DECIMAL(19, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    description VARCHAR(500),
    status VARCHAR(32) NOT NULL,
    provider VARCHAR(32),
    provider_ref VARCHAR(255),
    created_at TIMESTAMPTZ(6) NOT NULL,
    updated_at TIMESTAMPTZ(6) NOT NULL,
    course_id UUID,
    plan_code VARCHAR(32),
    billing_cycle VARCHAR(16)
);

-- Upgrade tables created by older content-service migrations (if any).
ALTER TABLE payments ADD COLUMN IF NOT EXISTS course_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan_code VARCHAR(32);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(16);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_course_id ON payments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_course ON payments(user_id, course_id);

-- Remove legacy FK to content-service Course table (if present).
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_course_id_fkey;
