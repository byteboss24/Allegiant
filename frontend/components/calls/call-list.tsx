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
      <div className="p-0">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
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
                <TableHead>Invoice Number</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {callRecordings?.map((call) => (
                <TableRow
                  key={call.id}
                  className={selectedCall?.id === call.id ? "bg-muted/50" : ""}
                  onClick={() => onSelectCall(call)}
                >
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(call.id)}
                      onCheckedChange={() => onSelectRow(call.id)}
                      aria-label={`Select call ${call.invoice_number}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{call.invoice_number}</TableCell>
                  <TableCell>{call.created_at}</TableCell>
                  <TableCell>{call.duration}</TableCell>
                  <TableCell className="text-right">
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
                  <TableCell className="flex justify-end">
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