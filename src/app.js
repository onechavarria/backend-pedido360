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
import * as productController from './modules/products/product.controller.js';
import { cartRouter } from './modules/cart/cart.routes.js';
import { paymentRouter } from './modules/payments/payment.routes.js';
import { orderRouter } from './modules/orders/order.routes.js';

import { asyncHandler } from './shared/middleware/async-handler.js';
import {
  errorHandler,
  notFound
} from './shared/middleware/error-handler.js';

// Crea la aplicación principal de Express.
export const app = express();

// Configura el proxy utilizado por Hostinger.
app.set('trust proxy', 1);

// Agrega cabeceras de seguridad a las respuestas.
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// Permite que el frontend se comunique con el backend.
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);

// Permite recibir información en formato JSON y formularios.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Permite leer cookies enviadas por el navegador.
app.use(cookieParser());

// Muestra las peticiones HTTP en desarrollo y producción.
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Devuelve todos los productos al visitar el dominio principal.
app.get('/', asyncHandler(productController.list));

// Comprueba que el backend esté disponible.
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'backend-pedido360',
    timestamp: new Date().toISOString()
  });
});

// Publica la documentación visual de Swagger.
// Publica la documentación visual de Swagger.
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapi, {
    customSiteTitle: 'Pedidos360 API'
  })
);

// Publica la documentación de la API en formato JSON.
app.get('/api/docs.json', (_req, res) => {
  res.status(200).json(openapi);
});

// Registra las rutas del módulo de autenticación.
app.use('/api/v1/auth', authRouter);

// Registra las rutas públicas y administrativas de productos.
app.use('/api/v1/productos', productRouter);

// Registra las rutas protegidas del carrito de compras.
app.use('/api/v1/carrito', cartRouter);

// Registra las rutas relacionadas con los pagos.
app.use('/api/v1/pagos', paymentRouter);

// Registra las rutas relacionadas con los pedidos.
app.use('/api/v1/pedidos', orderRouter);

// Responde cuando se intenta acceder a una ruta inexistente.
app.use(notFound);

// Procesa los errores generados dentro de la aplicación.
app.use(errorHandler);
