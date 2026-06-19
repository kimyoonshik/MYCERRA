/*
  Warnings:

  - You are about to drop the column `status` on the `SampleRequest` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NdaStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'SENT', 'SIGNED');

-- CreateEnum
CREATE TYPE "SampleApprovalStatus" AS ENUM ('PENDING', 'OWNER_APPROVAL_REQUIRED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SampleShippingStatus" AS ENUM ('NOT_SHIPPED', 'PREPARING', 'SHIPPED', 'DELIVERED');

-- DropIndex
DROP INDEX "SampleRequest_status_idx";

-- AlterTable
ALTER TABLE "SampleRequest" DROP COLUMN "status",
ADD COLUMN     "approvalStatus" "SampleApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "customerPaidShipping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "destinationCountry" TEXT,
ADD COLUMN     "followUpDate" TIMESTAMP(3),
ADD COLUMN     "intendedUse" TEXT,
ADD COLUMN     "ndaRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ndaStatus" "NdaStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN     "paidSample" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "quotedPrice" DECIMAL(12,2),
ADD COLUMN     "shippingCost" DECIMAL(12,2),
ADD COLUMN     "shippingStatus" "SampleShippingStatus" NOT NULL DEFAULT 'NOT_SHIPPED';

-- DropEnum
DROP TYPE "SampleStatus";

-- CreateIndex
CREATE INDEX "SampleRequest_approvalStatus_idx" ON "SampleRequest"("approvalStatus");

-- CreateIndex
CREATE INDEX "SampleRequest_shippingStatus_idx" ON "SampleRequest"("shippingStatus");

-- AddForeignKey
ALTER TABLE "SampleRequest" ADD CONSTRAINT "SampleRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
