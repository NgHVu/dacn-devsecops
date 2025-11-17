import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export const getImageUrl = (imagePath?: string | null): string => {
  const placeholder = "https://placehold.co/400x300/e0e0e0/7c7c7c?text=FoodApp";
  
  if (!imagePath) {
    return placeholder;
  }
  
  if (imagePath.startsWith("http")) {
    return imagePath;
  }
  
  if (imagePath.startsWith("/")) {
    return imagePath;
  }
  
  return `/images/${imagePath}`;
}