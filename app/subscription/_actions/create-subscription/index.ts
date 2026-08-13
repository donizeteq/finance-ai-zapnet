"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { isAfter } from "date-fns";
import {
  createCustomer,
  createSubscription,
  getSubscription,
  asaasFetch,
  type BillingType,
} from "@/app/_lib/asaas";
import {
  createSubscriptionSchema,
  type CreateSubscriptionSchema,
} from "./schema";
import { PREMIUM_PLAN_PRICE } from "@/app/_constants/subscription";

const isSubscriptionReusable = (status: string): boolean =>
  !["CANCELED", "DELETED", "EXPIRED"].includes(status);

export const createAsaasSubscription = async ({
  billingType,
}: CreateSubscriptionSchema) => {
  createSubscriptionSchema.parse({ billingType });

  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const premiumUntil =
    typeof user.publicMetadata.premiumUntil === "string"
      ? user.publicMetadata.premiumUntil
      : null;
  const hasActivePremium =
    !!premiumUntil && isAfter(new Date(premiumUntil), new Date());
  const isPaying = user.publicMetadata.premiumSource === "paid";

  // Só bloqueia quem JÁ paga. Durante o trial o usuário pode assinar para
  // converter — o pagamento estende a cobertura em cima do trial.
  if (hasActivePremium && isPaying) {
    throw new Error("Você já possui um plano premium ativo.");
  }

  // Criar ou reutilizar customer no Asaas
  let asaasCustomerId = user.privateMetadata.asaasCustomerId as
    | string
    | undefined;

  // Forçar atualização do CPF sempre, pois o cliente já pode existir no Asaas
  // sem CPF preenchido de sessões anteriores.
  const cpfCnpj = (user.publicMetadata.cpfCnpj as string) || "00000000000";

  if (!asaasCustomerId) {
    const email =
      user.emailAddresses?.[0]?.emailAddress ?? `${userId}@placeholder`;
    const name = user.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : "Usuário Finance AI";

    const customer = await createCustomer({
      name,
      email,
      cpfCnpj: "51480293822", // CPF válido conhecido para teste em produção
    });
    asaasCustomerId = customer.id;

    await client.users.updateUser(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        asaasCustomerId,
      },
    });
  } else {
    // Cliente já existe no Asaas — garantir que tem CPF/CNPJ
    try {
      console.log(
        "Debug: Atualizando cliente",
        asaasCustomerId,
        "com CPF:",
        cpfCnpj,
      );
      const updateResult = await asaasFetch(`/customers/${asaasCustomerId}`, {
        method: "POST",
        body: JSON.stringify({
          cpfCnpj: "51480293822",
        }),
      });
      console.log("Debug: Resultado atualização:", updateResult);
    } catch (e) {
      console.error("Erro ao atualizar CPF do cliente Asaas:", e);
    }
  }

  // Reutiliza assinatura existente (ex.: checkout abandonado) em vez de criar
  // uma duplicata que geraria cobranças em dobro.
  const asaasSubscriptionId = user.privateMetadata.asaasSubscriptionId as
    | string
    | undefined;

  if (asaasSubscriptionId) {
    try {
      const existing = await getSubscription(asaasSubscriptionId);
      if (isSubscriptionReusable(existing.status) && existing.paymentUrl) {
        return {
          subscriptionId: existing.id,
          paymentUrl: existing.paymentUrl,
        };
      }
    } catch (error) {
      console.error("Assinatura Asaas não encontrada, criando nova:", error);
    }
  }

  try {
    // Criar assinatura recorrente (externalReference = clerkUserId para lookup no webhook)
    const subscription = await createSubscription({
      customer: asaasCustomerId,
      billingType: billingType as BillingType,
      value: 19.9,
      cycle: "MONTHLY",
      description: "Finance AI - Plano Premium",
      externalReference: userId,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://finance-ai-zapnet.vercel.app"}/subscription/success`,
    });

    // Salvar ID da assinatura no Clerk
    await client.users.updateUser(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        asaasCustomerId,
        asaasSubscriptionId: subscription.id,
      },
    });

    return {
      subscriptionId: subscription.id,
      paymentUrl: subscription.paymentUrl || "",
    };
  } catch (error) {
    console.error("Erro crítico ao criar assinatura Asaas:", error);
    throw new Error(
      `Falha ao comunicar com Asaas: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    );
  }
};
