import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';

const router = Router();
const productController = new ProductController();

router.post(
  '/',
  authenticate,
  authorize('farmer'),
  validate(createProductSchema),
  productController.create
);
router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.put(
  '/:id',
  authenticate,
  authorize('farmer'),
  validate(updateProductSchema),
  productController.update
);
router.delete('/:id', authenticate, authorize('farmer'), productController.delete);

export default router;