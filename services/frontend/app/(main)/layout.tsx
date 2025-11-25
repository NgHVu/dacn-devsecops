import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Class `min-h-screen flex flex-col` giúp đẩy Footer xuống đáy
    <div className="flex min-h-screen flex-col relative bg-background font-sans antialiased">
      
      {/* --- GLOBAL AMBIENT BACKGROUND (WARM THEME) --- */}
      {/* Sử dụng màu Cam/Vàng (Amber/Orange) để kích thích vị giác */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden isolate">
         {/* 1. Đốm sáng Cam bên trái */}
         <div className="absolute -top-40 -left-20 w-[600px] h-[600px] bg-orange-500/20 dark:bg-orange-500/10 rounded-full blur-[128px] opacity-80" />
         
         {/* 2. Đốm sáng Vàng/Đỏ bên phải */}
         <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] bg-amber-500/20 dark:bg-amber-500/10 rounded-full blur-[128px] opacity-80" />
         
         {/* 3. LỚP PHỦ NOISE (NHIỄU HẠT) - PRO EFFECT */}
         {/* Sử dụng SVG filter để tạo noise nhẹ, giúp nền có chiều sâu hơn thay vì phẳng lì */}
         <div 
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] mix-blend-overlay"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}
         />
         
         {/* 4. Lớp làm mờ tổng thể nhẹ để hòa trộn các đốm sáng */}
         <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px]" />
      </div>

      <Navbar />
      
      {/* Main chiếm hết khoảng trống còn lại -> Đẩy Footer xuống */}
      {/* pt-16 để bù cho Navbar fixed height */}
      <main className="flex-1 pt-16 relative z-10 animate-in fade-in duration-500"> 
        {children}
      </main>

      <Footer />
    </div>
  );
}