import { findUserById, toPublicUser } from '../../modules/users/user.repository.js';
import { AppError } from '../errors/app-error.js';
import { verifyAccessToken } from '../security/tokens.js';

// Comprueba el Bearer token y agrega el usuario autenticado a req.user.
export async function authenticate(req, _res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new AppError(401, 'Debes iniciar sesión.');

    const payload = await verifyAccessToken(token);
    const user = await findUserById(payload.sub);
    if (!user) throw new AppError(401, 'La sesión ya no es válida.');

    req.user = toPublicUser(user);
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, 'Token inválido o vencido.'));
  }
}

export const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user?.role)) return next(new AppError(403, 'No tienes permisos para esta acción.'));
  next();
};

