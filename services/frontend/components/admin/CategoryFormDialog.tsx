"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { categoryService } from "@/services/categoryService";
import { Category } from "@/types/product";
import { Loader2, FolderPlus, Grid } from "lucide-react";
import { iconMap } from "@/config/iconMapping"; 

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const categorySchema = z.object({
  name: z.string().min(2, "Tên danh mục phải có ít nhất 2 ký tự"),
  description: z.string().optional(),
  icon: z.string().optional(), 
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
    defaultValues: { name: "", description: "", icon: "Utensils" },
  });

  useEffect(() => {
    if (isOpen) {
        form.reset({
            name: initialData?.name || "",
            description: initialData?.description || "",
            icon: initialData?.icon || "Utensils",
        });
    }
  }, [isOpen, initialData, form]);

  const onSubmit = async (values: z.infer<typeof categorySchema>) => {
    try {
      setIsSubmitting(true);
      if (initialData) {
          await categoryService.updateCategory(initialData.id, values); 
          toast.success("Cập nhật danh mục thành công!");
      } else {
          await categoryService.createCategory(values);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-orange-600 flex items-center gap-2">
            <FolderPlus className="h-5 w-5" /> {mode} danh mục
          </DialogTitle>
          <DialogDescription>
            Điền thông tin và chọn biểu tượng cho danh mục món ăn.
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
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Grid className="w-4 h-4" /> Chọn biểu tượng
                  </FormLabel>
                  <FormControl>
                    <div className="border rounded-md p-3 bg-muted/20">
                      <ScrollArea className="h-[120px] w-full pr-3">
                        <div className="grid grid-cols-6 gap-2">
                          {Object.keys(iconMap).map((iconName) => {
                            const IconComponent = iconMap[iconName];
                            const isSelected = field.value === iconName;
                            
                            return (
                              <div
                                key={iconName}
                                onClick={() => form.setValue("icon", iconName)}
                                className={cn(
                                  "cursor-pointer flex flex-col items-center justify-center p-2 rounded-md transition-all duration-200 border",
                                  isSelected 
                                    ? "bg-orange-100 border-orange-500 text-orange-600 shadow-sm scale-105" 
                                    : "bg-white border-transparent hover:bg-zinc-100 hover:border-zinc-200 text-muted-foreground"
                                )}
                                title={iconName}
                              >
                                <IconComponent className="h-5 w-5" />
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
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