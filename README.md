# Backend Pedidos360

![Node.js](https://img.shields.io/badge/Node.js_24-5FA04E?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?logo=swagger&logoColor=black)
![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

API REST de Pedidos360 migrada desde varios microservicios Spring Boot a un **monolito modular Node.js**. Se ejecuta como un solo servidor, pero el código permanece separado por módulos de autenticación, usuarios, productos, carrito, pagos y pedidos.

## Funciones principales

- Registro e inicio de sesión con correo y contraseña.
- JWT, refresh token en cookie `HttpOnly` y contraseñas BCrypt.
- OAuth preparado para Google, Apple, Facebook, GitHub y Microsoft.
- Catálogo, carrito, pago demostrativo, órdenes y descuento transaccional de stock.
- PostgreSQL, validaciones Zod, CORS, Helmet y límite de intentos de acceso.
- Swagger UI en `http://localhost:3000/api/docs`.

## Ejecutar localmente

1. Instala Node.js 24 y PostgreSQL.
2. Copia `.env.example` como `.env` y revisa `DATABASE_URL` y `JWT_SECRET`.
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

También puedes levantar PostgreSQL y la API con:

```bash
docker compose up --build
```

## Proveedores de identidad

Agrega las credenciales deseadas en `.env`. En la consola de cada proveedor registra este callback, cambiando dominio y proveedor según corresponda:

```text
https://api.tudominio.cl/api/v1/auth/oauth/google/callback
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
├── config/           # Entorno y conexión PostgreSQL
├── database/         # Migración SQL y catálogo inicial
├── docs/             # OpenAPI / Swagger
├── modules/          # auth, users, products, cart, payments, orders
├── shared/           # errores, middleware y seguridad
├── app.js            # composición del monolito
└── server.js         # inicio y cierre del servidor
```

> El pago incluido es académico y no realiza cobros reales. Para producción conecta una pasarela como Transbank, Mercado Pago o Stripe y un servicio SMTP.
