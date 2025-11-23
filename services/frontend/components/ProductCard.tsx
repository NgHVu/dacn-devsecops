"use client"; 

import React from "react";
import Image from "next/image";
import Link from "next/link"; 
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
import { formatPrice, getImageUrl } from "@/lib/utils";
import { useCart } from "@/context/CartContext"; 
import { toast } from "sonner"; 

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart(); 
  const safeImageUrl = getImageUrl(product.image);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();

    addToCart(product, 1);
    
    toast.success("Đã thêm vào giỏ hàng", {
      description: (
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10 rounded overflow-hidden">
             <Image 
                src={safeImageUrl} 
                alt={product.name} 
                fill
                className="object-cover"
             />
          </div>
          <span className="font-medium line-clamp-1">{product.name}</span>
        </div>
      ),
      duration: 2000,
    });
  };

  return (
    <Link href={`/products/${product.id}`} className="group block h-full">
      <Card className="flex flex-col h-full overflow-hidden rounded-xl border-border shadow-sm hover:shadow-md transition-all duration-300 group-hover:border-primary/50">
        <CardHeader className="p-0">
          <AspectRatio ratio={4 / 3}>
            <Image
              src={safeImageUrl} 
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              onError={(e) => {
                e.currentTarget.srcset = "https://placehold.co/400x300/e0e0e0/7c7c7c?text=No+Image";
              }}
            />
          </AspectRatio>
        </CardHeader>
        
        <CardContent className="p-4 flex-1 flex flex-col">
          <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1 mb-1">
            {product.name}
          </CardTitle>
          <CardDescription className="text-sm line-clamp-2 text-muted-foreground">
            {product.description || "Món ngon chất lượng, mời bạn thưởng thức."}
          </CardDescription>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex items-center justify-between mt-auto">
          <p className="text-lg font-bold text-primary">
            {formatPrice(product.price)}
          </p>
          <Button 
            size="sm" 
            onClick={handleAddToCart}
            className="rounded-full shadow-sm"
            aria-label={`Thêm ${product.name} vào giỏ hàng`}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Thêm
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}