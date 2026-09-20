import { AppError } from '../errors/app-error.js';

// Valida body, params o query mediante un esquema Zod.
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(new AppError(400, 'Datos de entrada inválidos.', result.error.flatten()));
  }
  req[source] = result.data;
  next();
};

