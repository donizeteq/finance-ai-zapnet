import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    // Fuso fixo para que o teste de regressão de timezone seja determinístico
    // (no Brasil, UTC-3, o formato "YYYY-MM-01" era interpretado como UTC e
    // deslocava o mês selecionado para o anterior).
    env: {
      TZ: "America/Sao_Paulo",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
    },
  },
});
