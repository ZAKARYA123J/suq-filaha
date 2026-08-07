export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
    unit: string;
    images: string[];
    isAvailable: boolean;
    farmerId: string;
    description?: string;
    farmerName?: string;
    farmerLocation?: string; 
    harvestDate?: string;
    quality?: string;
}

export interface OrderItem {
    id?: string;
    productId: string;
    productName?: string;
    quantity: number;
    price: number;
    total: number;
}
export interface Farmer{
    id?:string
    profileInfo?:string
    name?:string
    mainCrop?:string
    orderCount?:string
}
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
    id: string;
    buyerId: string;
    farmerId: string;
    totalAmount: number;
    status: OrderStatus;
    items: OrderItem[];
    createdAt: string;
}

export interface CartItem extends Product {
    cartQuantity: number;
}

export interface ProductFilter {
    category?: string;
    search?: string;
    farmerId?: string;
    isAvailable?: boolean;
}
