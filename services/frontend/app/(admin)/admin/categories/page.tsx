"use client";

import React, { useEffect, useState, useCallback } from "react";
import { categoryService } from "@/services/categoryService";
import { Category } from "@/types/product";
import { toast } from "sonner";

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

import { 
  PlusCircle, 
  Search, 
  RotateCcw, 
  Layers, 
  FolderOpen,
  AlertCircle 
} from "lucide-react";

import { CategoryFormDialog } from "@/components/admin/CategoryFormDialog";
import { CategoryActions } from "@/components/admin/CategoryActions";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error("Lỗi tải danh mục:", err);
      setError("Không thể kết nối đến máy chủ.");
      toast.error("Lỗi tải danh mục");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddNew = () => {
    setCurrentCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category: Category) => {
    setCurrentCategory(category);
    setIsFormOpen(true);
  };

  const handleSaved = () => {
    fetchCategories(); 
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Danh mục</h1>
          <p className="text-zinc-500">
            Quản lý nhóm món ăn (Món chính, Đồ uống, Tráng miệng...)
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={fetchCategories} className="hover:bg-zinc-100">
            <RotateCcw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          <Button onClick={handleAddNew} size="sm" className="bg-orange-600 hover:bg-orange-500 shadow-md shadow-orange-600/20">
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm danh mục
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="p-4 sm:p-6 border-b border-zinc-100 bg-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              Danh sách danh mục
              <Badge variant="secondary" className="text-xs font-normal bg-zinc-100 text-zinc-600">
                 {filteredCategories.length} items
              </Badge>
            </CardTitle>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Tìm danh mục..."
                className="pl-9 bg-zinc-50 border-zinc-200 focus-visible:ring-orange-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-zinc-100">
                <TableHead className="w-[80px] pl-6 text-center">ID</TableHead>
                <TableHead className="min-w-[200px]">Tên danh mục</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="text-right">Số món (Demo)</TableHead>
                <TableHead className="w-[100px] text-center pr-6">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6 text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                   <TableCell colSpan={5} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center text-red-500 gap-2">
                        <AlertCircle className="h-8 w-8" />
                        <p>{error}</p>
                        <Button variant="outline" size="sm" onClick={fetchCategories}>Thử lại</Button>
                      </div>
                   </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <FolderOpen className="h-10 w-10 text-zinc-300" />
                        <p>Không tìm thấy danh mục nào.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((cat) => (
                  <TableRow key={cat.id} className="group hover:bg-orange-50/30 transition-colors border-zinc-100">
                    <TableCell className="pl-6 text-center font-mono text-xs text-zinc-500">#{cat.id}</TableCell>
                    <TableCell className="font-semibold text-zinc-900">{cat.name}</TableCell>
                    <TableCell className="text-zinc-500 text-sm max-w-[300px] truncate">{cat.description || "—"}</TableCell>
                    <TableCell className="text-right text-zinc-400 text-sm italic">--</TableCell>
                    <TableCell className="text-center pr-6">
                        <CategoryActions 
                            category={cat}
                            onEdit={() => handleEdit(cat)}
                            onDeleted={handleSaved}
                        />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        <CardFooter className="border-t border-zinc-100 bg-zinc-50/30 py-3 flex justify-between text-xs text-zinc-500">
            <span>Hiển thị {filteredCategories.length} kết quả</span>
            <span>Trang 1/1</span>
        </CardFooter>
      </Card>

      <CategoryFormDialog 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={handleSaved}
        initialData={currentCategory}
      />
    </div>
  );
}