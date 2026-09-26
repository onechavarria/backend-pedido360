import { env } from '../config/env.js';

const json = { 'application/json': { schema: {} } };
const bearer = [{ bearerAuth: [] }];

// Especificación OpenAPI servida en /api/docs para probar la API desde el navegador.
export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'Pedidos360 API',
    version: '1.0.0',
    description: 'Monolito modular para catálogo, autenticación, carrito, pagos y pedidos.'
  },
  servers: [{ url: env.BACKEND_PUBLIC_URL, description: env.NODE_ENV === 'production' ? 'Producción' : 'Desarrollo' }],
  tags: [
    { name: 'Sistema' }, { name: 'Autenticación' }, { name: 'Productos' },
    { name: 'Carrito' }, { name: 'Pagos' }, { name: 'Pedidos' }
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      User: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string' }, avatarUrl: { type: ['string', 'null'] } } },
      Product: { type: 'object', properties: { id: { type: 'integer' }, nombre: { type: 'string' }, descripcion: { type: 'string' }, precio: { type: 'number' }, stock: { type: 'integer' }, categoria: { type: 'string' }, imagenUrl: { type: ['string', 'null'] }, fechaLanzamiento: { type: ['string', 'null'], format: 'date' } } },
      Error: { type: 'object', properties: { message: { type: 'string' }, details: { type: 'object' } } },
      Session: { type: 'object', properties: { accessToken: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } }
    }
  },
  paths: {
    '/api/health': {
      get: { tags: ['Sistema'], summary: 'Comprueba el estado del servidor', responses: { 200: { description: 'Servidor disponible' } } }
    },
    '/api/v1/auth/register': {
      post: { tags: ['Autenticación'], summary: 'Crea una cuenta local', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name','email','password'], properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 } } } } } }, responses: { 201: { description: 'Cuenta creada', content: json }, 409: { description: 'Correo duplicado' } } }
    },
    '/api/v1/auth/login': {
      post: { tags: ['Autenticación'], summary: 'Inicia sesión con correo y contraseña', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email','password'], properties: { email: { type: 'string' }, password: { type: 'string' }, rememberMe: { type: 'boolean' } } } } } }, responses: { 200: { description: 'Sesión iniciada', content: json }, 401: { description: 'Credenciales incorrectas' } } }
    },
    '/api/v1/auth/me': {
      get: { tags: ['Autenticación'], summary: 'Devuelve el usuario autenticado', security: bearer, responses: { 200: { description: 'Perfil actual' }, 401: { description: 'No autenticado' } } }
    },
    '/api/v1/auth/providers': {
      get: { tags: ['Autenticación'], summary: 'Lista proveedores sociales habilitados', responses: { 200: { description: 'Proveedores y estado' } } }
    },
    '/api/v1/auth/oauth/{provider}': {
      get: { tags: ['Autenticación'], summary: 'Comienza OAuth', parameters: [{ name: 'provider', in: 'path', required: true, schema: { type: 'string', enum: ['google','facebook','github'] } }], responses: { 302: { description: 'Redirección al proveedor' }, 503: { description: 'Proveedor no configurado' } } }
    },
    '/api/v1/productos': {
      get: { tags: ['Productos'], summary: 'Lista productos', parameters: [{ name: 'search', in: 'query', schema: { type: 'string' } }], responses: { 200: { description: 'Catálogo', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } } } } },
      post: { tags: ['Productos'], summary: 'Crea un producto (ADMIN)', security: bearer, requestBody: { required: true, content: json }, responses: { 201: { description: 'Producto creado' }, 403: { description: 'Sin permisos' } } }
    },
    '/api/v1/productos/{id}': {
      get: { tags: ['Productos'], summary: 'Obtiene un producto', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Producto' }, 404: { description: 'No encontrado' } } },
      patch: { tags: ['Productos'], summary: 'Actualiza un producto (ADMIN)', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: json }, responses: { 200: { description: 'Producto actualizado' } } },
      delete: { tags: ['Productos'], summary: 'Desactiva un producto (ADMIN)', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 204: { description: 'Producto desactivado' } } }
    },
    '/api/v1/carrito': {
      get: { tags: ['Carrito'], summary: 'Obtiene el carrito', security: bearer, responses: { 200: { description: 'Carrito del usuario' } } },
      delete: { tags: ['Carrito'], summary: 'Vacía el carrito', security: bearer, responses: { 204: { description: 'Carrito vacío' } } }
    },
    '/api/v1/carrito/items': {
      post: { tags: ['Carrito'], summary: 'Agrega un producto', security: bearer, requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['productId','quantity'], properties: { productId: { type: 'integer' }, quantity: { type: 'integer' } } } } } }, responses: { 201: { description: 'Producto agregado' }, 409: { description: 'Stock insuficiente' } } }
    },
    '/api/v1/pagos': {
      post: { tags: ['Pagos'], summary: 'Registra un pago demostrativo', security: bearer, requestBody: { required: true, content: json }, responses: { 201: { description: 'Pago aprobado' } } }
    },
    '/api/v1/pedidos': {
      get: { tags: ['Pedidos'], summary: 'Lista mis pedidos', security: bearer, responses: { 200: { description: 'Pedidos del usuario' } } },
      post: { tags: ['Pedidos'], summary: 'Crea la orden y descuenta stock', security: bearer, requestBody: { required: true, content: json }, responses: { 201: { description: 'Pedido creado' }, 409: { description: 'Pago o stock inválido' } } }
    },
    '/api/v1/pedidos/{id}': {
      get: { tags: ['Pedidos'], summary: 'Obtiene el detalle de un pedido', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Detalle del pedido' }, 404: { description: 'No encontrado' } } }
    }
  }
};
