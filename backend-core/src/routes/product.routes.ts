import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';
import { uploadProductImages } from '../services/product.service';

const router = Router();
const productController = new ProductController();

// Create product (farmers only)
router.post(
  '/',
  authenticate,
  authorize('FARMER'),
  uploadProductImages,
  // validate(createProductSchema),
  productController.create
);

// Search products (public/authenticated users)
router.get('/search', authenticate, productController.search);

// Get products by category (public/authenticated users)
router.get('/category/:category', authenticate, productController.getByCategory);

// Get farmer's own products (farmers only)
router.get('/my-products', authenticate, authorize('FARMER'), productController.getMyProducts);

// Get specific farmer's products (public/authenticated users)
router.get('/farmer/:farmerId', authenticate, productController.getFarmerProducts);

// Toggle product availability (farmers only)
router.patch(
  '/:id/toggle-availability',
  authenticate,
  authorize('FARMER'),
  productController.toggleAvailability
);

// Get all products (public/authenticated users)
router.get('/', authenticate, productController.getAll);

// Get product by ID (public/authenticated users)
router.get('/:id', authenticate, productController.getById);

// Update product (farmers only)
router.put(
  '/:id',
  authenticate,
  authorize('FARMER'),
    uploadProductImages,

  // validate(updateProductSchema),
  productController.update
);

// Delete product (farmers only)
router.delete('/:id', authenticate, authorize('FARMER'), productController.delete);

export default router;