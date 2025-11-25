import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full flex flex-col rounded-xl border border-border/60 shadow-sm">
      <CardHeader className="p-0">
        <AspectRatio ratio={4 / 3}>
           <Skeleton className="h-full w-full rounded-none" />
        </AspectRatio>
      </CardHeader>
      
      <CardContent className="p-3 flex-1 flex flex-col gap-2">
        {/* Giả lập Row 1: Tên dài + Sao nhỏ */}
        <div className="flex justify-between gap-2">
           <Skeleton className="h-4 w-2/3" />
           <Skeleton className="h-4 w-8" />
        </div>
        
        {/* Giả lập Row 2: Mô tả */}
        <Skeleton className="h-3 w-full" />
        
        {/* Giả lập Row 3: Divider + Giá */}
        <div className="pt-2 mt-auto">
           <div className="flex justify-between items-end">
              <div className="space-y-1">
                 <Skeleton className="h-2 w-10" /> {/* Chữ "Giá bán" */}
                 <Skeleton className="h-4 w-20" /> {/* Giá tiền */}
              </div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}