"use client";

import React from "react";
import Link from "next/link";
import { Utensils, Coffee, Pizza, Soup, Sandwich, IceCream, Beer } from "lucide-react";

const categories = [
  { id: 1, name: "Tất cả", icon: Utensils, href: "/" },
  { id: 2, name: "Cơm", icon: Utensils, href: "/search?q=com" },
  { id: 3, name: "Bún Phở", icon: Soup, href: "/search?q=pho" },
  { id: 4, name: "Đồ Uống", icon: Coffee, href: "/search?q=nuoc" },
  { id: 5, name: "Pizza", icon: Pizza, href: "/search?q=pizza" },
  { id: 6, name: "Bánh Mì", icon: Sandwich, href: "/search?q=banhmi" },
  { id: 7, name: "Tráng Miệng", icon: IceCream, href: "/search?q=kem" },
  { id: 8, name: "Đồ Nhậu", icon: Beer, href: "/search?q=bia" },
];

export function CategorySlider() {
  return (
    <div className="py-8">
      <h3 className="text-xl font-bold mb-6 px-1">Danh mục món ăn</h3>
      
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {categories.map((cat) => (
          <Link 
            key={cat.id} 
            href={cat.href}
            className="flex flex-col items-center min-w-[80px] group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm group-hover:border-primary group-hover:shadow-md transition-all duration-300">
              <cat.icon className="w-7 h-7 text-gray-600 group-hover:text-primary transition-colors" />
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700 group-hover:text-primary text-center">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}