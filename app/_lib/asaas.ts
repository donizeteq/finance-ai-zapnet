import { timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function getConfig() {
  const url = process.env.ASAAS_API_URL || "https://api.asaas.com/v3";
  let key = process.env.ASAAS_API_KEY || "";

  // Fallback: ler de arquivo externo se a env var estiver vazia
  // (necessário porque o $ no início da chave do Asaas é interpretado
  // como expansão de variável pelo parser de .env do Next.js)
  if (!key) {
    try {
      const keyPath = path.join(process.cwd(), ".asaas-key");
      const keyFile = fs.readFileSync(keyPath, "utf8").trim();
      if (keyFile) key = keyFile;
    } catch {}
  }

  if (!key) {
    throw new Error(
      "ASAAS_API_KEY não está configurada. Adicione ao .env ou crie .asaas-key",
    );
  }
  return { url, key };
}

export async function asaasFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const { url, key } = getConfig();
  const response = await fetch(`${url}${endpoint}`, {
    ...options,
    headers: {
      access_token: key,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Asaas API error: ${response.status} - ${JSON.stringify(error)}`,
    );
  }

  return response.json();
}

// --- Customer ---

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  dateCreated: string;
}

export interface CreateCustomerParams {
  name: string;
  email: string;
  cpfCnpj: string;
}

export async function createCustomer(
  params: CreateCustomerParams,
): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// --- Subscription ---

export type BillingType = "PIX" | "CREDIT_CARD" | "BOLETO";

export interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: BillingType;
  value: number;
  cycle: string;
  description: string;
  status: string;
  nextDueDate: string;
  dateCreated: string;
  paymentUrl?: string;
}

export interface CreateSubscriptionParams {
  customer: string;
  billingType: BillingType;
  value: number;
  cycle: "MONTHLY" | "YEARLY";
  description: string;
  /** Referência externa para vincular a assinatura ao usuário (ex: clerkUserId) */
  externalReference?: string;
  /** URL para redirecionar o cliente após pagar */
  redirectUrl?: string;
}

export interface AsaasSubscriptionDetail extends AsaasSubscription {
  externalReference?: string;
}

export async function createSubscription(
  params: CreateSubscriptionParams,
): Promise<AsaasSubscription> {
  const subscription = await asaasFetch<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(params),
  });

  // O Asaas não retorna paymentUrl na criação da assinatura.
  // Buscar a primeira cobrança da assinatura para obter a URL de pagamento.
  try {
    const payments = await asaasFetch<{
      object: string;
      data: Array<{ id: string; invoiceUrl: string }>;
    }>(`/payments?subscription=${subscription.id}&limit=1`);

    if (payments.data && payments.data.length > 0) {
      subscription.paymentUrl = payments.data[0].invoiceUrl;
    }
  } catch (e) {
    console.error("Erro ao buscar cobrança da assinatura:", e);
  }

  return subscription;
}

export async function getSubscription(
  subscriptionId: string,
): Promise<AsaasSubscriptionDetail> {
  const subscription = await asaasFetch<AsaasSubscriptionDetail>(
    `/subscriptions/${subscriptionId}`,
  );

  // Buscar URL de pagamento da primeira cobrança ativa
  try {
    const payments = await asaasFetch<{
      object: string;
      data: Array<{ id: string; invoiceUrl: string; status: string }>;
    }>(`/payments?subscription=${subscriptionId}&limit=1`);

    if (payments.data && payments.data.length > 0) {
      subscription.paymentUrl = payments.data[0].invoiceUrl;
    }
  } catch (e) {
    console.error("Erro ao buscar cobrança da assinatura:", e);
  }

  return subscription;
}

export async function cancelSubscription(
  subscriptionId: string,
): Promise<void> {
  await asaasFetch(`/subscriptions/${subscriptionId}`, {
    method: "DELETE",
  });
}

// --- Webhook ---

export function validateWebhookToken(request: Request): boolean {
  const token = request.headers.get("access_token");
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expectedToken || !token) return false;

  // Comparação em tempo constante para evitar side-channel de timing.
  const a = Buffer.from(token);
  const b = Buffer.from(expectedToken);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
