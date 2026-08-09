import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSubscription, validateWebhookToken } from "@/app/_lib/asaas";
import { extendPremiumCoverage } from "@/app/_data/get-user-subscription-plan/subscription-policy";

// Rate limiting simples em memória (em produção, use Redis)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests por minuto

interface AsaasWebhookPayload {
  event?: string;
  payment?: {
    id?: string;
    subscription?: string;
    customer?: string;
    externalReference?: string;
  };
  subscription?: {
    id?: string;
    customer?: string;
    externalReference?: string;
  };
}

const isClerkUserId = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("user_");

// Resolve o clerkUserId a partir do payload (externalReference) ou via API.
// A validação estrita de prefixo "user_" impede que uma referência forjada
// ative/revogue o plano de outro usuário (o webhook exige token válido, mas a
// defesa em profundidade aqui é barata).
const resolveClerkUserId = async (
  payload: AsaasWebhookPayload,
): Promise<string | null> => {
  // 1. Tenta direto no payload
  const ref =
    payload.payment?.externalReference ||
    payload.subscription?.externalReference;
  if (isClerkUserId(ref)) {
    return ref;
  }

  // 2. Busca a assinatura na API (funciona para PAYMENT_RECEIVED, assinatura ativa)
  const subscriptionId =
    payload.payment?.subscription || payload.subscription?.id;
  if (!subscriptionId) return null;

  try {
    const subscription = await getSubscription(subscriptionId);
    if (isClerkUserId(subscription.externalReference)) {
      return subscription.externalReference;
    }
  } catch (error) {
    console.error("Erro ao buscar assinatura no Asaas:", error);
  }

  return null;
};

// Pagamento recebido → estende a cobertura premium em ~1 mês a partir de agora
// (ou do fim da cobertura atual, se já estiver coberto — ex.: renovação em dia
// ou trial em andamento). `premiumSource` vira "paid".
const setPremiumActive = async (clerkUserId: string) => {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);
  const currentPremiumUntil =
    typeof user.publicMetadata.premiumUntil === "string"
      ? user.publicMetadata.premiumUntil
      : null;
  const nextPremiumUntil = extendPremiumCoverage(
    currentPremiumUntil,
    new Date(),
  ).toISOString();

  await client.users.updateUser(clerkUserId, {
    publicMetadata: {
      ...user.publicMetadata,
      premiumUntil: nextPremiumUntil,
      subscriptionPlan: "premium",
      premiumSource: "paid",
    },
  });
};

// Falha/cancelamento → revoga a cobertura. `premiumSource` é MANTIDO para que
// quem já teve premium não ganhe um novo trial (a política só concede trial a
// quem nunca teve cobertura).
const setPremiumInactive = async (clerkUserId: string) => {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);

  await client.users.updateUser(clerkUserId, {
    publicMetadata: {
      ...user.publicMetadata,
      premiumUntil: null,
      subscriptionPlan: null,
    },
  });
};

export const POST = async (request: Request) => {
  try {
    // Rate limiting básico
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const now = Date.now();
    const clientData = rateLimitMap.get(clientIP);

    if (clientData) {
      if (now - clientData.lastReset > RATE_LIMIT_WINDOW) {
        clientData.count = 1;
        clientData.lastReset = now;
      } else {
        clientData.count++;
        if (clientData.count > RATE_LIMIT_MAX_REQUESTS) {
          return new NextResponse("Too many requests", { status: 429 });
        }
      }
    } else {
      rateLimitMap.set(clientIP, { count: 1, lastReset: now });
    }

    // Validação do token de webhook do Asaas
    if (!validateWebhookToken(request)) {
      console.error("Asaas webhook token inválido");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verificação de content-type
    const contentType = request.headers.get("content-type");
    if (contentType !== "application/json") {
      return new NextResponse("Invalid content type", { status: 400 });
    }

    const text = await request.text();
    if (!text || text.length === 0) {
      return new NextResponse("Empty payload", { status: 400 });
    }
    if (text.length > 1024 * 1024) {
      return new NextResponse("Payload too large", { status: 413 });
    }

    const payload: AsaasWebhookPayload = JSON.parse(text);
    const event = payload.event;

    switch (event) {
      // Pagamento recebido → estende cobertura premium
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED": {
        const clerkUserId = await resolveClerkUserId(payload);
        if (!clerkUserId) {
          console.error("Não foi possível identificar o usuário no webhook");
          return new NextResponse("Invalid user data", { status: 400 });
        }

        await setPremiumActive(clerkUserId);
        console.log(`Usuário ${clerkUserId} com cobertura premium estendida`);
        break;
      }

      // Falha definitiva / cancelamento → revoga a cobertura (sem novo trial)
      case "PAYMENT_DELETED":
      case "PAYMENT_REFUNDED":
      case "SUBSCRIPTION_DELETED": {
        const clerkUserId = await resolveClerkUserId(payload);
        if (!clerkUserId) {
          console.error("Não foi possível identificar o usuário no webhook");
          return new NextResponse("Invalid user data", { status: 400 });
        }

        await setPremiumInactive(clerkUserId);
        console.log(`Usuário ${clerkUserId} voltou para plano free`);
        break;
      }

      // Atraso de pagamento: NÃO corta imediatamente (evita churn de quem paga
      // dias depois). A cobertura expira naturalmente via `premiumUntil`.
      case "PAYMENT_OVERDUE":
        console.log("Pagamento em atraso — cobertura expira naturalmente");
        break;

      default:
        console.log(`Evento Asaas não tratado: ${event}`);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro inesperado no webhook do Asaas:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
};
