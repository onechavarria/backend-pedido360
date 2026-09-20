import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { openapi } from './docs/openapi.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { productRouter } from './modules/products/product.routes.js';
import { cartRouter } from './modules/cart/cart.routes.js';
import { paymentRouter } from './modules/payments/payment.routes.js';
import { orderRouter } from './modules/orders/order.routes.js';
import { errorHandler, notFound } from './shared/middleware/error-handler.js';

export const app = express();

// Seguridad, CORS y parsers se aplican antes de las rutas funcionales.
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Documentación y verificación operativa.
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'backend-pedido360', timestamp: new Date().toISOString() }));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'Pedidos360 API' }));
app.get('/api/docs.json', (_req, res) => res.json(openapi));

// Un solo proceso HTTP, organizado internamente por módulos independientes.
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/productos', productRouter);
app.use('/api/v1/carrito', cartRouter);
app.use('/api/v1/pagos', paymentRouter);
app.use('/api/v1/pedidos', orderRouter);

app.use(notFound);
app.use(errorHandler);

