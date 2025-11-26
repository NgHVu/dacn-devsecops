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
  Calendar, 
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
import { adminService } from "@/services/adminService";
import { DashboardStats } from "@/types/dashboard";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading || !stats) {
      return <div className="flex items-center justify-center h-[50vh]">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Tổng quan</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="hidden sm:flex">
             <Calendar className="mr-2 h-4 w-4" />
             Tháng này
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20">
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-zinc-100">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="analytics" disabled>Phân tích (Coming soon)</TabsTrigger>
          <TabsTrigger value="reports" disabled>Báo cáo (Coming soon)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          
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
                <div className="text-2xl font-bold text-zinc-900">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">Tổng số đơn hàng</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-shadow opacity-60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-600">Món đang bán</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900">--</div>
                <p className="text-xs text-muted-foreground mt-1">
                   Sản phẩm đang hiển thị
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
                      <ArrowUpRight className="h-3 w-3 mr-0.5" /> +100%
                   </span> 
                   trong tháng này
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            
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
                                fill="#ea580c"
                                radius={[4, 4, 0, 0]} 
                                maxBarSize={50}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

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
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none text-zinc-900">
                                    User #{sale.userId}
                                </p>
                                <p className="text-xs text-zinc-500">Mã đơn: {sale.id}</p>
                            </div>
                            <div className="ml-auto font-bold text-green-600">
                                +{formatPrice(sale.totalAmount)}
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