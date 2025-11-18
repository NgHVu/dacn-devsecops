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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await productService.getProducts({ page: 0, size: 100 });
      setProducts(data.content);
    } catch (err) {
      console.error("Lỗi khi tải sản phẩm:", err);
      setError("Không thể tải danh sách sản phẩm.");
      toast.error("Không thể tải danh sách sản phẩm.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
    fetchProducts();
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

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center py-12 text-center text-red-500">
          <AlertTriangle className="h-12 w-12" />
          <p className="mt-4 text-xl font-semibold">{error}</p>
          <Button onClick={fetchProducts} className="mt-4">
            Thử lại
          </Button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Hình ảnh</TableHead>
                  <TableHead>Tên Sản phẩm</TableHead>
                  <TableHead className="text-right">Giá</TableHead>
                  <TableHead className="text-right">Số lượng Kho</TableHead>
                  <TableHead className="w-[100px] text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Chưa có sản phẩm nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Image
                          src={getImageUrl(product.image)}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">{formatPrice(product.price)}</TableCell>
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