import pg from 'pg';
import { env } from './env.js';

// Un único pool sirve a todos los módulos del monolito.
export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000
});

pool.on('error', (error) => console.error('Error inesperado de PostgreSQL:', error));

export const query = (text, params = []) => pool.query(text, params);

// Ejecuta operaciones relacionadas dentro de una misma transacción.
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

