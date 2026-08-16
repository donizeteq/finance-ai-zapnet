import {
  AccountType,
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { z } from "zod";

export const upsertTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1),
  amount: z.number().positive(),
  type: z.nativeEnum(TransactionType),
  tipo_transacao: z.nativeEnum(AccountType).nullable().optional(),
  eh_dedutivel: z.boolean().nullable().optional(),
  category: z.nativeEnum(TransactionCategory),
  paymentMethod: z.nativeEnum(TransactionPaymentMethod),
  date: z.date(),
});
