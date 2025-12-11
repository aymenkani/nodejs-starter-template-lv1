-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CONTRIBUTOR';

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "File_isPublic_idx" ON "File"("isPublic");
