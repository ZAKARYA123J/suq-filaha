import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserService } from '@/services/user.service';

const userService = new UserService();

export class UserController {
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await userService.getUserProfile(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  async getFarmers(_req: AuthRequest, res: Response) {
    try {
      // const userId = req.user?.userId;
      // if (!userId) {
      //   return res.status(401).json({ error: 'Unauthorized' });
      // }

      const user = await userService.getFarmers();
      // if (!user) {
      //   return res.status(404).json({ error: 'User not found' });
      // }

      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUserById(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const user = await userService.getUserProfile(userId as string);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const updatedUser = await userService.updateProfile(userId, req.body);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async uploadAvatar(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const imageUrl = (req.file as any).path;

      // Update user's profileInfo with the image URL (as we don't have a profileImage field and cannot modify schema)
      // Actually, we could store it as a JSON in profileInfo or just the URL.
      // Let's just store the URL in profileInfo for now.
      const updatedUser = await userService.updateProfile(userId, { profileInfo: imageUrl });

      res.json({
        message: 'Avatar uploaded successfully',
        imageUrl: imageUrl,
        user: updatedUser
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getReviews(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.userId as string;
      const reviews = await userService.getReviews(userId);
      res.json(reviews);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
