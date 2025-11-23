import { Product } from "./product";
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

export type CartContextType = {
  items: CartItem[];
  
  addToCart: (
    product: Product, 
    quantity: number, 
    options?: { size: ProductSize; toppings: ProductTopping[]; note: string }
  ) => void;
  
  updateQuantity: (uniqueKey: string, quantity: number) => void;
  
  removeFromCart: (uniqueKey: string) => void;
  
  clearCart: () => void;
  
  totalItems: number;
  totalPrice: number;
};