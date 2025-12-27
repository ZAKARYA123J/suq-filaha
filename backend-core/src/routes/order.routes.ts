import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/order.validator';

const router = Router();
const orderController = new OrderController();

router.post('/', authenticate, validate(createOrderSchema), orderController.create);
router.get('/', authenticate, orderController.getAll);
router.get('/:id', authenticate, orderController.getById);
router.patch(
  '/:id/status',
  authenticate,
  validate(updateOrderStatusSchema),
  orderController.updateStatus
);

export default router;