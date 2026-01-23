import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { NegotiationService } from '../services/negotiation.service';

const negotiationService = new NegotiationService();

export class NegotiationController {
  async getUserNegotiations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const negotiations = await negotiationService.getUserNegotiations(userId);
      res.json(negotiations);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async createNegotiation(req: AuthRequest, res: Response) {
    try {
      const buyerId = req.user!.userId;
      const { productId, proposedPrice } = req.body;
      const negotiation = await negotiationService.createNegotiation(
        buyerId,
        productId,
        proposedPrice
      );
      res.status(201).json(negotiation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getNegotiation(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const negotiationId = req.params.id as string;

      const negotiation = await negotiationService.getNegotiationById(negotiationId);
      if (!negotiation) {
        return res.status(404).json({ error: 'Negotiation not found' });
      }

      if (negotiation.buyerId !== userId && negotiation.farmerId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      res.json(negotiation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getNegotiationMessages(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const negotiationId = req.params.id as string;

      const negotiation = await negotiationService.getNegotiationById(negotiationId);
      if (!negotiation) {
        return res.status(404).json({ error: 'Negotiation not found' });
      }

      if (negotiation.buyerId !== userId && negotiation.farmerId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const messages = await negotiationService.getNegotiationMessages(negotiationId);
      res.json(messages);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async addMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const negotiationId = req.params.id as string;
      const { content } = req.body;

      const message = await negotiationService.addMessage(negotiationId, userId, content);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateProposedPrice(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const negotiationId = req.params.id as string;
      const { proposedPrice } = req.body;

      const negotiation = await negotiationService.updateProposedPrice(
        negotiationId,
        userId,
        proposedPrice
      );

      res.json(negotiation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const negotiationId = req.params.id as string;
      const { status } = req.body;

      const negotiation = await negotiationService.updateStatus(
        negotiationId,
        userId,
        status
      );

      res.json(negotiation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
