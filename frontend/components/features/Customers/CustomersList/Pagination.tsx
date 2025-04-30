import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  invoicesLength: number;
  totalInvoices: number;
  selectedInvoicesLength: number;
  isLoading: boolean;
  setPage: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = React.memo(({
  page,
  totalPages,
  invoicesLength,
  totalInvoices,
  selectedInvoicesLength,
  isLoading,
  setPage,
}) => (
  <div className="flex items-center justify-between mt-4">
    <div className="text-sm text-muted-foreground">
      Showing <strong>{invoicesLength}</strong> of <strong>{totalInvoices}</strong> customers
      {selectedInvoicesLength > 0 && (
        <span className="ml-2">
          (<strong>{selectedInvoicesLength}</strong> selected)
        </span>
      )}
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs px-2">
        Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong>
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage(page - 1)}
        disabled={page === 1 || isLoading}
      >
        <ChevronLeft className="w-4 h-4" /> Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages || totalPages === 0 || isLoading}
      >
        Next <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  </div>
));

export default Pagination;
