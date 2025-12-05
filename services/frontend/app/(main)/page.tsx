import React, { Suspense } from "react";
import { Sparkles, PackageOpen, Utensils, FilterX } from "lucide-react";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService"; 
import { type PageableResponse, type Product, type Category } from "@/types/product";
import { ProductCard } from "@/components/ProductCard";
import { PaginationUrlControl } from "@/components/ui/PaginationUrlControl";
import { HeroBanner } from "@/components/home/HeroBanner";
import { CategorySlider } from "@/components/home/CategorySlider";
import { FadeIn } from "@/components/animations/FadeIn"; 
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function HomePage({ searchParams }: HomePageProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-20 relative z-10">
        
        <div className="space-y-16">
            <FadeIn>
                <HeroBanner />
            </FadeIn>
            
            <Suspense fallback={<CategoryListSkeleton />}>
                <CategoryListSection />
            </Suspense>
        </div>

        <div id="products" className="scroll-mt-24 space-y-10">
          <Suspense fallback={<ProductListSkeleton />}>
             <ProductListSection searchParams={searchParams} />
          </Suspense>
        </div>

      </div>
    </div>
  );
}

async function CategoryListSection() {
    let categories: Category[] = [];
    let isError = false;

    try {
        categories = await categoryService.getAllCategories();
    } catch (err) {
        console.error("Lỗi danh mục:", err);
        isError = true;
    }

    if (isError) {
        return <p className="text-center text-sm text-muted-foreground">Không thể tải danh mục.</p>;
    }

    return (
        <div className="animate-in fade-in duration-500">
            <CategorySlider categories={categories} />
        </div>
    );
}

async function ProductListSection({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const resolvedSearchParams = await searchParams;
    
    const pageParam = resolvedSearchParams?.page;
    const categoryIdParam = resolvedSearchParams?.categoryId;
    const sortParam = resolvedSearchParams?.sort;
    const searchParam = resolvedSearchParams?.search;

    const urlPage = typeof pageParam === 'string' ? parseInt(pageParam) : 1;
    const backendPage = urlPage > 0 ? urlPage - 1 : 0;
    const PAGE_SIZE = 12;

    const categoryId = typeof categoryIdParam === 'string' ? parseInt(categoryIdParam) : undefined;
    const sort = typeof sortParam === 'string' ? sortParam : undefined;
    const search = typeof searchParam === 'string' ? searchParam : undefined;

    let productResponse: PageableResponse<Product>;
    let categoryName = "";

    try {
        const [pResponse, cResponse] = await Promise.all([
            productService.getProducts({ 
                page: backendPage, size: PAGE_SIZE, categoryId, sort, search
            }),
            categoryId ? categoryService.getAllCategories() : Promise.resolve([])
        ]);
        
        productResponse = pResponse;
        if (categoryId && cResponse.length > 0) {
            categoryName = cResponse.find(c => c.id === categoryId)?.name || "";
        }
    } catch (err) {
        console.error("Lỗi sản phẩm:", err);
        productResponse = { 
            content: [], totalPages: 0, totalElements: 0, size: 0, number: 0, 
            last: true, first: true, empty: true 
        };
    }

    const products = productResponse.content;
    const isFiltering = !!categoryId || !!sort || !!search;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                {categoryName ? (
                    <>
                        <Utensils className="h-7 w-7 text-orange-500" />
                        <span className="text-orange-600">{categoryName}</span>
                    </>
                ) : sort === 'rating_desc' ? (
                    <>
                        <Sparkles className="h-7 w-7 text-red-500 fill-red-500" />
                        <span className="text-red-600">Món Hot (Đánh giá cao)</span>
                    </>
                ) : (
                    <>
                        <Sparkles className="h-7 w-7 text-yellow-500 fill-yellow-500 animate-pulse" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600">
                            Món Ngon Hôm Nay
                        </span>
                    </>
                )}
              </h2>
              <p className="text-muted-foreground mt-2 text-lg">
                {categoryName ? `Danh sách các món ${categoryName} hấp dẫn` : "Khám phá những hương vị tuyệt vời được yêu thích nhất tại FoodHub"}
              </p>
            </div>
            
            <div className="flex gap-2">
                {isFiltering && (
                    <Link href="/">
                        <Button variant="outline" className="rounded-full border-dashed">
                            <FilterX className="mr-2 h-4 w-4" /> Bỏ lọc
                        </Button>
                    </Link>
                )}
                <div className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium bg-background/50 backdrop-blur-sm shadow-sm">
                    <Utensils className="mr-2 h-4 w-4 text-orange-600" />
                    <span className="text-foreground font-bold">{productResponse.totalElements}</span>
                    <span className="ml-1 text-muted-foreground">món ăn</span>
                </div>
            </div>
          </div>
          
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-muted/10 rounded-3xl border-2 border-dashed border-muted mt-10">
               <div className="bg-muted/20 p-6 rounded-full mb-4">
                  <PackageOpen className="h-16 w-16 text-muted-foreground/50" />
               </div>
               <h3 className="text-xl font-bold text-foreground">Không tìm thấy món nào</h3>
               <p className="text-muted-foreground mt-2 max-w-md text-center">
                 {isFiltering 
                    ? "Thử chọn danh mục khác hoặc bỏ bộ lọc hiện tại xem sao." 
                    : "Hiện tại thực đơn đang được cập nhật. Vui lòng quay lại sau nhé!"}
               </p>
               {isFiltering && (
                   <Link href="/" className="mt-6">
                       <Button variant="default">Xem tất cả món ăn</Button>
                   </Link>
               )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-10">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {productResponse.totalPages > 1 && (
                <div className="pt-16 pb-8 flex justify-center">
                  <PaginationUrlControl 
                    currentPage={backendPage} 
                    totalPages={productResponse.totalPages} 
                  />
                </div>
              )}
            </>
          )}
        </div>
    );
}

function CategoryListSkeleton() {
    return (
        <div className="flex space-x-4 overflow-x-auto pb-6 pt-2">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3 w-[100px] shrink-0">
                    <Skeleton className="w-20 h-20 rounded-[1.5rem]" />
                    <Skeleton className="w-12 h-3" />
                </div>
            ))}
        </div>
    );
}

function ProductListSkeleton() {
    return (
        <div className="space-y-10 animate-pulse">
            <div className="flex justify-between items-end border-b pb-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-32 rounded-full" />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}