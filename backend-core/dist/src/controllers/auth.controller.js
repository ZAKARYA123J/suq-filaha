import { AuthService } from '../services/auth.service';
const authService = new AuthService();
export class AuthController {
    async login(req, res) {
        try {
            const result = await authService.login(req.body);
            res.json(result);
        }
        catch (error) {
            res.status(401).json({ error: error.message });
        }
    }
    async sendOtp(req, res) {
        try {
            const result = await authService.sendOtp(req.body.phoneNumber);
            res.json(result);
        }
        catch (error) {
            res.status(401).json({ error: error.message });
        }
    }
    async verifyOtp(req, res) {
        try {
            const result = await authService.verifyOtp(req.body.phoneNumber, req.body.code);
            res.json(result);
        }
        catch (error) {
            res.status(401).json({ error: error.message });
        }
    }
    async createPassword(req, res) {
        try {
            const result = await authService.createPassword(req.body);
            res.status(201).json(result);
        }
        catch (error) {
            if (error.message === 'Phone number not verified') {
                return res.status(403).json({ error: error.message });
            }
            if (error.message === 'User already exists') {
                return res.status(409).json({ error: error.message });
            }
            res.status(400).json({ error: error.message });
        }
    }
    async getProfile(req, res) {
        try {
            const user = await authService.getUserProfile(req.user.userId);
            res.json(user);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async updateProfile(req, res) {
        try {
            const user = await authService.updateProfile(req.user.userId, req.body);
            res.json(user);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
