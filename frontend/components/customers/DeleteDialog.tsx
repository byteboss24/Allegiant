import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DeleteDialogProps } from "@/lib/props";
import React from "react";

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  onOpenChange,
  selectedCount,
  onDelete,
  isDeleting,
  onCancel,
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
        <AlertDialogDescription>
          {selectedCount > 1
            ? `You are about to delete ${selectedCount} invoices. This action cannot be undone.`
            : "You are about to delete this invoice. This action cannot be undone."}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
        <AlertDialogAction 
          onClick={onDelete}
          className="bg-red-600 hover:bg-red-700"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
); 