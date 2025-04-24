"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// TODO: Implement search and filter logic
interface CallRecordingsToolbarProps {
  onSearchChange?: (query: string) => void;
  onFilterChange?: (filterValue: string) => void;
}

export function CallRecordingsToolbar({
  onSearchChange,
  onFilterChange,
}: CallRecordingsToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      <Input
        placeholder="Search recordings..."
        className="w-[250px] focus:ring-2 focus:ring-primary/40 transition-all"
        onChange={(e) => onSearchChange?.(e.target.value)}
      />
      <Select
        defaultValue="all"
        onValueChange={(value) => onFilterChange?.(value)}
      >
        <SelectTrigger className="w-[180px] h-9 bg-muted/40 border border-gray-200 rounded-lg">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Calls</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="transferred">Transferred</SelectItem>
          <SelectItem value="sms">SMS Sent</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
