import prisma from '../config/database';
import { CreateProductInput, UpdateProductInput } from '../validators/product.validator';

export class ProductService {
  async createProduct(farmerId: string, data: CreateProductInput) {
    return await prisma.product.create({
      data: {
        ...data,
        farmerId,
        images: data.images || [],
      },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            location: true,
            rating: true,
          },
        },
      },
    });
  }

  async getProducts(filters?: {
    category?: string;
    farmerId?: string;
    isAvailable?: boolean;
  }) {
    return await prisma.product.findMany({
      where: filters,
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            location: true,
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getProductById(productId: string) {
    return await prisma.product.findUnique({
      where: { id: productId },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            location: true,
            rating: true,
            phoneNumber: true,
          },
        },
        orders: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
                orderDate: true,
              },
            },
          },
        },
        negotiations: {
          where: {
            status: {
              in: ['PENDING', 'COUNTERED'],
            },
          },
          select: {
            id: true,
            status: true,
            proposedPrice: true,
          },
        },
      },
    });
  }

  async updateProduct(productId: string, farmerId: string, data: UpdateProductInput) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.farmerId !== farmerId) {
      throw new Error('Product not found or unauthorized');
    }

    return await prisma.product.update({
      where: { id: productId },
      data,
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            location: true,
            rating: true,
          },
        },
      },
    });
  }

  async deleteProduct(productId: string, farmerId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.farmerId !== farmerId) {
      throw new Error('Product not found or unauthorized');
    }

    return await prisma.product.delete({
      where: { id: productId },
    });
  }

  async searchProducts(searchTerm: string, filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    isAvailable?: boolean;
  }) {
    return await prisma.product.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { category: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
          filters?.category ? { category: filters.category } : {},
          filters?.minPrice ? { price: { gte: filters.minPrice } } : {},
          filters?.maxPrice ? { price: { lte: filters.maxPrice } } : {},
          filters?.isAvailable !== undefined ? { isAvailable: filters.isAvailable } : {},
        ],
      },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            location: true,
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getFarmerProducts(farmerId: string, isAvailable?: boolean) {
    return await prisma.product.findMany({
      where: {
        farmerId,
        ...(isAvailable !== undefined && { isAvailable }),
      },
      include: {
        orders: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
                totalAmount: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async toggleProductAvailability(productId: string, farmerId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.farmerId !== farmerId) {
      throw new Error('Product not found or unauthorized');
    }

    return await prisma.product.update({
      where: { id: productId },
      data: {
        isAvailable: !product.isAvailable,
      },
    });
  }

  async getProductsByCategory(category: string) {
    return await prisma.product.findMany({
      where: {
        category,
        isAvailable: true,
      },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            location: true,
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}