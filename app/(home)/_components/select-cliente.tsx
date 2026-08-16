"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";

interface Cliente {
  id: string;
  name: string;
}

interface SelectClienteProps {
  clientes: Cliente[];
}

const SelectCliente = ({ clientes }: SelectClienteProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Não exibir o seletor se não houver clientes vinculados
  if (!clientes || clientes.length === 0) {
    return null;
  }

  const handleSelect = (clientId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("clientId", clientId);
    router.push(`/?${params.toString()}`);
  };

  return (
    <Select
      onValueChange={handleSelect}
      defaultValue={searchParams.get("clientId") || ""}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Selecionar Cliente" />
      </SelectTrigger>
      <SelectContent>
        {clientes.map((cliente) => (
          <SelectItem key={cliente.id} value={cliente.id}>
            {cliente.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SelectCliente;
