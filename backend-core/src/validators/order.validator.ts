import { z } from 'zod';

// Define OrderItem schema
export const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  price: z.number().positive(),
  notes: z.string().optional(),
});

// Main Order schema
export const createOrderSchema = z.object({
  deliveryAddress: z.string().min(5),
  items: z.union([
    // Accept array of order items
    z.array(orderItemSchema),
    // OR accept JSON string that can be parsed to array of order items
    z.string().transform((str, ctx) => {
      try {
        const parsed = JSON.parse(str);
        return orderItemSchema.array().parse(parsed);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Items must be a valid JSON array of order items",
        });
        return z.NEVER;
      }
    }),
  ]),
  notes: z.string().optional(),
  deliveryDate: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;