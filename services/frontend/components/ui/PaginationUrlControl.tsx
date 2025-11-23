"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PaginationControl } from "@/components/ui/PaginationControl";

interface PaginationUrlControlProps {
  currentPage: number; 
  totalPages: number;
}

export function PaginationUrlControl({ currentPage, totalPages }: PaginationUrlControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPageIndex: number) => {
    const params = new URLSearchParams(searchParams);
    
    const urlPage = newPageIndex + 1;
    
    params.set("page", urlPage.toString());
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <PaginationControl
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}