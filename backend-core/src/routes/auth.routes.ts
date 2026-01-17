import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { registerSchema, loginSchema,sendOtp,verifyOtp } from '../validators/auth.validator';

const router = Router();
const authController = new AuthController();

// router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/sendotp', validate(sendOtp), authController.sendOtp);
router.post('/verifyotp', validate(verifyOtp), authController.verifyOtp);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

export default router;
