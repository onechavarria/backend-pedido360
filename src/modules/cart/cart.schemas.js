import { z } from 'zod';

export const cartItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(99)
});
export const cartProductParam = z.object({ productId: z.coerce.number().int().positive() });

