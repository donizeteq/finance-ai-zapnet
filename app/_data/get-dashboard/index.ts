import { db } from "@/app/_lib/prisma";
import { TransactionType } from "@prisma/client";
import { TotalExpensePerCategory, TransactionPercentagePerType } from "./types";
import { auth } from "@clerk/nextjs/server";
import { endOfMonth, startOfMonth } from "date-fns";

export const getDashboard = async (month: string, year: string) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const paddedMonth = month.padStart(2, "0");
  const startDate = startOfMonth(new Date(`${year}-${paddedMonth}-01`));
  const endDate = endOfMonth(new Date(`${year}-${paddedMonth}-01`));

  const where = {
    userId,
    date: {
      gte: startDate,
      lt: endDate,
    },
  };

  // Todas as queries em paralelo
  const [
    depositsResult,
    investmentsResult,
    expensesResult,
    transactionsTotalResult,
    totalExpensePerCategoryRaw,
    lastTransactions,
  ] = await Promise.all([
    db.transaction.aggregate({
      where: { ...where, type: TransactionType.DEPOSIT },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { ...where, type: TransactionType.INVESTMENT },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { ...where, type: TransactionType.EXPENSE },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where,
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["category"],
      where: { ...where, type: TransactionType.EXPENSE },
      _sum: { amount: true },
    }),
    db.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  const depositsTotal = Number(depositsResult._sum?.amount ?? 0);
  const investmentsTotal = Number(investmentsResult._sum?.amount ?? 0);
  const expensesTotal = Number(expensesResult._sum?.amount ?? 0);
  const transactionsTotal = Number(transactionsTotalResult._sum?.amount ?? 0);
  const balance = depositsTotal - investmentsTotal - expensesTotal;

  // Evitar NaN/divisão por zero quando não há transações
  const typesPercentage: TransactionPercentagePerType =
    transactionsTotal > 0
      ? {
          [TransactionType.DEPOSIT]: Math.round(
            (depositsTotal / transactionsTotal) * 100,
          ),
          [TransactionType.EXPENSE]: Math.round(
            (expensesTotal / transactionsTotal) * 100,
          ),
          [TransactionType.INVESTMENT]: Math.round(
            (investmentsTotal / transactionsTotal) * 100,
          ),
        }
      : {
          [TransactionType.DEPOSIT]: 0,
          [TransactionType.EXPENSE]: 0,
          [TransactionType.INVESTMENT]: 0,
        };

  const totalExpensePerCategory: TotalExpensePerCategory[] =
    totalExpensePerCategoryRaw.map((category) => ({
      category: category.category,
      totalAmount: Number(category._sum.amount),
      percentageOfTotal:
        expensesTotal > 0
          ? Math.round((Number(category._sum.amount) / expensesTotal) * 100)
          : 0,
    }));

  return {
    balance,
    depositsTotal,
    investmentsTotal,
    expensesTotal,
    typesPercentage,
    totalExpensePerCategory,
    lastTransactions: JSON.parse(JSON.stringify(lastTransactions)),
  };
};
