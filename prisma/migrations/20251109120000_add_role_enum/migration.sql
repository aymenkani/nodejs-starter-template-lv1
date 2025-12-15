-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
UPDATE "User" SET "role" = 'USER' WHERE "role" = 'user';
UPDATE "User" SET "role" = 'ADMIN' WHERE "role" = 'admin';
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::text::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';