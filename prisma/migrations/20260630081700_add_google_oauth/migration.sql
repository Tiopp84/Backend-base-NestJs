/*
  Warnings:

  - A unique constraint covering the columns `[Google_ID]` on the table `USERS` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "USERS" ADD COLUMN     "Google_ID" TEXT,
ALTER COLUMN "Password_Hash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "USERS_Google_ID_key" ON "USERS"("Google_ID");
