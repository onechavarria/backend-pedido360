import { AppError } from '../errors/app-error.js';

// Centraliza las respuestas de error para mantener el mismo formato en toda la API.
export function errorHandler(error, _req, res, _next) {
  const status = error instanceof AppError ? error.status : 500;
  if (status === 500) console.error(error);

  res.status(status).json({
    message: status === 500 ? 'Ocurrió un error interno.' : error.message,
    ...(error.details ? { details: error.details } : {})
  });
}

export function notFound(req, res) {
  res.status(404).json({ message: `No existe la ruta ${req.method} ${req.originalUrl}.` });
}

