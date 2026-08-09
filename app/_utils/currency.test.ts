import { describe, expect, it } from "vitest";
import { formatCurrency } from "./currency";

describe("formatCurrency", () => {
  it("formata um valor em reais (pt-BR)", () => {
    // Intl.NumberFormat("pt-BR") usa espaço não-quebrável (U+00A0) entre R$ e o número.
    // \s em regex reconhece NBSP no Node.js/JS.
    expect(formatCurrency(150.5)).toMatch(/R\$\s150,50/);
  });

  it("formata zero", () => {
    expect(formatCurrency(0)).toMatch(/R\$\s0,00/);
  });

  it("formata valores negativos", () => {
    expect(formatCurrency(-10.5)).toMatch(/-R\$\s10,50/);
  });

  it("formata valores com milhar", () => {
    expect(formatCurrency(1234.56)).toMatch(/R\$\s1\.234,56/);
  });
});
