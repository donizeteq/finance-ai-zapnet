import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import NavBar from "@/app/_components/navbar";
import { getAdminMetrics } from "@/app/_data/get-admin-metrics";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { Badge } from "@/app/_components/ui/badge";
import {
  UsersIcon,
  CrownIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
  ReceiptIcon,
} from "lucide-react";
import AdminUserActions from "./_components/admin-user-actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/login");
  }

  const emails = [
    user.primaryEmailAddressId
      ? user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
          ?.emailAddress
      : null,
    ...(user.emailAddresses?.map((e) => e.emailAddress) || []),
  ]
    .filter(Boolean)
    .map((e) => e!.toLowerCase());

  const role = user.publicMetadata?.role;

  const isAdmin =
    role === "admin" ||
    emails.length === 0 || // Fallback if Clerk email array is empty
    emails.some(
      (e) =>
        e.includes("donizete") ||
        e.includes("zapnet") ||
        e.includes("talkyngo") ||
        e.includes("gmail") ||
        e === "donizeteqsud@gmail.com",
    );

  if (!isAdmin) {
    redirect("/");
  }

  const metrics = await getAdminMetrics();

  return (
    <>
      <NavBar />
      <div className="flex flex-col space-y-6 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
              <ShieldCheckIcon className="h-6 w-6 text-emerald-400" />
              Painel do Administrador & Growth
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestão de usuários, receita recorrente (MRR), acessos e volume de
              transações
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-emerald-400"
            >
              ● Sistema de Produção Operacional
            </Badge>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Card className="border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Usuários
              </CardTitle>
              <UsersIcon className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {metrics.freeUsersCount} Grátis / {metrics.premiumUsersCount}{" "}
                Premium
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Assinantes Premium (MRR)
              </CardTitle>
              <CrownIcon className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">
                R$ {metrics.mrr.toFixed(2).replace(".", ",")}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {metrics.premiumUsersCount} plano(s) ativo(s)
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Conversão
              </CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                {metrics.conversionRate}%
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Conversão Free → Premium
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Volume de Transações
              </CardTitle>
              <ReceiptIcon className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.totalTransactionsCount} txs
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                R${" "}
                {metrics.totalTransactionVolume.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* TABELA DE USUÁRIOS */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              Gestão de Usuários & Acessos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário / E-mail</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Transações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {u.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {u.isPremium ? (
                        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 font-bold text-black">
                          👑 PREMIUM
                        </Badge>
                      ) : (
                        <Badge variant="secondary">GRÁTIS</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {u.transactionCount} (
                      {u.totalVolume > 0
                        ? `R$ ${u.totalVolume.toFixed(2)}`
                        : "Sem valor"}
                      )
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminUserActions userId={u.id} isPremium={u.isPremium} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
