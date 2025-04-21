"use client";

import { Button } from "@/components/ui/button";
import type { InvoicePaginationProps } from "@/lib/props";

export function InvoicePagination({
  currentPage,
  totalPages,
  setCurrentPage,
}: InvoicePaginationProps) {

  if (totalPages <= 1) {
    return null;
  }

  return (
     <div className="flex items-center justify-between space-x-2 py-4">
      <Button
        variant="outline"
        onClick={() => setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
      <Button
        variant="outline"
        onClick={() => setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
} 