import 'dotenv/config';
import { z } from 'zod';

// Este esquema detiene el servidor si falta una configuración esencial.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_URL: z.string().url().default('http://localhost:4200'),
  BACKEND_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  MYSQL_HOST: z.string().min(1).default('localhost'),
  MYSQL_PORT: z.coerce.number().int().positive().default(3306),
  MYSQL_DATABASE: z.string().min(1).default('pedidos360'),
  MYSQL_USER: z.string().min(1),
  MYSQL_PASSWORD: z.string().default(''),
  MYSQL_SSL: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(7),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional()
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Configuración inválida:', z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
