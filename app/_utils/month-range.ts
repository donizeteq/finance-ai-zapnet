/**
 * Retorna o intervalo [início, fim) do mês em horário local.
 *
 * IMPORTANTE: não construir com `new Date("YYYY-MM-01")` — o JS interpreta
 * esse formato como UTC e, em fusos com offset negativo (ex: Brasil, UTC-3),
 * o mês selecionado cairia no mês anterior. `new Date(ano, mesIndex, dia)`
 * constrói em horário local, que é o esperado pelas queries do Prisma.
 */
export const getMonthRange = (year: number, month: number) => {
  const start = new Date(year, month - 1, 1); // 1º dia do mês, 00:00 local
  const end = new Date(year, month, 1); // 1º dia do mês seguinte (exclusivo)
  return { start, end };
};
