import { Router } from 'express';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';
import { validate } from '../../shared/middleware/validate.js';
import * as controller from './product.controller.js';
import { createProductSchema, productIdSchema, updateProductSchema } from './product.schemas.js';

export const productRouter = Router();

// La lectura del catálogo es pública; la administración requiere rol ADMIN.
productRouter.get('/', asyncHandler(controller.list));
productRouter.get('/:id', validate(productIdSchema, 'params'), asyncHandler(controller.get));
productRouter.post('/', authenticate, authorize('ADMIN'), validate(createProductSchema), asyncHandler(controller.create));
productRouter.patch('/:id', authenticate, authorize('ADMIN'), validate(productIdSchema, 'params'), validate(updateProductSchema), asyncHandler(controller.update));
productRouter.delete('/:id', authenticate, authorize('ADMIN'), validate(productIdSchema, 'params'), asyncHandler(controller.remove));

