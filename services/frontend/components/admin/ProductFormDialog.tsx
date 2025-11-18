"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { productService } from "@/services/productService";
import { 
  type Product, 
  type ProductFormData, 
  productSchema,
  type CreateProductRequest
} from "@/types/product";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProductSaved: () => void;
  initialData: Product | null;
}

export function ProductFormDialog({
  isOpen,
  onClose,
  onProductSaved,
  initialData,
}: ProductFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mode = initialData ? "Cập nhật" : "Tạo mới";
  const title = `${mode} Sản phẩm`;

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stockQuantity: 0,
      image: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: initialData?.name || "",
        description: initialData?.description || "",
        price: initialData?.price || 0,
        stockQuantity: initialData?.stockQuantity || 0,
        image: initialData?.image || "",
      });
    }
  }, [initialData, isOpen, form]);

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    
    const requestData: CreateProductRequest = {
      name: data.name,
      description: data.description || null,
      price: data.price,
      stockQuantity: data.stockQuantity,
      image: data.image || null,
      categoryId: 1, 
    };

    try {
      if (initialData) {
        await productService.updateProduct(initialData.id, requestData);
        toast.success(`Đã cập nhật sản phẩm: ${data.name}`);
      } else {
        await productService.createProduct(requestData);
        toast.success(`Đã tạo sản phẩm: ${data.name}`);
      }
      
      onProductSaved(); 
      onClose(); 
    } catch (err) {
      console.error("Lỗi khi lưu sản phẩm:", err);
      let message = "Đã xảy ra lỗi. Vui lòng thử lại.";
      if (isAxiosError(err) && err.response) {
        message = err.response.data?.message || message;
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên Sản phẩm</FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: Bún Bò Huế" {...field} value={field.value as string} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả (Tùy chọn)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="..." {...field} value={field.value as string} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá (VND)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="1000" 
                        {...field} 
                        value={field.value as number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số lượng Kho</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value as number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Hình ảnh (Tùy chọn)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} value={field.value as string} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}