"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Image from "next/image"; 
import { useRouter } from "next/navigation"; // Thêm router để nút Xem giỏ hoạt động
import { Product } from "@/types/product";
import { toast } from "sonner";
import { ProductSize, ProductTopping } from "@/config/productOptions";
import { getImageUrl } from "@/lib/utils"; 

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
  const router = useRouter(); // Hook để chuyển trang

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

  // --- HÀM HELPER HIỂN THỊ TOAST (Đã cập nhật giao diện mới) ---
  const showCartToast = (message: string, product: Product, uniqueId: string, quantity: number, sizeName: string) => {
    toast.success(
      <div className="flex items-center gap-3 w-full">
        {/* Hình ảnh món ăn */}
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-border/50">
          <Image 
            src={getImageUrl(product.image)} 
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
        {/* Nội dung text */}
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-sm">{message}</span>
          <span className="text-xs text-muted-foreground line-clamp-1">
             {quantity}x {product.name} ({sizeName})
          </span>
        </div>
      </div>,
      {
        id: `cart-action-${uniqueId}`, // ID giúp chống spam
        duration: 3000,
        position: "bottom-right",
        action: { 
            label: "Xem giỏ", 
            onClick: () => router.push("/cart") 
        },
        className: "group"
      }
    );
  };

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
      const sizeName = options.size.name; // Lấy tên size để hiện lên toast

      if (existingItem) {
        showCartToast("Đã cập nhật số lượng!", product, uniqueKey, quantity, sizeName);
        return prev.map((item) =>
          item.uniqueKey === uniqueKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      showCartToast("Đã thêm vào giỏ!", product, uniqueKey, quantity, sizeName);

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