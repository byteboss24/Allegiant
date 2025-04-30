import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { CallRecordingItem } from "@/lib/datatypes";
import React from "react";

interface CallTableRowProps {
  call: CallRecordingItem;
  idx: number;
  selectedCall: CallRecordingItem | null;
  selectedIds: string[];
  handleSelectRow: (id: string) => void;
  handleCallSelected: (call: CallRecordingItem) => void;
  handleDelete: (call: CallRecordingItem) => void;
}

const CallTableRow: React.FC<CallTableRowProps> = React.memo(({ call, idx, selectedCall, selectedIds, handleSelectRow, handleCallSelected, handleDelete }) => (
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

export default CallTableRow;
