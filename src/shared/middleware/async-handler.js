// Envuelve controladores asíncronos y entrega sus errores al middleware global.
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

