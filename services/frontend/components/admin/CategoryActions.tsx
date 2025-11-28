"use client";

import React, { useState } from "react";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Category } from "@/types/product";

interface CategoryActionsProps {
  category: Category;
  onDeleted: () => void;
  onEdit: () => void;
}

export function CategoryActions({ category, onDeleted, onEdit }: CategoryActionsProps) {
  
  const handleDelete = () => {
      if (confirm(`Bạn có chắc muốn xóa danh mục "${category.name}"?`)) {
          toast.success("Đã xóa danh mục (Demo)");
          onDeleted();
      }
  };

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-100 rounded-full">
            <span className="sr-only">Mở menu</span>
            <MoreHorizontal className="h-4 w-4 text-zinc-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Hành động</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4 text-blue-500" />
            Sửa đổi
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa bỏ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}