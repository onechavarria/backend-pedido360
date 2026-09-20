import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.enum(['CLP']).default('CLP'),
  method: z.enum(['CARD', 'DEMO']).default('CARD'),
  lastFour: z.string().regex(/^\d{4}$/).default('4242')
});

