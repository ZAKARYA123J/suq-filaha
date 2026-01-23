import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';
import { ProductFilter } from '../types';

// Update this to your backend URL
const API_BASE_URL = 'https://macbook.euplectes-rockhopper.ts.net/api';

class ApiClient {
    public client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });

        // Request interceptor to add auth token
        this.client.interceptors.request.use(
            (config) => {
                const token = useAuthStore.getState().token;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                if (error.response?.status === 401) {
                    // Token expired or invalid
                    await useAuthStore.getState().logout();
                }
                return Promise.reject(error);
            }
        );
    }

    // Auth endpoints
    async sendOtp(phoneNumber: string) {
        const response = await this.client.post('/auth/send-otp', { phoneNumber });
        return response.data;
    }

    async verifyOtp(phoneNumber: string, code: string) {
        const response = await this.client.post('/auth/verify-otp', {
            phoneNumber,
            code,
        });
        return response.data;
    }

    async register(data: {
        phoneNumber: string;
        password: string;
        name: string;
        userType: 'FARMER' | 'BUYER';
        location?: string;
    }) {
        const response = await this.client.post('/auth/register', data);
        return response.data;
    }

    async login(phoneNumber: string, password: string) {
        const response = await this.client.post('/auth/login', {
            phoneNumber,
            password,
        });
        return response.data;
    }

    async getMyProfile() {
        const response = await this.client.get('/users/profile/me');
        return response.data;
    }

    async updateMyProfile(data: any) {
        const response = await this.client.put('/users/profile/update', data);
        return response.data;
    }

    async uploadAvatar(formData: FormData) {
        const response = await this.client.post('/users/profile/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async getUserReviews(userId: string) {
        const response = await this.client.get(`/users/${userId}/reviews`);
        return response.data;
    }

    // Product endpoints
    async getProducts(params?: ProductFilter) {
        const response = await this.client.get('/products', { params });
        return response.data;
    }

    async getProduct(id: string) {
        const response = await this.client.get(`/products/${id}`);
        return response.data;
    }

    async createProduct(data: FormData) {
        const response = await this.client.post('/products', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async updateProduct(id: string, data: FormData) {
        const response = await this.client.put(`/products/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async deleteProduct(id: string) {
        const response = await this.client.delete(`/products/${id}`);
        return response.data;
    }

    async toggleProductAvailability(id: string) {
        const response = await this.client.patch(`/products/${id}/toggle-availability`);
        return response.data;
    }

    async getMyProducts(isAvailable?: boolean) {
        const params = isAvailable !== undefined ? { isAvailable } : {};
        const response = await this.client.get('/products/my-products', { params });
        return response.data;
    }

    // Order endpoints
    async createOrder(data: {
        farmerId: string;
        items: { productId: string; quantity: number }[];
    }) {
        const response = await this.client.post('/orders', data);
        return response.data;
    }

    async getOrders() {
        const response = await this.client.get('/orders');
        return response.data;
    }

    async getOrder(id: string) {
        const response = await this.client.get(`/orders/${id}`);
        return response.data;
    }

    async createNegotiation(data: { productId: string; proposedPrice: number }) {
        const response = await this.client.post('/negotiations', data);
        return response.data;
    }

    async getNegotiations() {
        const response = await this.client.get('/negotiations');
        return response.data;
    }

    async getNegotiation(id: string) {
        const response = await this.client.get(`/negotiations/${id}`);
        return response.data;
    }

    async getNegotiationMessages(id: string) {
        const response = await this.client.get(`/negotiations/${id}/messages`);
        return response.data;
    }

    async sendNegotiationMessage(id: string, content: string) {
        const response = await this.client.post(`/negotiations/${id}/messages`, { content });
        return response.data;
    }

    async updateNegotiationStatus(
        id: string,
        status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED'
    ) {
        const response = await this.client.patch(`/negotiations/${id}/status`, { status });
        return response.data;
    }

    async updateNegotiationProposedPrice(id: string, proposedPrice: number) {
        const response = await this.client.patch(`/negotiations/${id}/proposed-price`, { proposedPrice });
        return response.data;
    }
    async getFarmers() {
        const response = await this.client.get(`/users/farmers`);
        return response.data;
    }
}

export const apiClient = new ApiClient();

// Helper function to extract error message
export const getErrorMessage = (error: any): string => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.error || error.message || 'An error occurred';
    }
    return error.message || 'An unknown error occurred';
};
