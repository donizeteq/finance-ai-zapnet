import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { pluggyClient } from "@/app/_lib/pluggy";
import { db } from "@/app/_lib/prisma";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";

function mapPluggyCategory(categoryName?: string | null): TransactionCategory {
  if (!categoryName) return TransactionCategory.OTHER;
  const lower = categoryName.toLowerCase();

  if (
    lower.includes("food") ||
    lower.includes("refeicao") ||
    lower.includes("restaurante") ||
    lower.includes("mercado") ||
    lower.includes("supermercado")
  ) {
    return TransactionCategory.FOOD;
  }
  if (
    lower.includes("transport") ||
    lower.includes("uber") ||
    lower.includes("combustivel") ||
    lower.includes("posto") ||
    lower.includes("taxi")
  ) {
    return TransactionCategory.TRANSPORTATION;
  }
  if (
    lower.includes("housing") ||
    lower.includes("moradia") ||
    lower.includes("aluguel") ||
    lower.includes("condominio")
  ) {
    return TransactionCategory.HOUSING;
  }
  if (
    lower.includes("health") ||
    lower.includes("saude") ||
    lower.includes("farmacia") ||
    lower.includes("hospital") ||
    lower.includes("medico")
  ) {
    return TransactionCategory.HEALTH;
  }
  if (
    lower.includes("utility") ||
    lower.includes("luz") ||
    lower.includes("agua") ||
    lower.includes("internet") ||
    lower.includes("telefone")
  ) {
    return TransactionCategory.UTILITY;
  }
  if (
    lower.includes("salary") ||
    lower.includes("salario") ||
    lower.includes("pagamento") ||
    lower.includes("rendimento")
  ) {
    return TransactionCategory.SALARY;
  }
  if (
    lower.includes("education") ||
    lower.includes("educacao") ||
    lower.includes("escola") ||
    lower.includes("curso") ||
    lower.includes("faculdade")
  ) {
    return TransactionCategory.EDUCATION;
  }
  if (
    lower.includes("entertainment") ||
    lower.includes("lazer") ||
    lower.includes("cinema") ||
    lower.includes("viagem") ||
    lower.includes("streaming")
  ) {
    return TransactionCategory.ENTERTAINMENT;
  }

  return TransactionCategory.OTHER;
}

function mapPaymentMethod(
  paymentType?: string | null,
): TransactionPaymentMethod {
  if (!paymentType) return TransactionPaymentMethod.OTHER;
  const lower = paymentType.toLowerCase();

  if (lower.includes("pix")) return TransactionPaymentMethod.PIX;
  if (lower.includes("credit") || lower.includes("cartao de credito"))
    return TransactionPaymentMethod.CREDIT_CARD;
  if (lower.includes("debit") || lower.includes("cartao de debito"))
    return TransactionPaymentMethod.DEBIT_CARD;
  if (
    lower.includes("transfer") ||
    lower.includes("ted") ||
    lower.includes("doc")
  )
    return TransactionPaymentMethod.BANK_TRANSFER;
  if (lower.includes("boleto") || lower.includes("slip"))
    return TransactionPaymentMethod.BANK_SLIP;

  return TransactionPaymentMethod.OTHER;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { itemId } = body;

    const connections = await db.bankConnection.findMany({
      where: {
        userId,
        ...(itemId ? { itemId } : {}),
      },
    });

    if (itemId && connections.length === 0) {
      const pluggyItem = await pluggyClient.fetchItem(itemId);
      const newConn = await db.bankConnection.create({
        data: {
          itemId: pluggyItem.id,
          connectorName: pluggyItem.connector?.name || "Banco Desconhecido",
          connectorLogo: pluggyItem.connector?.imageUrl || null,
          status: pluggyItem.status || "UPDATED",
          userId,
        },
      });
      connections.push(newConn);
    }

    let totalImported = 0;

    for (const conn of connections) {
      const pluggyItem = await pluggyClient.fetchItem(conn.itemId);
      const accounts = await pluggyClient.fetchAccounts(conn.itemId);

      for (const account of accounts.results) {
        const transactionsResponse = await pluggyClient.fetchTransactions(
          account.id,
          {
            pageSize: 500,
          },
        );

        for (const tx of transactionsResponse.results) {
          const rawAmount = tx.amount;
          const absAmount = Math.abs(rawAmount);

          const txType: TransactionType =
            rawAmount >= 0 ? TransactionType.DEPOSIT : TransactionType.EXPENSE;

          const category = mapPluggyCategory(tx.category);
          const paymentMethod = mapPaymentMethod(tx.paymentData?.paymentMethod);
          const txName =
            tx.description || tx.merchant?.name || "Transação Open Finance";
          const txDate = new Date(tx.date);

          await db.transaction.upsert({
            where: { externalId: tx.id },
            update: {
              name: txName,
              amount: absAmount,
              type: txType,
              category,
              paymentMethod,
              date: txDate,
              userId,
              bankConnectionId: conn.id,
            },
            create: {
              externalId: tx.id,
              name: txName,
              amount: absAmount,
              type: txType,
              category,
              paymentMethod,
              date: txDate,
              userId,
              bankConnectionId: conn.id,
            },
          });

          totalImported++;
        }
      }

      await db.bankConnection.update({
        where: { id: conn.id },
        data: {
          status: pluggyItem.status || "UPDATED",
          lastSyncedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      connectionsCount: connections.length,
      totalImported,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao sincronizar dados do Open Finance";
    console.error("Erro na sincronização Open Finance:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
