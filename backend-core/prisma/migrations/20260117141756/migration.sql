/*
  Warnings:

  - The values [COUNTERED] on the enum `NegotiationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PROCESSING,SHIPPED,DELIVERED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NegotiationStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');
ALTER TABLE "public"."negotiations" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "negotiations" ALTER COLUMN "status" TYPE "NegotiationStatus_new" USING ("status"::text::"NegotiationStatus_new");
ALTER TYPE "NegotiationStatus" RENAME TO "NegotiationStatus_old";
ALTER TYPE "NegotiationStatus_new" RENAME TO "NegotiationStatus";
DROP TYPE "public"."NegotiationStatus_old";
ALTER TABLE "negotiations" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
