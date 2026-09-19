import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import NavBar from "../_components/navbar";
import OpenFinanceWidget from "../_components/open-finance-widget";

export default async function OpenFinancePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  return (
    <>
      <NavBar />
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <OpenFinanceWidget />
      </div>
    </>
  );
}
