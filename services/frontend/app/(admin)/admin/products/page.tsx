"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
// Dùng Avatar để handle ảnh lỗi tự động
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Icons
import { 
  PlusCircle, 
  Search, 
  RotateCcw, 
  PackageOpen, 
  AlertCircle,
  Filter,
  ImageIcon
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
  const PAGE_SIZE = 8; // Giữ 8 item để vừa màn hình

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProducts = useCallback(async (pageIndex: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await productService.getProducts({ 
          page: pageIndex, 
          size: PAGE_SIZE,
          name: searchQuery || undefined 
      });
      
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
  }, [searchQuery]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
        if (currentPage !== 0 && searchQuery) {
             // Nếu đang search mà không ở trang 1 thì reset về trang 1
             fetchProducts(0);
        } else {
             fetchProducts(currentPage);
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]); // Bỏ fetchProducts khỏi deps để tránh loop, logic search xử lý riêng

  // Effect riêng cho pagination buttons (không debounce)
  useEffect(() => {
      if (!searchQuery) fetchProducts(currentPage);
  }, [currentPage]);


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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Món ăn</h1>
          <p className="text-zinc-500">
            Quản lý danh sách thực đơn, giá cả và tồn kho.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={handleRefresh} className="hover:bg-zinc-100">
            <RotateCcw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          <Button onClick={handleAddNew} size="sm" className="bg-orange-600 hover:bg-orange-500 shadow-md shadow-orange-600/20">
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm món mới
          </Button>
        </div>
      </div>

      {/* --- MAIN CARD --- */}
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="p-4 sm:p-6 border-b border-zinc-100 bg-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Danh sách món ăn
                <Badge variant="secondary" className="text-xs font-normal bg-zinc-100 text-zinc-600">
                    Tổng: {products.length} (Trang hiện tại)
                </Badge>
            </CardTitle>
            
            {/* Toolbar */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                        type="search"
                        placeholder="Tìm kiếm món ăn..."
                        className="pl-9 bg-zinc-50 border-zinc-200 focus-visible:ring-orange-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon" className="shrink-0 text-zinc-500 border-zinc-200 hover:bg-zinc-50">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-zinc-100">
                <TableHead className="w-[80px] pl-6">Ảnh</TableHead>
                <TableHead className="min-w-[200px]">Tên món ăn</TableHead>
                <TableHead className="text-right">Giá bán</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right">Tồn kho</TableHead>
                <TableHead className="w-[100px] text-center pr-6">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {isLoading ? (
                // --- LOADING SKELETON (FIXED: 8 ROWS) ---
                // Sửa lại length: 8 để khớp với PAGE_SIZE -> Hết giật khi chuyển trang
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-12 w-12 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[180px] mb-2" /><Skeleton className="h-3 w-[100px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-[80px] mx-auto rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[40px] ml-auto" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                // --- ERROR STATE ---
                <TableRow>
                   <TableCell colSpan={6} className="h-60 text-center">
                      <div className="flex flex-col items-center justify-center text-red-500 gap-2">
                        <AlertCircle className="h-10 w-10" />
                        <p className="font-medium">{error}</p>
                        <Button variant="outline" size="sm" onClick={() => fetchProducts(0)}>Thử lại</Button>
                      </div>
                   </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                // --- EMPTY STATE ---
                <TableRow>
                  <TableCell colSpan={6} className="h-60 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-400 gap-2">
                      <div className="bg-zinc-100 p-4 rounded-full">
                          <PackageOpen className="h-10 w-10 text-zinc-300" />
                      </div>
                      <p className="font-medium text-zinc-600">Không tìm thấy món ăn nào</p>
                      <p className="text-sm">Thử thay đổi từ khóa hoặc thêm món mới.</p>
                      <Button variant="link" onClick={handleAddNew} className="text-orange-600">Thêm ngay</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // --- DATA ROWS ---
                products.map((product) => (
                  <TableRow key={product.id} className="group hover:bg-orange-50/30 transition-colors border-zinc-100">
                    <TableCell className="pl-6 py-3">
                      {/* SỬA LỖI HÌNH: Dùng Avatar vuông (rounded-lg) để có fallback khi ảnh lỗi */}
                      <Avatar className="h-12 w-12 rounded-lg border border-zinc-200 bg-white">
                        <AvatarImage 
                            src={getImageUrl(product.image)} 
                            alt={product.name} 
                            className="object-cover"
                        />
                        <AvatarFallback className="rounded-lg bg-zinc-50 text-zinc-300">
                            <ImageIcon className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-semibold text-zinc-900">{product.name}</span>
                            <span className="text-xs text-zinc-500 line-clamp-1">{product.description || "Không có mô tả"}</span>
                        </div>
                    </TableCell>
                    
                    <TableCell className="text-right font-bold text-zinc-700 tabular-nums">
                      {formatPrice(product.price)}
                    </TableCell>
                    
                    <TableCell className="text-center">
                        {product.stockQuantity > 10 ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                                Còn hàng
                            </Badge>
                        ) : product.stockQuantity > 0 ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
                                Sắp hết
                            </Badge>
                        ) : (
                            <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 shadow-none">
                                Hết hàng
                            </Badge>
                        )}
                    </TableCell>

                    <TableCell className="text-right text-zinc-600 tabular-nums">
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
            <CardFooter className="border-t border-zinc-100 bg-zinc-50/30 py-4 flex justify-center">
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