import { pool } from '../config/database.js';
import { products } from './products.data.js';

// El upsert actualiza la información comercial sin reiniciar el stock ya descontado.
const sql = `
  INSERT INTO products (name, description, price, stock, category, image_url, release_date)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    price = VALUES(price),
    category = VALUES(category),
    image_url = VALUES(image_url),
    release_date = VALUES(release_date),
    active = TRUE,
    updated_at = CURRENT_TIMESTAMP(3)
`;

try {
  for (const product of products) await pool.query(sql, product);
  console.log(`${products.length} productos preparados.`);
} finally {
  await pool.end();
}
