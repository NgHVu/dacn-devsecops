"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/types/product";
import { toast } from "sonner";
import { ProductSize, ProductTopping } from "@/config/productOptions";

export type CartItem = {
  id: number; 
  uniqueKey: string; 
  name: string;
  price: number; 
  image: string;
  quantity: number;
  size: string;
  toppings: string[]; 
  note: string;
};

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number, options?: { size: ProductSize, toppings: ProductTopping[], note: string }) => void;
  removeFromCart: (uniqueKey: string) => void;
  updateQuantity: (uniqueKey: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          // eslint-disable-next-line react-hooks/exhaustive-deps
          setItems(parsedCart); 
        } catch (e) {
          console.error("Lỗi parse cart:", e);
        }
      }
      setIsLoaded(true);
    }
  }, []); 

  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addToCart = (
    product: Product, 
    quantity: number,
    options: { size: ProductSize, toppings: ProductTopping[], note: string } = { size: { id: "S", price: 0, name: "Nhỏ (S)" }, toppings: [], note: "" }
  ) => {
    const toppingPrice = options.toppings.reduce((sum, t) => sum + t.price, 0);
    const finalPrice = product.price + options.size.price + toppingPrice;

    const toppingIds = options.toppings.map(t => t.id).sort().join(",");
    const uniqueKey = `${product.id}-${options.size.id}-${toppingIds}`;

    let fullName = product.name;
    const details = [];
    if (options.size.id !== "S") details.push(`${options.size.name}`);
    if (options.toppings.length > 0) details.push(options.toppings.map(t => t.name).join(", "));
    
    if (details.length > 0) fullName += ` (${details.join(" + ")})`;
    if (options.note) fullName += ` [Note: ${options.note}]`;

    setItems((prev) => {
      const existingItem = prev.find((item) => item.uniqueKey === uniqueKey);

      if (existingItem) {
        toast.success("Đã cập nhật số lượng!");
        return prev.map((item) =>
          item.uniqueKey === uniqueKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      toast.success("Đã thêm vào giỏ hàng!");
      return [
        ...prev,
        {
          id: product.id,
          uniqueKey,
          name: fullName,
          price: finalPrice,
          image: product.image,
          quantity,
          size: options.size.name,
          toppings: options.toppings.map(t => t.name),
          note: options.note
        },
      ];
    });
  };

  const removeFromCart = (uniqueKey: string) => {
    setItems((prev) => prev.filter((item) => item.uniqueKey !== uniqueKey));
  };

  const updateQuantity = (uniqueKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(uniqueKey);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.uniqueKey === uniqueKey ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cart");
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart phải được dùng bên trong một CartProvider");
  }
  return context;
};