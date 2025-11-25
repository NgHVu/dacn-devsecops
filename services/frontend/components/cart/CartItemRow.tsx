"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, CartItem } from "@/context/CartContext";
import { formatPrice, getImageUrl, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeFromCart } = useCart();
  const [isDeleting, setIsDeleting] = useState(false);

  // Tách tên món khỏi phần mô tả size/topping trong ngoặc (nếu có logic cũ lưu tên kèm ngoặc)
  // Nhưng ở context mới, bạn lưu size/toppings riêng, nên hiển thị trực tiếp từ props là tốt nhất.
  const displayToppings = item.toppings || [];

  return (
    <div className="group relative flex gap-4 py-6 border-b border-border last:border-0 animate-in fade-in zoom-in-95 duration-300">
      
      {/* 1. IMAGE */}
      <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
        <Image
          src={getImageUrl(item.image)}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* 2. CONTENT */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-1">
          <div className="flex justify-between items-start gap-2">
            <Link
              href={`/products/${item.id}`}
              className="font-bold text-base sm:text-lg text-foreground line-clamp-2 hover:text-primary transition-colors"
            >
              {item.name.split("(")[0]} {/* Hiển thị tên gốc */}
            </Link>
            
            {/* Nút xóa Mobile (Hiện ở góc trên phải) */}
             <DeleteItemDialog 
                onConfirm={() => removeFromCart(item.uniqueKey)} 
                itemName={item.name}
             >
                <button className="text-muted-foreground hover:text-destructive sm:hidden p-1">
                    <X className="h-4 w-4" />
                </button>
             </DeleteItemDialog>
          </div>

          {/* Options Display */}
          <div className="text-sm text-muted-foreground space-y-1">
             <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-normal bg-muted/50">
                   Size {item.size}
                </Badge>
             </div>
             
             {displayToppings.length > 0 && (
                <div className="text-xs leading-relaxed">
                   <span className="font-medium mr-1">Topping:</span>
                   {displayToppings.join(", ")}
                </div>
             )}

             {item.note && (
                <p className="text-xs italic text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded w-fit max-w-full truncate">
                    {item.note} 
                </p>
             )}
          </div>
        </div>

        {/* 3. FOOTER ACTIONS (Desktop & Mobile) */}
        <div className="flex items-end justify-between mt-4">
           {/* Price */}
           <div className="text-primary font-bold text-lg">
              {formatPrice(item.price)}
           </div>

           {/* Quantity Control */}
           <div className="flex items-center gap-3">
              {/* Nút xóa Desktop (Chỉ hiện ở màn hình to) */}
              <DeleteItemDialog 
                onConfirm={() => removeFromCart(item.uniqueKey)} 
                itemName={item.name}
              >
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hidden sm:flex"
                 >
                    <Trash2 className="h-4 w-4" />
                 </Button>
              </DeleteItemDialog>

              {/* Bộ tăng giảm */}
              <div className="flex items-center h-9 rounded-lg border border-border bg-card shadow-sm">
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-full w-8 rounded-l-lg hover:bg-muted"
                    onClick={() => updateQuantity(item.uniqueKey, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                 >
                    <Minus className="h-3 w-3" />
                 </Button>
                 <span className="w-8 text-center text-sm font-semibold tabular-nums">
                    {item.quantity}
                 </span>
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-full w-8 rounded-r-lg hover:bg-muted"
                    onClick={() => updateQuantity(item.uniqueKey, item.quantity + 1)}
                 >
                    <Plus className="h-3 w-3" />
                 </Button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// Tách Dialog ra component con cho gọn
function DeleteItemDialog({ onConfirm, itemName, children }: { onConfirm: () => void, itemName: string, children: React.ReactNode }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Xóa món này?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bạn có chắc muốn xóa <span className="font-bold text-foreground">{itemName}</span> khỏi giỏ hàng không?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        Xóa ngay
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}