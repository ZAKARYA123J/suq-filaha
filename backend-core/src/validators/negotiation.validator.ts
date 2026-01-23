import { z } from 'zod';

const positiveNumber = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      const n = Number(val);
      return Number.isFinite(n) ? n : val;
    }
    return val;
  },
  z.number().positive()
);

export const createNegotiationSchema = z.object({
  productId: z.string().min(1),
  proposedPrice: positiveNumber,
});

export const createNegotiationMessageSchema = z.object({
  content: z.string().min(1),
});

export const updateNegotiationStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED']),
});

export const updateNegotiationProposedPriceSchema = z.object({
  proposedPrice: positiveNumber,
});

export type CreateNegotiationInput = z.infer<typeof createNegotiationSchema>;
export type CreateNegotiationMessageInput = z.infer<typeof createNegotiationMessageSchema>;
export type UpdateNegotiationStatusInput = z.infer<typeof updateNegotiationStatusSchema>;
export type UpdateNegotiationProposedPriceInput = z.infer<typeof updateNegotiationProposedPriceSchema>;
