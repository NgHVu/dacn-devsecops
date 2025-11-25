import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"; 
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "@/components/ui/sonner"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // ĐÃ SỬA: Đổi tên tab trình duyệt thành FoodHub
  title: "FoodHub - Đặt món ăn", 
  description: "Dự án DevSecOps Microservice - Hệ thống đặt món trực tuyến",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Thêm scroll-smooth để cuộn trang mượt mà hơn
    <html lang="vi" suppressHydrationWarning className="scroll-smooth"> 
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans`}
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
          
          {/* ĐÃ SỬA: Chuyển xuống góc phải dưới (bottom-right) */}
          <Toaster richColors position="bottom-right" closeButton />

        </ThemeProvider>
      </body>
    </html>
  );
}