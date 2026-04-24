-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "depositPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripePaymentIntentId" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeOnboardingDone" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripeCustomerId" TEXT;
