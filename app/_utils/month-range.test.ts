import { describe, expect, it } from "vitest";
import { getMonthRange } from "./month-range";

describe("getMonthRange", () => {
  it("retorna janeiro no início e fevereiro (exclusivo) no fim", () => {
    const { start, end } = getMonthRange(2026, 1);

    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(0); // janeiro
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);

    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(1); // fevereiro (intervalo exclusivo)
    expect(end.getDate()).toBe(1);
  });

  it("regressão timezone: o mês selecionado não cai no anterior (UTC-3)", () => {
    // Antes da correção, `new Date("2026-01-01")` era interpretado como UTC e,
    // em America/Sao_Paulo (UTC-3), virava 31/12/2025 21h — o mês de janeiro
    // era perdido. Com `new Date(2026, 0, 1)` o mês é preservado.
    const jan = getMonthRange(2026, 1);
    expect(jan.start.getMonth()).toBe(0);
  });

  it("lida com meses de 1 e 2 dígitos da mesma forma", () => {
    expect(getMonthRange(2026, 1).start.getMonth()).toBe(0);
    expect(getMonthRange(2026, 12).start.getMonth()).toBe(11);
  });

  it("dezembro termina em janeiro do ano seguinte (exclusivo)", () => {
    const dez = getMonthRange(2026, 12);
    expect(dez.end.getFullYear()).toBe(2027);
    expect(dez.end.getMonth()).toBe(0);
    expect(dez.end.getDate()).toBe(1);
  });

  it("o fim está sempre depois do início", () => {
    for (const month of [1, 6, 12]) {
      const { start, end } = getMonthRange(2026, month);
      expect(end.getTime()).toBeGreaterThan(start.getTime());
    }
  });
});
