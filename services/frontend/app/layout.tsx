import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/theme-provider"; 
import { AuthProvider } from "@/context/AuthContext"; // <-- 1. IMPORT AUTH PROVIDER

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
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          {/* 2. BỌC AUTH PROVIDER QUANH APP */}
          <AuthProvider>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
          </AuthProvider>
          
        </ThemeProvider>
      </body>
    </html>
  );
}