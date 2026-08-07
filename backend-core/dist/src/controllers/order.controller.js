import { OrderService } from '../services/order.service';
const orderService = new OrderService();
export class OrderController {
    async create(req, res) {
        try {
            const order = await orderService.createOrder(req.user.userId, req.body);
            res.status(201).json(order);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAll(req, res) {
        try {
            const orders = await orderService.getOrders(req.user.userId, req.user.userType);
            res.json(orders);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getById(req, res) {
        try {
            const order = await orderService.getOrderById(req.params.id);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }
            res.json(order);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async updateStatus(req, res) {
        try {
            const order = await orderService.updateOrderStatus(req.params.id, req.user.userId, req.body.status);
            res.json(order);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
