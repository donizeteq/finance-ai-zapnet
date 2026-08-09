import { isMatch } from "date-fns";
import { z } from "zod";

// Esquema de validação para a geração de relatórios de IA
export const generateAiReportSchema = z.object({
  month: z.string().refine((value) => isMatch(value, "MM")),
  year: z.string().refine((value) => isMatch(value, "yyyy"), {
    message: "O ano deve estar no formato AAAA (ex: 2026)", // Mensagem de erro personalizada
  }),
});

// Tipo inferido a partir do esquema
export type GenerateAiReportSchema = z.infer<typeof generateAiReportSchema>;
