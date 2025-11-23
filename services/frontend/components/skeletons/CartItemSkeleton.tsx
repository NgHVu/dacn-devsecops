import { Skeleton } from "@/components/ui/skeleton";

export function CartItemSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 border-b">
      {/* Ảnh sản phẩm */}
      <Skeleton className="h-20 w-20 rounded-md" />
      
      <div className="flex-1 space-y-2">
        {/* Tên và Giá */}
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </div>

      {/* Bộ tăng giảm số lượng */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-6 w-8" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>

      {/* Nút xóa */}
      <Skeleton className="h-8 w-8 rounded-full ml-4" />
    </div>
  );
}