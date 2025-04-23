import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TableRowActionsProps } from "@/lib/props";
import { MoreHorizontal } from "lucide-react";
import React from "react";

export const TableRowActions: React.FC<TableRowActionsProps> = ({
  onView,
  onMarkCompleted,
  onDelete,
  disableMarkCompleted,
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Open menu</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem onClick={onView}>View details</DropdownMenuItem>
      <DropdownMenuItem 
        onClick={onMarkCompleted}
        disabled={disableMarkCompleted}
      >
        {disableMarkCompleted ? 'Already completed' : 'Mark as completed'}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem 
        onClick={onDelete}
        className="text-red-600"
      >
        Delete invoice
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
); 