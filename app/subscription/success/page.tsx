import { Button } from "@/app/_components/ui/button";
import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SubscriptionSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
      <CheckCircle2Icon className="w-16 h-16 text-primary mb-4" />
      <h1 className="text-2xl font-bold mb-2">Assinatura realizada com sucesso!</h1>
      <p className="text-muted-foreground mb-6">
        Parabéns! Sua conta agora possui acesso ilimitado às funcionalidades Premium.
      </p>
      <div className="bg-muted p-4 rounded-lg mb-8 text-left w-full max-w-md">
        <h2 className="font-semibold mb-2">Vantagens que você acaba de liberar:</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
          <li>Transações ilimitadas no sistema</li>
          <li>Relatórios inteligentes com IA</li>
          <li>Suporte prioritário via WhatsApp</li>
        </ul>
      </div>
      <Button asChild className="rounded-full font-bold">
        <Link href="/">Voltar para o Dashboard</Link>
      </Button>
    </div>
  );
}
