import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import { validate } from '../../shared/middleware/validate.js';
import { cartItemSchema, cartProductParam } from './cart.schemas.js';
import * as controller from './cart.controller.js';

export const cartRouter = Router();
cartRouter.use(authenticate);
cartRouter.get('/', asyncHandler(controller.get));
cartRouter.post('/items', validate(cartItemSchema), asyncHandler(controller.add));
cartRouter.patch('/items/:productId', validate(cartProductParam, 'params'), validate(cartItemSchema.pick({ quantity: true })), asyncHandler(controller.update));
cartRouter.delete('/items/:productId', validate(cartProductParam, 'params'), asyncHandler(controller.remove));
cartRouter.delete('/', asyncHandler(controller.clear));
