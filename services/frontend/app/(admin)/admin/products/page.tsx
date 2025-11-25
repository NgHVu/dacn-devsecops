"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { productService } from "@/services/productService";
import { type Product } from "@/types/product";
import { formatPrice, getImageUrl } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import { 
  PlusCircle, 
  Search, 
  RotateCcw, 
  PackageOpen, 
  AlertCircle 
} from "lucide-react";
import { toast } from "sonner";

// Custom Components
import { ProductActions } from "@/components/admin/ProductActions";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import { PaginationControl } from "@/components/ui/PaginationControl";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 8; // Giảm xuống 8 để vừa vặn màn hình hơn

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // Search State (UI only for now)
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProducts = useCallback(async (pageIndex: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Giả lập delay nhỏ để thấy hiệu ứng Skeleton (UX)
      // await new Promise(r => setTimeout(r, 500)); 

      const data = await productService.getProducts({ page: pageIndex, size: PAGE_SIZE });
      
      setProducts(data.content);
      setTotalPages(data.totalPages); 
      setCurrentPage(data.number);    
      
    } catch (err) {
      console.error("Lỗi khi tải sản phẩm:", err);
      setError("Không thể kết nối đến máy chủ.");
      toast.error("Lỗi tải dữ liệu sản phẩm.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [fetchProducts, currentPage]);

  // Handlers
  const handleAddNew = () => {
    setCurrentProduct(null); 
    setIsFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product); 
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleProductSaved = () => {
    fetchProducts(currentPage); 
    toast.success("Dữ liệu đã được cập nhật");
  };

  const handleRefresh = () => {
    fetchProducts(currentPage);
    toast.info("Đang làm mới dữ liệu...");
  };

  return (
    <div className="space-y-6">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Món ăn</h1>
          <p className="text-muted-foreground">
            Quản lý danh sách thực đơn, giá cả và tồn kho.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          <Button onClick={handleAddNew} size="sm" className="shadow-md shadow-primary/20">
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm món mới
          </Button>
        </div>
      </div>

      {/* --- MAIN CARD --- */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="p-4 sm:p-6 border-b bg-gray-50/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold">Danh sách</CardTitle>
            
            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm món ăn..."
                className="pl-8 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="w-[100px] pl-6">Hình ảnh</TableHead>
                <TableHead className="min-w-[200px]">Tên món ăn</TableHead>
                <TableHead className="text-right">Giá bán</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right">Tồn kho</TableHead>
                <TableHead className="w-[100px] text-center pr-6">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {isLoading ? (
                // --- LOADING SKELETON ---
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-5 w-[60px] mx-auto rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[40px] ml-auto" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                // --- ERROR STATE ---
                <TableRow>
                   <TableCell colSpan={6} className="h-60 text-center">
                      <div className="flex flex-col items-center justify-center text-red-500 gap-2">
                        <AlertCircle className="h-8 w-8" />
                        <p>{error}</p>
                        <Button variant="outline" size="sm" onClick={() => fetchProducts(0)}>Thử lại</Button>
                      </div>
                   </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                // --- EMPTY STATE ---
                <TableRow>
                  <TableCell colSpan={6} className="h-60 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <PackageOpen className="h-10 w-10 opacity-20" />
                      <p>Chưa có món ăn nào trong hệ thống.</p>
                      <Button variant="link" onClick={handleAddNew}>Thêm ngay</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // --- DATA ROWS ---
                products.map((product) => (
                  <TableRow key={product.id} className="group hover:bg-gray-50/50 transition-colors">
                    <TableCell className="pl-6 py-3">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden border bg-white shadow-sm group-hover:shadow-md transition-all">
                        {product.image ? (
                           <Image
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs text-gray-400">N/A</div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="font-medium text-gray-900">
                        {product.name}
                    </TableCell>
                    
                    <TableCell className="text-right font-semibold text-primary">
                      {formatPrice(product.price)}
                    </TableCell>
                    
                    <TableCell className="text-center">
                        {product.stockQuantity > 0 ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                                Còn hàng
                            </Badge>
                        ) : (
                            <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 shadow-none">
                                Hết hàng
                            </Badge>
                        )}
                    </TableCell>

                    <TableCell className="text-right text-gray-600">
                      {product.stockQuantity}
                    </TableCell>

                    <TableCell className="text-center pr-6">
                      <ProductActions 
                        product={product}
                        onEdit={() => handleEdit(product)}
                        onProductDeleted={handleProductSaved}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* --- FOOTER PAGINATION --- */}
        {!isLoading && !error && products.length > 0 && (
            <CardFooter className="border-t bg-gray-50/50 py-4 flex justify-center">
                 <PaginationControl 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
            </CardFooter>
        )}
      </Card>

      {/* --- FORM DIALOG --- */}
      <ProductFormDialog
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onProductSaved={handleProductSaved}
        initialData={currentProduct}
      />
    </div>
  );
}