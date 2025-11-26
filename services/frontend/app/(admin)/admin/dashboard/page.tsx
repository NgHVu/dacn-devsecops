"use client";

import React, { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Users, 
  CreditCard, 
  Activity, 
  ArrowUpRight, 
  Calendar, // [FIX] Đổi CalendarDate thành Calendar
  Download
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice } from "@/lib/utils";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip 
} from "recharts";

// --- 1. TYPES & INTERFACES (Chuẩn bị cho Backend) ---
// TODO: Sau này Backend cần trả về JSON theo cấu trúc này
// API Suggestion: GET /api/admin/stats/dashboard
interface DashboardStats {
  totalRevenue: number;     // Tổng doanh thu
  revenueGrowth: number;    // Tăng trưởng doanh thu (%) so với tháng trước
  
  totalOrders: number;      // Tổng đơn hàng
  ordersGrowth: number;     // Tăng trưởng đơn hàng (%)
  
  activeProducts: number;   // Số món đang bán
  
  newCustomers: number;     // Số khách hàng mới trong tháng
  
  recentSales: Array<{      // 5 đơn hàng gần nhất
    id: number;
    user: { name: string; email: string; avatar?: string };
    amount: number;
  }>;
  
  monthlyRevenue: Array<{   // Dữ liệu biểu đồ doanh thu 12 tháng
    name: string;
    total: number;
  }>;
}

// --- 2. MOCK DATA (Dữ liệu giả lập) ---
const MOCK_DATA: DashboardStats = {
  totalRevenue: 152300000, // 152 triệu
  revenueGrowth: 20.1,
  totalOrders: 2350,
  ordersGrowth: 180.1,
  activeProducts: 45,
  newCustomers: 573,
  recentSales: [
    { id: 1, user: { name: "Nguyễn Văn A", email: "a@example.com" }, amount: 550000 },
    { id: 2, user: { name: "Trần Thị B", email: "b@example.com" }, amount: 230000 },
    { id: 3, user: { name: "Lê Văn C", email: "c@example.com" }, amount: 120000 },
    { id: 4, user: { name: "Phạm Thị D", email: "d@example.com" }, amount: 850000 },
    { id: 5, user: { name: "Hoàng Văn E", email: "e@example.com" }, amount: 90000 },
  ],
  monthlyRevenue: [
    { name: "T1", total: 12000000 },
    { name: "T2", total: 15000000 },
    { name: "T3", total: 35000000 },
    { name: "T4", total: 28000000 },
    { name: "T5", total: 45000000 },
    { name: "T6", total: 52000000 },
    { name: "T7", total: 48000000 },
    { name: "T8", total: 60000000 },
    { name: "T9", total: 55000000 },
    { name: "T10", total: 65000000 },
    { name: "T11", total: 72000000 },
    { name: "T12", total: 85000000 },
  ]
};

export default function DashboardPage() {
  // State để sau này fetch API
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Giả lập gọi API
    // const fetchStats = async () => {
    //    const res = await fetch('/api/admin/stats/dashboard');
    //    setStats(await res.json());
    // }
    
    // Dùng Mock Data
    setTimeout(() => {
        setStats(MOCK_DATA);
        setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading || !stats) {
      return <div className="flex items-center justify-center h-[50vh]">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      
      {/* Header & Actions */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Tổng quan</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="hidden sm:flex">
             {/* [FIX] Sử dụng icon Calendar */}
             <Calendar className="mr-2 h-4 w-4" />
             Tháng này
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20">
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Tabs Filter (Ví dụ) */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-zinc-100">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="analytics" disabled>Phân tích (Coming soon)</TabsTrigger>
          <TabsTrigger value="reports" disabled>Báo cáo (Coming soon)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          
          {/* 1. STATS CARDS */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-600">Tổng doanh thu</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900">{formatPrice(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                   <span className="text-green-600 font-bold flex items-center mr-1">
                      <ArrowUpRight className="h-3 w-3 mr-0.5" /> +{stats.revenueGrowth}%
                   </span> 
                   so với tháng trước
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-600">Đơn hàng</CardTitle>
                <CreditCard className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900">+{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                   <span className="text-green-600 font-bold flex items-center mr-1">
                      <ArrowUpRight className="h-3 w-3 mr-0.5" /> +{stats.ordersGrowth}%
                   </span> 
                   so với tháng trước
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-600">Món đang bán</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900">{stats.activeProducts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                   Sản phẩm đang hiển thị trên thực đơn
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-600">Khách hàng mới</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900">+{stats.newCustomers}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                   <span className="text-green-600 font-bold flex items-center mr-1">
                      <ArrowUpRight className="h-3 w-3 mr-0.5" /> +4.5%
                   </span> 
                   trong 30 ngày qua
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 2. CHARTS & RECENT SALES */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            
            {/* Bar Chart */}
            <Card className="col-span-4 border-zinc-200 shadow-sm">
              <CardHeader>
                <CardTitle>Biểu đồ doanh thu</CardTitle>
                <CardDescription>
                    Tổng quan doanh thu theo từng tháng trong năm nay.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.monthlyRevenue}>
                            <XAxis 
                                dataKey="name" 
                                stroke="#888888" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value / 1000000}M`}
                            />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value: number) => [formatPrice(value), "Doanh thu"]}
                            />
                            <Bar 
                                dataKey="total" 
                                fill="#ea580c" // Màu cam (Orange-600)
                                radius={[4, 4, 0, 0]} 
                                maxBarSize={50}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Sales List */}
            <Card className="col-span-3 border-zinc-200 shadow-sm">
              <CardHeader>
                <CardTitle>Giao dịch gần đây</CardTitle>
                <CardDescription>
                  5 đơn hàng mới nhất vừa được đặt.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                    {stats.recentSales.map((sale) => (
                        <div key={sale.id} className="flex items-center">
                            <Avatar className="h-9 w-9 border">
                                <AvatarImage src={sale.user.avatar || `https://ui-avatars.com/api/?name=${sale.user.name}&background=random`} alt="Avatar" />
                                <AvatarFallback>{sale.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none text-zinc-900">{sale.user.name}</p>
                                <p className="text-xs text-zinc-500">{sale.user.email}</p>
                            </div>
                            <div className="ml-auto font-bold text-green-600">
                                +{formatPrice(sale.amount)}
                            </div>
                        </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}