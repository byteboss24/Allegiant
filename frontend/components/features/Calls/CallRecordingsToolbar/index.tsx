"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CallRecordingsToolbarProps {
  searchTerm?: string;
  statusFilter?: string;
  onSearchChange?: (query: string) => void;
  onFilterChange?: (filterValue: string) => void;
}

const CallRecordingsToolbar: React.FC<CallRecordingsToolbarProps> = ({
  searchTerm = "",
  statusFilter = "all",
  onSearchChange,
  onFilterChange,
}: CallRecordingsToolbarProps) => {
  return (
    <div className="flex items-center gap-3">
      <Input
        placeholder="Search recordings..."
        className="w-[250px] focus:ring-2 focus:ring-primary/40 transition-all"
        value={searchTerm}
        onChange={(e) => onSearchChange?.(e.target.value)}
      />
      <Select
        value={statusFilter}
        onValueChange={(value) => onFilterChange?.(value)}
      >
        <SelectTrigger className="w-[180px] h-9 bg-muted/40 border border-gray-200 rounded-lg">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Calls</SelectItem>
          <SelectItem value="no-answer">No Answer</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="sms_sent">SMS Sent</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="busy">Busy</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default CallRecordingsToolbar;