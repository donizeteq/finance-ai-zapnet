import { addDays, isAfter } from "date-fns";
import {
  PREMIUM_PLAN_LEGACY_GRACE_DAYS,
  PREMIUM_PLAN_PAYMENT_COVERAGE_DAYS,
  PREMIUM_PLAN_TRIAL_DAYS,
} from "@/app/_constants/subscription";

export type SubscriptionSource = "trial" | "paid" | null;

export interface SubscriptionUserState {
  /** Data ISO da expiração da cobertura premium (fonte da verdade). */
  premiumUntil: string | null;
  /** Flag denormalizada para exibição no cliente. */
  subscriptionPlan: "premium" | null;
  /** Origem da cobertura: trial, pagamento pago ou nenhuma. */
  premiumSource: SubscriptionSource;
}

export type PlanResolution =
  | { plan: "premium"; reason: "active" | "trial-grant" | "legacy-migration" }
  | { plan: "free"; reason: "expired" | "none" };

export type SubscriptionMutation =
  | { type: "grant-trial"; premiumUntil: Date }
  | { type: "migrate-legacy"; premiumUntil: Date }
  | { type: "clear-expired" }
  | { type: "none" };

const parseDate = (value: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Resolve o plano de um usuário a partir do estado persistido.
 *
 * Pura e determinística: dado o mesmo estado + instante, devolve o mesmo
 * resultado. As mutações necessárias (conceder trial, migrar legado, limpar
 * flag expirada) são retornadas para o chamador persistir — nunca executadas
 * aqui, o que mantém a lógica testável.
 */
export const resolveUserSubscription = (
  state: SubscriptionUserState,
  now: Date,
): { resolution: PlanResolution; mutation: SubscriptionMutation } => {
  const premiumUntil = parseDate(state.premiumUntil);

  // Cobertura ativa (paga ou em trial)
  if (premiumUntil && isAfter(premiumUntil, now)) {
    return {
      resolution: { plan: "premium", reason: "active" },
      mutation: { type: "none" },
    };
  }

  // Usuários que pagaram antes da migração (flag antiga sem premiumUntil):
  // recebem uma tolerância para que não sejam cortados enquanto a assinatura
  // Asaas renova normalmente.
  if (!state.premiumUntil && state.subscriptionPlan === "premium") {
    return {
      resolution: { plan: "premium", reason: "legacy-migration" },
      mutation: {
        type: "migrate-legacy",
        premiumUntil: addDays(now, PREMIUM_PLAN_LEGACY_GRACE_DAYS),
      },
    };
  }

  // Usuário novo (nunca teve cobertura): concede trial de premium.
  if (!state.premiumUntil && !state.premiumSource) {
    return {
      resolution: { plan: "premium", reason: "trial-grant" },
      mutation: {
        type: "grant-trial",
        premiumUntil: addDays(now, PREMIUM_PLAN_TRIAL_DAYS),
      },
    };
  }

  // Cobertura expirada → limpa a flag denormalizada (premiumSource é mantido
  // para que quem já teve premium não ganhe um novo trial).
  if (state.subscriptionPlan === "premium") {
    return {
      resolution: { plan: "free", reason: "expired" },
      mutation: { type: "clear-expired" },
    };
  }

  return {
    resolution: { plan: "free", reason: "none" },
    mutation: { type: "none" },
  };
};

/**
 * Estende a cobertura premium a partir de um pagamento recebido.
 *
 * Se a cobertura atual já vale no futuro (ex.: renovações em dia, ou trial em
 * andamento), a nova cobertura é empilhada em cima dela — o usuário não perde
 * tempo já pago. Caso contrário, parte de agora.
 */
export const extendPremiumCoverage = (
  currentPremiumUntil: string | null,
  now: Date,
  days: number = PREMIUM_PLAN_PAYMENT_COVERAGE_DAYS,
): Date => {
  const current = parseDate(currentPremiumUntil);
  const base = current && isAfter(current, now) ? current : now;
  return addDays(base, days);
};
