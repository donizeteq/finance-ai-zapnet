-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('PESSOAL', 'EMPRESA');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "eh_dedutivel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tipo_transacao" "AccountType";
