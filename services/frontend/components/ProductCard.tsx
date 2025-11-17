"use client"; 

import React from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { type Product } from "@/types/product";
import { formatPrice, getImageUrl } from "@/lib/utils"; // <-- 1. IMPORT TỪ 'utils'
import { useCart } from "@/context/CartContext"; 
import { toast } from "sonner"; 

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart(); 
  const safeImageUrl = getImageUrl(product.image); // <-- 3. Vẫn dùng bình thường

  const handleAddToCart = () => {
    addItem(product);
    toast.success("Đã thêm vào giỏ hàng", {
      description: (
        <div className="flex items-center gap-2">
          <Image 
            src={safeImageUrl} 
            alt={product.name} 
            width={40} 
            height={40}
            className="rounded-md"
          />
          <span>{product.name}</span>
        </div>
      ),
      duration: 2000,
    });
  };

  return (
    <Card className="flex flex-col overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="p-0">
        <AspectRatio ratio={4 / 3}>
          <Image
            src={safeImageUrl} 
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={true}
            onError={(e) => {
              e.currentTarget.srcset = "https://placehold.co/400x300/e0e0e0/7c7c7c?text=Hinh+Loi";
            }}
          />
        </AspectRatio>
      </CardHeader>
      
      <CardContent className="p-4 flex-1">
        <CardTitle className="text-lg font-semibold hover:text-primary transition-colors">
          {product.name}
        </CardTitle>
        <CardDescription className="mt-2 text-sm line-clamp-2 h-[2.5em]">
          {product.description || "Chưa có mô tả cho sản phẩm này."}
        </CardDescription>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <p className="text-xl font-bold text-primary">
          {formatPrice(product.price)}
        </p>
        <Button 
          size="sm" 
          onClick={handleAddToCart}
          aria-label={`Thêm ${product.name} vào giỏ hàng`}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Thêm
        </Button>
      </CardFooter>
    </Card>
  );
}