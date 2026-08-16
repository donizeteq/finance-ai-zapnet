import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";

export const maxDuration = 60;

// GET /api/auditoria/export?formato=csv|ofx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const formato = searchParams.get("formato") || "csv";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    userId,
    tipo_transacao: "EMPRESA",
  };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate + "T23:59:59");
  }

  const transactions = await db.transaction.findMany({
    where,
    orderBy: { date: "asc" },
  });

  if (formato === "ofx") {
    const ofx = gerarOFX(transactions);
    return new NextResponse(ofx, {
      headers: {
        "Content-Type": "application/ofx",
        "Content-Disposition": `attachment; filename="auditoria_${Date.now()}.ofx"`,
      },
    });
  }

  // CSV (default)
  const csv = gerarCSV(transactions);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="auditoria_${Date.now()}.csv"`,
    },
  });
}

function gerarCSV(transactions: Record<string, unknown>[]): string {
  const header = "data,nome,tipo,valor,categoria,metodo_pagamento,eh_dedutivel";
  const rows = transactions.map((t) => {
    const data = new Date(t.date as string).toLocaleDateString("pt-BR");
    const nome = `"${String(t.name).replace(/"/g, '""')}"`;
    const tipo = t.type;
    const valor = Number(t.amount).toFixed(2).replace(".", ",");
    const categoria = t.category;
    const metodo = t.paymentMethod;
    const dedutivel = t.eh_dedutivel ? "SIM" : "NAO";
    return [data, nome, tipo, valor, categoria, metodo, dedutivel].join(",");
  });
  return [header, ...rows].join("\n");
}

function gerarOFX(transactions: Record<string, unknown>[]): string {
  const now = formattingDate(new Date());
  const body = transactions
    .map((t) => {
      const date = formattingDate(new Date(t.date as string));
      const amount = Number(t.amount);
      const type = amount >= 0 ? "CREDIT" : "DEBIT";
      return `<STMTTRN>
<TRNTYPE>${type}
<DTPOSTED>${date}
<TRNAMT>${Math.abs(amount).toFixed(2)}
<FITID>${t.id}
<NAME>${String(t.name).slice(0, 32)}
<MEMO>${t.category} | ${t.eh_dedutivel ? "Dedutivel" : "Nao dedutivel"}
</STMTTRN>`;
    })
    .join("\n");

  return `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>0000
<ACCTID>0000000
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>${now}
<DTEND>${now}
${body}
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>`;
}

function formattingDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}
