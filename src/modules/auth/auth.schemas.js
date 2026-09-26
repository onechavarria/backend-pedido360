import { z } from 'zod';

// Reglas compartidas por los formularios y la API.
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(72)
});

export const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false)
});

export const exchangeSchema = z.object({ code: z.string().min(20) });
