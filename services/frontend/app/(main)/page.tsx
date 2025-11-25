import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Sparkles, PackageOpen, Utensils } from "lucide-react";
import { productService } from "@/services/productService";
import { type PageableResponse, type Product } from "@/types/product";
import { ProductCard } from "@/components/ProductCard";
import { PaginationUrlControl } from "@/components/ui/PaginationUrlControl";
import { HeroBanner } from "@/components/home/HeroBanner";
import { CategorySlider } from "@/components/home/CategorySlider";
import { FadeIn } from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";

// Ép buộc render động vì dữ liệu sản phẩm thay đổi liên tục
export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const pageParam = resolvedSearchParams?.page;

  const urlPage = typeof pageParam === 'string' ? parseInt(pageParam) : 1;
  const backendPage = urlPage > 0 ? urlPage - 1 : 0;
  const PAGE_SIZE = 12;

  let productResponse: PageableResponse<Product>;
  let error: string | null = null;

  try {
    productResponse = await productService.getProducts({ 
      page: backendPage, 
      size: PAGE_SIZE 
    });
  } catch (err) {
    console.error("Lỗi tải sản phẩm:", err);
    error = "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.";
    // Mock data rỗng để không crash UI
    productResponse = { 
        content: [], totalPages: 0, totalElements: 0, size: 0, number: 0, 
        last: true, first: true, empty: true 
    };
  }

  const products = productResponse.content;
  const totalPages = productResponse.totalPages;

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Alert variant="destructive" className="animate-in fade-in zoom-in duration-500 border-red-500/50 bg-red-500/10 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Đã xảy ra lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* LƯU Ý: Đã xóa phần Ambient Background ở đây vì Layout đã có */}

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-20 relative z-10">
        
        {/* SECTION 1: HERO & CATEGORIES (Chỉ hiện ở trang 1) */}
        {backendPage === 0 && (
          <div className="space-y-16">
            <FadeIn>
              <HeroBanner />
            </FadeIn>
            <FadeIn delay={0.2}>
              <CategorySlider />
            </FadeIn>
          </div>
        )}

        {/* SECTION 2: PRODUCT LIST */}
        <div id="products" className="scroll-mt-24 space-y-10">
          
          {/* Section Header */}
          <FadeIn delay={0.3} className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                <Sparkles className="h-7 w-7 text-yellow-500 fill-yellow-500 animate-pulse" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600">
                    Món Ngon Hôm Nay
                </span>
              </h2>
              <p className="text-muted-foreground mt-2 text-lg">
                Khám phá những hương vị tuyệt vời được yêu thích nhất tại FoodHub
              </p>
            </div>
            
            <div className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium bg-background/50 backdrop-blur-sm shadow-sm">
              <Utensils className="mr-2 h-4 w-4 text-orange-600" />
              <span className="text-foreground font-bold">{productResponse.totalElements}</span>
              <span className="ml-1 text-muted-foreground">món ăn đang chờ bạn</span>
            </div>
          </FadeIn>
          
          {/* Product Grid */}
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-muted/10 rounded-3xl border-2 border-dashed border-muted animate-in fade-in zoom-in duration-500">
               <div className="bg-muted/20 p-6 rounded-full mb-4">
                  <PackageOpen className="h-16 w-16 text-muted-foreground/50" />
               </div>
               <h3 className="text-xl font-bold text-foreground">Chưa có món ăn nào</h3>
               <p className="text-muted-foreground mt-2 max-w-md text-center">
                 Hiện tại thực đơn đang được cập nhật. Vui lòng quay lại sau nhé!
               </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product, index) => (
                  <FadeIn key={product.id} delay={index * 0.05}>
                    <ProductCard product={product} />
                  </FadeIn>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pt-16 pb-8 flex justify-center">
                  <PaginationUrlControl 
                    currentPage={backendPage} 
                    totalPages={totalPages} 
                  />
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}