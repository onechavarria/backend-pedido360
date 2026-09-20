import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../src/database/products.data.js';

// Esta prueba protege los tres clásicos y sus existencias solicitadas.
test('el catálogo incluye los tres juegos clásicos con su stock correcto', () => {
  const stockByName = new Map(products.map(([name, , , stock]) => [name, stock]));
  assert.equal(stockByName.get('The Legend of Zelda: Ocarina of Time'), 20);
  assert.equal(stockByName.get('Sonic the Hedgehog 2'), 9);
  assert.equal(stockByName.get('Final Fantasy VII'), 12);
});
