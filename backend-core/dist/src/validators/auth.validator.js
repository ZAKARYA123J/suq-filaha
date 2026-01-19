// validators/auth.validator.ts
import { z } from 'zod';
export const registerSchema = z.object({
    name: z.string().min(1),
    phoneNumber: z.string().min(10),
    password: z.string().min(6),
    userType: z.enum(['FARMER', 'BUYER', 'ADMIN']),
    location: z.string().optional(),
    profileInfo: z.string().optional(),
});
export const sendOtp = z.object({
    phoneNumber: z.string().min(10),
});
export const verifyOtp = z.object({
    phoneNumber: z.string().min(10),
    code: z.string().min(6).max(6),
});
export const createPasswordSchema = z.object({
    phoneNumber: z.string().min(10),
    password: z.string().min(6),
    name: z.string().min(1),
    userType: z.enum(['FARMER', 'BUYER']),
    location: z.string().optional(),
});
export const loginSchema = z.object({
    phoneNumber: z.string().min(10),
    password: z.string().min(6),
});
