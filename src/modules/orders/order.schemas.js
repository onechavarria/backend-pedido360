import { z } from 'zod';

export const createOrderSchema = z.object({
  paymentId: z.uuid(),
  shippingAddress: z.string().trim().min(8).max(600),
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().min(1).max(99)
  })).min(1).max(30)
});

export const orderIdSchema = z.object({ id: z.uuid() });

