import React, { Suspense } from "react";
import { productService } from "@/services/productService";
import { ProductCard } from "@/components/ProductCard";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { ProductCardSkeleton } from "@/components/skeletons/ProductCardSkeleton";
import { PaginationUrlControl } from "@/components/ui/PaginationUrlControl";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, SearchX } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";

// Cho phép caching search trong 60s để tối ưu
export const revalidate = 60; 

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  
  // 1. Parse Params
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page) : 1;
  const backendPage = page > 0 ? page - 1 : 0;
  const name = typeof resolvedParams.name === 'string' ? resolvedParams.name : undefined;
  const categoryId = typeof resolvedParams.categoryId === 'string' ? resolvedParams.categoryId : undefined;
  const sort = typeof resolvedParams.sort === 'string' ? resolvedParams.sort : undefined;
  const minPrice = typeof resolvedParams.minPrice === 'string' ? parseInt(resolvedParams.minPrice) : undefined;
  const maxPrice = typeof resolvedParams.maxPrice === 'string' ? parseInt(resolvedParams.maxPrice) : undefined;

  // 2. Call API
  // Mặc dù backend chưa lọc được category/price, ta vẫn truyền vào để sau này backend update là chạy luôn
  const productResponse = await productService.getProducts({
    page: backendPage,
    size: 12,
    name,
    sort,
    categoryId,
    minPrice,
    maxPrice
  });

  const products = productResponse.content;
  const totalElements = productResponse.totalElements;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Background */}
      <div className="bg-muted/30 border-b border-border/50">
        <div className="container max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold tracking-tight">Thực đơn & Tìm kiếm</h1>
            <p className="text-muted-foreground mt-2">
                {name 
                    ? `Kết quả tìm kiếm cho "${name}"`
                    : "Khám phá các món ngon hấp dẫn nhất"} 
                <span className="mx-2">•</span> 
                <span className="font-medium text-foreground">{totalElements} món ăn</span>
            </p>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* --- SIDEBAR (DESKTOP) --- */}
            <div className="hidden lg:block w-64 shrink-0 space-y-8">
                <div className="sticky top-24">
                    <FilterSidebar />
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1">
                {/* Mobile Filter Trigger & Sort */}
                <div className="flex items-center justify-between mb-6 lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px]">
                            <div className="py-6">
                                <FilterSidebar />
                            </div>
                        </SheetContent>
                    </Sheet>
                    
                    {/* Sort Select (Mobile) - Có thể thêm nếu cần */}
                </div>

                {/* Products Grid */}
                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-muted/10 rounded-2xl border-2 border-dashed border-muted animate-in fade-in zoom-in">
                        <div className="bg-muted p-4 rounded-full mb-4">
                            <SearchX className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">Không tìm thấy kết quả</h3>
                        <p className="text-muted-foreground text-center max-w-xs mt-1">
                            Thử thay đổi từ khóa hoặc bộ lọc của bạn xem sao.
                        </p>
                        <Button variant="link" className="mt-4 text-orange-600" asChild>
                            <a href="/search">Xóa bộ lọc</a>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {products.map((product, index) => (
                            <FadeIn key={product.id} delay={index * 0.05}>
                                <ProductCard product={product} />
                            </FadeIn>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {productResponse.totalPages > 1 && (
                    <div className="mt-12 flex justify-center">
                        <PaginationUrlControl 
                            currentPage={backendPage} 
                            totalPages={productResponse.totalPages} 
                        />
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}