-- CreateTable
CREATE TABLE "AccountantClient" (
    "id" TEXT NOT NULL,
    "accountantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountantClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountantClient_accountantId_clientId_key" ON "AccountantClient"("accountantId", "clientId");
