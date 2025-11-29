"use client";

import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { categoryService } from "@/services/categoryService";
import { Category } from "@/types/product";
import { Plus, Layers, Search, Filter, RotateCcw, AlertCircle, FolderOpen } from "lucide-react";
import { getIconComponent } from "@/config/iconMapping";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { CategoryFormDialog } from "@/components/admin/CategoryFormDialog";
import { CategoryActions } from "@/components/admin/CategoryActions";
import { PaginationControl } from "@/components/ui/PaginationControl"; 

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1); 
  const PAGE_SIZE = 8; 

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + PAGE_SIZE);

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Danh mục</h1>
          <p className="text-muted-foreground">
            Quản lý nhóm món ăn (Món chính, Đồ uống, Tráng miệng...)
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={fetchCategories} className="hover:bg-accent">
            <RotateCcw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          <Button onClick={handleAddNew} size="sm" className="bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20">
            <Plus className="mr-2 h-4 w-4" />
            Thêm danh mục
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="p-4 sm:p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-card-foreground">
              <Layers className="h-5 w-5 text-blue-600" />
              Danh sách danh mục
              <Badge variant="secondary" className="text-xs font-normal">
                 Hiển thị {paginatedCategories.length} / {filteredCategories.length} danh mục
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Tìm danh mục..."
                    className="pl-9 bg-background border-input focus-visible:ring-orange-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                </div>
                <Button variant="outline" size="icon" className="shrink-0">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-border">
                <TableHead className="w-[80px] pl-6 text-center">ID</TableHead>
                <TableHead className="w-[100px] text-center">Icon</TableHead>
                <TableHead className="min-w-[200px]">Tên danh mục</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="text-right">Số món</TableHead>
                <TableHead className="w-[100px] text-center pr-6">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="pl-6 text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-8 w-8 mx-auto rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                   <TableCell colSpan={6} className="h-40 text-center border-border">
                      <div className="flex flex-col items-center justify-center text-destructive gap-2">
                        <AlertCircle className="h-8 w-8" />
                        <p>{error}</p>
                        <Button variant="outline" size="sm" onClick={fetchCategories}>Thử lại</Button>
                      </div>
                   </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground border-border">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
                        <p>Không tìm thấy danh mục nào.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCategories.map((cat) => {
                    const IconComp = getIconComponent(cat.icon);

                    return (
                        <TableRow key={cat.id} className="group hover:bg-muted/50 transition-colors border-border">
                            <TableCell className="pl-6 text-center font-mono text-xs text-muted-foreground">#{cat.id}</TableCell>
                            
                            <TableCell className="text-center">
                                <div className="h-9 w-9 mx-auto rounded-lg bg-background border border-border flex items-center justify-center text-orange-600 shadow-sm">
                                    <IconComp className="h-5 w-5" />
                                </div>
                            </TableCell>

                            <TableCell className="font-semibold text-foreground">{cat.name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">{cat.description || "—"}</TableCell>
                            
                            <TableCell className="text-right font-medium text-foreground">
                                {cat.productCount !== undefined ? cat.productCount : 0}
                            </TableCell>

                            <TableCell className="text-center pr-6">
                                <CategoryActions 
                                    category={cat}
                                    onEdit={() => handleEdit(cat)}
                                    onDeleted={handleSaved}
                                />
                            </TableCell>
                        </TableRow>
                    );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        {!isLoading && !error && filteredCategories.length > 0 && (
            <CardFooter className="border-t border-border bg-muted/40 py-4 flex justify-center">
                 <PaginationControl 
                    currentPage={currentPage - 1} 

                    totalPages={totalPages} 
                    onPageChange={(page) => setCurrentPage(page + 1)} 
                 />
            </CardFooter>
        )}
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