"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// TODO: Implement search and filter logic
interface CallRecordingsToolbarProps {
  onSearchChange?: (query: string) => void; // Optional: Callback for search input
  onFilterChange?: (filterValue: string) => void; // Optional: Callback for filter change
}

export function CallRecordingsToolbar({ onSearchChange, onFilterChange }: CallRecordingsToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Call Recordings</h2>
        <p className="text-muted-foreground">Listen to and analyze your AI voice call recordings.</p>
      </div>
      <div className="flex items-center gap-2">
        <Input 
          placeholder="Search recordings..." 
          className="w-[250px]" 
          onChange={(e) => onSearchChange?.(e.target.value)} // Pass value to handler if provided
         />
        <Select defaultValue="all" onValueChange={(value) => onFilterChange?.(value)}>
          <SelectTrigger className="w-[180px] h-9">
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
    </div>
  );
} 