import { Skeleton } from "@/components/ui/skeleton";

export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 py-6 border-b border-border last:border-0">
      {/* 1. Ảnh: Khớp size h-24 w-24 của Row thật */}
      <Skeleton className="h-24 w-24 sm:h-28 sm:w-28 rounded-xl flex-shrink-0" />
      
      {/* 2. Content giữa */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-2">
           <Skeleton className="h-6 w-3/4" /> {/* Tên món */}
           <Skeleton className="h-4 w-1/3" /> {/* Size/Topping */}
        </div>
        
        {/* 3. Footer Action giả lập */}
        <div className="flex items-end justify-between mt-2">
           <Skeleton className="h-6 w-24" /> {/* Giá tiền */}
           
           <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-md" /> {/* Nút xóa (Desktop) */}
              <div className="flex border border-border rounded-lg bg-card">
                 <Skeleton className="h-9 w-24 rounded-lg" /> {/* Bộ tăng giảm */}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}