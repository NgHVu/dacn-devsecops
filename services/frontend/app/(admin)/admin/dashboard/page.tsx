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
  Download,
  TrendingUp
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice } from "@/lib/utils";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid
} from "recharts";
import { adminService } from "@/services/adminService";
import { DashboardStats } from "@/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton"; 

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
      return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <Skeleton className="h-8 w-48" />
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-32" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Skeleton className="col-span-4 h-[400px] rounded-xl" />
                <Skeleton className="col-span-3 h-[400px] rounded-xl" />
            </div>
        </div>
      );
  }

  const chartColors = {
      stroke: "#888888",
      fill: "#ea580c", 
      activeFill: "#f97316", 
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Tổng quan</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="hidden sm:flex border-border bg-background hover:bg-accent text-foreground">
             <Calendar className="mr-2 h-4 w-4" />
             Tháng này
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20 border-0">
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 border border-border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Tổng quan</TabsTrigger>
          <TabsTrigger value="analytics" disabled className="text-muted-foreground">Phân tích (Coming soon)</TabsTrigger>
          <TabsTrigger value="reports" disabled className="text-muted-foreground">Báo cáo (Coming soon)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            
            <Card className="border-border shadow-sm bg-card hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tổng doanh thu</CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatPrice(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                   <span className="text-green-600 dark:text-green-400 font-bold flex items-center mr-1">
                      <ArrowUpRight className="h-3 w-3 mr-0.5" /> +{stats.revenueGrowth}%
                   </span> 
                   so với tháng trước
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm bg-card hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Đơn hàng</CardTitle>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                    <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">+{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">Tổng số đơn hàng</p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm bg-card hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Món đang bán</CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.activeProducts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                   Sản phẩm đang hiển thị
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm bg-card hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Khách hàng mới</CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                    <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">+{stats.newCustomers}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                   <span className="text-green-600 dark:text-green-400 font-bold flex items-center mr-1">
                      <TrendingUp className="h-3 w-3 mr-0.5" /> +12.5%
                   </span> 
                   trong tháng này
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            
            <Card className="col-span-4 border-border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Biểu đồ doanh thu</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Tổng quan doanh thu theo từng tháng trong năm nay.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-0">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.monthlyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                            
                            <XAxis 
                                dataKey="name" 
                                stroke={chartColors.stroke} 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{ fill: 'var(--muted-foreground)' }} 
                            />
                            <YAxis
                                stroke={chartColors.stroke}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value / 1000000}M`}
                                tick={{ fill: 'var(--muted-foreground)' }}
                            />
                            <Tooltip 
                                cursor={{fill: 'var(--muted)', opacity: 0.2}}
                                contentStyle={{ 
                                    backgroundColor: 'var(--card)', 
                                    borderColor: 'var(--border)',
                                    color: 'var(--foreground)',
                                    borderRadius: '8px', 
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                                }}
                                formatter={(value: number) => [formatPrice(value), "Doanh thu"]}
                                labelStyle={{ color: 'var(--muted-foreground)' }}
                            />
                            <Bar 
                                dataKey="total" 
                                fill={chartColors.fill} 
                                radius={[4, 4, 0, 0]} 
                                maxBarSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3 border-border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Giao dịch gần đây</CardTitle>
                <CardDescription className="text-muted-foreground">
                  5 đơn hàng mới nhất vừa được đặt.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                    {stats.recentSales.map((sale) => (
                        <div key={sale.id} className="flex items-center group cursor-default">
                            <Avatar className="h-9 w-9 border border-border">
                                <AvatarImage src={sale.user.avatar || `https://ui-avatars.com/api/?name=${sale.user.name}&background=random`} alt="Avatar" />
                                <AvatarFallback className="bg-muted text-muted-foreground">
                                    {sale.user.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none text-foreground group-hover:text-primary transition-colors">
                                    {sale.user.name}
                                </p>
                                <p className="text-xs text-muted-foreground">{sale.user.email}</p>
                            </div>
                            <div className="ml-auto font-bold text-green-600 dark:text-green-400">
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