-- CreateTable
CREATE TABLE "Receipt" (
    "id" SERIAL NOT NULL,
    "deviceId" TEXT NOT NULL,
    "merchant" TEXT NOT NULL,
    "itemName" TEXT,
    "amount" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "rawText" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Receipt_deviceId_idx" ON "Receipt"("deviceId");
