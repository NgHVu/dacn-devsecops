import Image from "next/image";
import Link from "next/link";

// Ảnh nền chất lượng cao, chủ đề ẩm thực, tối màu một chút để nổi bật text
const AUTH_BG_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    // Container chính: Grid 2 cột
    <div className="relative min-h-screen w-full lg:grid lg:grid-cols-2">
      
      {/* ================= CỘT TRÁI: FIXED BRANDING ================= */}
      {/* UPDATE QUAN TRỌNG: Thêm 'sticky top-0 h-screen overflow-hidden' 
          -> Cột này sẽ luôn đứng yên full màn hình, không bị cuộn theo nội dung bên phải.
          -> Slogan sẽ luôn nằm gọn gàng ở đáy màn hình. */}
      <div className="hidden sticky top-0 h-screen flex-col justify-between bg-zinc-900 p-10 text-white lg:flex overflow-hidden">
        
        {/* Lớp phủ tối (Overlay) */}
        <div className="absolute inset-0 bg-black/50 z-[1]" />
        
        {/* Background Image */}
        <Image
          src={AUTH_BG_IMAGE}
          alt="FoodHub Background Feast"
          fill
          className="absolute inset-0 h-full w-full object-cover z-[0]"
          priority 
        />

        {/* Logo & Tên ứng dụng */}
        <Link href="/" className="relative z-[2] flex items-center gap-2 font-medium transition-opacity hover:opacity-90 w-fit">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-white"
            >
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" x2="6" y1="1" y2="8" />
              <line x1="10" x2="10" y1="1" y2="8" />
              <line x1="14" x2="14" y1="1" y2="8" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight">FoodHub</span>
        </Link>

        {/* Quote / Slogan */}
        <div className="relative z-[2] mt-auto max-w-md">
          <blockquote className="space-y-3">
            <p className="text-xl font-medium leading-relaxed">
              Kết nối đam mê ẩm thực. Hàng ngàn món ngon đang chờ bạn khám phá tại FoodHub.
            </p>
            <footer className="text-base font-semibold text-orange-400">
              Đội ngũ FoodHub
            </footer>
          </blockquote>
        </div>
      </div>

      {/* ================= CỘT PHẢI: FORM CONTENT ================= */}
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative">
        {/* Nút Về trang chủ */}
        <Link 
            href="/" 
            className="absolute right-4 top-4 text-sm font-medium text-muted-foreground hover:text-primary md:hidden"
        >
            Trang chủ
        </Link>

        {/* Form Container */}
        <div className="w-full max-w-[420px] space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}