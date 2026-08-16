"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

const MONTH_OPTIONS = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(new Date().getFullYear() - i),
  label: String(new Date().getFullYear() - i),
}));

const CURRENT_MONTH = String(new Date().getMonth() + 1);
const CURRENT_YEAR = String(new Date().getFullYear());

const TimeSelect = () => {
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const month = searchParams.get("month") || CURRENT_MONTH;
  const year = searchParams.get("year") || CURRENT_YEAR;

  // Remove zero à esquerda para bater com os values do Select ("1"..."12")
  const monthValue = String(Number(month));

  const handleMonthChange = (newMonth: string) => {
    push(`/?month=${newMonth}&year=${year}`);
  };
  const handleYearChange = (newYear: string) => {
    push(`/?month=${month}&year=${newYear}`);
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row">
      <Select
        onValueChange={(value) => handleMonthChange(value)}
        value={monthValue}
      >
        <SelectTrigger className="w-full rounded-full sm:w-[130px]">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          {MONTH_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={(value) => handleYearChange(value)} value={year}>
        <SelectTrigger className="w-full rounded-full sm:w-[95px]">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {YEAR_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TimeSelect;
