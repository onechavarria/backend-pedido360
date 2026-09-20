import { query } from '../../config/database.js';

const select = `
  SELECT id, name AS nombre, description AS descripcion, price::float AS precio,
         stock, image_url AS "imagenUrl", category AS categoria,
         release_date AS "fechaLanzamiento", active AS activo
  FROM products`;

// El repositorio traduce snake_case de PostgreSQL al modelo esperado por Angular.
export async function listProducts(search = '') {
  const { rows } = await query(
    `${select}
     WHERE active = TRUE AND ($1 = '' OR name ILIKE '%' || $1 || '%' OR category ILIKE '%' || $1 || '%')
     ORDER BY id`,
    [search]
  );
  return rows;
}

export async function findProduct(id, client = { query }) {
  const { rows } = await client.query(`${select} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function createProduct(data) {
  const { rows } = await query(
    `INSERT INTO products (name, description, price, stock, category, image_url, release_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [data.name, data.description, data.price, data.stock, data.category, data.imageUrl ?? null, data.releaseDate ?? null]
  );
  return findProduct(rows[0].id);
}

export async function updateProduct(id, data) {
  const mapping = { name: 'name', description: 'description', price: 'price', stock: 'stock', category: 'category', imageUrl: 'image_url', releaseDate: 'release_date', active: 'active' };
  const entries = Object.entries(data);
  const sets = entries.map(([key], index) => `${mapping[key]} = $${index + 1}`);
  const values = entries.map(([, value]) => value);
  await query(`UPDATE products SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length + 1}`, [...values, id]);
  return findProduct(id);
}

export async function archiveProduct(id) {
  const { rowCount } = await query('UPDATE products SET active = FALSE, updated_at = NOW() WHERE id = $1', [id]);
  return rowCount > 0;
}

