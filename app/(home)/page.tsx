import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUserSubscriptionPlan } from "../_data/get-user-subscription-plan";
import NavBar from "../_components/navbar";
import SummaryCards from "./_components/summary-cards";
import TimeSelect from "./_components/time-select";
import TransactionsPieChart from "./_components/transactions-pie-chart";
import { getDashboard } from "../_data/get-dashboard";
import ExpensesPerCategory from "./_components/expenses-per-category";
import LastTransactions from "./_components/last-transactions";
import { canUserAddTransaction } from "../_data/can-user-add-transaction";
import AiReportButton from "./_components/ai-report-button";
import { isMatch } from "date-fns";
import {
  SummaryCardsSkeleton,
  ChartSkeleton,
  LastTransactionsSkeleton,
} from "./_components/dashboard-skeleton";

interface HomeProps {
  searchParams: Promise<{
    month: string;
    year: string;
  }>;
}

const Home = async ({ searchParams }: HomeProps) => {
  const { month, year } = await searchParams;
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const monthIsInvalid = !month || !isMatch(month.padStart(2, "0"), "MM");
  const yearIsInvalid = !year || !isMatch(year, "yyyy");
  if (monthIsInvalid || yearIsInvalid) {
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    const currentYear = new Date().getFullYear();
    redirect(`?month=${currentMonth}&year=${currentYear}`);
  }

  // Buscando dados do dashboard em paralelo
  const [dashboard, userCanAddTransaction, subscriptionPlan] = await Promise.all([
    getDashboard(month, year),
    canUserAddTransaction(),
    getUserSubscriptionPlan(userId),
  ]);

  const isPremium = subscriptionPlan === "premium";

  return (
    <>
      <NavBar />
      <div className="flex h-full flex-col space-y-6 overflow-hidden p-6">
        {isPremium && (
          <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">👑</span>
              <div>
                <p className="text-sm font-bold text-amber-400">Você é Premium!</p>
                <p className="text-xs text-muted-foreground">Transações ilimitadas e relatórios com IA liberados</p>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-3">
            <AiReportButton
              month={month}
              year={year}
              hasPremiumPlan={subscriptionPlan === "premium"}
            />
            <Suspense fallback={null}>
              <TimeSelect />
            </Suspense>
          </div>
        </div>
        <div className="grid h-full grid-cols-1 gap-6 overflow-hidden md:grid-cols-[2fr,1fr]">
          <div className="flex flex-col gap-6 overflow-hidden">
            <Suspense fallback={<SummaryCardsSkeleton />}>
              <SummaryCards
                month={month}
                year={year}
                {...dashboard}
                userCanAddTransaction={userCanAddTransaction}
              />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <div className="grid h-full grid-cols-1 gap-6 overflow-hidden md:grid-cols-3">
                <TransactionsPieChart {...dashboard} />
                <ExpensesPerCategory
                  expensesPerCategory={dashboard.totalExpensePerCategory}
                />
              </div>
            </Suspense>
          </div>
          <Suspense fallback={<LastTransactionsSkeleton />}>
            <LastTransactions lastTransactions={dashboard.lastTransactions} />
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default Home;
