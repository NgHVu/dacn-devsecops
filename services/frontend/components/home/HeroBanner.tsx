"use client";

import React, { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const banners = [
  {
    id: 1,
    title: "Đại Tiệc Mùa Hè",
    description: "Giảm giá 50% cho tất cả các loại trà sữa và kem.",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=1000&auto=format&fit=crop", // Ảnh mẫu
    cta: "Đặt Ngay",
    link: "/search?q=tra+sua",
    color: "bg-orange-50",
  },
  {
    id: 2,
    title: "Bún Bò Huế Chuẩn Vị",
    description: "Hương vị đậm đà, thịt bò tươi ngon, nước dùng hầm xương 24h.",
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=1000&auto=format&fit=crop",
    cta: "Thử Ngay",
    link: "/products/1",
    color: "bg-red-50",
  },
  {
    id: 3,
    title: "Combo Cơm Văn Phòng",
    description: "Chỉ từ 35k. Miễn phí giao hàng cho đơn từ 3 món.",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1000&auto=format&fit=crop",
    cta: "Xem Menu",
    link: "/search?category=com",
    color: "bg-green-50",
  },
];

export function HeroBanner() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

  return (
    <div className="overflow-hidden rounded-2xl shadow-sm border" ref={emblaRef}>
      <div className="flex">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className={`relative flex-[0_0_100%] min-w-0 ${banner.color}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-8 md:p-12 lg:p-16">
              <div className="space-y-6 z-10">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
                  {banner.title}
                </h2>
                <p className="text-lg md:text-xl text-gray-600 max-w-md">
                  {banner.description}
                </p>
                <Button size="lg" className="rounded-full px-8 text-lg" asChild>
                  <Link href={banner.link}>
                    {banner.cta} <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              <div className="relative h-64 md:h-96 w-full rounded-xl overflow-hidden shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}