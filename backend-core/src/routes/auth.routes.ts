import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { loginSchema, sendOtp, verifyOtp, createPasswordSchema } from '../validators/auth.validator';

const router = Router();
const authController = new AuthController();

// Registration flow
router.post('/send-otp', validate(sendOtp), authController.sendOtp);
router.post('/verify-otp', validate(verifyOtp), authController.verifyOtp);
router.post('/register', validate(createPasswordSchema), authController.createPassword);

// Login
router.post('/login', validate(loginSchema), authController.login);

// Profile management
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

export default router;
