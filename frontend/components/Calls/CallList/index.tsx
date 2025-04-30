import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import React, { useMemo, useCallback, useState } from "react";
import type { CallListProps } from "@/lib/props";
import { ScrollArea } from "@/components/ui/scroll-area";
import CallTableRow from "./CallTableRow";
import PaginationControls from "./PaginationControls";

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
                      <CallTableRow
                        key={call.id}
                        call={call}
                        idx={idx}
                        selectedCall={selectedCall}
                        selectedIds={selectedIds}
                        handleSelectRow={handleSelectRow}
                        handleCallSelected={handleCallSelected}
                        handleDelete={handleDelete}
                      />
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
        <PaginationControls
          pages={pages}
          currentPage={currentPage}
          totalPages={totalPages}
          handleSetCurrentPage={handleSetCurrentPage}
        />
      </div>
    </>
  );
};

export default CallList;
