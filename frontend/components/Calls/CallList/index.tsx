import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import React, { useMemo, useCallback, useState } from "react";
import { Play, Trash2 } from "lucide-react";
import type { CallListProps, CallRecordingItem } from "@/lib/props";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export const CallList: React.FC<CallListProps> = ({
  callRecordings,
  loading,
  error,
  selectedIds,
  currentPage,
  totalItems,
  itemsPerPage,
  onSelectRow,
  onSelectAll,
  onDelete,
  onMultiDelete,
  setCurrentPage,
  onCallSelected,
}) => {
  const [selectedCall, setSelectedCall] = useState(null);

  // Memoized pagination pages
  const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage]);
  const pages = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages]);

  // Memoized handlers
  const handleSelectRow = useCallback((id) => onSelectRow(id), [onSelectRow]);
  const handleSelectAll = useCallback(() => onSelectAll(), [onSelectAll]);
  const handleDelete = useCallback((call) => onDelete(call), [onDelete]);
  const handleMultiDelete = useCallback(() => onMultiDelete(), [onMultiDelete]);
  const handleSetCurrentPage = useCallback((page) => setCurrentPage(page), [setCurrentPage]);
  const handleCallSelected = useCallback((call) => {
    setSelectedCall(call);
    if (onCallSelected) onCallSelected(call);
  }, [onCallSelected]);

  // Memoized Table Row
  const CallTableRow: React.FC<{ call: CallRecordingItem; idx: number }> = React.memo(({ call, idx }) => (
    <TableRow
      key={call.id}
      className={`transition-all duration-200 cursor-pointer ${
        idx % 2 === 0
          ? "bg-white/80 dark:bg-background/60"
          : "bg-muted/40 dark:bg-muted/10"
      } hover:bg-blue-100/60 dark:hover:bg-blue-900/40 ${selectedCall && selectedCall.id === call.id ? 'ring-2 ring-blue-400' : ''}`}
    >
      <TableCell
        className="px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={selectedIds.includes(call.id)}
          onCheckedChange={() => handleSelectRow(call.id)}
          aria-label={`Select call ${call.invoice_number}`}
        />
      </TableCell>
      <TableCell className="font-medium px-4 py-3 flex items-center gap-2">
        <Avatar className="h-7 w-7">
          <AvatarFallback>
            {call.name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <span>{call.name}</span>
      </TableCell>
      <TableCell className="font-medium px-4 py-3">
        {call.invoice_number}
      </TableCell>
      <TableCell className="px-4 py-3">
        {call.created_at}
      </TableCell>
      <TableCell className="px-4 py-3">
        {call.duration}
      </TableCell>
      <TableCell className="text-center px-4 py-3">
        {call.status?.toUpperCase() === "SMS" ? (
          <Badge variant="secondary">CALLED</Badge>
        ) : null}
        <Badge
          variant={
            call.status === "completed" || call.status === "sms"
              ? "secondary"
              : call.status === "no-answer" || call.status === "failed" || call.status === "busy"
              ? "destructive"
              : "secondary"
          }
        >
          {call.status?.toUpperCase() === "SMS"
            ? "SMS Sent"
            : call.status?.toUpperCase() === "COMPLETED"
            ? "CALLED"
            : call.status?.toUpperCase()}
        </Badge>
      </TableCell>
      <TableCell className="flex justify-end px-4 py-3">
        <div className="flex gap-2">
          {call.audio_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCallSelected(call)}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(call);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  ));

  // Memoized Pagination Controls
  const PaginationControls = React.memo(() => (
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

  return (
    <>
      <a id="table-anchor" />
      <div className="p-0">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <div className="h-full min-h-0">
            <ScrollArea
              className="h-full min-h-0"
              style={{ scrollBehavior: "smooth" }}
            >
              <div className="overflow-x-auto rounded-xl shadow-sm">
                <Table className="min-w-full border-separate border-spacing-0">
                  <TableHeader className="sticky top-0 z-10 bg-white/80 backdrop-blur rounded-t-xl shadow-sm">
                    <TableRow>
                      <TableHead className="px-4 py-3">
                        <Checkbox
                          checked={
                            callRecordings.length === 0
                              ? false
                              : selectedIds.length === callRecordings.length
                              ? true
                              : selectedIds.length === 0
                              ? false
                              : "indeterminate"
                          }
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all calls"
                        />
                      </TableHead>
                      <TableHead className="px-4 py-3">Name</TableHead>
                      <TableHead className="px-4 py-3">Invoice Number</TableHead>
                      <TableHead className="px-4 py-3">Date & Time</TableHead>
                      <TableHead className="px-4 py-3">Duration</TableHead>
                      <TableHead className="px-4 py-3 text-center">Status</TableHead>
                      <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callRecordings?.map((call, idx) => (
                      <CallTableRow key={call.id} call={call} idx={idx} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        {selectedIds.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleMultiDelete}>
            Delete Selected
          </Button>
        )}
        <PaginationControls />
      </div>
    </>
  );
};

export default CallList;
