"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { isAxiosError } from "axios"; 
import { 
  User, 
  Lock, 
  MapPin, 
  Camera, 
  Loader2, 
  Save, 
  ShieldCheck,
  Mail, 
  Phone
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/userService";
import { FadeIn } from "@/components/animations/FadeIn";

const profileSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  email: z.string().email().readonly(), 
  phoneNumber: z.string().regex(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ").optional().or(z.literal("")),
  address: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
  confirmPassword: z.string().min(8, "Vui lòng xác nhận mật khẩu"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      address: user?.address || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onUpdateProfile = async (values: z.infer<typeof profileSchema>) => {
    setIsLoading(true);
    try {
      await userService.updateProfile({
        name: values.name,
        phoneNumber: values.phoneNumber,
        address: values.address,
      });
      await refreshProfile(); 
      toast.success("Cập nhật hồ sơ thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const onChangePassword = async (values: z.infer<typeof passwordSchema>) => {
    setIsLoading(true);
    try {
      await userService.changePassword({
        oldPassword: values.currentPassword,      
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword   
      });
      toast.success("Đổi mật khẩu thành công!");
      passwordForm.reset();
    } catch (error) { 
      console.error(error);
      let msg = "Đổi mật khẩu thất bại.";
      
      if (isAxiosError(error) && error.response?.data?.message) {
        msg = error.response.data.message;
      }
      
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
    if (fileInput) fileInput.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        toast.error("File ảnh quá lớn (tối đa 5MB)");
        return;
    }

    try {
        const toastId = toast.loading("Đang tải ảnh lên...");
        await userService.uploadAvatar(file);
        await refreshProfile();
        toast.dismiss(toastId);
        toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (error) {
        console.error(error);
        toast.error("Lỗi khi upload ảnh.");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 animate-in fade-in duration-500">
      <div className="h-48 bg-gradient-to-r from-orange-500 to-red-600 w-full relative">
         <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="container max-w-5xl mx-auto px-4 -mt-24 relative z-10">
        <FadeIn>
            <div className="flex flex-col md:flex-row gap-8 items-start">
                
                <div className="w-full md:w-1/3 space-y-6">
                    <Card className="border-border/60 shadow-lg overflow-hidden">
                        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
                            <div className="relative mb-4 group cursor-pointer" onClick={handleAvatarClick}>
                                <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                                    <AvatarImage src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random&size=256`} />
                                    <AvatarFallback className="text-4xl bg-orange-100 text-orange-600 font-bold">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="text-white h-8 w-8" />
                                </div>
                                <input 
                                    type="file" 
                                    id="avatar-upload" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleFileChange}
                                />
                            </div>
                            
                            <h2 className="text-2xl font-bold text-foreground">{user?.name}</h2>
                            <p className="text-muted-foreground text-sm mb-4">{user?.email}</p>
                            
                            <div className="flex gap-2">
                                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                                    {user?.role === "ROLE_ADMIN" ? "Quản trị viên" : "Thành viên thân thiết"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="w-full md:w-2/3">
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="w-full grid grid-cols-2 mb-6 bg-muted/50 p-1 rounded-xl">
                            <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm font-medium">
                                <User className="w-4 h-4 mr-2" /> Thông tin chung
                            </TabsTrigger>
                            <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm font-medium">
                                <Lock className="w-4 h-4 mr-2" /> Bảo mật
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="general">
                            <Card className="border-border/60 shadow-md">
                                <CardHeader>
                                    <CardTitle>Thông tin cá nhân</CardTitle>
                                    <CardDescription>Cập nhật thông tin để chúng tôi phục vụ bạn tốt hơn.</CardDescription>
                                </CardHeader>
                                <Separator />
                                <CardContent className="pt-6">
                                    <Form {...profileForm}>
                                        <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-5">
                                            <FormField
                                                control={profileForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Họ và Tên</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                <Input placeholder="Nhập tên của bạn" {...field} className="pl-10" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <FormField
                                                    control={profileForm.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Email (Không thể sửa)</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                    <Input {...field} disabled className="pl-10 bg-muted/50" />
                                                                </div>
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={profileForm.control}
                                                    name="phoneNumber"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Số điện thoại</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                    <Input placeholder="0912..." {...field} className="pl-10" />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={profileForm.control}
                                                name="address"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Địa chỉ giao hàng mặc định</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                <Input placeholder="Số nhà, đường, phường/xã..." {...field} className="pl-10" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="flex justify-end pt-4">
                                                <Button type="submit" className="bg-orange-600 hover:bg-orange-500 shadow-md shadow-orange-600/20" disabled={isLoading}>
                                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                    Lưu thay đổi
                                                </Button>
                                            </div>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security">
                            <Card className="border-border/60 shadow-md">
                                <CardHeader>
                                    <CardTitle>Đổi mật khẩu</CardTitle>
                                    <CardDescription>Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác.</CardDescription>
                                </CardHeader>
                                <Separator />
                                <CardContent className="pt-6">
                                    <Form {...passwordForm}>
                                        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-5">
                                            <FormField
                                                control={passwordForm.control}
                                                name="currentPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Mật khẩu hiện tại</FormLabel>
                                                        <FormControl>
                                                            <PasswordInput placeholder="Nhập mật khẩu hiện tại" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={passwordForm.control}
                                                name="newPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Mật khẩu mới</FormLabel>
                                                        <FormControl>
                                                            <PasswordInput placeholder="Nhập mật khẩu mới" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={passwordForm.control}
                                                name="confirmPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                                                        <FormControl>
                                                            <PasswordInput placeholder="Nhập lại mật khẩu mới" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="flex justify-end pt-4">
                                                <Button type="submit" variant="destructive" disabled={isLoading} className="shadow-md shadow-red-600/20">
                                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                                    Cập nhật mật khẩu
                                                </Button>
                                            </div>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </FadeIn>
      </div>
    </div>
  );
}