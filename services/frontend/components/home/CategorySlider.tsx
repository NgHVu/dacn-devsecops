"use client";

import React from "react";
import Link from "next/link";
import { 
  Utensils, 
  Coffee, 
  Pizza, 
  Soup, 
  Sandwich, 
  IceCream, 
  Beer,
  Flame,
  ChevronRight
} from "lucide-react";

// Dùng màu Orange/Red làm chủ đạo cho đồng bộ FoodHub
const categories = [
  { id: 1, name: "Tất cả", icon: Utensils, href: "/", color: "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-800 group-hover:text-white" },
  { id: 4, name: "Món Hot", icon: Flame, href: "/search?q=hot", color: "bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white" },
  { id: 2, name: "Cơm Tấm", icon: Utensils, href: "/search?q=com", color: "bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white" },
  { id: 3, name: "Bún Phở", icon: Soup, href: "/search?q=pho", color: "bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white" },
  { id: 5, name: "Đồ Uống", icon: Coffee, href: "/search?q=nuoc", color: "bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white" },
  { id: 6, name: "Pizza", icon: Pizza, href: "/search?q=pizza", color: "bg-yellow-100 text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white" },
  { id: 7, name: "Bánh Mì", icon: Sandwich, href: "/search?q=banhmi", color: "bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white" },
  { id: 8, name: "Tráng Miệng", icon: IceCream, href: "/search?q=kem", color: "bg-pink-100 text-pink-600 group-hover:bg-pink-500 group-hover:text-white" },
  { id: 9, name: "Đồ Nhậu", icon: Beer, href: "/search?q=bia", color: "bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white" },
];

export function CategorySlider() {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-6 px-1">
        <h3 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Danh mục món ăn
        </h3>
        <Link href="/menu" className="group flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">
          Xem tất cả 
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      
      {/* Container cuộn ngang với hiệu ứng snap */}
      <div className="flex space-x-4 overflow-x-auto pb-6 pt-2 scrollbar-hide snap-x -mx-4 px-4 md:mx-0 md:px-0">
        {categories.map((cat) => (
          <Link 
            key={cat.id} 
            href={cat.href}
            className="flex-shrink-0 snap-start group"
          >
            <div className="flex flex-col items-center gap-3 w-[100px] transition-all duration-300 hover:-translate-y-1">
               {/* Icon Container */}
               <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-sm border border-transparent group-hover:shadow-lg group-hover:shadow-orange-500/20 ${cat.color}`}>
                  <cat.icon className="w-9 h-9 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" />
               </div>
               
               {/* Label */}
               <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors text-center">
                 {cat.name}
               </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}