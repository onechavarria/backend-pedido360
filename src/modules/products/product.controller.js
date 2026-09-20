import { AppError } from '../../shared/errors/app-error.js';
import * as repository from './product.repository.js';

export async function list(req, res) { res.json(await repository.listProducts(String(req.query.search ?? ''))); }

export async function get(req, res) {
  const product = await repository.findProduct(req.params.id);
  if (!product) throw new AppError(404, 'Producto no encontrado.');
  res.json(product);
}

export async function create(req, res) { res.status(201).json(await repository.createProduct(req.body)); }

export async function update(req, res) {
  if (!(await repository.findProduct(req.params.id))) throw new AppError(404, 'Producto no encontrado.');
  res.json(await repository.updateProduct(req.params.id, req.body));
}

export async function remove(req, res) {
  if (!(await repository.archiveProduct(req.params.id))) throw new AppError(404, 'Producto no encontrado.');
  res.status(204).send();
}

