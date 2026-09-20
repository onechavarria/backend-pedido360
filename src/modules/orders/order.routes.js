import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import { validate } from '../../shared/middleware/validate.js';
import { createOrderSchema, orderIdSchema } from './order.schemas.js';
import * as controller from './order.controller.js';

export const orderRouter = Router();
orderRouter.use(authenticate);
orderRouter.get('/', asyncHandler(controller.list));
orderRouter.get('/:id', validate(orderIdSchema, 'params'), asyncHandler(controller.get));
orderRouter.post('/', validate(createOrderSchema), asyncHandler(controller.create));
