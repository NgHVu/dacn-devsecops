import { type Product } from "./product";

export type CartItem = Product & {
  quantity: number;
};

export type CartContextType = {
  items: CartItem[]; 
  addItem: (product: Product) => void; 
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void; 
  clearCart: () => void;
  totalItems: number; 
  totalPrice: number; 
};