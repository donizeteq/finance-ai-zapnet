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

  const content = `Gere um relatório com insights sobre as minhas finanças... ${transactions
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
      model: process.env.OPENAI_MODEL || "auto/best-chat",
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
    return new NextResponse("Erro na API de IA", { status: 500 });
  }

  const data = await response.json();
  return NextResponse.json({ report: data.choices[0].message.content });
}
