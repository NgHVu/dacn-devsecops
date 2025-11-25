"use client";

import React from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade"; // Cần cài thêm: npm install embla-carousel-fade
import { Button } from "@/components/ui/button";
import { ArrowRight, Utensils } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const banners = [
  {
    id: 1,
    title: "Đại Tiệc Mùa Hè",
    description: "Giảm giá 50% cho tất cả các loại trà sữa và kem mát lạnh.",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=2000&auto=format&fit=crop",
    cta: "Đặt Ngay",
    link: "/search?q=tra+sua",
    color: "from-orange-500/80 to-red-500/80",
  },
  {
    id: 2,
    title: "Hương Vị Việt Nam",
    description: "Phở bò, Bún chả, Bánh mì - Tinh hoa ẩm thực đường phố.",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000&auto=format&fit=crop",
    cta: "Khám Phá",
    link: "/search?category=vietnam",
    color: "from-green-600/80 to-emerald-600/80",
  },
  {
    id: 3,
    title: "Pizza Nóng Hổi",
    description: "Mua 1 tặng 1 vào thứ 3 hàng tuần. Giao hàng trong 30 phút.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2000&auto=format&fit=crop",
    cta: "Xem Menu",
    link: "/search?category=pizza",
    color: "from-blue-600/80 to-indigo-600/80",
  },
];

export function HeroBanner() {
  // Thêm Fade effect để chuyển cảnh mượt hơn
  const [emblaRef] = useEmblaCarousel({ loop: true, duration: 30 }, [
    Autoplay({ delay: 6000, stopOnInteraction: false }),
  ]);

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-xl mx-auto" ref={emblaRef}>
      <div className="flex touch-pan-y">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="relative flex-[0_0_100%] min-w-0 h-[400px] md:h-[500px]"
          >
            {/* Background Image */}
            <Image
              src={banner.image}
              alt={banner.title}
              fill
              className="object-cover"
              priority
            />
            
            {/* Gradient Overlay - Giúp chữ nổi bật */}
            <div className={`absolute inset-0 bg-gradient-to-r ${banner.color} mix-blend-multiply`} />
            <div className="absolute inset-0 bg-black/20" />

            {/* Content */}
            <div className="absolute inset-0 flex items-center p-8 md:p-16 lg:p-24">
              <div className="max-w-2xl space-y-6 text-white animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-md">
                  <Utensils className="mr-2 h-4 w-4" />
                  Ưu đãi hôm nay
                </div>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                  {banner.title}
                </h2>
                <p className="text-lg md:text-xl text-white/90 max-w-md leading-relaxed">
                  {banner.description}
                </p>
                <div className="flex gap-4 pt-2">
                  <Button size="lg" className="rounded-full bg-white text-black hover:bg-white/90 px-8 h-12 text-base font-semibold shadow-lg" asChild>
                    <Link href={banner.link}>
                      {banner.cta} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}