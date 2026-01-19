import { jest, describe, it, expect, beforeAll } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Mock UserService BEFORE importing app
jest.unstable_mockModule('@/services/user.service', () => ({
    UserService: jest.fn().mockImplementation(() => ({
        getUserProfile: jest.fn().mockImplementation(() => Promise.resolve({
            id: 'user-123',
            name: 'John Doe',
            phoneNumber: '1234567890',
            userType: 'FARMER',
            rating: 4.5,
            profileInfo: 'Farmer since 2010',
        })),
        updateProfile: jest.fn().mockImplementation(() => Promise.resolve({
            id: 'user-123',
            name: 'John Doe Updated',
            phoneNumber: '1234567890',
            userType: 'FARMER',
        })),
        getReviews: jest.fn().mockImplementation(() => Promise.resolve([
            { id: 'rev-1', rating: 5, comment: 'Great service', reviewer: { name: 'Alice' } }
        ])),
    })),
}));

// Mock Cloudinary BEFORE importing app
jest.unstable_mockModule('../src/config/cloudinary', () => ({
    cloudinary: {},
    storage: {}
}));

describe('User Profile APIs', () => {
    let app: any;
    let request: any;
    const testUser = { userId: 'user-123', userType: 'FARMER' };
    const secret = 'test-secret'; // Match setup.ts
    const token = jwt.sign(testUser, secret);

    beforeAll(async () => {
        const supertest = await import('supertest');
        request = supertest.default;
        const appModule = await import('../src/app');
        app = appModule.default;
    });

    it('should get current user profile', async () => {
        const res = await request(app)
            .get('/api/users/profile/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe('user-123');
    });

    it('should return 401 if no token provided', async () => {
        const res = await request(app).get('/api/users/profile/me');
        expect(res.status).toBe(401);
    });

    it('should update user profile', async () => {
        const res = await request(app)
            .put('/api/users/profile/update')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'John Doe Updated' });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('John Doe Updated');
    });

    it('should get user reviews', async () => {
        const res = await request(app)
            .get('/api/users/user-123/reviews');

        expect(res.status).toBe(200);
        expect(res.body[0].comment).toBe('Great service');
    });
});
