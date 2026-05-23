-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('Local', 'Google');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "auth_provider" "AuthProvider" NOT NULL DEFAULT 'Local',
ADD COLUMN     "providerId" VARCHAR(255),
ALTER COLUMN "password_hash" DROP NOT NULL;
