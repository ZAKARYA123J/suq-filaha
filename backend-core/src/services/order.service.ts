import prisma from '../config/database';
import { CreateOrderInput } from '../validators/order.validator';
import { realtimeClient } from './realtime.client';

// Define the OrderItem type for better type safety


interface OrderItemInput {
  productId: string;
  quantity: number; // Should match your schema (Float or Int)
  price: number;
  notes?: string;
}

export class OrderService {
async createOrder(buyerId: string, data: CreateOrderInput) {
  try {
    // Parse items safely
    let items: OrderItemInput[];
    try {
      items = Array.isArray(data.items) 
        ? data.items 
        : JSON.parse(data.items);
    } catch (error) {
      throw new Error('Invalid items format. Must be array or JSON array string');
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Items must be a non-empty array');
    }

    // Fetch all products for validation
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { 
        id: { in: productIds }
      },
      include: {
        farmer: {
          select: { id: true, name: true, phoneNumber: true },
        },
      },
    });

    // Check all products exist and are available
    const productMap = new Map();
    for (const product of products) {
      productMap.set(product.id, product);
    }

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      if (!product.isAvailable) {
        throw new Error(`Product ${product.name} is not available`);
      }
    }

    // Verify all items belong to the same farmer
    const uniqueFarmerIds = [...new Set(products.map(p => p.farmerId))];
    if (uniqueFarmerIds.length > 1) {
      throw new Error('All items must belong to the same farmer');
    }
    
    const farmerId = uniqueFarmerIds[0];

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);

    // Create order with items - JUST use buyerId, NOT buyer relation
    const order = await prisma.order.create({
      data: {
        buyerId, // This is sufficient - Prisma handles the relation via foreign key
        farmerId,
        status: 'PENDING',
        totalAmount,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price,
            notes: item.notes,
          })),
        },
        // NO buyer: { connect: ... } needed here
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        buyer: {
          select: { id: true, name: true, phoneNumber: true },
        },
        farmer: {
          select: { id: true, name: true, phoneNumber: true },
        },
      },
    });

    return order;
    
  } catch (error) {
    // Handle specific Prisma errors
    // if (error instanceof Prisma.PrismaClientKnownRequestError) {
    //   if (error.code === 'P2003') {
    //     throw new Error('Foreign key constraint failed. Check if buyer/farmer exists');
    //   }
    //   if (error.code === 'P2002') {
    //     throw new Error('Unique constraint failed');
    //   }
    // }
    throw error;
  }
}

  async getOrders(userId: string, userType: string) {
    const where = userType === 'FARMER' ? { farmerId: userId } : { buyerId: userId };

    return await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        buyer: {
          select: { id: true, name: true, phoneNumber: true },
        },
        farmer: {
          select: { id: true, name: true, phoneNumber: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  
  async getOrderById(orderId: string) {
    return await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        buyer: {
          select: { id: true, name: true, phoneNumber: true },
        },
        farmer: {
          select: { id: true, name: true, phoneNumber: true },
        },
        review: true,
      },
    });
  }

  async updateOrderStatus(orderId: string, userId: string, status: string) {
    // Verify order exists and user has permission
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        farmer: true,
      },
    });

    if (!order || (order.farmerId !== userId && order.buyerId !== userId)) {
      throw new Error('Order not found or unauthorized');
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as any }, // Cast to OrderStatus enum
      include: {
        items: {
          include: {
            product: true,
          },
        },
        buyer: {
          select: { id: true, name: true, phoneNumber: true },
        },
        farmer: {
          select: { id: true, name: true, phoneNumber: true },
        },
      },
    });

    // Send real-time notifications to both parties
    // await realtimeClient.notifyUser(order.buyerId, 'order_update', {
    //   type: 'status_change',
    //   orderId: order.id,
    //   status: status,
    //   message: `Order status updated to ${status}`,
    // });

    // await realtimeClient.notifyUser(order.farmerId, 'order_update', {
    //   type: 'status_change',
    //   orderId: order.id,
    //   status: status,
    //   message: `Order status updated to ${status}`,
    // });

    return updatedOrder;
  }

  async cancelOrder(orderId: string, userId: string) {
    return this.updateOrderStatus(orderId, userId, 'CANCELLED');
  }

  async getOrdersByStatus(userId: string, userType: string, status: string) {
    const where = {
      ...(userType === 'FARMER' ? { farmerId: userId } : { buyerId: userId }),
      status: status as any,
    };

    return await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        buyer: {
          select: { id: true, name: true, phoneNumber: true },
        },
        farmer: {
          select: { id: true, name: true, phoneNumber: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}