import { TRANSACTION_PAYMENT_METHOD_ICONS } from "@/app/_constants/transactions";
import { Button } from "@/app/_components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { formatCurrency } from "@/app/_utils/currency";
import { Transaction, TransactionType } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

interface LastTransactionsProps {
  lastTransactions: Transaction[];
}

const LastTransactions = ({ lastTransactions }: LastTransactionsProps) => {
  const getAmountColor = (transaction: Transaction) => {
    if (transaction.type === TransactionType.EXPENSE) {
      return "text-red-500"; // Para despesas, retorna a classe de texto vermelho
    }
    if (transaction.type === TransactionType.DEPOSIT) {
      return "text-primary"; // Para depósitos, retorna a classe de texto primário
    }
    return "text-white"; // Para outros tipos, retorna a classe de texto branca
  };
  const getAmountPrefix = (transaction: Transaction) => {
    if (transaction.type === TransactionType.DEPOSIT) {
      return "+";
    }
    return "-"; // Para depósitos, retorna a classe de texto primário
  };
  return (
    <ScrollArea className="rounded-md border">
      <CardHeader className="items-centet flex-row justify-between">
        <CardTitle className="font-bold">Últimas Transações</CardTitle>
        <Button variant="outline" className="rounded-full font-bold" asChild>
          <Link href="/transactions">Ver mais</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {lastTransactions.map((transaction) => (
          <div
            className="flex items-center justify-between"
            key={transaction.id}
          >
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-white bg-opacity-[3%] p-3">
                <Image
                  src={
                    TRANSACTION_PAYMENT_METHOD_ICONS[transaction.paymentMethod]
                  }
                  height={20}
                  width={20}
                  alt="PIX"
                />
              </div>
              <div>
                <p className="text-sm font-bold">{transaction.name}</p>
                <p className="text-sm text-muted-foreground">
                  {transaction.date
                    ? new Date(transaction.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "Data não disponível"}
                </p>
              </div>
            </div>
            <p className={`text-sm font-bold ${getAmountColor(transaction)}`}>
              {getAmountPrefix(transaction)}
              {formatCurrency(Number(transaction.amount))}
            </p>
          </div>
        ))}
      </CardContent>
    </ScrollArea>
  );
};

export default LastTransactions;
