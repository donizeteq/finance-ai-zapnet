import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { getMonthRange } from "@/app/_utils/month-range";
import { getUserSubscriptionPlan } from "@/app/_data/get-user-subscription-plan";

export const maxDuration = 60; // Aumenta para 60s

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

  const content = `Gere um relatório curto (máximo 300 palavras) com insights sobre as minhas finanças, com dicas de como melhorar. Transações: ${transactions
    .map(
      (t) =>
        `${t.date.toLocaleDateString("pt-BR")}-R$${t.amount}-${t.type}-${t.category}`,
    )
    .join(";")}`;

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY || "omnirouter-proxy"}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "auto/best-fast",
      stream: false,
      messages: [
        {
          role: "system",
          content: "Você é um especialista em finanças pessoais.",
        },
        { role: "user", content },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API IA Error:", errorText);
    return new NextResponse("Erro na API de IA", { status: 500 });
  }

  const text = await response.text();

  // Tratamento robusto: se for stream, parseia as linhas 'data:'
  if (text.startsWith("data:")) {
    let fullContent = "";
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ") && line !== "data: [DONE]") {
        try {
          const json = JSON.parse(line.substring(6));
          const content =
            json.choices[0].delta?.content || json.choices[0].message?.content;
          if (content) fullContent += content;
        } catch (e) {}
      }
    }
    return NextResponse.json({ report: fullContent });
  }

  // Se não for stream, tenta tratar como JSON direto
  try {
    const data = JSON.parse(text);
    return NextResponse.json({ report: data.choices[0].message.content });
  } catch (e) {
    return NextResponse.json({ report: text });
  }
}
