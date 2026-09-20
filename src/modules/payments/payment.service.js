import crypto from 'node:crypto';
import { query } from '../../config/database.js';

// Pago demostrativo: registra una aprobación, pero no procesa una tarjeta real.
export async function createDemoPayment(userId, data) {
  const id = crypto.randomUUID();
  const { rows } = await query(
    `INSERT INTO payments (id, user_id, amount, currency, method, last_four, status)
     VALUES ($1,$2,$3,$4,$5,$6,'APPROVED')
     RETURNING id, amount::float, currency, method, last_four AS "lastFour", status, created_at AS "createdAt"`,
    [id, userId, data.amount, data.currency, data.method, data.lastFour]
  );
  return rows[0];
}

