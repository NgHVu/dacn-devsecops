"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { userService } from "@/services/userService";
import { UserResponse } from "@/types/auth";
import { toast } from "sonner";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { UserRoleBadge } from "@/components/admin/UserRoleBadge";

// Icons
import { 
  Users, 
  Search, 
  RotateCcw, 
  Mail, 
  Phone, 
  MapPin,
  MoreHorizontal,
  Shield,
  Ban
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminUsersPage() {
  const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const ROWS_PER_PAGE = 10;

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      // Lấy 1000 user để xử lý client-side
      const data = await userService.getAllUsers(0, 1000);
      setAllUsers(data.content);
      setCurrentPage(0);
    } catch (err) {
      console.error("Lỗi tải user:", err);
      toast.error("Không thể tải danh sách người dùng.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filtering
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return allUsers;
    const q = searchQuery.toLowerCase();
    return allUsers.filter(user => 
        user.name.toLowerCase().includes(q) || 
        user.email.toLowerCase().includes(q) ||
        user.phoneNumber?.includes(q) ||
        user.id.toString().includes(q)
    );
  }, [allUsers, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ROWS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
      currentPage * ROWS_PER_PAGE,
      (currentPage + 1) * ROWS_PER_PAGE
  );

  const handleRefresh = () => {
    fetchUsers();
    toast.info("Đang làm mới dữ liệu...");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Người dùng</h1>
          <p className="text-zinc-500">
            Quản lý tài khoản khách hàng và phân quyền quản trị.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="hover:bg-zinc-100">
            <RotateCcw className="mr-2 h-4 w-4" /> Cập nhật
        </Button>
      </div>

      {/* MAIN CARD */}
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="p-4 sm:p-6 border-b border-zinc-100 bg-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Danh sách tài khoản
              <Badge variant="secondary" className="text-xs font-normal bg-zinc-100 text-zinc-600">
                 {filteredUsers.length} users
              </Badge>
            </CardTitle>
            
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Tìm tên, email, sđt..."
                className="pl-9 bg-zinc-50 border-zinc-200"
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(0);
                }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-zinc-100">
                <TableHead className="w-[250px] pl-6">Người dùng</TableHead>
                <TableHead>Thông tin liên hệ</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead className="text-center">Vai trò</TableHead>
                <TableHead className="text-right pr-6">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                    Không tìm thấy người dùng nào.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-blue-50/30 transition-colors border-zinc-100">
                    <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-zinc-200">
                                <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold text-zinc-900">{user.name}</span>
                                <span className="text-xs text-zinc-500">ID: #{user.id}</span>
                            </div>
                        </div>
                    </TableCell>
                    
                    <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center gap-2 text-zinc-700">
                                <Mail className="h-3.5 w-3.5 text-zinc-400" /> {user.email}
                            </div>
                            {user.phoneNumber && (
                                <div className="flex items-center gap-2 text-zinc-700">
                                    <Phone className="h-3.5 w-3.5 text-zinc-400" /> {user.phoneNumber}
                                </div>
                            )}
                        </div>
                    </TableCell>

                    <TableCell>
                        <div className="flex items-start gap-2 text-sm text-zinc-600 max-w-[250px]">
                            <MapPin className="h-3.5 w-3.5 text-zinc-400 mt-0.5 shrink-0" /> 
                            <span className="truncate">{user.address || "Chưa cập nhật"}</span>
                        </div>
                    </TableCell>

                    <TableCell className="text-center">
                        <UserRoleBadge role={user.role} />
                    </TableCell>

                    <TableCell className="text-right pr-6">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Quản lý</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => toast.info("Tính năng xem chi tiết đang phát triển")}>
                                    Xem chi tiết
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                    <Ban className="mr-2 h-4 w-4" /> Khóa tài khoản
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* FOOTER PAGINATION */}
        {!isLoading && paginatedUsers.length > 0 && (
            <CardFooter className="border-t border-zinc-100 bg-zinc-50/30 py-4 flex justify-center">
                 <PaginationControl 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={setCurrentPage} 
                  />
            </CardFooter>
        )}
      </Card>
    </div>
  );
}