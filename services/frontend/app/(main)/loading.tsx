import { ProductCardSkeleton } from "@/components/skeletons/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      
      {/* Hero Banner Skeleton - Updated Height for FoodHub Banner */}
      <div className="relative">
         <Skeleton className="w-full h-[400px] md:h-[500px] rounded-[2rem] shadow-sm" />
         {/* Fake Button inside Banner */}
         <div className="absolute bottom-16 left-8 md:left-16 flex gap-4">
            <Skeleton className="h-12 w-36 rounded-full" />
         </div>
      </div>

      {/* Category Slider Skeleton */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-1">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="flex gap-4 overflow-hidden pb-2">
            {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3 shrink-0 w-[100px]">
                <Skeleton className="w-20 h-20 rounded-[1.5rem]" />
                <Skeleton className="w-16 h-3 rounded-full" />
            </div>
            ))}
        </div>
      </div>

      <div className="space-y-8">
        {/* Title Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-4">
           <div className="space-y-3">
              <Skeleton className="h-10 w-64 rounded-xl" />
              <Skeleton className="h-5 w-96 rounded-lg opacity-60" />
           </div>
           <Skeleton className="h-9 w-40 rounded-full" />
        </div>
        
        {/* Product Grid Skeleton - Matches XL Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}