# Despliegue del backend en Hostinger

## 1. Crear la base de datos

Crea una base de datos MySQL y un usuario desde hPanel. Conserva el host, puerto, nombre, usuario y contraseña completos; Hostinger suele agregar un prefijo al nombre y al usuario.

## 2. Variables de entorno

Configura estas variables en la aplicación Node.js:

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://pedidos360.alcindo.tech
BACKEND_PUBLIC_URL=https://api-pedidos360.alcindo.tech

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=nombre_mysql_de_hostinger
MYSQL_USER=usuario_mysql_de_hostinger
MYSQL_PASSWORD=contrasena_mysql_de_hostinger
MYSQL_SSL=false

JWT_SECRET=una-clave-aleatoria-de-al-menos-32-caracteres
JWT_EXPIRES_IN=60m
REFRESH_TOKEN_DAYS=7

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

No agregues comillas alrededor de los valores. Si Hostinger indica que la conexión MySQL exige SSL, cambia `MYSQL_SSL` a `true`.

## 3. Callbacks OAuth

Registra exactamente estas URL en cada proveedor:

```text
Google:   https://api-pedidos360.alcindo.tech/api/v1/auth/oauth/google/callback
Facebook: https://api-pedidos360.alcindo.tech/api/v1/auth/oauth/facebook/callback
GitHub:   https://api-pedidos360.alcindo.tech/api/v1/auth/oauth/github/callback
```

## 4. Inicio

El comando de inicio es `npm start`. Al iniciar, la aplicación crea las tablas que falten, carga o actualiza el catálogo inicial y luego abre el servidor.

Comprueba:

- `https://api-pedidos360.alcindo.tech/api/health`
- `https://api-pedidos360.alcindo.tech/api/docs`
- `https://api-pedidos360.alcindo.tech/` para ver el JSON de productos.
