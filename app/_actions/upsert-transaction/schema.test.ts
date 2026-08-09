import { describe, expect, it } from "vitest";
import { upsertTransactionSchema } from "./schema";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";

const validTransaction = {
  name: "Mercado Central",
  amount: 150.5,
  type: TransactionType.EXPENSE,
  category: TransactionCategory.FOOD,
  paymentMethod: TransactionPaymentMethod.PIX,
  date: new Date(2026, 0, 15),
};

describe("upsertTransactionSchema", () => {
  it("aceita uma transação válida", () => {
    expect(() =>
      upsertTransactionSchema.parse(validTransaction),
    ).not.toThrow();
  });

  it("aceita id opcional (uuid válido)", () => {
    expect(() =>
      upsertTransactionSchema.parse({
        ...validTransaction,
        id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    ).not.toThrow();
  });

  it("aceita sem id (criação)", () => {
    const result = upsertTransactionSchema.parse(validTransaction);
    expect(result.id).toBeUndefined();
  });

  it("rejeita nome vazio", () => {
    expect(() =>
      upsertTransactionSchema.parse({ ...validTransaction, name: "  " }),
    ).toThrow();
  });

  it("rejeita valor zero ou negativo", () => {
    expect(() =>
      upsertTransactionSchema.parse({ ...validTransaction, amount: 0 }),
    ).toThrow();
    expect(() =>
      upsertTransactionSchema.parse({ ...validTransaction, amount: -50 }),
    ).toThrow();
  });

  it("rejeita tipo inválido", () => {
    expect(() =>
      upsertTransactionSchema.parse({ ...validTransaction, type: "SAVINGS" }),
    ).toThrow();
  });

  it("rejeita id que não é uuid", () => {
    expect(() =>
      upsertTransactionSchema.parse({
        ...validTransaction,
        id: "nao-e-uuid",
      }),
    ).toThrow();
  });
});
