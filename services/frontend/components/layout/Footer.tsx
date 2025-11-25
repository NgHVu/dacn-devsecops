"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, UtensilsCrossed, ArrowRight } from "lucide-react"; 
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-300 relative z-50 pt-16 pb-8 overflow-hidden">
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-10 relative z-10">
        
        {/* TOP SECTION: BRAND & NEWSLETTER */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-16">
           <div className="lg:col-span-2 space-y-6">
                <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white hover:opacity-90 transition-opacity w-fit">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-900/20">
                        <UtensilsCrossed className="h-5 w-5 text-white" />
                    </div>
                    FoodHub
                </Link>
                <p className="text-zinc-400 leading-relaxed max-w-sm">
                    Khám phá hàng ngàn món ăn ngon từ những nhà hàng tốt nhất quanh bạn. Đặt hàng dễ dàng, giao hàng thần tốc, ưu đãi ngập tràn.
                </p>
                <div className="flex gap-3">
                    {[FaFacebook, FaInstagram, FaTwitter, FaYoutube].map((Icon, i) => (
                        <Link key={i} href="#" className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-all duration-300 group">
                            <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </Link>
                    ))}
                </div>
           </div>

           <div className="lg:col-span-3 bg-zinc-900/50 rounded-2xl p-6 md:p-8 border border-white/5 flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-xl font-bold text-white">Nhận ưu đãi độc quyền</h3>
                    <p className="text-sm text-zinc-400">Đăng ký để nhận mã giảm giá 20% cho đơn hàng đầu tiên.</p>
                </div>
                <div className="flex w-full md:w-auto gap-2">
                    <Input 
                        placeholder="Email của bạn..." 
                        className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 min-w-[200px] focus-visible:ring-orange-500/50" 
                    />
                    <Button className="bg-orange-600 hover:bg-orange-500 text-white font-semibold shrink-0">
                        Đăng ký
                    </Button>
                </div>
           </div>
        </div>

        <Separator className="bg-white/10 mb-12" />

        {/* MIDDLE SECTION: LINKS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
                <h4 className="font-bold text-white mb-6">Về chúng tôi</h4>
                <ul className="space-y-4 text-sm text-zinc-400">
                    <li><Link href="#" className="hover:text-orange-500 transition-colors">Giới thiệu</Link></li>
                    <li><Link href="#" className="hover:text-orange-500 transition-colors">Blog ẩm thực</Link></li>
                    <li><Link href="#" className="hover:text-orange-500 transition-colors">Cơ hội nghề nghiệp</Link></li>
                    <li><Link href="#" className="hover:text-orange-500 transition-colors">Đối tác nhà hàng</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-white mb-6">Hỗ trợ</h4>
                <ul className="space-y-4 text-sm text-zinc-400">
                    <li><Link href="#" className="hover:text-orange-500 transition-colors">Trung tâm trợ giúp</Link></li>
                    <li><Link href="#" className="hover:text-orange-500 transition-colors">Câu hỏi thường gặp</Link></li>
                    <li><Link href="#" className="hover:text-orange-500 transition-colors">Chính sách bảo mật</Link></li>
                    <li><Link href="#" className="hover:text-orange-500 transition-colors">Điều khoản dịch vụ</Link></li>
                </ul>
            </div>
            <div className="col-span-2 md:col-span-2">
                <h4 className="font-bold text-white mb-6">Liên hệ</h4>
                <ul className="space-y-4 text-sm text-zinc-400">
                    <li className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                        <span>Trường ĐH Công Nghệ Thông Tin (UIT), Khu phố 6, P.Linh Trung, Tp.Thủ Đức, Tp.Hồ Chí Minh.</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-orange-600 shrink-0" />
                        <span className="font-medium text-white">0337 767 352</span>
                        <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">24/7 Support</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-orange-600 shrink-0" />
                        <span className="hover:text-white cursor-pointer transition-colors">support@foodhub.com</span>
                    </li>
                </ul>
            </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
           <p>&copy; {new Date().getFullYear()} FoodHub DevSecOps. All rights reserved.</p>
           <div className="flex gap-6">
               <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
               <Link href="#" className="hover:text-white transition-colors">Terms</Link>
               <Link href="#" className="hover:text-white transition-colors">Sitemap</Link>
           </div>
        </div>
      </div>
    </footer>
  );
}