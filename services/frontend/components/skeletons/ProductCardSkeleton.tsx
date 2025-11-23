import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="p-0">
        <Skeleton className="h-48 w-full rounded-none" />
      </CardHeader>
      <CardContent className="p-4 flex-1 space-y-2">
        <Skeleton className="h-6 w-3/4" /> {/* Tên sản phẩm */}
        <Skeleton className="h-4 w-full" /> {/* Mô tả dòng 1 */}
        <Skeleton className="h-4 w-2/3" /> {/* Mô tả dòng 2 */}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <Skeleton className="h-6 w-20" /> {/* Giá */}
        <Skeleton className="h-9 w-24" /> {/* Nút thêm */}
      </CardFooter>
    </Card>
  );
}