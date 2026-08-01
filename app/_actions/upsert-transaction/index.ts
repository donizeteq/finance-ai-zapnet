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
