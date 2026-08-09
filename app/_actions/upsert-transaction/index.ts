"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { upsertTransactionSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { endOfMonth, startOfMonth } from "date-fns";
import { getUserSubscriptionPlan } from "@/app/_data/get-user-subscription-plan";
import { FREE_PLAN_MONTHLY_TRANSACTION_LIMIT } from "@/app/_constants/transactions";

interface UpsertTransactionParams {
  id?: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  date: Date;
}

export const upsertTransaction = async (params: UpsertTransactionParams) => {
  upsertTransactionSchema.parse(params);
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Se for update, garantir que a transação pertence ao usuário autenticado
  if (params.id) {
    const existing = await db.transaction.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });
    if (!existing || existing.userId !== userId) {
      throw new Error("Unauthorized");
    }
  }

  // Limite do plano free: apenas criações novas contam contra o limite mensal
  if (!params.id) {
    const subscriptionPlan = await getUserSubscriptionPlan(userId);
    if (subscriptionPlan !== "premium") {
      const currentMonthTransactions = await db.transaction.count({
        where: {
          userId,
          date: {
            gte: startOfMonth(new Date()),
            lte: endOfMonth(new Date()),
          },
        },
      });
      if (currentMonthTransactions >= FREE_PLAN_MONTHLY_TRANSACTION_LIMIT) {
        throw new Error(
          `Limite mensal de ${FREE_PLAN_MONTHLY_TRANSACTION_LIMIT} transações atingido. Assine o plano premium para transações ilimitadas.`,
        );
      }
    }
  }

  await db.transaction.upsert({
    update: { ...params, userId },
    create: { ...params, userId },
    where: {
      id: params.id ?? "",
    },
  });
  revalidatePath("/transactions");
  revalidatePath("/");
};
