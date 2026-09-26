import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from '../config/database.js';

// La migración MySQL es visible para facilitar el aprendizaje y despliegue.
const currentDir = dirname(fileURLToPath(import.meta.url));
const sql = await readFile(join(currentDir, 'migrations', '001_initial.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('Base de datos migrada correctamente.');
} finally {
  await pool.end();
}
