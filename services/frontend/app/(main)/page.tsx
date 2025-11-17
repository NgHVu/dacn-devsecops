import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { productService } from "@/services/productService";
import { type PageableResponse, type Product } from "@/types/product";
import { ProductCard } from "@/components/ProductCard"; 

export default async function HomePage() {
  let productResponse: PageableResponse<Product>;
  let error: string | null = null;

  try {
    productResponse = await productService.getProducts({ page: 0, size: 20 });
  } catch (err) {
    console.error(err); 
    error = "Không thể tải sản phẩm. Vui lòng thử lại sau.";
    productResponse = { content: [], totalPages: 0, totalElements: 0, size: 0, number: 0, last: true, first: true, empty: true };
  }

  const products = productResponse.content;

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
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Sản phẩm nổi bật</h1>
      
      {products.length === 0 ? (
        <p>Hiện chưa có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}