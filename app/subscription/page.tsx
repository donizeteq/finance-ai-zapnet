import { auth, clerkClient } from "@clerk/nextjs/server";
import NavBar from "../_components/navbar";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "../_components/ui/card";
import { CheckIcon, XIcon } from "lucide-react";
import AcquirePlanButton from "./_components/acquire-plan-button";
import { Badge } from "../_components/ui/badge";
import { getCurrentMonthTransactions } from "../_data/get-current-month-transactions";
import { getUserSubscriptionPlan } from "../_data/get-user-subscription-plan";
import { differenceInCalendarDays } from "date-fns";
import { PREMIUM_PLAN_TRIAL_DAYS } from "../_constants/subscription";

export const dynamic = "force-dynamic";

const SubscriptionPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const [subscriptionPlan, user, currentMonthTransactions] = await Promise.all([
    getUserSubscriptionPlan(userId),
    (await clerkClient()).users.getUser(userId),
    getCurrentMonthTransactions(),
  ]);

  const hasPremiumPlan = subscriptionPlan === "premium";
  const premiumSource = user.publicMetadata.premiumSource;
  const isTrial = premiumSource === "trial";
  const premiumUntil =
    typeof user.publicMetadata.premiumUntil === "string"
      ? new Date(user.publicMetadata.premiumUntil)
      : null;
  const trialDaysLeft =
    isTrial && premiumUntil
      ? Math.max(0, differenceInCalendarDays(premiumUntil, new Date()))
      : 0;
  return (
    <>
      <NavBar />
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">Assinatura</h1>

        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <Card className="w-full md:w-[450px]">
            <CardHeader className="border-b border-solid py-8">
              <h2 className="text-center text-2xl font-semibold">
                Plano Básico
              </h2>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl">R$</span>
                <span className="text-6xl font-semibold">0</span>
                <span className="text-2xl text-muted-foreground">mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 py-8">
              <div className="flex items-center gap-2">
                <CheckIcon className="text-primary" />
                <p>
                  Apenas 10 transações por mês ({currentMonthTransactions}/10)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <XIcon />
                <p>Relatórios de IA</p>
              </div>
            </CardContent>
          </Card>
          <Card className="w-full md:w-[450px]">
            <CardHeader className="relative border-b border-solid py-8">
              {hasPremiumPlan && (
                <Badge className="absolute left-4 top-12 bg-primary/10 text-primary">
                  {isTrial ? `Trial ativo (${trialDaysLeft}d restantes)` : "Ativo"}
                </Badge>
              )}
              <h2 className="text-center text-2xl font-semibold">
                Plano Premium
              </h2>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl">R$</span>
                <span className="text-6xl font-semibold">19,90</span>
                <span className="text-2xl text-muted-foreground">mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 py-8">
              <div className="flex items-center gap-2">
                <CheckIcon className="text-primary" />
                <p>Transações Ilimitadas</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="text-primary" />
                <p>Relatórios de IA</p>
              </div>
              {!hasPremiumPlan && (
                <p className="text-center text-sm text-muted-foreground">
                  Teste grátis por {PREMIUM_PLAN_TRIAL_DAYS} dias, sem cartão
                </p>
              )}
              <AcquirePlanButton />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SubscriptionPage;
