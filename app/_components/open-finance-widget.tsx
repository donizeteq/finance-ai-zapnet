"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Building2,
  RefreshCw,
  Trash2,
  Landmark,
  Plus,
  AlertCircle,
} from "lucide-react";

// Dynamic import for PluggyConnect (client-only)
const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((mod) => mod.PluggyConnect),
  { ssr: false },
);

interface BankConnection {
  id: string;
  itemId: string;
  connectorName: string;
  connectorLogo?: string | null;
  status: string;
  lastSyncedAt?: string | null;
  createdAt: string;
}

export default function OpenFinanceWidget() {
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchConnections = async () => {
    try {
      const res = await fetch("/api/open-finance/connections");
      const data = await res.json();
      if (data.connections) {
        setConnections(data.connections);
      }
    } catch (err) {
      console.error("Erro ao buscar conexões:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleOpenWidget = async () => {
    setErrorMessage(null);
    try {
      setIsConnecting(true);
      const res = await fetch("/api/open-finance/connect-token", {
        method: "POST",
      });
      const data = await res.json();
      if (data.accessToken) {
        setConnectToken(data.accessToken);
      } else {
        setErrorMessage(data.error || "Erro ao obter token de acesso");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setErrorMessage("Erro ao conectar com Open Finance: " + msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSuccess = async (itemData: { item: { id: string } }) => {
    setConnectToken(null);
    const itemId = itemData.item.id;

    try {
      setSyncingId("new");
      await fetch("/api/open-finance/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      await fetchConnections();
    } catch (e) {
      console.error("Erro ao sincronizar novo banco:", e);
    } finally {
      setSyncingId(null);
    }
  };

  const handleSync = async (itemId?: string) => {
    try {
      setSyncingId(itemId || "all");
      await fetch("/api/open-finance/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      await fetchConnections();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      alert("Erro ao sincronizar: " + msg);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta conexão bancária?"))
      return;
    try {
      await fetch(`/api/open-finance/connections?id=${id}`, {
        method: "DELETE",
      });
      await fetchConnections();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      alert("Erro ao remover: " + msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Conexões Open Finance
          </h2>
          <p className="text-sm text-muted-foreground">
            Conecte suas contas bancárias (Nubank, Itaú, Bradesco, Santander)
            para sincronização automática de transações.
          </p>
        </div>
        <div className="flex gap-2">
          {connections.length > 0 && (
            <Button
              variant="outline"
              onClick={() => handleSync()}
              disabled={syncingId !== null}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${syncingId === "all" ? "animate-spin" : ""}`}
              />
              Sincronizar Todos
            </Button>
          )}
          <Button onClick={handleOpenWidget} disabled={isConnecting}>
            <Plus className="mr-2 h-4 w-4" />
            {isConnecting ? "Carregando..." : "Conectar Novo Banco"}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setErrorMessage(null)}
            className="h-8 w-8 p-0"
          >
            ✕
          </Button>
        </div>
      )}

      {connectToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg rounded-lg bg-background p-4">
            <Button
              variant="ghost"
              className="absolute right-2 top-2 text-muted-foreground"
              onClick={() => setConnectToken(null)}
            >
              ✕
            </Button>
            <h3 className="mb-4 text-center text-lg font-semibold">
              Conectar Instituição Financeira
            </h3>
            <PluggyConnect
              connectToken={connectToken}
              includeSandbox={true}
              onSuccess={handleSuccess}
              onError={(err) => console.error("Erro no Pluggy Widget:", err)}
              onClose={() => setConnectToken(null)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando conexões...</p>
      ) : connections.length === 0 ? (
        <Card className="border-dashed p-8 text-center">
          <div className="mb-4 flex justify-center text-muted-foreground">
            <Landmark className="h-12 w-12 stroke-1" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum banco conectado</h3>
          <p className="mx-auto mb-4 mt-1 max-w-md text-sm text-muted-foreground">
            Conecte seus bancos pelo Open Finance Brasil para importar seus
            gastos e receitas de forma automática e segura.
          </p>
          <Button onClick={handleOpenWidget}>
            <Plus className="mr-2 h-4 w-4" /> Conectar Banco Agora
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((conn) => (
            <Card key={conn.id} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  {conn.connectorLogo ? (
                    <Image
                      src={conn.connectorLogo}
                      alt={conn.connectorName}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-primary" />
                  )}
                  {conn.connectorName}
                </CardTitle>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500">
                  {conn.status}
                </span>
              </CardHeader>
              <CardContent>
                <p className="mt-1 text-xs text-muted-foreground">
                  Última sincronização:{" "}
                  {conn.lastSyncedAt
                    ? new Date(conn.lastSyncedAt).toLocaleString("pt-BR")
                    : "Pendente"}
                </p>

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSync(conn.itemId)}
                    disabled={syncingId === conn.itemId}
                  >
                    <RefreshCw
                      className={`mr-1 h-3.5 w-3.5 ${syncingId === conn.itemId ? "animate-spin" : ""}`}
                    />
                    Sync
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(conn.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
