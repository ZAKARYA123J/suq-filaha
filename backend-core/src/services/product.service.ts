import prisma from '../config/database';
import { CreateProductInput, UpdateProductInput } from '../validators/product.validator';
import multer from 'multer';
import { storage } from '../config/cloudinary';

export const uploadProductImages = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per image
  },
}).array('images', 5);
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
  async getProductsAvailable(filters?: {
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
      where: { id: productId},
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
              in: ['PENDING'],
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

// Before the prisma.product.update() call, you need to construct the data object

async updateProduct(
  productId: string,
  farmerId: string,
  updateData: any, // This should be the parsed FormData
  files?: Express.Multer.File[]
) {
  // Verify ownership
  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!existingProduct || existingProduct.farmerId !== farmerId) {
    throw new Error('Product not found or unauthorized');
  }

  // ✅ Construct the data object for Prisma
  const data: any = {};

  // Add fields only if they exist in updateData
  if (updateData.name) data.name = updateData.name;
  if (updateData.category) data.category = updateData.category;
  if (updateData.description) data.description = updateData.description;
  if (updateData.price) data.price = parseFloat(updateData.price);
  if (updateData.quantity) data.quantity = parseFloat(updateData.quantity);
  if (updateData.unit) data.unit = updateData.unit;
  if (updateData.quality) data.quality = updateData.quality;
  if (updateData.harvestDate) data.harvestDate = new Date(updateData.harvestDate);

  // Handle image uploads if new images are provided
  if (files && files.length > 0) {
    const imageUrls = files.map(file => file.path || file.filename);
    data.images = imageUrls;
  }

  // ✅ Now update with the constructed data
  return await prisma.product.update({
    where: {
      id: productId,
    },
    data, // ✅ This was missing!
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

  // ✅ Soft delete - just mark as unavailable and add a deletedAt timestamp
  return await prisma.product.update({
    where: { id: productId },
    data: {
      isAvailable: false,
 
    },
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