import * as service from './order.service.js';

export async function create(req, res) { res.status(201).json(await service.createOrder(req.user, req.body)); }
export async function get(req, res) { res.json(await service.getOrder(req.user, req.params.id)); }
export async function list(req, res) { res.json(await service.listOrders(req.user)); }

