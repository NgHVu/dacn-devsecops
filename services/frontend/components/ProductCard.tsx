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
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  
  const handleAddToCart = () => {
    console.log("Thêm vào giỏ hàng:", product.id);
  };

  return (
    <Card className="flex flex-col overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="p-0">
        <AspectRatio ratio={4 / 3}>
          <Image
            src={product.image || "https://placehold.co/400x300/e0e0e0/7c7c7c?text=FoodApp"}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={true} 
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