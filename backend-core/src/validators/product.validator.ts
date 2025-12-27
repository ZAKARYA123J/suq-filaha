import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2),
  category: z.string(),
  quantity: z.number().positive(),
  unit: z.string(),
  price: z.number().positive(),
  harvestDate: z.string().optional(),
  quality: z.string().optional(),
  images: z.array(z.string().url()).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;