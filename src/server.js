import { app } from './app.js';
import { pool } from './config/database.js';
import { env } from './config/env.js';

// Antes de aceptar tráfico se comprueba la conexión con PostgreSQL.
await pool.query('SELECT 1');
const server = app.listen(env.PORT, () => {
  console.log(`Pedidos360 API: ${env.BACKEND_PUBLIC_URL}`);
  console.log(`Swagger: ${env.BACKEND_PUBLIC_URL}/api/docs`);
});

// Cierre ordenado para Hostinger, Docker y desarrollo local.
async function shutdown(signal) {
  console.log(`\n${signal}: cerrando servidor...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

