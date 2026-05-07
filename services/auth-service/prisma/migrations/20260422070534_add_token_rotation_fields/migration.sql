-- AlterTable
ALTER TABLE "user_sessions" ADD COLUMN     "last_used_at" TIMESTAMP(6),
ADD COLUMN     "refresh_token_hash" VARCHAR(255),
ADD COLUMN     "revoked_at" TIMESTAMP(6);
