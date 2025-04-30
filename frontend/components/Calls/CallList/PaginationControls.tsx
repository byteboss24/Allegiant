import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";

interface PaginationControlsProps {
  pages: number[];
  currentPage: number;
  totalPages: number;
  handleSetCurrentPage: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = React.memo(({ pages, currentPage, totalPages, handleSetCurrentPage }) => (
  <Pagination>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious
          onClick={() => handleSetCurrentPage(Math.max(1, currentPage - 1))}
          aria-disabled={currentPage === 1}
          tabIndex={currentPage === 1 ? -1 : 0}
          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
      {pages.map((page) => (
        <PaginationItem key={page}>
          <PaginationLink
            isActive={currentPage === page}
            onClick={() => handleSetCurrentPage(page)}
            href="#"
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      ))}
      <PaginationItem>
        <PaginationNext
          onClick={() => handleSetCurrentPage(Math.min(totalPages, currentPage + 1))}
          aria-disabled={currentPage >= totalPages}
          tabIndex={currentPage >= totalPages ? -1 : 0}
          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
));

export default PaginationControls;
