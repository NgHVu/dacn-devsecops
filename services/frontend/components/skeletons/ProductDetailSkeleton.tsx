import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export function ProductDetailSkeleton() {
  return (
    <div className="container py-6 max-w-7xl">
      <div className="mb-6"><Skeleton className="h-6 w-32" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Image */}
        <div className="lg:col-span-5">
           <AspectRatio ratio={1} className="rounded-2xl overflow-hidden">
             <Skeleton className="h-full w-full" />
           </AspectRatio>
        </div>
        {/* Right: Info */}
        <div className="lg:col-span-7 space-y-6">
           <div className="space-y-2">
              <Skeleton className="h-10 w-3/4" /> {/* Tên */}
              <Skeleton className="h-8 w-1/3" /> {/* Giá */}
           </div>
           <Skeleton className="h-20 w-full" /> {/* Mô tả */}
           <div className="space-y-4 pt-4">
              <Skeleton className="h-6 w-20" /> {/* Title Size */}
              <div className="flex gap-4">
                 <Skeleton className="h-16 w-24 rounded-lg" />
                 <Skeleton className="h-16 w-24 rounded-lg" />
                 <Skeleton className="h-16 w-24 rounded-lg" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}