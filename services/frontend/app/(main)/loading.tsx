import { ProductCardSkeleton } from "@/components/skeletons/ProductCardSkeleton";

export default function Loading() {
  return (
    <div className="container py-8">
      <div className="h-8 w-48 bg-muted animate-pulse rounded mb-6" /> 
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}