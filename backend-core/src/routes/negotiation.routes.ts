import { Router } from 'express';
import { NegotiationController } from '../controllers/negotiation.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
  createNegotiationSchema,
  createNegotiationMessageSchema,
  updateNegotiationStatusSchema,
  updateNegotiationProposedPriceSchema,
} from '../validators/negotiation.validator';

const router = Router();
const negotiationController = new NegotiationController();

router.get('/', authenticate, negotiationController.getUserNegotiations);
router.post('/', authenticate, validate(createNegotiationSchema), negotiationController.createNegotiation);
router.get('/:id', authenticate, negotiationController.getNegotiation);
router.get('/:id/messages', authenticate, negotiationController.getNegotiationMessages);
router.post(
  '/:id/messages',
  authenticate,
  validate(createNegotiationMessageSchema),
  negotiationController.addMessage
);
router.patch(
  '/:id/proposed-price',
  authenticate,
  validate(updateNegotiationProposedPriceSchema),
  negotiationController.updateProposedPrice
);
router.patch(
  '/:id/status',
  authenticate,
  validate(updateNegotiationStatusSchema),
  negotiationController.updateStatus
);

export default router;
