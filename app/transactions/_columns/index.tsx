"use client";

import { Transaction } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import TransactionTypeBadge from "../_components/type-badge";
import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_PAYMENT_METHOD_LABELS,
} from "@/app/_constants/transactions";
import EditTransactionButton from "../_components/edit-transaction-button";
import DeleteTransactionButton from "../_components/delete-transaction-button";

export const transactionColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row: { original: transaction } }) => (
      <TransactionTypeBadge transaction={transaction} />
    ),
  },
  {
    accessorKey: "tipo_transacao",
    header: "Âmbito",
    cell: ({ row: { original: transaction } }) => (
      <span
        className={
          transaction.tipo_transacao === "EMPRESA"
            ? "font-bold text-emerald-500"
            : "text-muted-foreground"
        }
      >
        {transaction.tipo_transacao === "EMPRESA" ? "PJ" : "PF"}
      </span>
    ),
  },
  {
    accessorKey: "paymentMethod",
    header: "Método de Pagamento",
    cell: ({ row: { original: transaction } }) => (
      <span>
        {TRANSACTION_PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
      </span>
    ),
  },
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row: { original: transaction } }) => (
      <span>
        {new Date(transaction.date).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </span>
    ),
  },
  {
    accessorKey: "amount",
    header: "Valor",
    cell: ({ row: { original: transaction } }) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(transaction.amount)),
  },
  {
    accessorKey: "actions",
    header: "Ações",
    cell: ({ row: { original: transaction } }) => {
      return (
        <div className="space-x-1">
          <EditTransactionButton transaction={transaction} />
          <DeleteTransactionButton transactionId={transaction.id} />
        </div>
      );
    },
  },
];
