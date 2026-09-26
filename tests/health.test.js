import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

// Variables aisladas: importar app no requiere abrir una conexión a MySQL.
process.env.NODE_ENV = 'test';
process.env.MYSQL_HOST = 'localhost';
process.env.MYSQL_DATABASE = 'pedidos360_test';
process.env.MYSQL_USER = 'pedidos360';
process.env.MYSQL_PASSWORD = 'pedidos360';
process.env.JWT_SECRET = 'test-secret-with-more-than-thirty-two-characters';
const { app } = await import('../src/app.js');
const { registerSchema } = await import('../src/modules/auth/auth.schemas.js');

test('GET /api/health responde correctamente', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('una ruta inexistente responde 404', async () => {
  const response = await request(app).get('/api/ruta-inexistente');
  assert.equal(response.status, 404);
});

test('Swagger publica una especificación OpenAPI', async () => {
  const response = await request(app).get('/api/docs.json');
  assert.equal(response.status, 200);
  assert.equal(response.body.openapi, '3.1.0');
  assert.ok(response.body.paths['/api/v1/productos']);
});

test('Swagger abre con estilos claros por defecto', async () => {
  const response = await request(app).get('/api/docs/');
  assert.equal(response.status, 200);
  assert.match(response.text, /color-scheme:\s*light/);
});

test('expone el estado de los proveedores OAuth', async () => {
  const response = await request(app).get('/api/v1/auth/providers');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.providers.map((provider) => provider.name), ['google', 'github', 'facebook']);
});

test('el registro exige una contraseña de al menos 8 caracteres', () => {
  assert.equal(registerSchema.safeParse({ name: 'Usuario', email: 'user@example.com', password: '1234567' }).success, false);
  assert.equal(registerSchema.safeParse({ name: 'Usuario', email: 'user@example.com', password: '12345678' }).success, true);
});
