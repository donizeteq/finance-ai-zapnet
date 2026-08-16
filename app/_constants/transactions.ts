import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";

export const FREE_PLAN_MONTHLY_TRANSACTION_LIMIT = 10;

export const TRANSACTION_PAYMENT_METHOD_ICONS = {
  [TransactionPaymentMethod.CREDIT_CARD]: "credit-card.svg",
  [TransactionPaymentMethod.DEBIT_CARD]: "debit-card.svg",
  [TransactionPaymentMethod.BANK_TRANSFER]: "bank-transfer.svg",
  [TransactionPaymentMethod.BANK_SLIP]: "bank-slip.svg",
  [TransactionPaymentMethod.CASH]: "money.svg",
  [TransactionPaymentMethod.PIX]: "pix.svg",
  [TransactionPaymentMethod.OTHER]: "other.svg",
};

export const TRANSACTION_CATEGORY_LABELS: Record<string, string> = {
  EDUCATION: "Educação",
  ENTERTAINMENT: "Entretenimento",
  FOOD: "Alimentação",
  HOUSING: "Moradia",
  HEALTH: "Saúde",
  OTHER: "Outros",
  SALARY: "Salário",
  UTILITY: "Utilidade",
  PRO_LABORE: "Pró-Labore",
  FATURAMENTO: "Faturamento / Vendas",
  TRIBUTOS: "Impostos / Tributos",
  FORNECEDORES: "Fornecedores / Insumos",
  EQUIPAMENTOS: "Equipamentos / Infra",
  MARKETING: "Marketing / Comercial",
  SERVICOS: "Serviços Contratados",
  ALUGUEL_EMPRESARIAL: "Aluguel Comercial",
};

export const PF_CATEGORY_OPTIONS = [
  { value: TransactionCategory.HOUSING, label: "Moradia" },
  { value: TransactionCategory.TRANSPORTATION, label: "Transporte" },
  { value: TransactionCategory.FOOD, label: "Alimentação" },
  { value: TransactionCategory.ENTERTAINMENT, label: "Entretenimento" },
  { value: TransactionCategory.HEALTH, label: "Saúde" },
  { value: TransactionCategory.UTILITY, label: "Utilidade / Contas" },
  { value: TransactionCategory.SALARY, label: "Salário" },
  { value: TransactionCategory.EDUCATION, label: "Educação" },
  { value: TransactionCategory.OTHER, label: "Outros (Pessoal)" },
];

export const PJ_CATEGORY_OPTIONS = [
  { value: TransactionCategory.PRO_LABORE, label: "Pró-Labore" },
  { value: TransactionCategory.FATURAMENTO, label: "Faturamento / Vendas" },
  { value: TransactionCategory.TRIBUTOS, label: "Impostos / Tributos" },
  { value: TransactionCategory.FORNECEDORES, label: "Fornecedores / Insumos" },
  { value: TransactionCategory.EQUIPAMENTOS, label: "Equipamentos / Infra" },
  { value: TransactionCategory.MARKETING, label: "Marketing / Comercial" },
  { value: TransactionCategory.SERVICOS, label: "Serviços Contratados" },
  {
    value: TransactionCategory.ALUGUEL_EMPRESARIAL,
    label: "Aluguel Comercial",
  },
  { value: TransactionCategory.OTHER, label: "Outros (Empresa)" },
];

export const TRANSACTION_PAYMENT_METHOD_LABELS = {
  CASH: "Dinheiro",
  CREDIT_CARD: "Cartão",
  BANK_SLIP: "Boleto Bancário",
  BANK_TRANSFER: "Transferência Bancária",
  DEBIT_CARD: "Cartão Débito",
  OTHER: "Outros",
  PIX: "Pix",
};

export const TRANSACTION_TYPE_OPTIONS = [
  {
    value: TransactionType.EXPENSE,
    label: "Despesa",
  },
  {
    value: TransactionType.DEPOSIT,
    label: "Depósito",
  },
  {
    value: TransactionType.INVESTMENT,
    label: "Investimento",
  },
];

export const TRANSACTION_PAYMENT_METHOD_OPTIONS = [
  {
    value: TransactionPaymentMethod.CASH,
    label: TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.CASH],
  },
  {
    value: TransactionPaymentMethod.CREDIT_CARD,
    label:
      TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.CREDIT_CARD],
  },
  {
    value: TransactionPaymentMethod.BANK_SLIP,
    label:
      TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.BANK_SLIP],
  },
  {
    value: TransactionPaymentMethod.BANK_TRANSFER,
    label:
      TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.BANK_TRANSFER],
  },
  {
    value: TransactionPaymentMethod.DEBIT_CARD,
    label:
      TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.DEBIT_CARD],
  },
  {
    value: TransactionPaymentMethod.OTHER,
    label: TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.OTHER],
  },
  {
    value: TransactionPaymentMethod.PIX,
    label: TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.PIX],
  },
];

export const TRANSACTION_CATEGORY_OPTIONS = [
  ...PF_CATEGORY_OPTIONS,
  ...PJ_CATEGORY_OPTIONS.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t.value === item.value),
  ),
];
