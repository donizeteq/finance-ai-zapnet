import { describe, expect, it } from "vitest";
import { generateAiReportSchema } from "./schema";

describe("generateAiReportSchema", () => {
  it("aceita meses de 1 a 12 (formatos variados — isMatch é leniente)", () => {
    // date-fns isMatch aceita meses de 1 e 2 dígitos para o padrão "MM"
    expect(() =>
      generateAiReportSchema.parse({ month: "1", year: "2026" }),
    ).not.toThrow();
    expect(() =>
      generateAiReportSchema.parse({ month: "01", year: "2026" }),
    ).not.toThrow();
    expect(() =>
      generateAiReportSchema.parse({ month: "12", year: "2026" }),
    ).not.toThrow();
  });

  it("rejeita mês inválido (13, 00)", () => {
    expect(() =>
      generateAiReportSchema.parse({ month: "13", year: "2026" }),
    ).toThrow();
    expect(() =>
      generateAiReportSchema.parse({ month: "00", year: "2026" }),
    ).toThrow();
  });

  it("rejeita strings não numéricas para mês", () => {
    expect(() =>
      generateAiReportSchema.parse({ month: "abc", year: "2026" }),
    ).toThrow();
  });

  it("rejeita strings não numéricas para ano", () => {
    expect(() =>
      generateAiReportSchema.parse({ month: "01", year: "abcd" }),
    ).toThrow();
  });

  it("mensagem de erro do ano é corrigida (regressão copy-paste)", () => {
    const result = generateAiReportSchema.safeParse({
      month: "01",
      year: "abcd",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      // Antes da correção dizia "mês deve estar no formato MM" — agora diz "ano"
      expect(result.error.issues[0].message).toContain("ano");
      expect(result.error.issues[0].message).not.toMatch(
        /mês.*formato MM/i,
      );
    }
  });
});
