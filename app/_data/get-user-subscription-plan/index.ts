import { clerkClient } from "@clerk/nextjs/server";
import { resolveUserSubscription } from "./subscription-policy";

export type SubscriptionPlan = "free" | "premium";

/**
 * Resolve o plano do usuário.
 *
 * - `premiumUntil` (data ISO no publicMetadata) é a fonte da verdade.
 * - Usuário novo recebe trial de premium automaticamente (lazy).
 * - Usuários legados (flag antiga "premium" sem premiumUntil) recebem
 *   tolerância e continuam premium.
 * - Cobertura expirada cai para free automaticamente — sem depender de
 *   evento de webhook (corrige o vazamento de receita de quem pagava uma
 *   vez e nunca mais).
 */
export const getUserSubscriptionPlan = async (
  userId: string,
): Promise<SubscriptionPlan> => {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metadata = user.publicMetadata;

  const premiumUntil =
    typeof metadata.premiumUntil === "string" ? metadata.premiumUntil : null;
  const subscriptionPlan: "premium" | null =
    metadata.subscriptionPlan === "premium" ? "premium" : null;
  const premiumSource: "trial" | "paid" | null =
    metadata.premiumSource === "trial" || metadata.premiumSource === "paid"
      ? metadata.premiumSource
      : null;

  const { resolution, mutation } = resolveUserSubscription(
    { premiumUntil, subscriptionPlan, premiumSource },
    new Date(),
  );

  // Persiste a mutação (se houver) usando spread para preservar demais chaves.
  if (mutation.type !== "none") {
    const nextMetadata = { ...metadata };

    if (mutation.type === "grant-trial") {
      nextMetadata.premiumUntil = mutation.premiumUntil.toISOString();
      nextMetadata.subscriptionPlan = "premium";
      nextMetadata.premiumSource = "trial";
    } else if (mutation.type === "migrate-legacy") {
      nextMetadata.premiumUntil = mutation.premiumUntil.toISOString();
      nextMetadata.premiumSource = "paid";
    } else if (mutation.type === "clear-expired") {
      nextMetadata.premiumUntil = null;
      nextMetadata.subscriptionPlan = null;
    }

    await client.users.updateUser(userId, {
      publicMetadata: nextMetadata,
    });
  }

  return resolution.plan;
};
