"use client"

import { CustomersToolbar } from "./customers-toolbar"
import CustomersTable from "./customers-table"
import { DeleteDialog } from "./delete-dialog"
import { Button } from "@/components/ui/button"
import { useCustomers } from "@/hooks/use-customers"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import React from "react"
import { useAtom } from "jotai"
import { invoiceTableAllColumns, invoiceTableSelectedColumnsAtom } from "@/lib/atom"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function CustomersList() {
  const {
    filters,
    selection,
    dialogs,
    actions,
    data,
  } = useCustomers()

  const [selectedColumns, setSelectedColumns] = useAtom(invoiceTableSelectedColumnsAtom);
  const allColumns = invoiceTableAllColumns;
  const handleSelectColumn = (columnKey: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const totalPages = Math.ceil(data.totalInvoices / data.pageSize);

  return (
    <div className="space-y-4">
      <DeleteDialog
        open={dialogs.showDeleteConfirm}
        selectedCount={selection.selectedInvoices.length}
        isDeleting={data.isDeleting}
        onOpenChange={dialogs.setShowDeleteConfirm}
        onDelete={actions.handleDeleteInvoices}
        onCancel={() => dialogs.setShowDeleteConfirm(false)}
      />

      <CustomersToolbar
        searchTerm={filters.searchTerm}
        statusFilter={filters.statusFilter}
        selectedCount={selection.selectedInvoices.length}
        isDeleting={data.isDeleting}
        isUploading={data.isUploading}
        isExporting={data.isExporting}
        onSearchChange={e => filters.setSearchTerm(e.target.value)}
        onStatusFilterChange={filters.setStatusFilter}
        onDeleteClick={() => dialogs.setShowDeleteConfirm(true)}
        onUpload={actions.handleUpload}
        onExport={actions.handleExport}
        allColumns={allColumns}
        selectedColumns={selectedColumns}
        onSelectColumn={handleSelectColumn}
      />

      <CustomersTable
        invoices={data.invoices}
        selectedInvoices={selection.selectedInvoices}
        isLoading={data.isLoading}
        onMarkCompleted={actions.requestMarkCompleted}
        onSelectInvoice={selection.handleSelectInvoice}
        onSelectAll={selection.handleSelectAll}
        onView={actions.navigateToInvoice}
        onDelete={actions.handleSingleInvoiceDelete}
        selectedColumns={selectedColumns}
        onSelectColumn={handleSelectColumn}
      />

      <AlertDialog open={dialogs.showCompleteConfirm} onOpenChange={dialogs.setShowCompleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Completed?</AlertDialogTitle>
          </AlertDialogHeader>
          <p>Are you sure you want to mark this invoice as completed?</p>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => dialogs.setShowCompleteConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={actions.confirmMarkCompleted} className="bg-green-600 hover:bg-green-700">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing <strong>{data.invoices?.length}</strong> of <strong>{data.totalInvoices}</strong> customers
          {selection.selectedInvoices.length > 0 && (
            <span className="ml-2">
              (<strong>{selection.selectedInvoices.length}</strong> selected)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2">
            Page <strong>{data.page}</strong> of <strong>{totalPages || 1}</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => data.setPage(data.page - 1)}
            disabled={data.page === 1 || data.isLoading}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => data.setPage(data.page + 1)}
            disabled={data.page === totalPages || totalPages === 0 || data.isLoading}
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
