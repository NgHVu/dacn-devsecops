"use client";

import React, { 
  createContext, 
  useState, 
  useContext, 
  useEffect, 
  useMemo,
  ReactNode
} from 'react';
import { type CartItem, type CartContextType } from '@/types/cart';
import { type Product } from '@/types/product';

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
});

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {

  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const storedCart = sessionStorage.getItem('cartItems'); 
      if (storedCart) {
        return JSON.parse(storedCart);
      }
    }
    return []; 
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem('cartItems', JSON.stringify(items));
    }
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const totalPrice = useMemo(() => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [items]);

  const addItem = (product: Product) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);

      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
    console.log("Đã thêm vào giỏ:", product.name);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setItems(prevItems => {
      if (quantity <= 0) {
        return prevItems.filter(item => item.id !== productId);
      } else {
        return prevItems.map(item =>
          item.id === productId
            ? { ...item, quantity: quantity }
            : item
        );
      }
    });
  };

  const removeItem = (productId: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const value = {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart phải được dùng bên trong một CartProvider');
  }
  return context;
};