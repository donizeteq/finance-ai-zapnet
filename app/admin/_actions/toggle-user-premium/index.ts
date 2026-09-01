"use server";

import { clerkClient, auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function toggleUserPremium(
  targetUserId: string,
  setPremium: boolean,
) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Não autorizado");
  }

  const client = await clerkClient();
  const targetUser = await client.users.getUser(targetUserId);

  if (setPremium) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await client.users.updateUser(targetUserId, {
      publicMetadata: {
        ...targetUser.publicMetadata,
        subscriptionPlan: "premium",
        premiumSource: "manual_admin",
        premiumUntil: nextMonth.toISOString(),
      },
    });
  } else {
    await client.users.updateUser(targetUserId, {
      publicMetadata: {
        ...targetUser.publicMetadata,
        subscriptionPlan: null,
        premiumUntil: null,
      },
    });
  }

  revalidatePath("/admin");
}
