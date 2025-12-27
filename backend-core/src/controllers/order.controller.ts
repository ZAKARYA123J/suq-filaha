import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { OrderService } from '../services/order.service';

const orderService = new OrderService();

export class OrderController {
  async create(req: AuthRequest, res: Response) {
    try {
      const order = await orderService.createOrder(req.user!.userId, req.body);
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: AuthRequest, res: Response) {
    try {
      const orders = await orderService.getOrders(
        req.user!.userId,
        req.user!.userType
      );
      res.json(orders);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const order = await orderService.updateOrderStatus(
        req.params.id,
        req.user!.userId,
        req.body.status
      );
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}