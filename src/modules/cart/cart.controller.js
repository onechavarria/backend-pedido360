import * as service from './cart.service.js';

export async function get(req, res) { res.json(await service.getCart(req.user.id)); }
export async function add(req, res) { res.status(201).json(await service.addItem(req.user.id, req.body)); }
export async function update(req, res) { res.json(await service.updateItem(req.user.id, req.params.productId, req.body.quantity)); }
export async function remove(req, res) { res.json(await service.removeItem(req.user.id, req.params.productId)); }
export async function clear(req, res) { await service.clearCart(req.user.id); res.status(204).send(); }

