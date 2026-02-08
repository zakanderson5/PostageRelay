-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('DRAFT', 'AUTHORIZING', 'AUTHORIZED', 'ACCEPTED', 'RELEASED', 'EXPIRED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeAccountId" TEXT,
    "stripeOnboarded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BondPage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT,
    "headline" TEXT,
    "instructions" TEXT,
    "minBondCents" INTEGER NOT NULL DEFAULT 500,
    "allowBoost" BOOLEAN NOT NULL DEFAULT true,
    "maxBondCents" INTEGER NOT NULL DEFAULT 1500,
    "timeoutHours" INTEGER NOT NULL DEFAULT 72,
    "categoriesJson" JSONB,
    "allowlistJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BondPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "bondPageId" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "senderName" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "bondCents" INTEGER NOT NULL,
    "deliveryFeeCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "MessageStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentIntentId" TEXT,
    "latestChargeId" TEXT,
    "transferId" TEXT,
    "authorizedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BondPage_userId_key" ON "BondPage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BondPage_slug_key" ON "BondPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Message_publicId_key" ON "Message"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_paymentIntentId_key" ON "Message"("paymentIntentId");

-- CreateIndex
CREATE INDEX "Message_receiverId_status_idx" ON "Message"("receiverId", "status");

-- CreateIndex
CREATE INDEX "Message_expiresAt_idx" ON "Message"("expiresAt");

-- AddForeignKey
ALTER TABLE "BondPage" ADD CONSTRAINT "BondPage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_bondPageId_fkey" FOREIGN KEY ("bondPageId") REFERENCES "BondPage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
