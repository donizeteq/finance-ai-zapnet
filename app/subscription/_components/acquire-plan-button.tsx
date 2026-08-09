"use client";
import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { createAsaasSubscription } from "../_actions/create-subscription";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2Icon, CreditCardIcon, LandmarkIcon, SmartphoneIcon, ExternalLinkIcon } from "lucide-react";
import type { BillingType } from "@/app/_lib/asaas";

const PAYMENT_OPTIONS: { value: BillingType; label: string; icon: React.ReactNode }[] = [
  { value: "CREDIT_CARD", label: "Cartão de Crédito", icon: <CreditCardIcon className="mr-2 h-4 w-4" /> },
  { value: "PIX", label: "PIX", icon: <SmartphoneIcon className="mr-2 h-4 w-4" /> },
  { value: "BOLETO", label: "Boleto Bancário", icon: <LandmarkIcon className="mr-2 h-4 w-4" /> },
];

const AcquirePlanButton = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBillingType, setSelectedBillingType] = useState<BillingType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setPaymentUrl(null);
      setSelectedBillingType(null);
    }
  };

  const handleAcquirePlanClick = async (billingType: BillingType) => {
    try {
      setIsLoading(true);
      const { paymentUrl } = await createAsaasSubscription({ billingType });
      if (!paymentUrl) {
        throw new Error("Asaas não retornou URL de pagamento");
      }
      setPaymentUrl(paymentUrl);
    } catch (error) {
      console.error(error);
      toast.error(
        "Não foi possível iniciar a assinatura. Verifique se o Asaas está configurado.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const metadata = user?.publicMetadata ?? {};
  const isPremiumActive = metadata.subscriptionPlan === "premium";
  const isTrial = metadata.premiumSource === "trial";
  
  const showManagePlan = isPremiumActive && !isTrial;
  if (showManagePlan) {
    return (
      <Button className="w-full rounded-full font-bold" variant="link">
        <Link
          href="https://www.asaas.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Gerenciar Plano
        </Link>
      </Button>
    );
  }
  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-full font-bold">
          Adquirir plano
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {paymentUrl ? "Pagamento Pronto" : "Escolha o meio de pagamento"}
          </DialogTitle>
          <DialogDescription>
            {paymentUrl 
              ? "Clique no botão abaixo para realizar o pagamento com segurança."
              : "A assinatura mensal é de R$19,90 e você pode escolher como deseja pagar."
            }
          </DialogDescription>
        </DialogHeader>

        {paymentUrl ? (
          <div className="flex flex-col gap-4 py-4">
             <Button asChild className="w-full rounded-full font-bold py-6 text-lg">
               <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
                 <ExternalLinkIcon className="mr-2 h-5 w-5" />
                 Abrir Página de Pagamento
               </a>
             </Button>
             <p className="text-xs text-center text-muted-foreground">
               Após concluir o pagamento, sua conta será atualizada automaticamente.
             </p>
             <Button variant="outline" className="rounded-full" onClick={() => handleDialogChange(false)}>
               Fechar
             </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {PAYMENT_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                className="w-full justify-start rounded-full font-bold"
                disabled={isLoading}
                onClick={() => {
                  setSelectedBillingType(option.value);
                  handleAcquirePlanClick(option.value);
                }}
              >
                {isLoading && selectedBillingType === option.value && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {option.icon}
                {option.label}
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AcquirePlanButton;
