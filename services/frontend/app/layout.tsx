import type { Metadata } from "next";
// [FIX] Đổi từ Geist sang Be_Vietnam_Pro
import { Be_Vietnam_Pro } from "next/font/google"; 
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"; 
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "@/components/ui/sonner"; 

// [FIX] Cấu hình font Be Vietnam Pro
const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"], // Quan trọng: Thêm vietnamese để dấu hiển thị đẹp
  weight: ["300", "400", "500", "600", "700", "800"], // Load các độ đậm cần thiết
  display: "swap",
});

export const metadata: Metadata = {
  title: "FoodHub - Đặt món ăn", 
  description: "Dự án DevSecOps Microservice - Hệ thống đặt món trực tuyến",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className="scroll-smooth"> 
      <body
        // [FIX] Áp dụng font mới vào body
        className={`${beVietnamPro.className} antialiased min-h-screen bg-background font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </AuthProvider>
          
          <Toaster richColors position="bottom-right" closeButton />

        </ThemeProvider>
      </body>
    </html>
  );
}