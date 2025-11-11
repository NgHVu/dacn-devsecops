"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes"; // <-- DÒNG ĐÃ SỬA

/**
 * Component này bọc "next-themes" để cung cấp
 * Chế độ Tối/Sáng (Dark/Light Mode) cho toàn bộ ứng dụng.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}