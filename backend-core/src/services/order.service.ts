import prisma from '../config/database';
import { CreateOrderInput } from '../validators/order.validator';
import { realtimeClient } from './realtime.client';

// Define the OrderItem type for better type safety
interface OrderItemInput {
  productId: string;
  quantity: number;
  price: number;
  notes?: string;
}

export class OrderService {
  async createOrder(buyerId: string, data: CreateOrderInput) {
    // Ensure items is an array
    const items: OrderItemInput[] = Array.isArray(data.items) 
      ? data.items 
      : JSON.parse(data.items);

    // Fetch product and verify availability
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      include: {
        farmer: {
          select: { id: true, name: true, phoneNumber: true },
        },
      },
    });

    if (!product || !product.isAvailable) {
      throw new Error('Product not available');
    }

    // Calculate total amount from items
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);

    // Create order with items
    const order = await prisma.order.create({
      data: {
        buyerId,
        farmerId: product.farmerId,
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

    // Send real-time notification to farmer
    await realtimeClient.notifyUser(order.farmerId, 'order_update', {
      type: 'new_order',
      orderId: order.id,
      message: `New order from ${order.buyer.name}`,
      order: order,
    });

    return order;
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
    await realtimeClient.notifyUser(order.buyerId, 'order_update', {
      type: 'status_change',
      orderId: order.id,
      status: status,
      message: `Order status updated to ${status}`,
    });

    await realtimeClient.notifyUser(order.farmerId, 'order_update', {
      type: 'status_change',
      orderId: order.id,
      status: status,
      message: `Order status updated to ${status}`,
    });

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