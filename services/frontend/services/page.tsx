"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { orderService } from "@/services/orderService";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
    ShoppingCart, 
    Loader2, 
    ArrowRight, 
    ShieldCheck, 
    Store, 
    Banknote, 
    QrCode, 
    Zap, 
    User,
    Phone,
    MapPin,
    FileText
} from "lucide-react";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { formatPrice } from "@/lib/utils";
import { CartItemSkeleton } from "@/components/skeletons/CartItemSkeleton";
import { FadeIn } from "@/components/animations/FadeIn";

// --- FORM HANDLING ---
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// --- TYPES ---
interface CartItemExtended {
    id: number;
    uniqueKey: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    totalPrice: number;
    selectedSize?: { name: string; price: number };
    selectedToppings?: { name: string; price: number }[];
    note?: string;
}

// Zod Schema
const checkoutSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  phone: z.string().min(10, "Số điện thoại không hợp lệ").regex(/^[0-9]+$/, "Chỉ được nhập số"),
  address: z.string().min(5, "Địa chỉ quá ngắn"),
  note: z.string().optional(),
  paymentMethod: z.enum(["COD", "VNPAY"]),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// Payload chuẩn
interface OrderPayload {
    customerName: string;
    phoneNumber: string;
    shippingAddress: string;
    note?: string;
    paymentMethod: string;
    items: {
        productId: number;
        quantity: number;
        note?: string; 
    }[];
}

export default function CartPage() {
  const { items: rawItems, totalItems, totalPrice, clearCart } = useCart();
  const items = rawItems as unknown as CartItemExtended[];

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      note: "",
      paymentMethod: "COD",
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleQuickFill = () => {
    if (!isAuthenticated || !user) {
        toast.error("Bạn chưa đăng nhập", { description: "Vui lòng đăng nhập để sử dụng tính năng này." });
        return;
    }
    form.setValue("name", user.name || "");
    form.setValue("phone", user.phoneNumber || "");
    form.setValue("address", user.address || "");
    toast.success("Đã điền thông tin từ hồ sơ", { 
        icon: <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />,
        description: "Kiểm tra lại thông tin trước khi đặt hàng nhé!"
    });
  };

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập", { description: "Bạn cần đăng nhập để tiến hành thanh toán." });
      router.push("/login?redirect=/cart");
      return;
    }

    setIsCheckoutLoading(true);

    const orderData: OrderPayload = {
      customerName: values.name,
      phoneNumber: values.phone,
      shippingAddress: values.address,
      note: values.note,
      paymentMethod: values.paymentMethod,
      items: items.map((item) => {
        let itemNote = "";
        const details = [];
        if (item.selectedSize) details.push(`Size: ${item.selectedSize.name}`);
        if (item.selectedToppings && item.selectedToppings.length > 0) {
            details.push(`Topping: ${item.selectedToppings.map(t => t.name).join(", ")}`);
        }
        if (details.length > 0) itemNote += details.join(" | ");
        if (item.note) itemNote += (itemNote ? " | Ghi chú: " : "") + item.note;

        return {
            productId: item.id,
            quantity: item.quantity,
            note: itemNote 
        };
      }),
    };

    try {
      await orderService.createOrder(orderData);
      clearCart();
      toast.success("Đặt hàng thành công!", { description: "Đang chuyển hướng đến trang đơn hàng..." });
      
      if (values.paymentMethod !== 'COD') {
          setTimeout(() => router.push("/orders?status=paid"), 1000);
      } else {
          setTimeout(() => router.push("/orders"), 1000);
      }
      
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 400) {
          toast.error("Lỗi đặt hàng", { description: err.response.data?.message });
      } else {
          console.error(err);
          toast.error("Đã có lỗi xảy ra", { description: "Vui lòng thử lại sau giây lát." });
      }
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  if (isPageLoading || isAuthLoading) {
    return (
      <div className="container py-12 max-w-6xl mx-auto px-4">
        <div className="h-10 w-48 bg-muted animate-pulse rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
              {[1,2,3].map(i => <CartItemSkeleton key={i} />)}
          </div>
          <div className="lg:col-span-1"><div className="h-80 bg-muted animate-pulse rounded-xl" /></div>
        </div>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
        <div className="container max-w-6xl mx-auto flex flex-col items-center justify-center py-32 min-h-[80vh] animate-in fade-in duration-500">
            <div className="relative mb-8">
                <div className="absolute -inset-4 bg-orange-500/20 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="bg-card p-8 rounded-full border border-border shadow-xl relative">
                    <ShoppingCart className="h-20 w-20 text-muted-foreground/50" />
                </div>
            </div>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Giỏ hàng của bạn đang trống</h2>
            <p className="mt-4 text-muted-foreground text-center max-w-md text-lg">
                Có vẻ như bạn chưa chọn món nào. Hãy dạo một vòng thực đơn và chọn cho mình vài món ngon nhé!
            </p>
            <Button asChild className="mt-10 rounded-full bg-orange-600 hover:bg-orange-500 text-white px-10 h-14 text-lg font-bold shadow-xl shadow-orange-600/25 hover:scale-105 transition-transform" size="lg">
                <Link href="/"><Store className="mr-2 h-5 w-5" /> Xem thực đơn ngay</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto py-10 px-4 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-border/60">
          <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Giỏ hàng</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                  Bạn đang có <span className="font-bold text-orange-600">{totalItems}</span> món trong giỏ
              </p>
          </div>
          <Button variant="ghost" asChild className="hidden md:flex text-orange-600 hover:text-orange-700 hover:bg-orange-50">
              <Link href="/">Tiếp tục mua hàng <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* --- LEFT: ITEMS LIST --- */}
          <div className="lg:col-span-2 space-y-6">
              <FadeIn>
                <div className="bg-card rounded-[1.5rem] border border-border/60 shadow-sm overflow-hidden px-6 py-2 divide-y divide-border/40">
                    {items.map((item) => (
                        // @ts-expect-error: Tạm thời bỏ qua lỗi prop type
                        <CartItemRow key={item.uniqueKey} item={item} />
                    ))}
                </div>
                
                <Button variant="outline" asChild className="w-full mt-6 md:hidden border-orange-200 text-orange-700">
                    <Link href="/">Tiếp tục mua hàng</Link>
                </Button>
              </FadeIn>
          </div>

          {/* --- RIGHT: CHECKOUT FORM --- */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
                <FadeIn delay={0.2}>
                    <Card className="border border-border/60 shadow-xl shadow-orange-500/5 bg-card overflow-hidden rounded-2xl">
                        <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold">Thông tin giao hàng</CardTitle>
                                {isAuthenticated && (
                                    <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={handleQuickFill} 
                                            type="button"
                                            className="text-xs h-8 gap-1.5 border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 hover:text-orange-800 transition-colors shadow-sm"
                                    >
                                            <Zap className="h-3.5 w-3.5 fill-orange-700" />
                                            Điền nhanh
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-6 pt-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tên người nhận</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input placeholder="Họ và tên..." {...field} className="pl-10" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Số điện thoại</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input placeholder="09..." {...field} className="pl-10" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* SỬA ĐỔI: Chuyển Input thành Textarea cho địa chỉ */}
                                        <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Địa chỉ nhận hàng</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                            <Textarea 
                                                                placeholder="Số nhà, đường, phường..." 
                                                                {...field} 
                                                                className="pl-10 min-h-[80px] py-3 resize-y break-all" 
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* SỬA ĐỔI: Thêm class break-all cho ghi chú */}
                                        <FormField
                                            control={form.control}
                                            name="note"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Ghi chú đơn hàng</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                            <Textarea 
                                                                placeholder="Lời nhắn cho shipper (Ví dụ: Giao giờ hành chính)..." 
                                                                className="resize-none h-24 pl-10 pt-2.5 break-all whitespace-pre-wrap" 
                                                                {...field} 
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Separator className="border-dashed border-border" />

                                    {/* SỬA ĐỔI: Cấu trúc lại Radio Group dùng Label để fix lỗi click */}
                                    <FormField
                                        control={form.control}
                                        name="paymentMethod"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel className="text-base font-bold">Phương thức thanh toán</FormLabel>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        className="grid grid-cols-1 gap-3"
                                                    >
                                                        <FormItem className="space-y-0">
                                                            <FormControl>
                                                                <Label
                                                                    htmlFor="r-cod"
                                                                    className={`flex items-center space-x-3 border p-3 rounded-xl cursor-pointer transition-all ${
                                                                        field.value === 'COD' 
                                                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-sm' 
                                                                        : 'hover:bg-muted/50'
                                                                    }`}
                                                                >
                                                                    <RadioGroupItem value="COD" id="r-cod" />
                                                                    <div className="flex-1 flex items-center gap-3 font-medium text-sm">
                                                                        <Banknote className="h-4 w-4 text-green-600" /> Thanh toán khi nhận hàng (COD)
                                                                    </div>
                                                                </Label>
                                                            </FormControl>
                                                        </FormItem>

                                                        <FormItem className="space-y-0">
                                                            <FormControl>
                                                                <Label
                                                                    htmlFor="r-vnpay"
                                                                    className={`flex items-center space-x-3 border p-3 rounded-xl cursor-pointer transition-all ${
                                                                        field.value === 'VNPAY' 
                                                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-sm' 
                                                                        : 'hover:bg-muted/50'
                                                                    }`}
                                                                >
                                                                    <RadioGroupItem value="VNPAY" id="r-vnpay" />
                                                                    <div className="flex-1 flex items-center gap-3 font-medium text-sm">
                                                                        <QrCode className="h-4 w-4 text-blue-600" /> Ví VNPAY / QR Code
                                                                    </div>
                                                                </Label>
                                                            </FormControl>
                                                        </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    
                                    <Separator className="border-dashed border-border" />
                                    
                                    <div className="flex justify-between items-end">
                                        <span className="text-lg font-bold text-foreground">Tổng cộng</span>
                                        <div className="text-right">
                                            <span className="text-2xl font-extrabold text-orange-600 block leading-none">{formatPrice(totalPrice)}</span>
                                            <span className="text-[10px] text-muted-foreground mt-1 block">(Đã bao gồm VAT)</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 pt-2">
                                        <Button 
                                            type="submit"
                                            size="lg" 
                                            className="w-full h-14 text-lg font-bold shadow-lg shadow-orange-600/20 bg-orange-600 hover:bg-orange-500 hover:scale-[1.02] transition-all"
                                            disabled={isCheckoutLoading}
                                        >
                                            {isCheckoutLoading ? (
                                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang xử lý...</>
                                            ) : (
                                                <>Thanh toán ngay <ArrowRight className="ml-2 h-5 w-5" /></>
                                            )}
                                        </Button>
                                        
                                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground opacity-80">
                                            <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                                            <span>Thông tin được bảo mật tuyệt đối 100%</span>
                                        </div>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </FadeIn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}