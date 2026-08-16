"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

const AccountTypeSelect = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountType = searchParams.get("accountType") ?? "ALL";

  const handleOnChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete("accountType");
    } else {
      params.set("accountType", value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <Select onValueChange={handleOnChange} defaultValue={accountType}>
      <SelectTrigger className="w-[150px]">
        <SelectValue placeholder="Âmbito" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Geral (Todos)</SelectItem>
        <SelectItem value="PESSOAL">Pessoa Física</SelectItem>
        <SelectItem value="EMPRESA">Empresa (PJ)</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default AccountTypeSelect;
