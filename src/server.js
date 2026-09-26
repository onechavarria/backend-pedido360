import { app } from './app.js';
import { pool } from './config/database.js';
import { env } from './config/env.js';

let server;

// Comprueba MySQL e inicia el servidor sin usar top-level await.
async function startServer() {
  await pool.query('SELECT 1');

  server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`Pedidos360 API: ${env.BACKEND_PUBLIC_URL}`);
    console.log(`Swagger: ${env.BACKEND_PUBLIC_URL}/api/docs`);
  });
}

// Cierra correctamente el servidor y la conexión con MySQL.
async function shutdown(signal) {
  console.log(`\n${signal}: cerrando servidor...`);

  if (!server) {
    await pool.end();
    process.exit(0);
  }

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

// Escucha las señales de cierre del servidor.
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Inicia la aplicación y registra cualquier error.
startServer().catch(async (error) => {
  console.error('No se pudo iniciar Pedidos360:', error);
  await pool.end().catch(() => {});
  process.exit(1);
});
