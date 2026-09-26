# Backend Pedidos360

![Node.js](https://img.shields.io/badge/Node.js_24-5FA04E?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL_8-4479A1?logo=mysql&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?logo=swagger&logoColor=black)
![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

API REST de Pedidos360 migrada desde varios microservicios Spring Boot a un **monolito modular Node.js**. Se ejecuta como un solo servidor, pero el código permanece separado por módulos de autenticación, usuarios, productos, carrito, pagos y pedidos.

## Funciones principales

- Registro e inicio de sesión con correo y contraseña.
- JWT, refresh token en cookie `HttpOnly` y contraseñas BCrypt.
- OAuth preparado únicamente para Google, Facebook y GitHub.
- Catálogo, carrito, pago demostrativo, órdenes y descuento transaccional de stock.
- MySQL 8, validaciones Zod, CORS, Helmet y límite de intentos de acceso.
- Swagger UI en `http://localhost:3000/api/docs`.

## Ejecutar localmente

1. Instala Node.js 24 y MySQL 8.
2. Copia `.env.example` como `.env` y revisa las variables `MYSQL_*` y `JWT_SECRET`.
3. Ejecuta:

```bash
npm install
npm run dev
```

`npm run dev` crea las tablas, carga los 16 productos iniciales —incluidos Zelda: Ocarina of Time, Sonic 2 y Final Fantasy VII— y levanta la API con recarga automática. Para producción usa:

```bash
npm ci
npm start
```

También puedes levantar MySQL y la API con:

```bash
docker compose up --build
```

## Proveedores de identidad

Agrega las credenciales deseadas en `.env`. En cada consola registra su callback exacto:

```text
https://api-pedidos360.alcindo.tech/api/v1/auth/oauth/google/callback
https://api-pedidos360.alcindo.tech/api/v1/auth/oauth/facebook/callback
https://api-pedidos360.alcindo.tech/api/v1/auth/oauth/github/callback
```

Define además:

```env
FRONTEND_URL=https://tudominio.cl
BACKEND_PUBLIC_URL=https://api.tudominio.cl
```

Los botones sin credenciales permanecen visibles en Angular, pero informan que el proveedor todavía debe configurarse.

## Estructura

```text
src/
├── config/           # Entorno y conexión MySQL
├── database/         # Migración SQL y catálogo inicial
├── docs/             # OpenAPI / Swagger
├── modules/          # auth, users, products, cart, payments, orders
├── shared/           # errores, middleware y seguridad
├── app.js            # composición del monolito
└── server.js         # inicio y cierre del servidor
```

> El pago incluido es académico y no realiza cobros reales. Para producción conecta una pasarela como Transbank, Mercado Pago o Stripe y un servicio SMTP.
