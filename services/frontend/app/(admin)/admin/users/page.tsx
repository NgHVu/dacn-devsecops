"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { userService } from "@/services/userService";
import { UserResponse } from "@/types/auth";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { UserRoleBadge } from "@/components/admin/UserRoleBadge";

import { 
  Users, 
  Search, 
  RotateCcw, 
  Mail, 
  Phone, 
  MapPin,
  MoreHorizontal,
  Ban,
  Unlock,
  CheckCircle2,
  XCircle,
  Shield,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function AdminUsersPage() {
  const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(0);
  const ROWS_PER_PAGE = 10;

  const [searchQuery, setSearchQuery] = useState("");

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [userToAction, setUserToAction] = useState<UserResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
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

  const requestToggleLock = (user: UserResponse) => {
    if (user.role === "ROLE_ADMIN") {
        toast.warning("Không thể khóa tài khoản Quản trị viên.");
        return;
    }
    setUserToAction(user);
    setIsAlertOpen(true);
  };

  const handleConfirmLock = async () => {
    if (!userToAction) return;

    try {
        setIsProcessing(true);      
        const isCurrentlyLocked = !userToAction.accountNonLocked;
        const willLock = !isCurrentlyLocked; 

        await userService.lockUser(userToAction.id, willLock);
        
        const actionText = willLock ? "Khóa" : "Mở khóa";
        toast.success(`Đã ${actionText} tài khoản ${userToAction.name} thành công!`);
        
        setAllUsers(prev => prev.map(u => 
            u.id === userToAction.id ? { ...u, accountNonLocked: !willLock } : u
        ));

    } catch (error) {
        console.error(error);
        
        const apiError = error as ApiError;
        const msg = apiError.response?.data?.message || "Thao tác thất bại.";
        
        toast.error(msg);
    } finally {
        setIsProcessing(false);
        setIsAlertOpen(false);
        setUserToAction(null);
    }
  };

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
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Người dùng</h1>
          <p className="text-muted-foreground">
            Quản lý tài khoản khách hàng và phân quyền quản trị.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="hover:bg-accent">
                <RotateCcw className="mr-2 h-4 w-4" /> Cập nhật
            </Button>
        </div>
      </div>

      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="p-4 sm:p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-card-foreground">
              <Users className="h-5 w-5 text-blue-600" />
              Danh sách tài khoản
              <Badge variant="secondary" className="text-xs font-normal">
                 {filteredUsers.length} người dùng
              </Badge>
            </CardTitle>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên, email, sđt..."
                className="pl-9 bg-background border-input focus-visible:ring-blue-500"
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
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-border">
                <TableHead className="w-[250px] pl-6">Người dùng</TableHead>
                <TableHead>Thông tin liên hệ</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Trạng thái</TableHead> 
                <TableHead className="text-center">Vai trò</TableHead>
                <TableHead className="text-right pr-6">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
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
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-24 mx-auto rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground border-border">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="h-10 w-10 opacity-20" />
                        <p>Không tìm thấy người dùng nào.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => {
                  const isLocked = user.accountNonLocked === false; 
                  const isAdmin = user.role === "ROLE_ADMIN";

                  return (
                  <TableRow 
                    key={user.id} 
                    className={`group hover:bg-muted/50 transition-colors border-border 
                        ${isLocked 
                            ? "bg-red-500/10 dark:bg-red-900/20 hover:bg-red-500/20 dark:hover:bg-red-900/30" 
                            : ""}`}
                  >
                    <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className={`font-semibold ${isLocked ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                                    {user.name}
                                </span>
                                <span className="text-xs text-muted-foreground">ID: #{user.id}</span>
                            </div>
                        </div>
                    </TableCell>
                    
                    <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center gap-2 text-foreground/80">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {user.email}
                            </div>
                            {user.phoneNumber && (
                                <div className="flex items-center gap-2 text-foreground/80">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {user.phoneNumber}
                                </div>
                            )}
                        </div>
                    </TableCell>

                    <TableCell>
                        <div className="flex items-start gap-2 text-sm text-muted-foreground max-w-[200px]">
                            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /> 
                            <span className="truncate">{user.address || "Chưa cập nhật"}</span>
                        </div>
                    </TableCell>

                    <TableCell>
                        {isLocked ? (
                            <Badge variant="destructive" 
                                className="gap-1 pl-1 pr-2 bg-red-500/15 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/20 shadow-none hover:bg-red-500/25"
                            >
                                <XCircle className="h-3 w-3" /> Đã khóa
                            </Badge>
                        ) : (
                            <Badge variant="outline" 
                                className="gap-1 pl-1 pr-2 text-green-600 dark:text-green-400 border-green-500/20 bg-green-500/10"
                            >
                                <CheckCircle2 className="h-3 w-3" /> Hoạt động
                            </Badge>
                        )}
                    </TableCell>

                    <TableCell className="text-center">
                        <UserRoleBadge role={user.role} />
                    </TableCell>

                    <TableCell className="text-right pr-6">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Quản lý</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => toast.info("Tính năng xem chi tiết đang phát triển")}>
                                    Xem chi tiết
                                </DropdownMenuItem>
                                
                                {isAdmin ? (
                                    <DropdownMenuItem disabled className="text-muted-foreground cursor-not-allowed opacity-50">
                                        <Shield className="mr-2 h-4 w-4" /> Không thể khóa
                                    </DropdownMenuItem>
                                ) : (
                                    isLocked ? (
                                        <DropdownMenuItem 
                                            className="text-green-600 dark:text-green-400 focus:text-green-700 focus:bg-green-50 dark:focus:bg-green-900/20 cursor-pointer"
                                            onClick={() => requestToggleLock(user)}
                                        >
                                            <Unlock className="mr-2 h-4 w-4" /> Mở khóa tài khoản
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem 
                                            className="text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                                            onClick={() => requestToggleLock(user)}
                                        >
                                            <Ban className="mr-2 h-4 w-4" /> Khóa tài khoản
                                        </DropdownMenuItem>
                                    )
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        {!isLoading && paginatedUsers.length > 0 && (
            <CardFooter className="border-t border-border bg-muted/40 py-4 flex justify-center">
                 <PaginationControl 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={(page) => setCurrentPage(page)} 
                  />
            </CardFooter>
        )}
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
                {userToAction?.accountNonLocked ? "Khóa tài khoản?" : "Mở khóa tài khoản?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
                {userToAction?.accountNonLocked 
                    ? <span>Bạn có chắc chắn muốn khóa tài khoản <span className="font-bold text-foreground">{userToAction?.name}</span>? Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.</span>
                    : <span>Bạn có chắc chắn muốn mở khóa cho tài khoản <span className="font-bold text-foreground">{userToAction?.name}</span>?</span>
                }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction 
                onClick={(e) => {
                    e.preventDefault();
                    handleConfirmLock();
                }}
                className={userToAction?.accountNonLocked ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                disabled={isProcessing}
            >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                    userToAction?.accountNonLocked ? <Ban className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />
                )}
                {isProcessing ? "Đang xử lý..." : (userToAction?.accountNonLocked ? "Khóa ngay" : "Mở khóa")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}