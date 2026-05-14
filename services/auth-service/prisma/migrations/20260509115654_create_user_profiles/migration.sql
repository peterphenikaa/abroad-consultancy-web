-- AlterTable
ALTER TABLE "users" ADD COLUMN     "userProfileId" UUID;

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" VARCHAR(25) NOT NULL,
    "userId" UUID NOT NULL,
    "bio" TEXT,
    "avatar_url" VARCHAR(500),
    "educational_level" VARCHAR(100),
    "learning_goals" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE INDEX "user_profiles_created_at_idx" ON "user_profiles"("created_at");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
