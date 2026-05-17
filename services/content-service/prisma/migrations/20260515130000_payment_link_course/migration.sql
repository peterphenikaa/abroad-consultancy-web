-- AlterTable
ALTER TABLE "payments" ADD COLUMN "course_id" UUID;

-- CreateIndex
CREATE INDEX "idx_payments_course_id" ON "payments"("course_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("courseId") ON DELETE SET NULL ON UPDATE CASCADE;
