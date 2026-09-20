import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validate } from '../../shared/middleware/validate.js';
import { exchangeSchema, loginSchema, registerSchema } from './auth.schemas.js';
import * as controller from './auth.controller.js';

export const authRouter = Router();

// Limita intentos automatizados contra registro, login e intercambio OAuth.
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 50, standardHeaders: 'draft-8' });

authRouter.post('/register', authLimiter, validate(registerSchema), asyncHandler(controller.registerController));
authRouter.post('/login', authLimiter, validate(loginSchema), asyncHandler(controller.loginController));
authRouter.post('/refresh', asyncHandler(controller.refreshController));
authRouter.post('/logout', asyncHandler(controller.logoutController));
authRouter.get('/me', authenticate, controller.meController);
authRouter.get('/providers', controller.providersController);
authRouter.post('/exchange', authLimiter, validate(exchangeSchema), asyncHandler(controller.exchangeController));

// form_post permite recibir el callback de Apple; los demás proveedores usan query string.
authRouter.get('/oauth/:provider', asyncHandler(controller.oauthStartController));
authRouter.get('/oauth/:provider/callback', asyncHandler(controller.oauthCallbackController));
authRouter.post('/oauth/:provider/callback', asyncHandler(controller.oauthCallbackController));
