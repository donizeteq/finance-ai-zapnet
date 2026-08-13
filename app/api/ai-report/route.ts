import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { getMonthRange } from "@/app/_utils/month-range";
import { getUserSubscriptionPlan } from "@/app/_data/get-user-subscription-plan";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const subscriptionPlan = await getUserSubscriptionPlan(userId);
  if (subscriptionPlan !== "premium") {
    return new NextResponse("Premium plan required", { status: 403 });
  }

  const { month, year } = await req.json();
  const baseURL =
    process.env.OPENAI_BASE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://omniroute.talkyngo.com.br/v1"
      : "http://localhost:20128/v1");

  const { start, end } = getMonthRange(Number(year), Number(month));
  const transactions = await db.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
  });

  const txData = JSON.stringify(
    transactions.map((t) => ({
      data: t.date.toLocaleDateString("pt-BR"),
      valor: `R$ ${t.amount}`,
      tipo:
        (t.type as string) === "INCOME" || (t.type as string) === "DEPOSIT"
          ? "Receita"
          : "Despesa",
      categoria: t.category,
      metodo: t.paymentMethod,
    })),
  );

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY || "omnirouter-proxy"}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "auto/best-fast",
      stream: false,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content:
            "Você é um consultor financeiro. Gere relatórios curtos e objetivos.",
        },
        {
          role: "user",
          content: `Gere um relatório curto (máx 300 palavras) com insights sobre minhas finanças. Transações: ${txData}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API IA Error:", errorText);
    return new NextResponse("Erro na API de IA", { status: 500 });
  }

  const text = await response.text();

  // Tenta parsear JSON direto primeiro
  try {
    const json = JSON.parse(text);
    if (json.choices && json.choices[0] && json.choices[0].message) {
      return NextResponse.json({ report: json.choices[0].message.content });
    }
  } catch (e) {
    // Se não for JSON, continua para tentar parsear como stream
  }

  // Se for stream (data: ...), parseia linha por linha
  if (text.includes("data:")) {
    let fullContent = "";
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ") && !line.includes("[DONE]")) {
        try {
          const json = JSON.parse(line.substring(6));
          const c =
            json.choices?.[0]?.delta?.content ||
            json.choices?.[0]?.message?.content;
          if (c) fullContent += c;
        } catch {}
      }
    }
    if (fullContent) {
      return NextResponse.json({ report: fullContent });
    }
  }

  return NextResponse.json({ report: text || "Resposta vazia da IA" });
}
