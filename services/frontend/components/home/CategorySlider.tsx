"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Category } from "@/types/product";
import { getIconComponent } from "@/config/iconMapping";
import { cn } from "@/lib/utils"; 

interface CategorySliderProps {
  categories: Category[];
}

const colorCycle = [
  "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-800 group-hover:text-white",
  "bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white",
  "bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
  "bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white",
  "bg-yellow-100 text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white",
  "bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white",
  "bg-pink-100 text-pink-600 group-hover:bg-pink-500 group-hover:text-white",
  "bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
  "bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
];

export function CategorySlider({ categories = [] }: CategorySliderProps) {
  const searchParams = useSearchParams();
  const currentCategoryId = searchParams.get("categoryId");
  const currentSort = searchParams.get("sort");

  const allCategories = [
    { id: -1, name: "Tất cả", icon: "Utensils", description: "" }, 
    { id: -2, name: "Món Hot", icon: "Flame", description: "Best Seller" }, 
    ...categories
  ];

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
      
      <div className="flex space-x-4 overflow-x-auto pb-6 pt-2 scrollbar-hide snap-x -mx-4 px-4 md:mx-0 md:px-0">
        {allCategories.map((cat, index) => {
          const IconComponent = getIconComponent(cat.icon);
          const colorClass = colorCycle[index % colorCycle.length];
          
          let href = "/";
          let isActive = false;

          if (cat.id === -1) {
             href = "/";
             isActive = !currentCategoryId && !currentSort; 
          } else if (cat.id === -2) {
             href = "/?sort=rating_desc";
             isActive = currentSort === "rating_desc";
          } else {
             href = `/?categoryId=${cat.id}#products`; 
             isActive = currentCategoryId === String(cat.id);
          }

          return (
            <Link 
              key={cat.id} 
              href={href}
              className="flex-shrink-0 snap-start group"
              scroll={false} 
            >
              <div className="flex flex-col items-center gap-3 w-[100px] transition-all duration-300 hover:-translate-y-1">
                 <div className={cn(
                    `w-20 h-20 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-sm border border-transparent group-hover:shadow-lg group-hover:shadow-orange-500/20`,
                    colorClass,
                    isActive && "ring-4 ring-orange-500/30 scale-110 shadow-xl"
                 )}>
                    <IconComponent className={cn(
                        "w-9 h-9 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                        isActive && "scale-125"
                    )} />
                 </div>
                 
                 <span className={cn(
                    "text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors text-center line-clamp-1 px-1",
                    isActive && "text-orange-600 font-extrabold"
                 )}>
                   {cat.name}
                 </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}