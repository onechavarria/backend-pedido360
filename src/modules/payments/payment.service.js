import crypto from 'node:crypto';
import { query } from '../../config/database.js';

// Pago demostrativo: registra una aprobación, pero no procesa una tarjeta real.
export async function createDemoPayment(userId, data) {
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO payments (id, user_id, amount, currency, method, last_four, status)
     VALUES (?,?,?,?,?,?,'APPROVED')`,
    [id, userId, data.amount, data.currency, data.method, data.lastFour]
  );
  const { rows } = await query(
    `SELECT id, CAST(amount AS DOUBLE) AS amount, currency, method,
            last_four AS lastFour, status, created_at AS createdAt
     FROM payments WHERE id = ?`,
    [id]
  );
  return rows[0];
}
