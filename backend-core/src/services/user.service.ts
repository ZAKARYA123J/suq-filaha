import prisma from '../config/database';

export class UserService {
    async getUserProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                phoneNumber: true,
                location: true,
                userType: true,
                rating: true,
                profileInfo: true,
                registrationDate: true,
                reviewsReceived: {
                    include: {
                        reviewer: {
                            select: {
                                name: true,
                                profileInfo: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });
        return user;
    }
    async getFarmers() {
        const user = await prisma.user.findMany({
            where: {userType:"FARMER"},
            select: {
                id: true,
                name: true,
                phoneNumber: true,
                location: true,
                userType: true,
                rating: true,
                profileInfo: true,
                registrationDate: true,
                reviewsReceived: {
                    include: {
                        reviewer: {
                            select: {
                                name: true,
                                profileInfo: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });
        return user;
    }

    async updateProfile(userId: string, data: any) {
        return await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                name: true,
                phoneNumber: true,
                location: true,
                userType: true,
                rating: true,
                profileInfo: true,
            },
        });
    }

    async getReviews(userId: string) {
        return await prisma.review.findMany({
            where: { reviewedId: userId },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        name: true,
                        profileInfo: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
}
