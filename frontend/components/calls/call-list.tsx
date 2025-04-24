import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import React from "react";
import { Play, Trash2 } from "lucide-react";
import type { CallListProps } from "@/lib/props";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink
} from "@/components/ui/pagination";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export const CallList: React.FC<CallListProps> = ({
  callRecordings,
  loading,
  error,
  selectedIds,
  selectedCall,
  currentPage,
  totalItems,
  itemsPerPage,
  onSelectCall,
  onSelectRow,
  onSelectAll,
  onDelete,
  onMultiDelete,
  setCurrentPage,
}) => {
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
            <ScrollArea className="h-full min-h-0" style={{ scrollBehavior: 'smooth' }}>
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
                          onCheckedChange={onSelectAll}
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
                      <TableRow
                        key={call.id}
                        className={`transition-all duration-200 cursor-pointer ${selectedCall?.id === call.id ? "bg-blue-50/60 dark:bg-blue-900/30" : idx % 2 === 0 ? "bg-white/80 dark:bg-background/60" : "bg-muted/40 dark:bg-muted/10"} hover:bg-blue-100/60 dark:hover:bg-blue-900/40`}
                        onClick={() => onSelectCall(call)}
                      >
                        <TableCell className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(call.id)}
                            onCheckedChange={() => onSelectRow(call.id)}
                            aria-label={`Select call ${call.invoice_number}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium px-4 py-3 flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback>{call.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                          </Avatar>
                          <span>{call.name}</span>
                        </TableCell>
                        <TableCell className="font-medium px-4 py-3">{call.invoice_number}</TableCell>
                        <TableCell className="px-4 py-3">{call.created_at}</TableCell>
                        <TableCell className="px-4 py-3">{call.duration}</TableCell>
                        <TableCell className="text-center px-4 py-3">
                          <Badge
                            variant={
                              call.status === "transferred"
                                ? "default"
                                : call.status === "sms"
                                ? "outline"
                                : (call.status === "no-answer" || call.status === "failed" || call.status === "busy")
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {call.status?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex justify-end px-4 py-3">
                          <div className="flex gap-2">
                            {call.audio_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  onSelectCall(call);
                                }}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                onDelete(call);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
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
          <Button
            variant="destructive"
            size="sm"
            onClick={onMultiDelete}
          >
            Delete Selected
          </Button>
        )}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                aria-disabled={currentPage === 1}
                tabIndex={currentPage === 1 ? -1 : 0}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }, (_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink
                  isActive={currentPage === i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  href="#"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(currentPage + 1)}
                aria-disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                tabIndex={currentPage >= Math.ceil(totalItems / itemsPerPage) ? -1 : 0}
                className={currentPage >= Math.ceil(totalItems / itemsPerPage) ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </>
  );
}; 