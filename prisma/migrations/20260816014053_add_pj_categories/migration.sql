-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionCategory" ADD VALUE 'PRO_LABORE';
ALTER TYPE "TransactionCategory" ADD VALUE 'FATURAMENTO';
ALTER TYPE "TransactionCategory" ADD VALUE 'TRIBUTOS';
ALTER TYPE "TransactionCategory" ADD VALUE 'FORNECEDORES';
ALTER TYPE "TransactionCategory" ADD VALUE 'EQUIPAMENTOS';
ALTER TYPE "TransactionCategory" ADD VALUE 'MARKETING';
ALTER TYPE "TransactionCategory" ADD VALUE 'SERVICOS';
ALTER TYPE "TransactionCategory" ADD VALUE 'ALUGUEL_EMPRESARIAL';
