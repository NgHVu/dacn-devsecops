"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationControlProps {
  currentPage: number; 
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControl({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlProps) {
  const [inputPage, setInputPage] = useState<string>((currentPage + 1).toString());

  useEffect(() => {
    setInputPage((currentPage + 1).toString());
  }, [currentPage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value);
  };

  const handleJumpToPage = () => {
    const pageNumber = parseInt(inputPage);

    if (isNaN(pageNumber)) {
      setInputPage((currentPage + 1).toString());
      return;
    }

    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber - 1);
    } else {
      setInputPage((currentPage + 1).toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleJumpToPage();
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 py-4">
      <div className="mr-2 text-sm font-medium text-muted-foreground hidden sm:block">
        Trang {currentPage + 1} trên {totalPages}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 hidden sm:flex"
        onClick={() => onPageChange(0)}
        disabled={currentPage === 0}
        title="Trang đầu"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        title="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground sm:hidden">Trang</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={inputPage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleJumpToPage} 
          className="h-8 w-12 rounded-md border border-input bg-background px-2 text-center text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="text-sm text-muted-foreground">/ {totalPages}</span>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        title="Trang sau"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 hidden sm:flex"
        onClick={() => onPageChange(totalPages - 1)}
        disabled={currentPage >= totalPages - 1}
        title="Trang cuối"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}