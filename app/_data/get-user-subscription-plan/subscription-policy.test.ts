import { describe, expect, it } from "vitest";
import {
  extendPremiumCoverage,
  resolveUserSubscription,
  type SubscriptionUserState,
} from "./subscription-policy";

const NOW = new Date(2026, 7, 3); // 03/08/2026 00:00 local

const empty = (): SubscriptionUserState => ({
  premiumUntil: null,
  subscriptionPlan: null,
  premiumSource: null,
});

describe("resolveUserSubscription", () => {
  it("concede trial de 14 dias a usuário novo", () => {
    const { resolution, mutation } = resolveUserSubscription(empty(), NOW);

    expect(resolution).toEqual({ plan: "premium", reason: "trial-grant" });
    expect(mutation).toEqual({ type: "grant-trial", premiumUntil: new Date(2026, 7, 17) });
  });

  it("mantém premium ativo sem mutação quando a cobertura vale no futuro", () => {
    const state = {
      premiumUntil: new Date(2026, 8, 1).toISOString(),
      subscriptionPlan: "premium" as const,
      premiumSource: "paid" as const,
    };

    const { resolution, mutation } = resolveUserSubscription(state, NOW);

    expect(resolution).toEqual({ plan: "premium", reason: "active" });
    expect(mutation).toEqual({ type: "none" });
  });

  it("migra usuário legado (flag antiga sem premiumUntil) com tolerância de 30 dias", () => {
    const state = {
      premiumUntil: null,
      subscriptionPlan: "premium" as const,
      premiumSource: null,
    };

    const { resolution, mutation } = resolveUserSubscription(state, NOW);

    expect(resolution).toEqual({ plan: "premium", reason: "legacy-migration" });
    expect(mutation).toEqual({ type: "migrate-legacy", premiumUntil: new Date(2026, 8, 2) });
  });

  it("não concede novo trial a quem já teve cobertura paga (revogado ou expirado)", () => {
    const revoked = {
      premiumUntil: null,
      subscriptionPlan: null,
      premiumSource: "paid" as const,
    };
    const expiredTrial = {
      premiumUntil: new Date(2026, 7, 1).toISOString(), // expirado
      subscriptionPlan: "premium" as const,
      premiumSource: "trial" as const,
    };

    const revokedResult = resolveUserSubscription(revoked, NOW);
    const expiredResult = resolveUserSubscription(expiredTrial, NOW);

    expect(revokedResult.resolution).toEqual({ plan: "free", reason: "none" });
    expect(revokedResult.mutation).toEqual({ type: "none" });

    expect(expiredResult.resolution).toEqual({ plan: "free", reason: "expired" });
    expect(expiredResult.mutation).toEqual({ type: "clear-expired" });
  });

  it("cai para free e limpa a flag quando a cobertura expira", () => {
    const state = {
      premiumUntil: new Date(2026, 7, 1).toISOString(),
      subscriptionPlan: "premium" as const,
      premiumSource: "paid" as const,
    };

    const { resolution, mutation } = resolveUserSubscription(state, NOW);

    expect(resolution).toEqual({ plan: "free", reason: "expired" });
    expect(mutation).toEqual({ type: "clear-expired" });
  });

  it("trata premiumUntil inválido como sem cobertura, sem conceder trial (conservador)", () => {
    // "premiumUntil" presente mas inválido é um estado ambíguo de integridade:
    // alguém escreveu o campo, então não é um usuário novo — não damos trial.
    const state = { ...empty(), premiumUntil: "data-invalida" };

    const { resolution, mutation } = resolveUserSubscription(state, NOW);

    expect(resolution).toEqual({ plan: "free", reason: "none" });
    expect(mutation).toEqual({ type: "none" });
  });
});

describe("extendPremiumCoverage", () => {
  it("sem cobertura atual, parte de agora", () => {
    expect(extendPremiumCoverage(null, NOW)).toEqual(new Date(2026, 8, 2));
  });

  it("com cobertura futura, empilha em cima (não perde tempo pago)", () => {
    const current = new Date(2026, 8, 10).toISOString();
    expect(extendPremiumCoverage(current, NOW)).toEqual(new Date(2026, 9, 10));
  });

  it("com cobertura expirada, parte de agora", () => {
    const current = new Date(2026, 7, 1).toISOString();
    expect(extendPremiumCoverage(current, NOW)).toEqual(new Date(2026, 8, 2));
  });

  it("respeita o número de dias passado (renovação mensal = 30 dias)", () => {
    expect(extendPremiumCoverage(null, NOW, 30)).toEqual(new Date(2026, 8, 2));
  });
});
