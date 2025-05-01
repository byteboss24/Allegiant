import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import React from "react";

interface CallHistoryTableProps {
  callRecordings: any[];
  loading: boolean;
  error: string | null;
}

const CallHistoryTable: React.FC<CallHistoryTableProps> = ({
  callRecordings,
  loading,
  error,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl shadow-sm">
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Spinner />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : (
        <Table className="min-w-full border-separate border-spacing-0">
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-3">Name</TableHead>
              <TableHead className="px-4 py-3">Invoice Number</TableHead>
              <TableHead className="px-4 py-3">Date & Time</TableHead>
              <TableHead className="px-4 py-3">Duration</TableHead>
              <TableHead className="px-4 py-3 text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {callRecordings?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  No call history found.
                </TableCell>
              </TableRow>
            ) : (
              callRecordings.map((call) => (
                <TableRow key={call.id}>
                  <TableCell className="font-medium px-4 py-3">
                    {call.name || `${call.first_name || ""} ${call.last_name || ""}`}
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
                    <Badge
                      variant={
                        call.status === "completed" || call.status === "sms_sent"
                          ? "secondary"
                          : call.status === "no-answer" ||
                            call.status === "failed" ||
                            call.status === "busy"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {call.status?.toUpperCase() === "SMS_SENT"
                        ? "SMS Sent"
                        : call.status?.toUpperCase() === "COMPLETED"
                        ? "CALLED"
                        : call.status?.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}; 

export default CallHistoryTable;
