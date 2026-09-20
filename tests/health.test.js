import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

// Variables aisladas: importar app no requiere abrir una conexión a PostgreSQL.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pedidos360_test';
process.env.JWT_SECRET = 'test-secret-with-more-than-thirty-two-characters';
const { app } = await import('../src/app.js');

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

test('expone el estado de los proveedores OAuth', async () => {
  const response = await request(app).get('/api/v1/auth/providers');
  assert.equal(response.status, 200);
  assert.equal(response.body.providers.length, 5);
});
