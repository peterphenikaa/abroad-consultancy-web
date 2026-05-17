-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(19, 2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "description" VARCHAR(500),
    "status" VARCHAR(32) NOT NULL,
    "provider" VARCHAR(32),
    "provider_ref" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_payments_user_id" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "idx_payments_status" ON "payments"("status");
