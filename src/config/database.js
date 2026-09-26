import mysql from 'mysql2/promise';
import { env } from './env.js';

// Un único pool MySQL sirve a todos los módulos del monolito.
export const pool = mysql.createPool({
  host: env.MYSQL_HOST,
  port: env.MYSQL_PORT,
  database: env.MYSQL_DATABASE,
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  ssl: env.MYSQL_SSL ? { rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  multipleStatements: true
});

// Normaliza mysql2 para que los módulos trabajen con rows y rowCount.
function normalizeResult(result) {
  if (Array.isArray(result)) return { rows: result, rowCount: result.length };
  return {
    rows: [],
    rowCount: result.affectedRows ?? 0,
    insertId: result.insertId ?? null
  };
}

export async function query(text, params = []) {
  const [result] = await pool.query(text, params);
  return normalizeResult(result);
}

// Ejecuta operaciones relacionadas dentro de una misma transacción MySQL.
export async function withTransaction(callback) {
  const connection = await pool.getConnection();
  const client = {
    query: async (text, params = []) => {
      const [result] = await connection.query(text, params);
      return normalizeResult(result);
    }
  };

  try {
    await connection.beginTransaction();
    const result = await callback(client);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
