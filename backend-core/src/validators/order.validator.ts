import { z } from 'zod';

export const createOrderSchema = z.object({
  productId: z.string().uuid(),
  deliveryAddress: z.string().min(5),
  items: z.string(),
  notes: z.string().optional(),
  deliveryDate: z.string().datetime().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;