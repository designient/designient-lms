-- AlterTable
ALTER TABLE "users"
ADD COLUMN "email_notifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "push_notifications" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "login_attempts_identifier_key" ON "login_attempts"("identifier");

-- CreateIndex
CREATE INDEX "login_attempts_locked_until_idx" ON "login_attempts"("locked_until");
