import { auth } from "@clerk/nextjs/server";
import { getCurrentMonthTransactions } from "../get-current-month-transactions";
import { getUserSubscriptionPlan } from "../get-user-subscription-plan";
import { FREE_PLAN_MONTHLY_TRANSACTION_LIMIT } from "@/app/_constants/transactions";

export const canUserAddTransaction = async () => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const subscriptionPlan = await getUserSubscriptionPlan(userId);
  if (subscriptionPlan === "premium") {
    return true;
  }

  const currentMonthTransactions = await getCurrentMonthTransactions();
  return currentMonthTransactions < FREE_PLAN_MONTHLY_TRANSACTION_LIMIT;
};
