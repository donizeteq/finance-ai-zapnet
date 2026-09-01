import { db } from "@/app/_lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

export interface UserMetric {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  isPremium: boolean;
  premiumUntil: string | null;
  transactionCount: number;
  totalVolume: number;
}

export interface AdminMetrics {
  totalUsers: number;
  premiumUsersCount: number;
  freeUsersCount: number;
  mrr: number;
  totalTransactionsCount: number;
  totalTransactionVolume: number;
  conversionRate: number;
  users: UserMetric[];
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const client = await clerkClient();

  // 1. Buscar lista de usuários no Clerk (até 100)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let clerkUsers: any[] = [];
  try {
    const res = await client.users.getUserList({ limit: 100 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clerkUsers = Array.isArray(res) ? res : (res as any).data || [];
  } catch (err) {
    console.error("Erro ao buscar usuários no Clerk:", err);
  }

  // 2. Agrupar transações no Prisma por userId
  const txGroup = await db.transaction.groupBy({
    by: ["userId"],
    _count: { id: true },
    _sum: { amount: true },
  });

  const txUserMap = new Map<string, { count: number; sum: number }>();
  let totalTransactionVolume = 0;
  let totalTransactionsCount = 0;

  for (const g of txGroup) {
    const count = g._count.id || 0;
    const sum = Number(g._sum.amount || 0);
    txUserMap.set(g.userId, { count, sum });
    totalTransactionsCount += count;
    totalTransactionVolume += sum;
  }

  // 3. Montar métricas por usuário
  let premiumUsersCount = 0;

  const users: UserMetric[] = clerkUsers.map((u) => {
    const email = u.emailAddresses?.[0]?.emailAddress || "Sem e-mail";
    const firstName = u.firstName || "";
    const lastName = u.lastName || "";
    const name =
      `${firstName} ${lastName}`.trim() || email.split("@")[0] || "Usuário";
    const createdAt = new Date(u.createdAt);

    const isPremium = u.publicMetadata?.subscriptionPlan === "premium";
    if (isPremium) premiumUsersCount++;

    const premiumUntil =
      typeof u.publicMetadata?.premiumUntil === "string"
        ? u.publicMetadata.premiumUntil
        : null;
    const stats = txUserMap.get(u.id) || { count: 0, sum: 0 };

    return {
      id: u.id,
      name,
      email,
      createdAt,
      isPremium,
      premiumUntil,
      transactionCount: stats.count,
      totalVolume: stats.sum,
    };
  });

  const totalUsers = users.length || txUserMap.size || 1;
  const freeUsersCount = totalUsers - premiumUsersCount;
  const mrr = premiumUsersCount * 29.9; // Preço base do plano Premium
  const conversionRate =
    totalUsers > 0 ? (premiumUsersCount / totalUsers) * 100 : 0;

  return {
    totalUsers,
    premiumUsersCount,
    freeUsersCount,
    mrr,
    totalTransactionsCount,
    totalTransactionVolume,
    conversionRate: parseFloat(conversionRate.toFixed(1)),
    users,
  };
}
