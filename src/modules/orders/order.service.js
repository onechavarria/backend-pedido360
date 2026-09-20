import crypto from 'node:crypto';
import { query, withTransaction } from '../../config/database.js';
import { AppError } from '../../shared/errors/app-error.js';
import { clearCart } from '../cart/cart.service.js';

const gameCode = () => crypto.randomBytes(6).toString('hex').toUpperCase().match(/.{1,4}/g).join('-');
const orderNumber = () => `P360-${Date.now().toString().slice(-8)}-${crypto.randomInt(100, 999)}`;

// Convierte las filas SQL al contrato estable consumido por Angular.
function mapOrder(row, items = []) {
  return {
    id: row.id,
    numeroOrden: row.order_number,
    fecha: row.created_at,
    estado: row.status,
    metodoPago: row.payment_method,
    total: Number(row.total),
    clienteEmail: row.customer_email,
    direccionEnvio: row.shipping_address,
    confirmacionEmailEnviada: row.confirmation_email_sent,
    items
  };
}

async function findOrderItems(orderId, client = { query }) {
  const { rows } = await client.query(
    `SELECT product_id AS "productoId", name AS nombre, unit_price::float AS "precioUnitario",
            quantity AS cantidad, image_url AS "imagenUrl", game_code AS "codigoJuego"
     FROM order_items WHERE order_id = $1 ORDER BY id`,
    [orderId]
  );
  return rows;
}

// Bloquea productos, valida stock/precios, descuenta inventario y crea la orden atómicamente.
export async function createOrder(user, data) {
  return withTransaction(async (client) => {
    const paymentResult = await client.query(
      `SELECT * FROM payments WHERE id = $1 AND user_id = $2 AND status = 'APPROVED' FOR UPDATE`,
      [data.paymentId, user.id]
    );
    const payment = paymentResult.rows[0];
    if (!payment) throw new AppError(409, 'El pago no existe o no está aprobado.');
    const alreadyUsed = await client.query('SELECT 1 FROM orders WHERE payment_id = $1', [payment.id]);
    if (alreadyUsed.rowCount) throw new AppError(409, 'El pago ya fue asociado a una orden.');

    const items = [];
    for (const requested of data.items) {
      const result = await client.query('SELECT * FROM products WHERE id = $1 AND active = TRUE FOR UPDATE', [requested.productId]);
      const product = result.rows[0];
      if (!product) throw new AppError(404, `Producto ${requested.productId} no encontrado.`);
      if (product.stock < requested.quantity) throw new AppError(409, `Stock insuficiente para ${product.name}.`);
      items.push({ product, quantity: requested.quantity });
    }

    const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
    if (Math.round(Number(payment.amount)) !== Math.round(total)) throw new AppError(409, 'El monto pagado no coincide con el total actual.');

    const id = crypto.randomUUID();
    const { rows } = await client.query(
      `INSERT INTO orders
       (id, order_number, user_id, payment_id, status, payment_method, total, customer_email, shipping_address)
       VALUES ($1,$2,$3,$4,'COMPLETED',$5,$6,$7,$8) RETURNING *`,
      [id, orderNumber(), user.id, payment.id, `${payment.method} •••• ${payment.last_four ?? '4242'}`, total, user.email, data.shippingAddress]
    );

    for (const item of items) {
      await client.query('UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2', [item.quantity, item.product.id]);
      await client.query(
        `INSERT INTO order_items (order_id, product_id, name, unit_price, quantity, image_url, game_code)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, item.product.id, item.product.name, item.product.price, item.quantity, item.product.image_url, gameCode()]
      );
    }

    await clearCart(user.id, client);
    return mapOrder(rows[0], await findOrderItems(id, client));
  });
}

export async function getOrder(user, id) {
  const { rows } = await query('SELECT * FROM orders WHERE id = $1 AND (user_id = $2 OR $3 = \'ADMIN\')', [id, user.id, user.role]);
  if (!rows[0]) throw new AppError(404, 'Pedido no encontrado.');
  return mapOrder(rows[0], await findOrderItems(id));
}

export async function listOrders(user) {
  const { rows } = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [user.id]);
  return Promise.all(rows.map(async (row) => mapOrder(row, await findOrderItems(row.id))));
}

