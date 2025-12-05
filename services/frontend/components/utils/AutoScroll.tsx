"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function AutoScrollLogic() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Kiểm tra xem URL có chứa tham số phân trang hoặc lọc không
    const hasParams = 
      searchParams.has("page") || 
      searchParams.has("categoryId") || 
      searchParams.has("sort") || 
      searchParams.has("search");

    if (hasParams) {
      // Tìm phần tử có id="products" (đã đặt ở trang chủ)
      const element = document.getElementById("products");
      
      if (element) {
        // Tính toán vị trí cuộn: Vị trí phần tử - Chiều cao Header (khoảng 100px) - Padding thêm
        const headerOffset = 120; 
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        // Thực hiện cuộn mượt mà
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }
  }, [searchParams]); // Chạy lại mỗi khi params thay đổi

  return null;
}

export function AutoScroll() {
  return (
    <Suspense fallback={null}>
      <AutoScrollLogic />
    </Suspense>
  );
}