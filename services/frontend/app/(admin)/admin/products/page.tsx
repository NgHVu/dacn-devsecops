"use client";

import React, { useState, useEffect, useCallback } from "react";
import { productService } from "@/services/productService";
import { type Product } from "@/types/product";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, PlusCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

import { ProductActions } from "@/components/admin/ProductActions";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import { PaginationControl } from "@/components/ui/PaginationControl"; // Import mới

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 10; 

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async (pageIndex: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await productService.getProducts({ page: pageIndex, size: PAGE_SIZE });
      
      setProducts(data.content);
      setTotalPages(data.totalPages); 
      setCurrentPage(data.number);    
      
    } catch (err) {
      console.error("Lỗi khi tải sản phẩm:", err);
      setError("Không thể tải danh sách sản phẩm.");
      toast.error("Không thể tải danh sách sản phẩm.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [fetchProducts, currentPage]);

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

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quản lý Sản phẩm</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm Sản phẩm mới
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : !isLoading && error ? (
        <div className="flex flex-col items-center py-12 text-center text-red-500">
          <AlertTriangle className="h-12 w-12" />
          <p className="mt-4 text-xl font-semibold">{error}</p>
          <Button onClick={() => fetchProducts(0)} className="mt-4">
            Thử lại
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Hình ảnh</TableHead>
                  <TableHead>Tên Sản phẩm</TableHead>
                  <TableHead className="text-right">Giá</TableHead>
                  <TableHead className="text-right">Kho</TableHead>
                  <TableHead className="w-[100px] text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      Chưa có sản phẩm nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="relative h-12 w-12 rounded-md overflow-hidden border bg-gray-100">
                            {product.image ? (
                                <Image
                                src={getImageUrl(product.image)}
                                alt={product.name}
                                fill
                                className="object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No img</div>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right text-green-600 font-bold">
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell className="text-right">{product.stockQuantity}</TableCell>
                      <TableCell className="text-center">
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
          </div>

          <PaginationControl 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </>
      )}

      <ProductFormDialog
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onProductSaved={handleProductSaved}
        initialData={currentProduct}
      />
    </div>
  );
}