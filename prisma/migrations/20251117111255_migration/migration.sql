-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHistory" TEXT[] DEFAULT ARRAY[]::TEXT[];
