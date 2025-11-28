"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { categoryService } from "@/services/categoryService";
import { Category } from "@/types/product";
import { Loader2, FolderPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; 
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
} from "@/components/ui/form";

const categorySchema = z.object({
  name: z.string().min(2, "Tên danh mục phải có ít nhất 2 ký tự"),
  description: z.string().optional(),
});

interface CategoryFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData: Category | null;
}

export function CategoryFormDialog({
  isOpen,
  onClose,
  onSaved,
  initialData,
}: CategoryFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mode = initialData ? "Cập nhật" : "Tạo mới";

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (isOpen) {
        form.reset({
            name: initialData?.name || "",
            description: initialData?.description || "",
        });
    }
  }, [isOpen, initialData, form]);

  const onSubmit = async (values: z.infer<typeof categorySchema>) => {
    try {
      setIsSubmitting(true);
      if (initialData) {
          await categoryService.createCategory(values.name, values.description); 
          toast.success("Cập nhật danh mục thành công!");
      } else {
          await categoryService.createCategory(values.name, values.description);
          toast.success("Tạo danh mục thành công!");
      }
      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi lưu danh mục.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-orange-600 flex items-center gap-2">
            <FolderPlus className="h-5 w-5" /> {mode} danh mục
          </DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết cho danh mục món ăn.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên danh mục <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: Tráng miệng" {...field} />
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
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Mô tả ngắn gọn..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Hủy bỏ
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}