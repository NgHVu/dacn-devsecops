"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Star } from "lucide-react"; 

import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice, getImageUrl } from "@/lib/utils";
import { type Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
// ĐÃ XÓA import { toast } from "sonner"; -> Không cần toast ở đây nữa

interface ProductCardProps {
  product: Product;
  hasOptions?: boolean;
  onOpenModal?: (product: Product) => void;
}

export function ProductCard({ product, hasOptions = false, onOpenModal }: ProductCardProps) {
  const { addToCart } = useCart();
  const safeImageUrl = getImageUrl(product.image);
  const isOutOfStock = product.stockQuantity <= 0;

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    if (hasOptions && onOpenModal) {
      onOpenModal(product);
      return;
    }

    // Chỉ gọi hàm addToCart, việc hiện Toast để Context lo
    addToCart(product, 1);
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "group block h-full select-none outline-none",
        isOutOfStock && "opacity-60 grayscale pointer-events-none"
      )}
    >
      <Card className="relative flex flex-col h-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/50 group-hover:-translate-y-1">
        
        {/* --- IMAGE SECTION --- */}
        <div className="relative overflow-hidden bg-muted/50">
          <AspectRatio ratio={4 / 3}>
            <Image
              src={safeImageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </AspectRatio>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1 z-10">
            {isOutOfStock && <Badge variant="destructive" className="text-[10px] px-2 h-5">HẾT</Badge>}
            {product.price < 50000 && !isOutOfStock && (
              <Badge className="bg-red-500 text-white border-0 text-[10px] px-2 h-5">HOT</Badge>
            )}
          </div>

          <Button
            size="icon"
            onClick={handleAction}
            className={cn(
              "absolute bottom-2 right-2 h-9 w-9 rounded-full shadow-lg transition-all duration-300 z-20",
              "opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:translate-y-0 md:group-hover:opacity-100",
              "bg-primary text-primary-foreground hover:bg-primary/90 border border-white/10"
            )}
          >
            <Plus className="h-5 w-5" strokeWidth={3} />
          </Button>
        </div>

        {/* --- CONTENT SECTION --- */}
        <CardContent className="p-3 flex flex-col gap-1.5 flex-1">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-sm leading-tight text-foreground line-clamp-2 flex-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-1 shrink-0 bg-secondary/50 px-1.5 py-0.5 rounded-md">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-bold text-muted-foreground">4.8</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-1 h-4">
             {product.description || "Món ngon đang chờ bạn thưởng thức."}
          </p>

          <div className="mt-1 pt-1 border-t border-border/40 flex items-center justify-between">
             <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Giá bán</span>
                <span className="text-sm font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
             </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}