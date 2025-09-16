/*
  Warnings:

  - You are about to alter the column `transponder` on the `Driver` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.

*/
-- AlterTable
ALTER TABLE "public"."Driver" ALTER COLUMN "transponder" SET DATA TYPE VARCHAR(20);
