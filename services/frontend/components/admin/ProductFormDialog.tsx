"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService"; 
import { 
  type Product, 
  type ProductFormData, 
  productSchema,
  type CreateProductRequest,
  type Category 
} from "@/types/product";
import { getImageUrl } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; 
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

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
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const mode = initialData ? "Cập nhật" : "Tạo mới";
  
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stockQuantity: 0,
      image: "",
      categoryId: 0, 
    },
  });

  useEffect(() => {
    if (isOpen) {
      const loadCategories = async () => {
        setIsLoadingCategories(true);
        try {
          const data = await categoryService.getAllCategories();
          setCategories(data);
          
          if (!initialData && data.length > 0) {
             form.setValue('categoryId', data[0].id);
          }
        } catch (error) {
          console.error("Failed to load categories", error);
          toast.error("Không thể tải danh sách danh mục");
        } finally {
          setIsLoadingCategories(false);
        }
      };
      loadCategories();
    }
  }, [isOpen, initialData, form]);

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: initialData?.name || "",
        description: initialData?.description || "", 
        price: initialData?.price || 0,
        stockQuantity: initialData?.stockQuantity || 0,
        image: initialData?.image || "",
        categoryId: initialData?.category?.id || 0, 
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
      categoryId: data.categoryId, 
    };

    try {
      if (initialData) {
        await productService.updateProduct(initialData.id, requestData);
        toast.success(`Đã cập nhật: ${data.name}`);
      } else {
        await productService.createProduct(requestData);
        toast.success(`Đã tạo mới: ${data.name}`);
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

  const imageUrl = form.watch("image");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-orange-600">{mode} Sản phẩm</DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết về món ăn. Nhấn lưu để hoàn tất.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tên món ăn <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <Input placeholder="Ví dụ: Phở Bò Đặc Biệt" {...field} value={field.value as string} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Danh mục món <span className="text-red-500">*</span></FormLabel>
                            <Select 
                                disabled={isLoadingCategories} 
                                onValueChange={(val: string) => field.onChange(Number(val))} 
                                value={field.value ? String(field.value) : undefined}
                            >
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingCategories ? "Đang tải..." : "Chọn danh mục"} />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                <FormLabel>Giá bán (VNĐ) <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                <Input type="number" step="1000" {...field} value={field.value as number} />
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
                                <FormLabel>Số lượng kho</FormLabel>
                                <FormControl>
                                <Input type="number" {...field} value={field.value as number} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Mô tả</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="Mô tả ngắn gọn về món ăn..." 
                                    className="resize-none min-h-[100px]" 
                                    {...field} 
                                    value={field.value as string} 
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Link Hình ảnh</FormLabel>
                            <FormControl>
                                <Input placeholder="https://example.com/image.jpg" {...field} value={field.value as string} />
                            </FormControl>
                            <FormDescription className="text-xs">
                                Dán đường dẫn ảnh trực tiếp vào đây.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="mt-2 border-2 border-dashed border-zinc-200 rounded-xl w-full aspect-square flex flex-col items-center justify-center bg-zinc-50 overflow-hidden relative">
                        {imageUrl ? (
                            <Image 
                                src={getImageUrl(imageUrl as string)} 
                                alt="Preview" 
                                fill 
                                className="object-cover"
                                onError={() => toast.error("Link ảnh không hợp lệ")}
                            />
                        ) : (
                            <div className="text-center text-zinc-400 p-4">
                                <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Xem trước ảnh</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DialogFooter className="gap-2 sm:space-x-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-500 text-white">
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
                    </>
                ) : (
                    "Lưu sản phẩm"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}