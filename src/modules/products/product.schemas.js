import { z } from 'zod';

const fields = {
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().min(10).max(2000),
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative(),
  category: z.string().trim().min(2).max(100),
  imageUrl: z.string().trim().max(1000).nullable().optional(),
  releaseDate: z.iso.date().nullable().optional(),
  active: z.boolean().optional()
};

export const createProductSchema = z.object(fields);
export const updateProductSchema = z.object(fields).partial().refine((value) => Object.keys(value).length > 0);
export const productIdSchema = z.object({ id: z.coerce.number().int().positive() });

