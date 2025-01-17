import { isMatch } from "date-fns";
import { z } from "zod";

// Esquema de validação para a geração de relatórios de IA
export const generateAiReportSchema = z.object({
  month: z.string().refine((value) => isMatch(value, "MM")),
  year: z.string().refine((value) => isMatch(value, "yyyy"), {
    message: "O mês deve estar no formato MM (1 a 12)", // Mensagem de erro personalizada
  }),
});

// Tipo inferido a partir do esquema
export type GenerateAiReportSchema = z.infer<typeof generateAiReportSchema>;
