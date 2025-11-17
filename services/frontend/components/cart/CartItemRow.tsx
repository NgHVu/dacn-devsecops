"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { type CartItem } from "@/types/cart";
import { useCart } from "@/context/CartContext";
import { formatPrice, getImageUrl } from "@/lib/utils"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCart();
  const safeImageUrl = getImageUrl(item.image); 

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      updateQuantity(item.id, newQuantity);
    }
  };

  const handleRemoveItem = () => {
    removeItem(item.id);
  };

  return (
    <div className="flex items-center gap-4 border-b py-4">
      <Image
        src={safeImageUrl}
        alt={item.name}
        width={96}
        height={96}
        className="rounded-md object-cover"
      />

      <div className="flex-1">
        <Link 
          href={`/products/${item.id}`} 
          className="font-semibold hover:text-primary"
        >
          {item.name}
        </Link>
        <p className="text-sm text-muted-foreground">
          {formatPrice(item.price)}
        </p>
      </div>

      <Input
        type="number"
        min="0"
        value={item.quantity}
        onChange={handleQuantityChange}
        className="w-20"
        aria-label={`Số lượng của ${item.name}`}
      />

      <div className="w-24 text-right font-semibold">
        {formatPrice(item.price * item.quantity)}
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleRemoveItem}
        aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
        className="text-red-500 hover:text-red-600"
      >
        <Trash2 className="h-5 w-5" />
      </Button>
    </div>
  );
}