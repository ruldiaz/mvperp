/*
  Warnings:

  - You are about to drop the column `createdAt` on the `SaleItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Customer" ADD COLUMN     "fiscalAddress" TEXT,
ADD COLUMN     "fiscalCity" TEXT,
ADD COLUMN     "fiscalCountry" TEXT DEFAULT 'México',
ADD COLUMN     "fiscalExteriorNumber" TEXT,
ADD COLUMN     "fiscalInteriorNumber" TEXT,
ADD COLUMN     "fiscalMunicipality" TEXT,
ADD COLUMN     "fiscalNeighborhood" TEXT,
ADD COLUMN     "fiscalPostalCode" TEXT,
ADD COLUMN     "fiscalState" TEXT,
ADD COLUMN     "fiscalStreet" TEXT,
ADD COLUMN     "razonSocial" TEXT,
ADD COLUMN     "taxRegime" TEXT,
ADD COLUMN     "usoCFDI" TEXT;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "ivaIncluded" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "satUnitKey" TEXT;

-- AlterTable
ALTER TABLE "public"."SaleItem" DROP COLUMN "createdAt",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "satProductKey" TEXT,
ADD COLUMN     "satUnitKey" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "companyId" UUID;

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "rfc" TEXT NOT NULL,
    "regime" TEXT NOT NULL,
    "csdCert" TEXT,
    "csdKey" TEXT,
    "csdPassword" TEXT,
    "street" TEXT NOT NULL,
    "exteriorNumber" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "country" TEXT DEFAULT 'México',
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "saleId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "uuid" TEXT,
    "serie" TEXT,
    "folio" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "xmlUrl" TEXT,
    "pdfUrl" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentForm" TEXT,
    "currency" TEXT DEFAULT 'MXN',
    "exchangeRate" DOUBLE PRECISION,
    "subtotal" DOUBLE PRECISION,
    "discount" DOUBLE PRECISION,
    "taxes" DOUBLE PRECISION,
    "cfdiUse" TEXT,
    "relatedInvoices" TEXT,
    "cancellationStatus" TEXT,
    "cancellationReceipt" TEXT,
    "paymentAccount" TEXT,
    "verificationUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoiceItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoiceId" UUID NOT NULL,
    "saleItemId" UUID NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_rfc_key" ON "public"."Company"("rfc");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceItem" ADD CONSTRAINT "InvoiceItem_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "public"."SaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
