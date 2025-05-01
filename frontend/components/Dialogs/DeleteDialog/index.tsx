import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DeleteDialogProps } from "@/lib/props";
import React from "react";

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  selectedCount,
  onOpenChange,
  onDelete,
  onCancel,
  resourceType,
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
        <AlertDialogDescription>
          {selectedCount > 1
            ? `You are about to delete ${selectedCount} ${resourceType}s. This action cannot be undone.`
            : `You are about to delete this ${resourceType}. This action cannot be undone.`}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
        <AlertDialogAction 
          onClick={onDelete}
          className="bg-red-600 hover:bg-red-700"
        >
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
); 

export default DeleteDialog;