"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react"; 
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20 border-t border-gray-800">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">FoodApp</h3>
            <p className="text-sm text-gray-400">
              Mang đến hương vị tuyệt vời nhất từ những nguyên liệu tươi ngon nhất. Giao hàng nhanh chóng, phục vụ tận tâm.
            </p>
            <div className="flex space-x-4 pt-2">
              <Link href="#" className="hover:text-primary transition-colors">
                <FaFacebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <FaInstagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <FaTwitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Khám phá</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Trang chủ</Link></li>
              <li><Link href="/search?q=hot" className="hover:text-white transition-colors">Món bán chạy</Link></li>
              <li><Link href="/search?q=new" className="hover:text-white transition-colors">Món mới</Link></li>
              <li><Link href="/orders" className="hover:text-white transition-colors">Kiểm tra đơn hàng</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Trung tâm trợ giúp</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Chính sách bảo mật</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Trường Đại học Công Nghệ Thông Tin (UIT) Khu phố 34, Phường Linh Xuân, Thành phố Hồ Chí Minh.</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <span>0337 767 352</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <span>support@foodapp.com</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      <div className="border-t border-gray-800 bg-gray-950">
        <div className="container py-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} FoodApp DevSecOps. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}