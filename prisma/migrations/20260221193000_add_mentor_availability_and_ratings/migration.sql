-- CreateEnum
CREATE TYPE "MentorAvailabilityStatus" AS ENUM ('AVAILABLE', 'LIMITED', 'UNAVAILABLE');

-- AlterTable
ALTER TABLE "mentor_profiles"
ADD COLUMN "availability_status" "MentorAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE';

-- CreateTable
CREATE TABLE "mentor_ratings" (
    "id" TEXT NOT NULL,
    "mentor_profile_id" TEXT NOT NULL,
    "student_profile_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mentor_ratings_mentor_profile_id_student_profile_id_key" ON "mentor_ratings"("mentor_profile_id", "student_profile_id");

-- CreateIndex
CREATE INDEX "mentor_ratings_mentor_profile_id_idx" ON "mentor_ratings"("mentor_profile_id");

-- CreateIndex
CREATE INDEX "mentor_ratings_student_profile_id_idx" ON "mentor_ratings"("student_profile_id");

-- AddForeignKey
ALTER TABLE "mentor_ratings" ADD CONSTRAINT "mentor_ratings_mentor_profile_id_fkey" FOREIGN KEY ("mentor_profile_id") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_ratings" ADD CONSTRAINT "mentor_ratings_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
