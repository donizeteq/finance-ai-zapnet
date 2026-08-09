import { z } from "zod";

// Meios de pagamento aceitos pelo Asaas
export const billingTypeSchema = z.enum(["PIX", "CREDIT_CARD", "BOLETO"]);

export const createSubscriptionSchema = z.object({
  billingType: billingTypeSchema,
});

export type CreateSubscriptionSchema = z.infer<
  typeof createSubscriptionSchema
>;