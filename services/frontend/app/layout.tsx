import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/theme-provider"; // <-- 1. IMPORT THEME PROVIDER

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FoodApp Đồ Án",
  description: "Dự án DevSecOps Microservice",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> 
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col`}
      >
        {/* === 2. BỌC MỌI THỨ TRONG THEME PROVIDER === */}
        <ThemeProvider
            attribute="class"
            defaultTheme="system" // Mặc định theo hệ điều hành
            enableSystem
            disableTransitionOnChange
        >
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          {/* (Footer... ) */}
        </ThemeProvider>
      </body>
    </html>
  );
}