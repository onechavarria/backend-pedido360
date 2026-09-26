import crypto from 'node:crypto';
import { query, withTransaction } from '../../config/database.js';
import { AppError } from '../../shared/errors/app-error.js';

async function cartIdForUser(userId, client = { query }) {
  let result = await client.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
  if (!result.rows[0]) {
    const id = crypto.randomUUID();
    await client.query('INSERT INTO carts (id, user_id) VALUES (?, ?)', [id, userId]);
    result = { rows: [{ id }] };
  }
  return result.rows[0].id;
}

// Devuelve el carrito junto con su subtotal calculado desde los datos de MySQL.
export async function getCart(userId, client = { query }) {
  const cartId = await cartIdForUser(userId, client);
  const { rows } = await client.query(
    `SELECT p.id, p.name AS nombre, p.description AS descripcion, CAST(p.price AS DOUBLE) AS precio,
            p.stock, p.image_url AS imagenUrl, p.category AS categoria,
            p.release_date AS fechaLanzamiento, ci.quantity AS cantidad
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = ? ORDER BY p.id`,
    [cartId]
  );
  return {
    items: rows,
    total: rows.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
  };
}

export async function addItem(userId, { productId, quantity }) {
  return withTransaction(async (client) => {
    const product = await client.query('SELECT stock, active FROM products WHERE id = ? FOR UPDATE', [productId]);
    if (!product.rows[0]?.active) throw new AppError(404, 'Producto no encontrado.');

    const cartId = await cartIdForUser(userId, client);
    const current = await client.query('SELECT quantity FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, productId]);
    const nextQuantity = (current.rows[0]?.quantity ?? 0) + quantity;
    if (nextQuantity > product.rows[0].stock) throw new AppError(409, 'No existe stock suficiente.');

    await client.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
      [cartId, productId, nextQuantity]
    );
    return getCart(userId, client);
  });
}

export async function updateItem(userId, productId, quantity) {
  return withTransaction(async (client) => {
    const cartId = await cartIdForUser(userId, client);
    const { rows } = await client.query('SELECT stock FROM products WHERE id = ?', [productId]);
    if (!rows[0]) throw new AppError(404, 'Producto no encontrado.');
    if (quantity > rows[0].stock) throw new AppError(409, 'No existe stock suficiente.');
    const result = await client.query('UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?', [quantity, cartId, productId]);
    if (!result.rowCount) throw new AppError(404, 'El producto no está en el carrito.');
    return getCart(userId, client);
  });
}

export async function removeItem(userId, productId) {
  const cartId = await cartIdForUser(userId);
  await query('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, productId]);
  return getCart(userId);
}

export async function clearCart(userId, client = { query }) {
  const cartId = await cartIdForUser(userId, client);
  await client.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
}
