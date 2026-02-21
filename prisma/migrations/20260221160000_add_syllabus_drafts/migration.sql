-- CreateEnum
CREATE TYPE "SyllabusDraftStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'REJECTED');

-- CreateTable
CREATE TABLE "syllabus_drafts" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "status" "SyllabusDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "snapshot" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "submitted_by" TEXT,
    "submitted_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "syllabus_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "syllabus_drafts_course_id_key" ON "syllabus_drafts"("course_id");

-- CreateIndex
CREATE INDEX "syllabus_drafts_status_idx" ON "syllabus_drafts"("status");

-- CreateIndex
CREATE INDEX "syllabus_drafts_updated_at_idx" ON "syllabus_drafts"("updated_at");

-- AddForeignKey
ALTER TABLE "syllabus_drafts" ADD CONSTRAINT "syllabus_drafts_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_drafts" ADD CONSTRAINT "syllabus_drafts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_drafts" ADD CONSTRAINT "syllabus_drafts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_drafts" ADD CONSTRAINT "syllabus_drafts_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_drafts" ADD CONSTRAINT "syllabus_drafts_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
