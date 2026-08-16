"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import NavBar from "@/app/_components/navbar";
import { useEffect, useState } from "react";
import { DownloadIcon, Building2Icon, FileSpreadsheetIcon } from "lucide-react";

export default function AuditoriaPage() {
  const [dre, setDre] = useState({
    faturamento: "0,00",
    despesas: "0,00",
    lucroLiquido: "0,00",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auditoria/dre", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data) setDre(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <NavBar />
      <div className="flex flex-col space-y-6 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
              <Building2Icon className="h-6 w-6 text-primary" />
              Contador Connect & DRE
            </h1>
            <p className="text-sm text-muted-foreground">
              Visão contábil e fiscal para auditoria e prestação de contas
              (Pessoa Jurídica)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open("/api/auditoria/export?formato=csv")}
            >
              <FileSpreadsheetIcon className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button
              variant="default"
              className="gap-2"
              onClick={() => window.open("/api/auditoria/export?formato=ofx")}
            >
              <DownloadIcon className="h-4 w-4" />
              Exportar OFX
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faturamento Bruto (PJ)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">
                R$ {dre.faturamento}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Despesas Operacionais (PJ)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-500">
                R$ {dre.despesas}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lucro Líquido / Resultado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {dre.lucroLiquido}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
