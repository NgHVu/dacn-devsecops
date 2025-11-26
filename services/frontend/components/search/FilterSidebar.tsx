"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider"; // Đã có file này
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Utensils, Coffee, Pizza, Soup, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";

// Danh mục giả lập
const CATEGORIES = [
  { id: "rice", name: "Cơm", icon: Utensils },
  { id: "noodle", name: "Phở / Bún", icon: Soup },
  { id: "drink", name: "Đồ Uống", icon: Coffee },
  { id: "fastfood", name: "Đồ Ăn Nhanh", icon: Pizza },
];

export function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // FIX LỖI ESLINT: Khởi tạo state trực tiếp từ URL params (Lazy Initialization)
  // Thay vì đợi useEffect, ta lấy giá trị ngay lần render đầu tiên
  const [priceRange, setPriceRange] = useState(() => {
    const min = searchParams.get("minPrice");
    const max = searchParams.get("maxPrice");
    return [
        min ? Number(min) : 0, 
        max ? Number(max) : 500000
    ];
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
      return searchParams.get("categoryId");
  });

  // Effect này chỉ dùng để đồng bộ KHI URL THAY ĐỔI TỪ BÊN NGOÀI (ví dụ bấm nút Back trình duyệt)
  useEffect(() => {
    const cat = searchParams.get("categoryId");
    const min = searchParams.get("minPrice");
    const max = searchParams.get("maxPrice");

    // Chỉ set lại nếu giá trị thực sự khác state hiện tại để tránh render loop
    if (cat !== selectedCategory) {
        setSelectedCategory(cat);
    }
    
    const newMin = min ? Number(min) : 0;
    const newMax = max ? Number(max) : 500000;
    
    if (newMin !== priceRange[0] || newMax !== priceRange[1]) {
        setPriceRange([newMin, newMax]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); 

  const handleApplyFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (selectedCategory) params.set("categoryId", selectedCategory);
    else params.delete("categoryId");

    params.set("minPrice", priceRange[0].toString());
    params.set("maxPrice", priceRange[1].toString());
    
    // Reset về trang 1 khi lọc
    params.set("page", "1");

    router.push(`/search?${params.toString()}`);
  };

  const handleReset = () => {
    setSelectedCategory(null);
    setPriceRange([0, 500000]);
    router.push("/search"); // Xóa sạch params
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Bộ lọc</h3>
        {(selectedCategory || priceRange[0] > 0 || priceRange[1] < 500000) && (
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
                className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
                <X className="mr-1 h-3 w-3" /> Xóa lọc
            </Button>
        )}
      </div>

      {/* 1. Danh mục */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Danh mục</h4>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                selectedCategory === cat.id
                  ? "bg-orange-50 text-orange-700 font-medium"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`p-1.5 rounded-md ${selectedCategory === cat.id ? "bg-white shadow-sm" : "bg-muted"}`}>
                 <cat.icon className="h-4 w-4" />
              </div>
              <span>{cat.name}</span>
              {selectedCategory === cat.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* 2. Khoảng giá */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Khoảng giá</h4>
            <Badge variant="outline" className="font-normal">
                {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
            </Badge>
        </div>
        
        <Slider
          value={priceRange} // Controlled component
          max={500000}
          step={10000}
          minStepsBetweenThumbs={1}
          onValueChange={setPriceRange}
          className="py-4"
        />
      </div>

      {/* Apply Button */}
      <Button onClick={handleApplyFilter} className="w-full bg-orange-600 hover:bg-orange-500">
        Áp dụng bộ lọc
      </Button>
    </div>
  );
}