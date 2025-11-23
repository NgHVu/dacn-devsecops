import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { productService } from "@/services/productService";
import { type PageableResponse, type Product } from "@/types/product";
import { ProductCard } from "@/components/ProductCard";
import { EmptyProductState } from "@/components/ui/EmptyProductState";
import { PaginationUrlControl } from "@/components/ui/PaginationUrlControl"

export const dynamic = 'force-dynamic'; 

interface HomePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  
  const pageParam = searchParams?.page;
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

  if (!products || products.length === 0) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Sản phẩm nổi bật</h1>
        <EmptyProductState />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Sản phẩm nổi bật</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-10 border-t pt-6">
          <PaginationUrlControl 
            currentPage={backendPage} 
            totalPages={totalPages} 
          />
        </div>
      )}
    </div>
  );
}