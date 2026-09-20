import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { asyncHandler } from '../../shared/middleware/async-handler.js';
import { validate } from '../../shared/middleware/validate.js';
import { createPaymentSchema } from './payment.schemas.js';
import { createDemoPayment } from './payment.service.js';

export const paymentRouter = Router();
paymentRouter.post('/', authenticate, validate(createPaymentSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await createDemoPayment(req.user.id, req.body));
}));

