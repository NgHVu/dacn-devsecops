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
  TrendingUp,
  Phone
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { DashboardStats } from "@/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * UTILS
 * Định nghĩa hàm formatPrice trực tiếp để đảm bảo tính ổn định 
 * nếu file lib/utils.ts gặp vấn đề về export.
 */
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

/**
 * MOCK ADMIN SERVICE
 * Định nghĩa mock data để trang có thể hiển thị ngay trong môi trường Preview.
 */
const mockAdminService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      totalRevenue: 125430000,
      revenueGrowth: 15.2,
      totalOrders: 452,
      ordersGrowth: 8.4,
      newCustomers: 28,
      activeProducts: 145,
      monthlyRevenue: [
        { name: "Tháng 1", total: 45000000 },
        { name: "Tháng 2", total: 52000000 },
        { name: "Tháng 3", total: 48000000 },
        { name: "Tháng 4", total: 61000000 },
        { name: "Tháng 5", total: 55000000 },
        { name: "Tháng 6", total: 67000000 },
      ],
      recentSales: [
        {
          id: 1,
          userId: 101,
          totalAmount: 250000,
          status: "COMPLETED",
          amount: 250000,
          user: { name: "Nguyễn Văn A", email: "a@gmail.com" }
        },
        {
          id: 2,
          userId: 102,
          totalAmount: 480000,
          status: "COMPLETED",
          amount: 480000,
          user: { name: "Trần Thị B", email: "b@gmail.com" }
        },
        {
          id: 3,
          userId: 103,
          totalAmount: 120000,
          status: "PENDING",
          amount: 120000,
          user: { name: "Lê Văn C", email: "c@gmail.com" }
        }
      ]
    };
  }
};

interface RecentSaleData {
  id: number;
  customerName: string;
  phoneNumber?: string | null;
  totalAmount: number;
}

interface StatCardProps {
  title: string;
  value: string;
  subValue: string;
  icon: React.ReactNode;
  iconBg: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await mockAdminService.getDashboardStats();

        const sanitizedData: DashboardStats = {
          ...data,
          activeProducts: data.activeProducts || 0,
          totalRevenue: data.totalRevenue || 0,
          totalOrders: data.totalOrders || 0,
          newCustomers: data.newCustomers || 0,
          revenueGrowth: data.revenueGrowth || 0,
        };

        setStats(sanitizedData);
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
    activeFill: "#f97316"
  };

  const recentSalesData: RecentSaleData[] = (stats.recentSales ?? []).map(
    (sale) => ({
      id: sale.id,
      customerName: sale.user?.name ?? "Khách hàng",
      phoneNumber: null,
      totalAmount: sale.totalAmount ?? 0
    })
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Tổng quan hệ thống
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden sm:flex border-border bg-background hover:bg-accent text-foreground"
          >
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
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Tổng quan
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            disabled
            className="text-muted-foreground"
          >
            Phân tích
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            disabled
            className="text-muted-foreground"
          >
            Báo cáo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Tổng doanh thu" 
              value={formatPrice(stats.totalRevenue)} 
              subValue={`+${stats.revenueGrowth}% so với tháng trước`}
              icon={<DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />}
              iconBg="bg-green-100 dark:bg-green-900/20"
            />
            <StatCard 
              title="Đơn hàng" 
              value={`+${stats.totalOrders}`} 
              subValue="Tổng số đơn hàng thành công"
              icon={<CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
              iconBg="bg-orange-100 dark:bg-orange-900/20"
            />
            <StatCard 
              title="Món đang bán" 
              value={stats.activeProducts.toString()} 
              subValue="Sản phẩm đang hiển thị trên web"
              icon={<Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
              iconBg="bg-blue-100 dark:bg-blue-900/20"
            />
            <StatCard 
              title="Khách hàng mới" 
              value={`+${stats.newCustomers}`} 
              subValue="+12.5% trong tháng này"
              icon={<Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
              iconBg="bg-purple-100 dark:bg-purple-900/20"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            <Card className="col-span-4 border-border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Biểu đồ doanh thu
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Tổng quan doanh thu theo từng tháng trong năm nay.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-0">
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.monthlyRevenue}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--border)"
                        opacity={0.4}
                      />

                      <XAxis
                        dataKey="name"
                        stroke={chartColors.stroke}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--muted-foreground)" }}
                      />
                      <YAxis
                        stroke={chartColors.stroke}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value / 1000000}M`}
                        tick={{ fill: "var(--muted-foreground)" }}
                      />
                      <Tooltip
                        cursor={{ fill: "var(--muted)", opacity: 0.2 }}
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          color: "var(--foreground)",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                        }}
                        // [FIX] Đã thay thế any bằng kiểu dữ liệu rõ ràng cho ESLint
                        formatter={(value: number | string | undefined) => [
                          formatPrice(Number(value || 0)),
                          "Doanh thu"
                        ]}
                        labelStyle={{ color: "var(--muted-foreground)" }}
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
                <CardTitle className="text-foreground">
                  Giao dịch gần đây
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Các đơn hàng mới nhất vừa được đặt.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {recentSalesData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Chưa có giao dịch nào gần đây.
                    </p>
                  ) : (
                    recentSalesData.map((sale) => {
                      const name = sale.customerName || "Khách hàng";
                      const amount = Number(sale.totalAmount || 0);

                      return (
                        <div
                          key={sale.id}
                          className="flex items-center group cursor-default"
                        >
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                name
                              )}&background=random`}
                              alt={name}
                            />
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              {name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none text-foreground group-hover:text-primary transition-colors">
                              {name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                               Mã đơn: #{sale.id}
                            </p>
                          </div>
                          <div className="ml-auto font-bold text-green-600 dark:text-green-400">
                            +{formatPrice(amount)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, subValue, icon, iconBg }: StatCardProps) {
  return (
    <Card className="border-border shadow-sm bg-card hover:shadow-md transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 ${iconBg} rounded-full`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {value}
        </div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center">
          {subValue}
        </p>
      </CardContent>
    </Card>
  );
}