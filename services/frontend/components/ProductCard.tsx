"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Star, Box } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice, getImageUrl } from "@/lib/utils";
import { type Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  hasOptions?: boolean;
  onOpenModal?: (product: Product) => void;
}

export function ProductCard({
  product,
  hasOptions = false,
  onOpenModal,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const safeImageUrl = getImageUrl(product.image);
  
  // Logic kiểm tra tồn kho
  const stock = product.stockQuantity ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5; // Cảnh báo nếu còn ít hơn hoặc bằng 5

  const ratingValue = product.averageRating || 0;
  const reviewCount = product.reviewCount || 0;
  const hasReviews = reviewCount > 0;

  // [FIX] Khôi phục điều kiện HOT về >= 1 đánh giá như cũ để không bị mất nhãn
  const isHot = !isOutOfStock && ratingValue >= 4.0 && reviewCount >= 1;

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    if (hasOptions && onOpenModal) {
      onOpenModal(product);
      return;
    }

    addToCart(product, 1);
    toast.success(`Đã thêm ${product.name} vào giỏ!`);
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "group block h-full select-none outline-none",
        isOutOfStock && "opacity-80 grayscale-[0.8]"
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

          {/* Badges trạng thái */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10 items-start">
            {isOutOfStock && (
              <Badge variant="destructive" className="text-[10px] px-2 h-5 font-bold shadow-md">
                HẾT HÀNG
              </Badge>
            )}
            
            {/* [UI] Điều chỉnh màu sắc để nổi bật nhưng không tranh chấp với nhãn HOT */}
            {!isOutOfStock && isLowStock && (
               <Badge variant="secondary" className="bg-orange-500/90 text-white border-0 text-[10px] px-2 h-5 shadow-md backdrop-blur-sm">
                 Chỉ còn {stock}
               </Badge>
            )}

            {/* [UI] Đảm bảo HOT luôn hiển thị nếu đủ điều kiện */}
            {isHot && (
              <Badge className="bg-red-600 text-white border-0 text-[10px] px-2 h-5 animate-pulse shadow-md w-fit">
                HOT
              </Badge>
            )}
          </div>

          <Button
            size="icon"
            onClick={handleAction}
            disabled={isOutOfStock}
            className={cn(
              "absolute bottom-2 right-2 h-9 w-9 rounded-full shadow-lg transition-all duration-300 z-20",
              "opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:translate-y-0 md:group-hover:opacity-100",
              isOutOfStock 
                ? "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed border-none"
                : "bg-primary text-primary-foreground hover:bg-primary/90 border border-white/10"
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
            
            {hasReviews && (
                <div className="flex items-center gap-1 shrink-0 bg-secondary/50 px-1.5 py-0.5 rounded-md">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-[10px] font-bold text-muted-foreground">
                    {ratingValue.toFixed(1)}
                </span>
                </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground line-clamp-1 h-4">
            {product.description || "Món ngon đang chờ bạn thưởng thức."}
          </p>

          <div className="mt-1 pt-1 border-t border-border/40 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              
              {/* Hiển thị số lượng tồn kho text nhỏ */}
              {!isOutOfStock && (
                  <span className={cn(
                    "text-[9px] flex items-center gap-1",
                    isLowStock ? "text-orange-600 font-medium" : "text-muted-foreground"
                  )}>
                      <Box className="w-3 h-3" /> Kho: {stock}
                  </span>
              )}
            </div>
            
            {hasReviews && (
                <span className="text-[10px] text-muted-foreground/70 self-end">
                    {reviewCount} đánh giá
                </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}