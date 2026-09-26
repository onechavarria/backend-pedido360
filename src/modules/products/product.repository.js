import { query } from '../../config/database.js';

const select = `
  SELECT id, name AS nombre, description AS descripcion, CAST(price AS DOUBLE) AS precio,
         stock, image_url AS imagenUrl, category AS categoria,
         release_date AS fechaLanzamiento, active AS activo
  FROM products`;

// El repositorio traduce snake_case de MySQL al modelo esperado por Angular.
export async function listProducts(search = '') {
  const { rows } = await query(
    `${select}
     WHERE active = TRUE
       AND (? = '' OR LOWER(name) LIKE CONCAT('%', LOWER(?), '%')
                    OR LOWER(category) LIKE CONCAT('%', LOWER(?), '%'))
     ORDER BY id`,
    [search, search, search]
  );
  return rows;
}

export async function findProduct(id, client = { query }) {
  const { rows } = await client.query(`${select} WHERE id = ?`, [id]);
  return rows[0] ?? null;
}

export async function createProduct(data) {
  const { insertId } = await query(
    `INSERT INTO products (name, description, price, stock, category, image_url, release_date)
     VALUES (?,?,?,?,?,?,?)`,
    [data.name, data.description, data.price, data.stock, data.category, data.imageUrl ?? null, data.releaseDate ?? null]
  );
  return findProduct(insertId);
}

export async function updateProduct(id, data) {
  const mapping = { name: 'name', description: 'description', price: 'price', stock: 'stock', category: 'category', imageUrl: 'image_url', releaseDate: 'release_date', active: 'active' };
  const entries = Object.entries(data);
  const sets = entries.map(([key]) => `${mapping[key]} = ?`);
  const values = entries.map(([, value]) => value);
  await query(`UPDATE products SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`, [...values, id]);
  return findProduct(id);
}

export async function archiveProduct(id) {
  const { rowCount } = await query('UPDATE products SET active = FALSE, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?', [id]);
  return rowCount > 0;
}
