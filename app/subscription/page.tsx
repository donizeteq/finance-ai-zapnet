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

  // Defaults — sempre renderiza a pagina mesmo se tudo falhar
  let subscriptionPlan: string = "free";
  let isTrial = false;
  let trialDaysLeft = 0;
  let currentMonthTransactions = 0;

  // Bloco 1: transacoes do mes (Prisma) — falha silenciosa
  try {
    currentMonthTransactions = await getCurrentMonthTransactions();
  } catch (e) {
    console.error("Erro ao buscar transacoes:", e);
  }

  // Bloco 2: plano do usuario (Clerk + mutate) — falha silenciosa
  try {
    subscriptionPlan = await getUserSubscriptionPlan(userId);
  } catch (e) {
    console.error("Erro ao resolver plano:", e);
  }

  // Bloco 3: dados de trial do Clerk — falha silenciosa
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const premiumSource = user.publicMetadata.premiumSource;
    isTrial = premiumSource === "trial";
    const premiumUntil =
      typeof user.publicMetadata.premiumUntil === "string"
        ? new Date(user.publicMetadata.premiumUntil)
        : null;
    trialDaysLeft =
      isTrial && premiumUntil
        ? Math.max(0, differenceInCalendarDays(premiumUntil, new Date()))
        : 0;
  } catch (e) {
    console.error("Erro ao ler metadata Clerk:", e);
  }

  const hasPremiumPlan = subscriptionPlan === "premium";

  return (
    <>
      <NavBar />
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">Assinatura</h1>

        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <Card className="w-full md:w-[450px]">
            <CardHeader className="border-b border-solid py-8">
              <h2 className="text-center text-2xl font-semibold">
                Plano Basico
              </h2>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl">R$</span>
                <span className="text-6xl font-semibold">0</span>
                <span className="text-2xl text-muted-foreground">mes</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 py-8">
              <div className="flex items-center gap-2">
                <CheckIcon className="text-primary" />
                <p>
                  Apenas 10 transacoes por mes ({currentMonthTransactions}/10)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <XIcon />
                <p>Relatorios de IA</p>
              </div>
            </CardContent>
          </Card>
          <Card className="w-full md:w-[450px]">
            <CardHeader className="border-b border-solid py-8">
              {hasPremiumPlan && (
                <div className="mb-4 flex justify-center">
                  <Badge className="bg-primary/10 text-primary">
                    {isTrial
                      ? `Trial ativo (${trialDaysLeft}d restantes)`
                      : "Ativo"}
                  </Badge>
                </div>
              )}
              <h2 className="text-center text-2xl font-semibold">
                Plano Premium
              </h2>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl">R$</span>
                <span className="text-6xl font-semibold">19,90</span>
                <span className="text-2xl text-muted-foreground">mes</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 py-8">
              <div className="flex items-center gap-2">
                <CheckIcon className="text-primary" />
                <p>Transacoes Ilimitadas</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="text-primary" />
                <p>Relatorios de IA</p>
              </div>
              {!hasPremiumPlan && (
                <p className="text-center text-sm text-muted-foreground">
                  Teste gratis por {PREMIUM_PLAN_TRIAL_DAYS} dias, sem cartao
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
