import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { TransactionType } from "@prisma/client";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {
    userId,
    tipo_transacao: "EMPRESA",
  };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate + "T23:59:59");
  }

  const [depositsResult, expensesResult] = await Promise.all([
    db.transaction.aggregate({
      where: { ...where, type: TransactionType.DEPOSIT },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { ...where, type: TransactionType.EXPENSE },
      _sum: { amount: true },
    }),
  ]);

  const faturamento = Number(depositsResult._sum?.amount ?? 0);
  const despesas = Number(expensesResult._sum?.amount ?? 0);
  const lucroLiquido = faturamento - despesas;

  return NextResponse.json({
    faturamento,
    despesas,
    lucroLiquido,
  });
}
