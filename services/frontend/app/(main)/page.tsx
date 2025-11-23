import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { productService } from "@/services/productService";
import { type PageableResponse, type Product } from "@/types/product";
import { ProductCard } from "@/components/ProductCard";
import { EmptyProductState } from "@/components/ui/EmptyProductState";
import { PaginationUrlControl } from "@/components/ui/PaginationUrlControl";
import { HeroBanner } from "@/components/home/HeroBanner";
import { CategorySlider } from "@/components/home/CategorySlider";
import { FadeIn } from "@/components/animations/FadeIn";

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
    error = "Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.";
    productResponse = { 
        content: [], totalPages: 0, totalElements: 0, size: 0, number: 0, 
        last: true, first: true, empty: true 
    };
  }

  const products = productResponse.content;
  const totalPages = productResponse.totalPages;

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Đã xảy ra lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-12">
      
      {backendPage === 0 && (
        <FadeIn>
          <HeroBanner />
        </FadeIn>
      )}

      {backendPage === 0 && (
        <FadeIn delay={0.2}>
          <CategorySlider />
        </FadeIn>
      )}

      <div id="products" className="scroll-mt-20">
        <FadeIn delay={0.3}>
          <h2 className="text-3xl font-bold mb-6 flex items-center">
            Món Ngon Hôm Nay
            <span className="ml-3 text-sm font-normal text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">
              {products.length} món
            </span>
          </h2>
        </FadeIn>
        
        {products.length === 0 ? (
          <EmptyProductState />
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
              <div className="mt-12 border-t pt-8 flex justify-center">
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
  );
}