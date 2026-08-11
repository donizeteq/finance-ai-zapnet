"use client";

import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { BotIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import Markdown from "react-markdown";
import Link from "next/link";
import GeneratePdf from "@/app/_components/generate-pdf";
import { toast } from "sonner";

interface AiReportButtonProps {
  hasPremiumPlan: boolean;
  month: string;
  year: string;
}

const AiReportButton = ({
  month,
  year,
  hasPremiumPlan,
}: AiReportButtonProps) => {
  const [report, setReport] = useState<string | null>(null);
  const [reportIsLoading, setReportIsLoading] = useState(false);

  const handleGenerateReportClick = async () => {
    try {
      setReportIsLoading(true);
      const res = await fetch("/api/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year: year.toString() }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Erro ${res.status}: ${errText}`);
      }

      const data = await res.json();
      setReport(data.report);
    } catch (error) {
      console.error("Erro detalhado ao gerar relatório:", error);
      toast.error(
        `Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      );
    } finally {
      setReportIsLoading(false);
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) setReport(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost">
          <span className="hidden sm:inline">Relatório IA</span>
          <span className="sm:hidden">IA</span>
          <BotIcon className="ml-2" size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px]">
        {hasPremiumPlan ? (
          <>
            <DialogHeader>
              <DialogTitle>Relatório IA</DialogTitle>
              <DialogDescription>
                Use inteligência artificial para gerar um relatório com insights
                sobre suas finanças.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="prose max-h-[60vh] text-white prose-h3:text-white prose-h4:text-white prose-strong:text-white">
              {report ? (
                <Markdown>{report}</Markdown>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Clique em &quot;Gerar Relatório&quot; para analisar suas
                  finanças com IA.
                </p>
              )}
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" disabled={reportIsLoading}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                onClick={handleGenerateReportClick}
                disabled={reportIsLoading}
              >
                {reportIsLoading ? (
                  <>
                    <Loader2Icon className="mr-2 animate-spin" size={16} />
                    Gerando... (pode levar até 30s)
                  </>
                ) : (
                  "Gerar Relatório"
                )}
              </Button>
              {report && <GeneratePdf report={report} />}
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Relatório IA</DialogTitle>
              <DialogDescription>
                Você precisa de um plano premium para gerar relatórios com IA.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button asChild>
                <Link href="/subscription">Assinar plano premium</Link>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AiReportButton;
