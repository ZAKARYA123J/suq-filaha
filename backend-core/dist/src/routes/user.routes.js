import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import multer from 'multer';
import { storage } from '../config/cloudinary';
const router = Router();
const userController = new UserController();
const upload = multer({ storage });
// Public routes
router.get('/:userId', userController.getUserById);
router.get('/:userId/reviews', userController.getReviews);
// Protected routes
router.get('/profile/me', authenticate, userController.getProfile);
router.put('/profile/update', authenticate, userController.updateProfile);
router.post('/profile/avatar', authenticate, upload.single('avatar'), userController.uploadAvatar);
export default router;
