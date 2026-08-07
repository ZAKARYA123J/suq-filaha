import prisma from '../config/database';
export class ProductService {
    async createProduct(farmerId, data) {
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
    async getProducts(filters) {
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
    async getProductById(productId) {
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
    async updateProduct(productId, farmerId, data) {
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
    async deleteProduct(productId, farmerId) {
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
    async searchProducts(searchTerm, filters) {
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
    async getFarmerProducts(farmerId, isAvailable) {
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
    async toggleProductAvailability(productId, farmerId) {
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
    async getProductsByCategory(category) {
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
