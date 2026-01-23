import prisma from '../config/database';

export class NegotiationService {
  async getUserNegotiations(userId: string) {
    return await prisma.negotiation.findMany({
      where: {
        OR: [{ buyerId: userId }, { farmerId: userId }],
      },
      include: {
        product: {
          include: {
            farmer: {
              select: {
                id: true,
                name: true,
                profileInfo: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            profileInfo: true,
          },
        },
        farmer: {
          select: {
            id: true,
            name: true,
            profileInfo: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async getNegotiationById(negotiationId: string) {
    return await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: {
        product: {
          include: {
            farmer: {
              select: {
                id: true,
                name: true,
                profileInfo: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            profileInfo: true,
          },
        },
        farmer: {
          select: {
            id: true,
            name: true,
            profileInfo: true,
          },
        },
      },
    });
  }

  async getNegotiationMessages(negotiationId: string) {
    return await prisma.negotiationMessage.findMany({
      where: { negotiationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createNegotiation(buyerId: string, productId: string, proposedPrice: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        price: true,
        farmerId: true,
        isAvailable: true,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isAvailable) {
      throw new Error('Product is not available');
    }

    if (product.farmerId === buyerId) {
      throw new Error('You cannot negotiate on your own product');
    }

    const existing = await prisma.negotiation.findFirst({
      where: {
        productId,
        buyerId,
        farmerId: product.farmerId,
        status: 'PENDING',
      },
    });

    if (existing) {
      return existing;
    }

    return await prisma.negotiation.create({
      data: {
        productId,
        buyerId,
        farmerId: product.farmerId,
        originalPrice: product.price,
        proposedPrice,
        status: 'PENDING',
      },
      include: {
        product: {
          include: {
            farmer: {
              select: {
                id: true,
                name: true,
                profileInfo: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            profileInfo: true,
          },
        },
        farmer: {
          select: {
            id: true,
            name: true,
            profileInfo: true,
          },
        },
      },
    });
  }

  async addMessage(negotiationId: string, senderId: string, content: string) {
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      select: {
        id: true,
        buyerId: true,
        farmerId: true,
        status: true,
      },
    });

    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    if (negotiation.status !== 'PENDING') {
      throw new Error('Negotiation is not active');
    }

    if (senderId !== negotiation.buyerId && senderId !== negotiation.farmerId) {
      throw new Error('Unauthorized');
    }

    const senderType = senderId === negotiation.farmerId ? 'FARMER' : 'BUYER';

    return await prisma.negotiationMessage.create({
      data: {
        negotiationId,
        senderId,
        senderType: senderType as any,
        content,
      },
    });
  }

  async updateProposedPrice(negotiationId: string, userId: string, proposedPrice: number) {
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      select: {
        id: true,
        buyerId: true,
        farmerId: true,
        status: true,
      },
    });

    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    if (negotiation.status !== 'PENDING') {
      throw new Error('Negotiation is not active');
    }

    if (userId !== negotiation.buyerId && userId !== negotiation.farmerId) {
      throw new Error('Unauthorized');
    }

    return await prisma.negotiation.update({
      where: { id: negotiationId },
      data: {
        proposedPrice,
      },
    });
  }

  async updateStatus(negotiationId: string, userId: string, status: 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'PENDING') {
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      select: {
        id: true,
        buyerId: true,
        farmerId: true,
        status: true,
      },
    });

    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    if (userId !== negotiation.buyerId && userId !== negotiation.farmerId) {
      throw new Error('Unauthorized');
    }

    if (negotiation.status !== 'PENDING') {
      throw new Error('Negotiation is already ended');
    }

    return await prisma.negotiation.update({
      where: { id: negotiationId },
      data: {
        status,
      },
      include: {
        product: {
          include: {
            farmer: {
              select: {
                id: true,
                name: true,
                profileInfo: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            profileInfo: true,
          },
        },
        farmer: {
          select: {
            id: true,
            name: true,
            profileInfo: true,
          },
        },
      },
    });
  }
}
