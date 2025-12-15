/*
  Warnings:

  - A unique constraint covering the columns `[opaqueToken]` on the table `PasswordResetToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `opaqueToken` to the `PasswordResetToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."PasswordResetToken_token_key";

-- AlterTable
ALTER TABLE "PasswordResetToken" ADD COLUMN     "opaqueToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_opaqueToken_key" ON "PasswordResetToken"("opaqueToken");
