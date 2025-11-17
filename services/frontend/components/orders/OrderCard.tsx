"use client";

import React from 'react';
import Image from 'next/image';
import { type Order, type OrderItem } from '@/types/order';
import { formatPrice, getImageUrl } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface OrderCardProps {
  order: Order;
}

function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <Image
        src={getImageUrl(null)} 
        alt={item.productName}
        width={64}
        height={64}
        className="rounded-md object-cover"
      />
      <div className="flex-1">
        <p className="font-semibold">{item.productName}</p>
        <p className="text-sm text-muted-foreground">
          Số lượng: {item.quantity}
        </p>
      </div>
      <div className="text-right">
        <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
        <p className="text-sm text-muted-foreground">
          ({formatPrice(item.price)}/cái)
        </p>
      </div>
    </div>
  );
}

export function OrderCard({ order }: OrderCardProps) {
  
  const orderDate = new Date(order.createdAt).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status?.toUpperCase()) {
      case "COMPLETED": return "default";
      case "CANCELLED": return "destructive";
      case "PENDING": return "secondary"; 
      default: return "outline";
    }
  };

  return (
    <Card className="overflow-hidden">
      <Accordion type="single" collapsible>
        <AccordionItem value={String(order.id)}> 
          
          <AccordionTrigger className="p-4 hover:no-underline">
            <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-left">
                <p className="text-lg font-bold">Mã Đơn: #{order.id}</p>
                <p className="text-sm text-muted-foreground">Ngày đặt: {orderDate}</p>
              </div>
              <div className="text-left sm:text-right">
                
                <p className="text-xl font-bold">{formatPrice(order.totalAmount)}</p>
                
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status || "UNKNOWN"}
                </Badge>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="p-4 pt-0">
            <Separator className="mb-4" />
            <div className="space-y-4">
              {order.items.map((item) => (
                <OrderItemRow key={item.id} item={item} />
              ))}
            </div>
          </AccordionContent>

        </AccordionItem>
      </Accordion>
    </Card>
  );
}