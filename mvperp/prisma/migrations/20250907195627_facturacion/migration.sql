-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "pac" TEXT,
ADD COLUMN     "pacPass" TEXT,
ADD COLUMN     "pacUser" TEXT,
ADD COLUMN     "testMode" BOOLEAN NOT NULL DEFAULT true;
