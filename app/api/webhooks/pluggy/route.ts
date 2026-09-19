import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { pluggyClient } from "@/app/_lib/pluggy";
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

async function syncPluggyItem(itemId: string) {
  try {
    const conn = await db.bankConnection.findUnique({
      where: { itemId },
    });

    if (!conn) {
      console.log(
        `[Pluggy Webhook] Conexão bancária não encontrada localmente para o itemId: ${itemId}`,
      );
      return;
    }

    const pluggyItem = await pluggyClient.fetchItem(itemId);
    const accounts = await pluggyClient.fetchAccounts(itemId);

    let totalImported = 0;
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
            userId: conn.userId,
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
            userId: conn.userId,
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

    console.log(
      `[Pluggy Webhook] Item ${itemId} sincronizado com sucesso (${totalImported} transações).`,
    );
  } catch (err) {
    console.error(`[Pluggy Webhook] Erro ao sincronizar item ${itemId}:`, err);
  }
}

async function handleItemCreated(itemId: string) {
  console.log(
    `[Pluggy Webhook] Evento item/created recebido para itemId: ${itemId}`,
  );
  await syncPluggyItem(itemId);
}

async function handleItemUpdated(itemId: string) {
  console.log(
    `[Pluggy Webhook] Evento item/updated recebido para itemId: ${itemId}`,
  );
  await syncPluggyItem(itemId);
}

async function handleItemError(itemId: string, error?: unknown) {
  console.error(
    `[Pluggy Webhook] Evento item/error recebido para itemId ${itemId}:`,
    error,
  );
  try {
    await db.bankConnection.updateMany({
      where: { itemId },
      data: {
        status: "OUTDATED",
      },
    });
  } catch (err) {
    console.error(
      `[Pluggy Webhook] Erro ao atualizar status de erro para itemId ${itemId}:`,
      err,
    );
  }
}

export async function POST(req: Request) {
  try {
    const event = await req.json();

    console.log("Received webhook:", event.event);
    console.log("Event ID:", event.eventId);

    // Process work asynchronously to return 2XX within 5 seconds
    (async () => {
      switch (event.event) {
        case "item/created":
          await handleItemCreated(event.itemId);
          break;
        case "item/updated":
          await handleItemUpdated(event.itemId);
          break;
        case "item/error":
          await handleItemError(event.itemId, event.error);
          break;
        default:
          console.log(`[Pluggy Webhook] Evento não tratado: ${event.event}`);
      }
    })().catch((err) =>
      console.error("[Pluggy Webhook] Background error:", err),
    );

    // IMPORTANT: Return 2XX within 5 seconds
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Pluggy Webhook] Parsing error:", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
