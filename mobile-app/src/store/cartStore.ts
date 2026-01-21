import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, CartItem } from '../types';

interface CartState {
    items: CartItem[];
    total: number;
    itemCount: number;
    
    // Actions
    addToCart: (product: Product, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getCartTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            total: 0,
            itemCount: 0,

            addToCart: (product: Product, quantity: number) => {
                const { items } = get();
                const existingItemIndex = items.findIndex(item => item.id === product.id);

                if (existingItemIndex >= 0) {
                    // Update existing item
                    const updatedItems = [...items];
                    updatedItems[existingItemIndex].cartQuantity += quantity;
                    
                    set({
                        items: updatedItems,
                        total: get().getCartTotal(),
                        itemCount: get().getItemCount(),
                    });
                } else {
                    // Add new item
                    const cartItem: CartItem = {
                        ...product,
                        cartQuantity: quantity,
                    };
                    
                    set({
                        items: [...items, cartItem],
                        total: get().getCartTotal(),
                        itemCount: get().getItemCount(),
                    });
                }
            },

            removeFromCart: (productId: string) => {
                const { items } = get();
                const updatedItems = items.filter(item => item.id !== productId);
                
                set({
                    items: updatedItems,
                    total: get().getCartTotal(),
                    itemCount: get().getItemCount(),
                });
            },

            updateQuantity: (productId: string, quantity: number) => {
                const { items } = get();
                
                if (quantity <= 0) {
                    get().removeFromCart(productId);
                    return;
                }

                const updatedItems = items.map(item =>
                    item.id === productId ? { ...item, cartQuantity: quantity } : item
                );
                
                set({
                    items: updatedItems,
                    total: get().getCartTotal(),
                    itemCount: get().getItemCount(),
                });
            },

            clearCart: () => {
                set({
                    items: [],
                    total: 0,
                    itemCount: 0,
                });
            },

            getCartTotal: () => {
                const { items } = get();
                return items.reduce((total, item) => {
                    return total + (item.price * item.cartQuantity);
                }, 0);
            },

            getItemCount: () => {
                const { items } = get();
                return items.reduce((count, item) => {
                    return count + item.cartQuantity;
                }, 0);
            },
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);