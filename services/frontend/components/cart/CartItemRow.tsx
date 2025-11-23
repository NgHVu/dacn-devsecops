"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link"; 
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, CartItem } from "@/context/CartContext";
import { formatPrice, getImageUrl } from "@/lib/utils";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-start gap-4 py-4 border-b last:border-none animate-in fade-in zoom-in-95 duration-300">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border bg-gray-100">
        <Image
          src={getImageUrl(item.image)}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between self-stretch">
        <div>
          <Link 
            href={`/products/${item.id}`} 
            className="font-medium text-gray-900 line-clamp-2 hover:text-primary transition-colors"
          >
            {item.name.split("(")[0].trim()}
          </Link>
          
          <div className="mt-1 text-xs text-muted-foreground space-y-1">
            {item.size && <p>Size: <span className="font-medium text-gray-700">{item.size}</span></p>}
            
            {item.toppings && item.toppings.length > 0 && (
              <p>Topping: {item.toppings.join(", ")}</p>
            )}
            
            {item.note && (
              <p className="italic text-orange-600">Note: {item.note}</p>
            )}
          </div>
        </div>

        <p className="mt-2 text-sm font-semibold text-primary">
          {formatPrice(item.price)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-red-600"
          onClick={() => removeFromCart(item.uniqueKey)} 
          aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <div className="flex items-center border rounded-md bg-white shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-none"
            onClick={() => updateQuantity(item.uniqueKey, item.quantity - 1)} 
            disabled={item.quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          <span className="w-8 text-center text-sm font-medium">
            {item.quantity}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-none"
            onClick={() => updateQuantity(item.uniqueKey, item.quantity + 1)} 
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}