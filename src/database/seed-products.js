import { pool } from '../config/database.js';
import { products } from './products.data.js';

// El upsert actualiza la información comercial sin reiniciar el stock ya descontado.
const sql = `
  INSERT INTO products (name, description, price, stock, category, image_url, release_date)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category = EXCLUDED.category,
    image_url = EXCLUDED.image_url,
    release_date = EXCLUDED.release_date,
    active = TRUE,
    updated_at = NOW()
`;

try {
  for (const product of products) await pool.query(sql, product);
  console.log(`${products.length} productos preparados.`);
} finally {
  await pool.end();
}
